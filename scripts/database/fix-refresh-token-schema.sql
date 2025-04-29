-- Fix for refresh_tokens and user_devices tables
DO $$
BEGIN
    -- Add expires_at column to refresh_tokens if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'refresh_tokens' 
        AND column_name = 'expires_at'
    ) THEN
        ALTER TABLE public.refresh_tokens ADD COLUMN expires_at TIMESTAMP WITH TIME ZONE;
        RAISE NOTICE 'Added expires_at column to refresh_tokens table';
    END IF;

    -- Fix column case issue in user_devices table - add userId column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'user_devices' 
        AND column_name = 'userId'
    ) THEN
        -- Add userId column that maps to the existing user_id column
        ALTER TABLE public.user_devices ADD COLUMN "userId" UUID;
        RAISE NOTICE 'Added userId column to user_devices table';
        
        -- Update the new column with values from user_id
        UPDATE public.user_devices SET "userId" = user_id;
        RAISE NOTICE 'Updated userId with values from user_id';
        
        -- Make userId not null after populating it
        ALTER TABLE public.user_devices ALTER COLUMN "userId" SET NOT NULL;
        RAISE NOTICE 'Made userId column NOT NULL';
    END IF;
END $$;

-- Fix for refresh_tokens table schema - simplified version to avoid syntax errors
DO $$
DECLARE
  column_exists BOOLEAN;
BEGIN
  -- Check if expiresAt column exists
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'refresh_tokens' AND column_name = 'expiresAt'
  ) INTO column_exists;

  IF column_exists THEN
    RAISE NOTICE 'expiresAt column already exists in refresh_tokens table';
  ELSE
    -- Check if expires_at exists
    SELECT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'refresh_tokens' AND column_name = 'expires_at'
    ) INTO column_exists;
    
    IF column_exists THEN
      -- Rename column to match what the code expects
      RAISE NOTICE 'Renaming expires_at column to expiresAt in refresh_tokens table';
      ALTER TABLE public.refresh_tokens RENAME COLUMN expires_at TO "expiresAt";
    ELSE
      -- Create expiresAt column if it doesn't exist
      RAISE NOTICE 'Adding expiresAt column to refresh_tokens table';
      ALTER TABLE public.refresh_tokens ADD COLUMN "expiresAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW() + INTERVAL '7 days';
    END IF;
  END IF;
END $$;

-- Check if user_id column in refresh_tokens is properly set up
DO $$
DECLARE
  column_exists BOOLEAN;
BEGIN
  -- Check if user_id column exists
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'refresh_tokens' AND column_name = 'user_id'
  ) INTO column_exists;

  IF column_exists THEN
    -- Make sure user_id is NOT NULL
    RAISE NOTICE 'Setting user_id to NOT NULL in refresh_tokens table';
    ALTER TABLE public.refresh_tokens ALTER COLUMN user_id SET NOT NULL;
  ELSE
    -- Check if userId exists (camelCase version)
    SELECT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'refresh_tokens' AND column_name = 'userId'
    ) INTO column_exists;
    
    IF column_exists THEN
      -- Already has userId column, rename to user_id
      RAISE NOTICE 'Renaming userId column to user_id in refresh_tokens table';
      ALTER TABLE public.refresh_tokens RENAME COLUMN "userId" TO user_id;
      ALTER TABLE public.refresh_tokens ALTER COLUMN user_id SET NOT NULL;
    ELSE
      RAISE NOTICE 'No user_id or userId column found in refresh_tokens table';
    END IF;
  END IF;
END $$;

-- Add created_at column if it doesn't exist
DO $$
DECLARE
  column_exists BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'refresh_tokens' AND column_name = 'created_at'
  ) INTO column_exists;

  IF column_exists THEN
    RAISE NOTICE 'created_at column already exists in refresh_tokens table';
  ELSE
    RAISE NOTICE 'Adding created_at column to refresh_tokens table';
    ALTER TABLE public.refresh_tokens ADD COLUMN created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW();
  END IF;
END $$;

-- Fix user_devices table to include wallet_addresses column
DO $$
DECLARE
  column_exists BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_devices' AND column_name = 'wallet_addresses'
  ) INTO column_exists;

  IF column_exists THEN
    RAISE NOTICE 'wallet_addresses column already exists in user_devices table';
  ELSE
    RAISE NOTICE 'Adding wallet_addresses column to user_devices table';
    ALTER TABLE public.user_devices ADD COLUMN wallet_addresses JSONB DEFAULT '[]'::jsonb;
  END IF;
