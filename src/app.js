const express = require('express');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const compression = require('compression');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const morgan = require('./config/morgan.js');
const config = require('./config/config.js');
const routes = require('./routes/index.js');
const { errorConverter, errorHandler } = require('./middlewares/error.middleware.js');
const ApiError = require('./utils/ApiError.js');
const mongoose = require('mongoose');
const { getAuth } = require('./config/auth.js');

// Add MongoDB connection for Vercel
if (process.env.NODE_ENV === 'production') {
  mongoose.connect(config.mongoose.url, config.mongoose.options);
}

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

app.use(cors(corsOptions));

// Handle OPTIONS preflight requests
app.options('*', cors());

// better-auth routes - use dynamic import for ESM module
app.all('/api/auth/*', async (req, res, next) => {
  try {
    const { toNodeHandler } = await import('better-auth/node');
    const auth = await getAuth();
    return toNodeHandler(auth)(req, res, next);
  } catch (error) {
    console.error('Auth handler error:', error);
    res.status(500).json({ error: 'Authentication service error' });
  }
});

// Add this after your CORS setup and before app.use('/v1', routes)
app.get('/', (req, res) => {
  res.json({
    message: 'Coinvestor API is running!',
    status: 'OK',
    timestamp: new Date().toISOString(),
  });
});

app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
  });
});

app.use('/v1', routes);

// send back a 404 error for any unknown api request
app.use((req, res, next) => {
  next(new ApiError(404, 'Not found'));
});

// convert error to ApiError, if needed
app.use(errorConverter);

// handle error
app.use(errorHandler);

module.exports = app;
