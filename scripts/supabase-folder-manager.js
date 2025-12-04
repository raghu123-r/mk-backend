#!/usr/bin/env node

/**
 * Supabase Brand Folder Manager
 * 
 * Purpose:
 * - Rename/move brand folders in Supabase to match MongoDB slugs
 * - Fix case sensitivity issues
 * - Create missing folders
 * 
 * Usage:
 *   node scripts/supabase-folder-manager.js [command] [options]
 * 
 * Commands:
 *   check              Check for folder mismatches
 *   rename [old] [new] Rename a single folder
 *   sync               Sync all folders to match MongoDB slugs (requires manual confirmation)
 *   create [slug]      Create a new brand folder
 */

import { createClient } from '@supabase/supabase-js';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import chalk from 'chalk';
import * as readline from 'readline';

dotenv.config();

const brandSchema = new mongoose.Schema({
  name: String,
  slug: String,
});
const Brand = mongoose.model('Brand', brandSchema);

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error(chalk.red('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY'));
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Prompt user for confirmation
 */
function askConfirmation(question) {
  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });
    
    rl.question(chalk.yellow(`${question} (yes/no): `), (answer) => {
      rl.close();
      resolve(answer.toLowerCase() === 'yes' || answer.toLowerCase() === 'y');
    });
  });
}

/**
 * List all folders in brands/
 */
async function listBrandFolders() {
  const { data, error } = await supabase.storage
    .from('product-images')
    .list('brands', { limit: 200 });

  if (error) throw error;
  return (data || []).map(item => item.name);
}

/**
 * Copy a folder (Supabase doesn't have native move/rename)
 * Note: This requires downloading and re-uploading
 */
async function copyBrandFolder(oldSlug, newSlug) {
  console.log(chalk.yellow(`Copying folder: brands/${oldSlug}/ → brands/${newSlug}/`));
  
  // List files in old folder
  const { data: files, error: listError } = await supabase.storage
    .from('product-images')
    .list(`brands/${oldSlug}`);

  if (listError) throw listError;
  
  if (!files || files.length === 0) {
    console.log(chalk.yellow('  No files to copy'));
    return;
  }

  console.log(chalk.gray(`  Found ${files.length} file(s)`));

  // Copy each file
  for (const file of files) {
    const oldPath = `brands/${oldSlug}/${file.name}`;
    const newPath = `brands/${newSlug}/${file.name}`;
    
    console.log(chalk.gray(`  Copying: ${file.name}...`));

    // Download file
    const { data: downloadData, error: downloadError } = await supabase.storage
      .from('product-images')
      .download(oldPath);

    if (downloadError) {
      console.log(chalk.red(`  ❌ Failed to download ${file.name}: ${downloadError.message}`));
      continue;
    }

    // Upload to new location
    const { error: uploadError } = await supabase.storage
      .from('product-images')
      .upload(newPath, downloadData, {
        contentType: file.metadata?.mimetype || 'image/png',
        upsert: true,
      });

    if (uploadError) {
      console.log(chalk.red(`  ❌ Failed to upload ${file.name}: ${uploadError.message}`));
    } else {
      console.log(chalk.green(`  ✅ Copied ${file.name}`));
    }
  }
}

/**
 * Delete a folder and its contents
 */
async function deleteBrandFolder(slug, skipConfirmation = false) {
  if (!skipConfirmation) {
    const confirmed = await askConfirmation(`Delete folder brands/${slug}/ and all its contents?`);
    if (!confirmed) {
      console.log(chalk.yellow('Cancelled'));
      return false;
    }
  }

  console.log(chalk.yellow(`Deleting folder: brands/${slug}/`));

  // List files
  const { data: files, error: listError } = await supabase.storage
    .from('product-images')
    .list(`brands/${slug}`);

  if (listError) throw listError;

  if (!files || files.length === 0) {
    console.log(chalk.gray('  No files to delete'));
    return true;
  }

  // Delete all files
  const filePaths = files.map(f => `brands/${slug}/${f.name}`);
  
  const { error: deleteError } = await supabase.storage
    .from('product-images')
    .remove(filePaths);

  if (deleteError) {
    console.log(chalk.red(`  ❌ Failed to delete files: ${deleteError.message}`));
    return false;
  }

  console.log(chalk.green(`  ✅ Deleted ${files.length} file(s)`));
  return true;
}