END $$;

RAISE NOTICE 'Database schema fixes applied successfully.';

-- Create a function to keep columns in sync (in a separate transaction)
DO $$
BEGIN
    -- Create or replace a function to sync the columns
    DROP FUNCTION IF EXISTS sync_user_id_columns CASCADE;
    
    CREATE OR REPLACE FUNCTION sync_user_id_columns()
    RETURNS TRIGGER AS 
    $BODY$
    BEGIN
        IF TG_OP = 'INSERT' THEN
            IF NEW.user_id IS NULL AND NEW."userId" IS NOT NULL THEN
                NEW.user_id := NEW."userId";
            ELSIF NEW."userId" IS NULL AND NEW.user_id IS NOT NULL THEN
                NEW."userId" := NEW.user_id;
            END IF;
        ELSIF TG_OP = 'UPDATE' THEN
            IF OLD.user_id IS DISTINCT FROM NEW.user_id AND OLD."userId" = NEW."userId" THEN
                NEW."userId" := NEW.user_id;
            ELSIF OLD."userId" IS DISTINCT FROM NEW."userId" AND OLD.user_id = NEW.user_id THEN
                NEW.user_id := NEW."userId";
            END IF;
        END IF;
        RETURN NEW;
    END;
    $BODY$
    LANGUAGE plpgsql;

    -- Drop the trigger if it exists
    DROP TRIGGER IF EXISTS sync_user_id_trigger ON public.user_devices;
    
    -- Create the trigger
    CREATE TRIGGER sync_user_id_trigger
    BEFORE INSERT OR UPDATE ON public.user_devices
    FOR EACH ROW
    EXECUTE FUNCTION sync_user_id_columns();
    
    RAISE NOTICE 'Created trigger to keep user_id and userId columns in sync';
END $$;

-- Fix for refresh_tokens table to address wallet authentication issues
DO $$
DECLARE
  table_exists BOOLEAN;
