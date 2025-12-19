import { supabase, supabaseAdmin, getPublicUrl, BUCKET } from '../utils/supabase.js';
import { v4 as uuid } from 'uuid';

const ALLOWED_FOLDERS = ['products', 'brands', 'categories'];

function validateFolder(folder) {
  if (!folder) {
    throw new Error('Upload folder is required. Allowed folders: products, brands, categories');
  }
  if (!ALLOWED_FOLDERS.includes(folder)) {
    throw new Error(`Invalid upload folder: ${folder}. Allowed folders: products, brands, categories`);
  }
}

/**
 * Generate a safe slug from text
 * @param {string} text - Text to slugify
 * @returns {string} Slugified text
 */
function slugify(text) {
  if (!text) return '';
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]+/g, '');
}

/**
 * Generate a slug for categories when not provided
 * @param {Object} options - Options object that may contain name or other data
 * @returns {string} Generated slug
 */
function generateCategorySlug(options = {}) {
  // Try to use category name if provided
  if (options.name) {
    const generatedSlug = slugify(options.name);
    if (generatedSlug) {
      return generatedSlug;
    }
  }
  
  // Fallback to timestamp-based slug
  return `category-${Date.now()}`;
}

export const uploadImageBuffer = async (buffer, filename, folder, options = {}) => {
  validateFolder(folder);
  
  if (folder === 'brands' && !options.slug) {
    throw new Error('Brand slug is required when uploading to brands folder');
  }
  
  let path;
  if (folder === 'brands') {
    const ext = filename.split('.').pop();
    path = `brands/${options.slug}/logo-${uuid()}.${ext}`;
  } else {
    path = `${folder}/${uuid()}-${filename}`;
  }
  
  const { error } = await supabase
    .storage.from(process.env.SUPABASE_BUCKET)
    .upload(path, buffer, { cacheControl: '3600', upsert: false, contentType: 'image/*' });
  if (error) throw error;
  return getPublicUrl(path);
};

/**
 * Upload multiple files to Supabase storage using admin client (service role)
 * @param {Array} files - Array of file objects with buffer, originalname, mimetype, size
 * @param {string} folder - Subfolder within bucket (required: products, brands, or categories)
 * @param {Object} options - Additional options (e.g., slug for brands)
 * @returns {Promise<Array>} Array of uploaded file metadata
 */
