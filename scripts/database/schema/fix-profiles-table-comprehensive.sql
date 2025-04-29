-- Migration to fix all profile table column names (convert camelCase to snake_case)
-- Start transaction for safety
BEGIN;

-- Rename all camelCase columns in profiles table to snake_case
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
  RENAME COLUMN "postalCode" TO postal_code;

ALTER TABLE profiles 
  RENAME COLUMN "dateFormat" TO date_format;

ALTER TABLE profiles 
  RENAME COLUMN "timeFormat" TO time_format;

ALTER TABLE profiles 
  RENAME COLUMN "phoneNumber" TO phone_number;

ALTER TABLE profiles 
  RENAME COLUMN "twitterHandle" TO twitter_handle;

ALTER TABLE profiles 
  RENAME COLUMN "instagramHandle" TO instagram_handle;

ALTER TABLE profiles 
  RENAME COLUMN "linkedinProfile" TO linkedin_profile;

ALTER TABLE profiles 
  RENAME COLUMN "telegramHandle" TO telegram_handle;

ALTER TABLE profiles 
  RENAME COLUMN "locationVisibility" TO location_visibility;

ALTER TABLE profiles 
  RENAME COLUMN "profileVisibility" TO profile_visibility;

ALTER TABLE profiles 
  RENAME COLUMN "emailNotifications" TO email_notifications;

ALTER TABLE profiles 
  RENAME COLUMN "pushNotifications" TO push_notifications;

ALTER TABLE profiles 
  RENAME COLUMN "createdAt" TO created_at;

ALTER TABLE profiles 
  RENAME COLUMN "updatedAt" TO updated_at;

ALTER TABLE profiles 
  RENAME COLUMN "lastLocationUpdate" TO last_location_update;

-- Commit the transaction if everything succeeds
COMMIT;