BEGIN
  -- Check if refresh_tokens table exists
  SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'refresh_tokens'
  ) INTO table_exists;

  IF table_exists THEN
    RAISE NOTICE 'Fixing refresh_tokens table...';

    -- Create a backup of the current table
    CREATE TABLE IF NOT EXISTS public.refresh_tokens_backup AS SELECT * FROM public.refresh_tokens;
    RAISE NOTICE 'Created backup of refresh_tokens table';

    -- Fix user_id and userId reference - make sure they're in sync
    -- First ensure both columns exist
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'refresh_tokens' AND column_name = 'user_id'
      ) THEN
        ALTER TABLE public.refresh_tokens ADD COLUMN user_id UUID;
        RAISE NOTICE 'Added user_id column';
      END IF;
      
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'refresh_tokens' AND column_name = 'userId'
      ) THEN
        ALTER TABLE public.refresh_tokens ADD COLUMN "userId" UUID;
        RAISE NOTICE 'Added userId column';
      END IF;

      -- Sync values between the columns
      UPDATE public.refresh_tokens SET "userId" = user_id WHERE "userId" IS NULL AND user_id IS NOT NULL;
      UPDATE public.refresh_tokens SET user_id = "userId" WHERE user_id IS NULL AND "userId" IS NOT NULL;
      RAISE NOTICE 'Synchronized user_id and userId values';

      -- Fix expiresAt and expires_at - ensure both exist and are synced
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'refresh_tokens' AND column_name = 'expiresAt'
      ) THEN
        ALTER TABLE public.refresh_tokens ADD COLUMN "expiresAt" TIMESTAMP WITH TIME ZONE;
        RAISE NOTICE 'Added expiresAt column';
      END IF;
      
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'refresh_tokens' AND column_name = 'expires_at'
      ) THEN
        ALTER TABLE public.refresh_tokens ADD COLUMN expires_at TIMESTAMP WITH TIME ZONE;
        RAISE NOTICE 'Added expires_at column';
      END IF;

      -- Sync values between the expiry date columns
      UPDATE public.refresh_tokens 
      SET "expiresAt" = expires_at 
      WHERE "expiresAt" IS NULL AND expires_at IS NOT NULL;
      
      UPDATE public.refresh_tokens 
      SET expires_at = "expiresAt" 
      WHERE expires_at IS NULL AND "expiresAt" IS NOT NULL;
      
      -- Set default values for null expires dates to 7 days from creation date
      UPDATE public.refresh_tokens 
      SET "expiresAt" = COALESCE("createdAt", created_at, NOW()) + INTERVAL '7 days' 
      WHERE "expiresAt" IS NULL;
      
      UPDATE public.refresh_tokens 
      SET expires_at = "expiresAt" 
      WHERE expires_at IS NULL;
      
      RAISE NOTICE 'Synchronized expiry date values';

      -- Make required columns NOT NULL
      BEGIN
        ALTER TABLE public.refresh_tokens ALTER COLUMN "expiresAt" SET NOT NULL;
        RAISE NOTICE 'Set expiresAt to NOT NULL';
      EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Could not set expiresAt to NOT NULL: %', SQLERRM;
      END;

      BEGIN
        ALTER TABLE public.refresh_tokens ALTER COLUMN user_id SET NOT NULL;
        RAISE NOTICE 'Set user_id to NOT NULL';
      EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Could not set user_id to NOT NULL: %', SQLERRM;
      END;

      BEGIN
        ALTER TABLE public.refresh_tokens ALTER COLUMN "userId" SET NOT NULL;
        RAISE NOTICE 'Set userId to NOT NULL';
      EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Could not set userId to NOT NULL: %', SQLERRM;
      END;
      
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'Error updating refresh_tokens table: %', SQLERRM;
    END;
    
    -- Create a trigger to keep the columns in sync
    BEGIN
      -- Create or replace a function to sync the columns
      CREATE OR REPLACE FUNCTION sync_refresh_token_columns()
      RETURNS TRIGGER AS 
      $BODY$
      BEGIN
          -- Sync user ID columns
          IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
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
          END IF;
          RETURN NEW;
      END;
      $BODY$
      LANGUAGE plpgsql;

      -- Drop the trigger if it exists
      DROP TRIGGER IF EXISTS sync_refresh_token_columns_trigger ON public.refresh_tokens;
      
      -- Create the trigger
      CREATE TRIGGER sync_refresh_token_columns_trigger
      BEFORE INSERT OR UPDATE ON public.refresh_tokens
      FOR EACH ROW
      EXECUTE FUNCTION sync_refresh_token_columns();
      
      RAISE NOTICE 'Created trigger to keep refresh_token columns in sync';
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'Error creating sync trigger: %', SQLERRM;
    END;

    -- Fix foreign key constraints if needed
    BEGIN
      -- Check if foreign key constraints exist and are valid
      IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'refresh_tokens_user_id_fkey' 
        AND constraint_type = 'FOREIGN KEY'
      ) THEN
        RAISE NOTICE 'Foreign key constraint refresh_tokens_user_id_fkey exists';
        
        -- Attempt to fix any rows that violate the constraint
        WITH invalid_rows AS (
          SELECT r.id, r.user_id 
          FROM public.refresh_tokens r
          LEFT JOIN public.users u ON r.user_id = u.id
          WHERE u.id IS NULL AND r.user_id IS NOT NULL
        )
        DELETE FROM public.refresh_tokens r
        WHERE r.id IN (SELECT id FROM invalid_rows);
        
        RAISE NOTICE 'Removed rows that violate foreign key constraints';
      END IF;
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'Error checking/fixing foreign key constraints: %', SQLERRM;
    END;
  ELSE
    RAISE NOTICE 'refresh_tokens table does not exist';
  END IF;
END $$;

-- Set all NULL expiresAt values to a default value
DO $$
BEGIN
  UPDATE public.refresh_tokens 
  SET "expiresAt" = NOW() + INTERVAL '7 days'
  WHERE "expiresAt" IS NULL;
  
  RAISE NOTICE 'Updated NULL expiresAt values';
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Error updating NULL values: %', SQLERRM;
END $$;

-- Show the updated table structure
DO $$
DECLARE
  row_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO row_count FROM public.refresh_tokens;
  RAISE NOTICE 'refresh_tokens table now has % rows', row_count;
  
  RAISE NOTICE 'Schema fix completed successfully';
END $$;