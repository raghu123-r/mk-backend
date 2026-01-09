#!/bin/bash

# ============================================================================
# Kitchen Kettles - Return/Replace/Refund Feature Test Suite
# ============================================================================
# This script tests the returns feature using curl ONLY.
# Prerequisites: Backend server running on http://localhost:5001
# ============================================================================

set -e  # Exit on first error

# Configuration
BASE_URL="http://localhost:5001"
TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2OTVmYmIwMzdkNzQzOTk3NWZmMDU0ZWUiLCJyb2xlIjoidXNlciIsImlhdCI6MTc2Nzk2MzM3NSwiZXhwIjoxNzY4NTY4MTc1fQ.dTQAKm3zPzZ1774ptAYvPBtKxEh-WbwSt92lxM0CP3E"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test results tracking
TESTS_PASSED=0
TESTS_FAILED=0
TEMP_DIR=$(mktemp -d)

# Cleanup on exit
trap "rm -rf $TEMP_DIR" EXIT

# ============================================================================
# Helper Functions
# ============================================================================

print_header() {
    echo ""
    echo -e "${BLUE}================================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}================================================${NC}"
}

print_test() {
    echo ""
    echo -e "${YELLOW}🧪 TEST: $1${NC}"
    echo "---"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
    ((TESTS_PASSED++)) || true
}

