require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const MONGO = process.env.MONGO_URL || process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/kitchen-kettles';

const AdminSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true },
  role: { type: String, default: 'admin' },
  createdAt: { type: Date, default: Date.now }
});

const Admin = mongoose.models.Admin || mongoose.model('Admin', AdminSchema);

async function run() {
  const args = process.argv.slice(2);
  const name = args[0] || 'Super Admin';
  const email = (args[1] || 'admin@kk.local').toLowerCase();
  const rawPassword = args[2] || 'admin123';

  try {
    await mongoose.connect(MONGO, { useNewUrlParser: true, useUnifiedTopology: true });
    console.log('Connected to MongoDB');

    const existing = await Admin.findOne({ email });
    if (existing) {
      console.log('Admin already exists:', existing.email);
      process.exit(0);
    }

    const hashed = await bcrypt.hash(rawPassword, 10);
    const admin = new Admin({ name, email, password: hashed, role: 'admin' });
    await admin.save();
    console.log('Admin created:', admin.email);
    process.exit(0);
  } catch (err) {
    console.error('Seed error:', err && (err.stack || err.message || err));
    process.exit(1);
  }
}

run();
