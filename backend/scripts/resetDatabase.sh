#!/bin/bash

echo "🗑️  Resetting database..."

# Stop any running server processes
echo "Stopping server processes..."
pkill -f "node.*index.js" 2>/dev/null || true
pkill -f "nodemon" 2>/dev/null || true

# Wait for processes to stop
sleep 2

# Remove old storage
echo "Removing old storage directory..."
rm -rf storage/

# Create new storage directory
echo "Creating new storage directory..."
mkdir -p storage

echo "✅ Database reset complete!"
echo "📝 Note: Start the server to initialize a fresh database"