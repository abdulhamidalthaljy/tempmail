#!/bin/bash

echo "🚀 TempMail Frontend Deployment Script"
echo "======================================"

# Navigate to frontend directory
cd frontend/client

echo "📦 Installing dependencies..."
npm install

echo "🔨 Building for production..."
npm run build:vercel

echo "✅ Build complete!"
echo ""
echo "Next steps:"
echo "1. Push your code to GitHub"
echo "2. Go to vercel.com and import your repository"
echo "3. Set root directory to: frontend/client"
echo "4. Set build command to: npm run build:vercel"
echo "5. Set output directory to: dist/client/browser"
echo ""
echo "Your backend is already running at:"
echo "https://tempmail-production-740f.up.railway.app"
