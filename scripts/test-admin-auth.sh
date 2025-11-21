#!/bin/bash
# Admin Auth Quick Test Script
# Tests the admin authentication endpoint

set -e

# Configuration
PORT="${PORT:-5001}"
BASE_URL="http://localhost:${PORT}"
ADMIN_EMAIL="${ADMIN_EMAIL:-admin@kitchenkettles.local}"
ADMIN_PASSWORD="${ADMIN_PW:-Admin@1234}"

echo "🧪 Kitchen Kettles Admin Auth Test"
echo "===================================="
echo ""

# Check if server is running
echo "1️⃣  Checking if server is running..."
if curl -s -o /dev/null -w "%{http_code}" "${BASE_URL}/api/categories" | grep -q "200\|404\|401"; then
    echo "   ✅ Server is running at ${BASE_URL}"
else
    echo "   ❌ Server not responding at ${BASE_URL}"
    echo "   💡 Start the server with: npm start"
    exit 1
fi
echo ""

# Test admin login
echo "2️⃣  Testing admin login..."
echo "   Email: ${ADMIN_EMAIL}"
echo ""

RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "${BASE_URL}/api/admin/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"${ADMIN_EMAIL}\",\"password\":\"${ADMIN_PASSWORD}\"}")

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [ "$HTTP_CODE" = "200" ]; then
    echo "   ✅ Login successful!"
    echo ""
    echo "   Response:"
    echo "$BODY" | python3 -m json.tool 2>/dev/null || echo "$BODY"
    echo ""
    
    # Extract token
    TOKEN=$(echo "$BODY" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
    if [ -n "$TOKEN" ]; then
        echo "   🔑 Token extracted successfully"
        echo ""
        
        # Test authenticated endpoint
        echo "3️⃣  Testing authenticated endpoint..."
        ME_RESPONSE=$(curl -s -w "\n%{http_code}" -X GET "${BASE_URL}/api/admin/auth/me" \
          -H "Authorization: Bearer ${TOKEN}")
        
        ME_HTTP_CODE=$(echo "$ME_RESPONSE" | tail -n1)
        ME_BODY=$(echo "$ME_RESPONSE" | sed '$d')
        
        if [ "$ME_HTTP_CODE" = "200" ]; then
            echo "   ✅ Authenticated request successful!"
            echo ""
            echo "   Admin Profile:"
            echo "$ME_BODY" | python3 -m json.tool 2>/dev/null || echo "$ME_BODY"
        else
            echo "   ⚠️  Authenticated request failed (HTTP ${ME_HTTP_CODE})"
            echo "$ME_BODY"
        fi
    fi
else
    echo "   ❌ Login failed (HTTP ${HTTP_CODE})"
    echo ""
    echo "   Response:"
    echo "$BODY" | python3 -m json.tool 2>/dev/null || echo "$BODY"
    echo ""
    echo "   💡 Make sure you've seeded the admin user:"
    echo "      node src/scripts/seedAdmin.js"
    exit 1
fi

echo ""
echo "✨ Test completed!"
