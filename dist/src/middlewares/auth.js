import jwt from 'jsonwebtoken';
import createError from 'http-errors';
import User from '../models/User.js';
import { ROLES } from '../constants/roles.js';

/**
 * Main authentication middleware - verifies JWT token and attaches user to request
 */
export const protect = async (req, _res, next) => {
  const auth = req.headers.authorization?.split(' ');
  const token = (auth?.[0] === 'Bearer' && auth[1]) || req.cookies?.adminToken || req.cookies?.accessToken;
  if (!token) return next(createError(401, 'Not authenticated'));

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET || 'secretkey');
    // Handle both token formats: {sub: userId} and {id: userId}
    const userId = payload.sub || payload.id;
    const user = await User.findById(userId);
    if (!user || !user.isActive) return next(createError(401, 'Invalid user'));
    req.user = { id: user._id, role: user.role, email: user.email };
    next();
  } catch {
    next(createError(401, 'Token invalid/expired'));
  }
};

/**
 * Authentication middleware - verifies JWT token and attaches full user to request
 * Sets both req.user and req.admin for backward compatibility
 * Reads token from adminToken cookie OR Authorization header
 */
export const requireAuth = async (req, res, next) => {
  const auth = req.headers.authorization?.split(' ');
  const token = (auth?.[0] === 'Bearer' && auth[1]) || req.cookies?.adminToken || req.cookies?.accessToken;
  
  if (!token) {
    return res.status(401).json({
      ok: false,
      error: 'Not authenticated'
    });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET || 'secretkey');
    
    // Handle both token formats: {sub: userId} and {id: userId}
    const userId = payload.sub || payload.id;
    
    if (!userId) {
      return res.status(401).json({
        ok: false,
        error: 'Invalid token format'
      });
    }
    
    const user = await User.findById(userId);
    
    if (!user || !user.isActive) {
      return res.status(401).json({
        ok: false,
        error: 'Invalid user'
      });
    }
    
    // Attach user to request (with full user object for admin routes)
    req.user = {
      _id: user._id,
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role
    };
    
    // Also set req.admin for backward compatibility
    req.admin = req.user;
    
    next();
  } catch (error) {
    return res.status(401).json({
      ok: false,
      error: 'Token invalid or expired'
    });
  }
};

/**
 * Admin authorization middleware - checks if user has admin role
 * Must be used after requireAuth
 */
export const requireAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      ok: false,
      error: 'Authentication required'
    });
  }

  // Check if user has admin or super_admin role
  const adminRoles = [ROLES.ADMIN, ROLES.SUPER_ADMIN, 'admin', 'super_admin'];
  
  if (!adminRoles.includes(req.user.role)) {
    return res.status(403).json({
      ok: false,
      error: 'Admin access required'
    });
  }

  next();
};

/**
 * Simple authenticate middleware for testing
 */
const authenticate = (req, res, next) => {
  try {
    const auth = req.headers.authorization || '';
    const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
    if (!token) return res.status(401).json({ message: 'Unauthorized' });

    const secret = process.env.JWT_SECRET || 'secretkey';
    const payload = jwt.verify(token, secret);
    req.user = payload;
    return next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid token' });
  }
};

/**
 * Alias exports for compatibility with different import patterns
 */
export const requireAuthMiddleware = requireAuth;
export const isAdmin = requireAdmin;
export default authenticate;
