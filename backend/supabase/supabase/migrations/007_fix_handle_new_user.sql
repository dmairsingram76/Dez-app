-- ============================================================================
-- Migration 007: Fix handle_new_user trigger for anonymous sign-in
-- ============================================================================
-- The original handle_new_user() could fail and block auth.users INSERT,
-- causing "Database error creating anonymous user". This version:
--   1. Uses explicit public schema + search_path (avoids schema resolution issues)
--   2. ON CONFLICT DO NOTHING (handles duplicate profiles gracefully)
--   3. EXCEPTION handler (logs error but never blocks signup)
-- ============================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE LOG 'handle_new_user failed for %: %', NEW.id, SQLERRM;
  RETURN NEW;
END;
$$;
