-- ============================================================================
-- Migration 006: Analytics Views
-- ============================================================================
-- Creates views for analytics dashboards and reporting.
-- Depends on: 002_tables.sql
-- ============================================================================

-- ============================================================================
-- DAILY EVENTS SUMMARY
-- ============================================================================

CREATE OR REPLACE VIEW analytics_events_daily AS
SELECT
  date_trunc('day', created_at) AS day,
  COUNT(*) AS total_events,
  COUNT(DISTINCT COALESCE(user_id, anonymous_id)) AS active_users
FROM events
WHERE deleted_at IS NULL
GROUP BY 1
ORDER BY 1 DESC;

-- ============================================================================
-- ONBOARDING FUNNEL
-- ============================================================================

CREATE OR REPLACE VIEW analytics_onboarding_funnel AS
SELECT
  COUNT(DISTINCT anonymous_id) FILTER (WHERE event_name = 'questionnaire_started') AS started,
  COUNT(DISTINCT anonymous_id) FILTER (WHERE event_name = 'questionnaire_completed') AS completed,
  COUNT(DISTINCT anonymous_id) FILTER (WHERE event_name = 'recommendation_viewed') AS viewed_recommendations
FROM events
WHERE deleted_at IS NULL;

-- ============================================================================
-- EVENT COUNTS BY TYPE
-- ============================================================================

CREATE OR REPLACE VIEW analytics_event_counts AS
SELECT
  event_name,
  COUNT(*) AS total,
  COUNT(DISTINCT COALESCE(user_id, anonymous_id)) AS unique_users
FROM events
WHERE deleted_at IS NULL
GROUP BY event_name
ORDER BY total DESC;

-- ============================================================================
-- FACILITY ENGAGEMENT
-- ============================================================================

CREATE OR REPLACE VIEW analytics_facility_clicks AS
SELECT
  metadata->>'facility_id' AS facility_id,
  COUNT(*) AS clicks
FROM events
WHERE event_name = 'facility_clicked'
  AND deleted_at IS NULL
GROUP BY facility_id
ORDER BY clicks DESC;

-- ============================================================================
-- RETURNING USERS (active > 7 days)
-- ============================================================================

CREATE OR REPLACE VIEW analytics_returning_users AS
SELECT
  anonymous_id,
  MIN(created_at) AS first_seen,
  MAX(created_at) AS last_seen,
  COUNT(DISTINCT date_trunc('day', created_at)) AS active_days
FROM events
WHERE deleted_at IS NULL
GROUP BY anonymous_id
HAVING MAX(created_at) - MIN(created_at) > INTERVAL '7 days';

-- ============================================================================
-- FIRST TOUCH ATTRIBUTION
-- ============================================================================

CREATE OR REPLACE VIEW analytics_first_touch AS
SELECT
  anonymous_id,
  MIN(created_at) AS first_seen,
  (ARRAY_AGG(event_name ORDER BY created_at))[1] AS first_event
FROM events
WHERE deleted_at IS NULL
GROUP BY anonymous_id;

-- ============================================================================
-- RECOMMENDATIONS CONVERSION
-- ============================================================================

CREATE OR REPLACE VIEW analytics_recommendations_conversion AS
SELECT
  r.id AS recommendation_id,
  r.user_id,
  r.facility_id,
  r.created_at AS recommended_at,
  COUNT(e.id) FILTER (WHERE e.event_name = 'facility_clicked') AS clicks,
  COUNT(e.id) FILTER (WHERE e.event_name = 'facility_contacted') AS contacts
FROM recommendations r
LEFT JOIN events e ON e.user_id = r.user_id 
  AND e.metadata->>'facility_id' = r.facility_id::TEXT
  AND e.created_at > r.created_at
WHERE r.deleted_at IS NULL
GROUP BY r.id, r.user_id, r.facility_id, r.created_at;
