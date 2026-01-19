# Dez Fitness Discovery App - Database Schema

## Overview

This schema implements a GDPR-compliant, security-first database design for the Dez fitness discovery app using Supabase Postgres.

## Key Features

- ✅ **GDPR Compliant**: Minimal PII, soft deletes, data export/anonymization functions
- ✅ **Row Level Security**: All tables protected with RLS policies
- ✅ **Soft Deletes**: All tables support soft deletion via `deleted_at` timestamp
- ✅ **Flexible JSON**: JSONB fields for extensible metadata
- ✅ **Location Search**: PostGIS integration for geographic queries
- ✅ **Full-Text Search**: GIN indexes for facility name/description search

## Schema Structure

### Core Entities

1. **profiles** - User profiles extending Supabase auth.users
2. **questionnaire_responses** - User questionnaire data (one-to-many)
3. **facilities** - Fitness venues/studios/gyms
4. **events** - Classes/sessions at facilities
5. **recommendations** - AI/system recommendations for users (one-to-many)

### Relationships

```
profiles (1) ──< (many) questionnaire_responses
profiles (1) ──< (many) recommendations
facilities (1) ──< (many) events
facilities (1) ──< (many) recommendations
events (1) ──< (many) recommendations
```

## Installation

1. **Run the schema**:
   ```sql
   -- In Supabase SQL Editor, run:
   \i supabase/schema.sql
   ```

2. **Apply RLS policies**:
   ```sql
   -- In Supabase SQL Editor, run:
   \i supabase/rls_policies.sql
   ```

## Usage Examples

### Query facilities by location and activity type

```sql
-- Find yoga facilities within 5km of a point
SELECT 
  id,
  name,
  city,
  activity_types,
  ST_Distance(location, ST_MakePoint(-122.4194, 37.7749)::geography) / 1000 AS distance_km
FROM facilities
WHERE 
  deleted_at IS NULL
  AND 'yoga' = ANY(activity_types)
  AND ST_DWithin(
    location,
    ST_MakePoint(-122.4194, 37.7749)::geography,
    5000  -- 5km in meters
  )
ORDER BY distance_km
LIMIT 10;
```

### Full-text search facilities

```sql
-- Search facilities by name/description
SELECT id, name, description, city
FROM facilities
WHERE 
  deleted_at IS NULL
  AND to_tsvector('english', COALESCE(name, '') || ' ' || COALESCE(description, ''))
      @@ plainto_tsquery('english', 'yoga studio')
ORDER BY ts_rank(
  to_tsvector('english', COALESCE(name, '') || ' ' || COALESCE(description, '')),
  plainto_tsquery('english', 'yoga studio')
) DESC;
```

### Get user recommendations

```sql
-- Get pending recommendations for a user
SELECT 
  r.*,
  f.name AS facility_name,
  e.title AS event_title
FROM recommendations r
LEFT JOIN facilities f ON r.facility_id = f.id AND f.deleted_at IS NULL
LEFT JOIN events e ON r.event_id = e.id AND e.deleted_at IS NULL
WHERE 
  r.user_id = auth.uid()
  AND r.deleted_at IS NULL
  AND r.status = 'pending'
  AND (r.expires_at IS NULL OR r.expires_at > NOW())
ORDER BY r.score DESC NULLS LAST, r.created_at DESC;
```

### GDPR: Export user data

```sql
-- Export all user data (run as admin or via Edge Function)
SELECT export_user_data('user-uuid-here');
```

### GDPR: Anonymize user data

```sql
-- Anonymize user data before deletion (run as admin or via Edge Function)
SELECT anonymize_user_data('user-uuid-here');
```

## Security Model

### Access Levels

1. **Public**: Facilities and events are readable by all (authenticated or not)
2. **Authenticated Users**: Can create facilities/events, view own data
3. **Moderators**: Can verify facilities, view analytics
4. **Admins**: Full access including soft delete

### RLS Policy Pattern

- **Default**: Deny all (RLS enabled on all tables)
- **Explicit Allow**: Policies grant specific permissions
- **Soft Delete Filter**: All policies filter `deleted_at IS NULL`

## Indexes

The schema includes optimized indexes for:
- Location-based queries (GIST on PostGIS geography)
- Activity type filtering (GIN on array)
- Full-text search (GIN on tsvector)
- Foreign key lookups
- Time-based queries (events, recommendations)

## Notes

- **PostGIS**: Requires PostGIS extension. If not available, use separate `latitude`/`longitude` columns instead of `GEOGRAPHY(POINT, 4326)`
- **Timezones**: Events store `start_time`/`end_time` as TIMESTAMPTZ (UTC) with optional `timezone` field for display
- **JSONB Fields**: Use for flexible schema evolution without migrations:
  - `address` in facilities
  - `responses` in questionnaire_responses
  - `metadata` in all tables
  - `rationale` in recommendations

## Future Enhancements

Consider adding:
- `favorites` table (user favorites for facilities/events)
- `reviews` table (user reviews/ratings)
- `bookings` table (for future monetization)
- `notifications` table (push notification preferences)
- `audit_log` table (for compliance tracking)
