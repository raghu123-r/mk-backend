// controllers/category.controller.js
import Category from "../models/Category.js";
import Product from "../models/Product.js";

const mapCategory = (c) => ({
  _id: c._id,
  name: c.name,
  slug: c.slug,
  description: c.description || "",
  image: c.image || "",
  image_url: c.image_url || c.image || "",
  isActive: c.isActive !== undefined ? c.isActive : true,
  showOnHomepage: c.showOnHomepage || false,
  homepageOrder: c.homepageOrder || null,
  createdAt: c.createdAt,
  updatedAt: c.updatedAt,
});

// Get all categories
export const getCategories = async (req, res) => {
  try {
    // Public endpoint: only return active categories
    const categories = await Category.find({ isActive: true }).sort({ name: 1 });

    // Fix missing slugs in old records
    const updated = [];
    for (const c of categories) {
      if (!c.slug) {
        c.slug = c.name.toLowerCase().replace(/\s+/g, "-");
        await c.save();
      }
      updated.push(mapCategory(c));
    }

    return res.status(200).json({
      statusCode: 200,
      success: true,
      error: null,
      data: updated
    });
  } catch (error) {
    return res.status(500).json({
      statusCode: 500,
      success: false,
      error: { message: "Failed to fetch categories", details: error },
      data: null
    });
  }
};

// Get all categories (including disabled) - Admin only
export const getAllCategories = async (req, res) => {
  try {
    // Admin endpoint: return ALL categories including disabled ones with advanced search & filters
    const {
      page = 1,
      limit = 5,
      search = '',
      status = ''
    } = req.query;

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    // Support large limits for backward compatibility (e.g., 9999 for "all")
    const effectiveLimit = limitNum > 0 ? limitNum : 5;

    // Build filter query
    const filterQuery = {};

    // Global search on category name
    if (search && search.trim()) {
      filterQuery.name = { $regex: search.trim(), $options: 'i' };
    }

    // Status filter (active/inactive)
    if (status && status.trim()) {
      if (status === 'active') {
        filterQuery.isActive = true;
      } else if (status === 'inactive' || status === 'disabled') {
        filterQuery.isActive = false;
      }
    }

    // Execute query with filters and pagination
    const [categories, total] = await Promise.all([
      Category.find(filterQuery)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(effectiveLimit)
        .lean(),
      Category.countDocuments(filterQuery)
    ]);

    const totalPages = Math.ceil(total / effectiveLimit);

    // Fix missing slugs in old records and map
    const updated = [];
    for (const c of categories) {
      if (!c.slug) {
        c.slug = c.name.toLowerCase().replace(/\s+/g, "-");
        await Category.findByIdAndUpdate(c._id, { slug: c.slug });
      }
      updated.push(mapCategory(c));
    }

    return res.status(200).json({
      statusCode: 200,
      success: true,
      error: null,
      data: {
        categories: updated,
        total,
        page: pageNum,
        totalPages,
        limit: effectiveLimit,
        hasNextPage: pageNum < totalPages,
        hasPrevPage: pageNum > 1
      }
    });
  } catch (error) {
    return res.status(500).json({
      statusCode: 500,
      success: false,
      error: { message: "Failed to fetch categories", details: error },
      data: null
    });
  }
};

// Get single category
export const getCategoryById = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category)
      return res.status(404).json({
        statusCode: 404,
        success: false,
        error: { message: "Category not found" },
        data: null
      });

    // Public endpoint: only return if active
    if (!category.isActive) {
      return res.status(404).json({
        statusCode: 404,
        success: false,
        error: { message: "Category not found" },
        data: null
      });
    }

    if (!category.slug) {
      category.slug = category.name.toLowerCase().replace(/\s+/g, "-");
      await category.save();
    }

    return res.status(200).json({
      statusCode: 200,
      success: true,
      error: null,
      data: mapCategory(category)
    });
  } catch (error) {
    return res.status(500).json({
      statusCode: 500,
      success: false,
      error: { message: "Error fetching category", details: error },
      data: null
    });
  }
};

