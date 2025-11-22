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

    res.status(200).json(updated);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch categories", error });
  }
};

// Get single category
export const getCategoryById = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category)
      return res.status(404).json({ message: "Category not found" });

    if (!category.slug) {
      category.slug = category.name.toLowerCase().replace(/\s+/g, "-");
      await category.save();
    }

    res.status(200).json(mapCategory(category));
  } catch (error) {
    res.status(500).json({ message: "Error fetching category", error });
  }
};

// Create category
export const createCategory = async (req, res) => {
  try {
    const payload = req.body || {};
    const category = new Category(payload);

    await category.save();
    res.status(201).json(mapCategory(category));
  } catch (error) {
    res.status(400).json({ message: "Error creating category", error });
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
      return res.status(404).json({ message: "Category not found" });

    if (!updated.slug) {
      updated.slug = updated.name.toLowerCase().replace(/\s+/g, "-");
      await updated.save();
    }

    res.status(200).json(mapCategory(updated));
  } catch (error) {
    res.status(400).json({ message: "Error updating category", error });
  }
};

// Delete category
export const deleteCategory = async (req, res) => {
  try {
    const deleted = await Category.findByIdAndDelete(req.params.id);
    if (!deleted)
      return res.status(404).json({ message: "Category not found" });

    res.status(200).json({ message: "Category deleted" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting category", error });
  }
};
