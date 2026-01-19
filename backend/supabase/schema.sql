-- ============================================================================
-- Dez Fitness Discovery App - Supabase Postgres Schema
-- ============================================================================
-- GDPR Compliant, Soft Deletes, RLS Enabled
-- ============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis" SCHEMA extensions; -- For location search

-- ============================================================================
-- ENUMS
-- ============================================================================

CREATE TYPE activity_type AS ENUM (
  'yoga',
  'pilates',
  'strength_training',
  'cardio',
  'dance',
  'martial_arts',
  'swimming',
  'running',
  'cycling',
  'outdoor',
  'mindfulness',
  'other'
);

CREATE TYPE recommendation_status AS ENUM (
  'pending',
  'viewed',
  'accepted',
  'dismissed'
);

CREATE TYPE event_status AS ENUM (
  'scheduled',
  'ongoing',
  'completed',
  'cancelled'
);

CREATE TYPE user_role AS ENUM (
  'user',
  'moderator',
  'admin'
);

-- ============================================================================
-- TABLES
-- ============================================================================

-- ----------------------------------------------------------------------------
-- profiles
-- Extends Supabase auth.users with app-specific profile data
-- GDPR: Minimal PII, name is optional for privacy
-- ----------------------------------------------------------------------------
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT,
  avatar_url TEXT,
  locale TEXT DEFAULT 'en',
  timezone TEXT DEFAULT 'UTC',
  role user_role DEFAULT 'user',
  preferences JSONB DEFAULT '{}'::jsonb, -- Flexible preferences storage
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- ----------------------------------------------------------------------------
-- questionnaire_responses
-- Stores user questionnaire responses (one user can have many)
-- GDPR: Can be anonymized/deleted per user request
-- ----------------------------------------------------------------------------
CREATE TABLE questionnaire_responses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  version TEXT NOT NULL, -- Questionnaire version for tracking changes
  responses JSONB NOT NULL DEFAULT '{}'::jsonb, -- Flexible questionnaire structure
  metadata JSONB DEFAULT '{}'::jsonb, -- Additional flexible data
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ----------------------------------------------------------------------------
-- facilities
-- Fitness facilities/venues (gyms, studios, parks, etc.)
-- Searchable by location and activity type
-- ----------------------------------------------------------------------------
CREATE TABLE facilities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  address JSONB NOT NULL DEFAULT '{}'::jsonb, -- Flexible address structure
  -- Location using PostGIS point (lat, lng)
  location GEOGRAPHY(POINT, 4326), -- WGS84 coordinate system
  city TEXT NOT NULL,
  country TEXT NOT NULL DEFAULT 'US',
  activity_types activity_type[] NOT NULL DEFAULT '{}', -- Array of activity types
  metadata JSONB DEFAULT '{}'::jsonb, -- Flexible additional data (hours, amenities, etc.)
  is_verified BOOLEAN DEFAULT FALSE,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ----------------------------------------------------------------------------
-- events
-- Fitness events/classes/sessions at facilities
-- ----------------------------------------------------------------------------
CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  facility_id UUID NOT NULL REFERENCES facilities(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  activity_type activity_type NOT NULL,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  timezone TEXT DEFAULT 'UTC',
  is_recurring BOOLEAN DEFAULT FALSE,
  recurrence_rule JSONB, -- iCal RRULE format or custom JSON
  is_free BOOLEAN DEFAULT TRUE,
  capacity INTEGER, -- NULL for unlimited
  instructor_name TEXT,
  instructor_info JSONB DEFAULT '{}'::jsonb, -- Flexible instructor data
  status event_status DEFAULT 'scheduled',
  metadata JSONB DEFAULT '{}'::jsonb, -- Flexible additional data (requirements, equipment, etc.)
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  CONSTRAINT events_time_order CHECK (end_time > start_time)
);

