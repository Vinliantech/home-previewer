import { createServerFn } from "@tanstack/react-start";

const DEMO_EMAIL = "demo@kaysteph.com";
const DEMO_PASSWORD = "DemoInvestor#2026";

export const ensureDemoUser = createServerFn({ method: "POST" }).handler(async () => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  // Try to create; if it already exists, ignore.
  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email: DEMO_EMAIL,
    password: DEMO_PASSWORD,
    email_confirm: true,
    user_metadata: { full_name: "Demo Investor" },
  });

  if (error && !/already|registered|exists/i.test(error.message)) {
    throw new Error(error.message);
  }

  return { email: DEMO_EMAIL, password: DEMO_PASSWORD, userId: data?.user?.id ?? null };
});
