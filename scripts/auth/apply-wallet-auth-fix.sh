#!/bin/bash

# Colors for terminal output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== Wallet Authentication Fix Script ===${NC}"
echo -e "${YELLOW}This script will fix the refresh_tokens table schema and column naming issues.${NC}"

# Database configuration
DB_HOST="localhost"
DB_PORT="5432"
DB_NAME="Alive-Db"
DB_USER="Aliveadmin"
DB_PASSWORD="alivehumans@2024"

# Create temporary fix SQL script
FIX_SQL_FILE=$(mktemp)
cat > $FIX_SQL_FILE << 'EOF'
-- Comprehensive fix for refresh_tokens table

-- Start a transaction so changes are atomic
BEGIN;

-- Check if refresh_tokens table exists
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'refresh_tokens') THEN
    RAISE NOTICE 'refresh_tokens table exists, applying fixes...';
  ELSE
    RAISE NOTICE 'refresh_tokens table does not exist, creating it...';
    CREATE TABLE public.refresh_tokens (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      token VARCHAR(255) NOT NULL,
      "expiresAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (NOW() + INTERVAL '7 days'),
      "userId" UUID NOT NULL,
      "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      user_id UUID NOT NULL,
      expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '7 days'),
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      CONSTRAINT refresh_tokens_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE
    );
  END IF;
END $$;

-- Ensure both column naming conventions exist
DO $$
BEGIN
  -- Add expiresAt if it doesn't exist
  IF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'refresh_tokens' AND column_name = 'expiresAt'
  ) THEN
    RAISE NOTICE 'Adding expiresAt column...';
    ALTER TABLE public.refresh_tokens ADD COLUMN "expiresAt" TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '7 days');
  END IF;

  -- Add expires_at if it doesn't exist
  IF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'refresh_tokens' AND column_name = 'expires_at'
  ) THEN
    RAISE NOTICE 'Adding expires_at column...';
    ALTER TABLE public.refresh_tokens ADD COLUMN expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '7 days');
  END IF;

  -- Add userId if it doesn't exist
  IF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'refresh_tokens' AND column_name = 'userId'
  ) THEN
    RAISE NOTICE 'Adding userId column...';
    ALTER TABLE public.refresh_tokens ADD COLUMN "userId" UUID;
  END IF;

  -- Add user_id if it doesn't exist
  IF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'refresh_tokens' AND column_name = 'user_id'
  ) THEN
    RAISE NOTICE 'Adding user_id column...';
    ALTER TABLE public.refresh_tokens ADD COLUMN user_id UUID;
  END IF;

  -- Add createdAt if it doesn't exist
  IF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'refresh_tokens' AND column_name = 'createdAt'
  ) THEN
    RAISE NOTICE 'Adding createdAt column...';
    ALTER TABLE public.refresh_tokens ADD COLUMN "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW();
  END IF;

  -- Add created_at if it doesn't exist
  IF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'refresh_tokens' AND column_name = 'created_at'
  ) THEN
    RAISE NOTICE 'Adding created_at column...';
    ALTER TABLE public.refresh_tokens ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
  END IF;

  -- Sync values between camelCase and snake_case columns
  RAISE NOTICE 'Synchronizing column values...';
  UPDATE public.refresh_tokens SET "expiresAt" = expires_at WHERE "expiresAt" IS NULL AND expires_at IS NOT NULL;
  UPDATE public.refresh_tokens SET expires_at = "expiresAt" WHERE expires_at IS NULL AND "expiresAt" IS NOT NULL;
  UPDATE public.refresh_tokens SET "userId" = user_id WHERE "userId" IS NULL AND user_id IS NOT NULL;
  UPDATE public.refresh_tokens SET user_id = "userId" WHERE user_id IS NULL AND "userId" IS NOT NULL;
  UPDATE public.refresh_tokens SET "createdAt" = created_at WHERE "createdAt" IS NULL AND created_at IS NOT NULL;
  UPDATE public.refresh_tokens SET created_at = "createdAt" WHERE created_at IS NULL AND "createdAt" IS NOT NULL;

  -- Set default values for NULL fields
  RAISE NOTICE 'Setting default values for NULL fields...';
  UPDATE public.refresh_tokens SET "expiresAt" = (NOW() + INTERVAL '7 days') WHERE "expiresAt" IS NULL;
  UPDATE public.refresh_tokens SET expires_at = "expiresAt" WHERE expires_at IS NULL;
  UPDATE public.refresh_tokens SET "createdAt" = NOW() WHERE "createdAt" IS NULL;
  UPDATE public.refresh_tokens SET created_at = "createdAt" WHERE created_at IS NULL;

  -- Delete invalid refresh tokens (where user doesn't exist)
  RAISE NOTICE 'Removing invalid refresh tokens...';
  DELETE FROM public.refresh_tokens 
  WHERE user_id IS NOT NULL AND 
        NOT EXISTS (SELECT 1 FROM public.users WHERE id = public.refresh_tokens.user_id);

  DELETE FROM public.refresh_tokens 
  WHERE "userId" IS NOT NULL AND 
        NOT EXISTS (SELECT 1 FROM public.users WHERE id = public.refresh_tokens."userId");

  -- Set NOT NULL constraints
  RAISE NOTICE 'Setting NOT NULL constraints...';
  ALTER TABLE public.refresh_tokens ALTER COLUMN "expiresAt" SET NOT NULL;
  ALTER TABLE public.refresh_tokens ALTER COLUMN expires_at SET NOT NULL;
  ALTER TABLE public.refresh_tokens ALTER COLUMN "userId" SET NOT NULL;
  ALTER TABLE public.refresh_tokens ALTER COLUMN user_id SET NOT NULL;
END $$;

-- Add foreign key constraint if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'refresh_tokens_user_id_fkey' 
    AND table_name = 'refresh_tokens'
  ) THEN
    RAISE NOTICE 'Adding foreign key constraint...';
    ALTER TABLE public.refresh_tokens 
    ADD CONSTRAINT refresh_tokens_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Create or replace the trigger function to keep columns in sync
