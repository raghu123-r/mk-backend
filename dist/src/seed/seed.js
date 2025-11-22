// Create Products
const products = await Product.insertMany([
  {
    title: 'Stainless Steel Pressure Cooker',
    slug: 'stainless-steel-pressure-cooker',
    brand: brands[0]._id,
    category: categories[0]._id,
    description: 'High-quality stainless steel pressure cooker with safety features. Perfect for everyday cooking.',
    images: [
      'https://via.placeholder.com/400x400?text=Pressure+Cooker+1',
      'https://via.placeholder.com/400x400?text=Pressure+Cooker+2'
    ],
    price: 2499,
    mrp: 3499,
    stock: 50,
    attributes: new Map([
      ['capacity', '5 Liters'],
      ['material', 'Stainless Steel'],
      ['warranty', '2 Years']
    ]),
    ratingAvg: 4.5,
    ratingCount: 24,
    isActive: true
  },
  {
    title: 'Non-Stick Frying Pan Set',
    slug: 'non-stick-frying-pan-set',
    brand: brands[1]._id,
    category: categories[3]._id,
    description: 'Set of 3 non-stick frying pans in different sizes. PFOA-free coating for healthy cooking.',
    images: [
      'https://via.placeholder.com/400x400?text=Frying+Pan+Set+1',
      'https://via.placeholder.com/400x400?text=Frying+Pan+Set+2',
      'https://via.placeholder.com/400x400?text=Frying+Pan+Set+3'
    ],
    price: 1899,
    mrp: 2799,
    stock: 35,
    attributes: new Map([
      ['sizes', '20cm, 24cm, 28cm'],
      ['coating', 'Non-stick'],
      ['material', 'Aluminum'],
      ['warranty', '1 Year']
    ]),
    ratingAvg: 4.2,
    ratingCount: 18,
    isActive: true
  },
  {
    title: 'Electric Rice Cooker',
    slug: 'electric-rice-cooker',
    brand: brands[1]._id,
    category: categories[1]._id,
    description: 'Automatic electric rice cooker with keep-warm function. Cooks perfect rice every time.',
    images: [
      'https://via.placeholder.com/400x400?text=Rice+Cooker+1',
      'https://via.placeholder.com/400x400?text=Rice+Cooker+2'
    ],
    price: 3299,
    mrp: 4599,
    stock: 20,
    attributes: new Map([
      ['capacity', '1.8 Liters'],
      ['power', '700W'],
      ['type', 'Electric'],
      ['warranty', '2 Years']
    ]),
    ratingAvg: 4.7,
    ratingCount: 32,
    isActive: true
  },
  {
    title: 'Glass Food Storage Containers',
    slug: 'glass-food-storage-containers',
    brand: brands[3]._id,
    category: categories[4]._id,
    description: 'Set of 6 borosilicate glass containers with airtight lids. Microwave and dishwasher safe.',
    images: [
      'https://via.placeholder.com/400x400?text=Glass+Containers+1',
      'https://via.placeholder.com/400x400?text=Glass+Containers+2'
    ],
    price: 1599,
    mrp: 2299,
    stock: 45,
    attributes: new Map([
      ['material', 'Borosilicate Glass'],
      ['count', '6 pieces'],
      ['sizes', 'Various'],
      ['features', 'Airtight, Microwave Safe']
    ]),
    ratingAvg: 4.4,
    ratingCount: 15,
    isActive: true
  },
  {
    title: 'Professional Chef Knife',
    slug: 'professional-chef-knife',
    brand: brands[2]._id,
    category: categories[2]._id,
    description: 'High-carbon steel chef knife with ergonomic handle. Perfect for all cutting tasks.',
    images: [
      'https://via.placeholder.com/400x400?text=Chef+Knife+1'
    ],
    price: 2799,
    mrp: 3899,
    stock: 15,
    attributes: new Map([
      ['length', '8 inches'],
      ['material', 'High-carbon Steel'],
      ['handle', 'Ergonomic'],
      ['warranty', '5 Years']
    ]),
    ratingAvg: 4.8,
    ratingCount: 28,
    isActive: true
  },

  // -------------------------------
  // 👉 ADDING 10 NEW PRODUCTS HERE
  // -------------------------------

  {
    title: 'Hard-Anodized Deep Kadai with Lid',
    slug: 'hard-anodized-deep-kadai',
    brand: brands[0]._id,
    category: categories[0]._id,
    description: 'Durable deep kadai perfect for sautéing and frying.',
    images: ['https://via.placeholder.com/400x400?text=Deep+Kadai'],
    price: 1999,
    mrp: 2799,
    stock: 30,
    attributes: new Map([
      ['material', 'Hard-Anodized'],
      ['capacity', '3.5 Liters']
    ]),
    ratingAvg: 4.3,
    ratingCount: 20,
    isActive: true
  },
  {
    title: 'Induction Base Tawa',
    slug: 'induction-base-tawa',
    brand: brands[1]._id,
    category: categories[3]._id,
    description: 'Non-stick tawa suitable for induction and gas stoves.',
    images: ['https://via.placeholder.com/400x400?text=Tawa'],
    price: 899,
    mrp: 1299,
    stock: 60,
    attributes: new Map([
      ['diameter', '28cm'],
      ['coating', 'Non-stick']
    ]),
    ratingAvg: 4.1,
    ratingCount: 10,
    isActive: true
  },
  {
    title: 'Electric Hand Blender',
    slug: 'electric-hand-blender',
    brand: brands[1]._id,
    category: categories[1]._id,
    description: 'Handy electric blender for smoothies and mixing.',
    images: ['https://via.placeholder.com/400x400?text=Hand+Blender'],
    price: 1499,
    mrp: 2199,
    stock: 25,
    attributes: new Map([
      ['power', '300W'],
      ['speed', '2-speed']
    ]),
    ratingAvg: 4.6,
    ratingCount: 40,
    isActive: true
  },
  {
    title: 'Silicone Spatula Set',
    slug: 'silicone-spatula-set',
    brand: brands[3]._id,
    category: categories[2]._id,
    description: 'Set of 4 heat-resistant silicone spatulas.',
    images: ['https://via.placeholder.com/400x400?text=Spatula+Set'],
    price: 599,
    mrp: 899,
    stock: 100,
    attributes: new Map([
      ['material', 'Silicone'],
      ['count', '4 pieces']
    ]),
    ratingAvg: 4.3,
    ratingCount: 12,
    isActive: true
  },
  {
    title: 'Airtight Plastic Storage Jars',
    slug: 'airtight-plastic-storage-jars',
    brand: brands[3]._id,
    category: categories[4]._id,
    description: 'Set of 12 airtight kitchen storage jars.',
    images: ['https://via.placeholder.com/400x400?text=Storage+Jars'],
    price: 999,
    mrp: 1499,
    stock: 80,
    attributes: new Map([
      ['material', 'Plastic'],
      ['count', '12 Jars']
    ]),
    ratingAvg: 4.0,
    ratingCount: 18,
    isActive: true
  },
  {
    title: 'Cast Iron Skillet',
    slug: 'cast-iron-skillet',
    brand: brands[2]._id,
    category: categories[3]._id,
    description: 'Heavy-duty cast iron skillet for perfect searing.',
    images: ['https://via.placeholder.com/400x400?text=Cast+Iron+Skillet'],
    price: 1699,
    mrp: 2399,
    stock: 40,
    attributes: new Map([
      ['material', 'Cast Iron'],
      ['diameter', '26cm']
    ]),
    ratingAvg: 4.5,
    ratingCount: 22,
    isActive: true
  },
  {
    title: 'Electric Kettle 1.5L',
    slug: 'electric-kettle-1-5l',
    brand: brands[1]._id,
    category: categories[1]._id,
    description: 'Fast-boiling electric kettle with auto shut-off.',
    images: ['https://via.placeholder.com/400x400?text=Electric+Kettle'],
    price: 1299,
    mrp: 1899,
    stock: 55,
    attributes: new Map([
      ['capacity', '1.5 Liters'],
      ['power', '1500W']
    ]),
    ratingAvg: 4.4,
    ratingCount: 30,
    isActive: true
  },
  {
    title: 'Steel Water Bottle 1L',
    slug: 'steel-water-bottle-1l',
    brand: brands[0]._id,
    category: categories[2]._id,
    description: 'Durable stainless-steel water bottle.',
    images: ['https://via.placeholder.com/400x400?text=Steel+Bottle'],
    price: 699,
    mrp: 999,
    stock: 120,
    attributes: new Map([
      ['material', 'Stainless Steel'],
      ['capacity', '1 Liter']
    ]),
    ratingAvg: 4.2,
    ratingCount: 11,
    isActive: true
  },
  {
    title: 'Microwave-Safe Lunch Box Set',
    slug: 'microwave-lunch-box-set',
    brand: brands[3]._id,
    category: categories[4]._id,
    description: 'Set of 3 microwave-safe lunch boxes.',
    images: ['https://via.placeholder.com/400x400?text=Lunch+Box+Set'],
    price: 799,
    mrp: 1199,
    stock: 75,
    attributes: new Map([
      ['material', 'Plastic'],
      ['count', '3 pieces']
    ]),
    ratingAvg: 4.1,
    ratingCount: 16,
    isActive: true
  },
  {
    title: 'Multipurpose Kitchen Scissors',
    slug: 'multipurpose-kitchen-scissors',
    brand: brands[2]._id,
    category: categories[2]._id,
    description: 'High-quality stainless-steel scissors for kitchen use.',
    images: ['https://via.placeholder.com/400x400?text=Kitchen+Scissors'],
    price: 499,
    mrp: 799,
    stock: 90,
    attributes: new Map([
      ['material', 'Stainless Steel'],
      ['features', 'Multipurpose']
    ]),
    ratingAvg: 4.0,
    ratingCount: 14,
    isActive: true
  }
]);
console.log(`Created ${products.length} products`);
