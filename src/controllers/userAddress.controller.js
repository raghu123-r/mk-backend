import User from '../models/User.js';
import { successResponse, errorResponse } from '../utils/response.js';

export const getAddresses = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('addresses').lean();
    return res.status(200).json(successResponse(user?.addresses || []));
  } catch (err) {
    console.error('getAddresses error', err);
    return res.status(500).json(errorResponse('Server error'));
  }
};

export const addAddress = async (req, res) => {
  try {
    const { name, phone, line1, line2, city, state, country, pincode, isDefault } = req.body;
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json(errorResponse('User not found'));

    if (isDefault) user.addresses.forEach(a => (a.isDefault = false));
    user.addresses.push({ name, phone, line1, line2, city, state, country, pincode, isDefault: !!isDefault });
    await user.save();
    return res.status(201).json(successResponse(user.addresses, 'Address added'));
  } catch (err) {
    console.error('addAddress error', err);
    return res.status(500).json(errorResponse('Server error'));
  }
};

export const updateAddress = async (req, res) => {
  try {
    const idx = parseInt(req.params.index, 10);
    const updates = req.body || {};
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json(errorResponse('User not found'));
    if (isNaN(idx) || idx < 0 || idx >= user.addresses.length) return res.status(404).json(errorResponse('Address not found'));

    if (updates.isDefault) user.addresses.forEach(a => (a.isDefault = false));
    Object.assign(user.addresses[idx], updates);
    await user.save();
    return res.status(200).json(successResponse(user.addresses, 'Address updated'));
  } catch (err) {
    console.error('updateAddress error', err);
    return res.status(500).json(errorResponse('Server error'));
  }
};

export const deleteAddress = async (req, res) => {
  try {
    const idx = parseInt(req.params.index, 10);
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json(errorResponse('User not found'));
    if (isNaN(idx) || idx < 0 || idx >= user.addresses.length) return res.status(404).json(errorResponse('Address not found'));

    user.addresses.splice(idx, 1);
    await user.save();
    return res.status(200).json(successResponse(user.addresses, 'Address deleted'));
  } catch (err) {
    console.error('deleteAddress error', err);
    return res.status(500).json(errorResponse('Server error'));
  }
};
