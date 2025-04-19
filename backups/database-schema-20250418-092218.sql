--
-- PostgreSQL database dump
--

-- Dumped from database version 14.17 (Ubuntu 14.17-0ubuntu0.22.04.1)
-- Dumped by pg_dump version 14.17 (Ubuntu 14.17-0ubuntu0.22.04.1)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: uuid-ossp; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA public;


--
-- Name: EXTENSION "uuid-ossp"; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION "uuid-ossp" IS 'generate universally unique identifiers (UUIDs)';


--
-- Name: delete_user_by_email(text); Type: FUNCTION; Schema: public; Owner: Aliveadmin
--

CREATE FUNCTION public.delete_user_by_email(email_param text) RETURNS void
    LANGUAGE plpgsql
    AS $$
DECLARE
    user_id_var UUID;
BEGIN
    -- Find the user ID by email
    SELECT id INTO user_id_var FROM public.users WHERE email = email_param;
    
    -- Check if user exists
    IF user_id_var IS NULL THEN
        RAISE EXCEPTION 'No user found with email: %', email_param;
    END IF;
    
    -- Call the delete_user_by_id function
    PERFORM delete_user_by_id(user_id_var);
    
    RAISE NOTICE 'Successfully deleted user with email: %', email_param;
END;
$$;


ALTER FUNCTION public.delete_user_by_email(email_param text) OWNER TO "Aliveadmin";

--
-- Name: delete_user_by_id(uuid); Type: FUNCTION; Schema: public; Owner: Aliveadmin
--

CREATE FUNCTION public.delete_user_by_id(user_id_param uuid) RETURNS void
    LANGUAGE plpgsql
    AS $$
BEGIN
    -- Delete user sessions
    DELETE FROM public.user_sessions WHERE user_id = user_id_param;
    
    -- Delete user devices
    DELETE FROM public.user_devices WHERE user_id = user_id_param;
    
    -- Delete wallets associated with user
    DELETE FROM public.wallets WHERE user_id = user_id_param;
    
    -- Delete referrals where user is either referrer or referee
    DELETE FROM public.referrals WHERE referrer_id = user_id_param OR referee_id = user_id_param;
    
    -- Delete user tokens/claims if they exist
    DELETE FROM public.user_tokens WHERE user_id = user_id_param;
    
    -- Delete user achievements if they exist
    DELETE FROM public.user_achievements WHERE user_id = user_id_param;
    
    -- Delete user settings if they exist
    DELETE FROM public.user_settings WHERE user_id = user_id_param;
    
    -- Finally delete the user
    DELETE FROM public.users WHERE id = user_id_param;
    
    RAISE NOTICE 'Successfully deleted user with ID: %', user_id_param;
END;
$$;


ALTER FUNCTION public.delete_user_by_id(user_id_param uuid) OWNER TO "Aliveadmin";

--
-- Name: delete_user_by_wallet(text); Type: FUNCTION; Schema: public; Owner: Aliveadmin
--

CREATE FUNCTION public.delete_user_by_wallet(wallet_address_param text) RETURNS void
    LANGUAGE plpgsql
    AS $$
DECLARE
    user_id_var UUID;
BEGIN
    -- Find user by wallet address stored directly in user table
    SELECT id INTO user_id_var FROM public.users 
    WHERE LOWER(walletAddress) = LOWER(wallet_address_param);
    
    -- If not found in users table, check wallets table
    IF user_id_var IS NULL THEN
        SELECT user_id INTO user_id_var 
        FROM public.wallets 
        WHERE LOWER(address) = LOWER(wallet_address_param);
    END IF;
    
    -- Check if user exists
    IF user_id_var IS NULL THEN
        RAISE EXCEPTION 'No user found with wallet address: %', wallet_address_param;
    END IF;
    
    -- Call the delete_user_by_id function
    PERFORM delete_user_by_id(user_id_var);
    
    RAISE NOTICE 'Successfully deleted user with wallet address: %', wallet_address_param;
END;
$$;


ALTER FUNCTION public.delete_user_by_wallet(wallet_address_param text) OWNER TO "Aliveadmin";

