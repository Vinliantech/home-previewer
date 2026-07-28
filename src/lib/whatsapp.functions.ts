import { z } from "zod";
import { createEdgeFn } from "@/integrations/supabase/edge";

const phoneSchema = z.string().trim().regex(/^\+?[1-9]\d{7,14}$/);

export const sendWhatsAppText = createEdgeFn<
  {
    to: string;
    message: string;
    previewUrl?: boolean;
    leadId?: string;
  },
  { ok: true; messageId: string | null }
>("whatsapp", "send_text", (input) =>
  z
    .object({
      to: phoneSchema,
      message: z.string().trim().min(1).max(4096),
      previewUrl: z.boolean().optional(),
      leadId: z.string().uuid().optional(),
    })
    .parse(input),
);

export const sendWhatsAppTemplate = createEdgeFn<
  {
    to: string;
    templateName: string;
    languageCode?: string;
    components?: Record<string, unknown>[];
    leadId?: string;
  },
  { ok: true; messageId: string | null }
>("whatsapp", "send_template", (input) =>
  z
    .object({
      to: phoneSchema,
      templateName: z.string().regex(/^[a-z0-9_]{1,512}$/),
      languageCode: z.string().optional(),
      components: z.array(z.record(z.unknown())).optional(),
      leadId: z.string().uuid().optional(),
    })
    .parse(input),
);
