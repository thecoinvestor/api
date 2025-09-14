const mongoose = require('mongoose');

const PaymentMethodSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['upi', 'bank', 'qr'],
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  details: {
    type: Object,
    required: true,
  },
  qrCodeUrl: {
    type: String,
    required: function () {
      return this.type === 'qr';
    },
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Update the updatedAt field before saving
PaymentMethodSchema.pre('save', function (next) {
  this.updatedAt = new Date();
  next();
});

const PaymentMethod = mongoose.model('PaymentMethod', PaymentMethodSchema);

module.exports = PaymentMethod;
