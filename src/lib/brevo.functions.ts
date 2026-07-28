import { z } from "zod";
import { createEdgeFn, createEdgeQuery } from "@/integrations/supabase/edge";

type BrevoSettings = {
  listId: string;
  templateId: string;
  senderName: string;
  senderEmail: string;
  adminEmail: string;
  apiKey: {
    configured: boolean;
    lastFour: string | null;
    updatedAt: string | null;
  };
  environmentFallback: {
    apiKey: boolean;
    senderEmail: boolean;
  };
};

type WorkshopRegistration = {
  id: string;
  reference: string;
  event_name: string;
  full_name: string;
  email: string;
  phone: string;
  location: string;
  interest: string;
  confirmation_email_status: string;
  admin_email_status: string;
  brevo_contact_status: string;
  last_error: string | null;
  created_at: string;
};

export const getBrevoSettings = createEdgeQuery<BrevoSettings>(
  "admin-workflows",
  "brevo_get",
);

const settingsSchema = z.object({
  listId: z.string().trim().max(20),
  templateId: z.string().trim().max(20),
  senderName: z.string().trim().max(120),
  senderEmail: z.string().trim().max(160),
  adminEmail: z.string().trim().max(160),
});

export const saveBrevoSettings = createEdgeFn<
  z.infer<typeof settingsSchema>,
  { ok: true }
>("admin-workflows", "brevo_save_settings", (input) => settingsSchema.parse(input));

export const saveBrevoApiKey = createEdgeFn<
  { apiKey: string },
  { ok: true; cleared: boolean }
>("admin-workflows", "brevo_save_key", (input) =>
  z.object({ apiKey: z.string().trim().max(400) }).parse(input),
);

export const listWorkshopRegistrations = createEdgeQuery<{
  registrations: WorkshopRegistration[];
}>("admin-workflows", "brevo_list_registrations");

export const retryWorkshopConfirmation = createEdgeFn<
  { id: string },
  { ok: true; reference: string }
>("admin-workflows", "brevo_retry_confirmation", (input) =>
  z.object({ id: z.string().uuid() }).parse(input),
);
