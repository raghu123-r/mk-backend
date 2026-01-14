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

// 🔍 Unified Search Endpoint (with pagination support)
router.get("/", async (req, res) => {
  try {
    const q = req.query.q || "";
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 8;
    const skip = (page - 1) * limit;

    if (!q.trim()) {
      return res.json({ 
        products: [], 
        brands: [], 
        categories: [],
        pagination: { page: 1, pages: 0, total: 0, limit }
      });
    }

    // First, get matched brands and categories (only on first page for efficiency)
    let brands = [];
    let categories = [];
    
    if (page === 1) {
      // Search brands (only active brands)
      brands = await Brand.find({
        $or: [
          { name: { $regex: q, $options: "i" } },
          { slug: { $regex: q, $options: "i" } },
        ],
        isActive: true,
      }).limit(20);

      // Search categories
      categories = await Category.find({
        $or: [
          { name: { $regex: q, $options: "i" } },
          { slug: { $regex: q, $options: "i" } },
        ],
      }).limit(20);
    }

    // Get brand and category IDs for product search
    const brandIds = brands.length > 0 ? brands.map((b) => b._id) : [];
    const categoryIds = categories.length > 0 ? categories.map((c) => c._id) : [];

    // Build match condition for products
    const productMatchCondition = {
      isActive: true,
      $or: [
        { title: { $regex: q, $options: "i" } },
        { slug: { $regex: q, $options: "i" } },
        { description: { $regex: q, $options: "i" } },
      ],
    };

    // If we have matched brands/categories, include their products too
    if (brandIds.length > 0 || categoryIds.length > 0) {
      const additionalConditions = [];
      if (brandIds.length > 0) {
        additionalConditions.push({ brand: { $in: brandIds } });
      }
      if (categoryIds.length > 0) {
        additionalConditions.push({ category: { $in: categoryIds } });
      }
      productMatchCondition.$or = [
        ...productMatchCondition.$or,
        ...additionalConditions,
      ];
    }

    // Count total matching products
    const countPipeline = [
      { $match: productMatchCondition },
      {
        $lookup: {
          from: "brands",
          localField: "brand",
          foreignField: "_id",
          as: "brandData",
        },
      },
      {
        $addFields: {
          brand: { $arrayElemAt: ["$brandData", 0] },
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
      { $count: "total" },
    ];

    const countResult = await Product.aggregate(countPipeline);
    const total = countResult[0]?.total || 0;
    const pages = Math.ceil(total / limit);

    // Fetch paginated products
    const productPipeline = [
      { $match: productMatchCondition },
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
      { $sort: { createdAt: -1 } },
      { $skip: skip },
      { $limit: limit },
    ];

    const products = await Product.aggregate(productPipeline);

    // Deduplicate products by _id (in case of overlapping matches)
    const uniqueProducts = Object.values(
      products.reduce((acc, product) => {
        const key = product._id.toString();
        if (!acc[key]) {
          acc[key] = { ...product, source: "product" };
        }
        return acc;
      }, {})
    );

    res.json({
      products: uniqueProducts,
      brands: brands.map((b) => ({ ...b.toObject(), source: "brand" })),
      categories: categories.map((c) => ({ ...c.toObject(), source: "category" })),
      pagination: {
        page,
        pages,
        total,
        limit,
        hasMore: page < pages,
      },
    });
  } catch (error) {
    console.error("Unified search error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
