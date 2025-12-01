#!/usr/bin/env node
/**
 * fix-brand-logo-paths.js
 * 
 * Normalizes brand logoUrl values in MongoDB to canonical storage paths
 * and verifies objects exist in Supabase before updating.
 * 
 * Usage:
 *   node scripts/fix-brand-logo-paths.js --dry    # Preview changes (default)
 *   node scripts/fix-brand-logo-paths.js --apply  # Apply changes to DB
 */

import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync, mkdirSync, writeFileSync } from 'fs';
import dotenv from 'dotenv';
import { MongoClient } from 'mongodb';

// Load .env from kk-backend root
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const envPath = join(__dirname, '..', '.env');
dotenv.config({ path: envPath });

// ─────────────────────────────────────────────────────────────────────────────
// Attempt to import supabaseAdmin helper (guarded, script works without it)
// ─────────────────────────────────────────────────────────────────────────────
let supabaseAdmin = null;
try {
  const helperPath = join(__dirname, '..', 'src', 'lib', 'supabaseAdmin.js');
  if (existsSync(helperPath)) {
    const helper = await import(helperPath);
    supabaseAdmin = helper.supabaseAdmin || null;
  }
} catch (err) {
  // Ignore - script will work without storage listing
}

// ─────────────────────────────────────────────────────────────────────────────
// Configuration from env
// ─────────────────────────────────────────────────────────────────────────────
const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI;
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_BUCKET = process.env.SUPABASE_BUCKET || 'product-images';

if (!MONGO_URI) {
  console.error('❌ Missing MONGO_URI or MONGODB_URI in environment. Exiting.');
  process.exit(1);
}
if (!SUPABASE_URL) {
  console.error('❌ Missing SUPABASE_URL in environment. Exiting.');
  process.exit(1);
}

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────
const FALLBACK_FILENAMES = ['logo.png', 'logo.jpg', 'logo.jpeg', 'logo.webp', 'logo.svg'];
const IMAGE_EXTENSIONS_REGEX = /\.(png|jpe?g|webp|svg|gif|avif)$/i;
const PLACEHOLDER_SIZE_REGEX = /^\d+x\d+$/;

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Simple slugify: lowercase, replace spaces with dashes, remove non-word chars, collapse dashes
 */
