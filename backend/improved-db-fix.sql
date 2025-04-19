-- Improved Database Fix Script
-- This script is idempotent and can be run multiple times safely
-- It checks column existence before attempting renames

-- Function to check if a column exists in a table
CREATE OR REPLACE FUNCTION column_exists(tbl text, col text) RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_name = tbl AND column_name = col
  );
END;
$$ LANGUAGE plpgsql;

-- Function to safely rename a column if the source exists and target doesn't
CREATE OR REPLACE FUNCTION safe_rename_column(tbl text, source_col text, target_col text) RETURNS void AS $$
BEGIN
  IF column_exists(tbl, source_col) AND NOT column_exists(tbl, target_col) THEN
    EXECUTE format('ALTER TABLE %I RENAME COLUMN %I TO %I', tbl, source_col, target_col);
    RAISE NOTICE 'Renamed column % to % in table %', source_col, target_col, tbl;
  ELSIF column_exists(tbl, source_col) AND column_exists(tbl, target_col) THEN
    RAISE NOTICE 'Both source column % and target column % exist in table %. Manual merge may be needed.', 
      source_col, target_col, tbl;
  ELSIF NOT column_exists(tbl, source_col) AND column_exists(tbl, target_col) THEN
    RAISE NOTICE 'Target column % already exists in table %, no action needed', target_col, tbl;
  ELSE
    RAISE NOTICE 'Source column % does not exist in table %, skipping', source_col, tbl;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to safely add a column if it doesn't exist
CREATE OR REPLACE FUNCTION safe_add_column(tbl text, col text, data_type text, nullable boolean, default_val text DEFAULT NULL) RETURNS void AS $$
BEGIN
  IF NOT column_exists(tbl, col) THEN
    IF default_val IS NULL THEN
      IF nullable THEN
        EXECUTE format('ALTER TABLE %I ADD COLUMN %I %s NULL', tbl, col, data_type);
      ELSE
        EXECUTE format('ALTER TABLE %I ADD COLUMN %I %s NOT NULL', tbl, col, data_type);
      END IF;
    ELSE
      IF nullable THEN
        EXECUTE format('ALTER TABLE %I ADD COLUMN %I %s NULL DEFAULT %s', tbl, col, data_type, default_val);
      ELSE
        EXECUTE format('ALTER TABLE %I ADD COLUMN %I %s NOT NULL DEFAULT %s', tbl, col, data_type, default_val);
      END IF;
    END IF;
    RAISE NOTICE 'Added column % to table %', col, tbl;
  ELSE
    RAISE NOTICE 'Column % already exists in table %, skipping', col, tbl;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Fix the users table
DO $$
BEGIN
  -- Convert snake_case to camelCase in users table
  PERFORM safe_rename_column('users', 'wallet_address', 'walletAddress');
  PERFORM safe_rename_column('users', 'is_active', 'isActive');
  PERFORM safe_rename_column('users', 'is_verified', 'isVerified');
  PERFORM safe_rename_column('users', 'created_at', 'createdAt');
  PERFORM safe_rename_column('users', 'updated_at', 'updatedAt');
  PERFORM safe_rename_column('users', 'verification_token', 'verificationToken');
  PERFORM safe_rename_column('users', 'reset_password_token', 'resetPasswordToken');
  PERFORM safe_rename_column('users', 'reset_password_expires', 'resetPasswordExpires');
  PERFORM safe_rename_column('users', 'referrer_id', 'referrerId');
  PERFORM safe_rename_column('users', 'last_login_at', 'lastLoginAt');
  PERFORM safe_rename_column('users', 'last_login_ip', 'lastLoginIp');
  PERFORM safe_rename_column('users', 'last_mint_date', 'lastMintDate');
  PERFORM safe_rename_column('users', 'token_expiry_date', 'tokenExpiryDate');
  PERFORM safe_rename_column('users', 'minted_amount', 'mintedAmount');
  PERFORM safe_rename_column('users', 'has_expired_tokens', 'hasExpiredTokens');
  
  -- Add any columns that might be missing
  PERFORM safe_add_column('users', 'walletAddress', 'VARCHAR(255)', true);
  PERFORM safe_add_column('users', 'isActive', 'BOOLEAN', false, 'TRUE');
  PERFORM safe_add_column('users', 'isVerified', 'BOOLEAN', false, 'FALSE');
END $$;

