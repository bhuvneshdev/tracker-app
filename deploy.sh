#!/bin/bash

echo "🚀 Canada Residency Tracker - Deployment Helper"
echo "================================================"

echo ""
echo "📋 Pre-deployment Checklist:"
echo "1. Have you created accounts on Vercel, Render, and Neon?"
echo "2. Do you have your Neon database connection string?"
echo "3. Is your code pushed to GitHub?"
echo ""

read -p "Are you ready to proceed? (y/n): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Please complete the prerequisites first. See DEPLOYMENT.md for details."
    exit 1
fi

echo ""
echo "🔧 Building application for deployment..."

# Build API
echo "Building API..."
cd apps/api
npm run build
if [ $? -ne 0 ]; then
    echo "❌ API build failed"
    exit 1
fi

# Build Web
echo "Building Web app..."
cd ../web
npm run build
if [ $? -ne 0 ]; then
    echo "❌ Web build failed"
    exit 1
fi

cd ../..

echo ""
echo "✅ Build completed successfully!"
echo ""
echo "📝 Next Steps:"
echo ""
echo "1. 🗄️  Database (Neon):"
echo "   - Go to https://neon.tech/"
echo "   - Create project and copy connection string"
echo "   - Update apps/api/.env with your DATABASE_URL"
echo ""
echo "2. 🔧 Backend API (Render):"
echo "   - Go to https://render.com/"
echo "   - Create new Web Service"
echo "   - Connect your GitHub repo"
echo "   - Root Directory: apps/api"
echo "   - Build Command: npm install && npm run build"
echo "   - Start Command: npm start"
echo "   - Add DATABASE_URL environment variable"
echo ""
echo "3. 🌐 Frontend (Vercel):"
echo "   - Go to https://vercel.com/"
echo "   - Import your GitHub repo"
echo "   - Root Directory: apps/web"
echo "   - Add VITE_API_URL environment variable (your Render API URL)"
echo ""
echo "📚 For detailed instructions, see DEPLOYMENT.md"
echo ""
echo "🎉 Your app will be live and accessible from anywhere!"
