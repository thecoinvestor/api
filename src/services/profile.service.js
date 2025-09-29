const { Profile } = require('../models');

const createProfile = async (userId) => {
  try {
    const existingProfile = await Profile.findOne({ userId });
    if (existingProfile) {
      return existingProfile;
    }

    // Generate unique coinvestorId and ensure it's unique
    let coinvestorId;
    let isUnique = false;

    while (!isUnique) {
      coinvestorId = Math.random().toString(36).substring(2, 10).toUpperCase();
      const existingCoinvestor = await Profile.findOne({ coinvestorId });
      if (!existingCoinvestor) {
        isUnique = true;
      }
    }

    const profile = new Profile({
      userId,
      coinvestorId,
      balance: 0,
      investments: [],
      requests: [],
    });

    await profile.save();
    return profile;
  } catch (error) {
    throw new Error(`Failed to create profile: ${error.message}`);
  }
};

// Get user profile
const getProfile = async (userId) => {
  try {
    const profile = await Profile.findOne({ userId });
    if (!profile) {
      // Auto-create profile if it doesn't exist
      return await createProfile(userId);
    }
    return profile;
  } catch (error) {
    throw new Error(`Failed to get profile: ${error.message}`);
  }
};

// Get profile by coinvestorId
const getProfileByCoinvestorId = async (coinvestorId) => {
  try {
    const profile = await Profile.findOne({ coinvestorId });
    return profile;
  } catch (error) {
    throw new Error(`Failed to get profile by coinvestorId: ${error.message}`);
  }
};

// Add request (withdrawal or purchase)
const addRequest = async (userId, type, amount, paymentMode, proofOfPayment = null) => {
  try {
    const profile = await getProfile(userId);

    // Validation for withdrawal requests
    if (type === 'withdrawal' && profile.balance < amount) {
      throw new Error('Insufficient balance for withdrawal');
    }

    const request = {
      type,
      status: 'pending',
      submissionDate: new Date(),
      amount,
      paymentMode,
      proofOfPayment,
    };

    profile.requests.push(request);
    await profile.save();
    return request;
  } catch (error) {
    throw new Error(`Failed to add request: ${error.message}`);
  }
};

// Update request status by index
const updateRequestStatus = async (userId, requestIndex, newStatus) => {
  try {
    const profile = await Profile.findOne({ userId });
    if (!profile) {
      throw new Error('Profile not found');
    }

    if (!profile.requests[requestIndex]) {
      throw new Error('Request not found');
    }

    const request = profile.requests[requestIndex];
    request.status = newStatus;

    // Handle status changes
    if (newStatus === 'approved' && request.type === 'withdrawal') {
      if (profile.balance >= request.amount) {
        profile.balance -= request.amount;
        request.approvalDate = new Date();
      } else {
        throw new Error('Insufficient balance for withdrawal');
      }
    } else if (newStatus === 'approved' && request.type === 'purchase') {
      profile.balance += request.amount;
      request.approvalDate = new Date();
    }

    await profile.save();
    return request;
  } catch (error) {
    throw new Error(`Failed to update request: ${error.message}`);
  }
};

// Update balance
const updateBalance = async (userId, newBalance) => {
  try {
    const profile = await getProfile(userId);
    profile.balance = newBalance;
    await profile.save();
    return profile.balance;
  } catch (error) {
    throw new Error(`Failed to update balance: ${error.message}`);
  }
};

// Get user requests with filtering
const getUserRequests = async (userId, filters = {}) => {
  try {
    const profile = await getProfile(userId);
    let requests = [...profile.requests];

    // Apply filters
    if (filters.type) {
      requests = requests.filter((r) => r.type === filters.type);
    }
    if (filters.status) {
      requests = requests.filter((r) => r.status === filters.status);
    }
    if (filters.limit) {
      requests = requests.slice(0, filters.limit);
    }

    // Sort by creation date (newest first)
    requests.sort((a, b) => new Date(b.submissionDate) - new Date(a.submissionDate));

    return requests;
  } catch (error) {
    throw new Error(`Failed to get user requests: ${error.message}`);
  }
};

// Update identity proof document
const updateIdentityProof = async (userId, type, url, status = 'pending') => {
  try {
    const profile = await getProfile(userId);
    profile.identityProof = {
      type,
      url,
      status,
    };
    await profile.save();
    return profile.identityProof;
  } catch (error) {
    throw new Error(`Failed to update identity proof: ${error.message}`);
  }
};

// Update photo
const updatePhoto = async (userId, url, status = 'pending') => {
  try {
    const profile = await getProfile(userId);
    profile.photo = {
      url,
      status,
    };
    await profile.save();
    return profile.photo;
  } catch (error) {
    throw new Error(`Failed to update photo: ${error.message}`);
  }
};

// Update document status (for admin use)
const updateDocumentStatus = async (userId, documentType, status) => {
  try {
    const profile = await getProfile(userId);

    if (documentType === 'identityProof') {
      if (!profile.identityProof) {
        throw new Error('Identity proof not found');
      }
      profile.identityProof.status = status;
    } else if (documentType === 'photo') {
      if (!profile.photo) {
        throw new Error('Photo not found');
      }
      profile.photo.status = status;
    } else {
      throw new Error('Invalid document type');
    }

    await profile.save();
    return profile;
  } catch (error) {
    throw new Error(`Failed to update document status: ${error.message}`);
  }
};

// Check if user has completed KYC
const getKycStatus = async (userId) => {
  try {
    const profile = await getProfile(userId);

    const hasIdentityProof = profile.identityProof && profile.identityProof.url;
    const hasPhoto = profile.photo && profile.photo.url;
    const identityVerified = profile.identityProof?.status === 'verified';
    const photoVerified = profile.photo?.status === 'verified';

    return {
      completed: hasIdentityProof && hasPhoto,
      verified: identityVerified && photoVerified,
      identityProof: {
        uploaded: !!hasIdentityProof,
        type: profile.identityProof?.type || null,
        status: profile.identityProof?.status || null,
      },
      photo: {
        uploaded: !!hasPhoto,
        status: profile.photo?.status || null,
      },
    };
  } catch (error) {
    throw new Error(`Failed to get KYC status: ${error.message}`);
  }
};

const getInvestmentData = async (userId) => {
  try {
    const profile = await getProfile(userId);

    const approvedPurchases = profile.requests.filter((req) => req.type === 'purchase' && req.status === 'approved');

    const investments = approvedPurchases.map((purchase, index) => {
      const startDate = new Date(purchase.approvalDate);
      const maturityDate = new Date(startDate.getTime() + 90 * 24 * 60 * 60 * 1000);
      const today = new Date();
      const daysLeft = Math.max(0, Math.ceil((maturityDate - today) / (24 * 60 * 60 * 1000)));

      return {
        id: purchase._id || index.toString(),
        amount: purchase.amount,
        startDate,
        daysLeft,
        status: daysLeft > 0 ? 'active' : 'matured',
      };
    });

    return investments;
  } catch (error) {
    throw new Error(`Failed to get investment data: ${error.message}`);
  }
};

module.exports = {
  createProfile,
  getProfile,
  getProfileByCoinvestorId,
  addRequest,
  updateRequestStatus,
  updateBalance,
  getUserRequests,
  updateIdentityProof,
  updatePhoto,
  updateDocumentStatus,
  getKycStatus,
  getInvestmentData,
};
