# 🚀 Quick Start - Test Order API

## ✅ Server Status
**Running on:** http://localhost:5001
**MongoDB:** Connected

## 🎯 Thunder Client Quick Test

### 1️⃣ Get Product ID (5 seconds)
```
GET http://localhost:5001/api/products
```
Copy any `_id` from response

### 2️⃣ Create Order (30 seconds)
```
POST http://localhost:5001/api/orders
```

**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY5MWViYTJhYmFkZmJhZDYzNzFjYWJkMSIsInJvbGUiOiJhZG1pbiIsImVtYWlsIjoiYWRtaW5AZXhhbXBsZS5jb20iLCJpYXQiOjE3NjM2MjMwODAsImV4cCI6MTc2NDIyNzg4MH0.m2M-zmGgy-jMXe2IgI0lCIHso5wqrTCescFe5zwjmq8
Content-Type: application/json
```

**Body (replace YOUR_PRODUCT_ID):**
```json
{
  "items": [
    {
      "productId": "YOUR_PRODUCT_ID",
      "quantity": 2
    }
  ],
  "address": {
    "line1": "123 Test St",
    "city": "Mumbai",
    "pincode": "400001"
  },
  "paymentMethod": "COD"
}
```

### 3️⃣ Expected Response
```json
{
  "success": true,
  "order": {
    "_id": "...",
    "subtotal": 998,
    "shipping": 0,
    "tax": 180,
    "total": 1178,
    "status": "pending",
    ...
  }
}
```

## 📊 What Happens Server-Side

1. ✅ Validates JWT token → extracts `req.user.id`
2. ✅ Fetches product data from database
3. ✅ Validates stock availability
4. ✅ Calculates: `subtotal = price × quantity` (server-side)
5. ✅ Calculates: `shipping` (free if > ₹999)
6. ✅ Calculates: `tax = 18% GST`
7. ✅ Calculates: `total = subtotal + shipping + tax`
8. ✅ Saves order with product snapshot
9. ✅ Returns order with success flag

## 📝 Files Changed

✅ `src/controllers/order.controller.js` - createOrder() function
✅ `src/services/order.service.js` - Order creation logic
✅ `src/routes/order.routes.js` - POST /api/orders route

## 🔍 Verify

```
GET http://localhost:5001/api/orders/me
```

Shows all your orders.

---

**Need Help?** See `THUNDER_CLIENT_TEST.md` for detailed steps
