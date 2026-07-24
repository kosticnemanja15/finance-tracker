import { verifyToken } from '../utils/jwt.js';
import { UnauthorizedError, ForbiddenError } from '../errors/ApiError.js';

export function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return next(new UnauthorizedError('Authentication required'));
  }

  const parts = authHeader.split(' ');

  // Eksplicitna provera formata, ne .replace('Bearer ', '')
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return next(new UnauthorizedError('Invalid authorization format'));
  }

  const token = parts[1];

  try {
    const decoded = verifyToken(token);
    req.user = {
      id: decoded.sub,
      email: decoded.email,
      role: decoded.role,
    };
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return next(new UnauthorizedError('Token expired'));
    }
    if (err.name === 'JsonWebTokenError') {
      return next(new UnauthorizedError('Invalid token'));
    }
    return next(new UnauthorizedError('Authentication failed'));
  }
}

export function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return next(new UnauthorizedError('Authentication required'));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(new ForbiddenError(
        `Access denied. Required role: ${allowedRoles.join(' or ')}`
      ));
    }

    next();
  };
}