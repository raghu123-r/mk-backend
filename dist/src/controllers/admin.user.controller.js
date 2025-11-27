// ADMIN: users
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import User from '../models/User.js';
import { ROLES } from '../constants/roles.js';

/**
 * Generate a secure random password
 */
const generateSecurePassword = () => {
  return crypto.randomBytes(16).toString('hex');
};

/**
 * POST /api/admin/users
 * Create admin user
 */
export const createAdminUser = async (req, res) => {
  try {
    const { name, email, role, password } = req.body;

    // Validate required fields
    if (!email) {
      return res.status(400).json({
        statusCode: 400,
        success: false,
        error: { message: 'Email is required' },
        data: null
      });
    }

    if (!name) {
      return res.status(400).json({
        statusCode: 400,
        success: false,
        error: { message: 'Name is required' },
        data: null
      });
    }

    // Validate role is admin or elevated
    const allowedRoles = [ROLES.ADMIN, ROLES.SUPER_ADMIN, 'admin'];
    const userRole = role || ROLES.ADMIN;
    
    if (!allowedRoles.includes(userRole)) {
      return res.status(400).json({
        statusCode: 400,
        success: false,
        error: { message: 'Only admin roles can be created through this endpoint' },
        data: null
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({
        statusCode: 400,
        success: false,
        error: { message: 'User with this email already exists' },
        data: null
      });
    }

    // Generate or use provided password
    const plainPassword = password || generateSecurePassword();
    
    // Create user
    const user = new User({
      name,
      email: email.toLowerCase(),
      role: userRole,
      isActive: true
    });

    // Hash and set password
    await user.setPassword(plainPassword);
    await user.save();

    // Return user data with generated password (only time it's sent)
    const responseData = {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
      createdAt: user.createdAt
    };

    // Include generated password in response if it was auto-generated
    if (!password) {
      responseData.generatedPassword = plainPassword;
      responseData.passwordNote = 'Save this password - it will not be shown again';
    }

    return res.status(201).json({
      statusCode: 201,
      success: true,
      error: null,
      data: responseData
    });
  } catch (error) {
    console.error('Error creating admin user:', error);
    return res.status(500).json({
      statusCode: 500,
      success: false,
      error: { message: 'Failed to create admin user' },
      data: null
    });
  }
};

/**
 * GET /api/admin/users
 * List admin users with pagination and search
 */
export const listAdminUsers = async (req, res) => {
  try {
    const { page = 1, limit = 20, search, role } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Build query for admin users only
    const query = {
      role: { $in: [ROLES.ADMIN, ROLES.SUPER_ADMIN, 'admin'] }
    };

    // Add search filter
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    // Filter by specific role if provided
    if (role) {
      query.role = role;
    }

    // Fetch users
    const users = await User.find(query)
      .select('-passwordHash')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await User.countDocuments(query);

    return res.status(200).json({
      statusCode: 200,
      success: true,
      error: null,
      data: {
        users,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(total / parseInt(limit))
        }
      }
    });
  } catch (error) {
    console.error('Error listing admin users:', error);
    return res.status(500).json({
      statusCode: 500,
      success: false,
      error: { message: 'Failed to list admin users' },
      data: null
    });
  }
};

/**
 * GET /api/admin/users/:id
 * Get admin user by ID
 */
export const getAdminUser = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        statusCode: 400,
        success: false,
        error: { message: 'Invalid user ID' },
        data: null
      });
    }

    // Fetch user
    const user = await User.findById(id).select('-passwordHash');

    if (!user) {
      return res.status(404).json({
        statusCode: 404,
        success: false,
        error: { message: 'User not found' },
        data: null
      });
    }

    // Verify it's an admin user
    const adminRoles = [ROLES.ADMIN, ROLES.SUPER_ADMIN, 'admin'];
    if (!adminRoles.includes(user.role)) {
      return res.status(403).json({
        statusCode: 403,
        success: false,
        error: { message: 'User is not an admin' },
        data: null
      });
    }

    return res.status(200).json({
      statusCode: 200,
      success: true,
      error: null,
      data: user
    });
  } catch (error) {
    console.error('Error fetching admin user:', error);
    return res.status(500).json({
      statusCode: 500,
      success: false,
      error: { message: 'Failed to fetch admin user' },
      data: null
    });
  }
};

/**
 * PUT /api/admin/users/:id
 * Update admin user
 */
export const updateAdminUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, role, isActive, password } = req.body;

    // Validate ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        ok: false,
        error: 'Invalid user ID'
      });
    }

    // Fetch user
    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({
        ok: false,
        error: 'User not found'
      });
    }

    // Verify it's an admin user
    const adminRoles = [ROLES.ADMIN, ROLES.SUPER_ADMIN, 'admin'];
    if (!adminRoles.includes(user.role)) {
      return res.status(403).json({
        ok: false,
        error: 'User is not an admin'
      });
    }

    // Update fields
    if (name) user.name = name;
    if (email) {
      // Check if email is already taken by another user
      const existingUser = await User.findOne({ 
        email: email.toLowerCase(), 
        _id: { $ne: id } 
      });
      if (existingUser) {
        return res.status(400).json({
          statusCode: 400,
          success: false,
          error: { message: 'Email already in use' },
          data: null
        });
      }
      user.email = email.toLowerCase();
    }
    if (role && adminRoles.includes(role)) {
      user.role = role;
    }
    if (typeof isActive === 'boolean') {
      user.isActive = isActive;
    }

    // Update password if provided
    if (password) {
      await user.setPassword(password);
    }

    await user.save();

    // Return updated user (without password hash)
    const updatedUser = await User.findById(id).select('-passwordHash');

    return res.status(200).json({
      statusCode: 200,
      success: true,
      error: null,
      data: updatedUser
    });
  } catch (error) {
    console.error('Error updating admin user:', error);
    return res.status(500).json({
      statusCode: 500,
      success: false,
      error: { message: 'Failed to update admin user' },
      data: null
    });
  }
};

/**
 * DELETE /api/admin/users/:id
 * Delete (soft delete) admin user
 */
export const deleteAdminUser = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        statusCode: 400,
        success: false,
        error: { message: 'Invalid user ID' },
        data: null
      });
    }

    // Fetch user
    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({
        statusCode: 404,
        success: false,
        error: { message: 'User not found' },
        data: null
      });
    }

    // Verify it's an admin user
    const adminRoles = [ROLES.ADMIN, ROLES.SUPER_ADMIN, 'admin'];
    if (!adminRoles.includes(user.role)) {
      return res.status(403).json({
        statusCode: 403,
        success: false,
        error: { message: 'User is not an admin' },
        data: null
      });
    }

    // Soft delete: set isActive to false
    user.isActive = false;
    await user.save();

    return res.status(200).json({
      statusCode: 200,
      success: true,
      error: null,
      data: {
        message: 'Admin user deactivated successfully',
        userId: id
      }
    });
  } catch (error) {
    console.error('Error deleting admin user:', error);
    return res.status(500).json({
      statusCode: 500,
      success: false,
      error: { message: 'Failed to delete admin user' },
      data: null
    });
  }
};
