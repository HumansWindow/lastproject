# User Registration System Prompt

Create a MongoDB-based registration system with these features:

## Schema Requirements
- Create a main registration schema that tracks wallet connections with fields for:
  - Wallet address (ETH, TON, etc.)
  - Wallet type (MetaMask, Phantom, Trust Wallet, TON Keeper)
  - Device tracking information
  - Session history
  - Visit counts and timestamps
  - Wallet change history
  - Minting history

## Device Management
- Track multiple devices per user
- Store hardware IDs, device types, user agents
- Monitor first seen and last seen timestamps
- Track device-specific mint history
- Limit devices per wallet (max 3)

## Session Tracking
- Record session start/end times and duration
- Track first visit to wallet connection time
- Calculate average session duration
- Monitor total online time
- Handle concurrent session limits

## Security Features
- Rate limit registrations per IP address
- Prevent device sharing across multiple wallets
- Allow limited wallet address changes
- Implement wallet change cooldown periods
- Verify device ownership

## User Activity Metrics
- Track first time vs returning visitors
- Record wallet connection times
- Calculate engagement metrics
- Monitor mint activity by device and user

## Implementation Notes
- Use error handling classes (WalletError, SessionError, etc.)
- Implement proper indexing for performance
- Add verification methods for security checks
- Set up rate limiting and fraud prevention
