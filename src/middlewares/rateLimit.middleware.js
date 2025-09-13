const rateLimit = require('express-rate-limit');
const httpStatus = require('http-status');
const config = require('../config/config');

const otpVerificationLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  skipSuccessfulRequests: true,
  handler: (req, res) => {
    res.status(httpStatus.TOO_MANY_REQUESTS).json({
      statusCode: httpStatus.TOO_MANY_REQUESTS,
      message: 'Too many attempts.',
      isOperational: true,
      stack: config.env === 'development' ? new Error().stack : '',
    });
  },
});

const loginVerificationLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 6,
  handler: (req, res) => {
    res.status(httpStatus.TOO_MANY_REQUESTS).json({
      statusCode: httpStatus.TOO_MANY_REQUESTS,
      message: 'Too many login attempts.',
      isOperational: true,
      stack: config.env === 'development' ? new Error().stack : '',
    });
  },
});

module.exports = { otpVerificationLimiter, loginVerificationLimiter };
