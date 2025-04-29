#!/bin/bash

echo "===== Setting Up Admin Wallet for SHAHI Token Contract ====="
echo
echo "This script will help you import your Trust Wallet as the admin wallet"
echo "You will need your 12-word seed phrase from your Trust Wallet"
echo
echo "WARNING: Only enter your seed phrase on a secure device!"
echo "         Never share your seed phrase with anyone!"
echo

# Change directory to the hotwallet location
cd "$(dirname "$0")/src/blockchain/hotwallet" || {
  echo "❌ Error: Could not find the hotwallet directory"
  exit 1
}

echo "Please enter your 12-word Trust Wallet seed phrase:"
read -p "> " MNEMONIC

# Import the wallet using the CLI tool
echo "Importing wallet from mnemonic..."
OUTPUT=$(node cli-tools.mjs import "$MNEMONIC" "ETH")

# Extract the private key and address from the output
PRIVATE_KEY=$(echo "$OUTPUT" | grep -o "privateKey: '0x[^']*'" | cut -d "'" -f2)
ADDRESS=$(echo "$OUTPUT" | grep -o "address: '[^']*'" | cut -d "'" -f2)

if [ -z "$PRIVATE_KEY" ] || [ -z "$ADDRESS" ]; then
  echo "❌ Error: Failed to extract wallet information"
  echo "Output was: $OUTPUT"
  exit 1
fi

# Update the .env file
cd ../../../../ || exit
ENV_FILE=".env"

echo "Updating $ENV_FILE with admin wallet information..."

# Check if the file exists
if [ ! -f "$ENV_FILE" ]; then
  echo "Creating new .env file..."
  touch "$ENV_FILE"
fi

# Update or add the ADMIN_PRIVATE_KEY
if grep -q "ADMIN_PRIVATE_KEY" "$ENV_FILE"; then
  # Replace existing key
  sed -i "s|ADMIN_PRIVATE_KEY=.*|ADMIN_PRIVATE_KEY=$PRIVATE_KEY|g" "$ENV_FILE"
else
  # Add new key
  echo "" >> "$ENV_FILE"
  echo "# Admin wallet for SHAHI token contract" >> "$ENV_FILE"
  echo "ADMIN_PRIVATE_KEY=$PRIVATE_KEY" >> "$ENV_FILE"
fi

# Update TOKEN_CONTRACT_ADDRESS if needed
if ! grep -q "TOKEN_CONTRACT_ADDRESS" "$ENV_FILE"; then
  echo "TOKEN_CONTRACT_ADDRESS=0x742d35Cc6634C0532925a3b844Bc454e4438f44e" >> "$ENV_FILE"
fi

echo "✅ Done! Your admin wallet has been set up."
echo "Admin Wallet Address: $ADDRESS"
echo "Private Key has been saved to .env file"
echo
echo "Remember to fund this wallet with ETH to pay for gas when minting tokens."