--
-- Name: delete_users_by_pattern(text); Type: FUNCTION; Schema: public; Owner: Aliveadmin
--

CREATE FUNCTION public.delete_users_by_pattern(email_pattern text) RETURNS integer
    LANGUAGE plpgsql
    AS $$
DECLARE
    deleted_count INTEGER := 0;
    user_record RECORD;
BEGIN
    -- Find all users matching the pattern
    FOR user_record IN 
        SELECT id FROM public.users WHERE email LIKE email_pattern
    LOOP
        -- Delete each matching user
        PERFORM delete_user_by_id(user_record.id);
        deleted_count := deleted_count + 1;
    END LOOP;
    
    RETURN deleted_count;
END;
$$;


ALTER FUNCTION public.delete_users_by_pattern(email_pattern text) OWNER TO "Aliveadmin";

--
-- Name: get_column_type(text, text); Type: FUNCTION; Schema: public; Owner: Aliveadmin
--

CREATE FUNCTION public.get_column_type(input_table_name text, input_column_name text) RETURNS text
    LANGUAGE plpgsql
    AS $$
DECLARE
  col_type text;
BEGIN
  SELECT data_type INTO col_type
  FROM information_schema.columns
  WHERE table_name = input_table_name AND column_name = input_column_name;
  
  RETURN col_type;
END;
$$;


ALTER FUNCTION public.get_column_type(input_table_name text, input_column_name text) OWNER TO "Aliveadmin";

--
-- Name: log_fix(text, text, text); Type: FUNCTION; Schema: public; Owner: Aliveadmin
--

CREATE FUNCTION public.log_fix(t_name text, c_name text, act text) RETURNS void
    LANGUAGE plpgsql
    AS $$
BEGIN
    INSERT INTO schema_fix_log(table_name, column_name, action) 
    VALUES (t_name, c_name, act);
    RAISE NOTICE 'Fixed: % % - %', t_name, c_name, act;
END;
$$;


ALTER FUNCTION public.log_fix(t_name text, c_name text, act text) OWNER TO "Aliveadmin";

--
-- Name: safe_truncate(text); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.safe_truncate(table_name text) RETURNS void
    LANGUAGE plpgsql
    AS $_$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = $1) THEN
        EXECUTE 'TRUNCATE TABLE public.' || quote_ident(table_name) || ' CASCADE';
        RAISE NOTICE 'Truncated table: %', table_name;
    ELSE
        RAISE NOTICE 'Skipping non-existent table: %', table_name;
    END IF;
END;
$_$;


ALTER FUNCTION public.safe_truncate(table_name text) OWNER TO postgres;

--
-- Name: sync_user_id_columns(); Type: FUNCTION; Schema: public; Owner: Aliveadmin
--

CREATE FUNCTION public.sync_user_id_columns() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
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
    $$;


ALTER FUNCTION public.sync_user_id_columns() OWNER TO "Aliveadmin";

--
-- Name: table_exists(text); Type: FUNCTION; Schema: public; Owner: Aliveadmin
--

CREATE FUNCTION public.table_exists(input_table_name text) RETURNS boolean
    LANGUAGE plpgsql
    AS $$
BEGIN
  RETURN EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_name = input_table_name
  );
END;
$$;


ALTER FUNCTION public.table_exists(input_table_name text) OWNER TO "Aliveadmin";

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: diaries; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.diaries (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    title character varying(255) NOT NULL,
    game_level integer NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    location character varying(50) DEFAULT 'other'::character varying NOT NULL,
    feeling character varying(100),
    color character varying(30),
    content text NOT NULL,
    has_media boolean DEFAULT false,
    media_paths text[],
    is_stored_locally boolean DEFAULT false,
    encryption_key character varying(128),
    user_id integer NOT NULL
);


ALTER TABLE public.diaries OWNER TO postgres;

--
-- Name: migrations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.migrations (
    id integer NOT NULL,
    "timestamp" bigint NOT NULL,
    name character varying(255) NOT NULL
);


ALTER TABLE public.migrations OWNER TO postgres;

--
-- Name: migrations_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.migrations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.migrations_id_seq OWNER TO postgres;

