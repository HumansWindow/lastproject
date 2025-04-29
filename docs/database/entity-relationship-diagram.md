# Alive-Db Entity-Relationship Diagram

## Overview

This document describes the entity relationships in the Alive-Db database. While this document contains textual descriptions, you can generate a visual ERD using tools like pgAdmin, DBeaver, or dedicated ERD tools.

## Core Entities and Relationships

### User Management System

```
users
├── 1:1 ──> profiles
├── 1:N ──> wallets
├── 1:N ──> user_sessions
├── 1:N ──> user_devices
├── 1:N ──> refresh_tokens
└── 1:N ──> diaries (inferred)
```

**Description**:
- Each user has exactly one profile
- Each user can have multiple wallets
- Each user can have multiple sessions
- Each user can have multiple devices
- Each user can have multiple refresh tokens
- Each user can have multiple diary entries (inferred from the structure)

### Wallet System

```
wallets
├── N:1 ──> users
└── 1:N ──> user_sessions (optional)

wallet_challenges
└── (independent, referenced by wallet address)

wallet_nonces
└── (independent, referenced by wallet address)
```

**Description**:
- Each wallet belongs to exactly one user
- Sessions can optionally reference a specific wallet
- Wallet challenges and nonces are standalone tables keyed by wallet address

### NFT System

```
nft_collections
└── 1:N ──> nfts

minting_queue_items
└── (references user_id and wallet_address, but no direct FK)
```

**Description**:
- Each NFT collection can contain multiple NFTs
- Minting queue items track NFT minting operations

### Referral System

```
referral_codes
└── 1:N ──> referrals

users
└── (referenced by referral system but no direct FK)
```

**Description**:
- Each referral code can be used for multiple referrals
- Users are referenced in the referral system but no direct FK constraints

## Data Flow Diagram

### Authentication Flow

```
1. User signs up ──> users record created
2. Profile created ──> profiles record created
3. User connects wallet ──> wallets record created
4. Authentication challenge ──> wallet_challenges record created
5. User signs challenge ──> user_sessions record created
6. Refresh token issued ──> refresh_tokens record created
7. User logs in from new device ──> user_devices record created
```

### NFT Minting Flow

```
1. User requests NFT mint ──> minting_queue_items record created
2. Minting process completes ──> nfts record created
3. NFT assigned to collection ──> nft linked to nft_collections
```

## Entity Identifier Relationships

Here's a mapping of how entity identifiers are used across tables:

| Table | Primary Key | References |
|-------|-------------|------------|
| users | id (UUID) | Referenced by profiles, wallets, sessions, devices, tokens |
| profiles | id (UUID) | References users.id |
| wallets | id (UUID) | References users.id |
| user_sessions | id (UUID) | References users.id, wallets.id |
| user_devices | id (UUID) | References users.id |
| refresh_tokens | id (UUID) | References users.id |
| nft_collections | id (integer) | Referenced by nfts |
| nfts | id (integer) | References nft_collections.id |
| referral_codes | id (integer) | Referenced by referrals |
| referrals | id (integer) | References referral_codes.id |
| wallet_challenges | id (UUID) | No direct foreign keys |
| wallet_nonces | id (UUID) | No direct foreign keys |
| diaries | id (UUID) | References user_id (integer) |
| minting_queue_items | id (UUID) | References user_id (integer) |

## Physical Data Model

The physical data model of Alive-Db has several characteristics:

1. **Mixed ID Types**: The database uses both UUIDs and auto-incrementing integers as primary keys.

2. **Multiple Foreign Key Relationship Styles**:
   - ON DELETE CASCADE: Many relationships will delete child records when parent records are deleted
   - No action specified: Some relationships have no specific deletion behavior

3. **Indexing Strategy**:
   - Primary key indexes on all tables
   - Foreign key indexes for relationship columns
   - Special indexes for case-insensitive searches on wallet addresses
   - Performance indexes for frequently queried fields

4. **Triggers**:
   - Several tables have triggers to maintain data consistency
   - ID field synchronization for legacy fields

This document provides a high-level view of the entity relationships. For detailed field information, refer to the schema documentation.