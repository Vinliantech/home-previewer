import { createFileRoute } from "@tanstack/react-router";

type SitemapEntry = {
  path: string;
  lastModified?: string | null;
  changeFrequency: "daily" | "weekly" | "monthly" | "yearly";
  priority: number;
};

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async () => {
        const siteUrl = (process.env.PUBLIC_SITE_URL ?? "https://kaystephgroup.com").replace(
          /\/$/,
          "",
        );
        const entries: SitemapEntry[] = [
          { path: "/", changeFrequency: "weekly", priority: 1 },
          { path: "/properties", changeFrequency: "daily", priority: 0.9 },
          { path: "/invest", changeFrequency: "daily", priority: 0.9 },
          { path: "/why-kaysteph", changeFrequency: "monthly", priority: 0.8 },
          { path: "/blog", changeFrequency: "daily", priority: 0.9 },
          { path: "/contact", changeFrequency: "yearly", priority: 0.6 },
          { path: "/faq", changeFrequency: "monthly", priority: 0.6 },
          { path: "/events/youth-network", changeFrequency: "monthly", priority: 0.7 },
        ];

        // Only real, published content is ever advertised here. An empty
        // catalogue must produce an empty section, never placeholder URLs.
        let posts: Array<{ slug: string; updated_at?: string }> = [];
        let categories: Array<{ slug: string }> = [];
        let authors: Array<{ slug: string }> = [];
        try {
          const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
          // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Content tables enter generated types after migration.
          const sb = supabaseAdmin as any;
          const [postResult, categoryResult, authorResult] = await Promise.all([
            sb
              .from("blog_posts")
              .select("slug, updated_at")
              .eq("status", "published")
              .eq("include_in_sitemap", true)
              .eq("robots_index", true)
              .lte("published_at", new Date().toISOString()),
            sb.from("blog_categories").select("slug").eq("is_active", true),
            sb.from("content_authors").select("slug").eq("is_active", true),
          ]);
          if (!postResult.error) posts = postResult.data ?? [];
          if (!categoryResult.error) categories = categoryResult.data ?? [];
          if (!authorResult.error) authors = authorResult.data ?? [];
        } catch {
          // Before the content migration runs the tables do not exist yet;
          // the sitemap then lists the static pages only.
        }

        entries.push(
          ...posts.map((post) => ({
            path: `/blog/${post.slug}`,
            lastModified: post.updated_at,
            changeFrequency: "monthly" as const,
            priority: 0.8,
          })),
          ...categories.map((category) => ({
            path: `/blog/category/${category.slug}`,
            changeFrequency: "weekly" as const,
            priority: 0.7,
          })),
          ...authors.map((author) => ({
            path: `/blog/author/${author.slug}`,
            changeFrequency: "monthly" as const,
            priority: 0.6,
          })),
        );

        const xml = [
          '<?xml version="1.0" encoding="UTF-8"?>',
          '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
          ...entries.map(
            (entry) =>
              `<url><loc>${escapeXml(`${siteUrl}${entry.path}`)}</loc>${entry.lastModified ? `<lastmod>${escapeXml(new Date(entry.lastModified).toISOString())}</lastmod>` : ""}<changefreq>${entry.changeFrequency}</changefreq><priority>${entry.priority.toFixed(1)}</priority></url>`,
          ),
          "</urlset>",
        ].join("");

        return new Response(xml, {
          status: 200,
          headers: {
            "content-type": "application/xml; charset=utf-8",
            "cache-control": "public, max-age=900, s-maxage=3600",
          },
        });
      },
    },
  },
});

function escapeXml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}
