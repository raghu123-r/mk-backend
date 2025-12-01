// kk-backend/src/utils/supabase.js

import dotenv from 'dotenv';
dotenv.config();
import { createClient } from '@supabase/supabase-js';

const URL = process.env.SUPABASE_URL;
const KEY = process.env.SUPABASE_ANON_KEY;
const BUCKET = process.env.SUPABASE_BUCKET || "product-images";

let supabase = null;
if (URL && KEY) {
  supabase = createClient(URL, KEY);
  console.log("✅ Supabase client initialized (backend)");
} else {
  console.warn("⚠️ Supabase not fully configured! Missing SUPABASE_URL or SUPABASE_ANON_KEY.");
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

export { supabase };
