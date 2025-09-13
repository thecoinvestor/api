// const httpStatus = require('http-status');
// const catchAsync = require('../utils/catchAsync');
// const { authService, tokenService, userService } = require('../services/index');
// const ApiError = require('../utils/ApiError');
// const config = require('../config/config');
// const { default: axios } = require('axios');
// const { OAuth2Client } = require('google-auth-library');

// // const googleClient = new OAuth2Client(config.google.clientId);

// const register = catchAsync(async (req, res) => {
//   const { email, name } = req.body;

//   const emailExists = await userService.isEmailTaken(email);
//   if (emailExists) {
//     return res
//       .status(httpStatus.CONFLICT)
//       .send({ message: 'Your already have an account with us, please login to continue' });
//   }

//   const { token, expiryMinutes } = await tokenService.generateMagicLink(email, {
//     name,
//     isNewRegistration: true,
//     isOrgAdmin: true,
//   });
//   const { otp, expiryMinutes: otpExpiryMinutes } = await tokenService.generateOtp(email, {
//     name,
//     isNewRegistration: true,
//     isOrgAdmin: true,
//   });

//   // await emailService.sendMagicLinkEmail(email, token, otp, name, true);

//   res.status(httpStatus.OK).send({
//     error: false,
//     statusCode: httpStatus.OK,
//     message: 'Magic link and Otp sent to your email',
//     magicLinkExpires: expiryMinutes,
//     otpExpires: otpExpiryMinutes,
//   });
// });

// const login = catchAsync(async (req, res) => {
//   const { email } = req.body;

//   const user = await userService.getUserByEmail(email);
//   if (!user) {
//     return res.status(httpStatus.NOT_FOUND).send({
//       message: "Invalid email or account doesn't exist. Please check your credentials or register.",
//     });
//   }

//   const { token, expiryMinutes } = await tokenService.generateMagicLink(email, {
//     name: user.name,
//     isNewRegistration: false,
//   });
//   const { otp, expiryMinutes: otpExpiryMinutes } = await tokenService.generateOtp(email, {
//     name: user.name,
//     isNewRegistration: false,
//   });

//   // await emailService.sendMagicLinkEmail(email, token, otp, user.name, false);

//   res.status(httpStatus.OK).send({
//     error: false,
//     statusCode: httpStatus.OK,
//     message: 'Magic link and Otp sent to your email',
//     magicLinkExpires: expiryMinutes,
//     otpExpires: otpExpiryMinutes,
//   });
// });

// const loginWithGoogle = catchAsync(async (req, res) => {
//   const { access_token, token_type, credential } = req.body;

//   let userInfo;

//   // if (credential) {
//   //   const ticket = await googleClient.verifyIdToken({
//   //     idToken: credential,
//   //     audience: process.env.GOOGLE_CLIENT_ID,
//   //   });

//   //   const payload = ticket.getPayload();
//   //   if (!payload) {
//   //     throw new ApiError(httpStatus.BAD_REQUEST, 'Invalid Google ID token');
//   //   }

//   //   userInfo = {
//   //     data: {
//   //       email: payload.email,
//   //       name: payload.name,
//   //       picture: payload.picture,
//   //     },
//   //   };
//   // } else if (access_token && token_type) {
//   //   userInfo = await axios.get('https://www.googleapis.com/oauth2/v3/userinfo', {
//   //     headers: {
//   //       Authorization: `${token_type} ${access_token}`,
//   //     },
//   //   });
//   // }

//   if (!userInfo || !userInfo.data) {
//     throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Failed to fetch user info from Google');
//   }

//   const { user } = await userService.createOrUpdateUser({
//     email: userInfo.data.email,
//     name: userInfo.data.name,
//     avatar: userInfo.data.picture,
//     authProviders: [{ provider: 'google', lastLogin: Date.now() }],
//     isEmailVerified: true,
//   });

//   const tokens = await tokenService.generateAuthTokens(user);

//   const cookieOptions = {
//     httpOnly: true,
//     secure: process.env.NODE_ENV === 'production',
//     sameSite: process.env.NODE_ENV === 'production' ? 'lax' : 'strict',
//     path: '/',
//     domain: process.env.NODE_ENV === 'production' ? '.vlon.ai' : undefined,
//   };

//   res.cookie('accessToken', tokens.access.token, {
//     ...cookieOptions,
//     expires: tokens.access.expires,
//   });

//   res.cookie('refreshToken', tokens.refresh.token, {
//     ...cookieOptions,
//     expires: tokens.refresh.expires,
//   });

//   res.status(httpStatus.OK).send({
//     error: false,
//     statusCode: httpStatus.OK,
//     user,
//     message: 'Google authentication successful',
//   });
// });

