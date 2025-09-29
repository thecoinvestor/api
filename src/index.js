const mongoose = require('mongoose');
const app = require('./app.js');
const config = require('./config/config.js');

let server;

// Connect to MongoDB
mongoose.connect(config.mongoose.url, config.mongoose.options).then(() => {
  // console.log('Connected to MongoDB');

  // Start the server after MongoDB connects
  server = app.listen(config.port, () => {
    // console.log(`Server listening on port ${config.port}`);
  });
});

const exitHandler = () => {
  if (server) {
    server.close(() => {
      // console.log('Server closed');
      process.exit(1);
    });
  } else {
    process.exit(1);
  }
};

const unexpectedErrorHandler = () => {
  // console.error('Unexpected error:', error);
  exitHandler();
};

process.on('uncaughtException', unexpectedErrorHandler);
process.on('unhandledRejection', unexpectedErrorHandler);

process.on('SIGTERM', () => {
  // console.log('SIGTERM received');
  if (server) {
    server.close();
  }
});

// Export for Vercel (serverless)
module.exports = app;
