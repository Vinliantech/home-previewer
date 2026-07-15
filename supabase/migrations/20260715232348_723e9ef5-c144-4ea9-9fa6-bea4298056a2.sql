
-- Enums
CREATE TYPE public.doc_category AS ENUM (
  'property','receipt','allocation_letter','agreement','spv',
  'share_certificate','token_certificate','kyc','rental_statement',
  'return_statement','valuation','legal','correspondence','other'
);
CREATE TYPE public.doc_visibility AS ENUM ('published','draft','archived');
CREATE TYPE public.doc_audit_action AS ENUM (
  'upload','replace','edit','assign','unassign','download','view',
  'archive','unarchive','delete','notify','confirm'
);

-- Main documents table
CREATE TABLE public.client_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  category public.doc_category NOT NULL DEFAULT 'other',
  related_property_id uuid REFERENCES public.tokenized_properties(id) ON DELETE SET NULL,
  related_investment_id uuid REFERENCES public.investments(id) ON DELETE SET NULL,
  issue_date date,
  expiry_date date,
  visibility public.doc_visibility NOT NULL DEFAULT 'published',
  require_confirmation boolean NOT NULL DEFAULT false,
  uploaded_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  current_version_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.client_documents TO authenticated;
GRANT ALL ON public.client_documents TO service_role;
ALTER TABLE public.client_documents ENABLE ROW LEVEL SECURITY;

-- Versions (append-only history)
CREATE TABLE public.client_document_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id uuid NOT NULL REFERENCES public.client_documents(id) ON DELETE CASCADE,
  version_no integer NOT NULL,
  storage_path text NOT NULL,
  file_name text NOT NULL,
  mime_type text,
  size_bytes bigint,
  uploaded_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  uploaded_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(document_id, version_no)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.client_document_versions TO authenticated;
GRANT ALL ON public.client_document_versions TO service_role;
ALTER TABLE public.client_document_versions ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.client_documents
  ADD CONSTRAINT client_documents_current_version_fk
  FOREIGN KEY (current_version_id) REFERENCES public.client_document_versions(id) ON DELETE SET NULL;

-- Assignments (per-client)
CREATE TABLE public.client_document_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id uuid NOT NULL REFERENCES public.client_documents(id) ON DELETE CASCADE,
  client_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  notify_email boolean NOT NULL DEFAULT true,
  notify_sms boolean NOT NULL DEFAULT false,
  notify_whatsapp boolean NOT NULL DEFAULT false,
  notified_at timestamptz,
  first_viewed_at timestamptz,
  last_viewed_at timestamptz,
  view_count integer NOT NULL DEFAULT 0,
  last_downloaded_at timestamptz,
  download_count integer NOT NULL DEFAULT 0,
  confirmed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(document_id, client_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.client_document_assignments TO authenticated;
GRANT ALL ON public.client_document_assignments TO service_role;
ALTER TABLE public.client_document_assignments ENABLE ROW LEVEL SECURITY;

-- Audit log
CREATE TABLE public.client_document_audit (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id uuid REFERENCES public.client_documents(id) ON DELETE CASCADE,
  assignment_id uuid REFERENCES public.client_document_assignments(id) ON DELETE SET NULL,
  version_id uuid REFERENCES public.client_document_versions(id) ON DELETE SET NULL,
  actor_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  action public.doc_audit_action NOT NULL,
  meta jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.client_document_audit TO authenticated;
GRANT ALL ON public.client_document_audit TO service_role;
ALTER TABLE public.client_document_audit ENABLE ROW LEVEL SECURITY;

-- Indexes
CREATE INDEX ON public.client_document_versions(document_id);
CREATE INDEX ON public.client_document_assignments(client_id);
CREATE INDEX ON public.client_document_assignments(document_id);
CREATE INDEX ON public.client_document_audit(document_id);

-- Updated_at triggers
CREATE TRIGGER trg_client_documents_updated BEFORE UPDATE ON public.client_documents
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_client_document_assignments_updated BEFORE UPDATE ON public.client_document_assignments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- RLS Policies
-- client_documents: admin full; clients read if assigned & published
CREATE POLICY "admin_all_docs" ON public.client_documents FOR ALL TO authenticated
  USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));
CREATE POLICY "client_read_assigned_docs" ON public.client_documents FOR SELECT TO authenticated
  USING (
    visibility = 'published' AND EXISTS (
      SELECT 1 FROM public.client_document_assignments a
      WHERE a.document_id = client_documents.id AND a.client_id = auth.uid()
    )
  );

-- versions: admin full; clients read versions of assigned docs
CREATE POLICY "admin_all_versions" ON public.client_document_versions FOR ALL TO authenticated
  USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));
CREATE POLICY "client_read_assigned_versions" ON public.client_document_versions FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.client_document_assignments a
      JOIN public.client_documents d ON d.id = a.document_id
      WHERE a.document_id = client_document_versions.document_id
        AND a.client_id = auth.uid()
        AND d.visibility = 'published'
    )
  );

