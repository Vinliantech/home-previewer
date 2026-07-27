-- No inbound lead is lost when capture fails.
--
-- The Meta webhook caught per-lead capture errors, logged them to the console
-- and carried on, then returned 200. The comment there reasoned that "Meta
-- retries the entire batch" — but a 200 is exactly what tells Meta the delivery
-- succeeded, so no retry ever came. A database blip, an RLS change or a bad
-- field value meant that lead's name, email and phone existed only in a log
-- line, and the follow-up never happened.
--
-- Failed captures now land here with everything needed to replay them.

CREATE TABLE IF NOT EXISTS public.lead_capture_failures (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source text NOT NULL,
  -- The provider's id for this submission (Meta's leadgen_id), where there is
  -- one. Lets a repeated delivery update the existing row instead of piling up.
  submission_id text,
  -- The normalised LeadCaptureInput, so a retry is a straight replay rather
  -- than a re-parse of the provider's payload.
  payload jsonb NOT NULL,
  -- Kept alongside for diagnosis when the normalisation itself was at fault.
  raw_payload jsonb,
  error text NOT NULL,
  attempts integer NOT NULL DEFAULT 1,
  last_attempt_at timestamptz NOT NULL DEFAULT now(),
  resolved_at timestamptz,
  resolved_lead_id uuid REFERENCES public.leads(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS lead_capture_failures_submission_uidx
  ON public.lead_capture_failures(source, submission_id)
  WHERE submission_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS lead_capture_failures_unresolved_idx
  ON public.lead_capture_failures(created_at DESC)
  WHERE resolved_at IS NULL;

COMMENT ON TABLE public.lead_capture_failures IS
  'Inbound leads whose capture threw. Holds the normalised input so an admin '
  'can replay it. A row with resolved_at set has been captured successfully.';

-- Contact details of real people: CRM staff only, never the lead themselves.
ALTER TABLE public.lead_capture_failures ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE ON public.lead_capture_failures TO authenticated;
GRANT ALL ON public.lead_capture_failures TO service_role;

DROP POLICY IF EXISTS lcf_crm_admin_all ON public.lead_capture_failures;
CREATE POLICY lcf_crm_admin_all ON public.lead_capture_failures FOR ALL TO authenticated
  USING (public.is_crm_admin(auth.uid()))
  WITH CHECK (public.is_crm_admin(auth.uid()));

-- When was the last Facebook lead actually captured? The integration panel
-- only checked that environment variables were non-empty, which stays true
-- long after a page access token expires — the most common way this breaks.
CREATE OR REPLACE FUNCTION public.crm_last_capture_at(_source text)
RETURNS timestamptz
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT max(captured_at)
  FROM public.lead_interests
  WHERE source = _source
    AND public.is_crm_admin(auth.uid());
$$;

REVOKE ALL ON FUNCTION public.crm_last_capture_at(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.crm_last_capture_at(text) TO authenticated;
