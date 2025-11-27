/**
 * User Profile Controller
 * 
 * Handles user profile viewing and editing
 * 
 * Sample curl commands:
 * 
 * GET profile:
 *   curl -H "Authorization: Bearer <TOKEN>" http://localhost:5001/user/profile
 * 
 * PATCH profile (update name + phone):
 *   curl -X PATCH -H "Content-Type: application/json" \
 *        -H "Authorization: Bearer <TOKEN>" \
 *        -d '{"name":"Ravi Kumar","phone":"9876543210"}' \
 *        http://localhost:5001/user/profile
 * 
 * PATCH profile (update email):
 *   curl -X PATCH -H "Content-Type: application/json" \
 *        -H "Authorization: Bearer <TOKEN>" \
 *        -d '{"email":"newemail@example.com"}' \
 *        http://localhost:5001/user/profile
 * 
 * Invalid phone (should return 400):
 *   curl -X PATCH -H "Content-Type: application/json" \
 *        -H "Authorization: Bearer <TOKEN>" \
 *        -d '{"phone":"12345"}' \
 *        http://localhost:5001/user/profile
 */

import User from '../models/User.js';
import { successResponse, errorResponse } from '../utils/response.js';

/**
 * GET /user/profile
 * Returns authenticated user's profile (safe fields only)
 */
export const getProfile = async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    
    // Fetch user with lean() for better performance
    const user = await User.findById(userId)
      .select('_id name email phone createdAt addresses wishlist')
      .lean();
    
    if (!user) {
      return res.status(404).json(
        errorResponse('User not found', null, 404)
      );
    }
    
    // Return safe profile fields
    const profile = {
      _id: user._id,
      name: user.name || '',
      email: user.email,
      phone: user.phone || '',
      createdAt: user.createdAt,
      addresses: user.addresses || [],
      wishlistCount: user.wishlist?.length || 0
    };
    
    return res.status(200).json(successResponse(profile, null, 200));
    
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return res.status(500).json(
      errorResponse('Server error', null, 500)
    );
  }
};

/**
 * PATCH /user/profile
 * Updates authenticated user's profile
 * Allowed fields: name, email, phone
 */
export const updateProfile = async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    const { name, email, phone } = req.body;
    
    // Build update object with only allowed fields
    const updateData = {};
    
    if (name !== undefined) {
      updateData.name = name;
    }
    
    if (email !== undefined) {
      // Check if email already exists for another user
      const existingUser = await User.findOne({
        email: email.toLowerCase(),
        _id: { $ne: userId }
      });
      
      if (existingUser) {
        return res.status(409).json(
          errorResponse('Email already in use by another account', null, 409)
        );
      }
      
      updateData.email = email.toLowerCase();
    }
    
    if (phone !== undefined) {
      updateData.phone = phone;
    }
    
    // If no valid fields to update, return error
    if (Object.keys(updateData).length === 0) {
      return res.status(400).json(
        errorResponse('No valid fields to update', null, 400)
      );
    }
    
    // Update user
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $set: updateData },
      { new: true, runValidators: true }
    )
      .select('_id name email phone createdAt')
      .lean();
    
    if (!updatedUser) {
      return res.status(404).json(
        errorResponse('User not found', null, 404)
      );
    }
    
    return res.status(200).json(
      successResponse(updatedUser, 'Profile updated successfully', 200)
    );
    
  } catch (error) {
    console.error('Error updating user profile:', error);
    
    // Handle mongoose validation errors
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => ({
        field: err.path,
        message: err.message
      }));
      return res.status(400).json(
        errorResponse('Validation failed', errors, 400)
      );
    }
    
    // Handle duplicate key errors
    if (error.code === 11000) {
      return res.status(409).json(
        errorResponse('Email already exists', null, 409)
      );
    }
    
    return res.status(500).json(
      errorResponse('Server error', null, 500)
    );
  }
};
