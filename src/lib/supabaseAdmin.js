// kk-backend/src/lib/supabaseAdmin.js
// Robust supabase helper — loads env safely and avoids throwing when env missing.

import dotenv from 'dotenv';
dotenv.config(); // ensure .env loaded for backend processes that import this file

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || null;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || null;
const DEFAULT_BUCKET = process.env.SUPABASE_BUCKET || 'product-images';

if (!SUPABASE_URL || !SUPABASE_KEY) {
  // small guarded warning (non-sensitive)
  console.warn('supabaseAdmin: missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY/ANON_KEY. Supabase storage features will be disabled until env vars are provided.');
}

let supabaseAdmin = null;
try {
  if (SUPABASE_URL && SUPABASE_KEY) {
    supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_KEY);
  }
} catch (err) {
  // avoid crashing the process; warn and leave supabaseAdmin as null
  console.warn('supabaseAdmin: failed to create client:', err?.message || err);
  supabaseAdmin = null;
}

/**
 * Return a public URL for a storage path in the given bucket.
 * - If Supabase client or inputs are missing, returns null (caller should handle fallback).
 * - path can be 'brands/logo.png' or '/brands/logo.png' etc.
 */
export function getPublicUrlForPath(bucket = DEFAULT_BUCKET, path) {
  if (!path) return null;
  if (!supabaseAdmin) return null;

  const normalized = String(path).replace(/^\/+/, '');
  try {
    const { data } = supabaseAdmin.storage.from(bucket).getPublicUrl(normalized);
    return data?.publicUrl || null;
  } catch (err) {
    console.warn('getPublicUrlForPath error:', err?.message || err);
    return null;
  }
}

export { supabaseAdmin };
