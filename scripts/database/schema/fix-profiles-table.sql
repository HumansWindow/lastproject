-- Migration to fix profile table column names (convert camelCase to snake_case)
-- Start transaction for safety
BEGIN;

-- Rename columns in profiles table
ALTER TABLE profiles 
  RENAME COLUMN "firstName" TO first_name;

ALTER TABLE profiles 
  RENAME COLUMN "lastName" TO last_name;

ALTER TABLE profiles 
  RENAME COLUMN "displayName" TO display_name;

ALTER TABLE profiles 
  RENAME COLUMN "avatarUrl" TO avatar_url;

ALTER TABLE profiles 
  RENAME COLUMN "uniqueId" TO unique_id;

ALTER TABLE profiles 
  RENAME COLUMN "visibilityLevel" TO visibility_level;

ALTER TABLE profiles 
  RENAME COLUMN "createdAt" TO created_at;

ALTER TABLE profiles 
  RENAME COLUMN "updatedAt" TO updated_at;

-- Add any other columns that need to be renamed here

-- Commit the transaction if everything succeeds
COMMIT;