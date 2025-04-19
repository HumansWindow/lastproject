-- Database initialization SQL script
-- This script creates all necessary tables for wallet authentication
-- Run with: psql -U Aliveadmin -d Alive-Db -f initialize-db.sql

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop tables if they exist (in reverse order of dependencies)
DROP TABLE IF EXISTS refresh_tokens CASCADE;
DROP TABLE IF EXISTS user_sessions CASCADE;
DROP TABLE IF EXISTS user_devices CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;
DROP TABLE IF EXISTS wallets CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Create users table
CREATE TABLE users (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  username varchar,
  email varchar,
  password varchar,
  first_name varchar,
  last_name varchar,
  avatar_url varchar,
  is_active boolean DEFAULT true,
  is_verified boolean DEFAULT false,
  is_admin boolean DEFAULT false,
  role varchar DEFAULT 'user',
  wallet_address varchar,
  referral_code varchar,
  referred_by_id uuid,
  referral_tier integer DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create wallets table
CREATE TABLE wallets (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  address varchar NOT NULL,
  private_key varchar,
  chain varchar DEFAULT 'ETH',
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  is_active boolean DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  CONSTRAINT UQ_wallet_address UNIQUE (address)
);

-- Create profiles table
CREATE TABLE profiles (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  email varchar,
  password varchar,
  first_name varchar,
  last_name varchar,
  display_name varchar,
  avatar_url varchar,
  bio text,
  unique_id varchar UNIQUE,
  visibility_level varchar DEFAULT 'public',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create user_devices table
CREATE TABLE user_devices (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  device_id varchar(255) NOT NULL,
  device_type varchar(50) DEFAULT 'unknown',
  name varchar(255),
  platform varchar(100),
  os_name varchar(100),
  os_version varchar(100),
  browser varchar(100),
  browser_version varchar(100),
  is_active boolean DEFAULT true,
  last_used_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create user_sessions table
CREATE TABLE user_sessions (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  device_id varchar(255),
  wallet_id uuid REFERENCES wallets(id) ON DELETE SET NULL,
  token varchar(500),
  ip_address varchar(100),
  user_agent text,
  expires_at TIMESTAMP WITH TIME ZONE,
  is_active boolean DEFAULT true,
  ended_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create refresh_tokens table
CREATE TABLE refresh_tokens (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  token varchar NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create indexes
CREATE INDEX IDX_wallet_address ON wallets (address);
CREATE INDEX IDX_wallet_address_lower ON wallets (LOWER(address));
CREATE INDEX IDX_wallet_user_id ON wallets (user_id);
CREATE INDEX IDX_wallet_address_chain ON wallets (address, chain);
CREATE INDEX IDX_profile_user_id ON profiles (user_id);
CREATE INDEX IDX_profile_email ON profiles (email);
CREATE INDEX IDX_profile_unique_id ON profiles (unique_id);
CREATE INDEX IDX_user_device_user_id ON user_devices (user_id);
CREATE INDEX IDX_user_device_device_id ON user_devices (device_id);
CREATE INDEX IDX_user_session_user_id ON user_sessions (user_id);
CREATE INDEX IDX_user_wallet_address ON users (wallet_address);

-- Create initial admin user
INSERT INTO users (
  id, 
  username, 
  role, 
  is_active, 
  is_verified, 
  is_admin,
  wallet_address, 
  referral_code
) VALUES (
  uuid_generate_v4(), 
  'admin', 
  'admin', 
  true, 
  true, 
  true,
  '0x0749c7b218948524cab3e892eba5e60b0b95caee', 
  'REFADMIN123'
) ON CONFLICT DO NOTHING;

-- Add wallet for admin user
DO $$
DECLARE
  admin_id uuid;
BEGIN
  SELECT id INTO admin_id FROM users WHERE username = 'admin' OR role = 'admin' LIMIT 1;
  
  IF admin_id IS NOT NULL THEN
    INSERT INTO wallets (
      id, 
      address, 
      chain, 
      user_id, 
      is_active
    ) VALUES (
      uuid_generate_v4(), 
      '0x0749c7b218948524cab3e892eba5e60b0b95caee', 
      'ETH', 
      admin_id, 
      true
    ) ON CONFLICT DO NOTHING;
    
    INSERT INTO profiles (
      id,
      user_id,
      display_name,
      unique_id,
      visibility_level
    ) VALUES (
      uuid_generate_v4(),
      admin_id,
      'Admin',
      'admin-123',
      'public'
    ) ON CONFLICT DO NOTHING;
  END IF;
END $$;