# Airdrop and Referral System Prompt

Create a blockchain-based token airdrop and referral system with these capabilities:

## Core Functionality
- Generate unique referral codes for users
- Process and validate referrals between users
- Calculate and distribute rewards based on referrals
- Support token claiming for different reward types
- Implement anti-fraud measures

## Schema Requirements
- Create an airdrop schema with:
  - Wallet address tracking
  - Referral code generation
  - Referral history with validation status
  - Reward balance and claiming history
  - KHORDE token balance tracking
  - Referral milestones and tiers

## Referral System Features
- Validate referrals using wallet address and ownership checks
- Calculate fraud scores for referral attempts
- Process valid referrals and update both referrer and referred users
- Track referral counts and referral relationships
- Monitor suspicious referral activity

## Reward System
- Calculate tiered rewards based on referral counts
- Support reward claiming with daily/period limits
- Convert rewards to KHORDE tokens
- Track claimed vs available rewards
- Support YOU-ME token rewards claiming

## Security Measures
- Check for KHORDE token ownership
- Validate wallet age requirements
- Detect reward gaming patterns
- Implement rate limiting for claims
- Block suspicious activity patterns

## Caching and Performance
- Use Redis for caching stats and rewards
- Implement TTL for cached data
- Clear cache on data updates
- Use aggregation for efficient calculations

## Implementation Notes
- Use the RewardService for calculations
- Implement MonitoringService for tracking
- Handle rate limiting through Redis
- Provide detailed error messages for debugging
