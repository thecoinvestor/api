const auth = require('../config/auth');

let fromNodeHeaders;

// Dynamic import for ESM module
const initBetterAuth = async () => {
  if (!fromNodeHeaders) {
    const betterAuthNode = await import('better-auth/node');
    fromNodeHeaders = betterAuthNode.fromNodeHeaders;
  }
  return fromNodeHeaders;
};

const authMiddlewareHandler = async function (req, res, next) {
  try {
    const fromNodeHeaders = await initBetterAuth();
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
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(500).json({
      success: false,
      message: 'Authentication error',
    });
  }
};

const adminMiddleware = async function (req, res, next) {
  try {
    const fromNodeHeaders = await initBetterAuth();
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
  } catch (error) {
    console.error('Admin middleware error:', error);
    return res.status(500).json({
      success: false,
      message: 'Authentication error',
    });
  }
};

exports.adminMiddleware = adminMiddleware;
exports.authMiddleware = authMiddlewareHandler;
exports.authMiddlewareHandler = authMiddlewareHandler;
