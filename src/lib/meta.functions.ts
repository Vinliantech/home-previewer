import { z } from "zod";
import { createEdgeFn, createEdgeQuery } from "@/integrations/supabase/edge";

type CaptureFailure = {
  id: string;
  source: string;
  submission_id: string | null;
  error: string;
  attempts: number;
  created_at: string;
  payload: {
    fullName?: string;
    email?: string | null;
    phone?: string | null;
  } | null;
};

export const listLeadCaptureFailures = createEdgeQuery<{
  failures: CaptureFailure[];
}>("admin-workflows", "meta_list_failures");

export const retryLeadCapture = createEdgeFn<
  { id: string },
  { ok: true; leadId: string }
>("admin-workflows", "meta_retry_capture", (input) =>
  z.object({ id: z.string().uuid() }).parse(input),
);

const importSchema = z.object({
  formId: z.string().trim().min(1).max(64),
  since: z.string().datetime().optional(),
});

export const importMetaFormLeads = createEdgeFn<
  z.infer<typeof importSchema>,
  {
    imported: number;
    alreadyPresent: number;
    failed: number;
    pages: number;
    morePages: boolean;
  }
>("admin-workflows", "meta_import_form", (input) => importSchema.parse(input));

export const syncMetaCampaignInsights = createEdgeQuery<{
  synced: number;
  pages: number;
  morePages: boolean;
}>("admin-workflows", "meta_sync_campaigns");
