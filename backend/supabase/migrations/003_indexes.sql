-- ============================================================================
-- Migration 003: Create Indexes
-- ============================================================================
-- Creates indexes for query performance optimization.
-- Depends on: 002_tables.sql
-- ============================================================================

-- Facilities indexes for geographic and activity searches
CREATE INDEX facilities_location_idx ON facilities USING GIST(location);
CREATE INDEX facilities_activity_idx ON facilities USING GIN(activity_types);

-- Events indexes for analytics queries
CREATE INDEX idx_events_name ON events(event_name);
CREATE INDEX idx_events_user ON events(user_id);
CREATE INDEX idx_events_anon ON events(anonymous_id);
CREATE INDEX idx_events_created ON events(created_at);

-- Recommendations index for user lookups
CREATE INDEX idx_recommendations_user ON recommendations(user_id);

-- Questionnaire responses index
CREATE INDEX idx_questionnaire_user ON questionnaire_responses(user_id);

-- Cache expiration lookup
CREATE INDEX idx_cached_searches_created ON cached_searches(created_at);
