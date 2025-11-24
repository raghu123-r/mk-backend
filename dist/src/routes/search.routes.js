import express from "express";
import Product from "../models/Product.js";   // ✅ Correct file
import Brand from "../models/Brand.js";       // ✅ Correct file
import Category from "../models/Category.js"; // ✅ Correct file

const router = express.Router();

// 🔍 Search Products
router.get("/products", async (req, res) => {
  try {
    const q = req.query.q || "";

    // FIX: Product model uses "title" field, not "name"
    // Search in title, slug, and description for better results
    const products = await Product.find({
      $or: [
        { title: { $regex: q, $options: "i" } },
        { slug: { $regex: q, $options: "i" } },
        { description: { $regex: q, $options: "i" } },
      ],
      isActive: true,
    })
      .populate("brand", "name slug logoUrl")
      .populate("category", "name slug")
      .limit(50);

    // Add source metadata for frontend
    const productsWithSource = products.map((p) => ({
      ...p.toObject(),
      source: "product",
    }));

    res.json({ data: productsWithSource });
  } catch (error) {
    console.error("Search products error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// 🔍 Search Brands
router.get("/brands", async (req, res) => {
  try {
    const q = req.query.q || "";

    const brands = await Brand.find({
      $or: [
        { name: { $regex: q, $options: "i" } },
        { slug: { $regex: q, $options: "i" } },
      ],
    }).limit(20);

    // For each brand, also fetch associated products
    const brandsWithProducts = await Promise.all(
      brands.map(async (brand) => {
        const products = await Product.find({
          brand: brand._id,
          isActive: true,
        })
          .populate("brand", "name slug logoUrl")
          .populate("category", "name slug")
          .limit(20);

        return {
          brand: { ...brand.toObject(), source: "brand" },
          products: products.map((p) => ({
            ...p.toObject(),
            source: "brand",
          })),
        };
      })
    );

    res.json({ data: brandsWithProducts });
  } catch (error) {
    console.error("Search brands error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// 🔍 Search Categories
router.get("/categories", async (req, res) => {
  try {
    const q = req.query.q || "";

    const categories = await Category.find({
      $or: [
        { name: { $regex: q, $options: "i" } },
        { slug: { $regex: q, $options: "i" } },
      ],
    }).limit(20);

    // For each category, also fetch associated products
    const categoriesWithProducts = await Promise.all(
      categories.map(async (category) => {
        const products = await Product.find({
          category: category._id,
          isActive: true,
        })
          .populate("brand", "name slug logoUrl")
          .populate("category", "name slug")
          .limit(20);

        return {
          category: { ...category.toObject(), source: "category" },
          products: products.map((p) => ({
            ...p.toObject(),
            source: "category",
          })),
        };
      })
    );

    res.json({ data: categoriesWithProducts });
  } catch (error) {
    console.error("Search categories error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// 🔍 Unified Search Endpoint
router.get("/", async (req, res) => {
  try {
    const q = req.query.q || "";

    if (!q.trim()) {
      return res.json({ products: [], brands: [], categories: [] });
    }

    // Search products by title, slug, description
    const products = await Product.find({
      $or: [
        { title: { $regex: q, $options: "i" } },
        { slug: { $regex: q, $options: "i" } },
        { description: { $regex: q, $options: "i" } },
      ],
      isActive: true,
    })
      .populate("brand", "name slug logoUrl")
      .populate("category", "name slug")
      .limit(50);

    // Search brands
    const brands = await Brand.find({
      $or: [
        { name: { $regex: q, $options: "i" } },
        { slug: { $regex: q, $options: "i" } },
      ],
    }).limit(20);

    // Search categories
    const categories = await Category.find({
      $or: [
        { name: { $regex: q, $options: "i" } },
        { slug: { $regex: q, $options: "i" } },
      ],
    }).limit(20);

    // Fetch products for matched brands
    let brandProducts = [];
    if (brands.length > 0) {
      const brandIds = brands.map((b) => b._id);
      brandProducts = await Product.find({
        brand: { $in: brandIds },
        isActive: true,
      })
        .populate("brand", "name slug logoUrl")
        .populate("category", "name slug")
        .limit(50);
    }

    // Fetch products for matched categories
    let categoryProducts = [];
    if (categories.length > 0) {
      const categoryIds = categories.map((c) => c._id);
      categoryProducts = await Product.find({
        category: { $in: categoryIds },
        isActive: true,
      })
        .populate("brand", "name slug logoUrl")
        .populate("category", "name slug")
        .limit(50);
    }

    // Merge and deduplicate products by _id
    const allProducts = [
      ...products.map((p) => ({ ...p.toObject(), source: "product" })),
      ...brandProducts.map((p) => ({ ...p.toObject(), source: "brand" })),
      ...categoryProducts.map((p) => ({ ...p.toObject(), source: "category" })),
    ];

    // Deduplicate by _id
    const uniqueProducts = Object.values(
      allProducts.reduce((acc, product) => {
        const key = product._id.toString();
        if (!acc[key]) {
          acc[key] = product;
        }
        return acc;
      }, {})
    );

    res.json({
      products: uniqueProducts,
      brands: brands.map((b) => ({ ...b.toObject(), source: "brand" })),
      categories: categories.map((c) => ({ ...c.toObject(), source: "category" })),
    });
  } catch (error) {
    console.error("Unified search error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
