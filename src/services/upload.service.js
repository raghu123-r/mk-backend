import { supabase, supabaseAdmin, getPublicUrl, BUCKET } from '../utils/supabase.js';
import { v4 as uuid } from 'uuid';

export const uploadImageBuffer = async (buffer, filename, folder='products') => {
  const key = `${folder}/${uuid()}-${filename}`;
  const { error } = await supabase
    .storage.from(process.env.SUPABASE_BUCKET)
    .upload(key, buffer, { cacheControl: '3600', upsert: false, contentType: 'image/*' });
  if (error) throw error;
  return getPublicUrl(key);
};

/**
 * Upload multiple files to Supabase storage using admin client (service role)
 * @param {Array} files - Array of file objects with buffer, originalname, mimetype, size
 * @param {string} folder - Subfolder within bucket (default: 'products')
 * @returns {Promise<Array>} Array of uploaded file metadata
 */
export const uploadMultipleFiles = async (files, folder = 'products') => {
  if (!supabaseAdmin) {
    throw new Error('Supabase admin client not configured');
  }

  const results = [];
  
  for (const file of files) {
    // Generate safe filename: timestamp + random + sanitized original name
    const timestamp = Date.now();
    const randomSuffix = Math.random().toString(36).slice(2, 10);
    const safeName = file.originalname.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9._-]/g, '');
    const filename = `${timestamp}-${randomSuffix}-${safeName}`;
    const path = `${folder}/${filename}`;
    
    // TODO: Remove debug log after testing
    console.log(`[DEBUG] Uploading file: ${filename} to ${BUCKET}/${path}`);
    
    // Upload using admin client
    const { data, error } = await supabaseAdmin
      .storage
      .from(BUCKET)
      .upload(path, file.buffer, {
        cacheControl: '3600',
        upsert: false,
        contentType: file.mimetype || 'image/*'
      });
    
    if (error) {
      console.error(`[ERROR] Upload failed for ${filename}:`, error);
      throw error;
    }
    
    // Get public URL
    const url = getPublicUrl(path);
    
    results.push({
      url,
      path,
      key: path,
      name: file.originalname,
      size: file.size,
      uploadedAt: new Date().toISOString()
    });
  }
  
  return results;
};

/**
 * List uploaded files from Supabase storage
 * @param {string} folder - Subfolder to list (default: 'products')
 * @param {number} limit - Max number of files to return
 * @returns {Promise<Array>} Array of file metadata
 */
export const listUploadedFiles = async (folder = 'products', limit = 50) => {
  if (!supabaseAdmin) {
    throw new Error('Supabase admin client not configured');
  }
  
  try {
    const { data, error } = await supabaseAdmin
      .storage
      .from(BUCKET)
      .list(folder, {
        limit,
        offset: 0,
        sortBy: { column: 'created_at', order: 'desc' }
      });
    
    if (error) throw error;
    
    // Transform to include public URLs
    const files = data.map(file => {
      const path = `${folder}/${file.name}`;
      return {
        url: getPublicUrl(path),
        path,
        name: file.name,
        size: file.metadata?.size || 0,
        createdAt: file.created_at
      };
    });
    
    return files;
  } catch (error) {
    console.error('[ERROR] Failed to list files:', error);
    throw error;
  }
};

