
#!/bin/bash
# Real deployment script for SHAHI Coin on Polygon Mumbai
# NOTE: Ensure you have the following environment variables set:
# - PRIVATE_KEY: Your wallet private key
# - ADMIN_HOT_WALLET: Admin wallet address
# - POLYGON_MUMBAI_RPC: RPC endpoint URL

# 1. Compile contracts
npx hardhat compile

# 2. Deploy implementation and proxy
npx hardhat run deploy/deploy-polygon.js --network mumbai

# 3. Verify contract on PolygonScan (if etherscan API key is set)
if [ -n "$POLYGONSCAN_API_KEY" ]; then
  npx hardhat verify --network mumbai IMPLEMENTATION_ADDRESS_HERE
else
  echo "Skipping verification - POLYGONSCAN_API_KEY not set"
fi

# 4. Output deployment information
echo "Deployment complete! Update your frontend with the new contract address."
