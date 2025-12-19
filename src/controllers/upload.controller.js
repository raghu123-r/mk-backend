import multer from 'multer';
import * as uploadService from '../services/upload.service.js';

const storage = multer.memoryStorage();
export const upload = multer({ storage });

export const uploadImage = async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({
      statusCode: 400,
      success: false,
      error: { message: 'No file' },
      data: null
    });
    const folder = req.query.folder || req.body.folder || 'products';
    const url = await uploadService.uploadImageBuffer(req.file.buffer, req.file.originalname, folder);
    return res.status(200).json({
      statusCode: 200,
      success: true,
      error: null,
      data: { url }
    });
  } catch (e) { next(e); }
};

/**
 * Admin upload handler - supports multiple files
 * Protected by requireAuth + requireAdmin middleware
 */
export const uploadFiles = async (req, res, next) => {
  try {
    const files = req.files || (req.file ? [req.file] : []);
    
    if (files.length === 0) {
      return res.status(400).json({
        ok: false,
        success: false,
        error: 'No files provided',
        data: null
      });
    }
    
    const folder = req.query.folder || req.body.folder;
    
    if (!folder) {
      return res.status(400).json({
        ok: false,
        success: false,
        error: 'Upload folder is required. Allowed folders: products, brands, categories',
        data: null
      });
    }
    
    const options = {};
    if (folder === 'brands') {
      const slug = req.query.slug || req.body.slug;
      if (!slug) {
        return res.status(400).json({
          ok: false,
          success: false,
          error: 'Brand slug is required when uploading to brands folder',
          data: null
        });
      }
      options.slug = slug;
    }
    
    if (folder === 'categories') {
      const slug = req.query.slug || req.body.slug;
      const name = req.query.name || req.body.name;
      
      // Pass slug if provided, otherwise pass name for auto-generation
      if (slug) {
        options.slug = slug;
      } else if (name) {
        options.name = name;
      }
      // If neither provided, service will generate fallback slug
    }
    
    const uploadedFiles = await uploadService.uploadMultipleFiles(files, folder, options);
    
    return res.status(200).json({
      ok: true,
      success: true,
      data: uploadedFiles,
      error: null
    });
  } catch (error) {
    console.error('[ERROR] Upload failed:', error);
    return res.status(500).json({
      ok: false,
      success: false,
      error: error.message || 'Upload failed',
      data: null
    });
  }
};

/**
 * Admin list uploads handler
 * Returns list of uploaded files from Supabase storage
 */
export const listUploads = async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const folder = req.query.folder || 'products';
    
    const files = await uploadService.listUploadedFiles(folder, limit);
    
    return res.status(200).json({
      ok: true,
      success: true,
      data: files,
      error: null
    });
  } catch (error) {
    console.error('[ERROR] List uploads failed:', error);
    return res.status(500).json({
      ok: false,
      success: false,
      error: error.message || 'Failed to list uploads',
      data: null
    });
  }
};
