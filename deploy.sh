#!/bin/bash

echo "🚀 Starting deployment..."

# Stop the current PM2 process
pm2 stop luckypunt

# Navigate to the application directory
cd /var/www/luckypunt

# Backup the current .env file
if [ -f .env ]; then
  cp .env .env.backup
fi

# Remove the current codebase (preserving .env and node_modules)
find . -mindepth 1 -maxdepth 1 ! -name '.env' ! -name 'node_modules' -exec rm -rf {} +

# Clone the new casino-specific repository
git clone https://github.com/Casius333/luckypunt-casino.git temp
mv temp/* temp/.* . 2>/dev/null || true
rm -rf temp

# Install dependencies with legacy peer deps to avoid font issues
npm install --legacy-peer-deps

# Build the application with increased memory limit
export NODE_OPTIONS="--max-old-space-size=4096"
npm run build

# Restore the .env file if it was overwritten
if [ -f .env.backup ]; then
  cp .env.backup .env
fi

# Start the application with PM2
pm2 restart luckypunt

# Show the status
pm2 list

echo "✅ Deployment completed successfully!" 