-- ============================================================================
-- Migration 002: Create Core Tables
-- ============================================================================
-- Creates all application tables with proper constraints and defaults.
-- Depends on: 001_extensions.sql
-- ============================================================================

-- User profiles (linked to Supabase auth.users)
CREATE TABLE profiles (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  age INT,
  height_cm INT,
  weight_kg INT,
  location GEOGRAPHY(POINT, 4326),
  preferences JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

-- Questionnaire responses for onboarding
CREATE TABLE questionnaire_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  version INT NOT NULL,
  responses JSONB NOT NULL,
  completed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

-- Fitness facilities/gyms/studios
CREATE TABLE facilities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  activity_types TEXT[] NOT NULL,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

-- Add computed geography column for spatial queries
ALTER TABLE facilities
ADD COLUMN location GEOGRAPHY(POINT, 4326)
GENERATED ALWAYS AS (
  ST_MakePoint(longitude, latitude)::GEOGRAPHY
) STORED;

-- AI-generated recommendations for users
CREATE TABLE recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  facility_id UUID REFERENCES facilities(id),
  reasoning TEXT,
  score NUMERIC,
  ai_payload JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

-- Analytics events tracking
CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  -- Identity (user_id optional for anonymous tracking)
  user_id UUID NULL,
  anonymous_id UUID NOT NULL,
  -- Event metadata
  event_name TEXT NOT NULL,
  event_version INT NOT NULL DEFAULT 1,
  -- Context
  screen TEXT,
  source TEXT, -- e.g. "mobile", "web"
  metadata JSONB,
  -- Compliance
  created_at TIMESTAMPTZ DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

-- Cache for facility search results
CREATE TABLE cached_searches (
  key TEXT PRIMARY KEY,
  response JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);
