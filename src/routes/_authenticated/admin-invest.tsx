import { createFileRoute, redirect } from "@tanstack/react-router";

/**
 * The standalone Property Investment Admin has been merged into the main
 * bank-UI super admin (the TOKENIZED sidebar group in /admin). This route
 * remains only so old links and bookmarks land in the right place.
 */
export const Route = createFileRoute("/_authenticated/admin-invest")({
  head: () => ({
    meta: [
      { title: "Tokenized Properties — Kay-Steph Admin" },
      { name: "robots", content: "noindex" },
    ],
  }),
  beforeLoad: () => {
    throw redirect({ to: "/admin", search: { tab: "tk-investments" } });
  },
});
