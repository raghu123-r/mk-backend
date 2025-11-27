// controllers/category.controller.js
import Category from "../models/Category.js";

const mapCategory = (c) => ({
  _id: c._id,
  name: c.name,
  slug: c.slug,
  description: c.description || "",
  image: c.image || "",
  image_url: c.image_url || c.image || "",
  createdAt: c.createdAt,
  updatedAt: c.updatedAt,
});

// Get all categories
export const getCategories = async (req, res) => {
  try {
    const categories = await Category.find().sort({ name: 1 });

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
