// kk-backend/controllers/adminProductController.js
import Product from "../models/Product.js";
import ProductVariant from "../models/ProductVariant.js";
import Brand from "../models/Brand.js";
import Category from "../models/Category.js";

const slugify = (str) =>
  String(str || '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]+/g, '')
    .replace(/--+/g, '-');

// GET ALL PRODUCTS WITH PAGINATION AND FILTERS
export const listProducts = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = '',
      category = '',
      brand = '',
      priceMin = '',
      priceMax = ''
    } = req.query;

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    // Support large limits for backward compatibility (e.g., 9999 for "all")
    const effectiveLimit = limitNum > 0 ? limitNum : 10;

    // Build filter query
    const filterQuery = {};

    // Global search on product title
    if (search && search.trim()) {
      filterQuery.title = { $regex: search.trim(), $options: 'i' };
    }

    // Category filter
    if (category && category.trim()) {
      filterQuery.category = category.trim();
    }

    // Brand filter
    if (brand && brand.trim()) {
      filterQuery.brand = brand.trim();
    }

    // Price range filter
    if (priceMin || priceMax) {
      filterQuery.price = {};
      if (priceMin && !isNaN(parseFloat(priceMin))) {
        filterQuery.price.$gte = parseFloat(priceMin);
      }
      if (priceMax && !isNaN(parseFloat(priceMax))) {
        filterQuery.price.$lte = parseFloat(priceMax);
      }
    }

    // Execute query with filters and pagination
    const [products, total] = await Promise.all([
      Product.find(filterQuery)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(effectiveLimit)
        .lean(),
      Product.countDocuments(filterQuery)
    ]);

    const totalPages = Math.ceil(total / effectiveLimit);

    return res.status(200).json({
      statusCode: 200,
      success: true,
      error: null,
      data: {
        products,
        total,
        page: pageNum,
        totalPages,
        limit: effectiveLimit,
        hasNextPage: pageNum < totalPages,
        hasPrevPage: pageNum > 1
      }
    });
  } catch (err) {
    console.error("Admin list products error:", err);
    return res.status(500).json({
      statusCode: 500,
      success: false,
      error: { message: "Server error" },
      data: null
    });
  }
};

// GET SINGLE PRODUCT
export const getProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({
        statusCode: 404,
        success: false,
        error: { message: "Product not found" },
        data: null
      });
    }
    return res.status(200).json({
      statusCode: 200,
      success: true,
      error: null,
      data: { product }
    });
  } catch (err) {
    console.error("Admin get product error:", err);
    return res.status(500).json({
      statusCode: 500,
      success: false,
      error: { message: "Server error" },
      data: null
    });
  }
};

