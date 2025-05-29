# Alive-Db Database Documentation

## Database Connection Information

- **DB_TYPE**: postgres
- **DB_HOST**: localhost
- **DB_PORT**: 5432
- **DB_USERNAME**: Aliveadmin
- **DB_DATABASE**: Alive-Db

## Database Schema

The database contains the following tables:

1. [backup_referral_codes](#table-backup_referral_codes)
2. [backup_referrals](#table-backup_referrals)
3. [diaries](#table-diaries)
4. [migrations](#table-migrations)
5. [minting_queue_items](#table-minting_queue_items)
6. [nft_collections](#table-nft_collections)
7. [nfts](#table-nfts)
8. [profiles](#table-profiles)
9. [referral_codes](#table-referral_codes) (refactored)
10. [referrals](#table-referrals) (refactored)
11. [refresh_tokens](#table-refresh_tokens)
12. [refresh_tokens_backup](#table-refresh_tokens_backup)
13. [user_devices](#table-user_devices)
14. [user_sessions](#table-user_sessions)
15. [users](#table-users)
16. [wallet_challenges](#table-wallet_challenges)
17. [wallet_nonces](#table-wallet_nonces)
18. [wallets](#table-wallets)
19. [user_sessions_orphaned_backup](#table-user_sessions_orphaned_backup)

### Table: backup_referral_codes

**Description**: Backup table created during the referral system refactoring process.

| Column Name | Data Type | Nullable | Default | Description |
|------------|-----------|----------|---------|-------------|
| id | integer | YES | | Primary key from original table |
| user_id | integer | YES | | User ID (integer type) |
| code | character varying(50) | YES | | Referral code |
| is_active | boolean | YES | true | Whether code is active |
| usage_limit | integer | YES | 10 | Max number of uses |
| used_count | integer | YES | 0 | Current use count |
| expires_at | timestamp without time zone | YES | | Expiration date |
| created_at | timestamp without time zone | YES | CURRENT_TIMESTAMP | Creation timestamp |

### Table: backup_referrals

**Description**: Backup table created during the referral system refactoring process.

| Column Name | Data Type | Nullable | Default | Description |
|------------|-----------|----------|---------|-------------|
| id | integer | YES | | Primary key from original table |
| referrer_id | integer | YES | | User who referred (integer type) |
| referred_id | integer | YES | | User who was referred (integer type) |
| referral_code_id | integer | YES | | Referral code used (integer type) |
| reward_claimed | boolean | YES | false | Whether reward was claimed |
| created_at | timestamp without time zone | YES | CURRENT_TIMESTAMP | Creation timestamp |

### Table: diaries

**Description**: Stores user diary entries.

| Column Name | Data Type | Nullable | Default | Description |
|------------|-----------|----------|---------|-------------|
| id | uuid | NO | uuid_generate_v4() | Primary key |
| title | character varying(255) | NO | | Diary entry title |
| game_level | integer | NO | | Game level the diary is associated with |
| created_at | timestamp with time zone | YES | now() | Creation timestamp |
| updated_at | timestamp with time zone | YES | now() | Last update timestamp |
| location | character varying(50) | NO | 'other' | Location where diary was written |
| feeling | character varying(100) | YES | | User's feeling/emotion |
| color | character varying(30) | YES | | Color associated with diary |
| content | text | NO | | Main diary content |
| has_media | boolean | YES | false | Whether diary has attached media |
| media_paths | ARRAY | YES | | Paths to media files |
| is_stored_locally | boolean | YES | false | Whether diary is stored locally |
| encryption_key | character varying(128) | YES | | Key for content encryption |
| user_id | integer | NO | | Foreign key to users table |

### Table: migrations

**Description**: Tracks database migrations.

| Column Name | Data Type | Nullable | Default | Description |
|------------|-----------|----------|---------|-------------|
| id | integer | NO | nextval('migrations_id_seq') | Primary key |
| timestamp | bigint | NO | | Migration timestamp |
| name | character varying(255) | NO | | Migration name |

### Table: minting_queue_items

**Description**: Stores token minting queue items for processing by the backend.

| Column Name | Data Type | Nullable | Default | Description |
|------------|-----------|----------|---------|-------------|
| id | uuid | NO | uuid_generate_v4() | Primary key |
| user_id | integer | NO | | User ID associated with minting request |
| wallet_address | character varying(42) | NO | | Wallet address for minting |
| device_id | character varying | YES | | Device ID for the request |
| type | character varying | NO | 'first_time' | Type of minting request |
| amount | numeric | NO | 0 | Amount to be minted |
| status | character varying | NO | 'pending' | Status of the minting request |
| transaction_hash | character varying | YES | | Blockchain transaction hash |
| error_message | text | YES | | Error message if minting failed |
| retry_count | integer | NO | 0 | Number of retry attempts |
| max_retries | integer | NO | 3 | Maximum number of retries allowed |
| ip_address | character varying | YES | | IP address of the request |
| metadata | jsonb | YES | | Token metadata |
| merkle_proof | text | YES | | Merkle proof for verification |
| signature | text | YES | | Signature for authorization |
| process_after | timestamp without time zone | YES | | When to process the request |
| created_at | timestamp without time zone | NO | now() | Creation timestamp |
| updated_at | timestamp without time zone | NO | now() | Last update timestamp |
| processed_at | timestamp without time zone | YES | | When the request was processed |
| processing_started_at | timestamp without time zone | YES | | When processing started |
| completed_at | timestamp without time zone | YES | | When minting completed |
| merkle_root | character varying | YES | | Merkle root for verification |
| priority | integer | NO | 0 | Processing priority |

### Table: nft_collections

**Description**: Stores information about NFT collections.

| Column Name | Data Type | Nullable | Default | Description |
|------------|-----------|----------|---------|-------------|
| id | integer | NO | nextval('nft_collections_id_seq') | Primary key |
| name | character varying(255) | YES | | Collection name |
| symbol | character varying(50) | YES | | Collection symbol |
| contract_address | character varying(255) | YES | | Blockchain contract address |
| chain_id | integer | YES | | Blockchain network ID |
| description | text | YES | | Collection description |
| created_at | timestamp without time zone | YES | CURRENT_TIMESTAMP | Creation timestamp |
| updated_at | timestamp without time zone | YES | CURRENT_TIMESTAMP | Last update timestamp |

### Table: nfts

**Description**: Stores individual NFT token information.

| Column Name | Data Type | Nullable | Default | Description |
|------------|-----------|----------|---------|-------------|
| id | integer | NO | nextval('nfts_id_seq') | Primary key |
| collection_id | integer | YES | | Foreign key to nft_collections table |
| token_id | character varying(100) | YES | | Token ID on the blockchain |
| owner_id | integer | YES | | User ID of the NFT owner |
| metadata | jsonb | YES | | NFT metadata (JSON) |
| transaction_hash | character varying(255) | YES | | Transaction hash of minting |
| created_at | timestamp without time zone | YES | CURRENT_TIMESTAMP | Creation timestamp |
| updated_at | timestamp without time zone | YES | CURRENT_TIMESTAMP | Last update timestamp |

### Table: profiles

**Description**: Stores extended user profile information.

| Column Name | Data Type | Nullable | Default | Description |
|------------|-----------|----------|---------|-------------|
| id | uuid | NO | uuid_generate_v4() | Primary key |
| user_id | uuid | NO | | Foreign key to users table |
| email | character varying | YES | | User email |
| password | character varying | YES | | Hashed password |
| first_name | character varying | YES | | First name |
| last_name | character varying | YES | | Last name |
| display_name | character varying | YES | | Display name |
| avatar_url | character varying | YES | | Profile picture URL |
| bio | text | YES | | User biography |
| unique_id | character varying | YES | | Unique identifier |
| visibility_level | character varying | YES | 'public' | Profile visibility setting |
| created_at | timestamp with time zone | YES | now() | Creation timestamp |
| updated_at | timestamp with time zone | YES | now() | Last update timestamp |
| country | character varying | YES | | User's country |
| city | character varying | YES | | User's city |
| state | character varying | YES | | User's state/province |
| postal_code | character varying | YES | | User's postal code |
| address | character varying | YES | | User's address |
| latitude | numeric | YES | | Location latitude |
| longitude | numeric | YES | | Location longitude |
| language | character varying | YES | 'en' | Preferred language |
| timezone | character varying | YES | | User's timezone |
| date_format | character varying | YES | 'yyyy-MM-dd' | Preferred date format |
| time_format | character varying | YES | '24h' | Preferred time format |
| phone_number | character varying | YES | | User's phone number |
| website | character varying | YES | | User's website |
| twitter_handle | character varying | YES | | Twitter handle |
| instagram_handle | character varying | YES | | Instagram handle |
| linkedin_profile | character varying | YES | | LinkedIn profile |
| telegram_handle | character varying | YES | | Telegram handle |
| location_visibility | character varying | YES | 'PRIVATE' | Location visibility setting |
| profile_visibility | character varying | YES | 'PUBLIC' | Overall profile visibility |
| email_notifications | boolean | YES | true | Email notifications enabled |
| push_notifications | boolean | YES | true | Push notifications enabled |
| last_location_update | timestamp without time zone | YES | | Last location update time |
| complete_later | boolean | YES | false | Profile completion deferred |

### Table: referral_codes

**Description**: Stores referral codes for user registration. Refactored to use UUIDs.

| Column Name | Data Type | Nullable | Default | Description |
|------------|-----------|----------|---------|-------------|
| id | uuid | NO | uuid_generate_v4() | Primary key |
| user_id | uuid | YES | | User who owns the code (UUID type) |
| code | character varying(50) | YES | | Referral code |
| is_active | boolean | YES | true | Whether code is active |
| usage_limit | integer | YES | 10 | Max number of uses |
| used_count | integer | YES | 0 | Current use count |
| expires_at | timestamp without time zone | YES | | Expiration date |
| created_at | timestamp without time zone | YES | CURRENT_TIMESTAMP | Creation timestamp |

**Foreign Keys**:
- `user_id` references `users.id` (ON DELETE CASCADE)
- `user_id` references `users.id` (duplicate constraint)

### Table: referrals

**Description**: Records referral relationships between users. Refactored to use UUIDs.

| Column Name | Data Type | Nullable | Default | Description |
|------------|-----------|----------|---------|-------------|
| id | uuid | NO | uuid_generate_v4() | Primary key |
| referrer_id | uuid | YES | | User who referred (UUID type) |
| referred_id | uuid | YES | | User who was referred (UUID type) |
| referral_code_id | uuid | YES | | Referral code used (UUID type) |
| reward_claimed | boolean | YES | false | Whether reward was claimed |
| created_at | timestamp without time zone | YES | CURRENT_TIMESTAMP | Creation timestamp |

**Foreign Keys**:
- `referral_code_id` references `referral_codes.id`
- `referred_id` references `users.id`
- `referrer_id` references `users.id`

### Table: refresh_tokens

**Description**: Stores authentication refresh tokens.

| Column Name | Data Type | Nullable | Default | Description |
|------------|-----------|----------|---------|-------------|
| id | uuid | NO | uuid_generate_v4() | Primary key |
| token | character varying | NO | | Refresh token value |
| expiresAt | timestamp with time zone | NO | | Token expiration time |
| userId | uuid | NO | | User ID (legacy column) |
| createdAt | timestamp with time zone | YES | now() | Creation timestamp (legacy) |
| expires_at | timestamp with time zone | NO | | Token expiration (standardized) |
| user_id | uuid | NO | | User ID (standardized column) |
| created_at | timestamp without time zone | YES | CURRENT_TIMESTAMP | Creation timestamp (standardized) |

### Table: refresh_tokens_backup

**Description**: Backup of authentication refresh tokens.

| Column Name | Data Type | Nullable | Default | Description |
|------------|-----------|----------|---------|-------------|
| id | uuid | YES | | Primary key |
| token | character varying | YES | | Refresh token value |
| expiresAt | timestamp with time zone | YES | | Token expiration time |
| userId | uuid | YES | | User ID (legacy column) |
| createdAt | timestamp with time zone | YES | | Creation timestamp (legacy) |
| expires_at | timestamp with time zone | YES | | Token expiration (standardized) |
| user_id | uuid | YES | | User ID (standardized column) |
| created_at | timestamp without time zone | YES | | Creation timestamp (standardized) |

### Table: user_devices

**Description**: Records devices used by users to access the system.

| Column Name | Data Type | Nullable | Default | Description |
|------------|-----------|----------|---------|-------------|
| id | uuid | NO | uuid_generate_v4() | Primary key |
| userId | uuid | NO | | User ID (legacy column) |
| deviceId | character varying(255) | NO | | Device identifier (legacy) |
| deviceType | character varying(50) | YES | 'unknown' | Type of device (legacy) |
| name | character varying(255) | YES | | Device name |
| platform | character varying(100) | YES | | Operating platform |
| osName | character varying(100) | YES | | OS name (legacy) |
| osVersion | character varying(100) | YES | | OS version (legacy) |
| browser | character varying(100) | YES | | Browser name |
| browserVersion | character varying(100) | YES | | Browser version (legacy) |
| isActive | boolean | YES | true | Whether device is active (legacy) |
| lastUsedAt | timestamp with time zone | YES | | Last usage time (legacy) |
| createdAt | timestamp with time zone | YES | now() | Creation timestamp (legacy) |
| updatedAt | timestamp with time zone | YES | now() | Last update timestamp (legacy) |
| walletAddresses | text | YES | | Associated wallet addresses (legacy) |
| user_agent | text | YES | | User agent string |
| os | text | YES | | Operating system |
| os_version | text | YES | | OS version (standardized) |
| browser_version | text | YES | | Browser version (standardized) |
| brand | text | YES | | Device brand |
| model | text | YES | | Device model |
| device_id | text | YES | | Device identifier (standardized) |
| device_type | text | YES | | Type of device (standardized) |
| lastIpAddress | text | YES | | Last IP address (legacy) |
| visitCount | integer | YES | 0 | Visit count (legacy) |
| lastSeenAt | timestamp with time zone | YES | | Last seen time (legacy) |
| firstSeen | timestamp with time zone | YES | | First seen time (legacy) |
| lastSeen | timestamp with time zone | YES | | Last seen time (legacy) |
| is_active | boolean | YES | true | Whether device is active (standardized) |
| isApproved | boolean | YES | true | Whether device is approved (legacy) |
| wallet_addresses | text | YES | | Associated wallet addresses (standardized) |
| last_ip_address | text | YES | | Last IP address (standardized) |
| visit_count | integer | YES | 0 | Visit count (standardized) |
| last_seen_at | timestamp with time zone | YES | | Last seen time (standardized) |
| first_seen | timestamp with time zone | YES | | First seen time (standardized) |
| last_seen | timestamp with time zone | YES | | Last seen time (duplicated) |
| is_approved | boolean | YES | true | Whether device is approved (standardized) |
| user_id | uuid | YES | | User ID (standardized column) |
| created_at | timestamp without time zone | YES | CURRENT_TIMESTAMP | Creation timestamp (standardized) |
| updated_at | timestamp without time zone | YES | CURRENT_TIMESTAMP | Last update timestamp (standardized) |

### Table: user_sessions

**Description**: Tracks user login sessions.

| Column Name | Data Type | Nullable | Default | Description |
|------------|-----------|----------|---------|-------------|
| id | uuid | NO | uuid_generate_v4() | Primary key |
| userId | uuid | YES | | User ID (legacy column) |
| deviceId | character varying(255) | YES | | Device identifier (legacy) |
| walletId | uuid | YES | | Associated wallet ID |
| token | character varying(500) | YES | | Session token |
| ipAddress | character varying(100) | YES | | IP address (legacy) |
| userAgent | text | YES | | User agent string (legacy) |
| expiresAt | timestamp with time zone | YES | | Session expiration time (legacy) |
| isActive | boolean | YES | true | Whether session is active (legacy) |
| endedAt | timestamp with time zone | YES | | Session end time (legacy) |
| createdAt | timestamp with time zone | YES | now() | Creation timestamp (legacy) |
| user_agent | text | YES | | User agent string (standardized) |
| device_id | text | YES | | Device identifier (standardized) |
| ip_address | text | YES | | IP address (standardized) |
| expires_at | timestamp with time zone | YES | | Session expiration time (standardized) |
| isactive | boolean | YES | true | Whether session is active (typo) |
| is_active | boolean | YES | true | Whether session is active (standardized) |
| endedat | timestamp with time zone | YES | | Session end time (typo) |
| duration | integer | YES | | Session duration in seconds |
| user_id | uuid | YES | | User ID (standardized column) |
| created_at | timestamp without time zone | YES | CURRENT_TIMESTAMP | Creation timestamp (standardized) |

### Table: users

**Description**: Main user accounts table.

| Column Name | Data Type | Nullable | Default | Description |
|------------|-----------|----------|---------|-------------|
| id | uuid | NO | uuid_generate_v4() | Primary key |
| username | character varying | YES | | Username |
| email | character varying | YES | | User email |
| password | character varying | YES | | Hashed password |
| first_name | character varying | YES | | First name |
| last_name | character varying | YES | | Last name |
| avatar_url | character varying | YES | | Profile picture URL |
| isActive | boolean | YES | true | Whether user is active (legacy) |
| isVerified | boolean | YES | false | Whether user is verified (legacy) |
| isAdmin | boolean | YES | false | Whether user is admin (legacy) |
| role | character varying | YES | 'user' | User role |
| walletAddress | character varying | YES | | Blockchain wallet address (legacy) |
| referralCode | character varying | YES | | Referral code (legacy) |
| referredById | uuid | YES | | ID of user who referred this user (legacy) |
| referralTier | integer | YES | 0 | Referral program tier level |
| createdAt | timestamp with time zone | YES | now() | Creation timestamp (legacy) |
| updatedAt | timestamp with time zone | YES | now() | Last update timestamp (legacy) |
| userId | uuid | YES | uuid_generate_v4() | Duplicate user ID (legacy) |
| referrer_id | uuid | YES | | ID of user who referred this user (standardized) |
| user_id | uuid | YES | | Duplicate user ID (standardized) |
| verification_token | character varying(255) | YES | | Email verification token |
| reset_password_token | character varying(255) | YES | | Password reset token |
| reset_password_expires | timestamp without time zone | YES | | Password reset token expiration |
| last_login_at | timestamp without time zone | YES | | Last login timestamp |
| last_login_ip | character varying(255) | YES | | IP address of last login |
| created_at | timestamp with time zone | YES | CURRENT_TIMESTAMP | Creation timestamp (standardized) |
| updated_at | timestamp with time zone | YES | CURRENT_TIMESTAMP | Last update timestamp (standardized) |
| last_mint_date | timestamp with time zone | YES | | Last token minting date |
| token_expiry_date | timestamp with time zone | YES | | Token expiration date |
| minted_amount | numeric | YES | 0 | Amount of tokens minted |
| has_expired_tokens | boolean | YES | false | Whether user has expired tokens |

### Table: wallet_challenges

**Description**: Stores wallet authentication challenges.

| Column Name | Data Type | Nullable | Default | Description |
|------------|-----------|----------|---------|-------------|
| id | uuid | NO | uuid_generate_v4() | Primary key |
| wallet_address | character varying(255) | NO | | Wallet address being challenged |
| challenge_text | text | NO | | Challenge text to sign |
| created_at | timestamp with time zone | YES | CURRENT_TIMESTAMP | Creation timestamp |
| expires_at | timestamp with time zone | YES | CURRENT_TIMESTAMP + 10 minutes | Challenge expiration time |
| is_used | boolean | YES | false | Whether challenge was used |
| challenge | text | YES | | Challenge text (duplicated) |

### Table: wallet_nonces

**Description**: Stores nonces for wallet authentication.

| Column Name | Data Type | Nullable | Default | Description |
|------------|-----------|----------|---------|-------------|
| id | uuid | NO | uuid_generate_v4() | Primary key |
| wallet_address | character varying(255) | NO | | Wallet address |
| nonce | character varying(255) | NO | | Nonce value for authentication |
| updated_at | timestamp with time zone | YES | CURRENT_TIMESTAMP | Last update timestamp |
| expires_at | timestamp with time zone | YES | now() + 15 minutes | Nonce expiration time |

### Table: wallets

**Description**: Stores blockchain wallet information.

| Column Name | Data Type | Nullable | Default | Description |
|------------|-----------|----------|---------|-------------|
| id | uuid | NO | uuid_generate_v4() | Primary key |
| address | character varying | NO | | Wallet address |
| privateKey | character varying | YES | | Encrypted private key (if stored) |
| chain | character varying | YES | 'ETH' | Blockchain network |
| user_id | uuid | NO | | Associated user ID |
| isActive | boolean | YES | true | Whether wallet is active (legacy) |
| createdAt | timestamp with time zone | YES | now() | Creation timestamp (legacy) |
| updatedAt | timestamp with time zone | YES | now() | Last update timestamp (legacy) |
| created_at | timestamp with time zone | YES | CURRENT_TIMESTAMP | Creation timestamp (standardized) |
| updated_at | timestamp with time zone | YES | CURRENT_TIMESTAMP | Last update timestamp (standardized) |

### Table: user_sessions_orphaned_backup

**Description**: Backup table for orphaned user sessions.

| Column Name | Data Type | Nullable | Default | Description |
|------------|-----------|----------|---------|-------------|
| id | uuid | YES | | Primary key |
| user_id | uuid | YES | | User ID |
| device_id | character varying(255) | YES | | Device identifier |
| wallet_id | uuid | YES | | Associated wallet ID |
| token | character varying(500) | YES | | Session token |
| ip_address | character varying(100) | YES | | IP address |
| user_agent | text | YES | | User agent string |
| expires_at | timestamp with time zone | YES | | Session expiration time |
| is_active | boolean | YES | true | Whether session is active |
| ended_at | timestamp with time zone | YES | | Session end time |
| created_at | timestamp with time zone | YES | now() | Creation timestamp |

## Entity Relationship Diagram

The main relationships in the database are:

- Each **user** can have multiple **profiles**, **wallets**, and **user_devices**
- Each **user** can create multiple **diaries**
- **wallet_challenges** and **wallet_nonces** are used for wallet authentication
- **referrals** track relationships between users through **referral_codes**
- **minting_queue_items** track NFT minting operations
- **nfts** belong to **nft_collections** and are owned by **users**

## Recent Database Refactoring (May 8, 2025)

The database has undergone a significant refactoring process to ensure consistency and proper relationships. Key changes include:

1. **Referral System Refactoring**:
   - The `referral_codes` and `referrals` tables have been converted from using integer IDs to UUID types
   - This resolves foreign key constraint issues with the `users` table which uses UUIDs
   - Backup tables (`backup_referral_codes` and `backup_referrals`) were created before the schema changes

2. **Column Naming Standardization**:
   - All database columns follow snake_case naming convention (e.g., `created_at` instead of `createdAt`)
   - Entity properties in TypeScript code use camelCase but have explicit column name decorators
   - This ensures proper mapping between the database and application code

3. **Foreign Key Constraints**:
   - Foreign key relationships are properly established between tables
   - Current constraints include user relationships to profiles, devices, sessions, wallets, and referral data

## Database Optimization Notes

1. There are both legacy and standardized column naming patterns in some tables (e.g., `createdAt` and `created_at`), but these have been addressed in the TypeORM entities to ensure proper mapping.
2. The database now consistently uses UUID primary keys across authentication-related tables, providing better security and distribution.
3. Foreign key constraints are properly established to ensure data integrity.
4. Backup tables from the refactoring process can be deleted after thorough testing of the new schema.

## Common Queries

```sql
-- Get user with profile information
SELECT u.*, p.*
FROM users u
LEFT JOIN profiles p ON u.id = p.user_id
WHERE u.id = 'user-uuid-here';

-- Get user's wallets
SELECT * FROM wallets
WHERE user_id = 'user-uuid-here';

-- Get user's referral codes
SELECT * FROM referral_codes
WHERE user_id = 'user-uuid-here';

-- Get referrals by a specific user
SELECT r.*, rc.code, u.username AS referred_user
FROM referrals r
JOIN referral_codes rc ON r.referral_code_id = rc.id
JOIN users u ON r.referred_id = u.id
WHERE r.referrer_id = 'user-uuid-here';

-- Get foreign key relationships in the authentication tables
SELECT
    tc.table_schema, 
    tc.constraint_name, 
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM 
    information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY' 
    AND tc.table_schema = 'public'
    AND (tc.table_name IN ('users', 'profiles', 'user_devices', 
                          'user_sessions', 'wallets', 'referral_codes', 'referrals'));
```

## Current Authentication Issues

The frontend is experiencing authentication issues as indicated by browser console errors:

```
Failed to load resource: the server responded with a status of 401 (Unauthorized)
Authentication failed for request to /profile. Token may be invalid or expired.
Clearing stored tokens due to authentication failure
API Error [get] /profile: Status 401 Object
Error fetching user profile: AxiosError
Error initializing user: AxiosError
```

These errors suggest that after the database refactoring, there may be issues with authentication tokens or session management. To resolve this:

1. Check that the session token format in the database matches what the application expects
2. Verify that the token authentication middleware is correctly validating UUIDs
3. Clear browser storage and attempt to log in again
4. Check for any incorrect column references in authentication-related queries