import { createFileRoute, Outlet } from "@tanstack/react-router";
import { PortalShell } from "@/components/portal/PortalShell";

export const Route = createFileRoute("/_authenticated/portfolio")({
  head: () => ({
    meta: [
      { title: "Portfolio | Kay-Steph Client Portal" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: PortfolioLayout,
});

function PortfolioLayout() {
  return (
    <PortalShell>
      <Outlet />
    </PortalShell>
  );
}
