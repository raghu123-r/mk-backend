import express from "express";
import Product from "../models/Product.js";   // ✅ Correct file
import Brand from "../models/Brand.js";       // ✅ Correct file
import Category from "../models/Category.js"; // ✅ Correct file

const router = express.Router();

// 🔍 Search Products
router.get("/products", async (req, res) => {
  try {
    const q = req.query.q || "";

    // Use aggregation to filter by brand.isActive at query time
    const pipeline = [
      {
        $match: {
          $or: [
            { title: { $regex: q, $options: "i" } },
            { slug: { $regex: q, $options: "i" } },
            { description: { $regex: q, $options: "i" } },
          ],
          isActive: true,
        }
      },
      {
        $lookup: {
          from: "brands",
          localField: "brand",
          foreignField: "_id",
          as: "brandData",
        },
      },
      {
        $lookup: {
          from: "categories",
          localField: "category",
          foreignField: "_id",
          as: "categoryData",
        },
      },
      {
        $addFields: {
          brand: { $arrayElemAt: ["$brandData", 0] },
          category: { $arrayElemAt: ["$categoryData", 0] },
        },
      },
      {
        $match: {
          $or: [
            { brand: { $exists: false } },
            { "brand.isActive": { $ne: false } },
          ],
        },
      },
      { $limit: 50 },
    ];

    const products = await Product.aggregate(pipeline);

    // Add source metadata for frontend
    const productsWithSource = products.map((p) => ({
      ...p,
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
      isActive: true,
    }).limit(20);

    // For each brand, fetch associated products using aggregation
    const brandsWithProducts = await Promise.all(
      brands.map(async (brand) => {
        const pipeline = [
          {
            $match: {
              brand: brand._id,
              isActive: true,
            }
          },
          {
            $lookup: {
              from: "brands",
              localField: "brand",
              foreignField: "_id",
              as: "brandData",
            },
          },
          {
            $lookup: {
              from: "categories",
              localField: "category",
              foreignField: "_id",
              as: "categoryData",
            },
          },
          {
            $addFields: {
              brand: { $arrayElemAt: ["$brandData", 0] },
              category: { $arrayElemAt: ["$categoryData", 0] },
            },
          },
          {
            $match: {
              $or: [
                { brand: { $exists: false } },
                { "brand.isActive": { $ne: false } },
              ],
            },
          },
          { $limit: 20 },
        ];

        const products = await Product.aggregate(pipeline);

        return {
          brand: { ...brand.toObject(), source: "brand" },
          products: products.map((p) => ({
            ...p,
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

    // For each category, fetch associated products using aggregation
    const categoriesWithProducts = await Promise.all(
      categories.map(async (category) => {
        const pipeline = [
          {
            $match: {
              category: category._id,
              isActive: true,
            }
          },
          {
            $lookup: {
              from: "brands",
              localField: "brand",
              foreignField: "_id",
              as: "brandData",
            },
          },
          {
            $lookup: {
              from: "categories",
              localField: "category",
              foreignField: "_id",
              as: "categoryData",
            },
          },
          {
            $addFields: {
              brand: { $arrayElemAt: ["$brandData", 0] },
              category: { $arrayElemAt: ["$categoryData", 0] },
            },
          },
          {
            $match: {
              $or: [
                { brand: { $exists: false } },
                { "brand.isActive": { $ne: false } },
              ],
            },
          },
          { $limit: 20 },
        ];

        const products = await Product.aggregate(pipeline);

        return {
          category: { ...category.toObject(), source: "category" },
          products: products.map((p) => ({
            ...p,
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

    // Search products by title, slug, description using aggregation
    const productPipeline = [
      {
        $match: {
          $or: [
            { title: { $regex: q, $options: "i" } },
            { slug: { $regex: q, $options: "i" } },
            { description: { $regex: q, $options: "i" } },
          ],
          isActive: true,
        }
      },
      {
        $lookup: {
          from: "brands",
          localField: "brand",
          foreignField: "_id",
          as: "brandData",
        },
      },
      {
        $lookup: {
          from: "categories",
          localField: "category",
          foreignField: "_id",
          as: "categoryData",
        },
      },
      {
        $addFields: {
          brand: { $arrayElemAt: ["$brandData", 0] },
          category: { $arrayElemAt: ["$categoryData", 0] },
        },
      },
      {
        $match: {
          $or: [
            { brand: { $exists: false } },
            { "brand.isActive": { $ne: false } },
          ],
        },
      },
      { $limit: 50 },
    ];

    const products = await Product.aggregate(productPipeline);

    // Search brands (only active brands)
    const brands = await Brand.find({
      $or: [
        { name: { $regex: q, $options: "i" } },
        { slug: { $regex: q, $options: "i" } },
      ],
      isActive: true,
    }).limit(20);

    // Search categories
    const categories = await Category.find({
      $or: [
        { name: { $regex: q, $options: "i" } },
        { slug: { $regex: q, $options: "i" } },
      ],
    }).limit(20);

    // Fetch products for matched brands using aggregation
    let brandProducts = [];
    if (brands.length > 0) {
      const brandIds = brands.map((b) => b._id);
      const brandProductPipeline = [
        {
          $match: {
            brand: { $in: brandIds },
            isActive: true,
          }
        },
        {
          $lookup: {
            from: "brands",
            localField: "brand",
            foreignField: "_id",
            as: "brandData",
          },
        },
        {
          $lookup: {
            from: "categories",
            localField: "category",
            foreignField: "_id",
            as: "categoryData",
          },
        },
        {
          $addFields: {
            brand: { $arrayElemAt: ["$brandData", 0] },
            category: { $arrayElemAt: ["$categoryData", 0] },
          },
        },
        {
          $match: {
            $or: [
              { brand: { $exists: false } },
              { "brand.isActive": { $ne: false } },
            ],
          },
        },
        { $limit: 50 },
      ];

      brandProducts = await Product.aggregate(brandProductPipeline);
    }

    // Fetch products for matched categories using aggregation
    let categoryProducts = [];
    if (categories.length > 0) {
      const categoryIds = categories.map((c) => c._id);
      const categoryProductPipeline = [
        {
          $match: {
            category: { $in: categoryIds },
            isActive: true,
          }
        },
        {
          $lookup: {
            from: "brands",
            localField: "brand",
            foreignField: "_id",
            as: "brandData",
          },
        },
        {
          $lookup: {
            from: "categories",
            localField: "category",
            foreignField: "_id",
            as: "categoryData",
          },
        },
        {
          $addFields: {
            brand: { $arrayElemAt: ["$brandData", 0] },
            category: { $arrayElemAt: ["$categoryData", 0] },
          },
        },
        {
          $match: {
            $or: [
              { brand: { $exists: false } },
              { "brand.isActive": { $ne: false } },
            ],
          },
        },
        { $limit: 50 },
      ];

      categoryProducts = await Product.aggregate(categoryProductPipeline);
    }

    // Merge and deduplicate products by _id
    const allProducts = [
      ...products.map((p) => ({ ...p, source: "product" })),
      ...brandProducts.map((p) => ({ ...p, source: "brand" })),
      ...categoryProducts.map((p) => ({ ...p, source: "category" })),
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
