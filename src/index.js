const mongoose = require('mongoose');
const app = require('./app.js');
const config = require('./config/config.js');
// const logger = require('./config/logger.js');

let server;
mongoose
  .connect(config.mongoose.url, config.mongoose.options)
  .then(() => {
    // logger.info(`Connected to MongoDB on ${config.mongoose.url}`);
    server = app.listen(config.port, () => {
      console.log(`Api is running on http://localhost:${config.port}`);
    });
  })
  .catch((error) => {
    // logger.error(`MongoDB connection error: ${error}`);
    process.exit(1);
  });

const exitHandler = () => {
  if (server) {
    server.close(() => {
      logger.info('Server closed');
      process.exit(1);
    });
  } else {
    process.exit(1);
  }
};

const unexpectedErrorHandler = (error) => {
  // logger.error(`unexpected error: ${error.message} ${error.stack}`);
  exitHandler();
};

process.on('uncaughtException', unexpectedErrorHandler);
process.on('unhandledRejection', unexpectedErrorHandler);

process.on('SIGTERM', () => {
  // logger.info('SIGTERM received');
  if (server) {
    server.close();
  }
});
