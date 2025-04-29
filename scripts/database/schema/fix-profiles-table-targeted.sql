-- Migration to fix remaining profile table column names (convert camelCase to snake_case)
-- Start transaction for safety
BEGIN;

-- Rename the remaining camelCase columns in profiles table to snake_case
ALTER TABLE profiles 
  RENAME COLUMN "userId" TO user_id_new;

-- Other columns may need to be added if there are still camelCase columns
-- Add missing columns that are expected by the backend
DO $$
BEGIN
  -- Add country column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='country') THEN
    ALTER TABLE profiles ADD COLUMN country character varying;
  END IF;

  -- Add city column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='city') THEN
    ALTER TABLE profiles ADD COLUMN city character varying;
  END IF;

  -- Add state column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='state') THEN
    ALTER TABLE profiles ADD COLUMN state character varying;
  END IF;

  -- Add postal_code column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='postal_code') THEN
    ALTER TABLE profiles ADD COLUMN postal_code character varying;
  END IF;

  -- Add address column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='address') THEN
    ALTER TABLE profiles ADD COLUMN address character varying;
  END IF;

  -- Add latitude column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='latitude') THEN
    ALTER TABLE profiles ADD COLUMN latitude decimal(10,8);
  END IF;

  -- Add longitude column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='longitude') THEN
    ALTER TABLE profiles ADD COLUMN longitude decimal(11,8);
  END IF;

  -- Add language column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='language') THEN
    ALTER TABLE profiles ADD COLUMN language character varying DEFAULT 'en';
  END IF;

  -- Add timezone column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='timezone') THEN
    ALTER TABLE profiles ADD COLUMN timezone character varying;
  END IF;

  -- Add date_format column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='date_format') THEN
    ALTER TABLE profiles ADD COLUMN date_format character varying DEFAULT 'yyyy-MM-dd';
  END IF;

  -- Add time_format column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='time_format') THEN
    ALTER TABLE profiles ADD COLUMN time_format character varying DEFAULT '24h';
  END IF;

  -- Add phone_number column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='phone_number') THEN
    ALTER TABLE profiles ADD COLUMN phone_number character varying;
  END IF;

  -- Add website column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='website') THEN
    ALTER TABLE profiles ADD COLUMN website character varying;
  END IF;

  -- Add social media columns if they don't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='twitter_handle') THEN
    ALTER TABLE profiles ADD COLUMN twitter_handle character varying;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='instagram_handle') THEN
    ALTER TABLE profiles ADD COLUMN instagram_handle character varying;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='linkedin_profile') THEN
    ALTER TABLE profiles ADD COLUMN linkedin_profile character varying;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='telegram_handle') THEN
    ALTER TABLE profiles ADD COLUMN telegram_handle character varying;
  END IF;

  -- Add location_visibility column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='location_visibility') THEN
    ALTER TABLE profiles ADD COLUMN location_visibility character varying DEFAULT 'PRIVATE';
  END IF;

  -- Add profile_visibility column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='profile_visibility') THEN
    ALTER TABLE profiles ADD COLUMN profile_visibility character varying DEFAULT 'PUBLIC';
  END IF;

  -- Add notification columns if they don't exist  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='email_notifications') THEN
    ALTER TABLE profiles ADD COLUMN email_notifications boolean DEFAULT true;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='push_notifications') THEN
    ALTER TABLE profiles ADD COLUMN push_notifications boolean DEFAULT true;
  END IF;

  -- Add last_location_update column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='last_location_update') THEN
    ALTER TABLE profiles ADD COLUMN last_location_update timestamp;
  END IF;
END $$;

-- Update constraints and foreign keys to use the new column name
ALTER TABLE profiles
  DROP CONSTRAINT IF EXISTS profiles_user_id_fkey;

ALTER TABLE profiles
  ADD CONSTRAINT profiles_user_id_fkey FOREIGN KEY (user_id_new) REFERENCES users(id) ON DELETE CASCADE;

-- Drop old index if it exists
DROP INDEX IF EXISTS idx_profile_user_id;

-- Create index on the new column
CREATE INDEX IF NOT EXISTS idx_profile_user_id ON profiles(user_id_new);

-- Finally, drop the redundant column (if needed)
-- We need to check if both user_id and user_id_new exist to avoid errors
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='user_id') AND
     EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='user_id_new') THEN
    ALTER TABLE profiles DROP COLUMN user_id;
    ALTER TABLE profiles RENAME COLUMN user_id_new TO user_id;
  END IF;
END $$;

-- Commit the transaction if everything succeeds
COMMIT;