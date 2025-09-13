// const { Logtail } = require('@logtail/node');
// const { LogtailTransport } = require('@logtail/winston');
// const winston = require('winston');
// const config = require('./config');

// const { format } = winston;
// const logtail = new Logtail(config.logtail.apiKey, {
//   endpoint: config.logtail.endpoint,
// });

// const logtailTransport = new LogtailTransport(logtail, {
//   level: 'http',
// });

// const timestampFormat = format.timestamp({
//   format: 'DD-MMM-YYYY HH:mm:ss.SSS',
// });

// const logLevel = 'debug';

// const transports = [
//   new winston.transports.Console({
//     level: logLevel,
//     format: format.combine(
//       format.colorize(),
//       timestampFormat,
//       format.printf((info) => {
//         const { timestamp, level, message, ...args } = info;
//         return `${timestamp} [${level}]: ${message} ${Object.keys(args).length ? JSON.stringify(args, null, 2) : ''}`;
//       }),
//     ),
//   }),
// ];

// if (config.env === 'production') {
//   transports.push(logtailTransport);
// }

// const Logger = winston.createLogger({
//   transports,
// });

// const logger = {
//   error: (message) => Logger.error(message),
//   warning: (message) => Logger.warn(message),
//   info: (message) => Logger.info(message),
//   success: (message) => Logger.log('success', message),
//   http: (message) => Logger.log('http', message),
//   debug: (message) => Logger.debug(message),
// };

// module.exports = logger;
