# Alive-Db Database Schema Documentation

## Overview

Alive-Db is a PostgreSQL database that supports a blockchain/NFT application with user authentication, wallet management, NFT collections, and a referral system. The database consists of 16 tables organized into several functional groups.

## Table Groups

### 1. User Management
- `users` - Core user account information
- `profiles` - Extended user profile data
- `user_devices` - User device tracking
- `user_sessions` - User login sessions

### 2. Wallet System
- `wallets` - User cryptocurrency wallets
- `wallet_challenges` - Authentication challenges for wallet verification
- `wallet_nonces` - Nonce values for secure wallet transactions

### 3. Authentication
- `refresh_tokens` - JWT refresh tokens for authentication
- `refresh_tokens_backup` - Backup of authentication tokens

### 4. NFT System
- `nfts` - Individual NFT records
- `nft_collections` - Collections containing multiple NFTs
- `minting_queue_items` - Queue for NFT minting operations

### 5. Referral System
- `referral_codes` - Codes used for referrals
- `referrals` - Tracking of referral relationships

### 6. Content
- `diaries` - User diary/journal entries

### 7. System
- `migrations` - Database migration history

## Detailed Table Schemas

### Users Table (`users`)

**Description**: Core table storing user account information.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | uuid | no | uuid_generate_v4() | Primary key |
| username | character varying | yes | | User's login name |
| email | character varying | yes | | User's email address |
| password | character varying | yes | | Hashed password |
| first_name | character varying | yes | | User's first name |
| last_name | character varying | yes | | User's last name |
| avatar_url | character varying | yes | | URL to user's avatar image |
| isActive | boolean | yes | true | Flag for active accounts |
| isVerified | boolean | yes | false | Flag for verified accounts |
| isAdmin | boolean | yes | false | Flag for admin privileges |
| role | character varying | yes | 'user' | User role (user, admin, etc.) |
| walletAddress | character varying | yes | | Cryptocurrency wallet address |
| referralCode | character varying | yes | | User's referral code |
| referredById | uuid | yes | | ID of user who referred this user |
| referralTier | integer | yes | 0 | Referral tier level |
| createdAt | timestamp with time zone | yes | now() | Record creation timestamp |
| updatedAt | timestamp with time zone | yes | now() | Record update timestamp |
| userId | uuid | yes | uuid_generate_v4() | Duplicate ID field |
| referrer_id | uuid | yes | | ID of referrer (duplicate field) |
| user_id | uuid | yes | | Duplicate user ID |
| verification_token | character varying(255) | yes | | Email verification token |
| reset_password_token | character varying(255) | yes | | Password reset token |
| reset_password_expires | timestamp without time zone | yes | | Password reset token expiry |
| last_login_at | timestamp without time zone | yes | | Last login timestamp |
| last_login_ip | character varying(255) | yes | | IP of last login |
| created_at | timestamp with time zone | yes | CURRENT_TIMESTAMP | Alternative creation timestamp |
| updated_at | timestamp with time zone | yes | CURRENT_TIMESTAMP | Alternative update timestamp |
| last_mint_date | timestamp with time zone | yes | | Date when user last minted tokens |
| token_expiry_date | timestamp with time zone | yes | | Token expiry date |
| minted_amount | numeric(20,8) | yes | 0 | Amount of tokens minted by user |
| has_expired_tokens | boolean | yes | false | Flag for expired tokens |

**Indexes**:
- `users_pkey` PRIMARY KEY (id)
- `idx_user_wallet_address` btree (walletAddress)
- `idx_users_wallet_address` btree (lower(walletAddress))
- `users_user_id_key` UNIQUE (userId)

### Profiles Table (`profiles`)

