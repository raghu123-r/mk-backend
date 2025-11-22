import { supabase, getPublicUrl } from '../utils/supabase.js';
import { v4 as uuid } from 'uuid';

export const uploadImageBuffer = async (buffer, filename, folder='products') => {
  const key = `${folder}/${uuid()}-${filename}`;
  const { error } = await supabase
    .storage.from(process.env.SUPABASE_BUCKET)
    .upload(key, buffer, { cacheControl: '3600', upsert: false, contentType: 'image/*' });
  if (error) throw error;
  return getPublicUrl(key);
};