--
-- Name: migrations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.migrations_id_seq OWNED BY public.migrations.id;


--
-- Name: minting_queue_items; Type: TABLE; Schema: public; Owner: Aliveadmin
--

CREATE TABLE public.minting_queue_items (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    user_id integer NOT NULL,
    wallet_address character varying(42) NOT NULL,
    device_id character varying,
    type character varying DEFAULT 'first_time'::character varying NOT NULL,
    amount numeric(36,18) DEFAULT 0 NOT NULL,
    status character varying DEFAULT 'pending'::character varying NOT NULL,
    transaction_hash character varying,
    error_message text,
    retry_count integer DEFAULT 0 NOT NULL,
    max_retries integer DEFAULT 3 NOT NULL,
    ip_address character varying,
    metadata jsonb,
    merkle_proof text,
    signature text,
    process_after timestamp without time zone,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    processed_at timestamp without time zone,
    processing_started_at timestamp without time zone,
    completed_at timestamp without time zone,
    merkle_root character varying,
    priority integer DEFAULT 0 NOT NULL
);


ALTER TABLE public.minting_queue_items OWNER TO "Aliveadmin";

--
-- Name: TABLE minting_queue_items; Type: COMMENT; Schema: public; Owner: Aliveadmin
--

COMMENT ON TABLE public.minting_queue_items IS 'Stores token minting queue items for processing by the backend';


