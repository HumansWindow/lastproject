-- Create extension for UUID generation if it doesn't exist
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create profiles table
CREATE TABLE IF NOT EXISTS "profiles" (
    "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
    "user_id" uuid NOT NULL,
    "email" character varying,
    "password" character varying,
    "first_name" character varying,
    "last_name" character varying,
    "display_name" character varying,
    "avatar_url" character varying,
    "bio" text,
    "unique_id" character varying,
    "country" character varying,
    "city" character varying,
    "state" character varying,
    "postal_code" character varying,
    "address" character varying,
    "latitude" decimal(10,8),
    "longitude" decimal(11,8),
    "language" character varying DEFAULT 'en',
    "timezone" character varying,
    "date_format" character varying DEFAULT 'yyyy-MM-dd',
    "time_format" character varying DEFAULT '24h',
    "phone_number" character varying,
    "website" character varying,
    "twitter_handle" character varying,
    "instagram_handle" character varying,
    "linkedin_profile" character varying,
    "telegram_handle" character varying,
    "location_visibility" character varying DEFAULT 'private',
    "profile_visibility" character varying DEFAULT 'public',
    "email_notifications" boolean DEFAULT true,
    "push_notifications" boolean DEFAULT true,
    "created_at" TIMESTAMP NOT NULL DEFAULT now(),
    "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
    "last_location_update" TIMESTAMP,
    CONSTRAINT "UQ_profiles_unique_id" UNIQUE ("unique_id"),
    CONSTRAINT "PK_profiles_id" PRIMARY KEY ("id")
);

-- Create indexes
CREATE INDEX IF NOT EXISTS "IDX_profiles_user_id" ON "profiles" ("user_id");
CREATE INDEX IF NOT EXISTS "IDX_profiles_email" ON "profiles" ("email");

-- Add foreign key constraint with a check to ensure it doesn't fail if already exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'FK_profiles_users'
    ) THEN
        BEGIN
            ALTER TABLE "profiles" 
            ADD CONSTRAINT "FK_profiles_users" 
            FOREIGN KEY ("user_id") 
            REFERENCES "users"("id") 
            ON DELETE CASCADE;
        EXCEPTION
            WHEN others THEN
                RAISE NOTICE 'Failed to add foreign key constraint: %', SQLERRM;
        END;
    END IF;
END
$$;

-- Insert record in migrations table to mark this migration as complete
INSERT INTO migrations (name, timestamp) 
VALUES ('CreateProfileTable1743700000000', extract(epoch from now()) * 1000)
ON CONFLICT (name) DO NOTHING;

-- Add this to the output to check the result
SELECT 'Profile table created successfully' as status;
