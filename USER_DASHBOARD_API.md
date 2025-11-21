# User Dashboard API - Complete Documentation

## 📋 Overview

This document describes the complete **User Dashboard API** feature for Kitchen Kettles backend. This feature provides authenticated users with:
- Profile viewing and editing
- Comprehensive dashboard with stats, recent orders, and cart summary
- Paginated orders listing

All endpoints use ESM imports/exports and follow the project's existing patterns.

---

## 🏗️ Architecture

### Files Created

```
kk-backend/
├── src/
│   ├── controllers/
│   │   ├── userProfile.controller.js      # Profile GET/PATCH logic
│   │   └── userDashboard.controller.js    # Dashboard & orders endpoints
│   ├── routes/
│   │   ├── userProfile.routes.js          # Profile routes
│   │   ├── userDashboard.routes.js        # Dashboard routes
│   │   └── index.js                        # Updated to mount new routes
│   ├── validators/
│   │   └── userProfile.validator.js       # express-validator rules
│   └── utils/
│       └── response.js                     # Response helpers
└── tests/
    ├── userProfile.test.js                 # Profile endpoint tests
    └── userDashboard.test.js               # Dashboard endpoint tests
```

### Route Structure

```
/user/profile          GET    - View profile
/user/profile          PATCH  - Update profile
/user/dashboard        GET    - Get dashboard data
/user/orders           GET    - List orders (paginated)
```

---

## 🔐 Authentication

All endpoints require the `protect` middleware from `src/middlewares/auth.js`:
- Expects `Authorization: Bearer <TOKEN>` header
- Sets `req.user = { id: <userId>, ... }` for authenticated requests
- Returns 401 if token is missing or invalid

---

## 📡 API Endpoints

### 1. GET /user/profile

**Description:** Returns the authenticated user's profile with safe fields only.

**Authentication:** Required

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "674f8a1b2c3d4e5f6a7b8c9d",
    "name": "Ravi Kumar",
    "email": "ravi@example.com",
    "phone": "9876543210",
    "createdAt": "2024-11-15T10:30:00.000Z",
    "addresses": [],
    "wishlistCount": 0
  }
}
```

**Example curl:**
```bash
curl -H "Authorization: Bearer <TOKEN>" \
     http://localhost:5001/user/profile
```

---

### 2. PATCH /user/profile

**Description:** Updates the authenticated user's profile. Only allows editing `name`, `email`, and `phone`.

**Authentication:** Required

**Request Body:**
```json
{
  "name": "Ravi Kumar",
  "email": "ravi.new@example.com",
  "phone": "9876543210"
}
```

**Validation Rules:**
- `name` (optional): String, 2-80 characters
- `email` (optional): Valid email format, must be unique
- `phone` (optional): Exactly 10 digits (Indian format), digits only

**Success Response:**
```json
{
  "success": true,
  "message": "Profile updated successfully",
  "data": {
    "_id": "674f8a1b2c3d4e5f6a7b8c9d",
    "name": "Ravi Kumar",
    "email": "ravi.new@example.com",
    "phone": "9876543210",
    "createdAt": "2024-11-15T10:30:00.000Z"
  }
}
```

**Validation Error Response (400):**
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "field": "phone",
      "message": "Phone must be exactly 10 digits"
    }
  ]
}
```

**Duplicate Email Error (409):**
```json
{
  "success": false,
  "message": "Email already in use by another account"
}
```

**Example curl:**
```bash
# Update name and phone
curl -X PATCH \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer <TOKEN>" \
     -d '{"name":"Ravi Kumar","phone":"9876543210"}' \
     http://localhost:5001/user/profile

# Invalid phone (should return 400)
curl -X PATCH \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer <TOKEN>" \
     -d '{"phone":"12345"}' \
     http://localhost:5001/user/profile
```

---

### 3. GET /user/dashboard

**Description:** Returns comprehensive dashboard data including profile, order statistics, recent orders, cart summary, and recent activity.

**Authentication:** Required

**Query Parameters:**
- `page` (optional, default: 1): Page number for recent orders
- `limit` (optional, default: 5, max: 50): Items per page for recent orders

