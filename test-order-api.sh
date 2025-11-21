#!/bin/bash

# Test Order API Script
# This script tests the POST /api/orders endpoint

echo "==================================="
echo "Testing Order API"
echo "==================================="
echo ""

# Server URL
SERVER="http://localhost:5001"

# Step 1: Check server health
echo "Step 1: Checking server health..."
HEALTH=$(curl -s $SERVER/)
if [ -z "$HEALTH" ]; then
    echo "❌ Server is not responding. Please start the server first."
    exit 1
fi
echo "✅ Server is running"
echo ""

# Step 2: Get products
echo "Step 2: Fetching products..."
PRODUCTS=$(curl -s "$SERVER/api/products")
if [ -z "$PRODUCTS" ]; then
    echo "❌ No products found or error fetching products"
    exit 1
fi

# Extract first product ID
PRODUCT_ID=$(echo $PRODUCTS | grep -o '"_id":"[^"]*"' | head -1 | cut -d'"' -f4)
if [ -z "$PRODUCT_ID" ]; then
    echo "❌ Could not extract product ID"
    echo "Response: $PRODUCTS"
    exit 1
fi
echo "✅ Found product ID: $PRODUCT_ID"
echo ""

# Step 3: Test with admin token (from your context)
JWT_TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY5MWViYTJhYmFkZmJhZDYzNzFjYWJkMSIsInJvbGUiOiJhZG1pbiIsImVtYWlsIjoiYWRtaW5AZXhhbXBsZS5jb20iLCJpYXQiOjE3NjM2MjMwODAsImV4cCI6MTc2NDIyNzg4MH0.m2M-zmGgy-jMXe2IgI0lCIHso5wqrTCescFe5zwjmq8"

echo "Step 3: Creating order..."
echo "Using Product ID: $PRODUCT_ID"
echo ""

ORDER_RESPONSE=$(curl -s -X POST "$SERVER/api/orders" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"items\": [
      {
        \"productId\": \"$PRODUCT_ID\",
        \"quantity\": 2
      }
    ],
    \"address\": {
      \"name\": \"Test User\",
      \"phone\": \"1234567890\",
      \"line1\": \"123 Test Street\",
      \"line2\": \"Apt 4B\",
      \"city\": \"Mumbai\",
      \"state\": \"Maharashtra\",
      \"country\": \"India\",
      \"pincode\": \"400001\"
    },
    \"paymentMethod\": \"COD\"
  }")

echo "==================================="
echo "Response:"
echo "==================================="
echo "$ORDER_RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$ORDER_RESPONSE"
echo ""

# Check if order was created successfully
if echo "$ORDER_RESPONSE" | grep -q '"success":true'; then
    echo "✅ Order created successfully!"
    
    # Extract order ID
    ORDER_ID=$(echo $ORDER_RESPONSE | grep -o '"_id":"[^"]*"' | head -1 | cut -d'"' -f4)
    if [ ! -z "$ORDER_ID" ]; then
        echo "Order ID: $ORDER_ID"
    fi
else
    echo "❌ Order creation failed"
    if echo "$ORDER_RESPONSE" | grep -q 'error'; then
        ERROR=$(echo $ORDER_RESPONSE | grep -o '"error":"[^"]*"' | cut -d'"' -f4)
        echo "Error: $ERROR"
    fi
fi

echo ""
echo "==================================="
echo "Test Complete"
echo "==================================="
