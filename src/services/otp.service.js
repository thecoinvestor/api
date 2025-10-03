const formData = require('form-data');
const Mailgun = require('mailgun.js');
const config = require('../config/config.js');

const mailgun = new Mailgun(formData);
const mg = mailgun.client({
  username: 'api',
  key: config.mailgun.apiKey,
});

const sendOtpEmail = async (email, otp, type = 'email-verification') => {
  try {
    const templates = {
      'email-verification': {
        subject: 'Verify Your Email Address',
        text: `Your verification code is: ${otp}\n\nThis code will expire in 5 minutes.\n\nIf you didn't request this code, please ignore this email.`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #333;">Verify Your Email Address</h2>
            <p style="font-size: 16px; color: #555;">Your verification code is:</p>
            <div style="background-color: #f5f5f5; padding: 20px; text-align: center; margin: 20px 0; border-radius: 5px;">
              <h1 style="color: #4CAF50; font-size: 32px; letter-spacing: 5px; margin: 0;">${otp}</h1>
            </div>
            <p style="font-size: 14px; color: #777;">This code will expire in 5 minutes.</p>
            <p style="font-size: 14px; color: #777;">If you didn't request this code, please ignore this email.</p>
          </div>
        `,
      },
      'sign-in': {
        subject: 'Your Sign In Code',
        text: `Your sign in code is: ${otp}\n\nThis code will expire in 5 minutes.\n\nIf you didn't request this code, please ignore this email.`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #333;">Sign In to Your Account</h2>
            <p style="font-size: 16px; color: #555;">Your sign in code is:</p>
            <div style="background-color: #f5f5f5; padding: 20px; text-align: center; margin: 20px 0; border-radius: 5px;">
              <h1 style="color: #2196F3; font-size: 32px; letter-spacing: 5px; margin: 0;">${otp}</h1>
            </div>
            <p style="font-size: 14px; color: #777;">This code will expire in 5 minutes.</p>
            <p style="font-size: 14px; color: #777;">If you didn't request this code, please ignore this email.</p>
          </div>
        `,
      },
      'password-reset': {
        subject: 'Reset Your Password',
        text: `Your password reset code is: ${otp}\n\nThis code will expire in 5 minutes.\n\nIf you didn't request this code, please ignore this email and your password will remain unchanged.`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #333;">Reset Your Password</h2>
            <p style="font-size: 16px; color: #555;">Your password reset code is:</p>
            <div style="background-color: #f5f5f5; padding: 20px; text-align: center; margin: 20px 0; border-radius: 5px;">
              <h1 style="color: #FF5722; font-size: 32px; letter-spacing: 5px; margin: 0;">${otp}</h1>
            </div>
            <p style="font-size: 14px; color: #777;">This code will expire in 5 minutes.</p>
            <p style="font-size: 14px; color: #777;">If you didn't request this code, please ignore this email and your password will remain unchanged.</p>
          </div>
        `,
      },
    };

    const template = templates[type] || templates['email-verification'];

    const messageData = {
      from: `${config.mailgun.fromName} <${config.mailgun.fromEmail}>`,
      to: email,
      subject: template.subject,
      text: template.text,
      html: template.html,
    };

    await mg.messages.create(config.mailgun.domain, messageData);

    // console.log(`OTP email sent successfully to ${email}`);
  } catch {
    // console.error('Error sending OTP email:', error);
    throw new Error('Failed to send OTP email');
  }
};

module.exports = {
  sendOtpEmail,
};
