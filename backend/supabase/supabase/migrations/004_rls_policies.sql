-- ============================================================================
-- Migration 004: Row Level Security Policies
-- ============================================================================
-- Security-first approach: Default deny, explicit allow.
-- Depends on: 002_tables.sql
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE questionnaire_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE facilities ENABLE ROW LEVEL SECURITY;
ALTER TABLE cached_searches ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- PROFILES POLICIES
-- ============================================================================

CREATE POLICY "Users can view own profile"
ON profiles FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can update own profile"
ON profiles FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile"
ON profiles FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- QUESTIONNAIRE RESPONSES POLICIES
-- ============================================================================

CREATE POLICY "Users manage own questionnaires"
ON questionnaire_responses
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- RECOMMENDATIONS POLICIES
-- ============================================================================

CREATE POLICY "Users view own recommendations"
ON recommendations FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "System can insert recommendations"
ON recommendations FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- EVENTS POLICIES
-- ============================================================================

-- Allow inserting events (user_id can be null for anonymous tracking)
CREATE POLICY "Users insert own events"
ON events FOR INSERT
WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- Users can only read their own events
CREATE POLICY "Read own events"
ON events FOR SELECT
USING (auth.uid() = user_id);

-- ============================================================================
-- FACILITIES POLICIES
-- ============================================================================

-- Facilities are public (read-only for non-deleted records)
CREATE POLICY "Public can view facilities"
ON facilities FOR SELECT
USING (deleted_at IS NULL);

-- ============================================================================
-- CACHED SEARCHES POLICIES
-- ============================================================================

-- Service role only - no direct user access
-- Edge functions use service role to read/write cache
CREATE POLICY "Service role manages cache"
ON cached_searches
FOR ALL
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');
