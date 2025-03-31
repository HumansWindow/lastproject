-- Add user_agent column to user_sessions if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'user_sessions' 
        AND column_name = 'user_agent'
    ) THEN
        ALTER TABLE user_sessions ADD COLUMN user_agent TEXT NULL;
        RAISE NOTICE 'Added user_agent column to user_sessions table';
    ELSE
        RAISE NOTICE 'user_agent column already exists in user_sessions table';
    END IF;
END $$;

-- Check if we need to fix the deviceId/device_id issue in user_devices table
DO $$
BEGIN
    -- Check if deviceId column exists
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'user_devices' 
        AND column_name = 'deviceId'
    ) THEN
        -- Check if device_id column doesn't exist
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'user_devices' 
            AND column_name = 'device_id'
        ) THEN
            -- Rename deviceId column to device_id
            ALTER TABLE user_devices RENAME COLUMN "deviceId" TO "device_id";
            RAISE NOTICE 'Renamed deviceId column to device_id in user_devices table';
        ELSE
            RAISE NOTICE 'Both deviceId and device_id columns exist. This might require manual intervention.';
        END IF;
    ELSE
        -- If deviceId doesn't exist, check if device_id exists
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'user_devices' 
            AND column_name = 'device_id'
        ) THEN
            -- Add device_id column
            ALTER TABLE user_devices ADD COLUMN device_id VARCHAR(255) NOT NULL DEFAULT '';
            RAISE NOTICE 'Added device_id column to user_devices table';
        ELSE
            RAISE NOTICE 'device_id column already exists in user_devices table';
        END IF;
    END IF;
    
    -- Create index on device_id if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE tablename = 'user_devices' 
        AND indexname = 'IDX_user_devices_device_id'
    ) THEN
        CREATE INDEX "IDX_user_devices_device_id" ON user_devices ("device_id");
        RAISE NOTICE 'Created index on device_id column';
    ELSE
        RAISE NOTICE 'Index on device_id column already exists';
    END IF;
END $$;