#!/bin/bash

# Fingerprint API Installation and Startup Script
# This script installs dependencies and starts the fingerprint API server

echo "🔐 Fingerprint API Setup"
echo "========================"

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    echo "   Visit: https://nodejs.org/"
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm first."
    exit 1
fi

echo "✅ Node.js version: $(node --version)"
echo "✅ npm version: $(npm --version)"
echo ""

# Install dependencies
echo "📦 Installing dependencies..."
npm install

if [ $? -eq 0 ]; then
    echo "✅ Dependencies installed successfully"
else
    echo "❌ Failed to install dependencies"
    exit 1
fi

echo ""

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "⚠️  .env file not found. Creating from template..."
    cp env.example .env
    echo "✅ .env file created from template"
    echo "📝 Please edit .env file with your configuration before starting the server"
    echo ""
    echo "Required configuration:"
    echo "  - DB_HOST: Database host"
    echo "  - DB_USER: Database username"
    echo "  - DB_PASSWORD: Database password"
    echo "  - ESP32_API_KEY: API key for ESP32 devices"
    echo ""
    echo "Edit .env file and run this script again to start the server."
    exit 0
fi

# Check if required environment variables are set
echo "🔍 Checking environment configuration..."

source .env

if [ -z "$DB_HOST" ] || [ -z "$DB_USER" ] || [ -z "$ESP32_API_KEY" ]; then
    echo "❌ Required environment variables not set in .env file"
    echo "   Please configure: DB_HOST, DB_USER, ESP32_API_KEY"
    exit 1
fi

echo "✅ Environment configuration looks good"
echo ""

# Test database connection
echo "🔗 Testing database connection..."
node -e "
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

async function testConnection() {
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME || 'attendance'
    });
    console.log('✅ Database connection successful');
    await connection.end();
  } catch (error) {
    console.log('❌ Database connection failed:', error.message);
    process.exit(1);
  }
}
testConnection();
"

if [ $? -eq 0 ]; then
    echo "✅ Database connection test passed"
else
    echo "❌ Database connection test failed"
    echo "   Please check your database configuration in .env"
    exit 1
fi

echo ""

# Start the server
echo "🚀 Starting Fingerprint API server..."
echo "   Server will run on port: ${PORT:-5001}"
echo "   Environment: ${NODE_ENV:-development}"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

npm start

