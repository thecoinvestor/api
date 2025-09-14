// middlewares/error.middleware.js - Fixed version
const mongoose = require('mongoose');
const httpStatus = require('http-status');
const config = require('../config/config.js');
const ApiError = require('../utils/ApiError.js');

const errorConverter = (err, req, res, next) => {
  // console.log('=== ERROR CONVERTER ===');
  // console.log('Original error:', err);
  // console.log('Error name:', err.name);
  // console.log('Error message:', err.message);
  // console.log('Error statusCode:', err.statusCode);
  // console.log('Is ApiError?', err instanceof ApiError);

  let error = err;
  if (!(error instanceof ApiError)) {
    const statusCode =
      err.statusCode || (err instanceof mongoose.Error ? httpStatus.BAD_REQUEST : httpStatus.INTERNAL_SERVER_ERROR);
    const message = err.message || httpStatus[statusCode];
    error = new ApiError(statusCode, message, false, err.stack);
  }

  // console.log('Converted error statusCode:', error.statusCode);
  next(error);
};

const errorHandler = (err, req, res) => {
  // console.log('=== ERROR HANDLER ===');
  // console.log('Received error:', err);
  // console.log('Error statusCode property:', err.statusCode);
  // console.log('Type of statusCode:', typeof err.statusCode);

  // More robust statusCode handling
  let statusCode;

  // First, try to get statusCode from error
  if (err.statusCode && typeof err.statusCode === 'number' && err.statusCode >= 100 && err.statusCode <= 599) {
    statusCode = err.statusCode;
  } else {
    // Fallback to 500
    statusCode = httpStatus.INTERNAL_SERVER_ERROR;
    // console.log('Using fallback statusCode:', statusCode);
  }

  let message = err.message || 'Internal Server Error';

  // Additional safety check
  if (!Number.isInteger(statusCode) || statusCode < 100 || statusCode > 599) {
    // console.log('Final safety check failed, forcing 500. statusCode was:', statusCode);
    statusCode = 500; // Use number directly instead of httpStatus constant
  }

  if (config.env === 'production' && !err.isOperational) {
    statusCode = httpStatus.INTERNAL_SERVER_ERROR;
    message = httpStatus[httpStatus.INTERNAL_SERVER_ERROR];
  }

  res.locals.errorMessage = err.message;

  const response = {
    error: true,
    statusCode: statusCode,
    message,
    ...(config.env === 'development' && { stack: err.stack }),
  };

  // console.log('Error handler - final statusCode:', statusCode);
  // console.log('Type of final statusCode:', typeof statusCode);

  // Additional safety check before sending response
  if (!statusCode || isNaN(statusCode)) {
    // console.error('CRITICAL: statusCode is still invalid:', statusCode);
    statusCode = 500;
  }

  try {
    res.status(statusCode).json(response);
  } catch {
    // console.error('Error sending response:', resError);
    // Last resort - send basic error response
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: true, message: 'Internal Server Error' }));
  }
};

module.exports = { errorConverter, errorHandler };
