-- Client documentation numbers, and a reviewed document exchange.
--
-- Two gaps this closes:
--
-- 1. Clients had no reference number. client_applications.application_ref_no is
--    rendered in three admin screens but was never written by anything, so it
--    always showed "—". Every client now carries a stable KS-C-##### number
--    from the moment they register.
--
-- 2. documents already had approval_status/approved_by/approved_at, but no
--    policy stopped a client setting approval_status themselves on insert, and
--    no policy let an admin update the row to approve it. So the column was
--    both unenforceable and unusable.

-- =========================== CLIENT NUMBERS ===========================

CREATE SEQUENCE IF NOT EXISTS public.client_number_seq;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS client_number integer;

-- Backfill in registration order so the earliest client is KS-C-00001 rather
-- than whatever order the table happens to be stored in.
WITH ordered AS (
  SELECT id, row_number() OVER (ORDER BY created_at, id) AS rn
  FROM public.profiles
  WHERE client_number IS NULL
)
UPDATE public.profiles p
SET client_number = o.rn
FROM ordered o
WHERE p.id = o.id;

SELECT setval(
  'public.client_number_seq',
  COALESCE((SELECT max(client_number) FROM public.profiles), 0) + 1,
  false
);

ALTER TABLE public.profiles
  ALTER COLUMN client_number SET DEFAULT nextval('public.client_number_seq');

DO $$ BEGIN
  ALTER TABLE public.profiles ALTER COLUMN client_number SET NOT NULL;
EXCEPTION WHEN others THEN NULL; END $$;

CREATE UNIQUE INDEX IF NOT EXISTS profiles_client_number_key
  ON public.profiles(client_number);

COMMENT ON COLUMN public.profiles.client_number IS
  'Stable documentation number, rendered as KS-C-00001. Assigned on signup by '
  'the column default; never reused or reissued.';

-- The signup trigger inserts into profiles without naming this column, so the
-- default supplies it. No trigger change is needed.

-- =========================== DOCUMENT EXCHANGE ===========================

ALTER TABLE public.documents
  ADD COLUMN IF NOT EXISTS uploaded_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS storage_path text,
  ADD COLUMN IF NOT EXISTS rejection_reason text;

CREATE INDEX IF NOT EXISTS documents_uploaded_by_idx ON public.documents(uploaded_by);

COMMENT ON COLUMN public.documents.uploaded_by IS
  'Who put the file there. Differs from user_id, which is the client the '
  'document belongs to, whenever an admin uploads on a client''s behalf.';
COMMENT ON COLUMN public.documents.rejection_reason IS
  'Shown to the client so they know what to re-upload. Set with '
  'approval_status = rejected.';

-- A client may lodge a document against their own account, and may see it
-- immediately as pending — but only an admin decides approval. Without this
-- the existing insert policy let a client post a row already marked approved.
CREATE OR REPLACE FUNCTION public.guard_document_review()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF public.is_admin(auth.uid()) THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'INSERT' THEN
    -- Everything a client lodges starts pending, whatever they submitted.
    NEW.approval_status := 'pending';
    NEW.approved_by := NULL;
    NEW.approved_at := NULL;
    NEW.rejection_reason := NULL;
    NEW.uploaded_by := auth.uid();
    RETURN NEW;
  END IF;

  IF NEW.approval_status IS DISTINCT FROM OLD.approval_status
     OR NEW.approved_by IS DISTINCT FROM OLD.approved_by
     OR NEW.approved_at IS DISTINCT FROM OLD.approved_at
     OR NEW.rejection_reason IS DISTINCT FROM OLD.rejection_reason
     OR NEW.user_id IS DISTINCT FROM OLD.user_id
  THEN
    RAISE EXCEPTION 'Document approval is decided by Kay-Steph, not by the uploader'
      USING ERRCODE = 'insufficient_privilege';
  END IF;

  RETURN NEW;
END
$$;

DROP TRIGGER IF EXISTS guard_document_review_trg ON public.documents;
CREATE TRIGGER guard_document_review_trg
BEFORE INSERT OR UPDATE ON public.documents
FOR EACH ROW EXECUTE FUNCTION public.guard_document_review();

-- Admins review; clients may correct their own pending upload's description.
DROP POLICY IF EXISTS documents_admin_update ON public.documents;
CREATE POLICY documents_admin_update ON public.documents FOR UPDATE TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS documents_own_update_pending ON public.documents;
CREATE POLICY documents_own_update_pending ON public.documents FOR UPDATE TO authenticated
  USING (user_id = auth.uid() AND approval_status = 'pending')
  WITH CHECK (user_id = auth.uid());

-- A client may withdraw something they lodged, while it is still pending.
DROP POLICY IF EXISTS documents_own_delete_pending ON public.documents;
CREATE POLICY documents_own_delete_pending ON public.documents FOR DELETE TO authenticated
  USING (user_id = auth.uid() AND approval_status = 'pending');

GRANT UPDATE, DELETE ON public.documents TO authenticated;

-- =========================== STORAGE ===========================
--
-- NOTE: the bucket itself is NOT created here — this project creates buckets
-- through the Supabase dashboard (avatars, investor-kyc and payment-evidence
-- all exist that way, with only their policies in migrations). Create a
-- PRIVATE bucket named "client-documents" before these policies do anything.
--
-- Layout is client-documents/<client user id>/<file>, so the first path
-- segment is the owner, matching the investor-kyc convention.

DROP POLICY IF EXISTS "client upload own documents" ON storage.objects;
CREATE POLICY "client upload own documents" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'client-documents'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "client read own documents" ON storage.objects;
CREATE POLICY "client read own documents" ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'client-documents'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "admin manage client documents" ON storage.objects;
CREATE POLICY "admin manage client documents" ON storage.objects FOR ALL TO authenticated
  USING (bucket_id = 'client-documents' AND public.is_admin(auth.uid()))
  WITH CHECK (bucket_id = 'client-documents' AND public.is_admin(auth.uid()));