-- ----------------------------------------------------------------------------
-- recommendations
-- AI-generated or system recommendations for users
-- One user can have many recommendations
-- ----------------------------------------------------------------------------
CREATE TABLE recommendations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  facility_id UUID REFERENCES facilities(id) ON DELETE SET NULL,
  event_id UUID REFERENCES events(id) ON DELETE SET NULL,
  activity_type activity_type,
  title TEXT NOT NULL,
  description TEXT,
  rationale JSONB DEFAULT '{}'::jsonb, -- AI reasoning or matching criteria
  score NUMERIC(5, 2), -- Recommendation score/confidence (0-100)
  status recommendation_status DEFAULT 'pending',
  metadata JSONB DEFAULT '{}'::jsonb, -- Flexible additional data
  expires_at TIMESTAMPTZ, -- Optional expiration for time-sensitive recommendations
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  CONSTRAINT recommendations_facility_or_event CHECK (
    (facility_id IS NOT NULL) OR (event_id IS NOT NULL)
  )
);

-- ============================================================================
-- INDEXES
-- ============================================================================

-- Profiles indexes
CREATE INDEX idx_profiles_deleted_at ON profiles(deleted_at) WHERE deleted_at IS NULL;
CREATE INDEX idx_profiles_role ON profiles(role) WHERE deleted_at IS NULL;

-- Questionnaire responses indexes
CREATE INDEX idx_questionnaire_responses_user_id ON questionnaire_responses(user_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_questionnaire_responses_version ON questionnaire_responses(version) WHERE deleted_at IS NULL;
CREATE INDEX idx_questionnaire_responses_created_at ON questionnaire_responses(created_at DESC) WHERE deleted_at IS NULL;

-- Facilities indexes (for searchability)
CREATE INDEX idx_facilities_deleted_at ON facilities(deleted_at) WHERE deleted_at IS NULL;
CREATE INDEX idx_facilities_city ON facilities(city) WHERE deleted_at IS NULL;
CREATE INDEX idx_facilities_country ON facilities(country) WHERE deleted_at IS NULL;
CREATE INDEX idx_facilities_activity_types ON facilities USING GIN(activity_types) WHERE deleted_at IS NULL;
CREATE INDEX idx_facilities_location ON facilities USING GIST(location) WHERE deleted_at IS NULL AND location IS NOT NULL;
CREATE INDEX idx_facilities_verified ON facilities(is_verified) WHERE deleted_at IS NULL AND is_verified = TRUE;

-- Full-text search on facility name and description
CREATE INDEX idx_facilities_search ON facilities USING GIN(
  to_tsvector('english', COALESCE(name, '') || ' ' || COALESCE(description, ''))
) WHERE deleted_at IS NULL;

-- Recommendations indexes
CREATE INDEX idx_recommendations_user_id ON recommendations(user_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_recommendations_facility_id ON recommendations(facility_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_recommendations_event_id ON recommendations(event_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_recommendations_status ON recommendations(status) WHERE deleted_at IS NULL;
CREATE INDEX idx_recommendations_expires_at ON recommendations(expires_at) WHERE deleted_at IS NULL AND expires_at IS NOT NULL;
CREATE INDEX idx_recommendations_created_at ON recommendations(created_at DESC) WHERE deleted_at IS NULL;

-- Events indexes
CREATE INDEX idx_events_facility_id ON events(facility_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_events_activity_type ON events(activity_type) WHERE deleted_at IS NULL;
CREATE INDEX idx_events_start_time ON events(start_time) WHERE deleted_at IS NULL;
CREATE INDEX idx_events_status ON events(status) WHERE deleted_at IS NULL;
CREATE INDEX idx_events_time_range ON events USING GIST(tstzrange(start_time, end_time)) WHERE deleted_at IS NULL;

-- ============================================================================
-- FUNCTIONS & TRIGGERS
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers to all tables
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_questionnaire_responses_updated_at BEFORE UPDATE ON questionnaire_responses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_facilities_updated_at BEFORE UPDATE ON facilities
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_recommendations_updated_at BEFORE UPDATE ON recommendations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_events_updated_at BEFORE UPDATE ON events
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to automatically create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, name, locale, timezone)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', NULL),
    COALESCE(NEW.raw_user_meta_data->>'locale', 'en'),
    COALESCE(NEW.raw_user_meta_data->>'timezone', 'UTC')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE questionnaire_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE facilities ENABLE ROW LEVEL SECURITY;
ALTER TABLE recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
