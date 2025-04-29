-- Fix user_id column in refresh_tokens table
DO $$
BEGIN
  -- Check if userId exists
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'refresh_tokens' 
    AND column_name = 'userId'
  ) THEN
    -- Add user_id column if it doesn't exist
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'refresh_tokens' 
      AND column_name = 'user_id'
    ) THEN
      ALTER TABLE public.refresh_tokens ADD COLUMN user_id UUID;
      RAISE NOTICE 'Added user_id column to refresh_tokens table';
      
      -- Copy data from userId to user_id
      UPDATE public.refresh_tokens SET user_id = "userId" WHERE user_id IS NULL;
      RAISE NOTICE 'Copied data from userId to user_id column';
    END IF;
  ELSE
    -- If userId doesn't exist, create it
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'refresh_tokens' 
      AND column_name = 'user_id'
    ) THEN
      ALTER TABLE public.refresh_tokens ADD COLUMN user_id UUID;
      RAISE NOTICE 'Added user_id column to refresh_tokens table';
    END IF;
    
    -- Also add userId column for compatibility
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'refresh_tokens' 
      AND column_name = 'userId'
    ) THEN
      ALTER TABLE public.refresh_tokens ADD COLUMN "userId" UUID;
      RAISE NOTICE 'Added userId column to refresh_tokens table';
    END IF;
  END IF;
  
  -- Create a trigger to keep userId and user_id in sync
  DROP TRIGGER IF EXISTS sync_refresh_user_id_trigger ON public.refresh_tokens;
  
  CREATE OR REPLACE FUNCTION sync_refresh_user_id_columns()
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

  CREATE TRIGGER sync_refresh_user_id_trigger
  BEFORE INSERT OR UPDATE ON public.refresh_tokens
  FOR EACH ROW
  EXECUTE FUNCTION sync_refresh_user_id_columns();
  
  RAISE NOTICE 'Created trigger to keep user_id and userId columns in sync in refresh_tokens table';
END $$;