**Response:**
```json
{
  "success": true,
  "data": {
    "profile": {
      "_id": "674f8a1b2c3d4e5f6a7b8c9d",
      "name": "Ravi Kumar",
      "email": "ravi@example.com",
      "phone": "9876543210",
      "createdAt": "2024-11-15T10:30:00.000Z"
    },
    "stats": {
      "totalOrders": 12,
      "totalSpent": 15680.50,
      "byStatus": {
        "pending": 2,
        "processing": 1,
        "delivered": 8,
        "cancelled": 1
      }
    },
    "recentOrders": [
      {
        "orderId": "674f8b1c2d3e4f5g6h7i8j9k",
        "userId": "674f8a1b2c3d4e5f6a7b8c9d",
        "status": "delivered",
        "total": 1250.00,
        "subtotal": 1200.00,
        "shipping": 50.00,
        "tax": 0,
        "items": [
          {
            "product": {
              "_id": "674f8c1d2e3f4g5h6i7j8k9l",
              "name": "Premium Kitchen Kettle",
              "price": 1200.00,
              "images": ["kettle1.jpg"],
              "slug": "premium-kitchen-kettle"
            },
            "title": "Premium Kitchen Kettle",
            "price": 1200.00,
            "qty": 1,
            "image": "kettle1.jpg"
          }
        ],
        "createdAt": "2024-11-20T15:45:00.000Z",
        "updatedAt": "2024-11-21T10:00:00.000Z"
      }
    ],
    "cart": {
      "itemCount": 2,
      "subtotal": 2400.00,
      "items": [
        {
          "productId": "674f8c1d2e3f4g5h6i7j8k9l",
          "productName": "Premium Kitchen Kettle",
          "price": 1200.00,
          "qty": 2,
          "itemTotal": 2400.00
        }
      ]
    },
    "recentActivity": [
      {
        "type": "order",
        "orderId": "674f8b1c2d3e4f5g6h7i8j9k",
        "status": "delivered",
        "amount": 1250.00,
        "date": "2024-11-20T15:45:00.000Z"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 3,
      "totalItems": 12,
      "itemsPerPage": 5,
      "hasNextPage": true,
      "hasPrevPage": false
    }
  }
}
```

**Example curl:**
```bash
# Default pagination
curl -H "Authorization: Bearer <TOKEN>" \
     http://localhost:5001/user/dashboard

# Custom pagination
curl -H "Authorization: Bearer <TOKEN>" \
     "http://localhost:5001/user/dashboard?page=1&limit=5"
```

---

### 4. GET /user/orders

**Description:** Returns a paginated list of the authenticated user's orders with populated product details.

**Authentication:** Required

**Query Parameters:**
- `page` (optional, default: 1): Page number
- `limit` (optional, default: 10, max: 50): Items per page
- `sort` (optional, default: -createdAt): Sort field (e.g., `createdAt`, `-createdAt`)

**Response:**
```json
{
  "success": true,
  "data": {
    "orders": [
      {
        "_id": "674f8b1c2d3e4f5g6h7i8j9k",
        "userId": "674f8a1b2c3d4e5f6a7b8c9d",
        "status": "delivered",
        "totalAmount": 1250.00,
        "subtotal": 1200.00,
        "shipping": 50.00,
        "tax": 0,
        "items": [
          {
            "product": {
              "_id": "674f8c1d2e3f4g5h6i7j8k9l",
              "name": "Premium Kitchen Kettle",
              "price": 1200.00,
              "images": ["kettle1.jpg"],
              "slug": "premium-kitchen-kettle"
            },
            "title": "Premium Kitchen Kettle",
            "price": 1200.00,
            "qty": 1,
            "image": "kettle1.jpg"
          }
        ],
        "shippingAddress": {
          "name": "Ravi Kumar",
          "phone": "9876543210",
          "line1": "123 MG Road",
          "city": "Bangalore",
          "state": "Karnataka",
          "country": "India",
          "pincode": "560001"
        },
        "payment": {
          "method": "COD",
          "status": "init"
        },
        "createdAt": "2024-11-20T15:45:00.000Z",
        "updatedAt": "2024-11-21T10:00:00.000Z"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 2,
      "totalItems": 12,
      "itemsPerPage": 10,
      "hasNextPage": true,
      "hasPrevPage": false
    }
  }
}
```

