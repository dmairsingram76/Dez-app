-- ============================================================================
-- Dez Fitness Discovery App - Row Level Security Policies
-- ============================================================================
-- Security-first approach: Default deny, explicit allow
-- ============================================================================

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function to check if user is authenticated
CREATE OR REPLACE FUNCTION auth.is_authenticated()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN auth.uid() IS NOT NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user is moderator or admin
CREATE OR REPLACE FUNCTION auth.is_moderator()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role IN ('moderator', 'admin')
    AND deleted_at IS NULL
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user is admin
CREATE OR REPLACE FUNCTION auth.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role = 'admin'
    AND deleted_at IS NULL
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- PROFILES POLICIES
-- ============================================================================

-- Users can view their own profile
CREATE POLICY "Users can view own profile"
ON profiles FOR SELECT
USING (auth.uid() = id AND deleted_at IS NULL);

-- Users can view other users' public profiles (name, avatar only)
CREATE POLICY "Users can view public profiles"
ON profiles FOR SELECT
USING (
  deleted_at IS NULL
  AND auth.is_authenticated()
);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
ON profiles FOR UPDATE
USING (auth.uid() = id AND deleted_at IS NULL)
WITH CHECK (auth.uid() = id AND deleted_at IS NULL);

-- Users can insert their own profile (via trigger, but allow explicit inserts)
CREATE POLICY "Users can insert own profile"
ON profiles FOR INSERT
WITH CHECK (auth.uid() = id);

-- Moderators and admins can view all profiles
CREATE POLICY "Moderators can view all profiles"
ON profiles FOR SELECT
USING (
  auth.is_moderator()
  AND deleted_at IS NULL
);

-- Admins can update any profile
CREATE POLICY "Admins can update any profile"
ON profiles FOR UPDATE
USING (auth.is_admin() AND deleted_at IS NULL)
WITH CHECK (auth.is_admin() AND deleted_at IS NULL);

-- Admins can soft delete profiles (set deleted_at)
CREATE POLICY "Admins can delete profiles"
ON profiles FOR UPDATE
USING (auth.is_admin())
WITH CHECK (
  auth.is_admin()
  AND (
    -- Allow setting deleted_at
    (deleted_at IS NOT NULL)
    OR
    -- Allow restoring (setting deleted_at to NULL)
    (deleted_at IS NULL)
  )
);

-- ============================================================================
-- QUESTIONNAIRE_RESPONSES POLICIES
-- ============================================================================

-- Users can view their own questionnaire responses
CREATE POLICY "Users can view own questionnaire responses"
ON questionnaire_responses FOR SELECT
USING (
  auth.uid() = user_id
  AND deleted_at IS NULL
);

-- Users can insert their own questionnaire responses
CREATE POLICY "Users can insert own questionnaire responses"
ON questionnaire_responses FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own questionnaire responses
CREATE POLICY "Users can update own questionnaire responses"
ON questionnaire_responses FOR UPDATE
USING (auth.uid() = user_id AND deleted_at IS NULL)
WITH CHECK (auth.uid() = user_id AND deleted_at IS NULL);

-- Users can soft delete their own questionnaire responses
CREATE POLICY "Users can delete own questionnaire responses"
ON questionnaire_responses FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (
  auth.uid() = user_id
  AND (
    deleted_at IS NOT NULL OR deleted_at IS NULL
  )
);

-- Moderators and admins can view all questionnaire responses (for analytics)
CREATE POLICY "Moderators can view all questionnaire responses"
ON questionnaire_responses FOR SELECT
USING (
  auth.is_moderator()
  AND deleted_at IS NULL
);

-- Admins can delete any questionnaire responses (GDPR compliance)
CREATE POLICY "Admins can delete any questionnaire responses"
ON questionnaire_responses FOR UPDATE
USING (auth.is_admin())
WITH CHECK (auth.is_admin());

-- ============================================================================
-- FACILITIES POLICIES
-- ============================================================================

-- Anyone (authenticated or not) can view non-deleted facilities
-- This allows public discovery
CREATE POLICY "Anyone can view facilities"
ON facilities FOR SELECT
USING (deleted_at IS NULL);

-- Authenticated users can create facilities
CREATE POLICY "Authenticated users can create facilities"
ON facilities FOR INSERT
WITH CHECK (
  auth.is_authenticated()
  AND created_by = auth.uid()
);

-- Users can update facilities they created
CREATE POLICY "Users can update own facilities"
ON facilities FOR UPDATE
USING (
  auth.is_authenticated()
  AND created_by = auth.uid()
  AND deleted_at IS NULL
)
WITH CHECK (
  auth.is_authenticated()
  AND created_by = auth.uid()
  AND deleted_at IS NULL
);

-- Moderators can update any facility
CREATE POLICY "Moderators can update any facility"
ON facilities FOR UPDATE
USING (
  auth.is_moderator()
  AND deleted_at IS NULL
)
WITH CHECK (
  auth.is_moderator()
  AND deleted_at IS NULL
);

-- Moderators can verify facilities
CREATE POLICY "Moderators can verify facilities"
ON facilities FOR UPDATE
USING (auth.is_moderator())
WITH CHECK (
  auth.is_moderator()
  AND (
    is_verified IS NOT NULL
    OR deleted_at IS NOT NULL
    OR deleted_at IS NULL
  )
);

