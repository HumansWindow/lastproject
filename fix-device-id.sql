-- Fix deviceId column in user_devices table
DO $$
BEGIN
  -- Add deviceId column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'user_devices' 
    AND column_name = 'deviceId'
  ) THEN
    ALTER TABLE public.user_devices ADD COLUMN "deviceId" VARCHAR;
    RAISE NOTICE 'Added deviceId column to user_devices table';
  END IF;

  -- Set deviceId equal to device_id for existing rows
  UPDATE public.user_devices 
  SET "deviceId" = device_id 
  WHERE "deviceId" IS NULL AND device_id IS NOT NULL;
  
  -- Make deviceId NOT NULL
  ALTER TABLE public.user_devices ALTER COLUMN "deviceId" SET NOT NULL;
  RAISE NOTICE 'Made deviceId column NOT NULL';
  
  -- Create a trigger to keep deviceId and device_id in sync
  DROP TRIGGER IF EXISTS sync_device_id_trigger ON public.user_devices;
  
  CREATE OR REPLACE FUNCTION sync_device_id_columns()
  RETURNS TRIGGER AS 
  $BODY$
  BEGIN
    IF TG_OP = 'INSERT' THEN
      IF NEW.device_id IS NULL AND NEW."deviceId" IS NOT NULL THEN
        NEW.device_id := NEW."deviceId";
      ELSIF NEW."deviceId" IS NULL AND NEW.device_id IS NOT NULL THEN
        NEW."deviceId" := NEW.device_id;
      END IF;
    ELSIF TG_OP = 'UPDATE' THEN
      IF OLD.device_id IS DISTINCT FROM NEW.device_id AND OLD."deviceId" = NEW."deviceId" THEN
        NEW."deviceId" := NEW.device_id;
      ELSIF OLD."deviceId" IS DISTINCT FROM NEW."deviceId" AND OLD.device_id = NEW.device_id THEN
        NEW.device_id := NEW."deviceId";
      END IF;
    END IF;
    RETURN NEW;
  END;
  $BODY$
  LANGUAGE plpgsql;

  CREATE TRIGGER sync_device_id_trigger
  BEFORE INSERT OR UPDATE ON public.user_devices
  FOR EACH ROW
  EXECUTE FUNCTION sync_device_id_columns();
  
  RAISE NOTICE 'Created trigger to keep device_id and deviceId columns in sync';
END $$;
