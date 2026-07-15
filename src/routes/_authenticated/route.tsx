import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { DEMO_EMAIL, DEMO_NAME, isDemoActive, seedDemoData } from "@/lib/demo";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async ({ context }) => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) {
      // Demo access: sample data only, held in the browser's query cache.
      // Server functions still require real authentication, so no live
      // client data is reachable from a demo session.
      if (isDemoActive()) {
        seedDemoData(context.queryClient);
        return {
          user: {
            id: "demo-user",
            email: DEMO_EMAIL,
            user_metadata: { full_name: DEMO_NAME },
          } as unknown as User,
        };
      }
      throw redirect({ to: "/auth" });
    }
    return { user: data.user };
  },
  component: () => <Outlet />,
});