/**
 * Command: Check for mismatches
 */
async function checkCommand() {
  console.log(chalk.blue.bold('\n🔍 CHECKING FOLDER MISMATCHES\n'));

  await mongoose.connect(process.env.MONGO_URI);
  const brands = await Brand.find().lean();
  const folders = await listBrandFolders();

  console.log(chalk.blue(`📊 MongoDB brands: ${brands.length}`));
  console.log(chalk.blue(`📁 Supabase folders: ${folders.length}\n`));

  const mismatches = [];
  const missing = [];

  for (const brand of brands) {
    const slug = brand.slug;
    
    if (!folders.includes(slug)) {
      // Check for case-insensitive match
      const caseMatch = folders.find(f => f.toLowerCase() === slug.toLowerCase());
      
      if (caseMatch) {
        mismatches.push({
          brand: brand.name,
          mongoSlug: slug,
          supabaseFolder: caseMatch,
          type: 'case',
        });
      } else {
        missing.push({
          brand: brand.name,
          slug,
        });
      }
    }
  }

  if (mismatches.length > 0) {
    console.log(chalk.yellow.bold(`⚠️  CASE MISMATCHES (${mismatches.length}):\n`));
    mismatches.forEach(m => {
      console.log(chalk.yellow(`  Brand: ${m.brand}`));
      console.log(chalk.yellow(`    MongoDB slug:      ${m.mongoSlug}`));
      console.log(chalk.yellow(`    Supabase folder:   ${m.supabaseFolder}`));
      console.log();
    });
  }

  if (missing.length > 0) {
    console.log(chalk.red.bold(`❌ MISSING FOLDERS (${missing.length}):\n`));
    missing.forEach(m => {
      console.log(chalk.red(`  ${m.brand} → brands/${m.slug}/`));
    });
  }

  if (mismatches.length === 0 && missing.length === 0) {
    console.log(chalk.green('✅ All folders match MongoDB slugs!\n'));
  }

  await mongoose.disconnect();
}

/**
 * Command: Rename a folder
 */
async function renameCommand(oldSlug, newSlug) {
  if (!oldSlug || !newSlug) {
    console.error(chalk.red('Usage: node supabase-folder-manager.js rename [old-slug] [new-slug]'));
    process.exit(1);
  }

  console.log(chalk.blue.bold('\n🔄 RENAME FOLDER\n'));
  console.log(chalk.gray(`From: brands/${oldSlug}/`));
  console.log(chalk.gray(`To:   brands/${newSlug}/\n`));

  const confirmed = await askConfirmation('Proceed with rename?');
  if (!confirmed) {
    console.log(chalk.yellow('Cancelled'));
    return;
  }

  try {
    await copyBrandFolder(oldSlug, newSlug);
    await deleteBrandFolder(oldSlug, true);
    console.log(chalk.green.bold('\n✅ Rename complete!\n'));
  } catch (error) {
    console.error(chalk.red('\n❌ Error:'), error);
  }
}

/**
 * Command: Create folder
 */
async function createCommand(slug) {
  if (!slug) {
    console.error(chalk.red('Usage: node supabase-folder-manager.js create [slug]'));
    process.exit(1);
  }

  console.log(chalk.blue.bold(`\n📁 CREATE FOLDER: brands/${slug}/\n`));
  console.log(chalk.yellow('Note: Upload a logo.png file to complete setup'));
  console.log(chalk.gray(`You can upload via Supabase dashboard or use the upload API\n`));
}

/**
 * Main
 */
async function main() {
  const [,, command, ...args] = process.argv;

  if (!command) {
    console.log(chalk.blue.bold('Supabase Brand Folder Manager\n'));
    console.log('Commands:');
    console.log('  check              - Check for folder mismatches');
    console.log('  rename [old] [new] - Rename a folder');
    console.log('  create [slug]      - Info for creating a folder');
    console.log();
    process.exit(0);
  }

  try {
    switch (command) {
      case 'check':
        await checkCommand();
        break;
      case 'rename':
        await renameCommand(args[0], args[1]);
        break;
      case 'create':
        await createCommand(args[0]);
        break;
      default:
        console.error(chalk.red(`Unknown command: ${command}`));
        process.exit(1);
    }
  } catch (error) {
    console.error(chalk.red('\n❌ Error:'), error);
    process.exit(1);
  }
}

main();
