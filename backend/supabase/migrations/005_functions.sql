-- ============================================================================
-- Migration 005: Functions and Triggers
-- ============================================================================
-- Creates stored procedures, functions, and triggers.
-- Depends on: 002_tables.sql
-- ============================================================================

-- ============================================================================
-- SEARCH FACILITIES FUNCTION
-- ============================================================================
-- Performs geographic search for facilities within a radius.

CREATE OR REPLACE FUNCTION search_facilities(
  user_lat DOUBLE PRECISION,
  user_lng DOUBLE PRECISION,
  activities TEXT[],
  radius_meters INT DEFAULT 5000
)
RETURNS TABLE (
  id UUID,
  name TEXT,
  activity_types TEXT[],
  distance_meters INT
)
LANGUAGE sql
STABLE
AS $$
  SELECT
    f.id,
    f.name,
    f.activity_types,
    ST_Distance(
      f.location,
      ST_MakePoint(user_lng, user_lat)::GEOGRAPHY
    )::INT AS distance_meters
  FROM facilities f
  WHERE
    f.deleted_at IS NULL
    AND (activities IS NULL OR f.activity_types && activities)
    AND ST_DWithin(
      f.location,
      ST_MakePoint(user_lng, user_lat)::GEOGRAPHY,
      radius_meters
    )
  ORDER BY distance_meters
  LIMIT 50;
$$;

-- ============================================================================
-- HANDLE NEW USER TRIGGER
-- ============================================================================
-- Automatically creates a profile when a new user signs up.

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO profiles (user_id)
  VALUES (NEW.id);
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE PROCEDURE handle_new_user();

-- ============================================================================
-- DELETE ACCOUNT FUNCTION
-- ============================================================================
-- Allows users to delete their own account (GDPR compliance).

CREATE OR REPLACE FUNCTION delete_my_account()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- This will cascade delete profiles, questionnaire_responses, etc.
  DELETE FROM auth.users WHERE id = auth.uid();
END;
$$;

-- ============================================================================
-- UPDATED_AT TRIGGER
-- ============================================================================
-- Automatically updates the updated_at timestamp on row modifications.

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON profiles
FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_questionnaire_responses_updated_at
BEFORE UPDATE ON questionnaire_responses
FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_facilities_updated_at
BEFORE UPDATE ON facilities
FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- ============================================================================
-- CACHE CLEANUP FUNCTION
-- ============================================================================
-- Removes old cache entries (call periodically via pg_cron or similar).

CREATE OR REPLACE FUNCTION cleanup_expired_cache(max_age_hours INT DEFAULT 24)
RETURNS INT
LANGUAGE plpgsql
AS $$
DECLARE
  deleted_count INT;
BEGIN
  DELETE FROM cached_searches
  WHERE created_at < now() - (max_age_hours || ' hours')::INTERVAL;
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$;
