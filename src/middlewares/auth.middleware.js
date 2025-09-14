const auth = require('../config/auth.js');
const { fromNodeHeaders } = require('better-auth/node');

const authMiddlewareHandler = async function (req, res, next) {
  const session = await auth.api.getSession({
    headers: fromNodeHeaders(req.headers),
  });

  if (!session) {
    // console.log('No session - sending 401 response');
    return res.status(401).json({
      success: false,
      message: 'Unauthorized - Please login first',
    });
  }
  req.user = session.user;
  req.email = session.user.email;
  next();
};
exports.authMiddleware = authMiddlewareHandler;
exports.authMiddlewareHandler = authMiddlewareHandler;
