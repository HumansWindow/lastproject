-- This script must be run by a PostgreSQL superuser

-- Add missing columns to user_sessions table
ALTER TABLE IF EXISTS user_sessions ADD COLUMN IF NOT EXISTS user_agent TEXT NULL;
ALTER TABLE IF EXISTS user_sessions ADD COLUMN IF NOT EXISTS isActive BOOLEAN DEFAULT TRUE;

-- Add missing columns to user_devices table
ALTER TABLE IF EXISTS user_devices ADD COLUMN IF NOT EXISTS name TEXT NULL;
ALTER TABLE IF EXISTS user_devices ADD COLUMN IF NOT EXISTS wallet_addresses TEXT NULL;
ALTER TABLE IF EXISTS user_devices ADD COLUMN IF NOT EXISTS user_agent TEXT NULL;

-- Add necessary indices
DROP INDEX IF EXISTS IDX_user_devices_device_id;
CREATE INDEX IF NOT EXISTS IDX_user_devices_device_id ON user_devices (device_id);

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
    
    -- Check if is_active column exists but isActive doesn't
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'user_sessions' AND column_name = 'is_active'
    ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'user_sessions' AND column_name = 'isactive'
    ) THEN
        ALTER TABLE "user_sessions" RENAME COLUMN "is_active" TO "isActive";
    END IF;
END $$;