CREATE OR REPLACE FUNCTION sync_refresh_token_columns()
RETURNS TRIGGER AS $$
BEGIN
  -- Sync user ID columns
  IF NEW.user_id IS NULL AND NEW."userId" IS NOT NULL THEN
    NEW.user_id := NEW."userId";
  ELSIF NEW."userId" IS NULL AND NEW.user_id IS NOT NULL THEN
    NEW."userId" := NEW.user_id;
  END IF;

  -- Sync expiry date columns
  IF NEW.expires_at IS NULL AND NEW."expiresAt" IS NOT NULL THEN
    NEW.expires_at := NEW."expiresAt";
  ELSIF NEW."expiresAt" IS NULL AND NEW.expires_at IS NOT NULL THEN
    NEW."expiresAt" := NEW.expires_at;
  END IF;

  -- Sync created at columns
  IF NEW.created_at IS NULL AND NEW."createdAt" IS NOT NULL THEN
    NEW.created_at := NEW."createdAt";
  ELSIF NEW."createdAt" IS NULL AND NEW.created_at IS NOT NULL THEN
    NEW."createdAt" := NEW.created_at;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if it exists
DROP TRIGGER IF EXISTS sync_refresh_token_columns_trigger ON public.refresh_tokens;

-- Create the trigger
CREATE TRIGGER sync_refresh_token_columns_trigger
BEFORE INSERT OR UPDATE ON public.refresh_tokens
FOR EACH ROW
EXECUTE FUNCTION sync_refresh_token_columns();

-- Fix user device table if needed for wallet addresses
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'user_devices' AND column_name = 'wallet_addresses'
  ) THEN
    RAISE NOTICE 'Adding wallet_addresses column to user_devices...';
    ALTER TABLE public.user_devices ADD COLUMN wallet_addresses JSONB DEFAULT '[]'::jsonb;
  END IF;
END $$;

-- Verify the fix
DO $$
DECLARE
  token_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO token_count FROM public.refresh_tokens;
  RAISE NOTICE 'refresh_tokens table has % rows', token_count;
  RAISE NOTICE 'Schema fix completed successfully!';
END $$;

-- Commit all changes
COMMIT;
EOF

echo -e "${YELLOW}Applying database fixes...${NC}"

# Create a temporary PGPASSFILE for secure password usage
export PGPASSFILE=$(mktemp)
echo "${DB_HOST}:${DB_PORT}:${DB_NAME}:${DB_USER}:${DB_PASSWORD}" > $PGPASSFILE
chmod 600 $PGPASSFILE

