#!/bin/bash

# DocsGPT Setup Script
# This script automates the initial setup process

set -e  # Exit on error

echo "🚀 DocsGPT Setup Script"
echo "======================="
echo ""

# Check Node.js installation
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 16+ first."
    echo "   Visit: https://nodejs.org/"
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 16 ]; then
    echo "❌ Node.js version 16+ is required. Current version: $(node -v)"
    exit 1
fi

echo "✅ Node.js $(node -v) detected"
echo ""

# Check npm installation
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed."
    exit 1
fi

echo "✅ npm $(npm -v) detected"
echo ""

# Install backend dependencies
echo "📦 Installing backend dependencies..."
cd backend
npm install
if [ $? -eq 0 ]; then
    echo "✅ Backend dependencies installed"
else
    echo "❌ Failed to install backend dependencies"
    exit 1
fi
cd ..
echo ""

# Install frontend dependencies
echo "📦 Installing frontend dependencies..."
cd frontend
npm install
if [ $? -eq 0 ]; then
    echo "✅ Frontend dependencies installed"
else
    echo "❌ Failed to install frontend dependencies"
    exit 1
fi
cd ..
echo ""

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo "📝 Creating .env file from template..."
    cp .env.example .env
    echo "✅ .env file created"
    echo ""
    echo "⚠️  IMPORTANT: Edit .env file and add your API key!"
    echo "   File location: $(pwd)/.env"
    echo ""
else
    echo "ℹ️  .env file already exists"
    echo ""
fi

# Security check - warn if API key is exposed in frontend
if grep -q "apiKey: 'xai-" frontend/js/app.js 2>/dev/null; then
    echo "⚠️  WARNING: API key detected in frontend/js/app.js"
    echo "   This is a security risk! Please:"
    echo "   1. Remove the hardcoded API key"
    echo "   2. Add it to .env file instead"
    echo "   3. Implement backend proxy (see SECURITY.md)"
    echo ""
fi

# Check if git is initialized
if [ ! -d .git ]; then
    echo "📚 Git repository not initialized. Initialize now? (y/n)"
    read -r response
    if [[ "$response" =~ ^[Yy]$ ]]; then
        git init
        echo "✅ Git repository initialized"
        echo ""
    fi
fi

# Check if .gitignore exists
if [ -f .gitignore ]; then
    echo "✅ .gitignore file exists"
else
    echo "⚠️  .gitignore file not found - secrets may be exposed!"
fi
echo ""

# Summary
echo "✨ Setup Complete!"
echo "=================="
echo ""
echo "Next steps:"
echo "1. Edit .env file and add your API key"
echo "2. Start the backend: cd backend && npm start"
echo "3. Open frontend/index.html in your browser"
echo ""
echo "📚 Documentation:"
echo "   - README.md - Getting started guide"
echo "   - SECURITY.md - Security best practices"
echo "   - CONTRIBUTING.md - Contribution guidelines"
echo ""
echo "🔒 Security Reminders:"
echo "   - Never commit .env file"
echo "   - Never commit API keys"
echo "   - Review SECURITY.md for best practices"
echo ""
echo "Happy analyzing! 🎉"
