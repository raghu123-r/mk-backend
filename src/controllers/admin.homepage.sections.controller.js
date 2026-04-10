/**
 * Admin Homepage Sections Controller
 * Place this file at: src/controllers/admin.homepage.sections.controller.js
 */
import mongoose from 'mongoose';
import HomepageSection from '../models/HomepageSection.js';

// ─── Helper: populate a section with full refs ────────────────────────────────
async function populateSection(section) {
  return HomepageSection.findById(section._id)
    .populate('categoryIds', '_id name slug')
    .populate('brandIds', '_id name slug')
    .populate('productIds', '_id title slug images price mrp stock')
    .lean();
}

// ─── GET /api/admin/homepage/sections ────────────────────────────────────────
export const getSections = async (req, res) => {
  try {
    const sections = await HomepageSection.find()
      .sort({ displayOrder: 1 })
      .populate('categoryIds', '_id name slug')
      .populate('brandIds', '_id name slug')
      .populate('productIds', '_id title slug images price mrp stock')
      .lean();

    return res.status(200).json({
      statusCode: 200,
      success: true,
      error: null,
      data: sections,
    });
  } catch (error) {
    console.error('getSections error:', error);
    return res.status(500).json({
      statusCode: 500,
      success: false,
      error: { message: 'Failed to fetch homepage sections' },
      data: [],
    });
  }
};

// ─── POST /api/admin/homepage/sections ───────────────────────────────────────
export const createSection = async (req, res) => {
  try {
    const {
      title,
      sectionType,
      categoryIds,
      brandIds,
      discountType,
      minDiscount,
      maxDiscount,
      productIds,
    } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({
        statusCode: 400,
        success: false,
        error: { message: 'Section title is required' },
        data: null,
      });
    }

    // Set displayOrder to end of list
    const count = await HomepageSection.countDocuments();

    const section = await HomepageSection.create({
      title: title.trim(),
      sectionType: sectionType || 'products',
      displayOrder: count,
      categoryIds: categoryIds || [],
      brandIds: brandIds || [],
      discountType: discountType || '',
      minDiscount: minDiscount !== undefined && minDiscount !== '' ? Number(minDiscount) : null,
      maxDiscount: maxDiscount !== undefined && maxDiscount !== '' ? Number(maxDiscount) : null,
      productIds: productIds || [],
    });

    const populated = await populateSection(section);

    return res.status(201).json({
      statusCode: 201,
      success: true,
      error: null,
      data: populated,
    });
  } catch (error) {
    console.error('createSection error:', error);
    return res.status(500).json({
      statusCode: 500,
      success: false,
      error: { message: error.message || 'Failed to create section' },
      data: null,
    });
  }
};

// ─── PUT /api/admin/homepage/sections/reorder ────────────────────────────────
// IMPORTANT: This must be registered BEFORE /:id route in the router
export const reorderSections = async (req, res) => {
  try {
    const { order } = req.body; // [{ id, displayOrder }]

    if (!Array.isArray(order)) {
      return res.status(400).json({
        statusCode: 400,
        success: false,
        error: { message: 'order must be an array' },
        data: null,
      });
    }

    const bulkOps = order.map(({ id, displayOrder }) => ({
      updateOne: {
        filter: { _id: new mongoose.Types.ObjectId(id) },
        update: { $set: { displayOrder: Number(displayOrder) } },
      },
    }));

    await HomepageSection.bulkWrite(bulkOps);

    return res.status(200).json({
      statusCode: 200,
      success: true,
      error: null,
      data: { message: 'Sections reordered successfully' },
    });
  } catch (error) {
    console.error('reorderSections error:', error);
    return res.status(500).json({
      statusCode: 500,
      success: false,
      error: { message: 'Failed to reorder sections' },
      data: null,
    });
  }
};

// ─── GET /api/admin/homepage/sections/:id ────────────────────────────────────
export const getSectionById = async (req, res) => {
  try {
    const section = await HomepageSection.findById(req.params.id)
      .populate('categoryIds', '_id name slug')
      .populate('brandIds', '_id name slug')
      .populate('productIds', '_id title slug images price mrp stock')
      .lean();

    if (!section) {
      return res.status(404).json({
        statusCode: 404,
        success: false,
        error: { message: 'Section not found' },
        data: null,
      });
    }

    return res.status(200).json({
      statusCode: 200,
      success: true,
      error: null,
      data: section,
    });
  } catch (error) {
    console.error('getSectionById error:', error);
    return res.status(500).json({
      statusCode: 500,
      success: false,
      error: { message: 'Failed to fetch section' },
      data: null,
    });
  }
};

// ─── PUT /api/admin/homepage/sections/:id ────────────────────────────────────
export const updateSection = async (req, res) => {
  try {
    const {
      title,
      sectionType,
      categoryIds,
      brandIds,
      discountType,
      minDiscount,
      maxDiscount,
      productIds,
      isActive,
      displayOrder,
    } = req.body;

    const update = {};
    if (title !== undefined) update.title = title.trim();
    if (sectionType !== undefined) update.sectionType = sectionType;
    if (categoryIds !== undefined) update.categoryIds = categoryIds;
    if (brandIds !== undefined) update.brandIds = brandIds;
    if (discountType !== undefined) update.discountType = discountType;
    if (minDiscount !== undefined) update.minDiscount = minDiscount !== '' ? Number(minDiscount) : null;
    if (maxDiscount !== undefined) update.maxDiscount = maxDiscount !== '' ? Number(maxDiscount) : null;
    if (productIds !== undefined) update.productIds = productIds;
    if (isActive !== undefined) update.isActive = isActive;
    if (displayOrder !== undefined) update.displayOrder = displayOrder;

    const section = await HomepageSection.findByIdAndUpdate(
      req.params.id,
      { $set: update },
      { new: true, runValidators: true }
    );

    if (!section) {
      return res.status(404).json({
        statusCode: 404,
        success: false,
        error: { message: 'Section not found' },
        data: null,
      });
    }

    const populated = await populateSection(section);

    return res.status(200).json({
      statusCode: 200,
      success: true,
      error: null,
      data: populated,
    });
  } catch (error) {
    console.error('updateSection error:', error);
    return res.status(500).json({
      statusCode: 500,
      success: false,
      error: { message: error.message || 'Failed to update section' },
      data: null,
    });
  }
};

// ─── DELETE /api/admin/homepage/sections/:id ─────────────────────────────────
export const deleteSection = async (req, res) => {
  try {
    const section = await HomepageSection.findByIdAndDelete(req.params.id);

    if (!section) {
      return res.status(404).json({
        statusCode: 404,
        success: false,
        error: { message: 'Section not found' },
        data: null,
      });
    }

    return res.status(200).json({
      statusCode: 200,
      success: true,
      error: null,
      data: { message: 'Section deleted successfully' },
    });
  } catch (error) {
    console.error('deleteSection error:', error);
    return res.status(500).json({
      statusCode: 500,
      success: false,
      error: { message: 'Failed to delete section' },
      data: null,
    });
  }
};