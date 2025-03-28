#!/bin/bash

echo "Setting up Hot Wallet environment..."

# Create a symlink to the node_modules folder from the parent project
if [ ! -L "node_modules" ]; then
  ln -s ../../../../node_modules node_modules
  echo "Symlink created successfully"
else
  echo "Symlink already exists"
fi

echo "Making CLI tools executable"
chmod +x cli-tools.mjs

echo "Setup complete! You can now use the hot wallet CLI tools:"
echo "node cli-tools.mjs get-key   - Get private keys from mnemonic"
echo "node cli-tools.mjs import    - Import wallet from mnemonic and show addresses/balances"
