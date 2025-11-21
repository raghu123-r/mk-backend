// src/scripts/seedAdmin.js (ESM VERSION)
import mongoose from 'mongoose';

// bcrypt fallback using dynamic import
let bcrypt;
try {
  bcrypt = (await import('bcrypt')).default;
} catch (e) {
  bcrypt = (await import('bcryptjs')).default;
}

import User from '../models/User.js';

async function connectDb() {
  try {
    // Try project DB connector first
    const dbModule = await import('../config/db.js');
    if (dbModule.default && typeof dbModule.default === 'function') {
      await dbModule.default();
      return;
    }
    if (dbModule.connect && typeof dbModule.connect === 'function') {
      await dbModule.connect();
      return;
    }
  } catch (e) {
    // Fallback: Use env MONGO_URI
    const MONGO =
      process.env.MONGO_URI ||
      process.env.MONGO ||
      'mongodb://127.0.0.1:27017/kitchen-kettles';

    await mongoose.connect(MONGO, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
  }
}

export async function seedAdmin() {
  try {
    await connectDb();

    const adminEmail = (process.env.ADMIN_EMAIL || 'admin@kitchenkettles.local').toLowerCase();
    const adminPw = process.env.ADMIN_PW || 'Admin@1234';

    const existing = await User.findOne({ email: adminEmail });
    if (existing) {
      if (!existing.role || existing.role !== 'admin') {
        existing.role = 'admin';
        await existing.save();
        console.log('Promoted existing user to admin:', adminEmail);
      } else {
        console.log('Admin already exists:', adminEmail);
      }
      process.exit(0);
    }

    const hashed = await bcrypt.hash(adminPw, 10);

    const adminUser = new User({
      name: 'Admin',
      email: adminEmail,
      password: hashed,
      role: 'admin',
    });

    await adminUser.save();
    console.log('Seeded admin user:', adminEmail);
    process.exit(0);
  } catch (err) {
    console.error('seedAdmin error:', err);
    process.exit(1);
  }
}

// If run directly with: node src/scripts/seedAdmin.js
if (process.argv[1].includes('seedAdmin.js')) {
  seedAdmin();
}
