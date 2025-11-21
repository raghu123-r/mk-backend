# Admin Authentication - Quick Reference

## 🚀 Quick Start (3 Steps)

```bash
# 1. Seed admin user
npm run seed:admin

# 2. Start server
npm start

# 3. Test login
npm run test:admin
```

## 📍 API Endpoints

### Login
```bash
POST /api/admin/auth/login
Body: { "email": "admin@kitchenkettles.local", "password": "Admin@1234" }
```

### Get Profile
```bash
GET /api/admin/auth/me
Header: Authorization: Bearer <token>
```

## 🔧 Environment Variables Required

```bash
MONGO_URI=mongodb://localhost:27017/kitchen-kettles
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=1d
PORT=5001
```

## 📝 NPM Scripts

```bash
npm run seed:admin      # Seed admin user
npm run test:admin      # Test authentication
npm start               # Start server
npm run dev             # Start with nodemon
```

## 🧪 Manual Test

```bash
# Login
curl -X POST http://localhost:5001/api/admin/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@kitchenkettles.local","password":"Admin@1234"}'

# Use returned token
curl -X GET http://localhost:5001/api/admin/auth/me \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

## 📦 Files Created

```
src/
├── controllers/admin.auth.controller.js   # Login & profile logic
├── routes/admin.auth.routes.js            # Auth routes
└── scripts/seedAdmin.js                   # Admin seeding

scripts/
├── test-admin-auth.sh                     # Test script
└── setup-admin-auth.sh                    # Setup script

ADMIN_AUTH_README.md                       # Full documentation
```

## 🔒 Default Credentials (Development Only)

```
Email:    admin@kitchenkettles.local
Password: Admin@1234
```

⚠️ **Change these in production!**

## 🐛 Common Issues

| Issue | Solution |
|-------|----------|
| MongoDB connection error | Check MONGO_URI in .env |
| JWT_SECRET missing | Add JWT_SECRET to .env |
| Login fails | Run `npm run seed:admin` |
| bcrypt error | Code auto-fallback to bcryptjs |

## 📖 Full Documentation

See `ADMIN_AUTH_README.md` for complete details.
