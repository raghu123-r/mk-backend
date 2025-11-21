# Quick Test Guide for Order API

## Prerequisites
1. ✅ Backend server running on http://localhost:5001
2. ✅ MongoDB connected
3. ✅ At least one product in the database

## Thunder Client Test Steps

### Step 1: Get a Product ID

1. Create a new GET request in Thunder Client
2. URL: `http://localhost:5001/api/products`
3. Click Send
4. Copy any product's `_id` from the response (e.g., `"673d1234567890abcdef1234"`)

### Step 2: Create an Order

1. Create a new POST request in Thunder Client
2. URL: `http://localhost:5001/api/orders`

3. **Headers Tab:**
   - Click "Add Header"
   - Name: `Authorization`
   - Value: `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY5MWViYTJhYmFkZmJhZDYzNzFjYWJkMSIsInJvbGUiOiJhZG1pbiIsImVtYWlsIjoiYWRtaW5AZXhhbXBsZS5jb20iLCJpYXQiOjE3NjM2MjMwODAsImV4cCI6MTc2NDIyNzg4MH0.m2M-zmGgy-jMXe2IgI0lCIHso5wqrTCescFe5zwjmq8`
   
   - Click "Add Header"
   - Name: `Content-Type`
   - Value: `application/json`

4. **Body Tab:**
   - Select "JSON" format
   - Paste this (replace `YOUR_PRODUCT_ID` with actual ID from Step 1):
   ```json
   {
     "items": [
       {
         "productId": "YOUR_PRODUCT_ID",
         "quantity": 2
       }
     ],
     "address": {
       "name": "Test User",
       "phone": "1234567890",
       "line1": "123 Test Street",
       "line2": "Apt 4B",
       "city": "Mumbai",
       "state": "Maharashtra",
       "country": "India",
       "pincode": "400001"
     },
     "paymentMethod": "COD"
   }
   ```

5. Click **Send**

### Expected Success Response

```json
{
  "success": true,
  "order": {
    "_id": "673d...",
    "user": "691e...",
    "items": [
      {
        "product": "673d...",
        "title": "Product Name",
        "price": 499,
        "qty": 2,
        "image": "https://..."
      }
    ],
    "subtotal": 998,
    "shipping": 0,
    "tax": 180,
    "total": 1178,
    "shippingAddress": {
      "name": "Test User",
      "phone": "1234567890",
      "line1": "123 Test Street",
      "line2": "Apt 4B",
      "city": "Mumbai",
      "state": "Maharashtra",
      "country": "India",
      "pincode": "400001"
    },
    "payment": {
      "method": "COD",
      "status": "init"
    },
    "status": "pending",
    "createdAt": "2024-11-20T...",
    "updatedAt": "2024-11-20T..."
  }
}
```

## Alternative: Using cURL

If Thunder Client doesn't work, use this cURL command in terminal:

```bash
# First, get a product ID
curl http://localhost:5001/api/products

# Then create order (replace YOUR_PRODUCT_ID)
curl -X POST http://localhost:5001/api/orders \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY5MWViYTJhYmFkZmJhZDYzNzFjYWJkMSIsInJvbGUiOiJhZG1pbiIsImVtYWlsIjoiYWRtaW5AZXhhbXBsZS5jb20iLCJpYXQiOjE3NjM2MjMwODAsImV4cCI6MTc2NDIyNzg4MH0.m2M-zmGgy-jMXe2IgI0lCIHso5wqrTCescFe5zwjmq8" \
  -H "Content-Type: application/json" \
  -d '{
    "items": [
      {
        "productId": "YOUR_PRODUCT_ID",
        "quantity": 2
      }
    ],
    "address": {
      "line1": "123 Test Street",
      "city": "Mumbai",
      "pincode": "400001"
    },
    "paymentMethod": "COD"
  }'
```

## Common Issues

### 401 Unauthorized
- Token expired or invalid
- Make sure the Bearer token is correct in Authorization header

### 400 Bad Request - "No items provided"
- Check that `items` array is not empty
- Verify JSON format is correct

### 400 Bad Request - "Product not found"
- The productId doesn't exist in database
- Make sure you copied a valid product ID from Step 1

### 400 Bad Request - "Insufficient stock"
- The product doesn't have enough stock
- Try reducing the quantity or choose a different product

## Verification

After successfully creating an order, you can verify it:

```
GET http://localhost:5001/api/orders/me
```

This will show all your orders.

---

**Important Notes:**
- The token used above is for the admin user from your context
- The price is snapshotted at order time (server-side calculation)
- Shipping is free for orders > ₹999, otherwise ₹49
- Tax is automatically calculated as 18% GST
