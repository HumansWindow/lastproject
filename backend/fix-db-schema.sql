-- Fix user_devices table
DO $$
BEGIN
    -- Add the user_agent column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'user_devices' AND column_name = 'user_agent'
    ) THEN
        ALTER TABLE "user_devices" ADD COLUMN "user_agent" TEXT NULL;
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

    -- Add device_id column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'user_devices' AND column_name = 'device_id'
    ) THEN
        ALTER TABLE "user_devices" ADD COLUMN "device_id" VARCHAR(255) NULL;
    END IF;

    -- Fix user_sessions table
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'user_sessions' AND column_name = 'user_agent'
    ) THEN
        ALTER TABLE "user_sessions" ADD COLUMN "user_agent" TEXT NULL;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'user_sessions' AND column_name = 'isactive'
    ) THEN
        ALTER TABLE "user_sessions" ADD COLUMN "isActive" BOOLEAN DEFAULT TRUE;
    END IF;

    -- Try to create index if we have permissions
    BEGIN
        CREATE INDEX IF NOT EXISTS "IDX_user_devices_device_id" ON "user_devices" ("device_id");
        EXCEPTION WHEN insufficient_privilege THEN
            RAISE NOTICE 'No permission to create index on user_devices';
    END;

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