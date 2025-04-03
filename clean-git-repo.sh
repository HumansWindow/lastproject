#!/bin/bash

# Remove node_modules directories from git tracking
echo "Removing node_modules directories from Git tracking..."
git rm -r --cached '**/node_modules' 2>/dev/null || echo "No node_modules tracked directly"
git rm -r --cached 'node_modules' 2>/dev/null || echo "No root node_modules tracked"
git rm -r --cached 'backend/node_modules' 2>/dev/null || echo "No backend node_modules tracked"
git rm -r --cached 'frontend/node_modules' 2>/dev/null || echo "No frontend node_modules tracked"
git rm -r --cached 'backend/src/blockchain/contracts/node_modules' 2>/dev/null || echo "No blockchain node_modules tracked"

# Remove large files from git tracking
echo "Removing large binary files from Git tracking..."
git rm -r --cached '**/*.node' 2>/dev/null || echo "No .node files tracked"
git rm -r --cached '**/*.map' 2>/dev/null || echo "No .map files tracked"
git rm -r --cached '**/*.tar.gz' 2>/dev/null || echo "No .tar.gz files tracked"
git rm -r --cached '**/*.tgz' 2>/dev/null || echo "No .tgz files tracked"

echo "Creating commit to remove tracked files..."
git commit -m "Remove large files from Git tracking"

echo "Done! Now you should run 'git push' to update your repository."
echo "Note: This only prevents these files from being tracked in the future. To fully reduce repository size,"
echo "you may need to rewrite Git history using BFG or git-filter-repo."