-- assignments: admin full; clients read/update their own
CREATE POLICY "admin_all_assignments" ON public.client_document_assignments FOR ALL TO authenticated
  USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));
CREATE POLICY "client_read_own_assignments" ON public.client_document_assignments FOR SELECT TO authenticated
  USING (client_id = auth.uid());
CREATE POLICY "client_update_own_assignments" ON public.client_document_assignments FOR UPDATE TO authenticated
  USING (client_id = auth.uid()) WITH CHECK (client_id = auth.uid());

-- audit: admin read all, insert own; clients insert their own events on assignments
CREATE POLICY "admin_read_audit" ON public.client_document_audit FOR SELECT TO authenticated
  USING (public.is_admin(auth.uid()));
CREATE POLICY "auth_insert_audit" ON public.client_document_audit FOR INSERT TO authenticated
  WITH CHECK (actor_id = auth.uid());

-- RPCs
CREATE OR REPLACE FUNCTION public.admin_create_document(
  _title text, _description text, _category doc_category,
  _related_property_id uuid, _related_investment_id uuid,
  _issue_date date, _expiry_date date, _visibility doc_visibility,
  _require_confirmation boolean,
  _storage_path text, _file_name text, _mime text, _size bigint
) RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _doc_id uuid; _ver_id uuid;
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN RAISE EXCEPTION 'Admins only'; END IF;
  INSERT INTO public.client_documents(
    title, description, category, related_property_id, related_investment_id,
    issue_date, expiry_date, visibility, require_confirmation, uploaded_by
  ) VALUES (
    _title, _description, COALESCE(_category,'other'), _related_property_id, _related_investment_id,
    _issue_date, _expiry_date, COALESCE(_visibility,'published'), COALESCE(_require_confirmation,false), auth.uid()
  ) RETURNING id INTO _doc_id;

  INSERT INTO public.client_document_versions(document_id, version_no, storage_path, file_name, mime_type, size_bytes, uploaded_by)
  VALUES (_doc_id, 1, _storage_path, _file_name, _mime, _size, auth.uid())
  RETURNING id INTO _ver_id;

  UPDATE public.client_documents SET current_version_id = _ver_id WHERE id = _doc_id;
  INSERT INTO public.client_document_audit(document_id, version_id, actor_id, action, meta)
  VALUES (_doc_id, _ver_id, auth.uid(), 'upload', jsonb_build_object('file_name',_file_name,'size',_size));
  RETURN _doc_id;
END $$;

CREATE OR REPLACE FUNCTION public.admin_replace_document_file(
  _doc_id uuid, _storage_path text, _file_name text, _mime text, _size bigint
) RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _next integer; _ver_id uuid;
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN RAISE EXCEPTION 'Admins only'; END IF;
  SELECT COALESCE(MAX(version_no),0)+1 INTO _next FROM public.client_document_versions WHERE document_id = _doc_id;
  INSERT INTO public.client_document_versions(document_id, version_no, storage_path, file_name, mime_type, size_bytes, uploaded_by)
  VALUES (_doc_id, _next, _storage_path, _file_name, _mime, _size, auth.uid())
  RETURNING id INTO _ver_id;
  UPDATE public.client_documents SET current_version_id = _ver_id, updated_at = now() WHERE id = _doc_id;
  INSERT INTO public.client_document_audit(document_id, version_id, actor_id, action, meta)
  VALUES (_doc_id, _ver_id, auth.uid(), 'replace', jsonb_build_object('version',_next,'file_name',_file_name));
  RETURN _ver_id;
END $$;

CREATE OR REPLACE FUNCTION public.admin_assign_document(
  _doc_id uuid, _client_ids uuid[],
  _notify_email boolean, _notify_sms boolean, _notify_whatsapp boolean
) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _cid uuid;
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN RAISE EXCEPTION 'Admins only'; END IF;
  FOREACH _cid IN ARRAY _client_ids LOOP
    INSERT INTO public.client_document_assignments(document_id, client_id, notify_email, notify_sms, notify_whatsapp)
    VALUES (_doc_id, _cid, COALESCE(_notify_email,true), COALESCE(_notify_sms,false), COALESCE(_notify_whatsapp,false))
    ON CONFLICT (document_id, client_id) DO UPDATE
      SET notify_email = EXCLUDED.notify_email,
          notify_sms = EXCLUDED.notify_sms,
          notify_whatsapp = EXCLUDED.notify_whatsapp,
          updated_at = now();
    INSERT INTO public.client_document_audit(document_id, actor_id, action, meta)
    VALUES (_doc_id, auth.uid(), 'assign', jsonb_build_object('client_id',_cid));
  END LOOP;
END $$;

CREATE OR REPLACE FUNCTION public.admin_unassign_document(_assignment_id uuid) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _doc uuid; _cid uuid;
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN RAISE EXCEPTION 'Admins only'; END IF;
  SELECT document_id, client_id INTO _doc, _cid FROM public.client_document_assignments WHERE id = _assignment_id;
  DELETE FROM public.client_document_assignments WHERE id = _assignment_id;
  INSERT INTO public.client_document_audit(document_id, actor_id, action, meta)
  VALUES (_doc, auth.uid(), 'unassign', jsonb_build_object('client_id',_cid));
