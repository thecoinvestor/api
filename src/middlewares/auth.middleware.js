const { fromNodeHeaders } = require('better-auth/node');
const auth = require('../config/auth');

const authMiddlewareHandler = async function (req, res, next) {
  const session = await auth.api.getSession({
    headers: fromNodeHeaders(req.headers),
  });

  if (!session) {
    return res.status(401).json({
      success: false,
      message: 'Unauthorized - Please login first',
    });
  }
  req.user = session.user;
  req.email = session.user.email;
  next();
};

const adminMiddleware = async function (req, res, next) {
  const session = await auth.api.getSession({
    headers: fromNodeHeaders(req.headers),
  });

  if (!session) {
    return res.status(401).json({
      success: false,
      message: 'Unauthorized - Please login first',
    });
  }

  if (!session.user.isAdmin) {
    return res.status(403).json({
      success: false,
      message: 'Forbidden - Admin access required',
    });
  }

  req.user = session.user;
  req.email = session.user.email;
  next();
};

exports.adminMiddleware = adminMiddleware;
exports.authMiddleware = authMiddlewareHandler;
exports.authMiddlewareHandler = authMiddlewareHandler;
