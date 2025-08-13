#!/bin/bash

echo "🇨🇦 Setting up Canada Residency Days Tracker"
echo "=============================================="

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

# Check if PostgreSQL is running (basic check)
if ! command -v psql &> /dev/null; then
    echo "⚠️  PostgreSQL client not found. Make sure PostgreSQL is installed and running."
    echo "   You can install it via: brew install postgresql (macOS) or apt-get install postgresql (Ubuntu)"
fi

echo "📦 Installing dependencies..."
npm run install:all

echo "🗄️  Setting up database..."
cd apps/api

# Check if .env file exists
if [ ! -f .env ]; then
    echo "📝 Creating .env file..."
    cat > .env << EOF
# Database connection string - UPDATE THIS WITH YOUR DATABASE DETAILS
DATABASE_URL="postgresql://username:password@localhost:5432/canada_tracker"

# Server port (optional, defaults to 3001)
PORT=3001
EOF
    echo "⚠️  Please update the DATABASE_URL in apps/api/.env with your PostgreSQL connection details"
    echo "   Example: DATABASE_URL=\"postgresql://your_username:your_password@localhost:5432/canada_tracker\""
fi

echo "🔧 Generating Prisma client..."
npx prisma generate

echo "📊 Setting up database schema..."
echo "   Note: Make sure your PostgreSQL database is running and accessible"
npx prisma db push

cd ../..

echo ""
echo "✅ Setup complete!"
echo ""
echo "🚀 To start the application:"
echo "   1. Update the DATABASE_URL in apps/api/.env with your database details"
echo "   2. Run: npm run dev"
echo ""
echo "📱 The application will be available at:"
echo "   - Frontend: http://localhost:5173"
echo "   - Backend API: http://localhost:3001"
echo ""
echo "📚 For more information, see README.md"
