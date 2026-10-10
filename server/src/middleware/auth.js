import { verifyToken } from '../utils/jwt.js';

export const requireAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      error: { message: 'Authentication token required', code: 'UNAUTHENTICATED' }
    });
  }

  try {
    req.user = verifyToken(authHeader.split(' ')[1]);
    next();
  } catch (err) {
    return res.status(401).json({
      error: { message: 'Invalid or expired authentication token', code: 'INVALID_TOKEN' }
    });
  }
};

// Attaches req.user when a valid token is present; never rejects the request.
export const optionalAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    try {
      req.user = verifyToken(authHeader.split(' ')[1]);
    } catch {
      /* treat as anonymous */
    }
  }
  next();
};

export const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        error: {
          message: `Access denied. Requires one of the following roles: ${roles.join(', ')}`,
          code: 'FORBIDDEN'
        }
      });
    }
    next();
  };
};
