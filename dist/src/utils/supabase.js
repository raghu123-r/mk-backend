// kk-backend/src/utils/supabase.js
import dotenv from 'dotenv';
dotenv.config();
import { createClient } from '@supabase/supabase-js';

const URL = process.env.SUPABASE_URL;
const KEY = process.env.SUPABASE_ANON_KEY;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const BUCKET = process.env.SUPABASE_BUCKET || "product-images";

let supabase = null;
let supabaseAdmin = null; // Server-side admin client with service role key

if (URL && KEY) {
  supabase = createClient(URL, KEY);
  console.log("✅ Supabase client initialized (backend)");
} else {
  console.warn("⚠️ Supabase not fully configured! Missing SUPABASE_URL or SUPABASE_ANON_KEY.");
}

// Initialize admin client for server-side operations (uploads, etc.)
if (URL && SERVICE_ROLE_KEY) {
  supabaseAdmin = createClient(URL, SERVICE_ROLE_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
  console.log("✅ Supabase admin client initialized (service role)");
} else {
  console.warn("⚠️ Supabase admin client not configured! Missing SUPABASE_SERVICE_ROLE_KEY.");
}

export function getPublicUrl(path) {
  if (!supabase) return null;
  try {
    return supabase.storage
      .from(BUCKET)
      .getPublicUrl(path)?.data?.publicUrl || null;
  } catch {
    return null;
  }
}

/**
 * Delete an image from Supabase storage
 * @param {string} pathOrUrl - File path within bucket or full public URL
 * @returns {Promise<void>}
 */
export async function deleteImageFromSupabase(pathOrUrl) {
  if (!supabaseAdmin) {
    throw new Error('Supabase admin client not configured');
  }

  if (!pathOrUrl) {
    throw new Error('File path or URL is required');
  }

  let filePath = pathOrUrl;

  // If it's a full URL, extract the path after the bucket name
  if (pathOrUrl.includes('http')) {
    try {
      const url = new URL(pathOrUrl);
      // Extract path after /storage/v1/object/public/{BUCKET}/
      const pathParts = url.pathname.split(`/object/public/${BUCKET}/`);
      if (pathParts.length > 1) {
        filePath = pathParts[1];
      }
    } catch (err) {
      console.error('Failed to parse URL:', err);
      throw new Error('Invalid image URL');
    }
  }

  // Remove leading slash if present
  filePath = filePath.replace(/^\/+/, '');

  const { error } = await supabaseAdmin
    .storage
    .from(BUCKET)
    .remove([filePath]);

  if (error) {
    console.error(`Failed to delete file ${filePath}:`, error);
    throw error;
  }

  console.log(`✅ Deleted file from Supabase: ${filePath}`);
}

export { supabase, supabaseAdmin, BUCKET };
