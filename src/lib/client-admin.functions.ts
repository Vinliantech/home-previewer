import { z } from "zod";
import { createEdgeFn } from "@/integrations/supabase/edge";

export const resetClientPassword = createEdgeFn<
  { profileId: string },
  { ok: true; emailSent: boolean; resetLink: string }
>("admin-workflows", "reset_client_password", (input) =>
  z.object({ profileId: z.string().uuid() }).parse(input),
);
