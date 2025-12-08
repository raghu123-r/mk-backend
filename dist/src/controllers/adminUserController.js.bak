// kk-backend/controllers/adminUserController.js
import Admin from '../models/Admin.js';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

// -------------------- LOGIN --------------------
export const loginAdmin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        statusCode: 400,
        success: false,
        error: { message: "Email and password required" },
        data: null
      });
    }

    const admin = await Admin.findOne({ email: email.toLowerCase().trim() });

    if (!admin) {
      return res.status(401).json({
        statusCode: 401,
        success: false,
        error: { message: "Invalid email or password" },
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
      const isMatch = await bcrypt.compare(password, admin.passwordHash);
      if (!isMatch) {
        return res.status(401).json({
          statusCode: 401,
          success: false,
          error: { message: 'Invalid credentials. Default password is: admin123' },
          data: null
        });
      }
    } else {
      // Normal password verification for existing passwordHash
      const isMatch = await bcrypt.compare(password, admin.passwordHash);
      if (!isMatch) {
        return res.status(401).json({
          statusCode: 401,
          success: false,
          error: { message: "Invalid email or password" },
          data: null
        });
      }
    }

    const token = jwt.sign(
      {
        id: admin._id,
        role: admin.role,
        email: admin.email,
      },
      process.env.JWT_SECRET || "secretkey",
      { expiresIn: "7d" }
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
        message: "Login successful",
        token,
        admin: {
          id: admin._id,
          name: admin.name,
          email: admin.email,
          role: admin.role,
        }
      }
    });

  } catch (err) {
    console.error("Admin login error:", err);
    return res.status(500).json({
      statusCode: 500,
      success: false,
      error: { message: "Server error" },
      data: null
    });
  }
};

// -------------------- LOGOUT --------------------
export const logoutAdmin = async (req, res) => {
  try {
    // Clear the adminToken cookie
    res.clearCookie('adminToken', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
      path: '/'
    });

    return res.status(200).json({
      statusCode: 200,
      success: true,
      error: null,
      data: { message: "Logged out successfully" }
    });
  } catch (err) {
    console.error("Admin logout error:", err);
    return res.status(500).json({
      statusCode: 500,
      success: false,
      error: { message: "Server error" },
      data: null
    });
  }
};

// -------------------- LIST USERS --------------------
export const listUsers = async (req, res) => {
  try {
    const admins = await Admin.find().select("-passwordHash");
    return res.status(200).json({
      statusCode: 200,
      success: true,
      error: null,
      data: admins
    });

  } catch (err) {
    console.error("List users error:", err);
    return res.status(500).json({
      statusCode: 500,
      success: false,
      error: { message: "Server error" },
      data: null
    });
  }
};
