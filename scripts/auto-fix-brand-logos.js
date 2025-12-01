#!/usr/bin/env node
/**
 * auto-fix-brand-logos.js
 * 
 * Automatically finds and fixes brand logo URLs by scanning Supabase Storage
 * and updating MongoDB documents with valid public URLs.
 * 
 * USAGE:
 *   node scripts/auto-fix-brand-logos.js --dry    # Preview changes (default)
 *   node scripts/auto-fix-brand-logos.js --apply  # Apply changes to database
 * 
 * REQUIREMENTS:
 *   - kk-backend/.env must contain: SUPABASE_URL, SUPABASE_BUCKET
 *   - Optionally: SUPABASE_SERVICE_ROLE_KEY (recommended) or SUPABASE_ANON_KEY
 *   - MongoDB connection via MONGO_URI or MONGODB_URI
 * 
 * BEHAVIOR:
 *   1. Connects to MongoDB and fetches all brands
 *   2. For each brand, derives a slug and checks Supabase Storage for logo files
 *   3. Validates file existence via HEAD request
 *   4. In --apply mode: creates backup, then updates brand documents
 */

import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync, mkdirSync, writeFileSync } from 'fs';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { createClient } from '@supabase/supabase-js';

// ─────────────────────────────────────────────────────────────────────────────
// Setup paths and load environment
// ─────────────────────────────────────────────────────────────────────────────
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const envPath = join(__dirname, '..', '.env');
dotenv.config({ path: envPath });

// ─────────────────────────────────────────────────────────────────────────────
// Configuration from environment
// ─────────────────────────────────────────────────────────────────────────────
const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI;
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;
const SUPABASE_BUCKET = process.env.SUPABASE_BUCKET || 'product-images';

// Validate required env vars
if (!MONGO_URI) {
  console.error('\x1b[31m❌ Missing MONGO_URI or MONGODB_URI in environment. Exiting.\x1b[0m');
  process.exit(1);
}
if (!SUPABASE_URL) {
  console.error('\x1b[31m❌ Missing SUPABASE_URL in environment. Exiting.\x1b[0m');
  process.exit(1);
}

// Determine which key to use
const SUPABASE_KEY = SUPABASE_SERVICE_ROLE_KEY || SUPABASE_ANON_KEY;
if (!SUPABASE_KEY) {
  console.error('\x1b[31m❌ Missing SUPABASE_SERVICE_ROLE_KEY and SUPABASE_ANON_KEY in environment. Exiting.\x1b[0m');
  process.exit(1);
}

if (!SUPABASE_SERVICE_ROLE_KEY) {
  console.warn('\x1b[33m⚠️  SUPABASE_SERVICE_ROLE_KEY not found. Using SUPABASE_ANON_KEY instead.\x1b[0m');
  console.warn('\x1b[33m   Storage listing may be limited. HEAD checks will still work for public buckets.\x1b[0m\n');
}

// ─────────────────────────────────────────────────────────────────────────────
// Initialize Supabase client
// ─────────────────────────────────────────────────────────────────────────────
const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_KEY);

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────
const CANDIDATE_FILENAMES = ['logo.png', 'logo.jpg', 'Logo.png', 'logo.jpeg', 'logo.webp', 'logo.svg'];
const RATE_LIMIT_DELAY_MS = 100; // 100ms between HEAD requests

// Patterns for broken/incomplete logo paths
const BROKEN_PATH_PATTERNS = [
  /\/brands\/logo\.(png|jpg|jpeg|svg|webp)$/i,  // Missing slug: /brands/logo.png
  /^brands\/logo\.(png|jpg|jpeg|svg|webp)$/i,   // Missing slug: brands/logo.png
  /^logo\.(png|jpg|jpeg|svg|webp)$/i,           // Just filename: logo.png
];

// ─────────────────────────────────────────────────────────────────────────────
// Mongoose Brand Schema (minimal, matches existing)
// ─────────────────────────────────────────────────────────────────────────────
const brandSchema = new mongoose.Schema({
  name: String,
  slug: String,
  logoUrl: String,
  logo_url: String,
  logo: String,
  description: String
}, { collection: 'brands', strict: false });

