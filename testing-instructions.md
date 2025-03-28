# Testing Wallet Connection

This document provides instructions for testing the wallet connection functionality with a fresh database.

## Reset Database and Restart Servers

1. Make the reset script executable:
   ```bash
   chmod +x reset-and-restart.sh
   ```

2. Run the script to reset the database and restart both servers:
   ```bash
   ./reset-and-restart.sh
   ```

   This will:
   - Stop any running backend and frontend processes
   - Reset the database to a clean state
   - Run any pending migrations
   - Start both backend and frontend servers

## Testing Wallet Connection

1. Open your browser and navigate to `http://localhost:3000`

2. Click the "Connect Wallet" button

3. Select your wallet provider (MetaMask, etc.)

4. Monitor the backend logs for wallet connection process:
   ```
   WalletAuthController: Wallet connection request received for address: 0x...
   AuthService: Finding user by wallet address: 0x...
   UsersService: Looking up user by wallet address: 0x...
   UsersService: No user found for wallet address 0x...
   WalletAuthController: Registering new wallet: 0x...
   ```

5. Check for any errors in the backend logs

6. If successful, you should see the wallet connection response in your frontend console and be logged in with your wallet

## Debugging Tips

1. If the wallet connection fails, check the backend logs for detailed error messages

2. Ensure MetaMask is connected to the right network (Ethereum Mainnet or the testnet you're using)

3. Check the browser console for any frontend errors

4. Verify that the wallet address is correctly passed from frontend to backend

5. If using a local blockchain like Hardhat or Ganache, ensure it's running and accessible
