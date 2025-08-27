#!/bin/bash

echo "🚀 Setting up Attendance System Backend..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

echo "✅ Node.js version: $(node --version)"

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm first."
    exit 1
fi

echo "✅ npm version: $(npm --version)"

# Install dependencies
echo "📦 Installing dependencies..."
npm install

if [ $? -ne 0 ]; then
    echo "❌ Failed to install dependencies"
    exit 1
fi

echo "✅ Dependencies installed successfully"

# Check if .env file exists
if [ ! -f .env ]; then
    echo "📝 Creating .env file from template..."
    cp env.example .env
    echo "✅ .env file created. Please update it with your configuration."
else
    echo "✅ .env file already exists"
fi

echo ""
echo "🎉 Backend setup complete!"
echo ""
echo "📋 Next steps:"
echo "1. Update the .env file with your configuration"
echo "2. Run 'npm run dev' to start the development server"
echo "3. The server will be available at http://localhost:5000"
echo ""
echo "🔐 Default users:"
echo "   Admin: admin@foothills.edu / admin123"
echo "   Teacher: sarah.johnson@foothills.edu / teacher123"
echo "   Parent: sarah.johnson@email.com / parent123"
echo ""
echo "📚 API Documentation: http://localhost:5000/health" 