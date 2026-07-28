import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import type { SupabaseClient } from "@supabase/supabase-js";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Database } from "@/integrations/supabase/types";

async function assertPlatformAdmin(context: {
  supabase: SupabaseClient<Database>;
  userId: string;
}) {
  const { data } = await context.supabase.rpc("is_admin", { _user_id: context.userId });
  if (!data) throw new Error("You do not have permission to manage client security.");
}

/**
 * Generates and emails a one-time recovery link. Admins never see or choose
 * the client's password; the client sets it inside Supabase's secure flow.
 * The client's email lives on auth.users (not on profiles in this build) so
 * we resolve it through the admin auth API.
 */
export const resetClientPassword = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input) => z.object({ profileId: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    await assertPlatformAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: profile, error } = await supabaseAdmin
      .from("profiles")
      .select("id, full_name")
      .eq("id", data.profileId)
      .single();
    if (error || !profile) throw new Error("Client account not found.");

    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.getUserById(
      profile.id,
    );
    if (authError || !authUser?.user?.email) {
      throw new Error("No email is on file for this client.");
    }
    const email = authUser.user.email;

    const siteUrl = process.env.SITE_URL ?? "";
    const recovery = await supabaseAdmin.auth.admin.generateLink({
      type: "recovery",
      email,
      options: siteUrl ? { redirectTo: `${siteUrl}/portfolio/profile` } : undefined,
    });
    if (recovery.error) throw new Error(recovery.error.message);
    const actionLink = recovery.data.properties?.action_link ?? null;
    if (!actionLink) throw new Error("Could not generate a password-reset link.");

    const { sendClientPasswordReset } = await import("@/lib/crm-email.server");
    const sent = await sendClientPasswordReset({
      to: email,
      fullName: profile.full_name ?? "",
      actionLink,
    });

    return { ok: true, emailSent: sent.ok, resetLink: actionLink };
  });
