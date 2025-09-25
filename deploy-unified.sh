#!/bin/bash

# Unified Deployment Script for Attendance System
# This script builds and deploys the entire system as a single unit

echo "🚀 Starting Unified Deployment for Attendance System"
echo "=================================================="

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

echo "✅ Node.js version: $(node --version)"

# Install root dependencies (frontend)
echo "📦 Installing frontend dependencies..."
npm install

if [ $? -ne 0 ]; then
    echo "❌ Failed to install frontend dependencies"
    exit 1
fi

# Build frontend
echo "🏗️  Building frontend..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Frontend build failed"
    exit 1
fi

echo "✅ Frontend built successfully"

# Install backend dependencies
echo "📦 Installing backend dependencies..."
cd backend
npm install

if [ $? -ne 0 ]; then
    echo "❌ Failed to install backend dependencies"
    exit 1
fi

# Install fp-api dependencies
echo "📦 Installing fp-api dependencies..."
cd ../fp-api
npm install

if [ $? -ne 0 ]; then
    echo "❌ Failed to install fp-api dependencies"
    exit 1
fi

# Go back to root
cd ..

# Check if .env file exists in backend
if [ ! -f "backend/.env" ]; then
    echo "📝 Creating backend .env file from template..."
    cp backend/env.example backend/.env
    echo "⚠️  Please update backend/.env with your configuration"
fi

# Check if .env file exists in fp-api
if [ ! -f "fp-api/.env" ]; then
    echo "📝 Creating fp-api .env file from template..."
    cp fp-api/env.example fp-api/.env
    echo "⚠️  Please update fp-api/.env with your configuration"
fi

echo ""
echo "🎉 Unified deployment setup complete!"
echo ""
echo "📋 Next steps:"
echo "1. Update backend/.env and fp-api/.env with your configuration"
echo "2. Run 'cd backend && npm start' to start the unified server"
echo "3. The server will serve:"
echo "   - Frontend at: http://localhost:5000"
echo "   - Backend API at: http://localhost:5000/api/*"
echo "   - Fingerprint API at: http://localhost:5000/api/fingerprint/*"
echo ""
echo "🔧 Environment Variables to configure:"
echo "   Backend: DB_HOST, DB_USER, DB_PASSWORD, JWT_SECRET"
echo "   FP-API: DB_HOST, DB_USER, DB_PASSWORD, ESP32_API_KEY"
