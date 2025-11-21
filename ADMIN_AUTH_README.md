# Admin Authentication System

Complete admin authentication flow for Kitchen Kettles backend with JWT tokens, role-based access control, and secure password handling.

## 🎯 Features

- ✅ Admin user seeding with secure password hashing
- ✅ JWT-based authentication
- ✅ Role-based access control (admin/super_admin)
- ✅ Reuses existing User model and auth middleware
- ✅ Bcrypt/bcryptjs fallback for compatibility
- ✅ Environment-based configuration
- ✅ Ready-to-use test scripts

## 📁 Files Added/Modified

### New Files Created:
```
src/
├── controllers/
│   └── admin.auth.controller.js    # Admin login & profile endpoints
├── routes/
│   └── admin.auth.routes.js        # Admin auth routes
└── scripts/
    └── seedAdmin.js                # Admin user seeding script

scripts/
└── test-admin-auth.sh              # Quick test script
```

### Modified Files:
```
src/routes/index.js                 # Added admin auth route mounting
package.json                        # Added npm scripts
```

## 🚀 Quick Start

### 1. Install Dependencies

All required dependencies should already be installed. If not:

```bash
cd "Kitchen Kettles/kk-backend"
npm install
```

Required packages (already in package.json):
- `jsonwebtoken` - JWT token generation
- `bcryptjs` - Password hashing
- `mongoose` - Database ORM

### 2. Configure Environment Variables

Ensure your `.env` file has these variables:

```bash
# MongoDB Connection
MONGO_URI=mongodb://localhost:27017/kitchen-kettles

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=1d

# Server Port
PORT=5001

# Admin Credentials (optional, for seeding)
ADMIN_EMAIL=admin@kitchenkettles.local
ADMIN_PW=Admin@1234
ADMIN_NAME=Admin User
```

⚠️ **Security Warning**: 
- Never commit `.env` file to git
- Use strong JWT_SECRET in production
- Change default admin password after first login

### 3. Seed Admin User

Create or update the admin user:

```bash
# Using default credentials (development)
npm run seed:admin

# Or with custom credentials
ADMIN_EMAIL=admin@example.com ADMIN_PW=SecurePass123! npm run seed:admin
```

Expected output:
```
🌱 Starting admin user seed...
📡 Connecting to MongoDB...
✓ MongoDB connected

📧 Admin Email: admin@kitchenkettles.local
→ Creating new admin user...
✅ Admin user created successfully
```

### 4. Start the Server

```bash
npm start
# or for development with auto-reload
npm run dev
```

Server should start on port 5001 (or your configured PORT).

### 5. Test Admin Login

#### Using the test script:
```bash
npm run test:admin
```

#### Using curl:
```bash
curl -X POST http://localhost:5001/api/admin/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@kitchenkettles.local","password":"Admin@1234"}'
```

Expected response:
```json
{
  "ok": true,
  "message": "Admin login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "admin": {
    "_id": "673c6d5e4f8b9a0012345678",
    "email": "admin@kitchenkettles.local",
    "name": "Admin User",
    "role": "admin"
  }
}
```

## 🔌 API Endpoints

### 1. Admin Login
```http
POST /api/admin/auth/login
Content-Type: application/json

{
  "email": "admin@kitchenkettles.local",
  "password": "Admin@1234"
}
```

**Success Response (200):**
```json
{
  "ok": true,
  "message": "Admin login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "admin": {
    "_id": "673c6d5e4f8b9a0012345678",
    "email": "admin@kitchenkettles.local",
    "name": "Admin User",
    "role": "admin"
  }
}
```

**Error Responses:**
- `400` - Missing email or password
- `401` - Invalid credentials
- `403` - Non-admin user or deactivated account
- `500` - Server error

### 2. Get Admin Profile
```http
GET /api/admin/auth/me
Authorization: Bearer <your-jwt-token>
```

**Success Response (200):**
```json
{
  "ok": true,
  "admin": {
    "_id": "673c6d5e4f8b9a0012345678",
    "email": "admin@kitchenkettles.local",
    "name": "Admin User",
    "role": "admin"
  }
}
```

## 🔐 Using Authentication in Protected Routes

The system reuses existing middleware from `src/middlewares/auth.js`:

```javascript
import { requireAuth, requireAdmin } from '../middlewares/auth.js';

// Protect route - require authentication
router.get('/admin/data', requireAuth, requireAdmin, (req, res) => {
  // req.user contains authenticated user data
  console.log(req.user); // { _id, email, name, role }
  
  res.json({ 
    message: 'Protected admin data',
    admin: req.user 
  });
});
```

**Middleware chain:**
1. `requireAuth` - Validates JWT token, attaches user to req
2. `requireAdmin` - Checks if user has admin role

## 🧪 Testing & Verification

