const dotenv = require('dotenv');
const path = require('path');
const Joi = require('joi');
dotenv.config({ path: path.join(__dirname, '../../.env') });

const envVarsSchema = Joi.object()
  .keys({
    NODE_ENV: Joi.string().valid('production', 'development', 'test').required(),
    PORT: Joi.number().default(8000),
    MONGODB_URL: Joi.string().description('Mongo DB url'),
    FRONTEND_URL: Joi.string().required().description('Frontend url'),
    CORS_ALLOWED: Joi.string().required().description('CORS allowed origins'),

    ADMIN_EMAIL: Joi.string().required().description('Admin email'),

    JWT_SECRET: Joi.string().required().description('JWT secret key'),
    JWT_ACCESS_EXPIRATION_MINUTES: Joi.number().default(30).description('minutes after which access token expires'),
    JWT_REFRESH_EXPIRATION_DAYS: Joi.number().default(30).description('days after which refresh token expires'),

    MAGIC_LINK_EXPIRATION_MINUTES: Joi.number().default(30).description('minutes after which magic link expires'),
    OTP_EXPIRATION_MINUTES: Joi.number().default(5).description('minutes after which OTP expires'),

    TWILIO_VERIFY_SERVICE_SID: Joi.string().required().description('Twilio verify service SID'),
    TWILIO_ACCOUNT_SID: Joi.string().required().description('Twilio account SID'),
    TWILIO_AUTH_TOKEN: Joi.string().required().description('Twilio auth token'),
    TWILIO_PHONE_NUMBER: Joi.string().required().description('Twilio phone number'),

    CLOUDINARY_NAME: Joi.string().required().description('cloudinary name'),
    CLOUDINARY_API_KEY: Joi.string().required().description('cloudinary api key'),
    CLOUDINARY_API_SECRET: Joi.string().required().description('cloudinary api secret'),

    // LOGTAIL_API_KEY: Joi.string().required().description('API key for Logtail'),
    // LOGTAIL_INGESTING_HOST: Joi.string().required().description('Logtail ingestion host'),
  })
  .unknown();

const { value: envVars, error } = envVarsSchema.prefs({ errors: { label: 'key' } }).validate(process.env);

if (error) {
  throw new Error(`Config validation error: ${error.message}`);
}

module.exports = {
  env: envVars.NODE_ENV,
  port: envVars.PORT,
  frontend_url: envVars.FRONTEND_URL,
  admin: {
    email: envVars.ADMIN_EMAIL,
  },
  mongoose: {
    url: envVars.MONGODB_URL,
    options: {},
  },
  jwt: {
    secret: envVars.JWT_SECRET,
    accessExpirationMinutes: envVars.JWT_ACCESS_EXPIRATION_MINUTES,
    refreshExpirationDays: envVars.JWT_REFRESH_EXPIRATION_DAYS,
  },
  magic_link: {
    expirationMinutes: envVars.MAGIC_LINK_EXPIRATION_MINUTES,
  },
  otp: {
    expirationMinutes: envVars.OTP_EXPIRATION_MINUTES,
  },
  cors: {
    allowedOrigins: envVars.CORS_ALLOWED,
  },
  twilio: {
    accountSid: envVars.TWILIO_ACCOUNT_SID,
    authToken: envVars.TWILIO_AUTH_TOKEN,
    verifyServiceSid: envVars.TWILIO_VERIFY_SERVICE_SID,
    phoneNumber: envVars.TWILIO_PHONE_NUMBER,
  },
  cloudinary: {
    name: envVars.CLOUDINARY_NAME,
    apiKey: envVars.CLOUDINARY_API_KEY,
    apiSecret: envVars.CLOUDINARY_API_SECRET
  }
  // logtail: {
  //   apiKey: envVars.LOGTAIL_API_KEY,
  //   endpoint: `https://${envVars.LOGTAIL_INGESTING_HOST}`,
  // },
};
