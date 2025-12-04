#!/usr/bin/env node

/**
 * Diagnostic Script: Check Supabase Brand Images
 * 
 * Purpose:
 * - Reads all brands from MongoDB
 * - Lists all files in Supabase bucket 'product-images/brands/'
 * - Detects missing/mismatched brand images
 * - Outputs detailed comparison table
 * 
 * Usage:
 *   node scripts/check-supabase-brand-images.js
 */

import { createClient } from '@supabase/supabase-js';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import chalk from 'chalk';

dotenv.config();

// MongoDB Brand Schema
const brandSchema = new mongoose.Schema({
  name: String,
  slug: String,
  logoUrl: String,
});
const Brand = mongoose.model('Brand', brandSchema);

// Supabase Client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error(chalk.red('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env'));
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Fetch all brand folders from Supabase
 */
async function getSupabaseBrandFolders() {
  const { data, error } = await supabase.storage
    .from('product-images')
    .list('brands', { limit: 200 });

  if (error) {
    console.error(chalk.red('❌ Error listing Supabase folders:'), error);
    return [];
  }

  return (data || []).map(item => item.name);
}

/**
 * Check if a file exists in Supabase
 */
async function checkFileExists(path) {
  try {
    const { data } = supabase.storage
      .from('product-images')
      .getPublicUrl(path);
    
    if (!data?.publicUrl) return false;
    
    // Verify with HEAD request
    const response = await fetch(data.publicUrl, { method: 'HEAD' });
    return response.ok;
  } catch (err) {
    return false;
  }
}

/**
 * Generate the correct Supabase public URL
 */
function getCorrectSupabaseUrl(slug) {
  const path = `brands/${slug}/logo.png`;
  const { data } = supabase.storage
    .from('product-images')
    .getPublicUrl(path);
  return data?.publicUrl || null;
}

/**
 * Main diagnostic function
 */
