# SHAHI Coin Smart Contract Documentation

## Overview
`SHAHICoinV1.sol` is an upgradeable ERC20 token contract that implements the SHAHI cryptocurrency with specific minting rules, price feed integrations, and conversion utilities.

## Contract Structure
The contract inherits from several OpenZeppelin upgradeable base contracts and custom storage contracts:
- **Initializable**: Manages initialization process for upgradeable contracts
- **ERC20Upgradeable**: Core ERC20 token functionality
- **OwnableUpgradeable**: Access control for admin functions
- **PausableUpgradeable**: Circuit breaker pattern for emergency stops
- **ReentrancyGuardUpgradeable**: Protection against reentrant calls
- **UUPSUpgradeable**: Upgradeable proxy pattern implementation
- **SHAHIStorage**: Custom storage contract holding shared variables and constants

## Key Features
1. **Token Minting System**:
   - First-time minting provides 110 SHAHI tokens
   - Regular minting provides 1 SHAHI token
   - Cryptographic proof verification for minting authorization
   - 90-day cooldown between minting operations

2. **Price Oracle Integration**:
   - Integration with KHORDE price feed for token valuation
   - Support for MATIC and ETH price oracles
   - Functions to query token prices in USD

3. **Unit Conversion**:
   - Conversion between KHORDE, SHAHI, and ZARI denominations
   - YOU-ME token conversion utilities with fixed USD price of $1.10

4. **Security Features**:
   - Signature verification for minting operations
   - Pausable functionality for emergency stops
   - Reentrancy protection
   - Owner-only administrative functions

## Related Files

### SHAHIStorage.sol
- Base contract that stores shared constants and variables
- Defines token denominational units (KHORDE, SHAHI, ZARI)
- Maintains storage for hot wallet and price feed references
- Defines decimal constants for the token

### KHORDEPriceFeed.sol
- Oracle contract providing price data for KHORDE
- Implements the IPriceOracle interface for getPrice() functionality
- Used to determine conversion rates between token denominations and USD

### Proxy Implementation
The contract is designed to be deployed behind an upgradeable proxy using the UUPS pattern:
- Initialization instead of constructor
- _authorizeUpgrade function for controlling upgrades
- Storage considerations for upgradeable contracts

## Usage Examples
1. **Token Minting**:
```solidity
// Owner signs the proof off-chain
bytes32 proof = keccak256(abi.encodePacked(userAddress, blockNumber));
bytes memory signature = signMessage(proof, ownerPrivateKey);

// User calls the mint function with the proof and signature
shahinCoin.mintTokens(recipient, proof, signature);
```

2. **Price Queries**:
```solidity
// Get KHORDE price in USD
uint256 khordePrice = shahinCoin.getKhordePriceInUSD();

// Convert SHAHI to KHORDE
uint256 khordeAmount = shahinCoin.shahiToKhorde(shahiAmount);
```

3. **Admin Functions**:
```solidity
// Update price feed
shahinCoin.updatePriceFeed(newPriceFeedAddress);

// Pause contract in emergency
shahinCoin.pause();
```

## Deployment Considerations
- Requires initialization with owner address, hot wallet, and price feed
- Should be deployed behind an ERC1967 or similar proxy
- Requires properly configured price oracles for full functionality

## Upgrade Path
Future versions (SHAHICoinV2, etc.) can be implemented and then set as the implementation through the UUPS upgrade mechanism.
