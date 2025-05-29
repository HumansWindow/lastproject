# Authentication System Overview

This document provides a comprehensive overview of the authentication system implemented in the LastProject application. The authentication system combines traditional email/password authentication with modern blockchain wallet-based authentication for enhanced security.

## Table of Contents

1. [Authentication Methods](#authentication-methods)
2. [Authentication Flow](#authentication-flow)
3. [JWT Token System](#jwt-token-system)
4. [Session Security](#session-security)
5. [Device Management](#device-management)
6. [Wallet Authentication](#wallet-authentication)
7. [Security Considerations](#security-considerations)

## Authentication Methods

The project supports multiple authentication methods:

1. **Email/Password Authentication**: Traditional authentication method using email and password credentials.
2. **Wallet Authentication**: Modern method using blockchain wallet signatures for authentication.
3. **Token-based Authentication**: JWT tokens for maintaining authenticated sessions.

Email/Password authentication is being deprecated in favor of the more secure wallet-based authentication, which is now the recommended method.

## Authentication Flow

### Email/Password Authentication Flow

1. User submits email and password credentials
2. Server validates credentials against stored hashed passwords
3. If valid, server issues JWT access and refresh tokens
4. User's session and device information are recorded
5. Subsequent requests use JWT tokens for authorization

### Wallet Authentication Flow

1. User requests connection by providing wallet address
2. Server generates a unique challenge for the wallet address
3. Frontend requests user to sign the challenge using their wallet
4. Signed challenge is sent to the server for verification
5. Server verifies the signature against the wallet address
6. If valid, server issues JWT access and refresh tokens
7. User's wallet, session, and device information are recorded
8. Subsequent requests use JWT tokens for authorization

## JWT Token System

The authentication system uses a dual-token approach:

1. **Access Token**: Short-lived token for API access (typically 15-60 minutes)
2. **Refresh Token**: Longer-lived token used to obtain new access tokens (typically 7-30 days)

Key features:
- Tokens contain user identity and permission information
- Tokens are cryptographically signed to prevent tampering
- Tokens can be revoked for security reasons
- Device and session information are embedded in tokens

## Session Security

The system implements robust session security features:

1. **Session Tracking**: All active sessions are tracked in the database
2. **Concurrent Session Management**: Controls how many active sessions a user can have
3. **Device Binding**: Sessions are bound to specific devices for security
4. **IP Address Monitoring**: Suspicious IP address changes trigger security alerts
5. **Session Revocation**: Administrators can forcefully revoke user sessions

## Device Management

The authentication system includes device management capabilities:

1. **Device Fingerprinting**: Each device is assigned a unique identifier
2. **Device Registration**: Devices are registered and associated with users
3. **Device Tracking**: All user devices are tracked in the database
4. **Device Limitations**: Users are limited to a specific number of devices
5. **Device Verification**: New devices require verification for security

## Wallet Authentication

Wallet authentication is the preferred method for its enhanced security:

1. **Challenge-Response System**: Prevents replay attacks
2. **Device-Wallet Binding**: Each device is bound to a specific wallet for security
3. **Recovery Mechanism**: Fallback authentication when wallet signing fails
4. **Signature Verification**: Uses cryptographic verification of wallet signatures
5. **Rate Limiting**: Prevents brute-force attacks

Implementation details:
- Uses ethers.js for signature verification
- Challenge expires after 1 hour
- Recovery tokens expire after 15 minutes
- Device-wallet binding prevents unauthorized access from new devices

## Security Considerations

The authentication system implements various security measures:

1. **Password Security**:
   - Passwords are hashed using bcrypt
   - Password strength requirements are enforced
   - Password reset functionality with secure tokens

2. **Token Security**:
   - Short-lived access tokens minimize risk
   - Token refresh with rotating refresh tokens
   - Refresh token reuse detection

3. **Rate Limiting**:
   - Prevents brute force attacks
   - Limits authentication attempts

4. **Session Security**:
   - Sessions can be remotely terminated
   - Suspicious activity monitoring
   - Automatic session expiration

5. **Wallet Security**:
   - Challenge-based authentication
   - Signature verification
   - Device-wallet binding