**Description**: Extended user profile information.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | uuid | no | uuid_generate_v4() | Primary key |
| user_id | uuid | no | | Foreign key to users table |
| email | character varying | yes | | Email address (duplicate from users) |
| password | character varying | yes | | Password (duplicate from users) |
| first_name | character varying | yes | | First name (duplicate from users) |
| last_name | character varying | yes | | Last name (duplicate from users) |
| display_name | character varying | yes | | User's display name |
| avatar_url | character varying | yes | | URL to avatar (duplicate from users) |
| bio | text | yes | | User biography |
| unique_id | character varying | yes | | Unique identifier |
| visibility_level | character varying | yes | 'public' | Profile visibility setting |
| created_at | timestamp with time zone | yes | now() | Creation timestamp |
| updated_at | timestamp with time zone | yes | now() | Update timestamp |
| country | character varying | yes | | User's country |
| city | character varying | yes | | User's city |
| state | character varying | yes | | User's state/province |
| postal_code | character varying | yes | | User's postal code |
| address | character varying | yes | | User's address |
| latitude | numeric(10,8) | yes | | Location latitude |
| longitude | numeric(11,8) | yes | | Location longitude |
| language | character varying | yes | 'en' | User's preferred language |
| timezone | character varying | yes | | User's timezone |
| date_format | character varying | yes | 'yyyy-MM-dd' | Preferred date format |
| time_format | character varying | yes | '24h' | Preferred time format |
| phone_number | character varying | yes | | User's phone number |
| website | character varying | yes | | User's website |
| twitter_handle | character varying | yes | | Twitter username |
| instagram_handle | character varying | yes | | Instagram username |
| linkedin_profile | character varying | yes | | LinkedIn profile URL |
| telegram_handle | character varying | yes | | Telegram username |
| location_visibility | character varying | yes | 'PRIVATE' | Location privacy setting |
| profile_visibility | character varying | yes | 'PUBLIC' | Profile privacy setting |
| email_notifications | boolean | yes | true | Email notification preference |
| push_notifications | boolean | yes | true | Push notification preference |
| last_location_update | timestamp without time zone | yes | | Last location update timestamp |
| complete_later | boolean | yes | false | Profile completion deferred flag |

**Indexes**:
- `profiles_pkey` PRIMARY KEY (id)
- `idx_profile_email` btree (email)
- `idx_profile_unique_id` btree (unique_id)
- `idx_profile_user_id` btree (user_id)
- `profiles_unique_id_key` UNIQUE (unique_id)

**Foreign Keys**:
- `profiles_user_id_fkey` FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE

**Triggers**:
- `ensure_profile_id_fields` - Maintains consistency of profile ID fields

### Wallets Table (`wallets`)

**Description**: Cryptocurrency wallets associated with users.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | uuid | no | uuid_generate_v4() | Primary key |
| address | character varying | no | | Wallet address |
| privateKey | character varying | yes | | Encrypted private key |
| chain | character varying | yes | 'ETH' | Blockchain type (e.g., Ethereum) |
| user_id | uuid | no | | Foreign key to users table |
| isActive | boolean | yes | true | Active wallet flag |
| createdAt | timestamp with time zone | yes | now() | Creation timestamp |
| updatedAt | timestamp with time zone | yes | now() | Update timestamp |
| created_at | timestamp with time zone | yes | CURRENT_TIMESTAMP | Alternative creation timestamp |
| updated_at | timestamp with time zone | yes | CURRENT_TIMESTAMP | Alternative update timestamp |

**Indexes**:
- `wallets_pkey` PRIMARY KEY (id)
- `idx_wallet_address` btree (address)
- `idx_wallet_address_chain` btree (address, chain)
- `idx_wallet_address_lower` btree (lower(address))
- `idx_wallet_user_id` btree (user_id)
- `idx_wallets_address` btree (lower(address))
- `uq_wallet_address` UNIQUE (address)

**Foreign Keys**:
- `fk_wallets_users` FOREIGN KEY (user_id) REFERENCES users(id)
- `wallets_user_id_fkey` FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE

### NFT Collections Table (`nft_collections`)

**Description**: Collections containing multiple NFTs.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | integer | no | nextval('nft_collections_id_seq') | Primary key |
| name | character varying(255) | yes | | Collection name |
| symbol | character varying(50) | yes | | Collection symbol |
| contract_address | character varying(255) | yes | | Smart contract address |
| chain_id | integer | yes | | Blockchain network ID |
| description | text | yes | | Collection description |
| created_at | timestamp without time zone | yes | CURRENT_TIMESTAMP | Creation timestamp |
| updated_at | timestamp without time zone | yes | CURRENT_TIMESTAMP | Update timestamp |

**Indexes**:
- `nft_collections_pkey` PRIMARY KEY (id)

### NFTs Table (`nfts`)