// const verifyMagicLink = catchAsync(async (req, res) => {
//   const { token } = req.params;

//   const tokenDoc = await authService.verifyMagicLink(token);

//   const name = tokenDoc.metadata && tokenDoc.metadata.name;

//   const { user } = await userService.createOrUpdateUser({
//     email: tokenDoc.user,
//     name: name,
//     authProviders: [{ provider: 'email', lastLogin: Date.now() }],
//     isEmailVerified: true,
//   });

//   const tokens = await tokenService.generateAuthTokens(user);

//   const cookieOptions = {
//     httpOnly: true,
//     secure: process.env.NODE_ENV === 'production',
//     sameSite: process.env.NODE_ENV === 'production' ? 'lax' : 'strict',
//     path: '/',
//     domain: process.env.NODE_ENV === 'production' ? '.vlon.ai' : undefined,
//   };

//   res.cookie('accessToken', tokens.access.token, {
//     ...cookieOptions,
//     expires: tokens.access.expires,
//   });

//   res.cookie('refreshToken', tokens.refresh.token, {
//     ...cookieOptions,
//     expires: tokens.refresh.expires,
//   });

//   res.status(httpStatus.OK).send({
//     error: false,
//     statusCode: httpStatus.OK,
//     message: 'Magic link verified',
//   });
// });

// const verifyOtp = catchAsync(async (req, res) => {
//   const { email, otp } = req.body;

//   const tokenDoc = await authService.verifyOtp(email, otp);

//   const name = tokenDoc.metadata && tokenDoc.metadata.name;

//   const { user } = await userService.createOrUpdateUser({
//     email: tokenDoc.user,
//     name: name,
//     authProviders: [{ provider: 'email', lastLogin: Date.now() }],
//     isEmailVerified: true,
//   });

//   const tokens = await tokenService.generateAuthTokens(user);

//   const cookieOptions = {
//     httpOnly: true,
//     secure: process.env.NODE_ENV === 'production',
//     sameSite: process.env.NODE_ENV === 'production' ? 'lax' : 'strict',
//     path: '/',
//     domain: process.env.NODE_ENV === 'production' ? '.vlon.ai' : undefined,
//   };

//   res.cookie('accessToken', tokens.access.token, {
//     ...cookieOptions,
//     expires: tokens.access.expires,
//   });

//   res.cookie('refreshToken', tokens.refresh.token, {
//     ...cookieOptions,
//     expires: tokens.refresh.expires,
//   });

//   res.status(httpStatus.OK).send({
//     error: false,
//     statusCode: httpStatus.OK,
//     message: 'OTP verified successfully',
//   });
// });

// const logout = catchAsync(async (req, res) => {
//   const refreshToken = req.cookies.refreshToken;
//   if (refreshToken) {
//     await authService.logout(refreshToken);
//   }

//   const cookieOptions = {
//     httpOnly: true,
//     secure: process.env.NODE_ENV === 'production',
//     sameSite: process.env.NODE_ENV === 'production' ? 'lax' : 'strict',
//     path: '/',
//     domain: process.env.NODE_ENV === 'production' ? '.vlon.ai' : undefined,
//   };

//   // Clear the cookies
//   res.clearCookie('accessToken', cookieOptions);
//   res.clearCookie('refreshToken', cookieOptions);

//   res.status(httpStatus.NO_CONTENT).send();
// });

// const refreshToken = catchAsync(async (req, res) => {
//   const refreshTokenFromCookie = req.cookies.refreshToken;

//   if (!refreshTokenFromCookie) {
//     throw new ApiError(httpStatus.UNAUTHORIZED, 'Refresh token is required');
//   }

//   const userId = await authService.refreshAuth(refreshTokenFromCookie);
//   const user = await userService.getUserById(userId);

//   if (!user) {
//     throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
//   }

//   const tokens = await tokenService.generateAuthTokens(user);

//   const cookieOptions = {
//     httpOnly: true,
//     secure: process.env.NODE_ENV === 'production',
//     sameSite: process.env.NODE_ENV === 'production' ? 'lax' : 'strict',
//     path: '/',
//     domain: process.env.NODE_ENV === 'production' ? '.vlon.ai' : undefined,
//   };

//   res.cookie('accessToken', tokens.access.token, {
//     ...cookieOptions,
//     expires: tokens.access.expires,
//   });

//   res.cookie('refreshToken', tokens.refresh.token, {
//     ...cookieOptions,
//     expires: tokens.refresh.expires,
//   });

//   res.status(httpStatus.OK).send({ error: false, statusCode: httpStatus.OK, message: 'Auth refreshed successfully' });
// });

// module.exports = {
//   register,
//   login,
//   loginWithGoogle,
//   verifyMagicLink,
//   verifyOtp,
//   logout,
//   refreshToken,
// };
