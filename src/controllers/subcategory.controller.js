import SubCategory from "../models/SubCategory.js";
import Category from "../models/Category.js";

/**
 * GET /api/subcategories
 * Public – used by frontend
 * Query params:
 *   - category (slug)
 *   - homepage=true
 */
export const getSubCategories = async (req, res) => {
  try {
    const { category, homepage } = req.query;

    const filter = { isActive: true };

    // Filter by category slug
    if (category) {
      const parent = await Category.findOne({ slug: category, isActive: true });
      if (!parent) {
        return res.json([]);
      }
      filter.category = parent._id;
    }

    // Homepage section
    if (homepage === "true") {
      filter.showOnHomepage = true;
    }

    const subCategories = await SubCategory.find(filter)
      .populate("category", "name slug")
      .sort({ homepageOrder: 1, createdAt: -1 });

    res.json(subCategories);
  } catch (error) {
    console.error("getSubCategories error:", error);
    res.status(500).json({ message: "Failed to fetch subcategories" });
  }
};

/**
 * ADMIN ONLY
 */
export const getAllSubCategories = async (req, res) => {
  const data = await SubCategory.find()
    .populate("category", "name slug")
    .sort({ createdAt: -1 });
  res.json(data);
};

export const createSubCategory = async (req, res) => {
  const subCategory = await SubCategory.create(req.body);
  res.status(201).json(subCategory);
};

export const updateSubCategory = async (req, res) => {
  const updated = await SubCategory.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true }
  );
  res.json(updated);
};

export const deleteSubCategory = async (req, res) => {
  await SubCategory.findByIdAndDelete(req.params.id);
  res.json({ message: "SubCategory deleted" });
};

export const enableSubCategory = async (req, res) => {
  const updated = await SubCategory.findByIdAndUpdate(
    req.params.id,
    { isActive: true },
    { new: true }
  );
  res.json(updated);
};

export const disableSubCategory = async (req, res) => {
  const updated = await SubCategory.findByIdAndUpdate(
    req.params.id,
    { isActive: false },
    { new: true }
  );
  res.json(updated);
};
