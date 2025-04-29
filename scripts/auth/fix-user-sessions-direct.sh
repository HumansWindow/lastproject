#!/bin/bash
echo "Applying direct fix to user_sessions table..."

PGPASSWORD=Aliveadmin psql -h localhost -U Aliveadmin -d Alive-Db << SQL
-- Direct fix for user_sessions table
DO \$\$
BEGIN
    -- Check if user_sessions table exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'user_sessions') THEN
        RAISE NOTICE 'user_sessions table does not exist, nothing to fix';
        RETURN;
    END IF;

    -- Fix both user_id and userId columns
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'user_sessions' 
        AND column_name = 'userId'
    ) THEN
        RAISE NOTICE 'userId column exists';
    ELSE
        ALTER TABLE public.user_sessions ADD COLUMN "userId" UUID;
        RAISE NOTICE 'Added userId column';
    END IF;

    -- Make sure we have both columns and they sync
    ALTER TABLE public.user_sessions ALTER COLUMN "userId" DROP NOT NULL;
    
    -- Update userId values from user_id where null
    UPDATE public.user_sessions 
    SET "userId" = user_id 
    WHERE "userId" IS NULL AND user_id IS NOT NULL;
    
    -- Update user_id values from userId where null
    UPDATE public.user_sessions 
    SET user_id = "userId" 
    WHERE user_id IS NULL AND "userId" IS NOT NULL;
    
    -- Create trigger if it doesn't exist
    DROP TRIGGER IF EXISTS sync_user_sessions_id_trigger ON public.user_sessions;
    
    CREATE OR REPLACE FUNCTION sync_user_sessions_ids()
    RETURNS TRIGGER AS \$\$
    BEGIN
        IF NEW.user_id IS NOT NULL AND NEW."userId" IS NULL THEN
            NEW."userId" := NEW.user_id;
        ELSIF NEW."userId" IS NOT NULL AND NEW.user_id IS NULL THEN
            NEW.user_id := NEW."userId";
        END IF;
        RETURN NEW;
    END;
    \$\$ LANGUAGE plpgsql;
    
    CREATE TRIGGER sync_user_sessions_id_trigger
    BEFORE INSERT OR UPDATE ON public.user_sessions
    FOR EACH ROW EXECUTE FUNCTION sync_user_sessions_ids();
    
    RAISE NOTICE 'user_sessions table fixed with synchronization trigger';
END \$\$;
SQL

echo "Schema fix completed. Restarting backend server..."
cd /home/alivegod/Desktop/LastProjectendpoint/LastProject/backend && npm run start:dev
