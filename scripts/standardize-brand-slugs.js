#!/usr/bin/env node

/**
 * Script: Standardize Brand Slugs & Image Paths
 * 
 * Purpose:
 * - Normalizes all brand slugs to lowercase with hyphens
 * - Sets consistent imagePath = `brands/<slug>/logo.png`
 * - Does NOT modify logoUrl (use generate-brand-image-urls.js for that)
 * 
 * Usage:
 *   node scripts/standardize-brand-slugs.js [--dry-run]
 */

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

/**
 * Generate a standardized slug from brand name
 */
function generateSlug(name) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '') // remove special chars
    .replace(/\s+/g, '-')         // spaces to hyphens
    .replace(/-+/g, '-')          // collapse multiple hyphens
    .replace(/^-|-$/g, '');       // trim leading/trailing hyphens
}

/**
 * Main standardization function
 */
async function standardize() {
  const isDryRun = process.argv.includes('--dry-run');
  
  console.log(chalk.blue.bold('\n🔧 BRAND SLUG STANDARDIZATION\n'));
  
  if (isDryRun) {
    console.log(chalk.yellow('🔍 DRY RUN MODE - No changes will be saved\n'));
  }

  try {
    console.log(chalk.gray('Connecting to MongoDB...'));
    await mongoose.connect(process.env.MONGO_URI);
    console.log(chalk.green('✅ Connected to MongoDB\n'));

    const brands = await Brand.find().lean();
    console.log(chalk.blue(`📊 Found ${brands.length} brands\n`));

    const updates = [];
    const conflicts = [];

    // Check for slug conflicts
    const slugMap = new Map();

    for (const brand of brands) {
      const currentSlug = brand.slug || '';
      const normalizedSlug = generateSlug(brand.name);
      
      if (!normalizedSlug) {
        console.log(chalk.red(`❌ Cannot generate slug for: ${brand.name}`));
        continue;
      }

      // Check for conflicts
      if (slugMap.has(normalizedSlug)) {
        conflicts.push({
          slug: normalizedSlug,
          brands: [slugMap.get(normalizedSlug), brand.name],
        });
      } else {
        slugMap.set(normalizedSlug, brand.name);
      }

      const imagePath = `brands/${normalizedSlug}/logo.png`;
      
      const needsUpdate = 
        currentSlug !== normalizedSlug || 
        brand.imagePath !== imagePath;

      if (needsUpdate) {
        updates.push({
          _id: brand._id,
          name: brand.name,
          oldSlug: currentSlug,
          newSlug: normalizedSlug,
          oldImagePath: brand.imagePath || '(empty)',
          newImagePath: imagePath,
        });
      }
    }

    // Report conflicts
    if (conflicts.length > 0) {
      console.log(chalk.red.bold(`\n⚠️  SLUG CONFLICTS DETECTED (${conflicts.length}):\n`));
      conflicts.forEach(conflict => {
        console.log(chalk.red(`  Slug: ${conflict.slug}`));
        console.log(chalk.red(`  Brands: ${conflict.brands.join(', ')}`));
        console.log();
      });
      console.log(chalk.yellow('Please resolve conflicts manually before running this script.\n'));
      process.exit(1);
    }

    // Report changes
    if (updates.length === 0) {
      console.log(chalk.green('✅ All brands already have standardized slugs and image paths!\n'));
      process.exit(0);
    }

    console.log(chalk.yellow(`📝 ${updates.length} brands need updates:\n`));
    console.log(chalk.gray('─'.repeat(120)));
    
    updates.forEach(update => {
      console.log(chalk.bold(update.name));
      console.log(chalk.gray(`  Slug:       ${update.oldSlug} → ${chalk.cyan(update.newSlug)}`));
      console.log(chalk.gray(`  ImagePath:  ${update.oldImagePath} → ${chalk.cyan(update.newImagePath)}`));
      console.log(chalk.gray('─'.repeat(120)));
    });

    // Apply updates
    if (!isDryRun) {
      console.log(chalk.yellow('\n💾 Applying updates to MongoDB...\n'));
      
      for (const update of updates) {
        await Brand.findByIdAndUpdate(update._id, {
          slug: update.newSlug,
          imagePath: update.newImagePath,
        });
        console.log(chalk.green(`✅ Updated: ${update.name}`));
      }
      
      console.log(chalk.green.bold(`\n✅ Successfully updated ${updates.length} brands!\n`));
    } else {
      console.log(chalk.yellow('\n🔍 Dry run complete. Run without --dry-run to apply changes.\n'));
    }

  } catch (error) {
    console.error(chalk.red('\n❌ Error:'), error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
}

standardize();
