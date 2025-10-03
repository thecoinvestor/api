const catchAsync = require('../utils/catchAsync');
const uploadFileToCloudinary = require('../utils/cloudinary.js');
const auth = require('../config/auth.js');
const { ObjectId } = require('mongodb');
const { profileService } = require('../services/index.js');
const { Payment } = require('../models/index.js');

const uploadFile = catchAsync(async (req, res) => {
  const { fileType, identityType } = req.body;

  if (!fileType || !['identityProof', 'photo'].includes(fileType)) {
    return res.status(400).json({
      success: false,
      message: 'fileType must be either "identityProof" or "photo"',
    });
  }

  if (fileType === 'identityProof' && (!identityType || !['aadhar', 'pan'].includes(identityType))) {
    return res.status(400).json({
      success: false,
      message: 'identityType must be either "aadhar" or "pan" when uploading identity proof',
    });
  }

  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: 'No file uploaded',
    });
  }

  const cloudinaryResult = await uploadFileToCloudinary(req.file.path);
  const userId = req.user.id;

  if (fileType === 'identityProof') {
    await profileService.updateIdentityProof(userId, identityType, cloudinaryResult.secure_url, 'pending');
  } else if (fileType === 'photo') {
    await profileService.updatePhoto(userId, cloudinaryResult.secure_url, 'pending');
  }

  const kycStatus = await profileService.getKycStatus(userId);

  const redirectUrl = kycStatus.completed ? 'dashboard' : 'upload';

  await auth.db.collection('user').updateOne(
    { _id: new ObjectId(userId) },
    {
      $set: { redirectUrl, isAdmin: false },
      $currentDate: { updatedAt: true },
    },
  );

  res.status(200).json({
    success: true,
    message: `${fileType} uploaded successfully`,
    url: cloudinaryResult.secure_url,
    fileType,
    identityType: identityType || null,
    status: 'pending',
    redirectUrl,
    bothFilesUploaded: kycStatus.completed,
    kycStatus,
  });
});

const Buy = catchAsync(async (req, res) => {
  const { amount, paymentMethod } = req.body;

  // Validation
  if (!amount || amount < 100) {
    return res.status(400).json({
      success: false,
      message: 'Amount must be at least 100 coins',
    });
  }

  if (!paymentMethod || !['qr', 'upi', 'bank'].includes(paymentMethod)) {
    return res.status(400).json({
      success: false,
      message: 'Payment method must be qr, upi, or bank',
    });
  }

  const userId = req.user.id;

  try {
    let proofOfPayment = null;

    // If file is uploaded, upload to cloudinary
    if (req.file) {
      const cloudinaryResult = await uploadFileToCloudinary(req.file.path);
      proofOfPayment = cloudinaryResult.secure_url;
    }

    const request = await profileService.addRequest(userId, 'purchase', amount, paymentMethod, proofOfPayment);

    res.status(200).json({
      success: true,
      message: 'Purchase request submitted successfully',
      request: {
        id: request._id,
        type: request.type,
        amount: request.amount,
        paymentMode: request.paymentMode,
        status: request.status,
        date: request.date,
        proofOfPayment,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

const Withdraw = catchAsync(async (req, res) => {
  const { amount } = req.body;

  // Validation
  if (!amount || amount < 100) {
    return res.status(400).json({
      success: false,
      message: 'Minimum withdrawal amount is ₹100',
    });
  }

  const userId = req.user.id; // from authMiddleware

  try {
    // Check user's current balance
    const profile = await profileService.getProfile(userId);

    if (profile.balance < amount) {
      return res.status(400).json({
        success: false,
        message: 'Insufficient balance for withdrawal',
      });
    }

    // Add withdrawal request
    const request = await profileService.addRequest(
      userId,
      'withdrawal',
      amount,
      'bank_transfer', // or get payment method from request
      null, // no proof needed for withdrawal
    );

    res.status(200).json({
      success: true,
      message: 'Withdrawal request submitted successfully',
      request: {
        id: request._id,
        type: request.type,
        amount: request.amount,
        status: request.status,
        date: request.date,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

const getDashboardData = catchAsync(async (req, res) => {
  const userId = req.user.id;
  const user = req.user;
  try {
    // Get user profile
    const profile = await profileService.getProfile(userId);

    // Get investment data
    const investments = await profileService.getInvestmentData(userId);

    // Get KYC status
    const kycStatus = await profileService.getKycStatus(userId);

    // Calculate next maturity (shortest time remaining)
    let nextMaturityDays = null;
    if (investments.length > 0) {
      const activePending = investments.filter((inv) => inv.status === 'pending' && inv.daysLeft > 0);
      if (activePending.length > 0) {
        nextMaturityDays = Math.min(...activePending.map((inv) => inv.daysLeft));
      }
    }

    const dashboardData = {
      userProfile: {
        name: user.name || 'User',
        email: user.email || '',
        phone: user.phoneNumber || '',
        emailVerified: user.emailVerified ? 'verified' : 'not-verified',
        documentsVerified: kycStatus.verified ? 'verified' : kycStatus.completed ? 'pending' : 'not-verified',
        totalCoins: profile.balance,
        totalValue: profile.balance,
        coinvestorId: profile.coinvestorId,
      },
      investments: investments,
      stats: {
        activeInvestments: investments.filter((inv) => inv.status === 'pending').length,
        nextMaturityDays: nextMaturityDays,
        totalCurrentValue: investments.reduce((sum, inv) => sum + inv.currentValue, 0),
      },
    };

    res.status(200).json({
      success: true,
      data: dashboardData,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

const getPaymentMethods = catchAsync(async (req, res) => {
  try {
    // Get only active payment methods for users
    const paymentMethods = await Payment.find({ isActive: true }).sort({ createdAt: -1 });

    // Format for frontend consumption
    const formattedMethods = paymentMethods.map((method) => ({
      id: method._id,
      type: method.type,
      title: method.title,
      details: method.details || {}, // Just use the object directly since it's already Object type
      qrCodeUrl: method.qrCodeUrl || null,
      isActive: method.isActive,
    }));

    res.status(200).json({
      success: true,
      data: formattedMethods,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

module.exports = {
  uploadFile,
  Buy,
  Withdraw,
  getDashboardData,
  getPaymentMethods,
};
