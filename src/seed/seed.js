// seed/seed.js
// Usage:
//   export MONGO_URI="mongodb+srv://<user>:<pass>@cluster.../kitchen_kettles"
//   node seed/seed.js

import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Load env
dotenv.config();

import Brand from '../models/Brand.js';
import Category from '../models/Category.js';
import Product from '../models/Product.js';

const uri = process.env.MONGO_URI;
if (!uri) {
  console.error('ERROR: MONGO_URI environment variable is not set. Aborting.');
  process.exit(1);
}

// --- BRANDS ---
const brands = [
  { name: "Home Essentials", slug: "home-essentials", logoUrl: "https://via.placeholder.com/150x50?text=Home+Essentials" },
  { name: "Premium Cookware", slug: "premium-cookware", logoUrl: "https://via.placeholder.com/150x50?text=Premium+Cookware" },
  { name: "Bake Master", slug: "bake-master", logoUrl: "https://via.placeholder.com/150x50?text=Bake+Master" },
  { name: "Storage Solutions", slug: "storage-solutions", logoUrl: "https://via.placeholder.com/150x50?text=Storage+Solutions" },
  { name: "Kitchen Tools Co", slug: "kitchen-tools-co", logoUrl: "https://via.placeholder.com/150x50?text=Kitchen+Tools+Co" }
];

// --- CATEGORIES ---
const categories = [
  { name: "Cookware", slug: "cookware", parent: null },
  { name: "Storage", slug: "storage", parent: null },
  { name: "Bakeware", slug: "bakeware", parent: null },
  { name: "Cutlery", slug: "cutlery", parent: null },
  { name: "Appliances", slug: "appliances", parent: null },
  { name: "Utensils", slug: "utensils", parent: null },
  { name: "Serveware", slug: "serveware", parent: null }
];