**Description**: Individual NFT records.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | integer | no | nextval('nfts_id_seq') | Primary key |
| collection_id | integer | yes | | Foreign key to nft_collections |
| token_id | character varying(100) | yes | | Token ID within collection |
| owner_id | integer | yes | | ID of owner |
| metadata | jsonb | yes | | NFT metadata |
| transaction_hash | character varying(255) | yes | | Blockchain transaction hash |
| created_at | timestamp without time zone | yes | CURRENT_TIMESTAMP | Creation timestamp |
| updated_at | timestamp without time zone | yes | CURRENT_TIMESTAMP | Update timestamp |

**Indexes**:
- `nfts_pkey` PRIMARY KEY (id)
- `nfts_collection_id_token_id_key` UNIQUE (collection_id, token_id)

**Foreign Keys**:
- `nfts_collection_id_fkey` FOREIGN KEY (collection_id) REFERENCES nft_collections(id)

### User Sessions Table (`user_sessions`)

**Description**: User login sessions.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | uuid | no | uuid_generate_v4() | Primary key |
| userId | uuid | yes | | User ID (camelCase) |
| deviceId | character varying(255) | yes | | Device ID (camelCase) |
| walletId | uuid | yes | | Wallet ID reference |
| token | character varying(500) | yes | | Session token |
| ipAddress | character varying(100) | yes | | IP address (camelCase) |
| userAgent | text | yes | | User agent (camelCase) |
| expiresAt | timestamp with time zone | yes | | Session expiry (camelCase) |
| isActive | boolean | yes | true | Active session flag |
| endedAt | timestamp with time zone | yes | | Session end timestamp |
| createdAt | timestamp with time zone | yes | now() | Creation timestamp |
| user_agent | text | yes | | User agent (snake_case) |
| device_id | text | yes | | Device ID (snake_case) |
| ip_address | text | yes | | IP address (snake_case) |
| expires_at | timestamp with time zone | yes | | Session expiry (snake_case) |
| isactive | boolean | yes | true | Active flag (lowercase) |
| is_active | boolean | yes | true | Active flag (snake_case) |
| endedat | timestamp with time zone | yes | | Session end (lowercase) |
| duration | integer | yes | | Session duration in seconds |
| user_id | uuid | yes | | User ID (snake_case) |
| created_at | timestamp without time zone | yes | CURRENT_TIMESTAMP | Creation timestamp |

**Indexes**:
- `user_sessions_pkey` PRIMARY KEY (id)
- `idx_user_session_user_id` btree (userId)
- `idx_user_sessions_device_id` btree (device_id)
- `idx_user_sessions_token` btree (token)
- `idx_user_sessions_user_id` btree (user_id)

**Foreign Keys**:
- `fk_user_sessions_user_id` FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
- `user_sessions_user_id_fkey` FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
- `user_sessions_wallet_id_fkey` FOREIGN KEY (walletId) REFERENCES wallets(id) ON DELETE SET NULL

**Triggers**:
- `sync_user_id_trigger` - Synchronizes user ID fields

### Additional Tables

For brevity, I've documented the main tables above. The remaining tables follow similar patterns and include:

- `diaries` - User journal entries
- `refresh_tokens` - Authentication refresh tokens
- `refresh_tokens_backup` - Backup of authentication tokens
- `user_devices` - User device tracking
- `wallet_challenges` - Wallet verification challenges
- `wallet_nonces` - Nonces for secure wallet transactions
- `referral_codes` - Referral codes for user acquisition
- `referrals` - Tracking of referral relationships
- `migrations` - Database migration history
- `minting_queue_items` - Queue for processing NFT minting

## Relationships

The database has several relationships between tables:

1. Users to Profiles: One-to-One relationship (user_id in profiles)
2. Users to Wallets: One-to-Many relationship (user_id in wallets)
3. Users to Sessions: One-to-Many relationship (user_id in user_sessions)
4. Users to Devices: One-to-Many relationship (user_id in user_devices)
5. Collections to NFTs: One-to-Many relationship (collection_id in nfts)
6. Referral Codes to Referrals: One-to-Many relationship (referral_code_id in referrals)
7. Users to Tokens: One-to-Many relationship (user_id in refresh_tokens)

## Indexes

The database uses various indexes to optimize queries:

1. Primary key indexes on all tables
2. Foreign key indexes for relationship columns
3. Specialized indexes for frequently queried columns:
   - Wallet addresses (with case-insensitive variants)
   - User IDs
   - Email addresses
   - Session tokens
   - Device IDs
   - Queue status and priority fields