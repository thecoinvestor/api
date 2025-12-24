const { Profile, Payment } = require('../models');
const mongoose = require('mongoose');
const auth = require('../config/auth.js');

// Use mongoose ObjectId for Mongoose operations
const ObjectId = mongoose.Types.ObjectId;

// Helper to create ObjectId for auth.db (native MongoDB) queries
const toMongoObjectId = (id) => {
  return new mongoose.mongo.ObjectId(id);
};

// Users Management
const getAllUsers = async (filters = {}) => {
  try {
    const { search, page = 1, limit = 10, status } = filters;

    // Build user query - only show users with verified email
    let userQuery = { emailVerified: true };
    if (status) {
      userQuery.status = status;
    }
    if (search) {
      userQuery.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phoneNumber: { $regex: search, $options: 'i' } },
      ];
    }

    // Get users from auth database
    const users = await auth.db
      .collection('user')
      .find(userQuery)
      .skip((page - 1) * limit)
      .limit(limit)
      .sort({ createdAt: -1 })
      .toArray();

    // Get profiles for these users
    const userIds = users.map((user) => user._id.toString());
    const profiles = await Profile.find({ userId: { $in: userIds } });

    // Create a map for quick lookup
    const profileMap = {};
    profiles.forEach((profile) => {
      profileMap[profile.userId] = profile;
    });

    // Combine user and profile data
    const combinedData = users.map((user) => {
      const profile = profileMap[user._id.toString()] || {};
      const kycStatus = getKycStatusFromProfile(profile);

      // Get recent transactions (last 10, sorted by date)
      const recentTransactions = (profile.requests || [])
        .map((req) => ({
          id: req._id?.toString(),
          type: req.type,
          amount: req.amount,
          status: req.status,
          date: req.submissionDate,
          approvalDate: req.approvalDate,
          paymentMode: req.paymentMode,
          note: req.note,
        }))
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .slice(0, 10);

      return {
        id: user._id.toString(),
        name: user.name || 'N/A',
        coinvestorId: profile.coinvestorId || 'Not assigned',
        email: user.email || 'N/A',
        phone: user.phoneNumber || 'N/A',
        ipAddress: user.ipAddress || 'N/A',
        documentsStatus: kycStatus.verified ? 'verified' : kycStatus.completed ? 'pending' : 'not-verified',
        registrationDate: user.createdAt || new Date(),
        totalCoins: profile.balance || 0,
        totalValue: profile.balance || 0,
        status: user.status || 'active',
        recentTransactions,
      };
    });

    const total = await auth.db.collection('user').countDocuments(userQuery);

    return {
      users: combinedData,
      pagination: {
        current: page,
        total: Math.ceil(total / limit),
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1,
      },
    };
  } catch (error) {
    throw new Error(`Failed to get users: ${error.message}`);
  }
};

const updateUserStatus = async (userId, status) => {
  try {
    const result = await auth.db.collection('user').updateOne(
      { _id: toMongoObjectId(userId) },
      {
        $set: { status },
        $currentDate: { updatedAt: true },
      },
    );

    if (result.matchedCount === 0) {
      throw new Error('User not found');
    }

    return { userId, status };
  } catch (error) {
    throw new Error(`Failed to update user status: ${error.message}`);
  }
};

// Document Management
const getPendingDocuments = async (filters = {}) => {
  try {
    const { search, page = 1, limit = 10 } = filters;

    // First, get users with verified email
    const verifiedEmailUsers = await auth.db.collection('user').find({ emailVerified: true }).toArray();

    const verifiedEmailUserIds = verifiedEmailUsers.map((user) => user._id.toString());

    // Find profiles with pending documents only for email-verified users
    let profileQuery = {
      userId: { $in: verifiedEmailUserIds },
      $or: [{ 'identityProof.status': 'pending' }, { 'photo.status': 'pending' }],
    };

    const profiles = await Profile.find(profileQuery)
      .skip((page - 1) * limit)
      .limit(limit)
      .sort({ 'identityProof.updatedAt': -1, 'photo.updatedAt': -1 });

    // Create user map for quick lookup
    const userMap = {};
    verifiedEmailUsers.forEach((user) => {
      userMap[user._id.toString()] = user;
    });

    // Filter by search if provided
    let combinedData = profiles.map((profile) => {
      const user = userMap[profile.userId] || {};
      return {
        id: profile.userId,
        name: user.name || 'N/A',
        coinvestorId: profile.coinvestorId || 'Not assigned',
        email: user.email || 'N/A',
        phone: user.phoneNumber || 'N/A',
        documentsStatus: 'pending',
        identityProof: profile.identityProof || null,
        photo: profile.photo || null,
        registrationDate: user.createdAt || new Date(),
      };
    });

    if (search) {
      combinedData = combinedData.filter(
        (item) =>
          item.name.toLowerCase().includes(search.toLowerCase()) ||
          item.coinvestorId.includes(search) ||
          item.phone.includes(search),
      );
    }

    return {
      documents: combinedData,
      total: combinedData.length,
    };
  } catch (error) {
    throw new Error(`Failed to get pending documents: ${error.message}`);
  }
};

