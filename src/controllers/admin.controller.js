const catchAsync = require('../utils/catchAsync');
const { adminService } = require('../services/index.js');
const { Payment } = require('../models/index.js');

// Users Management
const getAllUsers = catchAsync(async (req, res) => {
  const { search, page = 1, limit = 10, status } = req.query;

  const users = await adminService.getAllUsers({
    search,
    page: parseInt(page),
    limit: parseInt(limit),
    status,
  });

  res.status(200).json({
    success: true,
    data: users,
  });
});

const updateUserStatus = catchAsync(async (req, res) => {
  const { userId } = req.params;
  const { status } = req.body;

  if (!['active', 'suspended', 'pending'].includes(status)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid status. Must be active, suspended, or pending',
    });
  }

  const updatedUser = await adminService.updateUserStatus(userId, status);

  res.status(200).json({
    success: true,
    message: `User status updated to ${status}`,
    data: updatedUser,
  });
});

// Document Verification
const getPendingDocuments = catchAsync(async (req, res) => {
  const { search, page = 1, limit = 10 } = req.query;

  const pendingDocs = await adminService.getPendingDocuments({
    search,
    page: parseInt(page),
    limit: parseInt(limit),
  });

  res.status(200).json({
    success: true,
    data: pendingDocs,
  });
});

const verifyDocuments = catchAsync(async (req, res) => {
  const { userId } = req.params;

  const result = await adminService.verifyUserDocuments(userId);

  res.status(200).json({
    success: true,
    message: 'Documents verified successfully',
    data: result,
  });
});

const rejectDocuments = catchAsync(async (req, res) => {
  const { userId } = req.params;
  const { reason } = req.body;

  const result = await adminService.rejectUserDocuments(userId, reason);

  res.status(200).json({
    success: true,
    message: 'Documents rejected',
    data: result,
  });
});

const getVerifiedDocuments = catchAsync(async (req, res) => {
  const { search, page = 1, limit = 10 } = req.query;

  const verifiedDocs = await adminService.getVerifiedDocuments({
    search,
    page: parseInt(page),
    limit: parseInt(limit),
  });

  res.status(200).json({
    success: true,
    data: verifiedDocs,
  });
});

// Buy Requests Management
const getBuyRequests = catchAsync(async (req, res) => {
  const { search, page = 1, limit = 10, status = 'pending', sort = 'newest' } = req.query;

  const requests = await adminService.getBuyRequests({
    search,
    page: parseInt(page),
    limit: parseInt(limit),
    status,
    sort,
  });

  res.status(200).json({
    success: true,
    data: requests,
  });
});

const approveBuyRequest = catchAsync(async (req, res) => {
  const { requestId } = req.params;

  const result = await adminService.approveBuyRequest(requestId);

  res.status(200).json({
    success: true,
    message: 'Buy request approved and coins added to user account',
    data: result,
  });
});

const rejectBuyRequest = catchAsync(async (req, res) => {
  const { requestId } = req.params;
  const { reason } = req.body;

  const result = await adminService.rejectBuyRequest(requestId, reason);

  res.status(200).json({
    success: true,
    message: 'Buy request rejected',
    data: result,
  });
});

// Withdrawal Requests Management
const getWithdrawRequests = catchAsync(async (req, res) => {
  const { search, page = 1, limit = 10, status = 'pending', sort = 'newest' } = req.query;

  const requests = await adminService.getWithdrawRequests({
    search,
    page: parseInt(page),
    limit: parseInt(limit),
    status,
    sort,
  });

  res.status(200).json({
    success: true,
    data: requests,
  });
});

const approveWithdrawRequest = catchAsync(async (req, res) => {
  const { requestId } = req.params;

  const result = await adminService.approveWithdrawRequest(requestId);

  res.status(200).json({
    success: true,
    message: 'Withdrawal request approved and amount deducted from user account',
    data: result,
  });
});

const rejectWithdrawRequest = catchAsync(async (req, res) => {
  const { requestId } = req.params;
  const { reason } = req.body;

  const result = await adminService.rejectWithdrawRequest(requestId, reason);

  res.status(200).json({
    success: true,
    message: 'Withdrawal request rejected',
    data: result,
  });
});

// Payment Methods Management
const getPaymentMethods = catchAsync(async (req, res) => {
  try {
    // Get only active payment methods for users
    const paymentMethods = await Payment.find({ isActive: true }).sort({ createdAt: -1 });

    // Format for frontend consumption
    const formattedMethods = paymentMethods.map((method) => ({
      id: method._id,
      type: method.type,
      title: method.title,
      details: method.details, // No conversion needed if using Object type
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

const updatePaymentMethod = catchAsync(async (req, res) => {
  const { methodId } = req.params;
  let updateData = req.body;

  // Handle QR code upload if file is provided
  if (req.file && req.body.type === 'qr') {
    const uploadFileToCloudinary = require('../utils/cloudinary.js');
    const cloudinaryResult = await uploadFileToCloudinary(req.file.path);
    updateData.qrCodeUrl = cloudinaryResult.secure_url;
  }

  const updatedMethod = await adminService.updatePaymentMethod(methodId, updateData);

  res.status(200).json({
    success: true,
    message: 'Payment method updated successfully',
    data: updatedMethod,
  });
});

const createPaymentMethod = catchAsync(async (req, res) => {
  let methodData = req.body;

  // Handle QR code upload if file is provided
  if (req.file && req.body.type === 'qr') {
    const uploadFileToCloudinary = require('../utils/cloudinary.js');
    const cloudinaryResult = await uploadFileToCloudinary(req.file.path);
    methodData.qrCodeUrl = cloudinaryResult.secure_url;
  }

  const newMethod = await adminService.createPaymentMethod(methodData);

  res.status(201).json({
    success: true,
    message: 'Payment method created successfully',
    data: newMethod,
  });
});

const deletePaymentMethod = catchAsync(async (req, res) => {
  const { methodId } = req.params;

  await adminService.deletePaymentMethod(methodId);

  res.status(200).json({
    success: true,
    message: 'Payment method deleted successfully',
  });
});

module.exports = {
  getAllUsers,
  updateUserStatus,
  getPendingDocuments,
  getVerifiedDocuments,
  verifyDocuments,
  rejectDocuments,
  getBuyRequests,
  approveBuyRequest,
  rejectBuyRequest,
  getWithdrawRequests,
  approveWithdrawRequest,
  rejectWithdrawRequest,
  getPaymentMethods,
  updatePaymentMethod,
  createPaymentMethod,
  deletePaymentMethod,
};