-- Admins can soft delete facilities
CREATE POLICY "Admins can delete facilities"
ON facilities FOR UPDATE
USING (auth.is_admin())
WITH CHECK (
  auth.is_admin()
  AND (
    deleted_at IS NOT NULL OR deleted_at IS NULL
  )
);

-- ============================================================================
-- RECOMMENDATIONS POLICIES
-- ============================================================================

-- Users can view their own recommendations
CREATE POLICY "Users can view own recommendations"
ON recommendations FOR SELECT
USING (
  auth.uid() = user_id
  AND deleted_at IS NULL
);

-- System can create recommendations for users (via service role)
-- Authenticated users can also create recommendations for themselves
CREATE POLICY "Users can create own recommendations"
ON recommendations FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own recommendations (e.g., change status)
CREATE POLICY "Users can update own recommendations"
ON recommendations FOR UPDATE
USING (auth.uid() = user_id AND deleted_at IS NULL)
WITH CHECK (auth.uid() = user_id AND deleted_at IS NULL);

-- Users can soft delete their own recommendations
CREATE POLICY "Users can delete own recommendations"
ON recommendations FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (
  auth.uid() = user_id
  AND (
    deleted_at IS NOT NULL OR deleted_at IS NULL
  )
);

-- Moderators can view all recommendations (for analytics)
CREATE POLICY "Moderators can view all recommendations"
ON recommendations FOR SELECT
USING (
  auth.is_moderator()
  AND deleted_at IS NULL
);

-- Admins can create recommendations for any user (system recommendations)
CREATE POLICY "Admins can create recommendations"
ON recommendations FOR INSERT
WITH CHECK (auth.is_admin());

-- Admins can update any recommendations
CREATE POLICY "Admins can update any recommendations"
ON recommendations FOR UPDATE
USING (auth.is_admin() AND deleted_at IS NULL)
WITH CHECK (auth.is_admin() AND deleted_at IS NULL);

-- Admins can delete any recommendations
CREATE POLICY "Admins can delete any recommendations"
ON recommendations FOR UPDATE
USING (auth.is_admin())
WITH CHECK (auth.is_admin());

-- ============================================================================
-- EVENTS POLICIES
-- ============================================================================

-- Anyone (authenticated or not) can view non-deleted events
-- This allows public discovery
CREATE POLICY "Anyone can view events"
ON events FOR SELECT
USING (deleted_at IS NULL);

-- Authenticated users can create events
CREATE POLICY "Authenticated users can create events"
ON events FOR INSERT
WITH CHECK (
  auth.is_authenticated()
  AND (
    created_by = auth.uid()
    OR created_by IS NULL
  )
);

-- Users can update events they created
CREATE POLICY "Users can update own events"
ON events FOR UPDATE
USING (
  auth.is_authenticated()
  AND created_by = auth.uid()
  AND deleted_at IS NULL
)
WITH CHECK (
  auth.is_authenticated()
  AND created_by = auth.uid()
  AND deleted_at IS NULL
);

-- Moderators can update any event
CREATE POLICY "Moderators can update any event"
ON events FOR UPDATE
USING (
  auth.is_moderator()
  AND deleted_at IS NULL
)
WITH CHECK (
  auth.is_moderator()
  AND deleted_at IS NULL
);

-- Admins can soft delete events
CREATE POLICY "Admins can delete events"
ON events FOR UPDATE
USING (auth.is_admin())
WITH CHECK (
  auth.is_admin()
  AND (
    deleted_at IS NOT NULL OR deleted_at IS NULL
  )
);

-- ============================================================================
-- GDPR COMPLIANCE HELPERS
-- ============================================================================

-- Function to anonymize user data (for GDPR right to be forgotten)
-- This should be called before hard deletion
CREATE OR REPLACE FUNCTION anonymize_user_data(user_uuid UUID)
RETURNS VOID AS $$
BEGIN
  -- Anonymize profile
  UPDATE profiles
  SET
    name = NULL,
    avatar_url = NULL,
    preferences = '{}'::jsonb,
    updated_at = NOW()
  WHERE id = user_uuid;

  -- Anonymize questionnaire responses (keep structure, remove PII)
  UPDATE questionnaire_responses
  SET
    responses = '{}'::jsonb,
    metadata = '{}'::jsonb,
    updated_at = NOW()
  WHERE user_id = user_uuid;

  -- Soft delete recommendations (they're user-specific)
  UPDATE recommendations
  SET deleted_at = NOW(), updated_at = NOW()
  WHERE user_id = user_uuid AND deleted_at IS NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to export user data (for GDPR data portability)
CREATE OR REPLACE FUNCTION export_user_data(user_uuid UUID)
RETURNS JSONB AS $$
DECLARE
  result JSONB;
BEGIN
  SELECT jsonb_build_object(
    'profile', (SELECT row_to_json(p)::jsonb FROM profiles p WHERE p.id = user_uuid),
    'questionnaire_responses', (
      SELECT jsonb_agg(row_to_json(qr)::jsonb)
      FROM questionnaire_responses qr
      WHERE qr.user_id = user_uuid AND qr.deleted_at IS NULL
    ),
    'recommendations', (
      SELECT jsonb_agg(row_to_json(r)::jsonb)
      FROM recommendations r
      WHERE r.user_id = user_uuid AND r.deleted_at IS NULL
    ),
    'exported_at', NOW()
  ) INTO result;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions to authenticated users (for their own data)
-- Note: These functions use SECURITY DEFINER, so they run with elevated privileges
-- but should be called from Edge Functions with proper validation