const verifyUserDocuments = async (userId) => {
  try {
    const profile = await Profile.findOne({ userId });
    if (!profile) {
      throw new Error('Profile not found');
    }

    // Update document statuses to verified
    const updateFields = {};
    if (profile.identityProof && profile.identityProof.url) {
      updateFields['identityProof.status'] = 'verified';
    }
    if (profile.photo && profile.photo.url) {
      updateFields['photo.status'] = 'verified';
    }

    await Profile.updateOne({ userId }, { $set: updateFields });

    return { userId, status: 'verified' };
  } catch (error) {
    throw new Error(`Failed to verify documents: ${error.message}`);
  }
};

const rejectUserDocuments = async (userId, reason) => {
  try {
    const profile = await Profile.findOne({ userId });
    if (!profile) {
      throw new Error('Profile not found');
    }

    // Update document statuses to rejected
    const updateFields = {};
    if (profile.identityProof && profile.identityProof.url) {
      updateFields['identityProof.status'] = 'rejected';
    }
    if (profile.photo && profile.photo.url) {
      updateFields['photo.status'] = 'rejected';
    }

    await Profile.updateOne({ userId }, { $set: updateFields });

    return { userId, status: 'rejected', reason };
  } catch (error) {
    throw new Error(`Failed to reject documents: ${error.message}`);
  }
};

const getVerifiedDocuments = async (filters = {}) => {
  try {
    const { search, page = 1, limit = 10 } = filters;

    // First, get users with verified email
    const verifiedEmailUsers = await auth.db.collection('user').find({ emailVerified: true }).toArray();

    const verifiedEmailUserIds = verifiedEmailUsers.map((user) => user._id.toString());

    // Find profiles with verified documents only for email-verified users
    let profileQuery = {
      userId: { $in: verifiedEmailUserIds },
      $and: [{ 'identityProof.status': 'verified' }, { 'photo.status': 'verified' }],
    };

    const profiles = await Profile.find(profileQuery)
      .skip((page - 1) * limit)
      .limit(limit)
      .sort({ updatedAt: -1 });

    const total = await Profile.countDocuments(profileQuery);

    // Create user map for quick lookup
    const userMap = {};
    verifiedEmailUsers.forEach((user) => {
      userMap[user._id.toString()] = user;
    });

    // Combine data with request screenshots
    let combinedData = await Promise.all(
      profiles.map(async (profile) => {
        const user = userMap[profile.userId] || {};

        // Get withdrawal and deposit request screenshots
        const withdrawalScreenshots =
          profile.requests
            ?.filter((req) => req.type === 'withdrawal' && req.proofOfPayment)
            .map((req) => ({
              id: req._id?.toString(),
              url: req.proofOfPayment,
              amount: req.amount,
              status: req.status,
              date: req.submissionDate,
            })) || [];

        const depositScreenshots =
          profile.requests
            ?.filter((req) => req.type === 'purchase' && req.proofOfPayment)
            .map((req) => ({
              id: req._id?.toString(),
              url: req.proofOfPayment,
              amount: req.amount,
              status: req.status,
              date: req.submissionDate,
            })) || [];

        return {
          id: profile.userId,
          name: user.name || 'N/A',
          coinvestorId: profile.coinvestorId || 'Not assigned',
          email: user.email || 'N/A',
          phone: user.phoneNumber || 'N/A',
          documentsStatus: 'verified',
          identityProof: profile.identityProof || null,
          photo: profile.photo || null,
          registrationDate: user.createdAt || new Date(),
          withdrawalScreenshots,
          depositScreenshots,
          totalCoins: profile.balance || 0,
        };
      }),
    );

    if (search) {
      combinedData = combinedData.filter(
        (item) =>
          item.name.toLowerCase().includes(search.toLowerCase()) ||
          item.coinvestorId.includes(search) ||
          item.phone.includes(search),
      );
    }

    return {
      documents: combinedData,
      total: combinedData.length,
      pagination: {
        current: page,
        total: Math.ceil(total / limit),
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1,
      },
    };
  } catch (error) {
    throw new Error(`Failed to get verified documents: ${error.message}`);
  }
};