**Example curl:**
```bash
# Default pagination and sorting
curl -H "Authorization: Bearer <TOKEN>" \
     http://localhost:5001/user/orders

# Custom pagination
curl -H "Authorization: Bearer <TOKEN>" \
     "http://localhost:5001/user/orders?page=1&limit=10"

# Custom sorting (oldest first)
curl -H "Authorization: Bearer <TOKEN>" \
     "http://localhost:5001/user/orders?page=1&limit=10&sort=createdAt"
```

---

## 🧪 Testing

### Prerequisites

Install test dependencies (if not already installed):

```bash
npm install --save-dev jest supertest
```

### Test Configuration

The tests use:
- **jest** for test framework
- **supertest** for HTTP assertions
- A separate test database (configure via `MONGODB_URI` env variable)

### Running Tests

```bash
# Run all tests
npm test

# Run specific test file
npm test tests/userProfile.test.js
npm test tests/userDashboard.test.js

# Run with coverage
npm test -- --coverage
```

### Test Coverage

**userProfile.test.js** tests:
- ✅ Authentication requirement (401 without token)
- ✅ GET profile returns correct data
- ✅ PATCH updates name successfully
- ✅ Validation errors for invalid name, email, phone
- ✅ Phone validation (exactly 10 digits)
- ✅ Email uniqueness (409 conflict)
- ✅ Multiple field updates
- ✅ Ignores extra fields not in allowed list

**userDashboard.test.js** tests:
- ✅ Authentication requirement
- ✅ Dashboard returns all required sections
- ✅ Order statistics accuracy
- ✅ Recent orders with populated products
- ✅ Cart summary
- ✅ Recent activity
- ✅ Pagination support
- ✅ Orders listing with pagination and sorting
- ✅ Maximum limit enforcement (50 items)

---

## 🚀 Local Testing Setup

### Step 1: Start the Backend Server

```bash
cd kk-backend
npm run dev
```

Server should start on `http://localhost:5001` (or your configured port).

### Step 2: Create a Test User

You can create a test user via registration or use the MongoDB shell:

```javascript
// MongoDB shell or Compass
use kitchen_kettles;

db.users.insertOne({
  name: "Test User",
  email: "testuser@example.com",
  passwordHash: "$2a$10$..." // Use bcrypt to hash a password
  role: "user",
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date()
});
```

Or use your existing auth endpoints to register a new user.

### Step 3: Get an Auth Token

Login using your auth endpoint (e.g., POST `/auth/login`) to get a JWT token:

```bash
curl -X POST \
     -H "Content-Type: application/json" \
     -d '{"email":"testuser@example.com","password":"yourpassword"}' \
     http://localhost:5001/auth/login
```

Response will include a token:
```json
{
  "ok": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### Step 4: Test Profile Endpoints

```bash
# Set token variable for convenience
TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

# Get profile
curl -H "Authorization: Bearer $TOKEN" \
     http://localhost:5001/user/profile

# Update profile
curl -X PATCH \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer $TOKEN" \
     -d '{"name":"Updated Name","phone":"9876543210"}' \
     http://localhost:5001/user/profile
```

### Step 5: Test Dashboard Endpoints

```bash
# Get dashboard
curl -H "Authorization: Bearer $TOKEN" \
     http://localhost:5001/user/dashboard

# Get orders
curl -H "Authorization: Bearer $TOKEN" \
     http://localhost:5001/user/orders?page=1&limit=10
```

### Step 6: Test Validation Errors

```bash
# Invalid phone (should return 400)
curl -X PATCH \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer $TOKEN" \
     -d '{"phone":"123"}' \
     http://localhost:5001/user/profile

# Invalid email (should return 400)
curl -X PATCH \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer $TOKEN" \
     -d '{"email":"notanemail"}' \
     http://localhost:5001/user/profile