// CREATE PRODUCT
export const createProduct = async (req, res) => {
  try {
    const { title, brandId, categoryId, description, price, mrp, stock, images, isActive, hasSizes, variants } = req.body;

    // Validate required fields
    if (!title || !brandId || !categoryId) {
      return res.status(400).json({
        statusCode: 400,
        success: false,
        error: { message: "Missing required fields: title, brandId, categoryId" },
        data: null
      });
    }

    // Auto-generate slug from title
    const slug = slugify(title);

    // Check if slug already exists
    const existingProduct = await Product.findOne({ slug });
    if (existingProduct) {
      return res.status(400).json({
        statusCode: 400,
        success: false,
        error: { message: `Product with slug "${slug}" already exists` },
        data: null
      });
    }

    // Verify brand exists
    const brand = await Brand.findById(brandId);
    if (!brand) {
      return res.status(400).json({
        statusCode: 400,
        success: false,
        error: { message: "Brand not found" },
        data: null
      });
    }

    // Verify category exists
    const category = await Category.findById(categoryId);
    if (!category) {
      return res.status(400).json({
        statusCode: 400,
        success: false,
        error: { message: "Category not found" },
        data: null
      });
    }

    // If images missing or empty, set to empty array
    const productImages = Array.isArray(images) && images.length > 0 ? images : [];

    // Handle hasSizes logic
    let productPrice = price;
    let productMrp = mrp;
    let productStock = stock != null ? stock : 0;

    if (hasSizes === true) {
      // Validate variants
      if (!variants || !Array.isArray(variants) || variants.length === 0) {
        return res.status(400).json({
          statusCode: 400,
          success: false,
          error: { message: "At least one variant is required when hasSizes is enabled" },
          data: null
        });
      }

      // Find default variant
      const defaultVariants = variants.filter(v => v.isDefault === true);
      if (defaultVariants.length === 0) {
        return res.status(400).json({
          statusCode: 400,
          success: false,
          error: { message: "Exactly one variant must be marked as default" },
          data: null
        });
      }
      if (defaultVariants.length > 1) {
        return res.status(400).json({
          statusCode: 400,
          success: false,
          error: { message: "Only one variant can be marked as default" },
          data: null
        });
      }

      // Validate each variant
      for (const variant of variants) {
        if (!variant.name || !variant.name.trim()) {
          return res.status(400).json({
            statusCode: 400,
            success: false,
            error: { message: "Each variant must have a name" },
            data: null
          });
        }
        if (variant.price == null || parseFloat(variant.price) <= 0) {
          return res.status(400).json({
            statusCode: 400,
            success: false,
            error: { message: `Variant "${variant.name}" must have a valid price` },
            data: null
          });
        }
        if (variant.mrp == null || parseFloat(variant.mrp) <= 0) {
          return res.status(400).json({
            statusCode: 400,
            success: false,
            error: { message: `Variant "${variant.name}" must have a valid MRP` },
            data: null
          });
        }
        if (parseFloat(variant.price) > parseFloat(variant.mrp)) {
          return res.status(400).json({
            statusCode: 400,
            success: false,
            error: { message: `Variant "${variant.name}": Price cannot be greater than MRP` },
            data: null
          });
        }
      }

      // Use default variant's price, mrp, stock for product-level fields
      const defaultVariant = defaultVariants[0];
      productPrice = parseFloat(defaultVariant.price);
      productMrp = parseFloat(defaultVariant.mrp);
      productStock = defaultVariant.stock != null ? parseFloat(defaultVariant.stock) : 0;
    } else {
      // hasSizes = false, use product-level price/mrp/stock
      if (price == null || mrp == null) {
        return res.status(400).json({
          statusCode: 400,
          success: false,
          error: { message: "Price and MRP are required when hasSizes is false" },
          data: null
        });
      }

      // Validate price <= mrp
      if (parseFloat(price) > parseFloat(mrp)) {
        return res.status(400).json({
          statusCode: 400,
          success: false,
          error: { message: "Price cannot be greater than MRP" },
          data: null
        });
      }

      // Validate stock >= 0
      if (stock != null && parseFloat(stock) < 0) {
        return res.status(400).json({
          statusCode: 400,
          success: false,
          error: { message: "Stock cannot be negative" },
          data: null
        });
      }

      productPrice = parseFloat(price);
      productMrp = parseFloat(mrp);
      productStock = stock != null ? parseFloat(stock) : 0;
    }

    const newProduct = new Product({
      title,
      slug,
      brand: brandId,
      category: categoryId,
      description: description || '',
      price: productPrice,
      mrp: productMrp,
      stock: productStock,
      images: productImages,
      hasSizes: hasSizes === true,
      isActive: isActive !== undefined ? isActive : true
    });

    await newProduct.save();

    // If hasSizes is true, create ProductVariant documents
    if (hasSizes === true && variants && variants.length > 0) {
      const variantsToCreate = variants.map(v => ({
        product: newProduct._id,
        name: v.name.trim(),
        sku: v.sku || undefined,
        price: parseFloat(v.price),
        mrp: parseFloat(v.mrp),
        stock: v.stock != null ? parseFloat(v.stock) : 0,
        isDefault: v.isDefault === true,
        attributes: v.attributes || {},
        images: Array.isArray(v.images) ? v.images : [],
        isActive: v.isActive !== undefined ? v.isActive : true
      }));

      await ProductVariant.insertMany(variantsToCreate);
    }

    return res.status(201).json({
      statusCode: 201,
      success: true,
      error: null,
      data: { product: newProduct }
    });
  } catch (err) {
    console.error("Admin create product error:", err);
    return res.status(500).json({
      statusCode: 500,
      success: false,
      error: { message: "Server error" },
      data: null
    });
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
      return res.status(404).json({
        statusCode: 404,
        success: false,
        error: { message: "Product not found" },
        data: null
      });
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
          statusCode: 400,
          success: false,
          error: { message: `Product with slug "${newSlug}" already exists` },
          data: null
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
          statusCode: 400,
          success: false,
          error: { message: "Brand not found" },
          data: null
        });
      }
      updateData.brand = brandId;
    }

    // Validate and update category
    if (categoryId && categoryId !== existingProduct.category?.toString()) {
      const category = await Category.findById(categoryId);
      if (!category) {
        return res.status(400).json({
          statusCode: 400,
          success: false,
          error: { message: "Category not found" },
          data: null
        });
      }
      updateData.category = categoryId;
    }

    // Validate price and mrp
    const updatedPrice = price != null ? parseFloat(price) : existingProduct.price;
    const updatedMrp = mrp != null ? parseFloat(mrp) : existingProduct.mrp;

    if (updatedPrice > updatedMrp) {
      return res.status(400).json({
        statusCode: 400,
        success: false,
        error: { message: "Price cannot be greater than MRP" },
        data: null
      });
    }

    if (price != null) updateData.price = updatedPrice;
    if (mrp != null) updateData.mrp = updatedMrp;

    // Validate and update stock
    if (stock != null) {
      const stockValue = parseFloat(stock);
      if (stockValue < 0) {
        return res.status(400).json({
          statusCode: 400,
          success: false,
          error: { message: "Stock cannot be negative" },
          data: null
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

    return res.status(200).json({
      statusCode: 200,
      success: true,
      error: null,
      data: { product: updated }
    });
  } catch (err) {
    console.error("Admin update product error:", err);
    return res.status(500).json({
      statusCode: 500,
      success: false,
      error: { message: "Server error" },
      data: null
    });
  }
};

// DELETE PRODUCT
export const deleteProduct = async (req, res) => {
  try {
    const deleted = await Product.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({
        statusCode: 404,
        success: false,
        error: { message: "Product not found" },
        data: null
      });
    }
    return res.status(200).json({
      statusCode: 200,
      success: true,
      error: null,
      data: { message: "Product deleted" }
    });
  } catch (err) {
    console.error("Admin delete product error:", err);
    return res.status(500).json({
      statusCode: 500,
      success: false,
      error: { message: "Server error" },
      data: null
    });
  }
};