export const uploadMultipleFiles = async (files, folder, options = {}) => {
  if (!supabaseAdmin) {
    throw new Error('Supabase admin client not configured');
  }

  validateFolder(folder);
  
  if (folder === 'brands' && !options.slug) {
    throw new Error('Brand slug is required when uploading to brands folder');
  }
  
  // For categories, auto-generate slug if missing
  if (folder === 'categories' && !options.slug) {
    options.slug = generateCategorySlug(options);
    console.log(`[INFO] Auto-generated category slug: ${options.slug}`);
  }

  const results = [];
  
  for (const file of files) {
    const timestamp = Date.now();
    const randomSuffix = Math.random().toString(36).slice(2, 10);
    const safeName = file.originalname.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9._-]/g, '');
    
    let path;
    if (folder === 'brands') {
      const ext = safeName.split('.').pop();
      const filename = `logo-${timestamp}-${randomSuffix}.${ext}`;
      path = `brands/${options.slug}/${filename}`;
    } else if (folder === 'categories') {
      const ext = safeName.split('.').pop();
      const filename = `image-${timestamp}-${randomSuffix}.${ext}`;
      path = `categories/${options.slug}/${filename}`;
    } else {
      const filename = `${timestamp}-${randomSuffix}-${safeName}`;
      path = `${folder}/${filename}`;
    }
    
    const { data, error } = await supabaseAdmin
      .storage
      .from(BUCKET)
      .upload(path, file.buffer, {
        cacheControl: '3600',
        upsert: false,
        contentType: file.mimetype || 'image/*'
      });
    
    if (error) {
      console.error(`[ERROR] Upload failed for ${file.originalname}:`, error);
      throw error;
    }
    
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
    // For brands folder, we need to list files from nested subfolders
    if (folder === 'brands') {
      return await listBrandImages(limit);
    }
    
    // For categories folder, we need to list files from nested subfolders
    if (folder === 'categories') {
      return await listCategoryImages(limit);
    }
    
    // For other folders (products, etc.), use simple listing
    const { data, error } = await supabaseAdmin
      .storage
      .from(BUCKET)
      .list(folder, {
        limit,
        offset: 0,
        sortBy: { column: 'created_at', order: 'desc' }
      });
    
    if (error) throw error;
    
    // Filter out folders - only include actual image files
    const imageExtensions = /\.(png|jpg|jpeg|gif|webp|svg)$/i;
    const files = data
      .filter(file => {
        const isFolder = !file.metadata || Object.keys(file.metadata).length === 0;
        const hasImageExtension = imageExtensions.test(file.name);
        return !isFolder && hasImageExtension;
      })
      .map(file => {
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

/**
 * List brand images from nested brand folders
 * Brands are stored as: brands/<brand-slug>/logo.png
 * This function lists all subfolders and their image files
 * @param {number} limit - Max number of files to return
 * @returns {Promise<Array>} Array of file metadata
 */
async function listBrandImages(limit = 50) {
  const allFiles = [];
  const imageExtensions = /\.(png|jpg|jpeg|gif|webp|svg)$/i;
  
  // First, list all brand folders
  const { data: brandFolders, error: folderError } = await supabaseAdmin
    .storage
    .from(BUCKET)
    .list('brands', {
      limit: 200,
      offset: 0
    });
  
  if (folderError) throw folderError;
  
  // For each brand folder, list its files
  for (const folder of brandFolders || []) {
    // Skip if it's a file (not a folder)
    const isFolder = !folder.metadata || Object.keys(folder.metadata).length === 0;
    if (!isFolder) {
      // It's a file directly in brands/ folder (flat structure)
      if (imageExtensions.test(folder.name)) {
        const path = `brands/${folder.name}`;
        allFiles.push({
          url: getPublicUrl(path),
          path,
          name: folder.name,
          size: folder.metadata?.size || 0,
          createdAt: folder.created_at
        });
      }
      continue;
    }
    
    // List files inside this brand folder
    const brandSlug = folder.name;
    const { data: files, error: filesError } = await supabaseAdmin
      .storage
      .from(BUCKET)
      .list(`brands/${brandSlug}`, {
        limit: 10,
        offset: 0
      });
    
    if (filesError) {
      console.error(`[WARN] Failed to list files in brands/${brandSlug}:`, filesError.message);
      continue;
    }
    
    // Add image files from this brand folder
    for (const file of files || []) {
      if (imageExtensions.test(file.name)) {
        const path = `brands/${brandSlug}/${file.name}`;
        allFiles.push({
          url: getPublicUrl(path),
          path,
          name: file.name,
          size: file.metadata?.size || 0,
          createdAt: file.created_at
        });
      }
    }
    
    // Stop if we've reached the limit
    if (allFiles.length >= limit) break;
  }
  
  // Sort by creation date (most recent first) and limit
  return allFiles
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, limit);
}

/**
 * List category images from nested category folders
 * Categories are stored as: categories/<category-slug>/image.png
 * This function lists all subfolders and their image files
 * @param {number} limit - Max number of files to return
 * @returns {Promise<Array>} Array of file metadata
 */
async function listCategoryImages(limit = 50) {
  const allFiles = [];
  const imageExtensions = /\.(png|jpg|jpeg|gif|webp|svg)$/i;
  
  // First, list all category folders
  const { data: categoryFolders, error: folderError } = await supabaseAdmin
    .storage
    .from(BUCKET)
    .list('categories', {
      limit: 200,
      offset: 0
    });
  
  if (folderError) throw folderError;
  
  // For each category folder, list its files
  for (const folder of categoryFolders || []) {
    // Skip if it's a file (not a folder)
    const isFolder = !folder.metadata || Object.keys(folder.metadata).length === 0;
    if (!isFolder) {
      // It's a file directly in categories/ folder (flat structure)
      if (imageExtensions.test(folder.name)) {
        const path = `categories/${folder.name}`;
        allFiles.push({
          url: getPublicUrl(path),
          path,
          name: folder.name,
          size: folder.metadata?.size || 0,
          createdAt: folder.created_at
        });
      }
      continue;
    }
    
    // List files inside this category folder
    const categorySlug = folder.name;
    const { data: files, error: filesError } = await supabaseAdmin
      .storage
      .from(BUCKET)
      .list(`categories/${categorySlug}`, {
        limit: 10,
        offset: 0
      });
    
    if (filesError) {
      console.error(`[WARN] Failed to list files in categories/${categorySlug}:`, filesError.message);
      continue;
    }
    
    // Add image files from this category folder
    for (const file of files || []) {
      if (imageExtensions.test(file.name)) {
        const path = `categories/${categorySlug}/${file.name}`;
        allFiles.push({
          url: getPublicUrl(path),
          path,
          name: file.name,
          size: file.metadata?.size || 0,
          createdAt: file.created_at
        });
      }
    }
    
    // Stop if we've reached the limit
    if (allFiles.length >= limit) break;
  }
  
  // Sort by creation date (most recent first) and limit
  return allFiles
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, limit);
}