```

---

## 🔍 Validation Rules

### Phone Validation
- **Format:** Exactly 10 digits, digits only
- **Regex:** `/^\d{10}$/`
- **Valid examples:** `9876543210`, `8123456789`
- **Invalid examples:** `123456`, `987-654-3210`, `+919876543210`

### Email Validation
- **Format:** Standard email format (via express-validator)
- **Uniqueness:** Must not be used by another user
- **Examples:** `user@example.com`, `test.user+tag@domain.co.in`

### Name Validation
- **Length:** 2-80 characters
- **Type:** String, trimmed
- **Examples:** `Ravi Kumar`, `Priya S`

---

## 🛡️ Security Features

1. **Authentication Required:** All endpoints use `protect` middleware
2. **Field Whitelisting:** Only `name`, `email`, `phone` can be updated
3. **User Isolation:** Users can only view/edit their own profile
4. **No Sensitive Data:** Password and role fields never returned
5. **Email Uniqueness:** Duplicate emails rejected with 409 status
6. **Input Validation:** express-validator rules prevent invalid data
7. **Mongoose Lean:** Read queries use `.lean()` for performance

---

## 📊 Database Queries

All read operations use `.lean()` for better performance:

```javascript
// Profile fetch
await User.findById(userId).select('name email phone').lean();

// Orders with product population
await Order.find({ user: userId })
  .populate('items.product', 'name price images slug')
  .lean();

// Cart with product population
await Cart.findOne({ userId })
  .populate('items.productId', 'name price')
  .lean();
```

---

## 🎯 Acceptance Criteria

- [x] All endpoints require authentication (401 without token)
- [x] Profile GET returns only safe fields
- [x] Profile PATCH validates phone (exactly 10 digits)
- [x] Profile PATCH validates email uniqueness (409 on duplicate)
- [x] Dashboard returns `totalOrders` matching DB count
- [x] Dashboard returns `recentOrders` with populated products
- [x] Dashboard returns `cart` summary or null
- [x] Orders endpoint includes `userId` in each order
- [x] Pagination works correctly (limits, pages, metadata)
- [x] Error responses follow consistent format
- [x] Tests cover happy paths and validation failures

---

## 🐛 Troubleshooting

### Issue: 401 Unauthorized
**Solution:** Ensure you're passing a valid JWT token in the `Authorization` header:
```bash
Authorization: Bearer <your-token-here>
```

### Issue: Phone validation fails
**Solution:** Phone must be exactly 10 digits, no spaces, hyphens, or country codes:
```json
{"phone": "9876543210"}  // ✅ Valid
{"phone": "987-654-3210"} // ❌ Invalid
{"phone": "12345"}        // ❌ Invalid
```

### Issue: Email conflict (409)
**Solution:** The email you're trying to update to is already in use by another user. Choose a different email.

### Issue: Routes not found (404)
**Solution:** Ensure the server is running and routes are properly mounted in `src/routes/index.js`. Check the imports:
```javascript
import userProfileRoutes from './userProfile.routes.js';
import userDashboardRoutes from './userDashboard.routes.js';

router.use('/user', userProfileRoutes);
router.use('/user', userDashboardRoutes);
```

---

## 📝 Notes for Developers

1. **ESM Syntax:** All files use ESM imports/exports (`import`/`export`)
2. **Async/Await:** All async operations use async/await (no callbacks)
3. **Error Handling:** Consistent JSON error responses with `success: false`
4. **Mongoose Lean:** Use `.lean()` on all read queries for performance
5. **Population:** Product fields populated with projection for efficiency
6. **Limits:** Max pagination limit is 50 items per page
7. **Console Errors:** Server errors logged with `console.error()`
8. **Response Format:** Use helpers from `src/utils/response.js`

---

## 🔄 Integration Checklist

- [x] Controllers created and documented
- [x] Routes defined with auth middleware
- [x] Validators implemented with express-validator
- [x] Response helpers created
- [x] Routes registered in index.js
- [x] Tests written and passing
- [x] Documentation complete with curl examples
- [x] Error handling implemented
- [x] Security measures in place

---

## 📚 Additional Resources

- [express-validator documentation](https://express-validator.github.io/docs/)
- [Mongoose lean queries](https://mongoosejs.com/docs/tutorials/lean.html)
- [JWT authentication guide](https://jwt.io/introduction)
- [Supertest documentation](https://github.com/ladjs/supertest)

---

## ✅ Status

**Feature Status:** ✅ Complete and Ready for Production

All files created, tested, and documented. Ready to integrate into your Kitchen Kettles backend.

---

**Questions or Issues?**
If you encounter any problems, check the troubleshooting section or review the test files for working examples.