const Brand = mongoose.model('Brand', brandSchema);

// ─────────────────────────────────────────────────────────────────────────────
// Helper Functions
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Simple slugify: lowercase, trim, replace spaces/underscores with dashes,
 * remove non-alphanumeric chars, collapse multiple dashes
 */
function slugify(str) {
  if (!str) return '';
  return str
    .trim()
    .toLowerCase()
    .replace(/[ _]+/g, '-')
    .replace(/[^a-z0-9\-]/g, '')
    .replace(/\-+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Get public URL for a storage path
 */
function getPublicUrl(storagePath) {
  const { data } = supabaseAdmin.storage.from(SUPABASE_BUCKET).getPublicUrl(storagePath);
  return data?.publicUrl || null;
}

/**
 * Check if URL exists via HEAD request
 * Returns { exists: boolean, contentType: string|null }
 */
async function checkUrlExists(url) {
  try {
    const res = await fetch(url, { method: 'HEAD' });
    const contentType = res.headers.get('content-type') || '';
    const isImage = contentType.startsWith('image/');
    return {
      exists: res.ok && isImage,
      contentType: contentType || null,
      status: res.status
    };
  } catch (err) {
    return { exists: false, contentType: null, status: 0 };
  }
}

/**
 * Sleep for given milliseconds
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Check if logoUrl is an external placeholder URL
 */
function isPlaceholderUrl(url) {
  if (!url) return false;
  return url.includes('via.placeholder.com');
}

/**
 * Check if logoUrl is a broken/incomplete path (missing slug)
 */
function isBrokenLogoPath(url) {
  if (!url) return false;
  for (const pattern of BROKEN_PATH_PATTERNS) {
    if (pattern.test(url)) return true;
  }
  return false;
}

/**
 * Get current logoUrl from brand (supports multiple field names)
 */
function getCurrentLogoUrl(brand) {
  return brand.logoUrl || brand.logo_url || brand.logo || null;
}

/**
 * Try to find a valid logo for a given slug by checking candidate filenames
 */
async function findLogoForSlug(slug) {
  if (!slug) return null;
  
  for (const filename of CANDIDATE_FILENAMES) {
    const storagePath = `brands/${slug}/${filename}`;
    const publicUrl = getPublicUrl(storagePath);
    
    if (!publicUrl) continue;

    const check = await checkUrlExists(publicUrl);
    await sleep(RATE_LIMIT_DELAY_MS);

    if (check.exists) {
      return { publicUrl, filename, storagePath };
    }
  }
  return null;
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Script
// ─────────────────────────────────────────────────────────────────────────────

async function main() {
  const args = process.argv.slice(2);
  const applyMode = args.includes('--apply');
  const dryMode = !applyMode;

  // Color codes for terminal output
  const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m'
  };

  console.log(`\n${colors.bright}${colors.cyan}🔧 Auto-Fix Brand Logos${colors.reset}`);
  console.log(`   Mode: ${applyMode ? colors.yellow + 'APPLY (will update DB)' : colors.green + 'DRY-RUN (preview only)'}${colors.reset}`);
  console.log(`   Supabase URL: ${SUPABASE_URL}`);
  console.log(`   Bucket: ${SUPABASE_BUCKET}`);
  console.log(`   Key type: ${SUPABASE_SERVICE_ROLE_KEY ? 'service_role' : 'anon'}\n`);

  try {
    // Connect to MongoDB
    await mongoose.connect(MONGO_URI);
    console.log(`${colors.green}✅ Connected to MongoDB${colors.reset}\n`);

    // Fetch all brands
    const brands = await Brand.find().lean();
    console.log(`${colors.blue}📦 Found ${brands.length} brand(s) in the database${colors.reset}\n`);

    // Track results
    const updates = [];
    const alreadyWorking = [];
    const notFound = [];
    const brokenPathsFixed = [];

    // Process each brand
    for (const brand of brands) {
      const brandId = brand._id;
      const brandName = brand.name || 'unknown';
      const currentLogoUrl = getCurrentLogoUrl(brand);
      const isPlaceholder = isPlaceholderUrl(currentLogoUrl);
      const isBroken = isBrokenLogoPath(currentLogoUrl);

      // Derive slug
      const slug = brand.slug ? slugify(brand.slug) : slugify(brandName);
      if (!slug) {
        console.warn(`${colors.yellow}⚠️  Skipping "${brandName}" (${brandId}): could not derive slug${colors.reset}`);
        notFound.push({ _id: brandId, name: brandName, reason: 'No valid slug' });
        continue;
      }

      // Check if current path is broken (missing slug like /brands/logo.png)
      if (isBroken) {
        console.log(`${colors.yellow}🔧 "${brandName}" has broken path (missing slug): ${currentLogoUrl}${colors.reset}`);
        const found = await findLogoForSlug(slug);
        if (found) {
          updates.push({
            _id: brandId,
            name: brandName,
            slug,
            oldLogoUrl: currentLogoUrl,
            newLogoUrl: found.publicUrl,
            filename: found.filename,
            reason: 'broken_path_fixed'
          });
          brokenPathsFixed.push({ name: brandName, oldPath: currentLogoUrl, newPath: found.publicUrl });
          console.log(`   ${colors.green}→ Found valid logo: ${found.publicUrl}${colors.reset}`);
          continue;
        } else {
          notFound.push({
            _id: brandId,
            name: brandName,
            slug,
            currentLogoUrl,
            reason: 'Broken path, no replacement found in storage'
          });
          console.log(`   ${colors.red}✗ No logo file found at brands/${slug}/${colors.reset}`);
          continue;
        }
      }

      // If current URL is a valid Supabase URL (not placeholder), verify it still works
      if (currentLogoUrl && !isPlaceholder && currentLogoUrl.includes(SUPABASE_URL)) {
        const check = await checkUrlExists(currentLogoUrl);
        await sleep(RATE_LIMIT_DELAY_MS);
        
        if (check.exists) {
          alreadyWorking.push({ _id: brandId, name: brandName, slug, logoUrl: currentLogoUrl });
          console.log(`${colors.green}✓  "${brandName}" already has working logo${colors.reset}`);
          continue;
        }
      }

      // Try candidate filenames
      const found = await findLogoForSlug(slug);

      if (found) {
        // Check if update is needed
        if (currentLogoUrl === found.publicUrl) {
          alreadyWorking.push({ _id: brandId, name: brandName, slug, logoUrl: found.publicUrl });
          console.log(`${colors.green}✓  "${brandName}" already has correct URL${colors.reset}`);
        } else {
          updates.push({
            _id: brandId,
            name: brandName,
            slug,
            oldLogoUrl: currentLogoUrl,
            newLogoUrl: found.publicUrl,
            filename: found.filename,
            reason: isPlaceholder ? 'placeholder_replaced' : 'url_updated'
          });
          console.log(`${colors.cyan}📝 "${brandName}"${colors.reset}`);
          console.log(`   Current: ${currentLogoUrl || '(empty)'}${isPlaceholder ? colors.yellow + ' [placeholder]' + colors.reset : ''}`);
          console.log(`   Found:   ${found.publicUrl}`);
          console.log(`   File:    ${found.filename}`);
          console.log('');
        }
      } else {
        notFound.push({
          _id: brandId,
          name: brandName,
          slug,
          currentLogoUrl,
          reason: 'No logo file found in storage'
        });
        console.log(`${colors.yellow}⚠️  "${brandName}" (${slug}): no logo file found in storage${colors.reset}`);
      }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Summary
    // ─────────────────────────────────────────────────────────────────────────
    console.log(`\n${colors.bright}═══════════════════════════════════════════════════════════════${colors.reset}`);
    console.log(`${colors.bright}📊 SUMMARY${colors.reset}`);
    console.log(`${colors.bright}═══════════════════════════════════════════════════════════════${colors.reset}`);
    console.log(`   ${colors.green}Working:${colors.reset}        ${alreadyWorking.length} brand(s)`);
    console.log(`   ${colors.cyan}To Update:${colors.reset}      ${updates.length} brand(s)`);
    if (brokenPathsFixed.length > 0) {
      console.log(`   ${colors.yellow}Broken Fixed:${colors.reset}   ${brokenPathsFixed.length} brand(s)`);
    }
    console.log(`   ${colors.yellow}Not Found:${colors.reset}      ${notFound.length} brand(s)`);
    console.log(`   ${colors.blue}Total:${colors.reset}          ${brands.length} brand(s)\n`);

    if (updates.length === 0) {
      console.log(`${colors.green}✅ No updates needed.${colors.reset}\n`);
      await mongoose.disconnect();
      return;
    }

    if (dryMode) {
      console.log(`${colors.yellow}ℹ️  Dry-run mode: no changes made.${colors.reset}`);
      console.log(`   Run with ${colors.bright}--apply${colors.reset} to update the database.\n`);
      
      // Show proposed updates
      console.log(`${colors.bright}Proposed Updates:${colors.reset}`);
      for (const u of updates) {
        console.log(`   • "${u.name}" → ${u.newLogoUrl}`);
      }
      console.log('');
      
      await mongoose.disconnect();
      return;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Apply Mode: Create backup and update
    // ─────────────────────────────────────────────────────────────────────────
    console.log(`${colors.cyan}🚀 Applying updates...${colors.reset}\n`);

    // Create backup directory if needed
    const backupsDir = join(__dirname, '..', 'backups');
    if (!existsSync(backupsDir)) {
      mkdirSync(backupsDir, { recursive: true });
    }

    // Write backup
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = join(backupsDir, `brands-backup-${timestamp}.json`);
    writeFileSync(backupPath, JSON.stringify(brands, null, 2), 'utf8');
    console.log(`${colors.green}💾 Backup saved to: ${backupPath}${colors.reset}\n`);

    // Perform updates
    let successCount = 0;
    let failCount = 0;

    for (const update of updates) {
      try {
        await Brand.findByIdAndUpdate(
          update._id,
          { $set: { logoUrl: update.newLogoUrl } },
          { new: true }
        );
        console.log(`   ${colors.green}✅${colors.reset} "${update.name}" updated`);
        successCount++;
      } catch (err) {
        console.error(`   ${colors.red}❌${colors.reset} "${update.name}" failed: ${err.message}`);
        failCount++;
      }
    }

    console.log(`\n${colors.bright}═══════════════════════════════════════════════════════════════${colors.reset}`);
    console.log(`${colors.green}✅ Done!${colors.reset} Updated ${successCount} brand(s), ${failCount} failed.\n`);

    // Print not-found brands that need manual attention
    if (notFound.length > 0) {
      console.log(`${colors.yellow}⚠️  Brands needing manual logo upload:${colors.reset}`);
      for (const nf of notFound) {
        console.log(`   • "${nf.name}" (${nf.slug})`);
        console.log(`     Upload to: ${SUPABASE_BUCKET}/brands/${nf.slug}/logo.png`);
      }
      console.log('');
    }

    // Print restart instructions
    console.log(`${colors.bright}Next Steps:${colors.reset}`);
    console.log(`   1. Restart backend:  ${colors.cyan}cd kk-backend && npm run dev${colors.reset}`);
    console.log(`   2. Restart frontend: ${colors.cyan}cd kk-frontend && npm run dev${colors.reset}`);
    console.log(`   3. Clear Next.js cache if needed: ${colors.cyan}cd kk-frontend && rm -rf .next${colors.reset}\n`);

    await mongoose.disconnect();

  } catch (err) {
    console.error(`\n${colors.red}❌ Unexpected error: ${err.message}${colors.reset}`);
    console.error(err.stack);
    await mongoose.disconnect();
    process.exit(1);
  }
}

main();
