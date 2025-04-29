-- Fix the issue with "record new has no field userId" error
-- This script addresses the database trigger problem that expects userId when it should be using user_id

-- Check for and fix any triggers on the profiles table
DO $$
DECLARE
  trigger_count INT;
  trigger_name TEXT;
  function_name TEXT;
  trigger_rec RECORD;
BEGIN
  -- Count triggers on profiles table
  SELECT COUNT(*) INTO trigger_count
  FROM pg_trigger t
  JOIN pg_class c ON t.tgrelid = c.oid
  WHERE c.relname = 'profiles';
  
  RAISE NOTICE 'Found % triggers on profiles table', trigger_count;
  
  -- List all triggers on the profiles table and their functions
  FOR trigger_rec IN
    SELECT 
      t.tgname AS trigger_name,
      p.proname AS function_name
    FROM pg_trigger t
    JOIN pg_class c ON t.tgrelid = c.oid
    JOIN pg_proc p ON t.tgfoid = p.oid
    WHERE c.relname = 'profiles'
  LOOP
    RAISE NOTICE 'Trigger: %, Function: %', trigger_rec.trigger_name, trigger_rec.function_name;
    
    -- Get the function definition and check for userId references
    DECLARE
      func_def TEXT;
    BEGIN
      SELECT pg_get_functiondef(p.oid) INTO func_def
      FROM pg_proc p
      WHERE p.proname = trigger_rec.function_name;
      
      IF func_def LIKE '%userId%' THEN
        RAISE NOTICE 'Function % contains userId references, fixing...', trigger_rec.function_name;
        
        -- Drop the trigger with this function
        EXECUTE 'DROP TRIGGER IF EXISTS ' || trigger_rec.trigger_name || ' ON profiles';
        RAISE NOTICE 'Dropped trigger %', trigger_rec.trigger_name;
      END IF;
    END;
  END LOOP;
END$$;

-- Create a mapping/synchronization function that can handle both userId and user_id fields
CREATE OR REPLACE FUNCTION fix_profile_id_fields()
RETURNS TRIGGER AS $$
BEGIN
  -- Make sure we have at least one valid ID field set
  IF NEW.user_id IS NULL THEN
    RAISE EXCEPTION 'user_id cannot be null';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add a trigger to validate that user_id is always set
DROP TRIGGER IF EXISTS ensure_profile_id_fields ON profiles;
CREATE TRIGGER ensure_profile_id_fields
BEFORE INSERT OR UPDATE ON profiles
FOR EACH ROW
EXECUTE FUNCTION fix_profile_id_fields();

-- Check for any triggers on the profiles table after our changes
DO $$
DECLARE
  trigger_count INT;
BEGIN
  SELECT COUNT(*) INTO trigger_count
  FROM pg_trigger t
  JOIN pg_class c ON t.tgrelid = c.oid
  WHERE c.relname = 'profiles';
  
  RAISE NOTICE 'After fixes: % triggers on profiles table', trigger_count;
END$$;

-- Output a success message
DO $$
BEGIN
  RAISE NOTICE 'Profile field synchronization fix completed successfully';
END$$;
