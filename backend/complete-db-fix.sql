-- This script must be run by a PostgreSQL superuser

---------------------------------------------------------
-- Fix user_devices table - Multiple column issues
---------------------------------------------------------

-- Add the columns that are missing
ALTER TABLE IF EXISTS user_devices ADD COLUMN IF NOT EXISTS name TEXT NULL;
ALTER TABLE IF EXISTS user_devices ADD COLUMN IF NOT EXISTS wallet_addresses TEXT NULL;
ALTER TABLE IF EXISTS user_devices ADD COLUMN IF NOT EXISTS user_agent TEXT NULL;
ALTER TABLE IF EXISTS user_devices ADD COLUMN IF NOT EXISTS platform TEXT NULL;
ALTER TABLE IF EXISTS user_devices ADD COLUMN IF NOT EXISTS os TEXT NULL;
ALTER TABLE IF EXISTS user_devices ADD COLUMN IF NOT EXISTS os_version TEXT NULL;
ALTER TABLE IF EXISTS user_devices ADD COLUMN IF NOT EXISTS browser TEXT NULL;
ALTER TABLE IF EXISTS user_devices ADD COLUMN IF NOT EXISTS browser_version TEXT NULL;
ALTER TABLE IF EXISTS user_devices ADD COLUMN IF NOT EXISTS brand TEXT NULL;
ALTER TABLE IF EXISTS user_devices ADD COLUMN IF NOT EXISTS model TEXT NULL;
ALTER TABLE IF EXISTS user_devices ADD COLUMN IF NOT EXISTS device_id TEXT NULL;
ALTER TABLE IF EXISTS user_devices ADD COLUMN IF NOT EXISTS device_type TEXT NULL;
ALTER TABLE IF EXISTS user_devices ADD COLUMN IF NOT EXISTS last_ip_address TEXT NULL;
ALTER TABLE IF EXISTS user_devices ADD COLUMN IF NOT EXISTS visit_count INTEGER DEFAULT 0;
ALTER TABLE IF EXISTS user_devices ADD COLUMN IF NOT EXISTS last_seen_at TIMESTAMP WITH TIME ZONE NULL;
ALTER TABLE IF EXISTS user_devices ADD COLUMN IF NOT EXISTS first_seen TIMESTAMP WITH TIME ZONE NULL;
ALTER TABLE IF EXISTS user_devices ADD COLUMN IF NOT EXISTS last_seen TIMESTAMP WITH TIME ZONE NULL;
ALTER TABLE IF EXISTS user_devices ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;
ALTER TABLE IF EXISTS user_devices ADD COLUMN IF NOT EXISTS is_approved BOOLEAN DEFAULT TRUE;

-- Create index on device_id
DROP INDEX IF EXISTS IDX_user_devices_device_id;
CREATE INDEX IF NOT EXISTS IDX_user_devices_device_id ON user_devices (device_id);

---------------------------------------------------------
-- Fix user_sessions table - Multiple column issues
---------------------------------------------------------

-- Add the columns that are missing
ALTER TABLE IF EXISTS user_sessions ADD COLUMN IF NOT EXISTS user_agent TEXT NULL;
ALTER TABLE IF EXISTS user_sessions ADD COLUMN IF NOT EXISTS device_id TEXT NULL;
ALTER TABLE IF EXISTS user_sessions ADD COLUMN IF NOT EXISTS token TEXT NULL;
ALTER TABLE IF EXISTS user_sessions ADD COLUMN IF NOT EXISTS ip_address TEXT NULL;
ALTER TABLE IF EXISTS user_sessions ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP WITH TIME ZONE NULL;
ALTER TABLE IF EXISTS user_sessions ADD COLUMN IF NOT EXISTS isActive BOOLEAN DEFAULT TRUE;
ALTER TABLE IF EXISTS user_sessions ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;
ALTER TABLE IF EXISTS user_sessions ADD COLUMN IF NOT EXISTS endedAt TIMESTAMP WITH TIME ZONE NULL;
ALTER TABLE IF EXISTS user_sessions ADD COLUMN IF NOT EXISTS duration INTEGER NULL;

-- Ensure proper column naming
-- Rename columns if they exist with the wrong case
DO $$
BEGIN
    -- Check if userAgent column exists but user_agent doesn't
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'user_devices' AND column_name = 'useragent'
    ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'user_devices' AND column_name = 'user_agent'
    ) THEN
        ALTER TABLE "user_devices" RENAME COLUMN "useragent" TO "user_agent";
    END IF;
    
    -- Check if deviceId column exists and device_id doesn't exist
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'user_devices' AND column_name = 'deviceid'
    ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'user_devices' AND column_name = 'device_id'
    ) THEN
        ALTER TABLE "user_devices" RENAME COLUMN "deviceid" TO "device_id";
    END IF;
    
    -- Check if is_active column exists but isActive doesn't in user_sessions
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'user_sessions' AND column_name = 'is_active'
    ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'user_sessions' AND column_name = 'isactive'
    ) THEN
        ALTER TABLE "user_sessions" RENAME COLUMN "is_active" TO "isActive";
    END IF;

    -- Check if lastIpAddress column exists but last_ip_address doesn't
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'user_devices' AND column_name = 'lastipaddress'
    ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'user_devices' AND column_name = 'last_ip_address'
    ) THEN
        ALTER TABLE "user_devices" RENAME COLUMN "lastipaddress" TO "last_ip_address";
    END IF;
END $$;