async function diagnose() {
  console.log(chalk.blue.bold('\n🔍 SUPABASE BRAND IMAGE DIAGNOSTIC\n'));
  console.log(chalk.gray('Connecting to MongoDB...'));
  
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log(chalk.green('✅ Connected to MongoDB\n'));

    // Fetch all brands from MongoDB
    const brands = await Brand.find().sort({ name: 1 }).lean();
    console.log(chalk.blue(`📊 Found ${brands.length} brands in MongoDB\n`));

    // Fetch all folders from Supabase
    const supabaseFolders = await getSupabaseBrandFolders();
    console.log(chalk.blue(`📁 Found ${supabaseFolders.length} folders in Supabase\n`));

    // Analyze each brand
    const results = [];
    
    for (const brand of brands) {
      const slug = brand.slug || '';
      const mongoLogoUrl = brand.logoUrl || '';
      
      // Check if folder exists in Supabase
      const folderExists = supabaseFolders.includes(slug);
      
      // Check if logo.png exists
      const logoPath = `brands/${slug}/logo.png`;
      const fileExists = folderExists ? await checkFileExists(logoPath) : false;
      
      // Generate correct URL
      const correctUrl = getCorrectSupabaseUrl(slug);
      
      // Determine status
      let status = '✅ MATCH';
      let issue = '';
      
      if (!folderExists) {
        status = '❌ MISSING FOLDER';
        issue = `Folder 'brands/${slug}/' does not exist in Supabase`;
      } else if (!fileExists) {
        status = '⚠️  MISSING FILE';
        issue = `File 'logo.png' not found in brands/${slug}/`;
      } else if (mongoLogoUrl.includes('via.placeholder.com')) {
        status = '⚠️  PLACEHOLDER';
        issue = 'MongoDB has placeholder URL instead of Supabase URL';
      } else if (!mongoLogoUrl.startsWith('https://')) {
        status = '⚠️  RELATIVE PATH';
        issue = 'MongoDB has relative path instead of full Supabase URL';
      } else if (!mongoLogoUrl.includes(supabaseUrl)) {
        status = '⚠️  WRONG URL';
        issue = 'MongoDB URL does not point to Supabase';
      } else if (mongoLogoUrl !== correctUrl) {
        status = '⚠️  URL MISMATCH';
        issue = 'MongoDB URL differs from expected Supabase URL';
      }
      
      results.push({
        name: brand.name,
        slug,
        folderExists,
        fileExists,
        mongoLogoUrl,
        correctUrl,
        status,
        issue,
      });
    }

    // Print results table
    console.log(chalk.bold('\n📋 DIAGNOSTIC RESULTS:\n'));
    console.log(chalk.gray('─'.repeat(120)));
    console.log(
      chalk.bold('Status'.padEnd(20)) +
      chalk.bold('Brand Name'.padEnd(25)) +
      chalk.bold('Slug'.padEnd(25)) +
      chalk.bold('Folder'.padEnd(10)) +
      chalk.bold('File'.padEnd(10))
    );
    console.log(chalk.gray('─'.repeat(120)));

    let healthyCount = 0;
    let issueCount = 0;

    results.forEach(result => {
      const statusColor = result.status.includes('✅') ? chalk.green : 
                         result.status.includes('❌') ? chalk.red : chalk.yellow;
      
      console.log(
        statusColor(result.status.padEnd(20)) +
        chalk.white(result.name.padEnd(25).substring(0, 24)) +
        chalk.cyan(result.slug.padEnd(25).substring(0, 24)) +
        (result.folderExists ? chalk.green('YES') : chalk.red('NO ')).padEnd(10) +
        (result.fileExists ? chalk.green('YES') : chalk.red('NO ')).padEnd(10)
      );

      if (result.issue) {
        console.log(chalk.gray(`  └─ ${result.issue}`));
      }

      if (result.status === '✅ MATCH') {
        healthyCount++;
      } else {
        issueCount++;
        console.log(chalk.gray(`  └─ MongoDB URL: ${result.mongoLogoUrl || '(empty)'}`));
        console.log(chalk.gray(`  └─ Correct URL: ${result.correctUrl}`));
      }
      
      console.log(chalk.gray('─'.repeat(120)));
    });

    // Summary
    console.log(chalk.bold('\n📊 SUMMARY:\n'));
    console.log(chalk.green(`✅ Healthy: ${healthyCount} brands`));
    console.log(chalk.yellow(`⚠️  Issues: ${issueCount} brands`));
    
    // Missing folders
    const missingFolders = results.filter(r => !r.folderExists);
    if (missingFolders.length > 0) {
      console.log(chalk.red(`\n❌ Brands missing folders in Supabase (${missingFolders.length}):`));
      missingFolders.forEach(b => console.log(chalk.red(`   - ${b.name} (${b.slug})`)));
    }

    // Placeholder URLs
    const placeholders = results.filter(r => r.mongoLogoUrl.includes('via.placeholder.com'));
    if (placeholders.length > 0) {
      console.log(chalk.yellow(`\n⚠️  Brands with placeholder URLs (${placeholders.length}):`));
      placeholders.forEach(b => console.log(chalk.yellow(`   - ${b.name} (${b.slug})`)));
    }

    // Case sensitivity warnings
    const caseMismatches = supabaseFolders.filter(folder => {
      const matchingBrand = brands.find(b => b.slug?.toLowerCase() === folder.toLowerCase());
      return matchingBrand && matchingBrand.slug !== folder;
    });
    
    if (caseMismatches.length > 0) {
      console.log(chalk.yellow(`\n⚠️  Case sensitivity mismatches detected (${caseMismatches.length}):`));
      caseMismatches.forEach(folder => {
        const brand = brands.find(b => b.slug?.toLowerCase() === folder.toLowerCase());
        console.log(chalk.yellow(`   - MongoDB slug: "${brand.slug}" vs Supabase folder: "${folder}"`));
      });
    }

    console.log(chalk.blue.bold('\n✅ Diagnostic complete!\n'));

  } catch (error) {
    console.error(chalk.red('\n❌ Error during diagnosis:'), error);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

diagnose();
