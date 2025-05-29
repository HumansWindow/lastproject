# Wallet-Based Authentication System

This document details the wallet-based authentication system implemented in the LastProject application. Wallet authentication leverages blockchain technology to provide a secure and passwordless authentication method.

## Table of Contents

1. [Introduction](#introduction)
2. [Technical Implementation](#technical-implementation)
3. [Authentication Flow](#authentication-flow)
4. [Security Features](#security-features)
5. [Integration with Traditional Authentication](#integration-with-traditional-authentication)
6. [Troubleshooting](#troubleshooting)

## Introduction

Wallet-based authentication is a modern approach to user authentication that leverages cryptographic signatures from blockchain wallets. Instead of relying on passwords, which can be compromised, wallet authentication uses asymmetric cryptography to verify a user's identity through digital signatures.

### Benefits

1. **Enhanced Security**: Eliminates password-related vulnerabilities
2. **Reduced Friction**: No need for users to remember passwords
3. **Cross-Platform**: Works across different devices and platforms
4. **Phishing Resistant**: Signatures are context-specific and non-transferable
5. **Self-Sovereign Identity**: Users control their own authentication credentials

## Technical Implementation

The wallet authentication system is implemented using the following technologies:

1. **ethers.js**: For cryptographic signature verification
2. **JWT**: For token-based session management
3. **Challenge-Response Pattern**: To prevent replay attacks

### Key Components

1. `WalletAuthController`: Handles wallet connection requests and authentication
2. `WalletLoginDto`: Data transfer object for wallet login requests
3. `WalletStrategy`: Custom Passport.js strategy for wallet authentication
4. `TokenService`: Manages JWT token generation and validation
5. `DeviceDetectorService`: Creates and manages device fingerprints
6. `UserDevicesService`: Associates devices with user accounts and wallets

## Authentication Flow

The wallet authentication flow consists of the following steps:

### 1. Connection Request

```
Client                                 Server
  │                                      │
  │  Request Connection (Wallet Address) │
  │─────────────────────────────────────▶│
  │                                      │
  │                                      │── Generate Challenge
  │                                      │
  │      Challenge Response              │
  │◀─────────────────────────────────────│
  │                                      │
```

- User provides their wallet address to initiate the connection
- Server generates a unique challenge for the wallet address
- Server caches the challenge for 1 hour
- Server returns the challenge to the client

### 2. Challenge Signing

```
Client                                 Server
  │                                      │
  │── Request Signature from Wallet      │
  │                                      │
  │  Authenticate (Address, Signature)   │
  │─────────────────────────────────────▶│
  │                                      │
  │                                      │── Verify Signature
  │                                      │── Create User (if new)
  │                                      │── Generate JWT Tokens
  │                                      │
  │      Authentication Response         │
  │◀─────────────────────────────────────│
  │                                      │
```

- Client requests the user to sign the challenge with their wallet
- User signs the challenge, generating a cryptographic signature
- Client sends the wallet address, signed challenge, and signature to the server
- Server verifies the signature against the original challenge
- Server creates a user account if this is a new user
- Server generates and returns JWT tokens for the authenticated session

### 3. Recovery Flow (Optional)

If wallet signing fails (which can happen with certain wallets or browser extensions), a recovery flow is available:

```
Client                                 Server
  │                                      │
  │  Request Recovery (Wallet Address)   │
  │─────────────────────────────────────▶│
  │                                      │
  │                                      │── Generate Recovery Token
  │                                      │
  │      Recovery Token                  │
  │◀─────────────────────────────────────│
  │                                      │
  │  Authenticate with Recovery Token    │
  │─────────────────────────────────────▶│
  │                                      │
  │                                      │── Verify Token
  │                                      │── Generate JWT Tokens
  │                                      │
  │      Authentication Response         │
  │◀─────────────────────────────────────│
  │                                      │
```

- Client requests a recovery token for the wallet address
- Server generates and returns a time-limited recovery token
- Client uses the recovery token to authenticate
- Server verifies the token and proceeds with authentication

## Security Features

The wallet authentication system implements several security features:

### 1. Device-Wallet Binding

- Each device is bound to a specific wallet address
- Prevents unauthorized access from new/unknown devices
- Enhances security by requiring both device and wallet for authentication

Example from code:
```typescript
// Check if this device is registered with a different wallet
const isDeviceWalletPaired = await this.userDevicesService.validateDeviceWalletPairing(
  deviceId, 
  normalizedAddress
);

if (!isDeviceWalletPaired) {
  throw new ForbiddenException(
    'This device is already associated with a different wallet. For security reasons, each device can only be used with one wallet.'
  );
}
```

### 2. Challenge Expiration

- Challenges expire after 1 hour
- Prevents replay attacks where an old challenge/signature pair is reused
- Cached challenges are periodically cleaned up to prevent memory issues

### 3. Rate Limiting

- Authentication attempts are rate-limited
- Prevents brute-force or denial-of-service attacks
- Implemented using NestJS throttling

### 4. Recovery Token Security

- Recovery tokens expire after 15 minutes
- Single-use tokens that are invalidated after use
- Provides a secure fallback when wallet signing fails

## Integration with Traditional Authentication

The wallet authentication system is designed to coexist with traditional authentication methods:

1. **Migration Path**: Users can link their wallet to existing email/password accounts
2. **Graceful Degradation**: System can fall back to traditional auth if wallet auth fails
3. **Dual Authentication**: Can require both wallet signature and password for sensitive operations

## Troubleshooting

Common issues and their solutions:

### Failed Signature Verification

- **Issue**: Signature verification fails even though the user signed the correct message
- **Solution**: Ensure the message format is exactly the same on client and server side, including all whitespace and line breaks

### Device Registration Issues

- **Issue**: User cannot authenticate from a new device
- **Solution**: Implement a device authorization flow where an existing device can authorize a new one

### Recovery Token Expiration

- **Issue**: Recovery token expires before user completes authentication
- **Solution**: Increase recovery token lifetime or implement auto-renewal
