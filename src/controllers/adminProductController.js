// kk-backend/controllers/adminProductController.js
import Product from "../models/Product.js";
import Brand from "../models/Brand.js";
import Category from "../models/Category.js";

const slugify = (str) =>
  String(str || '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]+/g, '')
    .replace(/--+/g, '-');

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
    const { title, brandId, categoryId, description, price, mrp, stock, images, isActive } = req.body;

    // Validate required fields
    if (!title || !brandId || !categoryId || price == null || mrp == null) {
      return res.status(400).json({ 
        success: false, 
        message: "Missing required fields: title, brandId, categoryId, price, mrp" 
      });
    }

    // Validate price <= mrp
    if (parseFloat(price) > parseFloat(mrp)) {
      return res.status(400).json({ 
        success: false, 
        message: "Price cannot be greater than MRP" 
      });
    }

    // Validate stock >= 0
    if (stock != null && parseFloat(stock) < 0) {
      return res.status(400).json({ 
        success: false, 
        message: "Stock cannot be negative" 
      });
    }

    // Auto-generate slug from title
    const slug = slugify(title);

    // Check if slug already exists
    const existingProduct = await Product.findOne({ slug });
    if (existingProduct) {
      return res.status(400).json({ 
        success: false, 
        message: `Product with slug "${slug}" already exists` 
      });
    }

    // Verify brand exists
    const brand = await Brand.findById(brandId);
    if (!brand) {
      return res.status(400).json({ 
        success: false, 
        message: "Brand not found" 
      });
    }

    // Verify category exists
    const category = await Category.findById(categoryId);
    if (!category) {
      return res.status(400).json({ 
        success: false, 
        message: "Category not found" 
      });
    }

    // If images missing or empty, set to empty array
    const productImages = Array.isArray(images) && images.length > 0 ? images : [];

    const newProduct = new Product({
      title,
      slug,
      brand: brandId,
      category: categoryId,
      description: description || '',
      price: parseFloat(price),
      mrp: parseFloat(mrp),
      stock: stock != null ? parseFloat(stock) : 0,
      images: productImages,
      isActive: isActive !== undefined ? isActive : true
    });

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
    const { title, brandId, categoryId, description, price, mrp, stock, images, isActive } = req.body;
    const productId = req.params.id;

    // Find existing product
    const existingProduct = await Product.findById(productId);
    if (!existingProduct) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    // Build update object
    const updateData = {};

    // Validate and update title/slug
    if (title && title !== existingProduct.title) {
      const newSlug = slugify(title);
      // Check if new slug already exists (but not on current product)
      const slugExists = await Product.findOne({ slug: newSlug, _id: { $ne: productId } });
      if (slugExists) {
        return res.status(400).json({ 
          success: false, 
          message: `Product with slug "${newSlug}" already exists` 
        });
      }
      updateData.title = title;
      updateData.slug = newSlug;
    }

    // Validate and update brand
    if (brandId && brandId !== existingProduct.brand?.toString()) {
      const brand = await Brand.findById(brandId);
      if (!brand) {
        return res.status(400).json({ 
          success: false, 
          message: "Brand not found" 
        });
      }
      updateData.brand = brandId;
    }

    // Validate and update category
    if (categoryId && categoryId !== existingProduct.category?.toString()) {
      const category = await Category.findById(categoryId);
      if (!category) {
        return res.status(400).json({ 
          success: false, 
          message: "Category not found" 
        });
      }
      updateData.category = categoryId;
    }

    // Validate price and mrp
    const updatedPrice = price != null ? parseFloat(price) : existingProduct.price;
    const updatedMrp = mrp != null ? parseFloat(mrp) : existingProduct.mrp;

    if (updatedPrice > updatedMrp) {
      return res.status(400).json({ 
        success: false, 
        message: "Price cannot be greater than MRP" 
      });
    }

    if (price != null) updateData.price = updatedPrice;
    if (mrp != null) updateData.mrp = updatedMrp;

    // Validate and update stock
    if (stock != null) {
      const stockValue = parseFloat(stock);
      if (stockValue < 0) {
        return res.status(400).json({ 
          success: false, 
          message: "Stock cannot be negative" 
        });
      }
      updateData.stock = stockValue;
    }

    // Update description if provided
    if (description !== undefined) {
      updateData.description = description;
    }

    // Update images (can be empty array)
    if (images !== undefined) {
      updateData.images = Array.isArray(images) ? images : [];
    }

    // Update isActive if provided
    if (isActive !== undefined) {
      updateData.isActive = isActive;
    }

    const updated = await Product.findByIdAndUpdate(
      productId,
      updateData,
      { new: true, runValidators: true }
    );

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
