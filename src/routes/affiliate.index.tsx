import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/affiliate/")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Affiliate Portal — Kay-Steph Group" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AffiliateEntry,
});

function AffiliateEntry() {
  const navigate = useNavigate();
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      navigate({
        to: session ? "/affiliate/portal" : "/affiliate/auth",
        replace: true,
      });
    });
  }, [navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0d0d0d] text-[#d4a53a]">
      <Loader2 className="h-8 w-8 animate-spin" />
    </div>
  );
}
