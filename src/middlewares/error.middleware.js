// middlewares/error.middleware.js - Better debugging version
const mongoose = require('mongoose');
const httpStatus = require('http-status');
const config = require('../config/config.js');
const ApiError = require('../utils/ApiError.js');

const errorConverter = (err, req, res, next) => {
  console.log('=== ERROR CONVERTER ===');
  console.log('Original error:', err);
  console.log('Error name:', err.name);
  console.log('Error message:', err.message);
  console.log('Error statusCode:', err.statusCode);
  console.log('Is ApiError?', err instanceof ApiError);

  let error = err;
  if (!(error instanceof ApiError)) {
    const statusCode = err.statusCode || (err instanceof mongoose.Error ? httpStatus.BAD_REQUEST : httpStatus.INTERNAL_SERVER_ERROR);
    const message = err.message || httpStatus[statusCode];
    error = new ApiError(statusCode, message, false, err.stack);
  }

  console.log('Converted error statusCode:', error.statusCode);
  next(error);
};

const errorHandler = (err, req, res, next) => {
  console.log('=== ERROR HANDLER ===');
  console.log('Received error:', err);
  console.log('Error statusCode property:', err.statusCode);

  // Force a valid statusCode
  let statusCode = err.statusCode || httpStatus.INTERNAL_SERVER_ERROR;
  let message = err.message || 'Internal Server Error';

  // Double check statusCode is valid
  if (!statusCode || isNaN(statusCode) || statusCode < 100 || statusCode > 599) {
    console.log('Invalid statusCode detected, forcing 500');
    statusCode = httpStatus.INTERNAL_SERVER_ERROR;
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

  console.log('Error handler - final statusCode:', statusCode);
  res.status(statusCode).send(response);
};

module.exports = { errorConverter, errorHandler };