# Execute the SQL fix script
if PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -d "$DB_NAME" -U "$DB_USER" -f "$FIX_SQL_FILE"; then
  echo -e "${GREEN}✓ Database schema fixes applied successfully${NC}"
else
  echo -e "${RED}✗ Error applying database schema fixes${NC}"
  rm -f $PGPASSFILE
  rm -f $FIX_SQL_FILE
  exit 1
fi

# Clean up
rm -f $PGPASSFILE
rm -f $FIX_SQL_FILE

echo -e "${BLUE}Creating code fix recommendations...${NC}"

# Create a file with code fix recommendations
CODE_FIX_FILE="wallet-auth-code-fixes.md"
cat > "$CODE_FIX_FILE" << 'EOF'
# Wallet Authentication Code Fixes

## Database Schema Fixed

✅ The refresh_tokens table has been fixed to support both camelCase and snake_case column naming.

## Issue Identified

The wallet authentication error was caused by:

1. Mismatch between column naming in code vs. database (`expires_at` vs `expiresAt`)
2. Missing `NOT NULL` constraints on required columns
3. Failed foreign key constraint during token creation

## Code Changes Required

To prevent these issues from happening again, apply the following code changes:

### 1. Update your RefreshToken entity

```typescript
// src/auth/entities/refresh-token.entity.ts
import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity('refresh_tokens')
export class RefreshToken {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  token: string;

  // Support both naming conventions with transformers
  @Column({
    name: 'expiresAt',
    transformer: {
      to: (value: Date) => value,
      from: (value: Date) => value,
    }
  })
  expiresAt: Date;

  // Support both naming conventions with transformers
  @Column({
    name: 'userId',
    transformer: {
      to: (value: string) => value,
      from: (value: string) => value,
    }
  })
  userId: string;

  @Column({
    name: 'createdAt',
    default: () => 'NOW()',
    transformer: {
      to: (value: Date) => value,
      from: (value: Date) => value,
    }
  })
  createdAt: Date;

  // Define relationship to User entity
  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;
}
```

### 2. Update your TokenService

```typescript
// src/auth/services/token.service.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RefreshToken } from '../entities/refresh-token.entity';

@Injectable()
export class TokenService {
  constructor(
    @InjectRepository(RefreshToken)
    private refreshTokenRepository: Repository<RefreshToken>,
  ) {}

  async createRefreshToken(userId: string): Promise<string> {
    // Generate a random token or use a JWT
    const token = this.generateRandomToken();
    
    // Calculate expiration date (e.g., 7 days from now)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);
    
    // Create and save the refresh token
    const refreshToken = this.refreshTokenRepository.create({
      token,
      expiresAt,
      userId,
      createdAt: new Date(),
    });
    
    await this.refreshTokenRepository.save(refreshToken);
    
    return token;
  }

  private generateRandomToken(): string {
    // Implement a secure token generation method
    return require('crypto').randomBytes(64).toString('hex');
  }
}
```

### 3. Update your WalletAuthService

```typescript
// src/auth/services/wallet-auth.service.ts
// Inside your walletLogin method:
async walletLogin(address: string, signature: string): Promise<any> {
  try {
    // Start a transaction
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    
    try {
      // Your existing code...
      
      // Create tokens
      const accessToken = await this.tokenService.generateAccessToken(user.id);
      const refreshToken = await this.tokenService.createRefreshToken(user.id);
      
      // If everything is successful, commit the transaction
      await queryRunner.commitTransaction();
      
      return {
        accessToken,
        refreshToken,
        user: { id: user.id, walletAddress: user.walletAddress }
      };
    } catch (err) {
      // If anything fails, roll back the transaction
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      // Release the query runner
      await queryRunner.release();
    }
  } catch (error) {
    this.logger.error(`[${traceId}] Wallet login error: ${error.message}`);
    throw new InternalServerErrorException(`Failed to generate authentication tokens: ${error.message}`);
  }
}
```

## Testing

After applying these changes:

1. Restart your backend service: `npm run start:dev`
2. Try to authenticate with a wallet again
3. Check logs for any remaining errors
4. Ensure no errors occur in the token creation process

