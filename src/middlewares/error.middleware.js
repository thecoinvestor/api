const mongoose = require('mongoose');
const httpStatus = require('http-status');
const config = require('../config/config.js');
const ApiError = require('../utils/ApiError.js');

const errorConverter = (err, req, res, next) => {
  let error = err;
  if (!(error instanceof ApiError)) {
    const statusCode =
      err.statusCode || (err instanceof mongoose.Error ? httpStatus.BAD_REQUEST : httpStatus.INTERNAL_SERVER_ERROR);
    const message = err.message || httpStatus[statusCode];
    error = new ApiError(statusCode, message, false, err.stack);
  }
  next(error);
};

const errorHandler = (err, req, res) => {
  let statusCode;

  if (err.statusCode && typeof err.statusCode === 'number' && err.statusCode >= 100 && err.statusCode <= 599) {
    statusCode = err.statusCode;
  } else {
    statusCode = httpStatus.INTERNAL_SERVER_ERROR;
  }

  let message = err.message || 'Internal Server Error';

  // Additional safety check
  if (!Number.isInteger(statusCode) || statusCode < 100 || statusCode > 599) {
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
  // Additional safety check before sending response
  if (!statusCode || isNaN(statusCode)) {
    // console.error('CRITICAL: statusCode is still invalid:', statusCode);
    statusCode = 500;
  }

  try {
    res.status(statusCode).json(response);
  } catch {
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: true, message: 'Internal Server Error' }));
  }
};

module.exports = { errorConverter, errorHandler };
