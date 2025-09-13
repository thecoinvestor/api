const express = require('express');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const compression = require('compression');
const cors = require('cors');
const httpStatus = require('http-status');
const cookieParser = require('cookie-parser');
const morgan = require('./config/morgan.js');
const config = require('./config/config.js');
const routes = require('./routes/index.js');
const { errorConverter, errorHandler } = require('./middlewares/error.middleware.js');
const ApiError = require('./utils/ApiError.js');
const { toNodeHandler } = require('better-auth/node');
const auth = require('./config/auth.js');

const app = express();

app.set('trust proxy', true);

app.use(morgan);

// set security HTTP headers
app.use(helmet());

// parse cookies
app.use(cookieParser());

// parse json request body
app.use(express.json());

// parse urlencoded request body
app.use(express.urlencoded({ extended: true }));

// sanitize request data
app.use(mongoSanitize());

// gzip compression
app.use(compression());

// enable cors
const corsOptions = {
  origin: config.cors.allowedOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
};

if (process.env.NODE_ENV === 'production') {
  corsOptions.origin = [process.env.FRONTEND_URL];
}

app.use(cors(corsOptions));

// Handle OPTIONS preflight requests
app.options('*', cors());

// better-auth routes
app.all('/api/auth/*', toNodeHandler(auth));

app.use('/v1', routes);

// send back a 404 error for any unknown api request
app.use((req, res, next) => {
  next(new ApiError(httpStatus.NOT_FOUND, 'Not found'));
});

// convert error to ApiError, if needed
app.use(errorConverter);

// handle error
app.use(errorHandler);

module.exports = app;
