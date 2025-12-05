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
const JWT_SECRET = process.env.JWT_SECRET || 'secretkey';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1d';

async function login(req, res) {
  try {
    // Ensure bcrypt is loaded
    if (!bcrypt) {
      await bcryptPromise;
    }
    
    const { email, password } = req.body || {};
    if (!email || !password) return res.status(400).json({
      statusCode: 400,
      success: false,
      error: { message: 'email and password required' },
      data: null
    });

    const admin = await User.findOne({ email: String(email).toLowerCase().trim() });
    if (!admin) return res.status(401).json({
      statusCode: 401,
      success: false,
      error: { message: 'Invalid credentials' },
      data: null
    });

    if (admin.role && admin.role !== 'admin') {
      return res.status(403).json({
        statusCode: 403,
        success: false,
        error: { message: 'User is not an admin' },
        data: null
      });
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
        return res.status(401).json({
          statusCode: 401,
          success: false,
          error: { message: 'Invalid credentials. Default password is: admin123' },
          data: null
        });
      }
    } else {
      // Normal password verification for existing passwordHash
      const match = await bcrypt.compare(password, admin.passwordHash);
      if (!match) return res.status(401).json({
        statusCode: 401,
        success: false,
        error: { message: 'Invalid credentials' },
        data: null
      });
    }

    if (!JWT_SECRET) {
      console.warn('WARNING: JWT_SECRET not set in env. Using dev-placeholder (not for prod).');
    }

    const token = jwt.sign(
      { id: admin._id.toString(), role: admin.role || 'admin', email: admin.email },
      JWT_SECRET,
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

    return res.status(200).json({
      statusCode: 200,
      success: true,
      error: null,
      data: {
        message: 'Admin login successful',
        token,
        admin: { _id: admin._id, email: admin.email, name: admin.name || null, role: admin.role || 'admin' }
      }
    });
  } catch (err) {
    console.error('admin login error', err);
    return res.status(500).json({
      statusCode: 500,
      success: false,
      error: { message: 'Internal server error' },
      data: null
    });
  }
}

export { login };
