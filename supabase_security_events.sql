-- ==============================================================================
-- STEAV LUXURY E-COMMERCE — SECURITY EVENTS & MONITORING MIGRATION
-- Target: Supabase Cloud PostgreSQL (Run in Staging first, then Production)
-- Reversible: See ROLLBACK section at the bottom of this file.
-- ==============================================================================

-- 1. Create security_events table
CREATE TABLE IF NOT EXISTS public.security_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type text NOT NULL CHECK (char_length(event_type) BETWEEN 1 AND 80),
  severity text NOT NULL CHECK (severity IN ('CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'INFO')),
  source_ip text CHECK (source_ip IS NULL OR char_length(source_ip) <= 64),
  endpoint text NOT NULL CHECK (char_length(endpoint) BETWEEN 1 AND 255),
  user_id uuid NULL,
  user_agent text CHECK (user_agent IS NULL OR char_length(user_agent) <= 300),
  event_details jsonb NOT NULL DEFAULT '{}'::jsonb,
  detection_reason text NOT NULL CHECK (char_length(detection_reason) BETWEEN 1 AND 300),
  action_taken text NOT NULL CHECK (char_length(action_taken) BETWEEN 1 AND 120),
  correlation_id text NOT NULL CHECK (char_length(correlation_id) BETWEEN 1 AND 100),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 2. Performance & Detection Indexes
CREATE INDEX IF NOT EXISTS idx_security_events_created_at
  ON public.security_events (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_security_events_severity_created
  ON public.security_events (severity, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_security_events_type_created
  ON public.security_events (event_type, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_security_events_ip_created
  ON public.security_events (source_ip, created_at DESC)
  WHERE source_ip IS NOT NULL;

-- 3. Strict Row-Level Security (RLS)
ALTER TABLE public.security_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "security_events_select_admin_only" ON public.security_events;
DROP POLICY IF EXISTS "security_events_deny_insert" ON public.security_events;
DROP POLICY IF EXISTS "security_events_deny_update" ON public.security_events;
DROP POLICY IF EXISTS "security_events_deny_delete" ON public.security_events;

-- Only verified security administrators can read security events
CREATE POLICY "security_events_select_admin_only"
  ON public.security_events FOR SELECT
  TO authenticated
  USING (public.is_admin());

-- Untrusted clients (anon & authenticated) CANNOT insert, update, or delete events.
-- Only trusted server-side functions using SUPABASE_SERVICE_ROLE_KEY can insert.
CREATE POLICY "security_events_deny_insert"
  ON public.security_events FOR INSERT
  WITH CHECK (false);

CREATE POLICY "security_events_deny_update"
  ON public.security_events FOR UPDATE
  USING (false);

CREATE POLICY "security_events_deny_delete"
  ON public.security_events FOR DELETE
  USING (false);

-- 4. Retention Policy Helper (90-day retention for privacy & storage hygiene)
CREATE OR REPLACE FUNCTION public.purge_old_security_events(days_to_keep integer DEFAULT 90)
RETURNS integer AS $$
DECLARE
  deleted_count integer;
BEGIN
  DELETE FROM public.security_events
  WHERE created_at < now() - make_interval(days => GREATEST(7, days_to_keep));
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==============================================================================
-- ROLLBACK INSTRUCTIONS (If you need to revert this migration):
--   DROP FUNCTION IF EXISTS public.purge_old_security_events(integer);
--   DROP TABLE IF EXISTS public.security_events;
-- ==============================================================================

