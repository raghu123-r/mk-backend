import ProductVariant from '../models/ProductVariant.js';
import Product from '../models/Product.js';

/**
 * ProductVariant Service
 * 
 * Business logic for managing product variants.
 * Handles CRUD operations with validation and error handling.
 */

class ProductVariantService {
  /**
   * Create a new variant for a product
   * @param {string} productId - The product ID
   * @param {Object} payload - Variant data
   * @returns {Promise<Object>} Created variant
   */
  async createVariant(productId, payload) {
    // Verify product exists
    const product = await Product.findById(productId);
    if (!product) {
      throw new Error('Product not found');
    }

    const variant = new ProductVariant({
      product: productId,
      ...payload
    });

    await variant.save();
    return variant;
  }

  /**
   * Get all variants for a product
   * @param {string} productId - The product ID
   * @param {boolean} activeOnly - Return only active variants
   * @returns {Promise<Array>} Array of variants
   */
  async getVariantsByProduct(productId, activeOnly = false) {
    const query = { product: productId };
    if (activeOnly) {
      query.isActive = true;
    }

    return ProductVariant.find(query).sort({ createdAt: 1 });
  }

  /**
   * Get a single variant by ID
   * @param {string} variantId - The variant ID
   * @returns {Promise<Object>} Variant document
   */
  async getVariantById(variantId) {
    const variant = await ProductVariant.findById(variantId).populate('product');
    if (!variant) {
      throw new Error('Variant not found');
    }
    return variant;
  }

  /**
   * Update a variant
   * @param {string} variantId - The variant ID
   * @param {Object} payload - Updated data
   * @returns {Promise<Object>} Updated variant
   */
  async updateVariant(variantId, payload) {
    const variant = await ProductVariant.findById(variantId);
    if (!variant) {
      throw new Error('Variant not found');
    }

    // Update fields
    Object.keys(payload).forEach(key => {
      if (payload[key] !== undefined) {
        variant[key] = payload[key];
      }
    });

    await variant.save();
    return variant;
  }

  /**
   * Delete a variant
   * @param {string} variantId - The variant ID
   * @returns {Promise<Object>} Deleted variant
   */
  async deleteVariant(variantId) {
    const variant = await ProductVariant.findByIdAndDelete(variantId);
    if (!variant) {
      throw new Error('Variant not found');
    }
    return variant;
  }

  /**
   * Check if a variant has sufficient stock
   * @param {string} variantId - The variant ID
   * @param {number} qty - Requested quantity
   * @returns {Promise<boolean>} True if sufficient stock
   */
  async checkStock(variantId, qty) {
    const variant = await ProductVariant.findById(variantId);
    if (!variant) {
      throw new Error('Variant not found');
    }
    return variant.stock >= qty;
  }

  /**
   * Decrease variant stock (for order processing)
   * @param {string} variantId - The variant ID
   * @param {number} qty - Quantity to decrease
   * @returns {Promise<Object>} Updated variant
   */
  async decreaseStock(variantId, qty) {
    const variant = await ProductVariant.findById(variantId);
    if (!variant) {
      throw new Error('Variant not found');
    }

    if (variant.stock < qty) {
      throw new Error('Insufficient stock');
    }

    variant.stock -= qty;
    await variant.save();
    return variant;
  }

  /**
   * Increase variant stock (for order cancellation)
   * @param {string} variantId - The variant ID
   * @param {number} qty - Quantity to increase
   * @returns {Promise<Object>} Updated variant
   */
  async increaseStock(variantId, qty) {
    const variant = await ProductVariant.findById(variantId);
    if (!variant) {
      throw new Error('Variant not found');
    }

    variant.stock += qty;
    await variant.save();
    return variant;
  }
}

export default new ProductVariantService();
