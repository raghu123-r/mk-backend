# Order API Testing Guide

## Overview
The Order API allows authenticated users to place orders from their cart items.

## Endpoint
```
POST /api/orders
```

## Authentication
Requires Bearer token in the Authorization header.

## Request Format

### Headers
```
Authorization: Bearer <YOUR_JWT_TOKEN>
Content-Type: application/json
```

### Request Body
```json
{
  "items": [
    {
      "productId": "YOUR_PRODUCT_ID",
      "quantity": 2
    }
  ],
  "address": {
    "name": "John Doe",
    "phone": "1234567890",
    "line1": "123 Main Street",
    "line2": "Apt 4B",
    "city": "Mumbai",
    "state": "Maharashtra",
    "country": "India",
    "pincode": "400001"
  },
  "paymentMethod": "COD"
}
```

### Field Descriptions

#### items (required)
- Array of cart items
- Each item contains:
  - `productId` (string, required): MongoDB ObjectId of the product
  - `quantity` (number, required): Positive integer for quantity

#### address (required)
- `name` (string, optional): Recipient name
- `phone` (string, optional): Contact phone
- `line1` (string, required): Address line 1
- `line2` (string, optional): Address line 2
- `city` (string, required): City name
- `state` (string, optional): State/Province
- `country` (string, optional): Country (defaults to "India")
- `pincode` (string, required): Postal/ZIP code

#### paymentMethod (string, optional)
- Payment method (defaults to "COD")
- Options: "COD", "UPI", "Card", etc.

## Response Format

### Success Response (201 Created)
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
      "name": "John Doe",
      "phone": "1234567890",
      "line1": "123 Main Street",
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

### Error Responses

#### 400 Bad Request
```json
{
  "error": "No items provided"
}
```

```json
{
  "error": "Product <productId> not found"
}
```

```json
{
  "error": "Insufficient stock for <Product Name>. Available: 5"
}
```

#### 401 Unauthorized
```json
{
  "ok": false,
  "error": "Not authenticated"
}
```

## Order Calculation Logic

The server performs the following calculations:

1. **Fetch Product Data**: Retrieves product information from the database
2. **Validate Stock**: Ensures sufficient stock for each item
3. **Compute Subtotal**: `price * quantity` for each item (server-side only)
4. **Compute Shipping**: 
   - Free if subtotal > ₹999
   - ₹49 if subtotal ≤ ₹999
5. **Compute Tax**: 18% GST on subtotal
6. **Compute Total**: `subtotal + shipping + tax`

## Product Snapshot

The order saves a snapshot of the product at the time of purchase:
- Product title
- Product price (at order time)
- Product image
- Product ID reference

This ensures historical accuracy if product details change later.

## Testing Steps

### Step 1: Get Authentication Token
First, login or register to get a JWT token:
```bash
curl -X POST http://localhost:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "yourpassword"
  }'
```

### Step 2: Get Product IDs
Fetch products to get valid product IDs:
```bash
curl http://localhost:5001/api/products
```

### Step 3: Create Order
Use Thunder Client or curl to create an order:
```bash
curl -X POST http://localhost:5001/api/orders \
  -H "Authorization: Bearer <YOUR_JWT_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "items": [
      {
        "productId": "<PRODUCT_ID>",
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

## Thunder Client Configuration

1. Open Thunder Client in VS Code
2. Create a new request
3. Set method to `POST`
4. Set URL to `http://localhost:5001/api/orders`
5. Go to Headers tab:
   - Add `Authorization`: `Bearer <YOUR_JWT_TOKEN>`
   - Add `Content-Type`: `application/json`
6. Go to Body tab:
   - Select JSON
   - Paste the request body with valid product IDs
7. Click Send

## Get Your Orders

```
GET /api/orders/me
```

Returns all orders for the authenticated user, sorted by most recent first.

---

**Note**: Make sure the backend server is running on port 5001 before testing.
