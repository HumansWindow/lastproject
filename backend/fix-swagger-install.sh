#!/bin/bash

echo "===== Fixing Swagger Installation ====="

# Check if the node_modules directory exists
if [ ! -d "node_modules" ]; then
  echo "Node modules not found. Running npm install..."
  npm install
fi

# Show current directory and node_modules location
echo "Current directory: $(pwd)"
echo "Node modules path: $(realpath node_modules 2>/dev/null || echo 'Not found')"

# Check for existing swagger installations
echo "Checking for existing swagger packages..."
if [ -d "node_modules/@nestjs/swagger" ]; then
  echo "Found existing @nestjs/swagger installation."
else
  echo "@nestjs/swagger not found in node_modules."
fi

if [ -d "node_modules/swagger-ui-express" ]; then
  echo "Found existing swagger-ui-express installation."
else
  echo "swagger-ui-express not found in node_modules."
fi

# Install specific versions to avoid compatibility issues
echo "Installing specific versions of swagger packages..."
npm install --save swagger-ui-express@4.6.3 @nestjs/swagger@6.3.0

# Verify installation with more detailed error reporting
echo "Verifying installation..."
if [ -d "node_modules/@nestjs/swagger" ]; then
  echo "✅ @nestjs/swagger installed successfully."
  ls -la node_modules/@nestjs/swagger
else
  echo "❌ @nestjs/swagger installation failed."
  echo "Checking npm cache..."
  npm cache verify
fi

if [ -d "node_modules/swagger-ui-express" ]; then
  echo "✅ swagger-ui-express installed successfully."
  ls -la node_modules/swagger-ui-express
else
  echo "❌ swagger-ui-express installation failed."
  echo "Checking package.json..."
  grep -A 5 '"dependencies"' package.json
fi

# Check if the packages are properly listed in package.json
echo "Checking package.json for swagger entries..."
if grep -q '"@nestjs/swagger"' package.json && grep -q '"swagger-ui-express"' package.json; then
  echo "✅ Both packages are listed in package.json"
else
  echo "❌ One or both packages are not listed in package.json"
  echo "Manually adding them to package.json..."
  
  # Create a temporary file with updated dependencies
  node -e "
    const fs = require('fs');
    const pkg = JSON.parse(fs.readFileSync('./package.json', 'utf8'));
    pkg.dependencies = pkg.dependencies || {};
    pkg.dependencies['@nestjs/swagger'] = '^6.3.0';
    pkg.dependencies['swagger-ui-express'] = '^4.6.3';
    fs.writeFileSync('./package.json', JSON.stringify(pkg, null, 2));
  "
  
  echo "Updated package.json. Running npm install again..."
  npm install
fi

# Create a simple test file to verify Swagger modules can be imported
echo "Creating a test file to verify Swagger imports..."
cat > swagger-test.js << 'EOL'
try {
  const swagger = require('@nestjs/swagger');
  console.log('✅ @nestjs/swagger can be imported');
  console.log('Available exports:', Object.keys(swagger));
} catch (e) {
  console.log('❌ Error importing @nestjs/swagger:', e.message);
}

try {
  const swaggerUI = require('swagger-ui-express');
  console.log('✅ swagger-ui-express can be imported');
  console.log('Available exports:', Object.keys(swaggerUI));
} catch (e) {
  console.log('❌ Error importing swagger-ui-express:', e.message);
}
EOL

echo "Running Swagger import test..."
node swagger-test.js

echo -e "\nTroubleshooting Steps:"
echo "1. Try running: npm install --legacy-peer-deps"
echo "2. Check for NPM permissions issues: ls -la node_modules"
echo "3. Try cleaning NPM cache: npm cache clean --force"
echo "4. Check for workspace issues: cd .. && npm install && cd backend"
echo "5. Check NodeJS version: node -v (should be 14.x or higher)"

echo -e "\nAfter fixing the issues, you can run your application:"
echo "npm run dev"