### Manual Testing Checklist

1. **Seed admin user:**
   ```bash
   npm run seed:admin
   ```

2. **Start server:**
   ```bash
   npm start
   ```

3. **Test login:**
   ```bash
   curl -X POST http://localhost:5001/api/admin/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"admin@kitchenkettles.local","password":"Admin@1234"}'
   ```

4. **Save the token and test authenticated endpoint:**
   ```bash
   TOKEN="<paste-token-here>"
   
   curl -X GET http://localhost:5001/api/admin/auth/me \
     -H "Authorization: Bearer $TOKEN"
   ```

### Automated Test Script

Run the complete test suite:
```bash
npm run test:admin
```

This script will:
- ✅ Check if server is running
- ✅ Test admin login
- ✅ Extract JWT token
- ✅ Test authenticated endpoint
- ✅ Display results

## 🐛 Troubleshooting

### Issue: "MONGO_URI not found"
**Solution:** Add MONGO_URI to your `.env` file:
```bash
MONGO_URI=mongodb://localhost:27017/kitchen-kettles
```

### Issue: "JWT_SECRET not configured"
**Solution:** Add JWT_SECRET to your `.env` file:
```bash
JWT_SECRET=your-super-secret-key-here
```

### Issue: "Invalid email or password"
**Solution:** 
- Verify you seeded the admin user: `npm run seed:admin`
- Check credentials match what you seeded
- Verify user has `role: "admin"` in database

### Issue: "Access denied. Admin privileges required"
**Solution:** 
- User exists but doesn't have admin role
- Re-run seed script to update role: `npm run seed:admin`

### Issue: "bcrypt" build errors
**Solution:** The code automatically falls back to `bcryptjs`. If you see this:
```bash
npm install bcryptjs
```

### Issue: Server not responding
**Solution:**
- Check if server is running: `npm start`
- Verify correct port in `.env`
- Check MongoDB connection

## 🔒 Security Best Practices

### Development
- ✅ Use `.env` file for configuration
- ✅ Add `.env` to `.gitignore`
- ✅ Use default credentials only for local development

### Production
- ⚠️ **Change default admin password immediately**
- ⚠️ Use strong, random JWT_SECRET (32+ characters)
- ⚠️ Set JWT_EXPIRES_IN appropriately (e.g., '8h', '1d')
- ⚠️ Use HTTPS for all API requests
- ⚠️ Implement rate limiting on login endpoint
- ⚠️ Add password complexity requirements
- ⚠️ Implement account lockout after failed attempts
- ⚠️ Enable 2FA for admin accounts
- ⚠️ Regular security audits

### .env.example Template
Create `.env.example` for your team (without secrets):
```bash
# MongoDB
MONGO_URI=mongodb://localhost:27017/kitchen-kettles

# JWT
JWT_SECRET=change-this-in-production
JWT_EXPIRES_IN=1d

# Server
PORT=5001

# Admin (for seeding)
ADMIN_EMAIL=admin@example.com
ADMIN_PW=change-this-password
ADMIN_NAME=Admin User
```

## 📝 Implementation Details

### Password Hashing
- Uses bcrypt with 10 salt rounds
- Fallback to bcryptjs if bcrypt build fails
- Passwords hashed using User model's `setPassword()` method

### JWT Token Structure
```javascript
{
  sub: user._id,        // Subject (user ID)
  id: user._id,         // ID (for compatibility)
  role: user.role,      // User role (admin)
  email: user.email,    // User email
  iat: 1234567890,      // Issued at
  exp: 1234654290       // Expires at
}
```

### Role Hierarchy
Current roles from `src/constants/roles.js`:
- `admin` - Standard admin access
- `user` - Regular user access

The middleware checks for admin roles: `['admin', 'super_admin']`

### Existing Infrastructure Reused
- ✅ User model (`src/models/User.js`)
- ✅ Auth middleware (`src/middlewares/auth.js`)
- ✅ DB config (`src/config/db.js`)
- ✅ Constants (`src/constants/roles.js`)

## 🎯 Next Steps

1. **Change default credentials** in production
2. **Add password reset** functionality
3. **Implement refresh tokens** for better security
4. **Add audit logging** for admin actions
5. **Setup rate limiting** on auth endpoints
6. **Add email notifications** for security events
7. **Implement 2FA** for enhanced security

## 📚 Related Files

- User Model: `src/models/User.js`
- Auth Middleware: `src/middlewares/auth.js`
- Roles Constants: `src/constants/roles.js`
- Main Routes: `src/routes/index.js`

## 🤝 Contributing

When modifying admin auth:
1. Keep ES Module syntax (`import`/`export`)
2. Use existing middleware where possible
3. Follow error handling patterns
4. Add comprehensive logging
5. Update this README

## 📄 License

Same as Kitchen Kettles project.