// Create category
export const createCategory = async (req, res) => {
  try {
    const payload = req.body || {};
    const category = new Category(payload);

    await category.save();
    return res.status(201).json({
      statusCode: 201,
      success: true,
      error: null,
      data: mapCategory(category)
    });
  } catch (error) {
    return res.status(400).json({
      statusCode: 400,
      success: false,
      error: { message: "Error creating category", details: error },
      data: null
    });
  }
};

// Update category
export const updateCategory = async (req, res) => {
  try {
    // Validate homepage fields
    if (req.body.showOnHomepage && req.body.homepageOrder !== undefined) {
      // Check homepageOrder is in valid range
      if (req.body.homepageOrder < 1 || req.body.homepageOrder > 4) {
        return res.status(400).json({
          statusCode: 400,
          success: false,
          error: { message: "homepageOrder must be between 1 and 4" },
          data: null
        });
      }

      // Check for duplicate homepageOrder
      const existingCategory = await Category.findOne({
        _id: { $ne: req.params.id },
        showOnHomepage: true,
        homepageOrder: req.body.homepageOrder
      });
      
      if (existingCategory) {
        return res.status(400).json({
          statusCode: 400,
          success: false,
          error: { message: `Homepage order ${req.body.homepageOrder} is already assigned to category "${existingCategory.name}"` },
          data: null
        });
      }
    }

    // If disabling homepage visibility, clear the order
    if (req.body.showOnHomepage === false) {
      req.body.homepageOrder = null;
    }

    const updated = await Category.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true,
      }
    );

    if (!updated)
      return res.status(404).json({
        statusCode: 404,
        success: false,
        error: { message: "Category not found" },
        data: null
      });

    if (!updated.slug) {
      updated.slug = updated.name.toLowerCase().replace(/\s+/g, "-");
      await updated.save();
    }

    return res.status(200).json({
      statusCode: 200,
      success: true,
      error: null,
      data: mapCategory(updated)
    });
  } catch (error) {
    return res.status(400).json({
      statusCode: 400,
      success: false,
      error: { message: "Error updating category", details: error },
      data: null
    });
  }
};

// Delete category
export const deleteCategory = async (req, res) => {
  try {
    const deleted = await Category.findByIdAndDelete(req.params.id);
    if (!deleted)
      return res.status(404).json({
        statusCode: 404,
        success: false,
        error: { message: "Category not found" },
        data: null
      });

    return res.status(200).json({
      statusCode: 200,
      success: true,
      error: null,
      data: { message: "Category deleted" }
    });
  } catch (error) {
    return res.status(500).json({
      statusCode: 500,
      success: false,
      error: { message: "Error deleting category", details: error },
      data: null
    });
  }
};

// Disable category (soft delete - preferred method)
export const disableCategory = async (req, res) => {
  try {
    const category = await Category.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true, runValidators: true }
    );
    
    if (!category)
      return res.status(404).json({
        statusCode: 404,
        success: false,
        error: { message: "Category not found" },
        data: null
      });

    return res.status(200).json({
      statusCode: 200,
      success: true,
      error: null,
      data: mapCategory(category)
    });
  } catch (error) {
    return res.status(500).json({
      statusCode: 500,
      success: false,
      error: { message: "Error disabling category", details: error },
      data: null
    });
  }
};

// Enable category
export const enableCategory = async (req, res) => {
  try {
    const category = await Category.findByIdAndUpdate(
      req.params.id,
      { isActive: true },
      { new: true, runValidators: true }
    );
    
    if (!category)
      return res.status(404).json({
        statusCode: 404,
        success: false,
        error: { message: "Category not found" },
        data: null
      });

    return res.status(200).json({
      statusCode: 200,
      success: true,
      error: null,
      data: mapCategory(category)
    });
  } catch (error) {
    return res.status(500).json({
      statusCode: 500,
      success: false,
      error: { message: "Error enabling category", details: error },
      data: null
    });
  }
};
