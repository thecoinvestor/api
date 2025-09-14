const morgan = require('morgan');
// const logger = require('./logger.js');
const config = require('./config.js');
let chalk;
(async () => {
  chalk = (await import('chalk')).default;
})();

const ignoredRoutes = [
  {
    method: 'OPTIONS',
    path: '/v1/auth/get-user',
    status: 204,
  },
  {
    method: 'GET',
    path: '/get-user',
    status: 304,
  },
];

const shouldIgnoreRequest = (req, res) => {
  if (config.env !== 'production') return false;
  return ignoredRoutes.some(
    (route) => route.method === req.method && route.path === req.path && route.status === res.statusCode,
  );
};

morgan.token('status-color', function (req, res) {
  const status = res.statusCode;
  if (status >= 500) return chalk.red(status);
  if (status >= 400) return chalk.yellow(status);
  if (status >= 300) return chalk.cyan(status);
  if (status >= 200) return chalk.green(status);
  return status;
});

morgan.token('ip', function (req) {
  return req.headers['x-forwarded-for'] || req?.connection?.remoteAs;
});

morgan.token('user-agent', function (req) {
  return req.headers['user-agent'] || 'No User Agent'; // Default to 'No User Agent' if the header is not set
});

morgan.token('x-client-path', function (req) {
  return req.headers['x-client-path'] || 'no-path'; // Default to 'no-path' if header is not set
});

const morganMiddleware = morgan(
  ':method :url :status-color :response-time ms - :res[content-length] X-Client-Path=:x-client-path IP=:ip User-Agent=:user-agent',
  {
    stream: {
      write: (message) => message.trim(),
    },
    skip: shouldIgnoreRequest,
  },
);

module.exports = morganMiddleware;
