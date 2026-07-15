# Kay-Steph Client Documents System

Replace the current read-only admin Documents list with a full upload/assign workflow, and give each client a Documents tab in their portal.

## 1. Database (single migration)

New enums:
- `doc_category`: property, receipt, allocation_letter, agreement, spv, share_certificate, token_certificate, kyc, rental_statement, return_statement, valuation, legal, correspondence, other
- `doc_visibility`: published, draft, archived
- `doc_audit_action`: upload, replace, download, view, archive, unarchive, delete, notify

New tables (all with GRANTs, RLS, updated_at trigger):
- `client_documents` — canonical doc record (title, description, category, related_property_id, related_investment_id, issue_date, expiry_date, visibility, require_confirmation, uploaded_by, current_version_id, created_at)
- `client_document_versions` — every uploaded file (document_id, version_no, storage_path, file_name, mime_type, size_bytes, uploaded_by, uploaded_at). Replace = new row, never delete.
- `client_document_assignments` — many-to-many (document_id, client_id, notify_email, notify_sms, confirmed_at, first_viewed_at, last_downloaded_at). One row per client for shared docs.
- `client_document_audit` — append-only log (document_id, assignment_id, actor_id, action, meta jsonb, created_at)

RLS:
- Admins (via `is_admin(auth.uid())`) full access on all four tables.
- Clients: SELECT on `client_documents` only via join to `client_document_assignments WHERE client_id = auth.uid() AND visibility = 'published'`. SELECT own assignment rows. UPDATE own assignment (confirmed_at, viewed/downloaded stamps). SELECT versions of docs they're assigned to. No client access to audit.

RPCs (SECURITY DEFINER):
- `admin_assign_document(_doc_id, _client_ids[], _notify {email,sms,whatsapp})` — inserts assignments, writes audit, queues notifications.
- `admin_replace_document_file(_doc_id, _storage_path, _file_name, _mime, _size)` — inserts new version, updates current_version_id, writes audit.
- `client_confirm_document(_assignment_id)` — sets confirmed_at, audit.
- `client_log_document_event(_assignment_id, _action)` — for view/download counters.
- `admin_get_document_audit(_doc_id)` — returns audit + version history for admin.

## 2. Storage

Private bucket `client-documents` (create via tool). RLS on `storage.objects`:
- Only admins can INSERT/UPDATE/DELETE.
- SELECT: admins, or client whose id matches an assignment on the doc referenced by the path prefix (`{document_id}/v{n}/{filename}`).
- All client downloads use signed URLs (60s expiry) generated in a server function; storage URLs never rendered raw.

Client-side upload uses `supabase.storage.from('client-documents').upload()` from the admin UI (admin's session is authorized).

## 3. Admin UI

Rewrite `src/components/admin/support-ops.tsx → DocumentsModule` and add sub-components in `src/components/admin/documents/`:

- **Toolbar**: `[Upload Document]` primary button, search input (client name/email), category filter, visibility filter.
- **Table columns**: Title, Category, Assigned to (chip or "5 clients"), Version, Issued, Expires, Status, Views/Downloads, Actions.
- **Row actions menu**: Download, Replace file, Edit details, Manage assignments, Resend notification, View history, Archive/Unarchive, Delete.
- **Upload dialog** (multi-step):
  1. Pick file(s) — drag/drop; validates mime (`pdf, doc, docx, jpg, jpeg, png, webp, xlsx, csv`) and size (≤ 25 MB).
  2. Metadata: title, category, description, related property (select from `tokenized_properties`), related investment (optional), issue_date, expiry_date, visibility, require_confirmation.
  3. Assign: client search (searches `profiles` by name/email, multi-select). Toggle "General document — assign to multiple selected clients".
  4. Notification: in-app (default on), email (default on), SMS/WhatsApp (toggle, disabled with tooltip if channel not configured).
  5. Review → Publish.
- **History drawer**: shows all versions (download each), full audit log, per-client open/download timestamps.
- **Client profile "Add Document" action**: pre-fills the client in step 3 (accessible from an existing admin client-profile view; if none, add later — out of scope here).

## 4. Client Portal

- Add nav item in `portfolio.tsx` under Documents group: `{ to: "/portfolio/documents", label: "Documents", icon: FileText }`.
- New route `src/routes/_authenticated/portfolio.documents.tsx`:
  - Table/card list of assigned published docs.
  - Columns: Title, Category, Related property, Issued, Expires, Status.
  - Row expand shows description; buttons: Preview (inline for pdf/image via signed URL), Download (server fn returns signed URL, logs event), Confirm receipt (if `require_confirmation`).
  - Unread badge (no `first_viewed_at` on assignment).

## 5. Server functions (`src/lib/documents.functions.ts`)

- `getDocumentSignedUrl({ assignment_id })` — `requireSupabaseAuth`; verifies caller owns assignment or is admin; returns 60s signed URL; calls `client_log_document_event`.
- `adminGetSignedUrl({ version_id })` — admin only.
- `sendDocumentNotification({ doc_id, client_ids, channels })` — writes `investor_notifications` rows (in-app), sends email via existing `sendTemplateEmail` (new template `client-document-assigned`), SMS/WhatsApp stubbed with TODO if no connector.

## 6. Email template

`src/lib/email-templates/client-document-assigned.tsx` — React Email; props `{ clientName, documentTitle, portalUrl }`; register in `registry.ts`.

## 7. Files created / edited

Created:
- `supabase/migrations/<timestamp>_client_documents.sql`
- `src/components/admin/documents/UploadDialog.tsx`
- `src/components/admin/documents/AssignmentPicker.tsx`
- `src/components/admin/documents/HistoryDrawer.tsx`
- `src/lib/documents.functions.ts`
- `src/routes/_authenticated/portfolio.documents.tsx`
- `src/lib/email-templates/client-document-assigned.tsx`

Edited:
- `src/components/admin/support-ops.tsx` — rewrite `DocumentsModule`
- `src/routes/_authenticated/portfolio.tsx` — add Documents nav item
- `src/lib/email-templates/registry.ts` — register template
- `src/lib/demo.ts` — demo rows for new tables

## 8. Out of scope (flag for follow-up)

- Virus scanning (validation limited to mime + size).
- SMS/WhatsApp actual send (wired but no-ops without connector).
- Admin client-profile page "Add Document" button (no such page exists yet).

Confirm and I'll implement.