// --- 40 PRODUCTS ---
// Each product: title, slug, brandSlug, categorySlug, description, price, mrp, stock, attributes
const products = [
  { title:"Non-stick Fry Pan 24cm", slug:"non-stick-fry-pan-24cm", brandSlug:"premium-cookware", categorySlug:"cookware", description:"24cm non-stick fry pan with ergonomic handle.", price:1199, mrp:1999, stock:50, attributes:{ratingAvg:4.3, ratingCount:45} },
  { title:"Tempered Glass Food Storage Set (3pcs)", slug:"tempered-glass-storage-set-3pcs", brandSlug:"storage-solutions", categorySlug:"storage", description:"Borosilicate glass containers with airtight lids.", price:1599, mrp:2299, stock:45, attributes:{ratingAvg:4.4, ratingCount:15} },
  { title:"Chef Knife 8-inch", slug:"chef-knife-8-inch", brandSlug:"kitchen-tools-co", categorySlug:"cutlery", description:"High-carbon stainless steel chef knife for everyday use.", price:1299, mrp:2299, stock:70, attributes:{ratingAvg:4.6, ratingCount:110} },
  { title:"Stainless Steel Saucepan 18cm", slug:"stainless-steel-saucepan-18cm", brandSlug:"premium-cookware", categorySlug:"cookware", description:"18cm stainless steel saucepan with lid.", price:1499, mrp:2499, stock:30, attributes:{ratingAvg:4.2, ratingCount:60} },
  { title:"3-Tier Bamboo Dish Rack", slug:"3-tier-bamboo-dish-rack", brandSlug:"home-essentials", categorySlug:"serveware", description:"Space-saving bamboo dish rack with utensil holder.", price:899, mrp:1499, stock:120, attributes:{ratingAvg:4.1, ratingCount:25} },
  { title:"Silicone Baking Mat (Set of 2)", slug:"silicone-baking-mat-set-2", brandSlug:"bake-master", categorySlug:"bakeware", description:"Reusable non-stick silicone baking mats, set of 2.", price:599, mrp:999, stock:200, attributes:{ratingAvg:4.5, ratingCount:78} },
  { title:"Electric Hand Mixer 300W", slug:"electric-hand-mixer-300w", brandSlug:"kitchen-tools-co", categorySlug:"appliances", description:"Compact hand mixer with 5 speeds and turbo.", price:2199, mrp:3499, stock:40, attributes:{ratingAvg:4.0, ratingCount:18} },
  { title:"Stainless Steel Mixing Bowl Set (3pcs)", slug:"stainless-mixing-bowl-set-3pcs", brandSlug:"home-essentials", categorySlug:"utensils", description:"Durable mixing bowls with non-slip base.", price:799, mrp:1299, stock:85, attributes:{ratingAvg:4.3, ratingCount:55} },
  { title:"Glass Measuring Jug 1L", slug:"glass-measuring-jug-1l", brandSlug:"home-essentials", categorySlug:"utensils", description:"Heat-resistant glass measuring jug with pour spout.", price:349, mrp:599, stock:140, attributes:{ratingAvg:4.2, ratingCount:33} },
  { title:"Cast Iron Skillet 26cm", slug:"cast-iron-skillet-26cm", brandSlug:"premium-cookware", categorySlug:"cookware", description:"Pre-seasoned cast iron skillet for high-heat cooking.", price:2599, mrp:3999, stock:25, attributes:{ratingAvg:4.7, ratingCount:190} },
  { title:"Air-tight Plastic Container Set (5pcs)", slug:"airtight-plastic-container-set-5pcs", brandSlug:"storage-solutions", categorySlug:"storage", description:"Nesting storage containers with lids.", price:699, mrp:1199, stock:95, attributes:{ratingAvg:4.0, ratingCount:48} },
  { title:"Baking Tray Non-stick 30x20cm", slug:"baking-tray-non-stick-30x20cm", brandSlug:"bake-master", categorySlug:"bakeware", description:"Durable non-stick baking tray for cookies and baking.", price:549, mrp:899, stock:110, attributes:{ratingAvg:4.1, ratingCount:21} },
  { title:"Paring Knife 3.5-inch", slug:"paring-knife-3-5-inch", brandSlug:"kitchen-tools-co", categorySlug:"cutlery", description:"Precision paring knife for peeling and trimming.", price:399, mrp:699, stock:150, attributes:{ratingAvg:4.4, ratingCount:60} },
  { title:"Electric Kettle 1.8L", slug:"electric-kettle-1-8l", brandSlug:"home-essentials", categorySlug:"appliances", description:"Fast-boil electric kettle with automatic shut-off.", price:1999, mrp:2999, stock:60, attributes:{ratingAvg:4.3, ratingCount:89} },
  { title:"Bamboo Cutting Board Large", slug:"bamboo-cutting-board-large", brandSlug:"home-essentials", categorySlug:"utensils", description:"Large bamboo cutting board with juice groove.", price:799, mrp:1299, stock:80, attributes:{ratingAvg:4.2, ratingCount:40} },
  { title:"3-Liter Pressure Cooker", slug:"3-liter-pressure-cooker", brandSlug:"premium-cookware", categorySlug:"cookware", description:"Stainless steel pressure cooker with safety valve.", price:2999, mrp:4599, stock:20, attributes:{ratingAvg:4.6, ratingCount:120} },
  { title:"Oven Thermometer Analog", slug:"oven-thermometer-analog", brandSlug:"bake-master", categorySlug:"bakeware", description:"High temperature analog oven thermometer.", price:299, mrp:499, stock:220, attributes:{ratingAvg:4.0, ratingCount:12} },
  { title:"Knife Sharpener 2-stage", slug:"knife-sharpener-2-stage", brandSlug:"kitchen-tools-co", categorySlug:"utensils", description:"Two-stage stone sharpener for kitchen knives.", price:449, mrp:799, stock:95, attributes:{ratingAvg:4.1, ratingCount:27} },
  { title:"Insulated Lunch Box 1.2L", slug:"insulated-lunch-box-1-2l", brandSlug:"storage-solutions", categorySlug:"storage", description:"Leak-resistant insulated lunch box with compartments.", price:749, mrp:1299, stock:60, attributes:{ratingAvg:4.2, ratingCount:34} },
  { title:"Stainless Tongs 30cm", slug:"stainless-tongs-30cm", brandSlug:"kitchen-tools-co", categorySlug:"utensils", description:"Long stainless tongs for grilling and serving.", price:299, mrp:499, stock:200, attributes:{ratingAvg:4.3, ratingCount:54} },
  { title:"Ceramic Dinner Plate Set (4pcs)", slug:"ceramic-dinner-plate-set-4pcs", brandSlug:"home-essentials", categorySlug:"serveware", description:"Classic ceramic plates, dishwasher safe.", price:1599, mrp:2499, stock:48, attributes:{ratingAvg:4.0, ratingCount:20} },
  { title:"Silicone Spatula Set (3pcs)", slug:"silicone-spatula-set-3pcs", brandSlug:"kitchen-tools-co", categorySlug:"utensils", description:"Heat-resistant silicone spatulas for baking.", price:399, mrp:699, stock:180, attributes:{ratingAvg:4.4, ratingCount:67} },
  { title:"Rolling Pin - Wooden", slug:"rolling-pin-wooden", brandSlug:"bake-master", categorySlug:"bakeware", description:"Classic wooden rolling pin for dough and pastries.", price:299, mrp:499, stock:140, attributes:{ratingAvg:4.2, ratingCount:22} },
  { title:"Glass Teapot with Infuser", slug:"glass-teapot-with-infuser", brandSlug:"home-essentials", categorySlug:"serveware", description:"Heat-safe glass teapot with stainless infuser.", price:1199, mrp:1799, stock:30, attributes:{ratingAvg:4.5, ratingCount:70} },
  { title:"Rice Cooker 1.5L", slug:"rice-cooker-1-5l", brandSlug:"premium-cookware", categorySlug:"appliances", description:"Compact rice cooker with keep-warm function.", price:2499, mrp:3599, stock:55, attributes:{ratingAvg:4.2, ratingCount:48} },
  { title:"Multi-purpose Grater", slug:"multi-purpose-grater", brandSlug:"kitchen-tools-co", categorySlug:"utensils", description:"4-sided stainless grater for cheese and vegetables.", price:399, mrp:699, stock:160, attributes:{ratingAvg:4.1, ratingCount:31} },
  { title:"Microwave-Safe Glass Bowl Set (3pcs)", slug:"microwave-glass-bowl-set-3pcs", brandSlug:"storage-solutions", categorySlug:"storage", description:"Durable glass bowl set, microwave & oven safe.", price:1399, mrp:1999, stock:70, attributes:{ratingAvg:4.3, ratingCount:29} },
  { title:"Stovetop Coffee Maker 6-cup", slug:"stovetop-coffee-maker-6-cup", brandSlug:"home-essentials", categorySlug:"appliances", description:"Classic stovetop coffee maker for strong espresso.", price:999, mrp:1499, stock:85, attributes:{ratingAvg:4.0, ratingCount:40} },
  { title:"Oval Roasting Pan 40cm", slug:"oval-roasting-pan-40cm", brandSlug:"premium-cookware", categorySlug:"cookware", description:"Large roasting pan for poultry and roasts.", price:2199, mrp:3299, stock:22, attributes:{ratingAvg:4.3, ratingCount:25} },
  { title:"Bento Box Stainless Steel", slug:"bento-box-stainless-steel", brandSlug:"storage-solutions", categorySlug:"storage", description:"Durable stainless bento box with compartments.", price:899, mrp:1499, stock:90, attributes:{ratingAvg:4.1, ratingCount:15} },
  { title:"Cookie Cutter Set 12pcs", slug:"cookie-cutter-set-12pcs", brandSlug:"bake-master", categorySlug:"bakeware", description:"Assorted shapes cookie cutter set for baking.", price:299, mrp:499, stock:210, attributes:{ratingAvg:4.2, ratingCount:18} },
  { title:"Vegetable Steamer Basket", slug:"vegetable-steamer-basket", brandSlug:"home-essentials", categorySlug:"cookware", description:"Collapsible stainless steamer basket.", price:399, mrp:699, stock:130, attributes:{ratingAvg:4.0, ratingCount:28} },
  { title:"Electric Sandwich Maker", slug:"electric-sandwich-maker", brandSlug:"kitchen-tools-co", categorySlug:"appliances", description:"Non-stick sandwich maker with indicator lights.", price:1799, mrp:2599, stock:48, attributes:{ratingAvg:4.1, ratingCount:33} },
  { title:"Serving Spoon Set (3pcs)", slug:"serving-spoon-set-3pcs", brandSlug:"home-essentials", categorySlug:"serveware", description:"Stainless serving spoons for dining.", price:299, mrp:499, stock:190, attributes:{ratingAvg:4.2, ratingCount:14} },
  { title:"Cutting Board Oil Maintenance Kit", slug:"cutting-board-oil-kit", brandSlug:"home-essentials", categorySlug:"utensils", description:"Food-safe oil for wooden cutting board maintenance.", price:349, mrp:599, stock:120, attributes:{ratingAvg:4.3, ratingCount:9} },
  { title:"Stainless Steel Whisk 25cm", slug:"stainless-steel-whisk-25cm", brandSlug:"kitchen-tools-co", categorySlug:"utensils", description:"Balloon whisk for mixing and whipping.", price:249, mrp:399, stock:250, attributes:{ratingAvg:4.5, ratingCount:58} }
];

