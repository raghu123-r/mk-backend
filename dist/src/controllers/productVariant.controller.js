import productVariantService from '../services/productVariant.service.js';

/**
 * ProductVariant Controller
 * 
 * Handles HTTP requests for product variant operations.
 * Provides both admin and public endpoints.
 */

/**
 * Admin: Create a new variant
 * POST /api/admin/products/:productId/variants
 */
export const createVariant = async (req, res) => {
  try {
    const { productId } = req.params;
    const payload = req.body;

    const variant = await productVariantService.createVariant(productId, payload);

    res.status(201).json({
      success: true,
      data: variant
    });
  } catch (error) {
    console.error('Error creating variant:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to create variant'
    });
  }
};

/**
 * Admin: Get all variants for a product
 * GET /api/admin/products/:productId/variants
 */
export const getVariantsByProductAdmin = async (req, res) => {
  try {
    const { productId } = req.params;
    const variants = await productVariantService.getVariantsByProduct(productId, false);

    res.json({
      success: true,
      data: variants
    });
  } catch (error) {
    console.error('Error fetching variants:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch variants'
    });
  }
};

/**
 * Admin: Update a variant
 * PATCH /api/admin/products/:productId/variants/:variantId
 */
export const updateVariant = async (req, res) => {
  try {
    const { variantId } = req.params;
    const payload = req.body;

    const variant = await productVariantService.updateVariant(variantId, payload);

    res.json({
      success: true,
      data: variant
    });
  } catch (error) {
    console.error('Error updating variant:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to update variant'
    });
  }
};

/**
 * Admin: Delete a variant
 * DELETE /api/admin/products/:productId/variants/:variantId
 */
export const deleteVariant = async (req, res) => {
  try {
    const { variantId } = req.params;

    await productVariantService.deleteVariant(variantId);

    res.json({
      success: true,
      message: 'Variant deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting variant:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to delete variant'
    });
  }
};

/**
 * Public: Get active variants for a product by slug
 * GET /api/products/:slug/variants
 */
export const getVariantsByProductSlug = async (req, res) => {
  try {
    const { slug } = req.params;
    
    // First, find the product by slug
    const Product = (await import('../models/Product.js')).default;
    const product = await Product.findOne({ slug, isActive: true });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Get active variants only
    const variants = await productVariantService.getVariantsByProduct(product._id, true);

    res.json({
      success: true,
      data: variants
    });
  } catch (error) {
    console.error('Error fetching variants:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch variants'
    });
  }
};
