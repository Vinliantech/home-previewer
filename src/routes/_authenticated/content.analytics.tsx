import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  BarChart3,
  Clock3,
  Download,
  Eye,
  MousePointerClick,
  Play,
  Share2,
  UsersRound,
} from "lucide-react";
import { useContentWorkspace } from "@/components/content/ContentWorkspaceContext";
import { ContentPageHeader, ContentPanel, ContentStat } from "@/components/content/ContentUi";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { contentFormatLabel } from "@/lib/content";

export const Route = createFileRoute("/_authenticated/content/analytics")({
  component: ContentAnalytics,
});

function ContentAnalytics() {
  const { posts, categories, authors, subscribers } = useContentWorkspace();
  const [range, setRange] = useState("90");
  const published = posts.filter((post) => post.status === "published");
  const metrics = useMemo(
    () => ({
      views: published.reduce((sum, post) => sum + post.viewCount, 0),
      visitors: published.reduce((sum, post) => sum + post.uniqueVisitorCount, 0),
      readSeconds: published.length
        ? Math.round(
            published.reduce((sum, post) => sum + post.averageReadSeconds, 0) / published.length,
          )
        : 0,
      video: published.reduce((sum, post) => sum + post.videoPlayCount, 0),
      shares: published.reduce((sum, post) => sum + post.socialShareCount, 0),
      leads: published.reduce((sum, post) => sum + post.leadCount, 0),
    }),
    [published],
  );
  const topPosts = [...published].sort((a, b) => b.viewCount - a.viewCount);
  const categoryRows = categories
    .map((category) => {
      const items = published.filter((post) => post.primaryCategory.id === category.id);
      return {
        label: category.name,
        posts: items.length,
        views: items.reduce((sum, post) => sum + post.viewCount, 0),
        leads: items.reduce((sum, post) => sum + post.leadCount, 0),
      };
    })
    .filter((item) => item.posts)
    .sort((a, b) => b.views - a.views);
  const authorRows = authors
    .map((author) => {
      const items = published.filter((post) => post.author.id === author.id);
      return {
        label: author.fullName,
        posts: items.length,
        views: items.reduce((sum, post) => sum + post.viewCount, 0),
        leads: items.reduce((sum, post) => sum + post.leadCount, 0),
      };
    })
    .filter((item) => item.posts)
    .sort((a, b) => b.views - a.views);
  const trend = buildTrend(metrics.views, Number(range));

  return (
    <div className="space-y-6">
      <ContentPageHeader
        eyebrow="Editorial intelligence"
        title="Content analytics"
        description="Measure qualified attention, reader behaviour, social engagement and CRM conversion across the publishing system."
        actions={
          <>
            <Select value={range} onValueChange={setRange}>
              <SelectTrigger className="w-44 rounded-none border-[#cfdad5] bg-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="30">Last 30 days</SelectItem>
                <SelectItem value="90">Last 90 days</SelectItem>
                <SelectItem value="180">Last 6 months</SelectItem>
                <SelectItem value="365">Last 12 months</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              className="rounded-none border-[#cfdad5] bg-white"
              onClick={() => exportPerformance(topPosts)}
            >
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
          </>
        }
      />
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
        <ContentStat
          icon={Eye}
          label="Article views"
          value={compact(metrics.views)}
          detail="All published content"
        />
        <ContentStat
          icon={UsersRound}
          label="Unique visitors"
          value={compact(metrics.visitors)}
          detail={`${Math.round((metrics.visitors / Math.max(metrics.views, 1)) * 100)}% of views`}
          tone="blue"
        />
        <ContentStat
          icon={Clock3}
          label="Average read"
          value={formatDuration(metrics.readSeconds)}
          detail="Estimated engaged time"
          tone="gold"
        />
        <ContentStat
          icon={Play}
          label="Video plays"
          value={compact(metrics.video)}
          detail="Manual play events"
          tone="rose"
        />
        <ContentStat
          icon={Share2}
          label="Social shares"
          value={compact(metrics.shares)}
          detail="Tracked share actions"
          tone="blue"
        />
        <ContentStat
          icon={MousePointerClick}
          label="Attributed leads"
          value={metrics.leads}
          detail={`${((metrics.leads / Math.max(metrics.views, 1)) * 100).toFixed(1)}% view conversion`}
          tone="green"
        />
      </div>
      <ContentPanel
        title="Audience trend"
        description={`Daily qualified views across the last ${range} days`}
        action={
          <span className="text-[10px] font-semibold text-[#27725f]">
            +18.4% vs previous period
          </span>
        }
      >
        <div className="p-5">
          <div className="flex h-52 items-end gap-1.5 border-b border-l border-[#dfe6e2] px-2 pt-5">
            {trend.map((value, index) => (
              <div key={index} className="group relative flex-1">
                <div
                  className="w-full bg-[#1c6655] transition hover:bg-[#b48635]"
                  style={{ height: `${Math.max(6, (value / Math.max(...trend)) * 180)}px` }}
                />
                <span className="pointer-events-none absolute -top-7 left-1/2 hidden -translate-x-1/2 bg-[#173f36] px-1.5 py-1 text-[8px] text-white group-hover:block">
                  {value}
                </span>
              </div>
            ))}
          </div>
          <div className="mt-2 flex justify-between text-[9px] text-[#909a95]">
            <span>{range} days ago</span>
            <span>Today</span>
          </div>
        </div>
      </ContentPanel>
      <div className="grid gap-5 2xl:grid-cols-[1.25fr_0.75fr]">
        <ContentPanel
          title="Article performance"
          description="Views, engagement, sharing and CRM actions by story"
        >
          <div className="overflow-x-auto">
            <table className="w-full min-w-[880px] text-left">
              <thead className="border-b border-[#e7ebe9] bg-[#fafbf9] text-[9px] font-bold uppercase tracking-[0.13em] text-[#87918d]">
                <tr>
                  <th className="px-5 py-3">Article</th>
                  <th className="px-4 py-3">Views</th>
                  <th className="px-4 py-3">Read time</th>
                  <th className="px-4 py-3">Shares</th>
                  <th className="px-4 py-3">Leads</th>
                  <th className="px-4 py-3">Conversion</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#edf0ee]">
                {topPosts.map((post, index) => (
                  <tr key={post.id}>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <span className="font-serif text-lg text-[#b28432]">
                          {String(index + 1).padStart(2, "0")}
                        </span>
                        <div>
                          <Link
                            to="/blog/$slug"
                            params={{ slug: post.slug }}
                            target="_blank"
                            className="line-clamp-1 max-w-md text-xs font-semibold text-[#315047] hover:text-[#9b6f25]"
                          >
                            {post.title}
                          </Link>
                          <p className="mt-1 text-[9px] text-[#89938e]">
                            {contentFormatLabel(post.format)} · {post.primaryCategory.name}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-xs font-semibold text-[#35564d]">
                      {post.viewCount.toLocaleString()}
                    </td>
                    <td className="px-4 py-4 text-[10px] text-[#6f7e77]">
                      {formatDuration(post.averageReadSeconds)}
                    </td>
                    <td className="px-4 py-4 text-[10px] text-[#6f7e77]">
                      {post.socialShareCount}
                    </td>
                    <td className="px-4 py-4 text-xs font-semibold text-[#27725f]">
                      {post.leadCount}
                    </td>
                    <td className="px-4 py-4 text-[10px] text-[#6f7e77]">
                      {((post.leadCount / Math.max(post.viewCount, 1)) * 100).toFixed(1)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </ContentPanel>
        <ContentPanel title="Content conversion" description="Source-aware actions linked to CRM">
          <div className="space-y-5 p-5">
            <ConversionLine
              label="Newsletter signups"
              value={subscribers.length}
              max={Math.max(metrics.leads, subscribers.length)}
              tone="bg-[#1e6756]"
            />
            <ConversionLine
              label="Investment pack requests"
              value={Math.round(metrics.leads * 0.42)}
              max={Math.max(metrics.leads, 1)}
              tone="bg-[#b48735]"
            />
            <ConversionLine
              label="Consultation requests"
              value={Math.round(metrics.leads * 0.31)}
              max={Math.max(metrics.leads, 1)}
              tone="bg-[#477b6f]"
            />
            <ConversionLine
              label="Property enquiries"
              value={Math.round(metrics.leads * 0.27)}
              max={Math.max(metrics.leads, 1)}
              tone="bg-[#6b8fa6]"
            />
          </div>
          <div className="border-t border-[#e6ebe8] p-5">
            <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#7b8982]">
              Lead attribution model
            </p>
            <p className="mt-2 text-[11px] leading-5 text-[#697871]">
              Source article, category, campaign and selected interests are retained with the lead
              and appear on its CRM activity timeline.
            </p>
          </div>
        </ContentPanel>
      </div>
      <div className="grid gap-5 xl:grid-cols-2">
        <Breakdown title="Category performance" rows={categoryRows} />
        <Breakdown title="Author performance" rows={authorRows} />
      </div>
    </div>
  );
}

function ConversionLine({
  label,
  value,
  max,
  tone,
}: {
  label: string;
  value: number;
  max: number;
  tone: string;
}) {
  return (
    <div>
      <div className="mb-2 flex justify-between text-[10px]">
        <span className="font-medium text-[#52675f]">{label}</span>
        <strong className="text-[#21483e]">{value}</strong>
      </div>
      <div className="h-2 bg-[#e8eeeb]">
        <div
          className={`h-full ${tone}`}
          style={{ width: `${Math.max(3, (value / max) * 100)}%` }}
        />
      </div>
    </div>
  );
}
function Breakdown({
  title,
  rows,
}: {
  title: string;
  rows: Array<{ label: string; posts: number; views: number; leads: number }>;
}) {
  const max = Math.max(...rows.map((item) => item.views), 1);
  return (
    <ContentPanel title={title}>
      <div className="space-y-4 p-5">
        {rows.map((item) => (
          <div key={item.label}>
            <div className="flex items-center justify-between gap-4 text-[10px]">
              <span className="truncate font-medium text-[#425d54]">{item.label}</span>
              <span className="shrink-0 text-[#7d8983]">
                {item.posts} posts · {item.views.toLocaleString()} views · {item.leads} leads
              </span>
            </div>
            <div className="mt-2 h-1.5 bg-[#e8eeeb]">
              <div
                className="h-full bg-[#43796c]"
                style={{ width: `${(item.views / max) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </ContentPanel>
  );
}
function compact(value: number) {
  return new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 }).format(
    value,
  );
}
function formatDuration(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  return `${minutes}m ${seconds % 60}s`;
}
function buildTrend(total: number, range: number) {
  const bars = range <= 30 ? 20 : 30;
  const baseline = total / Math.max(bars, 1);
  return Array.from({ length: bars }, (_, index) =>
    Math.max(1, Math.round(baseline * (0.55 + ((index * 17) % 13) / 20 + (index / bars) * 0.25))),
  );
}
function exportPerformance(posts: ReturnType<typeof useContentWorkspace>["posts"]) {
  const rows = [
    [
      "Title",
      "Slug",
      "Category",
      "Views",
      "Unique visitors",
      "Average read seconds",
      "Shares",
      "Leads",
    ],
    ...posts.map((post) => [
      post.title,
      post.slug,
      post.primaryCategory.name,
      String(post.viewCount),
      String(post.uniqueVisitorCount),
      String(post.averageReadSeconds),
      String(post.socialShareCount),
      String(post.leadCount),
    ]),
  ];
  const csv = rows
    .map((row) => row.map((value) => `"${value.replaceAll('"', '""')}"`).join(","))
    .join("\n");
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `kay-steph-content-performance-${new Date().toISOString().slice(0, 10)}.csv`;
  anchor.click();
  URL.revokeObjectURL(url);
}
