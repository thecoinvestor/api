const { betterAuth } = require('better-auth');
const { MongoClient } = require('mongodb');
const { mongodbAdapter } = require('better-auth/adapters/mongodb');
const { createAuthMiddleware, emailOTP } = require('better-auth/plugins');
const config = require('./config.js');
const { nextCookies } = require('better-auth/next-js');
const { sendOtpEmail } = require('../services/otp.service.js');

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

  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
  },

  plugins: [
    emailOTP({
      overrideDefaultEmailVerification: true,
      async sendVerificationOTP({ email, otp, type }) {
        try {
          let emailType;
          switch (type) {
            case 'email-verification':
              emailType = 'email-verification';
              break;
            case 'sign-in':
              emailType = 'sign-in';
              break;
            case 'forget-password':
              emailType = 'password-reset';
              break;
            default:
              emailType = 'email-verification';
          }

          await sendOtpEmail(email, otp, emailType);
          // console.log(`${type} OTP sent successfully to ${email}`);
        } catch {
          // console.error(`Failed to send ${type} OTP:`, error);
          throw new Error(`Failed to send ${type} OTP`);
        }
      },
      otpLength: 6,
      expiresIn: 300,
      allowedAttempts: 3,
      disableSignUp: true,
    }),

    nextCookies(),
  ],

  hooks: {
    after: createAuthMiddleware(async (ctx) => {
      // Create profile after sign-up
      if (ctx.path.startsWith('/sign-up') && ctx.context.newSession) {
        const userId = ctx.context.newSession.user?.id;

        if (userId) {
          const { profileService } = require('../services/index.js');
          await profileService.createProfile(userId);
        }
      }

      // Log sign-in events
      if (ctx.path.includes('sign-in') && ctx.context.newSession) {
        // const userId = ctx.context.newSession.user?.id;
        // console.log(`User ${userId} signed in successfully`);
      }
    }),
  },

  advanced: {
    ipAddress: {
      ipAddressHeaders: ['x-forwarded-for', 'x-real-ip', 'cf-connecting-ip'],
    },
    defaultCookieAttributes: {
      sameSite: config.env === 'production' ? 'none' : 'lax',
      secure: config.env === 'production',
      httpOnly: true,
      domain: config.env === 'production' ? '.yourdomain.com' : undefined,
    },
  },

  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // 1 day
  },
});

module.exports = auth;
module.exports.db = db;
