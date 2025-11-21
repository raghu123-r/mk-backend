#!/bin/bash
# Kitchen Kettles Backend - Admin Auth Quick Setup
# Run this script to set up and test admin authentication

set -e

echo "🔧 Kitchen Kettles Admin Auth Setup"
echo "===================================="
echo ""

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found"
    echo "   Please run this script from the kk-backend directory"
    exit 1
fi

# Check for .env file
if [ ! -f ".env" ]; then
    echo "⚠️  Warning: .env file not found"
    echo "   Creating .env file with defaults..."
    cat > .env << 'EOF'
# MongoDB Connection
MONGO_URI=mongodb://localhost:27017/kitchen-kettles

# JWT Configuration
JWT_SECRET=dev-secret-change-in-production-12345
JWT_EXPIRES_IN=1d

# Server
PORT=5001

# Admin Credentials (for seeding)
ADMIN_EMAIL=admin@kitchenkettles.local
ADMIN_PW=Admin@1234
ADMIN_NAME=Admin User
EOF
    echo "   ✅ Created .env with default values"
    echo "   ⚠️  Remember to update JWT_SECRET in production!"
    echo ""
fi

# Check if MongoDB is accessible
echo "1️⃣  Checking MongoDB connection..."
MONGO_URI=$(grep MONGO_URI .env | cut -d '=' -f2)
if timeout 3 mongosh "$MONGO_URI" --eval "db.adminCommand('ping')" &>/dev/null; then
    echo "   ✅ MongoDB is accessible"
else
    echo "   ⚠️  MongoDB connection failed or timed out"
    echo "   💡 Make sure MongoDB is running"
    echo "   💡 Or update MONGO_URI in .env"
fi
echo ""

# Install dependencies
echo "2️⃣  Checking dependencies..."
if [ ! -d "node_modules" ]; then
    echo "   Installing dependencies..."
    npm install
    echo "   ✅ Dependencies installed"
else
    echo "   ✅ Dependencies already installed"
fi
echo ""

# Seed admin user
echo "3️⃣  Seeding admin user..."
npm run seed:admin
echo ""

# Instructions
echo "✨ Setup Complete!"
echo ""
echo "📋 Next Steps:"
echo "   1. Start the server:"
echo "      npm start"
echo ""
echo "   2. Test admin login:"
echo "      npm run test:admin"
echo ""
echo "   3. Or manually test with curl:"
echo "      curl -X POST http://localhost:5001/api/admin/auth/login \\"
echo "        -H \"Content-Type: application/json\" \\"
echo "        -d '{\"email\":\"admin@kitchenkettles.local\",\"password\":\"Admin@1234\"}'"
echo ""
echo "📖 For more information, see ADMIN_AUTH_README.md"
echo ""
