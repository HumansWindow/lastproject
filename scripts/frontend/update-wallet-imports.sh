#!/bin/bash

# Define the directory to process
PROJECT_DIR="/home/alivegod/Desktop/LastProjectendpoint/LastProject/frontend"

echo "Starting to update wallet import references..."

# Find and replace old imports with new consolidated wallet service
find "$PROJECT_DIR" -type f -name "*.ts*" -exec sed -i \
  -e 's|from ["].*services/api/modules/auth/wallet-auth-service["]|from "../services/wallet"|g' \
  -e 's|from ["].*services/api/modules/wallet/wallet-integration["]|from "../services/wallet"|g' \
  -e 's|from ["].*services/api/modules/wallet/multi-wallet-provider["]|from "../services/wallet"|g' \
  -e 's|from ["].*services/api/modules/wallet/wallet-service["]|from "../services/wallet"|g' \
  -e 's|from ["].*services/api/wallet-service["]|from "../services/wallet"|g' \
  {} \;

# Also check for single quote imports
find "$PROJECT_DIR" -type f -name "*.ts*" -exec sed -i \
  -e "s|from '.*services/api/modules/auth/wallet-auth-service'|from '../services/wallet'|g" \
  -e "s|from '.*services/api/modules/wallet/wallet-integration'|from '../services/wallet'|g" \
  -e "s|from '.*services/api/modules/wallet/multi-wallet-provider'|from '../services/wallet'|g" \
  -e "s|from '.*services/api/modules/wallet/wallet-service'|from '../services/wallet'|g" \
  -e "s|from '.*services/api/wallet-service'|from '../services/wallet'|g" \
  {} \;

echo "Import paths have been updated!"
echo "Now you should check each file to ensure correct imports and functionality."