// ---- main ----
async function run() {
  await mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });
  console.log('Connected to MongoDB');

  // Upsert brands
  let upsertedBrands = 0;
  for (const b of brands) {
    const r = await Brand.updateOne({ slug: b.slug }, { $set: b }, { upsert: true });
    if (r.upsertedCount || r.nModified) upsertedBrands++;
  }
  console.log('Brands processed:', brands.length, ' (upserted/modified count approximate):', upsertedBrands);

  // Upsert categories
  let upsertedCats = 0;
  for (const c of categories) {
    const r = await Category.updateOne({ slug: c.slug }, { $set: c }, { upsert: true });
    if (r.upsertedCount || r.nModified) upsertedCats++;
  }
  console.log('Categories processed:', categories.length, ' (upserted/modified count approximate):', upsertedCats);

  // Build maps
  const brandDocs = await Brand.find().lean();
  const catDocs = await Category.find().lean();
  const brandMap = Object.fromEntries(brandDocs.map(d => [d.slug, d._id]));
  const catMap = Object.fromEntries(catDocs.map(d => [d.slug, d._id]));

  // Prepare product docs (map slugs to ids)
  const docs = products.map(p => ({
    title: p.title,
    slug: p.slug,
    brand: brandMap[p.brandSlug],
    category: catMap[p.categorySlug],
    description: p.description || '',
    images: Array.isArray(p.images) ? p.images : [],
    price: p.price,
    mrp: p.mrp,
    stock: p.stock || 0,
    attributes: {
      ratingAvg: (p.attributes && p.attributes.ratingAvg) || 0,
      ratingCount: (p.attributes && p.attributes.ratingCount) || 0
    },
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  }));

  // Insert or upsert products by slug
  let inserted = 0;
  let updated = 0;
  for (const d of docs) {
    if (!d.brand || !d.category) {
      console.warn('Skipping product because brand/category not found for slug:', d.slug);
      continue;
    }
    // Upsert by slug
    const res = await Product.updateOne({ slug: d.slug }, { $set: d }, { upsert: true });
    if (res.upsertedCount) inserted++;
    if (res.nModified) updated++;
  }

  console.log('Products processed:', docs.length, ' inserted:', inserted, ' updated:', updated);
  await mongoose.disconnect();
  console.log('Done. Referenced screenshot (for context): /mnt/data/691c69c5-3676-41ac-96c3-d0e810c573e3.png');
  process.exit(0);
}

run().catch(err => {
  console.error('Seeder error:', err);
  process.exit(1);
});