--
-- Name: nft_collections; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.nft_collections (
    id integer NOT NULL,
    name character varying(255),
    symbol character varying(50),
    contract_address character varying(255),
    chain_id integer,
    description text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.nft_collections OWNER TO postgres;

--
-- Name: nft_collections_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.nft_collections_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.nft_collections_id_seq OWNER TO postgres;

--
-- Name: nft_collections_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.nft_collections_id_seq OWNED BY public.nft_collections.id;


--
-- Name: nfts; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.nfts (
    id integer NOT NULL,
    collection_id integer,
    token_id character varying(100),
    owner_id integer,
    metadata jsonb,
    transaction_hash character varying(255),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.nfts OWNER TO postgres;

--
-- Name: nfts_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.nfts_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.nfts_id_seq OWNER TO postgres;

--
-- Name: nfts_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.nfts_id_seq OWNED BY public.nfts.id;


--
-- Name: profiles; Type: TABLE; Schema: public; Owner: Aliveadmin
--

CREATE TABLE public.profiles (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    "userId" uuid NOT NULL,
    email character varying,
    password character varying,
    "firstName" character varying,
    "lastName" character varying,
    "displayName" character varying,
    "avatarUrl" character varying,
    bio text,
    "uniqueId" character varying,
    "visibilityLevel" character varying DEFAULT 'public'::character varying,
    "createdAt" timestamp with time zone DEFAULT now(),
    "updatedAt" timestamp with time zone DEFAULT now()
);


ALTER TABLE public.profiles OWNER TO "Aliveadmin";

--
-- Name: referral_codes; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.referral_codes (
    id integer NOT NULL,
    user_id integer,
    code character varying(50),
    is_active boolean DEFAULT true,
    usage_limit integer DEFAULT 10,
    used_count integer DEFAULT 0,
    expires_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.referral_codes OWNER TO postgres;

--
-- Name: referral_codes_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.referral_codes_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.referral_codes_id_seq OWNER TO postgres;

--
-- Name: referral_codes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.referral_codes_id_seq OWNED BY public.referral_codes.id;


--
-- Name: referrals; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.referrals (
    id integer NOT NULL,
    referrer_id integer,
    referred_id integer,
    referral_code_id integer,
    reward_claimed boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.referrals OWNER TO postgres;

--
-- Name: referrals_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.referrals_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.referrals_id_seq OWNER TO postgres;

--
-- Name: referrals_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.referrals_id_seq OWNED BY public.referrals.id;


--
-- Name: refresh_tokens; Type: TABLE; Schema: public; Owner: Aliveadmin
--

CREATE TABLE public.refresh_tokens (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    token character varying NOT NULL,
    "expiresAt" timestamp with time zone NOT NULL,
    "userId" uuid NOT NULL,
    "createdAt" timestamp with time zone DEFAULT now(),
    expires_at timestamp with time zone
);


ALTER TABLE public.refresh_tokens OWNER TO "Aliveadmin";

--
-- Name: user_devices; Type: TABLE; Schema: public; Owner: Aliveadmin
--

CREATE TABLE public.user_devices (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    "userId" uuid NOT NULL,
    "deviceId" character varying(255) NOT NULL,
    "deviceType" character varying(50) DEFAULT 'unknown'::character varying,
    name character varying(255),
    platform character varying(100),
    "osName" character varying(100),
    "osVersion" character varying(100),
    browser character varying(100),
    "browserVersion" character varying(100),
    "isActive" boolean DEFAULT true,
    "lastUsedAt" timestamp with time zone,
    "createdAt" timestamp with time zone DEFAULT now(),
    "updatedAt" timestamp with time zone DEFAULT now(),
    "walletAddresses" text,
    user_agent text,
    os text,
    os_version text,
    browser_version text,
    brand text,
    model text,
    device_id text,
    device_type text,
    "lastIpAddress" text,
    "visitCount" integer DEFAULT 0,
    "lastSeenAt" timestamp with time zone,
    "firstSeen" timestamp with time zone,
    "lastSeen" timestamp with time zone,
    is_active boolean DEFAULT true,
    "isApproved" boolean DEFAULT true,
    wallet_addresses text,
    last_ip_address text,
    visit_count integer DEFAULT 0,
    last_seen_at timestamp with time zone,
    first_seen timestamp with time zone,
    last_seen timestamp with time zone,
    is_approved boolean DEFAULT true,
    user_id uuid,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.user_devices OWNER TO "Aliveadmin";

--
-- Name: user_sessions; Type: TABLE; Schema: public; Owner: Aliveadmin
--

CREATE TABLE public.user_sessions (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    "userId" uuid NOT NULL,
    "deviceId" character varying(255),
    "walletId" uuid,
    token character varying(500),
    "ipAddress" character varying(100),
    "userAgent" text,
    "expiresAt" timestamp with time zone,
    "isActive" boolean DEFAULT true,
    "endedAt" timestamp with time zone,
    "createdAt" timestamp with time zone DEFAULT now(),
    user_agent text,
    device_id text,
    ip_address text,
    expires_at timestamp with time zone,
    isactive boolean DEFAULT true,
    is_active boolean DEFAULT true,
    endedat timestamp with time zone,
    duration integer,
    user_id uuid,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.user_sessions OWNER TO "Aliveadmin";

--
-- Name: users; Type: TABLE; Schema: public; Owner: Aliveadmin
--

CREATE TABLE public.users (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    username character varying,
    email character varying,
    password character varying,
    first_name character varying,
    last_name character varying,
    avatar_url character varying,
    "isActive" boolean DEFAULT true,
    "isVerified" boolean DEFAULT false,
    "isAdmin" boolean DEFAULT false,
    role character varying DEFAULT 'user'::character varying,
    "walletAddress" character varying,
    "referralCode" character varying,
    "referredById" uuid,
    "referralTier" integer DEFAULT 0,
    "createdAt" timestamp with time zone DEFAULT now(),
    "updatedAt" timestamp with time zone DEFAULT now(),
    "userId" uuid DEFAULT public.uuid_generate_v4(),
    referrer_id uuid,
    user_id uuid,
    verification_token character varying(255),
    reset_password_token character varying(255),
    reset_password_expires timestamp without time zone,
    last_login_at timestamp without time zone,
    last_login_ip character varying(255),
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    last_mint_date timestamp with time zone,
    token_expiry_date timestamp with time zone,
    minted_amount numeric(20,8) DEFAULT 0,
    has_expired_tokens boolean DEFAULT false
);


ALTER TABLE public.users OWNER TO "Aliveadmin";

--
-- Name: COLUMN users.created_at; Type: COMMENT; Schema: public; Owner: Aliveadmin
--

COMMENT ON COLUMN public.users.created_at IS 'Timestamp when the record was created';


--
-- Name: COLUMN users.updated_at; Type: COMMENT; Schema: public; Owner: Aliveadmin
--

COMMENT ON COLUMN public.users.updated_at IS 'Timestamp when the record was last updated';


--
-- Name: COLUMN users.last_mint_date; Type: COMMENT; Schema: public; Owner: Aliveadmin
--

COMMENT ON COLUMN public.users.last_mint_date IS 'Date when the user last minted tokens';


--
-- Name: COLUMN users.token_expiry_date; Type: COMMENT; Schema: public; Owner: Aliveadmin
--

COMMENT ON COLUMN public.users.token_expiry_date IS 'Date when the user tokens expire';


--
-- Name: COLUMN users.minted_amount; Type: COMMENT; Schema: public; Owner: Aliveadmin
--

COMMENT ON COLUMN public.users.minted_amount IS 'Amount of tokens minted by the user';


--
-- Name: COLUMN users.has_expired_tokens; Type: COMMENT; Schema: public; Owner: Aliveadmin
--

COMMENT ON COLUMN public.users.has_expired_tokens IS 'Flag indicating if the user has any expired tokens';


--
-- Name: wallet_challenges; Type: TABLE; Schema: public; Owner: Aliveadmin
--

CREATE TABLE public.wallet_challenges (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    wallet_address character varying(255) NOT NULL,
    challenge_text text NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    expires_at timestamp with time zone DEFAULT (CURRENT_TIMESTAMP + '00:10:00'::interval),
    is_used boolean DEFAULT false,
    challenge text GENERATED ALWAYS AS (challenge_text) STORED
);


ALTER TABLE public.wallet_challenges OWNER TO "Aliveadmin";

--
-- Name: wallet_nonces; Type: TABLE; Schema: public; Owner: Aliveadmin
--

CREATE TABLE public.wallet_nonces (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    wallet_address character varying(255) NOT NULL,
    nonce character varying(255) NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    expires_at timestamp with time zone DEFAULT (now() + '00:15:00'::interval)
);


ALTER TABLE public.wallet_nonces OWNER TO "Aliveadmin";

--
-- Name: wallets; Type: TABLE; Schema: public; Owner: Aliveadmin
--

CREATE TABLE public.wallets (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    address character varying NOT NULL,
    "privateKey" character varying,
    chain character varying DEFAULT 'ETH'::character varying,
    user_id uuid NOT NULL,
    "isActive" boolean DEFAULT true,
    "createdAt" timestamp with time zone DEFAULT now(),
    "updatedAt" timestamp with time zone DEFAULT now(),
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.wallets OWNER TO "Aliveadmin";

--
-- Name: migrations id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.migrations ALTER COLUMN id SET DEFAULT nextval('public.migrations_id_seq'::regclass);


--
-- Name: nft_collections id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.nft_collections ALTER COLUMN id SET DEFAULT nextval('public.nft_collections_id_seq'::regclass);


--
-- Name: nfts id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.nfts ALTER COLUMN id SET DEFAULT nextval('public.nfts_id_seq'::regclass);


--
-- Name: referral_codes id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.referral_codes ALTER COLUMN id SET DEFAULT nextval('public.referral_codes_id_seq'::regclass);


--
-- Name: referrals id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.referrals ALTER COLUMN id SET DEFAULT nextval('public.referrals_id_seq'::regclass);


--
-- Name: diaries diaries_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.diaries
    ADD CONSTRAINT diaries_pkey PRIMARY KEY (id);


--
-- Name: migrations migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.migrations
    ADD CONSTRAINT migrations_pkey PRIMARY KEY (id);


--
-- Name: minting_queue_items minting_queue_items_pkey; Type: CONSTRAINT; Schema: public; Owner: Aliveadmin
--

ALTER TABLE ONLY public.minting_queue_items
    ADD CONSTRAINT minting_queue_items_pkey PRIMARY KEY (id);


--
-- Name: nft_collections nft_collections_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.nft_collections
    ADD CONSTRAINT nft_collections_pkey PRIMARY KEY (id);


--
-- Name: nfts nfts_collection_id_token_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.nfts
    ADD CONSTRAINT nfts_collection_id_token_id_key UNIQUE (collection_id, token_id);


--
-- Name: nfts nfts_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.nfts
    ADD CONSTRAINT nfts_pkey PRIMARY KEY (id);


--
-- Name: profiles profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: Aliveadmin
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_pkey PRIMARY KEY (id);


--
-- Name: profiles profiles_unique_id_key; Type: CONSTRAINT; Schema: public; Owner: Aliveadmin
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_unique_id_key UNIQUE ("uniqueId");


--
-- Name: referral_codes referral_codes_code_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.referral_codes
    ADD CONSTRAINT referral_codes_code_key UNIQUE (code);


--
-- Name: referral_codes referral_codes_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.referral_codes
    ADD CONSTRAINT referral_codes_pkey PRIMARY KEY (id);


--
-- Name: referrals referrals_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.referrals
    ADD CONSTRAINT referrals_pkey PRIMARY KEY (id);


--
-- Name: referrals referrals_referred_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.referrals
    ADD CONSTRAINT referrals_referred_id_key UNIQUE (referred_id);


--
-- Name: refresh_tokens refresh_tokens_pkey; Type: CONSTRAINT; Schema: public; Owner: Aliveadmin
--

ALTER TABLE ONLY public.refresh_tokens
    ADD CONSTRAINT refresh_tokens_pkey PRIMARY KEY (id);


--
-- Name: wallets uq_wallet_address; Type: CONSTRAINT; Schema: public; Owner: Aliveadmin
--

ALTER TABLE ONLY public.wallets
    ADD CONSTRAINT uq_wallet_address UNIQUE (address);


--
-- Name: user_devices user_devices_pkey; Type: CONSTRAINT; Schema: public; Owner: Aliveadmin
--

ALTER TABLE ONLY public.user_devices
    ADD CONSTRAINT user_devices_pkey PRIMARY KEY (id);


--
-- Name: user_sessions user_sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: Aliveadmin
--

ALTER TABLE ONLY public.user_sessions
    ADD CONSTRAINT user_sessions_pkey PRIMARY KEY (id);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: Aliveadmin
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: users users_user_id_key; Type: CONSTRAINT; Schema: public; Owner: Aliveadmin
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_user_id_key UNIQUE ("userId");


--
-- Name: wallet_challenges wallet_challenges_pkey; Type: CONSTRAINT; Schema: public; Owner: Aliveadmin
--

ALTER TABLE ONLY public.wallet_challenges
    ADD CONSTRAINT wallet_challenges_pkey PRIMARY KEY (id);


--
-- Name: wallet_nonces wallet_nonces_pkey; Type: CONSTRAINT; Schema: public; Owner: Aliveadmin
--

ALTER TABLE ONLY public.wallet_nonces
    ADD CONSTRAINT wallet_nonces_pkey PRIMARY KEY (id);


--
-- Name: wallet_nonces wallet_nonces_wallet_address_key; Type: CONSTRAINT; Schema: public; Owner: Aliveadmin
--

ALTER TABLE ONLY public.wallet_nonces
    ADD CONSTRAINT wallet_nonces_wallet_address_key UNIQUE (wallet_address);


--
-- Name: wallets wallets_pkey; Type: CONSTRAINT; Schema: public; Owner: Aliveadmin
--

ALTER TABLE ONLY public.wallets
    ADD CONSTRAINT wallets_pkey PRIMARY KEY (id);


--
-- Name: idx_diary_created_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_diary_created_at ON public.diaries USING btree (created_at);


--
-- Name: idx_diary_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_diary_user_id ON public.diaries USING btree (user_id);


--
-- Name: idx_minting_queue_created_at; Type: INDEX; Schema: public; Owner: Aliveadmin
--

CREATE INDEX idx_minting_queue_created_at ON public.minting_queue_items USING btree (created_at);


--
-- Name: idx_minting_queue_priority; Type: INDEX; Schema: public; Owner: Aliveadmin
--

CREATE INDEX idx_minting_queue_priority ON public.minting_queue_items USING btree (priority);


--
-- Name: idx_minting_queue_status; Type: INDEX; Schema: public; Owner: Aliveadmin
--

CREATE INDEX idx_minting_queue_status ON public.minting_queue_items USING btree (status);


--
-- Name: idx_minting_queue_user_id; Type: INDEX; Schema: public; Owner: Aliveadmin
--

CREATE INDEX idx_minting_queue_user_id ON public.minting_queue_items USING btree (user_id);


--
-- Name: idx_minting_queue_wallet; Type: INDEX; Schema: public; Owner: Aliveadmin
--

CREATE INDEX idx_minting_queue_wallet ON public.minting_queue_items USING btree (wallet_address);


--
-- Name: idx_minting_queue_wallet_address; Type: INDEX; Schema: public; Owner: Aliveadmin
--

CREATE INDEX idx_minting_queue_wallet_address ON public.minting_queue_items USING btree (wallet_address);


--
-- Name: idx_profile_email; Type: INDEX; Schema: public; Owner: Aliveadmin
--

CREATE INDEX idx_profile_email ON public.profiles USING btree (email);


--
-- Name: idx_profile_unique_id; Type: INDEX; Schema: public; Owner: Aliveadmin
--

CREATE INDEX idx_profile_unique_id ON public.profiles USING btree ("uniqueId");


--
-- Name: idx_profile_user_id; Type: INDEX; Schema: public; Owner: Aliveadmin
--

CREATE INDEX idx_profile_user_id ON public.profiles USING btree ("userId");


--
-- Name: idx_user_device_device_id; Type: INDEX; Schema: public; Owner: Aliveadmin
--

CREATE INDEX idx_user_device_device_id ON public.user_devices USING btree ("deviceId");


--
-- Name: idx_user_device_user_id; Type: INDEX; Schema: public; Owner: Aliveadmin
--

CREATE INDEX idx_user_device_user_id ON public.user_devices USING btree ("userId");


--
-- Name: idx_user_devices_device_id; Type: INDEX; Schema: public; Owner: Aliveadmin
--

CREATE INDEX idx_user_devices_device_id ON public.user_devices USING btree (device_id);


--
-- Name: idx_user_session_user_id; Type: INDEX; Schema: public; Owner: Aliveadmin
--

CREATE INDEX idx_user_session_user_id ON public.user_sessions USING btree ("userId");


--
-- Name: idx_user_sessions_device_id; Type: INDEX; Schema: public; Owner: Aliveadmin
--

CREATE INDEX idx_user_sessions_device_id ON public.user_sessions USING btree (device_id);


--
-- Name: idx_user_sessions_token; Type: INDEX; Schema: public; Owner: Aliveadmin
--

CREATE INDEX idx_user_sessions_token ON public.user_sessions USING btree (token);


--
-- Name: idx_user_sessions_user_id; Type: INDEX; Schema: public; Owner: Aliveadmin
--

CREATE INDEX idx_user_sessions_user_id ON public.user_sessions USING btree (user_id);


--
-- Name: idx_user_wallet_address; Type: INDEX; Schema: public; Owner: Aliveadmin
--

CREATE INDEX idx_user_wallet_address ON public.users USING btree ("walletAddress");


--
-- Name: idx_users_wallet_address; Type: INDEX; Schema: public; Owner: Aliveadmin
--

CREATE INDEX idx_users_wallet_address ON public.users USING btree (lower(("walletAddress")::text));


--
-- Name: idx_wallet_address; Type: INDEX; Schema: public; Owner: Aliveadmin
--

CREATE INDEX idx_wallet_address ON public.wallets USING btree (address);


--
-- Name: idx_wallet_address_chain; Type: INDEX; Schema: public; Owner: Aliveadmin
--

CREATE INDEX idx_wallet_address_chain ON public.wallets USING btree (address, chain);


--
-- Name: idx_wallet_address_lower; Type: INDEX; Schema: public; Owner: Aliveadmin
--

CREATE INDEX idx_wallet_address_lower ON public.wallets USING btree (lower((address)::text));


--
-- Name: idx_wallet_challenges_address; Type: INDEX; Schema: public; Owner: Aliveadmin
--

CREATE INDEX idx_wallet_challenges_address ON public.wallet_challenges USING btree (wallet_address);


--
-- Name: idx_wallet_user_id; Type: INDEX; Schema: public; Owner: Aliveadmin
--

CREATE INDEX idx_wallet_user_id ON public.wallets USING btree (user_id);


--
-- Name: idx_wallets_address; Type: INDEX; Schema: public; Owner: Aliveadmin
--

CREATE INDEX idx_wallets_address ON public.wallets USING btree (lower((address)::text));


--
-- Name: user_devices sync_user_id_trigger; Type: TRIGGER; Schema: public; Owner: Aliveadmin
--

CREATE TRIGGER sync_user_id_trigger BEFORE INSERT OR UPDATE ON public.user_devices FOR EACH ROW EXECUTE FUNCTION public.sync_user_id_columns();


--
-- Name: user_sessions fk_user_sessions_user_id; Type: FK CONSTRAINT; Schema: public; Owner: Aliveadmin
--

ALTER TABLE ONLY public.user_sessions
    ADD CONSTRAINT fk_user_sessions_user_id FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: wallets fk_wallets_users; Type: FK CONSTRAINT; Schema: public; Owner: Aliveadmin
--

ALTER TABLE ONLY public.wallets
    ADD CONSTRAINT fk_wallets_users FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: nfts nfts_collection_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.nfts
    ADD CONSTRAINT nfts_collection_id_fkey FOREIGN KEY (collection_id) REFERENCES public.nft_collections(id);


--
-- Name: profiles profiles_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: Aliveadmin
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_user_id_fkey FOREIGN KEY ("userId") REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: referrals referrals_referral_code_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.referrals
    ADD CONSTRAINT referrals_referral_code_id_fkey FOREIGN KEY (referral_code_id) REFERENCES public.referral_codes(id);


--
-- Name: refresh_tokens refresh_tokens_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: Aliveadmin
--

ALTER TABLE ONLY public.refresh_tokens
    ADD CONSTRAINT refresh_tokens_user_id_fkey FOREIGN KEY ("userId") REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: user_devices user_devices_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: Aliveadmin
--

ALTER TABLE ONLY public.user_devices
    ADD CONSTRAINT user_devices_user_id_fkey FOREIGN KEY ("userId") REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: user_devices user_devices_user_id_fkey1; Type: FK CONSTRAINT; Schema: public; Owner: Aliveadmin
--

ALTER TABLE ONLY public.user_devices
    ADD CONSTRAINT user_devices_user_id_fkey1 FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: user_sessions user_sessions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: Aliveadmin
--

ALTER TABLE ONLY public.user_sessions
    ADD CONSTRAINT user_sessions_user_id_fkey FOREIGN KEY ("userId") REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: user_sessions user_sessions_wallet_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: Aliveadmin
--

ALTER TABLE ONLY public.user_sessions
    ADD CONSTRAINT user_sessions_wallet_id_fkey FOREIGN KEY ("walletId") REFERENCES public.wallets(id) ON DELETE SET NULL;


--
-- Name: wallets wallets_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: Aliveadmin
--

ALTER TABLE ONLY public.wallets
    ADD CONSTRAINT wallets_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: SCHEMA public; Type: ACL; Schema: -; Owner: postgres
--

GRANT ALL ON SCHEMA public TO aliveadmin;


--
-- Name: TABLE migrations; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.migrations TO "Aliveadmin";


--
-- Name: SEQUENCE migrations_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public.migrations_id_seq TO "Aliveadmin";


--
-- Name: TABLE nft_collections; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.nft_collections TO "Aliveadmin";


--
-- Name: SEQUENCE nft_collections_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public.nft_collections_id_seq TO "Aliveadmin";


--
-- Name: TABLE nfts; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.nfts TO "Aliveadmin";


--
-- Name: SEQUENCE nfts_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public.nfts_id_seq TO "Aliveadmin";


--
-- Name: TABLE referral_codes; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.referral_codes TO "Aliveadmin";


--
-- Name: SEQUENCE referral_codes_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public.referral_codes_id_seq TO "Aliveadmin";


--
-- Name: TABLE referrals; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.referrals TO "Aliveadmin";


--
-- Name: SEQUENCE referrals_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public.referrals_id_seq TO "Aliveadmin";


--
-- PostgreSQL database dump complete
--

