#!/bin/bash

# Script to update import references after cleaning up duplicate files
# Author: GitHub Copilot
# Date: May 24, 2025

# Set the base directory for the backend
BACKEND_DIR="/home/alivegod/Desktop/4-Ordibehesht/LastProjectendpoint/LastProject/backend"

echo "=== Updating import references after duplicate cleanup ==="

# 1. Update imports for base controller
echo "Fixing imports for base.controller.ts..."
find "$BACKEND_DIR" -type f -name "*.ts" -exec grep -l "from '.*\/app\/base.controller'" {} \; | while read -r file; do
    echo "Updating imports in $file"
    sed -i "s#from '.*\/app\/base.controller'#from '../../app/controllers/base.controller'#g" "$file"
done

# 2. Update imports for app module
echo "Fixing imports for app.module.ts..."
find "$BACKEND_DIR" -type f -name "*.ts" -exec grep -l "from '.*\/app\/app.module'" {} \; | while read -r file; do
    echo "Updating imports in $file"
    sed -i "s#from '.*\/app\/app.module'#from '../app.module'#g" "$file"
done

# 3. Update imports for typeorm config
echo "Fixing imports for typeorm.config.ts..."
find "$BACKEND_DIR" -type f -name "*.ts" -exec grep -l "from '.*\/typeorm.config'" {} \; | while read -r file; do
    echo "Updating imports in $file"
    sed -i "s#from '.*\/typeorm.config'#from './src/typeorm.config'#g" "$file"
done

# 4. Update imports for request-with-user interface
echo "Fixing imports for request-with-user.interface.ts..."
find "$BACKEND_DIR" -type f -name "*.ts" -exec grep -l "from '.*\/auth\/interfaces\/request-with-user.interface'" {} \; | while read -r file; do
    echo "Updating imports in $file"
    sed -i "s#from '.*\/auth\/interfaces\/request-with-user.interface'#from '../../shared/interfaces/request-with-user.interface'#g" "$file"
done

# 5. Update imports for ShahiToken ABI
echo "Fixing imports for ShahiToken ABIs..."
find "$BACKEND_DIR" -type f -name "*.ts" -exec grep -l "shahiToken.json" {} \; | while read -r file; do
    echo "Updating imports in $file"
    sed -i "s#shahiToken.json#shahi-token.abi.json#g" "$file"
done

find "$BACKEND_DIR" -type f -name "*.ts" -exec grep -l "contracts\/shahi-token.abi.json" {} \; | while read -r file; do
    echo "Updating imports in $file"
    sed -i "s#contracts\/shahi-token.abi.json#abis\/shahi-token.abi.json#g" "$file"
done

# 6. Update imports for mock providers
echo "Fixing imports for mock providers..."
find "$BACKEND_DIR" -type f -name "*.ts" -exec grep -l "mock-providers.js" {} \; | while read -r file; do
    echo "Updating imports in $file"
    sed -i "s#mock-providers.js#mock-providers.ts#g" "$file"
done

find "$BACKEND_DIR" -type f -name "*.ts" -exec grep -l "mock-providers.legacy.js" {} \; | while read -r file; do
    echo "Updating imports in $file"
    sed -i "s#mock-providers.legacy.js#mock-providers.ts#g" "$file"
done

echo "=== Import reference updates completed ==="
echo "Review the changes and test your application to ensure everything works correctly."
