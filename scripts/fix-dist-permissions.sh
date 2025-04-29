#!/bin/bash

# Script to fix permissions on the dist directory
echo "Fixing permissions on dist directory..."
chmod -R 755 dist/ || echo "Could not change permissions - trying with sudo"
sudo chmod -R 755 dist/ || echo "Failed to fix permissions with sudo too"

echo "Done fixing permissions."