// Request Management Helpers
const getRequestsWithUserInfo = async (requestType, filters = {}) => {
  try {
    const { search, page = 1, limit = 10, status = 'pending', sort = 'newest' } = filters;

    // Build aggregation pipeline
    const pipeline = [
      { $unwind: '$requests' },
      {
        $match: {
          'requests.type': requestType,
          'requests.status': status,
        },
      },
    ];

    // Add sorting
    if (sort === 'newest') {
      pipeline.push({ $sort: { 'requests.submissionDate': -1 } });
    } else {
      pipeline.push({ $sort: { 'requests.submissionDate': 1 } });
    }

    // Execute aggregation
    const results = await Profile.aggregate(pipeline);

    // Get all users and create a map (avoid ObjectId conversion issues)
    const allUsers = await auth.db.collection('user').find({}).toArray();

    const userMap = {};
    allUsers.forEach((user) => {
      userMap[user._id.toString()] = user;
    });

    // Combine data
    let combinedData = results.map((result) => {
      const user = userMap[result.userId] || {};
      const request = result.requests;

      return {
        id: request._id.toString(),
        userId: result.userId,
        userName: user.name || 'N/A',
        coinvestorId: result.coinvestorId || 'Not assigned',
        amount: request.amount,
        paymentMethod: request.paymentMode,
        status: request.status,
        requestDate: request.submissionDate,
        proofDocument: request.proofOfPayment || null,
        reason: request.reason || null,
      };
    });

    // Apply search filter
    if (search) {
      combinedData = combinedData.filter(
        (item) => item.userName.toLowerCase().includes(search.toLowerCase()) || item.coinvestorId.includes(search),
      );
    }

    // Apply pagination
    const startIndex = (page - 1) * limit;
    const paginatedData = combinedData.slice(startIndex, startIndex + limit);

    return {
      requests: paginatedData,
      total: combinedData.length,
    };
  } catch (error) {
    throw new Error(`Failed to get ${requestType} requests: ${error.message}`);
  }
};

// Buy Requests
const getBuyRequests = async (filters = {}) => {
  return await getRequestsWithUserInfo('purchase', filters);
};

const approveBuyRequest = async (requestId) => {
  try {
    // Validate ObjectId format
    if (!ObjectId.isValid(requestId)) {
      throw new Error('Invalid request ID format');
    }

    // Find the profile with this request
    const profile = await Profile.findOne({
      'requests._id': new ObjectId(requestId),
    });

    if (!profile) {
      throw new Error('Request not found');
    }

    const request = profile.requests.find((req) => req._id.toString() === requestId);
    if (!request) {
      throw new Error('Request not found');
    }

    if (request.status !== 'pending') {
      throw new Error('Request is not pending');
    }

    // Update request status and add coins to balance
    await Profile.updateOne(
      {
        'requests._id': new ObjectId(requestId),
      },
      {
        $set: {
          'requests.$.status': 'approved',
          'requests.$.approvalDate': new Date(),
        },
        $inc: { balance: request.amount },
      },
    );

    return { requestId, status: 'approved', coinsAdded: request.amount };
  } catch (error) {
    throw new Error(`Failed to approve buy request: ${error.message}`);
  }
};

const rejectBuyRequest = async (requestId, reason) => {
  try {
    // Validate ObjectId format
    if (!ObjectId.isValid(requestId)) {
      throw new Error('Invalid request ID format');
    }

    const result = await Profile.updateOne(
      { 'requests._id': new ObjectId(requestId) },
      {
        $set: {
          'requests.$.status': 'rejected',
          'requests.$.rejectionReason': reason,
          'requests.$.rejectionDate': new Date(),
        },
      },
    );

    if (result.matchedCount === 0) {
      throw new Error('Request not found');
    }

    return { requestId, status: 'rejected', reason };
  } catch (error) {
    throw new Error(`Failed to reject buy request: ${error.message}`);
  }
};

// Withdrawal Requests
const getWithdrawRequests = async (filters = {}) => {
  return await getRequestsWithUserInfo('withdrawal', filters);
};

const approveWithdrawRequest = async (requestId) => {
  try {
    // Validate ObjectId format
    if (!ObjectId.isValid(requestId)) {
      throw new Error('Invalid request ID format');
    }

    // Find the profile with this request
    const profile = await Profile.findOne({
      'requests._id': new ObjectId(requestId),
    });

    if (!profile) {
      throw new Error('Request not found');
    }

    const request = profile.requests.find((req) => req._id.toString() === requestId);
    if (!request) {
      throw new Error('Request not found');
    }

    if (request.status !== 'pending') {
      throw new Error('Request is not pending');
    }

    if (profile.balance < request.amount) {
      throw new Error('Insufficient balance for withdrawal');
    }

    // Update request status and deduct from balance
    await Profile.updateOne(
      { 'requests._id': new ObjectId(requestId) },
      {
        $set: {
          'requests.$.status': 'approved',
          'requests.$.approvalDate': new Date(),
        },
        $inc: { balance: -request.amount },
      },
    );

    return { requestId, status: 'approved', amountDeducted: request.amount };
  } catch (error) {
    throw new Error(`Failed to approve withdrawal request: ${error.message}`);
  }
};