function slugify(str) {
  if (!str) return '';
  return String(str)
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Extract filename from a URL or path string
 */
function extractFilename(rawPath) {
  if (!rawPath) return null;
  try {
    // Try to parse as URL first
    const url = new URL(rawPath);
    const segments = url.pathname.split('/').filter(Boolean);
    const last = segments[segments.length - 1];
    return last ? decodeURIComponent(last) : null;
  } catch {
    // Not a URL, treat as path
    const segments = String(rawPath).split('/').filter(Boolean);
    const last = segments[segments.length - 1];
    return last || null;
  }
}

/**
 * Check if filename looks like a placeholder size (e.g., "150x50")
 */
function isPlaceholderFilename(filename) {
  if (!filename) return true;
  return PLACEHOLDER_SIZE_REGEX.test(filename);
}

/**
 * Build the public URL for a storage path
 */
function buildPublicUrl(storagePath) {
  const base = SUPABASE_URL.replace(/\/+$/, '');
  const encodedPath = storagePath.split('/').map(encodeURIComponent).join('/');
  return `${base}/storage/v1/object/public/${SUPABASE_BUCKET}/${encodedPath}`;
}

/**
 * Check if a URL exists via HEAD request
 */
async function urlExists(url, fetchFn) {
  try {
    const res = await fetchFn(url, { method: 'HEAD' });
    return res.ok;
  } catch {
    return false;
  }
}

/**
 * Get fetch function (native or node-fetch)
 */
async function getFetch() {
  if (typeof globalThis.fetch === 'function') {
    return globalThis.fetch;
  }
  try {
    const nodeFetch = await import('node-fetch');
    return nodeFetch.default;
  } catch {
    console.error('❌ fetch not available and node-fetch not installed. Please run: npm install node-fetch');
    process.exit(1);
  }
}

/**
 * Try to find a valid image file for the brand using HEAD checks and storage listing
 */
async function findValidFilename(slug, rawFilename, fetchFn) {
  // Build candidate list: start with extracted filename if valid, then fallbacks
  const candidates = [];
  
  // Add extracted filename first if it's not a placeholder
  if (rawFilename && !isPlaceholderFilename(rawFilename)) {
    candidates.push(rawFilename);
  }
  
  // Add fallback filenames
  for (const fb of FALLBACK_FILENAMES) {
    if (!candidates.includes(fb)) {
      candidates.push(fb);
    }
  }

  // Try HEAD requests for each candidate
  for (const filename of candidates) {
    const candidatePath = `brands/${slug}/${filename}`;
    const publicUrl = buildPublicUrl(candidatePath);
    const exists = await urlExists(publicUrl, fetchFn);
    if (exists) {
      return { filename, candidatePath, publicUrl, source: 'head' };
    }
  }

  // If supabaseAdmin is available, try listing the folder
  if (supabaseAdmin) {
    try {
      const folderPath = `brands/${slug}`;
      const { data, error } = await supabaseAdmin.storage.from(SUPABASE_BUCKET).list(folderPath, { limit: 100 });
      
      if (!error && data && data.length > 0) {
        // Find the first file with an image extension
        const imageFile = data.find(f => f.name && IMAGE_EXTENSIONS_REGEX.test(f.name));
        if (imageFile) {
          const filename = imageFile.name;
          const candidatePath = `brands/${slug}/${filename}`;
          const publicUrl = buildPublicUrl(candidatePath);
          return { filename, candidatePath, publicUrl, source: 'listing' };
        }
      }
    } catch (err) {
      // Ignore listing errors, just means we couldn't find the file
    }
  }

  return null;
}

// ─────────────────────────────────────────────────────────────────────────────
// Main script
// ─────────────────────────────────────────────────────────────────────────────

async function main() {
  const args = process.argv.slice(2);
  const applyMode = args.includes('--apply');
  const dryMode = !applyMode;

  console.log(`\n🔧 Brand Logo Path Fixer`);
  console.log(`   Mode: ${applyMode ? 'APPLY (will update DB)' : 'DRY-RUN (preview only)'}`);
  console.log(`   Supabase URL: ${SUPABASE_URL}`);
  console.log(`   Bucket: ${SUPABASE_BUCKET}`);
  console.log(`   Storage listing: ${supabaseAdmin ? 'enabled' : 'disabled (supabaseAdmin not available)'}\n`);

  const fetchFn = await getFetch();
  const client = new MongoClient(MONGO_URI);

  try {
    await client.connect();
    console.log('✅ Connected to MongoDB\n');

    const db = client.db();
    const brandsCollection = db.collection('brands');
    const brands = await brandsCollection.find({}).toArray();

    console.log(`📦 Found ${brands.length} brand(s) in the database\n`);

    const updates = [];
    const notFound = [];

    for (const brand of brands) {
      const brandId = brand._id;
      const brandName = brand.name || 'unknown';
      const rawLogo = brand.logoUrl || brand.logo_url || brand.logo || null;

      // Derive slug
      const slug = brand.slug ? slugify(brand.slug) : slugify(brandName);
      if (!slug) {
        console.warn(`⚠️  Skipping brand "${brandName}" (${brandId}): could not derive slug`);
        continue;
      }

      // Extract filename from raw logo
      const rawFilename = extractFilename(rawLogo);

      // Find a valid filename via HEAD checks or storage listing
      const result = await findValidFilename(slug, rawFilename, fetchFn);

      if (!result) {
        notFound.push({ _id: brandId, name: brandName, rawLogo, slug });
        continue;
      }

      const { candidatePath, publicUrl, source } = result;

      // Check if current rawLogo already matches candidate (case-insensitive)
      if (rawLogo && rawLogo.toLowerCase().includes(candidatePath.toLowerCase())) {
        console.log(`✓  "${brandName}" already has correct path: ${candidatePath}`);
        continue;
      }

      // Valid candidate found
      updates.push({
        _id: brandId,
        name: brandName,
        currentLogoUrl: rawLogo,
        candidatePath,
        publicUrl,
        source
      });

      console.log(`📝 "${brandName}"`);
      console.log(`   Current: ${rawLogo || '(empty)'}`);
      console.log(`   Proposed: ${candidatePath}`);
      console.log(`   Public URL: ${publicUrl}`);
      console.log(`   Found via: ${source}`);
      console.log('');
    }

    // Print warnings for brands where no image was found
    if (notFound.length > 0) {
      console.log(`\n⚠️  ${notFound.length} brand(s) have no image found (manual follow-up needed):`);
      for (const nf of notFound) {
        console.log(`   - "${nf.name}" (${nf._id}): raw="${nf.rawLogo || '(empty)'}", slug="${nf.slug}"`);
      }
      console.log('');
    }

    console.log(`\n📊 Summary: ${updates.length} brand(s) to update, ${notFound.length} not found\n`);

    if (updates.length === 0) {
      console.log('✅ No updates needed. All brands are up-to-date or objects not found.\n');
      await client.close();
      return;
    }

    if (dryMode) {
      console.log('ℹ️  Dry-run mode: no changes made. Run with --apply to update the database.\n');
      await client.close();
      return;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Apply mode: backup and update
    // ─────────────────────────────────────────────────────────────────────────

    // Create backup
    const backupsDir = join(__dirname, '..', 'backups');
    if (!existsSync(backupsDir)) {
      mkdirSync(backupsDir, { recursive: true });
    }
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = join(backupsDir, `brands-backup-${timestamp}.json`);
    writeFileSync(backupPath, JSON.stringify(brands, null, 2), 'utf8');
    console.log(`💾 Backup saved to: ${backupPath}\n`);

    // Apply updates
    console.log('🚀 Applying updates...\n');
    let successCount = 0;

    for (const update of updates) {
      try {
        const result = await brandsCollection.updateOne(
          { _id: update._id },
          { $set: { logoUrl: update.candidatePath } }
        );
        console.log(`   ✅ "${update.name}" (${update._id}): matched=${result.matchedCount}, modified=${result.modifiedCount}`);
        if (result.modifiedCount > 0) successCount++;
      } catch (err) {
        console.error(`   ❌ "${update.name}" (${update._id}): failed - ${err.message}`);
      }
    }

    console.log(`\n✅ Done! Updated ${successCount} of ${updates.length} brand(s).\n`);
    console.log('ℹ️  Remember to restart the backend and frontend to see changes.\n');

  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  } finally {
    await client.close();
  }
}

main();
