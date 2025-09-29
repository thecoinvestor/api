const { betterAuth } = require('better-auth');
const { MongoClient } = require('mongodb');
const { mongodbAdapter } = require('better-auth/adapters/mongodb');
const { phoneNumber, createAuthMiddleware } = require('better-auth/plugins');
const config = require('./config.js');
const { nextCookies } = require('better-auth/next-js');
const { sendOtpSms } = require('../services/sms.service.js');

const client = new MongoClient(config.mongoose.url);

client
  .connect()
  .then(() => {
    // console.log('MongoDB connected successfully');
  })
  .catch(() => {
    // console.error('MongoDB connection failed:', error);
    process.exit(1);
  });

const db = client.db();

const auth = betterAuth({
  trustedOrigins: Array.isArray(config.cors.allowedOrigins) ? config.cors.allowedOrigins : [config.cors.allowedOrigins],
  database: mongodbAdapter(db),

  user: {
    additionalFields: {
      phoneNumber: {
        type: 'string',
        required: false,
      },
      phoneNumberVerified: {
        type: 'boolean',
        required: false,
        defaultValue: false,
      },
      email: {
        type: 'string',
        required: false,
      },
      redirectUrl: {
        type: 'string',
        required: false,
        defaultValue: 'upload',
      },
      isAdmin: {
        type: 'boolean',
        required: false,
        defaultValue: false,
      },
    },
  },
  hooks: {
    after: createAuthMiddleware(async (ctx) => {
      if (ctx.path.startsWith('/sign-up') && ctx.context.newSession) {
        const userId = ctx.context.newSession.user?.id;

        if (userId) {
          const { profileService } = require('../services/index.js');
          await profileService.createProfile(userId);
        }
      }
    }),
  },
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
  },

  plugins: [
    phoneNumber({
      sendOTP: async ({ phoneNumber, code }) => {
        await sendOtpSms(phoneNumber, code, 'phone-verification');
      },
      sendPasswordResetOTP: async ({ phoneNumber, code }) => {
        await sendOtpSms(phoneNumber, code, 'password-reset');
      },
      otpLength: 6,
      expiresIn: 300,
    }),
    nextCookies(),
  ],

  advanced: {
    ipAddress: {
      ipAddressHeaders: ['x-forwarded-for', 'x-real-ip', 'cf-connecting-ip'],
    },
    defaultCookieAttributes: {
      sameSite: 'none',
      secure: true,
      httpOnly: true,
      domain: config.env === 'production' ? '' : 'localhost',
    },
  },
});

module.exports = auth;
module.exports.db = db;