END $$;

CREATE OR REPLACE FUNCTION public.admin_set_document_visibility(_doc_id uuid, _visibility doc_visibility) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN RAISE EXCEPTION 'Admins only'; END IF;
  UPDATE public.client_documents SET visibility = _visibility, updated_at = now() WHERE id = _doc_id;
  INSERT INTO public.client_document_audit(document_id, actor_id, action, meta)
  VALUES (_doc_id, auth.uid(), CASE WHEN _visibility='archived' THEN 'archive' ELSE 'unarchive' END::doc_audit_action, jsonb_build_object('visibility',_visibility));
END $$;

CREATE OR REPLACE FUNCTION public.admin_edit_document(
  _doc_id uuid, _title text, _description text, _category doc_category,
  _related_property_id uuid, _related_investment_id uuid,
  _issue_date date, _expiry_date date, _require_confirmation boolean
) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN RAISE EXCEPTION 'Admins only'; END IF;
  UPDATE public.client_documents SET
    title = COALESCE(_title, title),
    description = _description,
    category = COALESCE(_category, category),
    related_property_id = _related_property_id,
    related_investment_id = _related_investment_id,
    issue_date = _issue_date,
    expiry_date = _expiry_date,
    require_confirmation = COALESCE(_require_confirmation, require_confirmation),
    updated_at = now()
  WHERE id = _doc_id;
  INSERT INTO public.client_document_audit(document_id, actor_id, action, meta)
  VALUES (_doc_id, auth.uid(), 'edit', '{}'::jsonb);
END $$;

CREATE OR REPLACE FUNCTION public.admin_delete_document(_doc_id uuid) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN RAISE EXCEPTION 'Admins only'; END IF;
  INSERT INTO public.client_document_audit(document_id, actor_id, action, meta)
  VALUES (_doc_id, auth.uid(), 'delete', '{}'::jsonb);
  DELETE FROM public.client_documents WHERE id = _doc_id;
END $$;

CREATE OR REPLACE FUNCTION public.client_log_document_event(_assignment_id uuid, _action doc_audit_action) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _doc uuid; _cid uuid;
BEGIN
  SELECT document_id, client_id INTO _doc, _cid FROM public.client_document_assignments WHERE id = _assignment_id;
  IF _cid IS NULL THEN RAISE EXCEPTION 'Assignment not found'; END IF;
  IF _cid <> auth.uid() AND NOT public.is_admin(auth.uid()) THEN RAISE EXCEPTION 'Forbidden'; END IF;
  IF _action = 'view' THEN
    UPDATE public.client_document_assignments SET
      first_viewed_at = COALESCE(first_viewed_at, now()),
      last_viewed_at = now(),
      view_count = view_count + 1,
      updated_at = now()
    WHERE id = _assignment_id;
  ELSIF _action = 'download' THEN
    UPDATE public.client_document_assignments SET
      last_downloaded_at = now(),
      download_count = download_count + 1,
      updated_at = now()
    WHERE id = _assignment_id;
  ELSIF _action = 'confirm' THEN
    UPDATE public.client_document_assignments SET
      confirmed_at = COALESCE(confirmed_at, now()), updated_at = now()
    WHERE id = _assignment_id;
  END IF;
  INSERT INTO public.client_document_audit(document_id, assignment_id, actor_id, action, meta)
  VALUES (_doc, _assignment_id, auth.uid(), _action, '{}'::jsonb);
END $$;

CREATE OR REPLACE FUNCTION public.admin_mark_document_notified(_doc_id uuid, _client_ids uuid[]) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN RAISE EXCEPTION 'Admins only'; END IF;
  UPDATE public.client_document_assignments SET notified_at = now(), updated_at = now()
   WHERE document_id = _doc_id AND client_id = ANY(_client_ids);
  INSERT INTO public.client_document_audit(document_id, actor_id, action, meta)
  VALUES (_doc_id, auth.uid(), 'notify', jsonb_build_object('clients',_client_ids));
END $$;

-- Storage RLS for client-documents bucket
CREATE POLICY "admin_all_client_docs_storage" ON storage.objects FOR ALL TO authenticated
  USING (bucket_id = 'client-documents' AND public.is_admin(auth.uid()))
  WITH CHECK (bucket_id = 'client-documents' AND public.is_admin(auth.uid()));

CREATE POLICY "client_read_assigned_files" ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'client-documents' AND EXISTS (
      SELECT 1 FROM public.client_document_versions v
      JOIN public.client_document_assignments a ON a.document_id = v.document_id
      JOIN public.client_documents d ON d.id = v.document_id
      WHERE v.storage_path = storage.objects.name
        AND a.client_id = auth.uid()
        AND d.visibility = 'published'
    )
  );