const rejectWithdrawRequest = async (requestId, reason) => {
  try {
    // Validate ObjectId format
    if (!ObjectId.isValid(requestId)) {
      throw new Error('Invalid request ID format');
    }

    const result = await Profile.updateOne(
      { 'requests._id': new ObjectId(requestId) },
      {
        $set: {
          'requests.$.status': 'rejected',
          'requests.$.rejectionReason': reason,
          'requests.$.rejectionDate': new Date(),
        },
      },
    );

    if (result.matchedCount === 0) {
      throw new Error('Request not found');
    }

    return { requestId, status: 'rejected', reason };
  } catch (error) {
    throw new Error(`Failed to reject withdrawal request: ${error.message}`);
  }
};

// Manual Deposit/Withdrawal by Admin
const manualDeposit = async (userId, amount, note) => {
  try {
    const profile = await Profile.findOne({ userId });
    if (!profile) {
      throw new Error('User profile not found');
    }

    // Add to balance
    await Profile.updateOne(
      { userId },
      {
        $inc: { balance: amount },
        $push: {
          requests: {
            type: 'purchase',
            status: 'approved',
            submissionDate: new Date(),
            approvalDate: new Date(),
            amount: amount,
            paymentMode: 'cash',
            note: note || 'Manual deposit by admin',
          },
        },
      },
    );

    return {
      userId,
      amount,
      newBalance: profile.balance + amount,
      type: 'deposit',
    };
  } catch (error) {
    throw new Error(`Failed to add manual deposit: ${error.message}`);
  }
};

const manualWithdraw = async (userId, amount, note) => {
  try {
    const profile = await Profile.findOne({ userId });
    if (!profile) {
      throw new Error('User profile not found');
    }

    if (profile.balance < amount) {
      throw new Error('Insufficient balance for withdrawal');
    }

    // Deduct from balance
    await Profile.updateOne(
      { userId },
      {
        $inc: { balance: -amount },
        $push: {
          requests: {
            type: 'withdrawal',
            status: 'approved',
            submissionDate: new Date(),
            approvalDate: new Date(),
            amount: amount,
            paymentMode: 'cash',
            note: note || 'Manual withdrawal by admin',
          },
        },
      },
    );

    return {
      userId,
      amount,
      newBalance: profile.balance - amount,
      type: 'withdrawal',
    };
  } catch (error) {
    throw new Error(`Failed to process manual withdrawal: ${error.message}`);
  }
};

// Payment Methods Management
const getPaymentMethods = async () => {
  try {
    const paymentMethods = await Payment.find({}).sort({ createdAt: -1 });
    return paymentMethods;
  } catch (error) {
    throw new Error(`Failed to get payment methods: ${error.message}`);
  }
};

const updatePaymentMethod = async (methodId, updateData) => {
  try {
    const updatedMethod = await Payment.findByIdAndUpdate(methodId, { ...updateData, updatedAt: new Date() }, { new: true });

    if (!updatedMethod) {
      throw new Error('Payment method not found');
    }

    return updatedMethod;
  } catch (error) {
    throw new Error(`Failed to update payment method: ${error.message}`);
  }
};

const createPaymentMethod = async (methodData) => {
  try {
    const paymentMethod = new Payment(methodData);
    await paymentMethod.save();
    return paymentMethod;
  } catch (error) {
    throw new Error(`Failed to create payment method: ${error.message}`);
  }
};

const deletePaymentMethod = async (methodId) => {
  try {
    const result = await Payment.findByIdAndDelete(methodId);
    if (!result) {
      throw new Error('Payment method not found');
    }
    return result;
  } catch (error) {
    throw new Error(`Failed to delete payment method: ${error.message}`);
  }
};

// Helper function to get KYC status from profile
const getKycStatusFromProfile = (profile) => {
  const hasIdentityProof = profile.identityProof && profile.identityProof.url;
  const hasPhoto = profile.photo && profile.photo.url;
  const identityVerified = profile.identityProof?.status === 'verified';
  const photoVerified = profile.photo?.status === 'verified';

  return {
    completed: hasIdentityProof && hasPhoto,
    verified: identityVerified && photoVerified,
  };
};

module.exports = {
  getAllUsers,
  updateUserStatus,
  getPendingDocuments,
  getVerifiedDocuments,
  verifyUserDocuments,
  rejectUserDocuments,
  getBuyRequests,
  approveBuyRequest,
  rejectBuyRequest,
  getWithdrawRequests,
  approveWithdrawRequest,
  rejectWithdrawRequest,
  manualDeposit,
  manualWithdraw,
  getPaymentMethods,
  updatePaymentMethod,
  createPaymentMethod,
  deletePaymentMethod,
};
