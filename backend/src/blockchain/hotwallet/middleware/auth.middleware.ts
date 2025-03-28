import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

// Make the User interface more flexible to work with existing code
interface User {
  // Make id optional and add userId to match existing app structure
  id?: string;
  userId?: string;
  email: string;
  isAdmin?: boolean;
  roles?: string[];
}

// Add a flexible RequestWithUser interface that works with Express
interface RequestWithUser extends Request {
  user?: User;
}

// Define the JWT payload structure
interface JWTPayload {
  sub: string;
  email: string;
  role?: string;
  roles?: string[];
  iat?: number;
  exp?: number;
}

/**
 * JWT authentication middleware for hot wallet endpoints
 * @param req Express request
 * @param res Express response
 * @param next Next function
 */
export const jwtAuthMiddleware = (req: RequestWithUser, res: Response, next: NextFunction) => {
  // Get token from authorization header
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    // Extract token
    const token = authHeader.substring(7);
    
    // Verify token with JWT secret (should be from config in production)
    const jwtSecret = process.env.JWT_SECRET || 'your_jwt_secret_here';
    const payload = jwt.verify(token, jwtSecret) as JWTPayload;

    // Set user info to request for downstream use
    req.user = {
      id: payload.sub,
      email: payload.email,
      roles: payload.roles || (payload.role ? [payload.role] : [])
    };

    next();
  } catch (error) {
    return res.status(401).json({ 
      statusCode: 401,
      message: 'Invalid or expired token',
      error: 'Unauthorized'
    });
  }
};

/**
 * Role-based access control middleware for the hot wallet system
 * Checks if the user has the required roles
 */
export const checkRoles = (roles: string[]) => {
  return (req: RequestWithUser, res: Response, next: NextFunction) => {
    // Skip check if no roles required
    if (!roles || !roles.length) {
      return next();
    }

    // Make sure user info is available
    if (!req.user) {
      return res.status(401).json({
        statusCode: 401,
        message: 'Authentication required',
        error: 'Unauthorized'
      });
    }

    // Check if user has required role
    const userRoles = req.user.roles || [];
    const hasRequiredRole = roles.some(role => userRoles.includes(role));
    if (!hasRequiredRole) {
      return res.status(403).json({
        statusCode: 403,
        message: 'Insufficient permissions',
        error: 'Forbidden'
      });
    }

    next();
  };
};