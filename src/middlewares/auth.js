import jwt from 'jsonwebtoken';
import createError from 'http-errors';
import User from '../models/User.js';
import { ROLES } from '../constants/roles.js';

/**
 * Main authentication middleware - verifies JWT token and attaches user to request
 * FIXED: Never throws server error, always responds cleanly
 */
export const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const bearerToken =
      authHeader && authHeader.startsWith('Bearer ')
        ? authHeader.split(' ')[1]
        : null;

    const token =
      bearerToken ||
      req.cookies?.adminToken ||
      req.cookies?.accessToken;

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Please log in to continue'
      });
    }

    const payload = jwt.verify(
      token,
      process.env.JWT_SECRET || 'secretkey'
    );

    const userId = payload.sub || payload.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token'
      });
    }

    const user = await User.findById(userId);

    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Your session is invalid. Please log in again.'
      });
    }

    req.user = {
      id: user._id,
      role: user.role,
      email: user.email
    };

    next();
  } catch (err) {
    console.error('AUTH ERROR:', err.message);
    return res.status(401).json({
      success: false,
      message: 'Your session has expired. Please log in again.'
    });
  }
};

/* ---------------- ADMIN AUTH (UNCHANGED LOGIC) ---------------- */

export const requireAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const bearerToken =
      authHeader && authHeader.startsWith('Bearer ')
        ? authHeader.split(' ')[1]
        : null;

    const token =
      bearerToken ||
      req.cookies?.adminToken ||
      req.cookies?.accessToken;

    if (!token) {
      return res.status(401).json({
        ok: false,
        error: 'Please log in to continue'
      });
    }

    const payload = jwt.verify(
      token,
      process.env.JWT_SECRET || 'secretkey'
    );

    const userId = payload.sub || payload.id;

    const user = await User.findById(userId);

    if (!user || !user.isActive) {
      return res.status(401).json({
        ok: false,
        error: 'Your session is invalid. Please log in again.'
      });
    }

    req.user = {
      _id: user._id,
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role
    };

    req.admin = req.user;
    next();
  } catch {
    return res.status(401).json({
      ok: false,
      error: 'Your session has expired. Please log in again.'
    });
  }
};

export const requireAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      ok: false,
      error: 'Please log in to continue'
    });
  }

  const adminRoles = [
    ROLES.ADMIN,
    ROLES.SUPER_ADMIN,
    'admin',
    'super_admin'
  ];

  if (!adminRoles.includes(req.user.role)) {
    return res.status(403).json({
      ok: false,
      error: 'You do not have permission to access this resource'
    });
  }

  next();
};

export const requireAuthMiddleware = requireAuth;
export const isAdmin = requireAdmin;
