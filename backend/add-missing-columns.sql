-- Add user_agent column to user_sessions table if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_sessions' AND column_name = 'user_agent'
  ) THEN
    ALTER TABLE user_sessions ADD COLUMN user_agent TEXT NULL;
    RAISE NOTICE 'Added user_agent column to user_sessions table';
  ELSE
    RAISE NOTICE 'user_agent column already exists in user_sessions table';
  END IF;
END $$;

-- Create index on device_id in user_devices table if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE tablename = 'user_devices' AND indexname = 'IDX_user_devices_device_id'
  ) THEN
    CREATE INDEX "IDX_user_devices_device_id" ON user_devices ("device_id");
    RAISE NOTICE 'Created index on device_id column in user_devices table';
  ELSE
    RAISE NOTICE 'Index on device_id column already exists in user_devices table';
  END IF;
END $$;

-- Ensure wallet_addresses column exists in user_devices table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_devices' AND column_name = 'wallet_addresses'
  ) THEN
    ALTER TABLE user_devices ADD COLUMN wallet_addresses TEXT NULL;
    RAISE NOTICE 'Added wallet_addresses column to user_devices table';
  ELSE
    RAISE NOTICE 'wallet_addresses column already exists in user_devices table';
  END IF;
END $$;

-- Add name column to user_devices table if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_devices' AND column_name = 'name'
  ) THEN
    ALTER TABLE user_devices ADD COLUMN name TEXT NULL;
    RAISE NOTICE 'Added name column to user_devices table';
  ELSE
    RAISE NOTICE 'name column already exists in user_devices table';
  END IF;
END $$;