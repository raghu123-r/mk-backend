/* ESM version with dynamic bcrypt fallback */
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

// bcrypt fallback: try native bcrypt, fall back to bcryptjs
// Use dynamic import to work in ESM - ensure bcrypt is loaded before login
let bcrypt;
const bcryptPromise = (async () => {
  try {
    bcrypt = (await import('bcrypt')).default;
  } catch (e) {
    bcrypt = (await import('bcryptjs')).default;
  }
  return bcrypt;
})();

// env
const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1d';

async function login(req, res) {
  try {
    // Ensure bcrypt is loaded
    if (!bcrypt) {
      await bcryptPromise;
    }
    
    const { email, password } = req.body || {};
    if (!email || !password) return res.status(400).json({ message: 'email and password required' });

    const admin = await User.findOne({ email: String(email).toLowerCase().trim() });
    if (!admin) return res.status(401).json({ message: 'Invalid credentials' });

    if (admin.role && admin.role !== 'admin') {
      return res.status(403).json({ message: 'User is not an admin' });
    }

    // Check if passwordHash field exists - if not, auto-create it with default password 'admin123'
    if (!admin.passwordHash) {
      console.warn('Admin user found but passwordHash field is missing - auto-creating with default password');
      const defaultPassword = 'admin123';
      const hashedPassword = await bcrypt.hash(defaultPassword, 10);
      admin.passwordHash = hashedPassword;
      await admin.save();
      console.log('Admin passwordHash auto-created successfully');
      
      // Now verify the provided password against the newly created hash
      const match = await bcrypt.compare(password, admin.passwordHash);
      if (!match) {
        return res.status(401).json({ message: 'Invalid credentials. Default password is: admin123' });
      }
    } else {
      // Normal password verification for existing passwordHash
      const match = await bcrypt.compare(password, admin.passwordHash);
      if (!match) return res.status(401).json({ message: 'Invalid credentials' });
    }

    if (!JWT_SECRET) {
      console.warn('WARNING: JWT_SECRET not set in env. Using dev-placeholder (not for prod).');
    }

    const token = jwt.sign(
      { id: admin._id.toString(), role: admin.role || 'admin', email: admin.email },
      JWT_SECRET || 'dev-placeholder-secret',
      { expiresIn: JWT_EXPIRES_IN }
    );

    // Set secure HttpOnly cookie for admin authentication with 7 days expiry
    const isProduction = process.env.NODE_ENV === 'production';
    res.cookie('adminToken', token, {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? 'strict' : 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days in milliseconds
    });

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
