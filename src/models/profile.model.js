const mongoose = require('mongoose');

const RequestSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['withdrawal', 'purchase'],
    required: true,
  },
  status: {
    type: String,
    required: true,
  },
  submissionDate: {
    type: Date,
    default: Date.now,
  },
  approvalDate: {
    type: Date,
    required: false,
  },
  amount: {
    type: Number,
    required: true,
  },
  paymentMode: {
    type: String,
    required: true,
  },
  proofOfPayment: {
    type: String,
    required: false,
  },
});

const ProfileSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    unique: true,
  },
  coinvestorId: {
    type: String,
    required: true,
    unique: true,
    length: 8,
  },
  balance: {
    type: Number,
    default: 0,
  },
  identityProof: {
    type: {
      type: String,
      enum: ['aadhar', 'pan'],
      required: false,
    },
    url: {
      type: String,
      required: false,
    },
    status: {
      type: String,
      enum: ['pending', 'verified', 'rejected'],
      default: 'pending',
      required: false,
    },
  },
  photo: {
    url: {
      type: String,
      required: false,
    },
    status: {
      type: String,
      enum: ['pending', 'verified', 'rejected'],
      default: 'pending',
      required: false,
    },
  },
  requests: [RequestSchema],
});

ProfileSchema.statics.generateCoinvestorId = function () {
  return Math.random().toString(36).substring(2, 10).toUpperCase();
};

const Profile = mongoose.model('Profile', ProfileSchema);

module.exports = Profile;
