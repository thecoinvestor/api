const mongoose = require('mongoose');
const app = require('./app.js');
const config = require('./config/config.js');

let server;
mongoose
  .connect(config.mongoose.url, config.mongoose.options)
  .then(() => {
    server = app.listen(config.port, () => {
      // console.log(`Api is running on http://localhost:${config.port}`);
    });
  })
  .catch(() => {
    process.exit(1);
  });

const exitHandler = () => {
  if (server) {
    server.close(() => {
      process.exit(1);
    });
  } else {
    process.exit(1);
  }
};

const unexpectedErrorHandler = () => {
  exitHandler();
};

process.on('uncaughtException', unexpectedErrorHandler);
process.on('unhandledRejection', unexpectedErrorHandler);

process.on('SIGTERM', () => {
  if (server) {
    server.close();
  }
});