EOF

echo -e "${GREEN}✅ Created code fix recommendations in ${CODE_FIX_FILE}${NC}"

# Create a Node.js script to test the wallet authentication
TEST_SCRIPT="test-wallet-auth.js"
cat > "$TEST_SCRIPT" << 'EOF'
const { Pool } = require('pg');
require('dotenv').config();

async function testWalletAuth() {
  console.log('Testing wallet authentication database schema...');
  
  const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'Alive-Db',
    user: process.env.DB_USER || 'Aliveadmin',
    password: process.env.DB_PASSWORD || 'alivehumans@2024',
  });

  try {
    const client = await pool.connect();
    console.log('✓ Connected to database');
    
    // Check if users table exists and has data
    const userResult = await client.query(`
      SELECT id, "walletAddress" FROM users 
      WHERE "walletAddress" IS NOT NULL 
      LIMIT 1
    `);
    
    if (userResult.rows.length === 0) {
      console.log('No users with wallet addresses found, creating test user...');
      
      // Create a test user with a wallet address
      const insertUserResult = await client.query(`
        INSERT INTO users (
          "isActive", "isVerified", role, "walletAddress", "created_at"
        ) VALUES (
          true, true, 'user', $1, NOW()
        ) RETURNING id, "walletAddress"
      `, ['0xTestWalletAddress123456789abcdef']);
      
      console.log('✓ Created test user:', insertUserResult.rows[0]);
      var userId = insertUserResult.rows[0].id;
    } else {
      console.log('✓ Found existing user:', userResult.rows[0]);
      var userId = userResult.rows[0].id;
    }
    
    // Try to create a test refresh token
    console.log('Creating test refresh token...');
    const tokenResult = await client.query(`
      INSERT INTO refresh_tokens (
        token, "expiresAt", "userId", "createdAt"
      ) VALUES (
        'test-token-' + NOW(), NOW() + INTERVAL '7 days', $1, NOW()
      ) RETURNING id, token, "expiresAt"
    `, [userId]);
    
    console.log('✓ Successfully created refresh token:', tokenResult.rows[0]);
    
    // Clean up
    console.log('Cleaning up test data...');
    await client.query('DELETE FROM refresh_tokens WHERE id = $1', [tokenResult.rows[0].id]);
    
    client.release();
    await pool.end();
    console.log('✓ Test completed successfully!');
    return true;
  } catch (error) {
    console.error('Error testing wallet auth:', error.message);
    return false;
  }
}

testWalletAuth()
  .then(success => {
    if (success) {
      console.log('✅ Wallet authentication schema is working properly!');
      process.exit(0);
    } else {
      console.log('❌ Wallet authentication schema test failed.');
      process.exit(1);
    }
  });
EOF

echo -e "${YELLOW}Do you want to test the wallet authentication fix? (y/n)${NC}"
read -r response
if [[ "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
  echo -e "${BLUE}Testing the wallet authentication fix...${NC}"
  
  # Check if Node.js is available
  if command -v node &> /dev/null; then
    # Check if pg module is installed
    if ! node -e "require('pg')" &> /dev/null; then
      echo -e "${YELLOW}Installing pg module temporarily...${NC}"
      npm install --no-save pg dotenv
    fi
    
    # Run the test script
    node "$TEST_SCRIPT"
    TEST_EXIT_CODE=$?
    
    if [ $TEST_EXIT_CODE -eq 0 ]; then
      echo -e "${GREEN}✅ Wallet authentication schema test passed!${NC}"
    else
      echo -e "${RED}❌ Wallet authentication schema test failed. Review the recommendations in ${CODE_FIX_FILE}.${NC}"
    fi
  else
    echo -e "${YELLOW}Node.js not found, skipping test.${NC}"
  fi
else
  echo -e "${YELLOW}Skipping test.${NC}"
fi

echo -e "${GREEN}✅ Wallet authentication fix process completed!${NC}"
echo -e "${BLUE}Next steps:${NC}"
echo -e "1. Review the code recommendations in ${CODE_FIX_FILE}"
echo -e "2. Apply the recommended code changes"
echo -e "3. Restart your backend service with: ${GREEN}npm run start:dev${NC}"
echo -e "4. Test the wallet authentication in your application"