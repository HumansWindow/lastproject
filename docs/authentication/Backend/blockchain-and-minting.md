# SHAHI Blockchain and Minting System

This document provides a comprehensive overview of the SHAHI token blockchain implementation and minting system used in the LastProject application.

## Table of Contents

1. [Introduction](#introduction)
2. [SHAHI Token Overview](#shahi-token-overview)
3. [Smart Contract Architecture](#smart-contract-architecture)
4. [Minting System](#minting-system)
5. [Backend Integration](#backend-integration)
6. [Security Considerations](#security-considerations)
7. [Tokenomics](#tokenomics)

## Introduction

The SHAHI token is an ERC-20 compatible token built on the Polygon blockchain. It serves as the primary utility token within the LastProject ecosystem, powering various features including rewards, staking, and governance.

The minting system is designed to incentivize user engagement while ensuring fair distribution and preventing abuse through sophisticated security measures.

## SHAHI Token Overview

**Token Details**:
- **Name**: SHAHI Coin
- **Symbol**: SHAHI
- **Decimals**: 18
- **Network**: Polygon (Mumbai Testnet for development)
- **Contract Type**: Upgradeable (UUPS Proxy pattern)

**Key Features**:
- Website-based minting for user rewards
- Staking system with tiered APY rates
- Security features to prevent abuse
- Admin minting for ecosystem development

## Smart Contract Architecture

The SHAHI token implementation follows a modular architecture with several key components:

### Core Contracts

1. **SHAHICoinV1**: The main ERC-20 token implementation with minting and staking logic
2. **SHAHIStorage**: Storage contract that follows the proxy pattern for upgradeability

### Design Patterns

1. **UUPS Proxy Pattern**: Allows for future upgrades while preserving token state
2. **ReentrancyGuard**: Prevents reentrancy attacks in critical functions
3. **Pausable**: Allows emergency pause of contract operations if needed
4. **Ownable**: Restricts administrative functions to contract owner

### Key Smart Contract Features

```solidity
contract SHAHICoinV1 is 
    Initializable, 
    ERC20Upgradeable, 
    PausableUpgradeable,
    OwnableUpgradeable,
    ReentrancyGuardUpgradeable,
    UUPSUpgradeable,
    SHAHIStorage
{
    using ECDSA for bytes32;
    
    // Constants for gas optimization
    uint256 private constant DECIMALS_FACTOR = 10**18;
    uint256 private constant ONE_SHAHI = 10**18;
    uint256 private constant ADMIN_INITIAL_MINT = 110 * 10**18;
    uint256 private constant HALF_SHAHI = 5 * 10**17; // 0.5 SHAHI
    uint256 private constant SECONDS_PER_YEAR = 365 days;
    
    // Additional implementation...
}
```

## Minting System

The SHAHI token implements a unique minting system designed to reward users while preventing abuse. The system includes two primary minting mechanisms:

### 1. First-Time Minting

First-time minting allows new users to receive SHAHI tokens when they first join the platform:

- **Admin First Visit**: 110 SHAHI tokens (reserved for contract owner)
- **Regular Users**: 1 SHAHI token (split between user wallet and platform wallet)
- **Verification**: Requires Merkle proof to verify eligibility
- **Device Binding**: Each device can only claim first-time mint once

Implementation:
```solidity
function firstTimeMint(address user, bytes32[] calldata proof, string calldata deviceId) external whenNotPaused nonReentrant {
    require(user != address(0), "Invalid address");
    require(!isBlacklisted(user), "User is blacklisted");
    
    // Cache storage variables to minimize SLOADs
    UserMintRecord storage mintRecord = userMintRecords[user];
    require(!mintRecord.hasFirstMinted, "Already claimed first mint");
    require(_verifyMerkle(user, proof), "Invalid proof");
    
    // Create unique device identifier and verify not used
    // Mint tokens and record the mint
}
```

### 2. Annual Minting

Annual minting allows users to claim additional tokens once per year:

- **Regular Users**: 0.5 SHAHI tokens annually
- **Verification**: Requires server-signed message to verify eligibility
- **Time Restriction**: Can only be claimed once per year per wallet
- **Device Binding**: Must use same device as authentication

Implementation:
```solidity
function annualMint(address user, bytes calldata signature, string calldata deviceId) external whenNotPaused nonReentrant {
    require(user != address(0), "Invalid address");
    require(!isBlacklisted(user), "User is blacklisted");
    
    // Verify the server signature
    // Check time since last annual mint
    // Mint tokens and update records
}
```

### 3. Admin Minting

Admin minting allows the contract owner to mint additional tokens for ecosystem development:

- **Owner Only**: Restricted to contract owner
- **Limited Supply**: Respects maximum supply limits
- **Transparency**: Emits events for all admin minting operations

## Backend Integration

The backend system integrates with the blockchain through several key services:

### 1. MintingService

Manages the minting process from backend to blockchain:
- Validates user eligibility for minting
- Generates Merkle proofs for first-time mints
- Signs messages for annual mints
- Queues minting transactions
- Tracks minting status and history

### 2. ShahiTokenService

Handles direct interaction with the SHAHI token contract:
- Initializes blockchain connection
- Manages hot wallet for contract interactions
- Executes minting transactions
- Monitors transaction status
- Handles transaction failures and retries

### 3. MintingController

Provides API endpoints for minting operations:
- First-time minting endpoint
- Annual minting endpoint
- Minting status checking
- Security and rate limiting

Implementation:
```typescript
@Post('first-time')
@UseGuards(MintRateLimitGuard)
async firstTimeMint(
  @Req() req: any,
  @Headers('user-agent') userAgent: string,
  @RealIP() ip: string,
) {
  const walletAddress = req.user.walletAddress;
  const deviceId = /* get device ID */;
  
  // Validate device-wallet pairing
  const isValidDeviceWalletPair = await this.userDevicesService.validateDeviceWalletPairing(
    deviceId,
    walletAddress
  );
  
  if (!isValidDeviceWalletPair) {
    throw new ForbiddenException(
      'This device is not paired with the provided wallet address.'
    );
  }
  
  // Process the mint request
  const txHash = await this.mintingService.processFirstTimeMint(
    walletAddress,
    userAgent,
    ip,
    deviceId
  );
  
  return { txHash };
}
```

## Security Considerations

The SHAHI minting system implements several security measures:

### 1. Sybil Attack Prevention

- Device fingerprinting to prevent multiple accounts
- Device-wallet binding to prevent wallet sharing
- IP address tracking to detect suspicious patterns

### 2. Transaction Security

- Merkle proofs for eligibility verification
- Server-signed messages for annual minting
- Rate limiting to prevent abuse

### 3. Smart Contract Security

- Reentrancy protection
- Pausable functionality for emergencies
- Function access controls
- Blacklisting capability for abusive addresses

## Tokenomics

The SHAHI token implements a carefully designed tokenomics model:

### 1. Supply Management

- **Initial Supply**: Defined at contract deployment
- **Maximum Supply**: Hard cap on total token supply
- **Inflation Rate**: Controlled through minting schedules

### 2. Token Utility

- **Staking**: Users can stake tokens for APY rewards
- **Governance**: Token holders can participate in platform governance
- **Rewards**: Tokens used as rewards for platform activities

### 3. Staking System

The SHAHI token includes a built-in staking system with tiered APY rates:

- **One Year**: 20% APY
- **Six Month**: 15% APY
- **Three Month**: 10% APY
- **Default**: 5% APY

Implementation:
```solidity
struct APYRates {
    uint16 oneYearAPY;    // 2000 = 20%
    uint16 sixMonthAPY;   // 1500 = 15%
    uint16 threeMonthAPY; // 1000 = 10%
    uint16 defaultAPY;    // 500 = 5%
}
```

Token holders can stake their tokens for different lock periods to earn these APY rewards.
