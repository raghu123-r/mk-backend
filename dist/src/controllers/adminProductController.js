// kk-backend/controllers/adminProductController.js
import Product from "../models/Product.js";

// GET ALL PRODUCTS
export const listProducts = async (req, res) => {
  try {
    const products = await Product.find().sort({ createdAt: -1 });
    return res.status(200).json({ success: true, items: products });
  } catch (err) {
    console.error("Admin list products error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// GET SINGLE PRODUCT
export const getProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }
    return res.status(200).json({ success: true, product });
  } catch (err) {
    console.error("Admin get product error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// CREATE PRODUCT
export const createProduct = async (req, res) => {
  try {
    const newProduct = new Product(req.body);
    await newProduct.save();
    return res.status(201).json({ success: true, product: newProduct });
  } catch (err) {
    console.error("Admin create product error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// UPDATE PRODUCT
export const updateProduct = async (req, res) => {
  try {
    const updated = await Product.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    if (!updated) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }
    return res.status(200).json({ success: true, product: updated });
  } catch (err) {
    console.error("Admin update product error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// DELETE PRODUCT
export const deleteProduct = async (req, res) => {
  try {
    const deleted = await Product.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }
    return res.status(200).json({ success: true, message: "Product deleted" });
  } catch (err) {
    console.error("Admin delete product error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};
