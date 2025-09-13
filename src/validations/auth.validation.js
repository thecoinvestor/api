const Joi = require('joi');

const register = {
  body: Joi.object().keys({
    email: Joi.string().required().email(),
    name: Joi.string().required(),
  }),
};

const login = {
  body: Joi.object().keys({
    email: Joi.string().required().email(),
  }),
};

const loginWithGoogle = {
  body: Joi.object().keys({
    access_token: Joi.string(),
    token_type: Joi.string(),
    credential: Joi.string(),
  }),
};

const verifyMagicLink = {
  params: Joi.object().keys({
    token: Joi.string().required(),
  }),
};

const verifyOtp = {
  body: Joi.object().keys({
    email: Joi.string().required().email(),
    otp: Joi.string()
      .required()
      .length(6)
      .pattern(/^[0-9]+$/)
      .messages({
        'string.pattern.base': 'OTP must only contain numbers',
        'string.length': 'OTP must be 6 digits',
      }),
  }),
};

module.exports = {
  register,
  login,
  verifyMagicLink,
  verifyOtp,
  loginWithGoogle,
};
