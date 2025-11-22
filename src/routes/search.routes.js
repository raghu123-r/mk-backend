import express from "express";
import Product from "../models/Product.js";   // ✅ Correct file
import Brand from "../models/Brand.js";       // ✅ Correct file
import Category from "../models/Category.js"; // ✅ Correct file

const router = express.Router();

// 🔍 Search Products
router.get("/products", async (req, res) => {
  try {
    const q = req.query.q || "";

    const products = await Product.find({
      name: { $regex: q, $options: "i" },
    });

    res.json({ data: products });
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
      name: { $regex: q, $options: "i" },
    });

    res.json({ data: brands });
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
      name: { $regex: q, $options: "i" },
    });

    res.json({ data: categories });
  } catch (error) {
    console.error("Search categories error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
