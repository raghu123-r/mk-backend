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
    const url = await uploadService.uploadImageBuffer(req.file.buffer, req.file.originalname);
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
    // TODO: Remove debug log after testing
    console.log('[DEBUG] Admin upload request received');
    console.log('[DEBUG] Files:', req.files ? req.files.length : 0);
    console.log('[DEBUG] Single file:', req.file ? 'yes' : 'no');
    
    // Handle both single file and multiple files
    const files = req.files || (req.file ? [req.file] : []);
    
    if (files.length === 0) {
      return res.status(400).json({
        ok: false,
        success: false,
        error: 'No files provided',
        data: null
      });
    }
    
    // Upload to Supabase storage under product-images/products/
    const uploadedFiles = await uploadService.uploadMultipleFiles(files, 'products');
    
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
