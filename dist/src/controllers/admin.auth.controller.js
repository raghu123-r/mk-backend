/* ESM version with dynamic bcrypt fallback */
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

// bcrypt fallback: try native bcrypt, fall back to bcryptjs
// Use dynamic import in an async IIFE to work in ESM
let bcrypt;
(async () => {
  try {
    bcrypt = (await import('bcrypt')).default;
  } catch (e) {
    bcrypt = (await import('bcryptjs')).default;
  }
})();

// env
const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1d';

async function login(req, res) {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) return res.status(400).json({ message: 'email and password required' });

    const admin = await User.findOne({ email: String(email).toLowerCase().trim() });
    if (!admin) return res.status(401).json({ message: 'Invalid credentials' });

    if (admin.role && admin.role !== 'admin') {
      return res.status(403).json({ message: 'User is not an admin' });
    }

    const match = await bcrypt.compare(password, admin.password);
    if (!match) return res.status(401).json({ message: 'Invalid credentials' });

    if (!JWT_SECRET) {
      console.warn('WARNING: JWT_SECRET not set in env. Using dev-placeholder (not for prod).');
    }

    const token = jwt.sign(
      { id: admin._id.toString(), role: admin.role || 'admin', email: admin.email },
      JWT_SECRET || 'dev-placeholder-secret',
      { expiresIn: JWT_EXPIRES_IN }
    );

    return res.json({
      message: 'Admin login successful',
      token,
      admin: { _id: admin._id, email: admin.email, name: admin.name || null, role: admin.role || 'admin' }
    });
  } catch (err) {
    console.error('admin login error', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

export { login };