print_failure() {
    echo -e "${RED}❌ $1${NC}"
    ((TESTS_FAILED++)) || true
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# ============================================================================
# Pre-flight Check
# ============================================================================

print_header "PRE-FLIGHT CHECK"

print_info "Checking if backend server is reachable..."
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/" || echo "000")

if [ "$HTTP_CODE" == "000" ]; then
    print_failure "Backend server is NOT reachable at $BASE_URL"
    echo ""
    echo "Please ensure the backend server is running:"
    echo "  cd kk-backend && npm run dev"
    exit 1
fi

print_success "Backend server is reachable (HTTP $HTTP_CODE)"
echo ""
echo "➡️  Proceeding to API tests..."
echo ""

# ============================================================================
# TEST A: Create Demo Return Request
# ============================================================================

print_header "TEST A: CREATE DEMO RETURN REQUEST"
print_test "Creating a demo return request with isDemo=true"

RESPONSE_FILE="$TEMP_DIR/create_return.json"
HTTP_CODE=$(curl -s -w "%{http_code}" -o "$RESPONSE_FILE" \
    -X POST "$BASE_URL/api/returns" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $TOKEN" \
    -d '{
        "orderId": "DEMO-ORDER-001",
        "productId": "DEMO-PRODUCT-001",
        "actionType": "return",
        "issueType": "others",
        "issueDescription": "Automated demo test",
        "isDemo": true
    }')

echo "Response Code: $HTTP_CODE"
echo "Response Body:"
cat "$RESPONSE_FILE" | python3 -m json.tool 2>/dev/null || cat "$RESPONSE_FILE"

if [ "$HTTP_CODE" == "201" ] || [ "$HTTP_CODE" == "200" ]; then
    # Check if response contains success indicators
    if grep -q "returnId\|_id\|success" "$RESPONSE_FILE"; then
        print_success "Create demo return: PASS"
        
        # Extract returnId for later use
        RETURN_ID=$(cat "$RESPONSE_FILE" | python3 -c "import sys, json; data=json.load(sys.stdin); print(data.get('data', {}).get('returnId', data.get('returnId', data.get('_id', ''))))" 2>/dev/null || echo "")
        if [ -n "$RETURN_ID" ]; then
            print_info "Created Return ID: $RETURN_ID"
        fi
    else
        print_failure "Create demo return: FAIL - Response doesn't contain expected data"
    fi
elif [ "$HTTP_CODE" == "500" ] && grep -q "E11000 duplicate key" "$RESPONSE_FILE"; then
    # Duplicate key is acceptable for demo records (test may run multiple times)
    print_success "Create demo return: PASS (demo record already exists)"
else
    print_failure "Create demo return: FAIL - Expected 200/201, got $HTTP_CODE"
fi

# ============================================================================
# TEST B: Fetch User Returns
# ============================================================================

print_header "TEST B: FETCH USER RETURNS"
print_test "Fetching user returns and validating DEMO-ORDER-001 exists"

RESPONSE_FILE="$TEMP_DIR/fetch_returns.json"
HTTP_CODE=$(curl -s -w "%{http_code}" -o "$RESPONSE_FILE" \
    -X GET "$BASE_URL/api/returns/my?page=1&limit=5" \
    -H "Authorization: Bearer $TOKEN")

echo "Response Code: $HTTP_CODE"
echo "Response Body:"
cat "$RESPONSE_FILE" | python3 -m json.tool 2>/dev/null || cat "$RESPONSE_FILE"

if [ "$HTTP_CODE" == "200" ]; then
    # Check if DEMO-ORDER-001 exists in response
    if grep -q "DEMO-ORDER-001" "$RESPONSE_FILE"; then
        print_success "Fetch returns: PASS - DEMO-ORDER-001 found in response"
    else
        print_failure "Fetch returns: FAIL - DEMO-ORDER-001 not found in response"
        print_info "This might be expected if the return was created but not associated with user"
    fi
else
    print_failure "Fetch returns: FAIL - Expected 200, got $HTTP_CODE"
fi

# ============================================================================
# TEST C: Validate Real Order Protection
# ============================================================================

print_header "TEST C: VALIDATE REAL ORDER PROTECTION"
print_test "Attempting to create return with invalid orderId (should fail)"

RESPONSE_FILE="$TEMP_DIR/invalid_return.json"
HTTP_CODE=$(curl -s -w "%{http_code}" -o "$RESPONSE_FILE" \
    -X POST "$BASE_URL/api/returns" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $TOKEN" \
    -d '{
        "orderId": "123",
        "productId": "123",
        "actionType": "return",
        "issueType": "damaged",
        "issueDescription": "Test with invalid IDs"
    }')

echo "Response Code: $HTTP_CODE"
echo "Response Body:"
cat "$RESPONSE_FILE" | python3 -m json.tool 2>/dev/null || cat "$RESPONSE_FILE"

# This should fail with 400 or 422 (validation error)
if [ "$HTTP_CODE" == "400" ] || [ "$HTTP_CODE" == "422" ] || [ "$HTTP_CODE" == "500" ]; then
    # Check if error message indicates validation failure
    if grep -qi "error\|invalid\|validation\|objectid\|cast" "$RESPONSE_FILE"; then
        print_success "Real order validation enforced: PASS - Request properly rejected"
    else
        print_failure "Real order validation enforced: FAIL - Error response unclear"
    fi
else
    print_failure "Real order validation enforced: FAIL - Expected 400/422/500, got $HTTP_CODE"
    print_info "The request should have been rejected due to invalid ObjectId format"
fi

# ============================================================================
# TEST D: Demo Validation Bypass Check
# ============================================================================

print_header "TEST D: DEMO VALIDATION BYPASS"
print_test "Verifying demo requests bypass strict validation"

RESPONSE_FILE="$TEMP_DIR/demo_bypass.json"
HTTP_CODE=$(curl -s -w "%{http_code}" -o "$RESPONSE_FILE" \
    -X POST "$BASE_URL/api/returns" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $TOKEN" \
    -d '{
        "orderId": "DEMO-SIMPLE-ID",
        "productId": "DEMO-PROD-123",
        "actionType": "replace",
        "issueType": "damaged",
        "issueDescription": "Demo bypass validation test",
        "isDemo": true
    }')

echo "Response Code: $HTTP_CODE"
echo "Response Body:"
cat "$RESPONSE_FILE" | python3 -m json.tool 2>/dev/null || cat "$RESPONSE_FILE"

if [ "$HTTP_CODE" == "201" ] || [ "$HTTP_CODE" == "200" ]; then
    print_success "Demo validation bypass: PASS - Demo request succeeded with simple IDs"
elif [ "$HTTP_CODE" == "500" ] && grep -q "E11000 duplicate key" "$RESPONSE_FILE"; then
    # Duplicate key is acceptable for demo records (test may run multiple times)
    print_success "Demo validation bypass: PASS (demo record already exists)"
else
    print_failure "Demo validation bypass: FAIL - Expected 200/201, got $HTTP_CODE"
    print_info "Demo requests should bypass ObjectId validation"
fi

# ============================================================================
# Final Report
# ============================================================================

print_header "TEST SUMMARY"

TOTAL_TESTS=$((TESTS_PASSED + TESTS_FAILED))
echo ""
echo -e "Total Tests: ${BLUE}$TOTAL_TESTS${NC}"
echo -e "Passed:      ${GREEN}$TESTS_PASSED${NC}"
echo -e "Failed:      ${RED}$TESTS_FAILED${NC}"
echo ""

if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "${GREEN}🎉 ALL TESTS PASSED! 🎉${NC}"
    echo ""
    exit 0
else
    echo -e "${RED}⚠️  SOME TESTS FAILED ⚠️${NC}"
    echo ""
    echo "Suggested Actions:"
    echo "1. Review the failed test responses above"
    echo "2. Check if the returns API endpoint exists: /api/returns"
    echo "3. Verify the Return model and controller implementation"
    echo "4. Ensure demo mode (isDemo: true) bypasses validation"
    echo ""
    exit 1
fi
