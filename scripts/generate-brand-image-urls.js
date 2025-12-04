#!/usr/bin/env node

/**
 * Script: Generate Brand Image URLs from Supabase
 * 
 * Purpose:
 * - Generates correct Supabase public URLs for each brand
 * - Verifies files exist before updating
 * - Updates logoUrl in MongoDB with full Supabase URLs
 * - Replaces placeholder URLs with real Supabase URLs
 * 
 * Usage:
 *   node scripts/generate-brand-image-urls.js [--dry-run] [--force]
 * 
 * Options:
 *   --dry-run    Show what would change without saving
 *   --force      Update even if logoUrl already exists (unless it's already correct)
 */

import { createClient } from '@supabase/supabase-js';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import chalk from 'chalk';

dotenv.config();

const brandSchema = new mongoose.Schema({
  name: String,
  slug: String,
  logoUrl: String,
  imagePath: String,
}, { timestamps: true });

const Brand = mongoose.model('Brand', brandSchema);

// Supabase Client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error(chalk.red('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY'));
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Check if file exists in Supabase and return public URL
 */
async function getVerifiedImageUrl(slug) {
  const candidates = [
    'logo.png',
    'logo.jpg',
    'logo.jpeg',
    'Logo.png',
    'logo.webp',
    'logo.svg',
  ];

  for (const filename of candidates) {
    const path = `brands/${slug}/${filename}`;
    
    try {
      // Get public URL
      const { data } = supabase.storage
        .from('product-images')
        .getPublicUrl(path);

      if (!data?.publicUrl) continue;

      // Verify file exists with HEAD request
      const response = await fetch(data.publicUrl, { method: 'HEAD' });
      
      if (response.ok) {
        return {
          url: data.publicUrl,
          path,
          filename,
        };
      }
    } catch (err) {
      // Continue to next candidate
    }
  }

  return null;
}

/**
 * Main function
 */
async function generateUrls() {
  const isDryRun = process.argv.includes('--dry-run');
  const force = process.argv.includes('--force');

  console.log(chalk.blue.bold('\n🔗 GENERATE BRAND IMAGE URLs\n'));
  
  if (isDryRun) {
    console.log(chalk.yellow('🔍 DRY RUN MODE - No changes will be saved\n'));
  }
  
  if (force) {
    console.log(chalk.yellow('⚡ FORCE MODE - Will update existing URLs\n'));
  }

  try {
    console.log(chalk.gray('Connecting to MongoDB...'));
    await mongoose.connect(process.env.MONGO_URI);
    console.log(chalk.green('✅ Connected to MongoDB\n'));

    const brands = await Brand.find().lean();
    console.log(chalk.blue(`📊 Processing ${brands.length} brands...\n`));

    const updates = [];
    const missing = [];
    const skipped = [];

    for (const brand of brands) {
      const currentUrl = brand.logoUrl || '';
      const slug = brand.slug || '';

      if (!slug) {
        console.log(chalk.red(`❌ Brand has no slug: ${brand.name}`));
        missing.push({ name: brand.name, reason: 'No slug' });
        continue;
      }

      // Skip if already has correct URL (unless force mode)
      const isPlaceholder = currentUrl.includes('via.placeholder.com');
      const isRelativePath = currentUrl && !currentUrl.startsWith('http');
      const isCorrectUrl = currentUrl.startsWith(supabaseUrl) && 
                          currentUrl.includes(`/brands/${slug}/logo.`);

      if (isCorrectUrl && !force) {
        skipped.push({ name: brand.name, slug, reason: 'Already correct' });
        continue;
      }

      // Try to find image in Supabase
      console.log(chalk.gray(`Checking Supabase for: ${brand.name} (${slug})...`));
      const verified = await getVerifiedImageUrl(slug);

      if (!verified) {
        console.log(chalk.red(`  ❌ No image found in Supabase`));
        missing.push({ 
          name: brand.name, 
          slug, 
          reason: `No file found in brands/${slug}/` 
        });
        continue;
      }

      console.log(chalk.green(`  ✅ Found: ${verified.filename}`));

      // Queue update
      updates.push({
        _id: brand._id,
        name: brand.name,
        slug,
        oldUrl: currentUrl || '(empty)',
        newUrl: verified.url,
        imagePath: verified.path,
        wasPlaceholder: isPlaceholder,
        wasRelative: isRelativePath,
      });
    }

    // Report results
    console.log(chalk.bold('\n📋 SUMMARY:\n'));
    console.log(chalk.green(`✅ Ready to update: ${updates.length} brands`));
    console.log(chalk.gray(`⏭️  Skipped: ${skipped.length} brands`));
    console.log(chalk.red(`❌ Missing images: ${missing.length} brands`));

    // Details for updates
    if (updates.length > 0) {
      console.log(chalk.yellow.bold(`\n📝 UPDATES TO APPLY (${updates.length}):\n`));
      console.log(chalk.gray('─'.repeat(120)));
      
      updates.forEach(update => {
        console.log(chalk.bold(update.name));
        
        if (update.wasPlaceholder) {
          console.log(chalk.yellow('  [PLACEHOLDER] Replacing placeholder URL'));
        } else if (update.wasRelative) {
          console.log(chalk.yellow('  [RELATIVE] Converting relative path to full URL'));
        } else if (update.oldUrl) {
          console.log(chalk.yellow('  [EXISTING] Replacing existing URL'));
        } else {
          console.log(chalk.blue('  [NEW] Setting new URL'));
        }
        
        console.log(chalk.gray(`  Old: ${update.oldUrl}`));
        console.log(chalk.cyan(`  New: ${update.newUrl}`));
        console.log(chalk.gray(`  Path: ${update.imagePath}`));
        console.log(chalk.gray('─'.repeat(120)));
      });
    }

    // Details for skipped
    if (skipped.length > 0) {
      console.log(chalk.gray.bold(`\n⏭️  SKIPPED (${skipped.length}):`));
      skipped.forEach(s => {
        console.log(chalk.gray(`  - ${s.name} (${s.reason})`));
      });
    }

    // Details for missing
    if (missing.length > 0) {
      console.log(chalk.red.bold(`\n❌ MISSING IMAGES (${missing.length}):`));
      missing.forEach(m => {
        console.log(chalk.red(`  - ${m.name}${m.slug ? ` (${m.slug})` : ''} - ${m.reason}`));
      });
      console.log(chalk.yellow('\n💡 Tip: Upload logo.png files to Supabase for these brands.'));
    }

    // Apply updates
    if (updates.length > 0 && !isDryRun) {
      console.log(chalk.yellow('\n💾 Applying updates to MongoDB...\n'));
      
      for (const update of updates) {
        await Brand.findByIdAndUpdate(update._id, {
          logoUrl: update.newUrl,
          imagePath: update.imagePath,
        });
        console.log(chalk.green(`✅ Updated: ${update.name}`));
      }
      
      console.log(chalk.green.bold(`\n✅ Successfully updated ${updates.length} brands!\n`));
    } else if (isDryRun && updates.length > 0) {
      console.log(chalk.yellow('\n🔍 Dry run complete. Run without --dry-run to apply changes.\n'));
    } else if (updates.length === 0) {
      console.log(chalk.green('\n✅ No updates needed!\n'));
    }

  } catch (error) {
    console.error(chalk.red('\n❌ Error:'), error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
}

generateUrls();
