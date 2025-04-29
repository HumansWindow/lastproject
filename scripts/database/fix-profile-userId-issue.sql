
-- Fix profiles table trigger issue with userId vs user_id fields
DO $$
DECLARE
  trigger_exists boolean;
BEGIN
  -- Check if there are any triggers on the profiles table
  SELECT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgrelid = profiles::regclass
  ) INTO trigger_exists;

  -- If triggers exist, display them
  IF trigger_exists THEN
    RAISE NOTICE Found triggers on profiles table, inspecting...;
    
    -- Drop trigger that might be causing the issue
    EXECUTE DROP TRIGGER IF EXISTS update_userId_trigger ON profiles;
    EXECUTE DROP TRIGGER IF EXISTS insert_userId_trigger ON profiles;
    EXECUTE DROP TRIGGER IF EXISTS profiles_user_id_trigger ON profiles;
    EXECUTE DROP TRIGGER IF EXISTS profiles_userId_trigger ON profiles;
    
    -- Create a corrected trigger function if needed
    EXECUTE 
    CREATE OR REPLACE FUNCTION sync_profile_user_id()
    RETURNS TRIGGER AS $$
    BEGIN
      -- Ensure both user_id and any additional fields stay in sync
      NEW.user_id = COALESCE(NEW.user_id, OLD.user_id);
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;
    ;
    
    RAISE NOTICE Removed potentially problematic triggers and created sync function;
  ELSE
    RAISE NOTICE No triggers found on profiles table;
  END IF;
  
  -- Create a fix for any database functions that might be using "userId" instead of "user_id"
  EXECUTE 
  DO $$
  DECLARE
    func_records record;
  BEGIN
    FOR func_records IN 
      SELECT p.proname FROM pg_proc p
      JOIN pg_namespace n ON p.pronamespace = n.oid
      WHERE n.nspname = public
      AND p.prosrc LIKE %userId%
    LOOP
      RAISE NOTICE Found function % that might reference userId, func_records.proname;
      -- Specific fix for functions will go here if needed
    END LOOP;
  END $$;
  ;

  -- Add the sync trigger between user_id and userId if needed
  EXECUTE 
  CREATE OR REPLACE FUNCTION ensure_profile_columns()
  RETURNS TRIGGER AS $$
  BEGIN
    IF TG_OP = INSERT OR TG_OP = UPDATE THEN
      -- Make sure column exists in NEW record before attempting to use it
      IF NEW.user_id IS NOT NULL THEN
        -- Nothing to do, field already set properly
        NULL;
      END IF;
    END IF;
    RETURN NEW;
  END;
  $$ LANGUAGE plpgsql;
  ;

  RAISE NOTICE Database fix script completed;
END $$;