-- Fix the user_devices table
DO $$
BEGIN
  -- Carefully rename columns - check if either snake_case or camelCase exists
  PERFORM safe_rename_column('user_devices', 'user_id', 'userId');
  PERFORM safe_rename_column('user_devices', 'device_id', 'deviceId');
  PERFORM safe_rename_column('user_devices', 'device_type', 'deviceType');
  PERFORM safe_rename_column('user_devices', 'os_version', 'osVersion');
  PERFORM safe_rename_column('user_devices', 'browser_version', 'browserVersion');
  PERFORM safe_rename_column('user_devices', 'is_active', 'isActive');
  PERFORM safe_rename_column('user_devices', 'created_at', 'createdAt');
  PERFORM safe_rename_column('user_devices', 'updated_at', 'updatedAt');
  PERFORM safe_rename_column('user_devices', 'last_ip_address', 'lastIpAddress');
  PERFORM safe_rename_column('user_devices', 'visit_count', 'visitCount');
  PERFORM safe_rename_column('user_devices', 'last_seen_at', 'lastSeenAt');
  PERFORM safe_rename_column('user_devices', 'first_seen', 'firstSeen');
  PERFORM safe_rename_column('user_devices', 'last_seen', 'lastSeen');
  PERFORM safe_rename_column('user_devices', 'is_approved', 'isApproved');
  PERFORM safe_rename_column('user_devices', 'wallet_addresses', 'walletAddresses');
END $$;

-- Fix the wallets table
DO $$
BEGIN
  -- Convert snake_case to camelCase in wallets table
  PERFORM safe_rename_column('wallets', 'user_id', 'userId');
  PERFORM safe_rename_column('wallets', 'is_active', 'isActive');
  PERFORM safe_rename_column('wallets', 'created_at', 'createdAt');
  PERFORM safe_rename_column('wallets', 'updated_at', 'updatedAt');
  PERFORM safe_rename_column('wallets', 'private_key', 'privateKey');
END $$;

-- Fix the user_sessions table
DO $$
BEGIN
  -- Carefully handle user_sessions columns
  PERFORM safe_rename_column('user_sessions', 'user_id', 'userId');
  PERFORM safe_rename_column('user_sessions', 'device_id', 'deviceId');
  PERFORM safe_rename_column('user_sessions', 'ip_address', 'ipAddress');
  PERFORM safe_rename_column('user_sessions', 'user_agent', 'userAgent');
  PERFORM safe_rename_column('user_sessions', 'expires_at', 'expiresAt');
  PERFORM safe_rename_column('user_sessions', 'is_active', 'isActive');
  PERFORM safe_rename_column('user_sessions', 'created_at', 'createdAt');
  
  -- Handle special case where both versions might exist
  IF column_exists('user_sessions', 'is_active') AND column_exists('user_sessions', 'isactive') THEN
    -- Choose one to keep (preferably the one with data)
    RAISE NOTICE 'Both is_active and isactive exist in user_sessions, keeping isActive';
    
    -- Create isActive if it doesn't exist
    IF NOT column_exists('user_sessions', 'isActive') THEN
      EXECUTE 'ALTER TABLE user_sessions ADD COLUMN "isActive" BOOLEAN';
      EXECUTE 'UPDATE user_sessions SET "isActive" = COALESCE(is_active, isactive) WHERE "isActive" IS NULL';
    END IF;
  END IF;
END $$;

-- Add test admin user if not exists
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM users WHERE "walletAddress" = '0x0749c7b218948524cab3e892eba5e60b0b95caee' OR wallet_address = '0x0749c7b218948524cab3e892eba5e60b0b95caee') THEN
    INSERT INTO users (id, "walletAddress", "isActive", "isVerified", role, "createdAt", "updatedAt")
    VALUES (
      '00000000-0000-0000-0000-000000000001',
      '0x0749c7b218948524cab3e892eba5e60b0b95caee',
      TRUE,
      TRUE,
      'admin',
      CURRENT_TIMESTAMP,
      CURRENT_TIMESTAMP
    );
    RAISE NOTICE 'Added admin user with wallet address 0x0749c7b218948524cab3e892eba5e60b0b95caee';
  ELSE
    RAISE NOTICE 'Admin user already exists';
  END IF;
  
  -- Add wallet for admin if not exists
  IF NOT EXISTS (SELECT 1 FROM wallets WHERE address = '0x0749c7b218948524cab3e892eba5e60b0b95caee') THEN
    INSERT INTO wallets (id, address, chain, "userId", "isActive", "createdAt", "updatedAt")
    VALUES (
      '00000000-0000-0000-0000-000000000001',
      '0x0749c7b218948524cab3e892eba5e60b0b95caee',
      'ETH',
      '00000000-0000-0000-0000-000000000001',
      TRUE,
      CURRENT_TIMESTAMP,
      CURRENT_TIMESTAMP
    );
    RAISE NOTICE 'Added wallet for admin user';
  ELSE
    RAISE NOTICE 'Admin wallet already exists';
  END IF;
END $$;

-- Clean up temporary functions
DROP FUNCTION IF EXISTS column_exists;
DROP FUNCTION IF EXISTS safe_rename_column;
DROP FUNCTION IF EXISTS safe_add_column;

RAISE NOTICE 'Database fix completed successfully!';
