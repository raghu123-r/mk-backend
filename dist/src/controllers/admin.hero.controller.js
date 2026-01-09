/**
 * Admin Homepage Controller
 * Admin-only endpoints for managing hero images
 */
import HeroImage from '../models/HeroImage.js';
import { uploadMultipleFiles } from '../services/upload.service.js';
import { deleteImageFromSupabase } from '../utils/supabase.js';

/**
 * GET /api/admin/homepage/hero-images
 * Get all hero images (admin view)
 */
export const getAllHeroImages = async (req, res) => {
  try {
    const heroImages = await HeroImage
      .find()
      .sort({ displayOrder: 1, createdAt: -1 })
      .lean();

    return res.status(200).json({
      statusCode: 200,
      success: true,
      error: null,
      data: heroImages
    });
  } catch (error) {
    console.error('Get all hero images error:', error);
    return res.status(500).json({
      statusCode: 500,
      success: false,
      error: { message: 'Failed to fetch hero images' },
      data: null
    });
  }
};

/**
 * POST /api/admin/homepage/hero-images
 * Create new hero image(s)
 * Expects: multipart/form-data with image file(s) and optional title, subtitle
 */
export const createHeroImage = async (req, res) => {
  try {
    const files = req.files;
    
    if (!files || files.length === 0) {
      return res.status(400).json({
        statusCode: 400,
        success: false,
        error: { message: 'No image files provided' },
        data: null
      });
    }

    // Enforce maximum of 8 hero images
    const currentCount = await HeroImage.countDocuments();
    const MAX_HERO_IMAGES = 8;
    
    if (currentCount >= MAX_HERO_IMAGES) {
      return res.status(400).json({
        statusCode: 400,
        success: false,
        error: { message: 'Maximum hero section images reached. Please delete an image to add a new one.' },
        data: null
      });
    }

    // Check if adding these files would exceed the limit
    if (currentCount + files.length > MAX_HERO_IMAGES) {
      return res.status(400).json({
        statusCode: 400,
        success: false,
        error: { message: `Cannot upload ${files.length} image(s). Maximum limit is ${MAX_HERO_IMAGES}. Currently ${currentCount} image(s) exist. You can upload ${MAX_HERO_IMAGES - currentCount} more.` },
        data: null
      });
    }

    // Upload images to Supabase storage (hero-section folder)
    const uploadedFiles = await uploadMultipleFiles(files, 'hero-section', {});

    // Create hero image records
    const heroImages = [];
    for (let i = 0; i < uploadedFiles.length; i++) {
      const file = uploadedFiles[i];
      
      // Get max displayOrder
      const maxOrder = await HeroImage.findOne().sort({ displayOrder: -1 }).select('displayOrder').lean();
      const nextOrder = maxOrder ? maxOrder.displayOrder + 1 : i;

      const heroImage = await HeroImage.create({
        title: req.body.title || '',
        subtitle: req.body.subtitle || '',
        imageUrl: file.url,
        imagePath: file.path,
        displayOrder: nextOrder,
        isActive: true
      });

      heroImages.push(heroImage);
    }

    return res.status(201).json({
      statusCode: 201,
      success: true,
      error: null,
      data: heroImages
    });
  } catch (error) {
    console.error('Create hero image error:', error);
    return res.status(500).json({
      statusCode: 500,
      success: false,
      error: { message: error.message || 'Failed to create hero image' },
      data: null
    });
  }
};

/**
 * PUT /api/admin/homepage/hero-images/:id
 * Update hero image details (title, subtitle, order, active status)
 */
export const updateHeroImage = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, subtitle, displayOrder, isActive } = req.body;

    const heroImage = await HeroImage.findById(id);
    if (!heroImage) {
      return res.status(404).json({
        statusCode: 404,
        success: false,
        error: { message: 'Hero image not found' },
        data: null
      });
    }

    // Update fields
    if (title !== undefined) heroImage.title = title;
    if (subtitle !== undefined) heroImage.subtitle = subtitle;
    if (displayOrder !== undefined) heroImage.displayOrder = displayOrder;
    if (isActive !== undefined) heroImage.isActive = isActive;

    await heroImage.save();

    return res.status(200).json({
      statusCode: 200,
      success: true,
      error: null,
      data: heroImage
    });
  } catch (error) {
    console.error('Update hero image error:', error);
    return res.status(500).json({
      statusCode: 500,
      success: false,
      error: { message: error.message || 'Failed to update hero image' },
      data: null
    });
  }
};

/**
 * DELETE /api/admin/homepage/hero-images/:id
 * Delete hero image and remove from Supabase storage
 */
export const deleteHeroImage = async (req, res) => {
  try {
    const { id } = req.params;

    const heroImage = await HeroImage.findById(id);
    if (!heroImage) {
      return res.status(404).json({
        statusCode: 404,
        success: false,
        error: { message: 'Hero image not found' },
        data: null
      });
    }

    // Delete from Supabase storage
    if (heroImage.imagePath) {
      try {
        await deleteImageFromSupabase(heroImage.imagePath);
      } catch (storageError) {
        console.error('Failed to delete image from storage:', storageError);
        // Continue with database deletion even if storage deletion fails
      }
    }

    // Delete from database
    await HeroImage.findByIdAndDelete(id);

    return res.status(200).json({
      statusCode: 200,
      success: true,
      error: null,
      data: { message: 'Hero image deleted successfully' }
    });
  } catch (error) {
    console.error('Delete hero image error:', error);
    return res.status(500).json({
      statusCode: 500,
      success: false,
      error: { message: error.message || 'Failed to delete hero image' },
      data: null
    });
  }
};
