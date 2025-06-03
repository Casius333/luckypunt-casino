#!/bin/bash

echo "🚀 Starting deployment..."

# Navigate to project directory
cd /var/www/luckypunt

# Create backup of current state
echo "📦 Creating backup..."
timestamp=$(date +%Y%m%d_%H%M%S)
git tag backup_$timestamp

# Pull latest changes
echo "⬇️ Pulling latest changes..."
git pull origin main || { echo "❌ Git pull failed"; exit 1; }

# Install dependencies if package.json changed
if git diff HEAD@{1} --name-only | grep -q "package.json"; then
    echo "📦 Installing dependencies..."
    npm install || { echo "❌ npm install failed"; exit 1; }
fi

# Build the application
echo "🔨 Building application..."
npm run build || { echo "❌ Build failed"; exit 1; }

# Restart PM2 process
echo "🔄 Restarting application..."
pm2 restart all || { echo "❌ PM2 restart failed"; exit 1; }

echo "✅ Deployment completed successfully!" 