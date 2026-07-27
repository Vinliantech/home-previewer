-- Manage the Brevo connection from the CRM, without exposing the credential.
--
-- crm_integrations already separates non_secret_config from everything else,
-- and its policy makes the whole row readable by every CRM admin. That is
-- correct for a list id or a sender address and wrong for an API key: a Brevo
-- key can read the entire contact database and send mail as the company, so a
-- CRM admin being able to SELECT it is a real exposure, not a theoretical one.
--
-- Secrets therefore live in their own table that NO logged-in role can read.
-- There is no SELECT grant and no policy granting one — only the service role,
-- which server functions use, can see the value. Admins write a new key and
-- read back nothing but "configured" and the last four characters.

CREATE TABLE IF NOT EXISTS public.integration_secrets (
  provider text PRIMARY KEY,
  secret text NOT NULL,
  -- Shown in the UI so an admin can tell which key is loaded without seeing it.
  last_four text NOT NULL,
  updated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.integration_secrets ENABLE ROW LEVEL SECURITY;

-- Deliberately no grants to anon or authenticated, and deliberately no
-- policies. Even a CRM admin querying this table directly through PostgREST
-- gets nothing back. Reads happen only through the service role.
REVOKE ALL ON public.integration_secrets FROM PUBLIC, anon, authenticated;
GRANT ALL ON public.integration_secrets TO service_role;

COMMENT ON TABLE public.integration_secrets IS
  'Write-only credential store. No role except service_role may read it. Set '
  'values with set_integration_secret(); check them with '
  'integration_secret_status(), which never returns the secret.';

/**
 * Store or replace a provider credential.
 *
 * SECURITY DEFINER so a CRM admin can write without being granted access to
 * the table itself — they can set a key and never read one.
 */
CREATE OR REPLACE FUNCTION public.set_integration_secret(_provider text, _secret text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_secret text := btrim(_secret);
BEGIN
  IF NOT public.is_crm_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Only CRM administrators can change integration credentials';
  END IF;

  IF v_secret = '' THEN
    DELETE FROM public.integration_secrets WHERE provider = _provider;
    RETURN;
  END IF;

  IF length(v_secret) < 12 THEN
    RAISE EXCEPTION 'That does not look like a valid API key';
  END IF;

  INSERT INTO public.integration_secrets (provider, secret, last_four, updated_by, updated_at)
  VALUES (_provider, v_secret, right(v_secret, 4), auth.uid(), now())
  ON CONFLICT (provider) DO UPDATE SET
    secret = EXCLUDED.secret,
    last_four = EXCLUDED.last_four,
    updated_by = EXCLUDED.updated_by,
    updated_at = now();
END
$$;

REVOKE ALL ON FUNCTION public.set_integration_secret(text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.set_integration_secret(text, text) TO authenticated;

/** Whether a credential is loaded, and its last four characters. Never the value. */
CREATE OR REPLACE FUNCTION public.integration_secret_status(_provider text)
RETURNS TABLE (configured boolean, last_four text, updated_at timestamptz)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_crm_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Only CRM administrators can view integration status';
  END IF;

  RETURN QUERY
  SELECT true, s.last_four, s.updated_at
  FROM public.integration_secrets s
  WHERE s.provider = _provider;

  IF NOT FOUND THEN
    RETURN QUERY SELECT false, NULL::text, NULL::timestamptz;
  END IF;
END
$$;

REVOKE ALL ON FUNCTION public.integration_secret_status(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.integration_secret_status(text) TO authenticated;

-- The Brevo row admins edit. Non-secret only: list, template, sender, and the
-- address internal notifications go to.
INSERT INTO public.crm_integrations (provider, display_name, status, non_secret_config)
VALUES (
  'brevo',
  'Brevo',
  'not_configured',
  jsonb_build_object(
    'list_id', null,
    'template_id', null,
    'sender_name', 'Kay-Steph Group',
    'sender_email', 'events@kaystephgroup.com',
    'admin_email', null
  )
)
ON CONFLICT (provider) DO NOTHING;
