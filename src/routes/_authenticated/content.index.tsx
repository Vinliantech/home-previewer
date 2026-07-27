import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  CalendarClock,
  Eye,
  FileCheck2,
  FileText,
  MailCheck,
  MousePointerClick,
  PenLine,
  Send,
  UsersRound,
} from "lucide-react";
import {
  ContentPageHeader,
  ContentPanel,
  ContentStat,
  ContentStatusBadge,
} from "@/components/content/ContentUi";
import { useContentWorkspace } from "@/components/content/ContentWorkspaceContext";
import { Button } from "@/components/ui/button";
import { contentFormatLabel, formatContentDate } from "@/lib/content";

export const Route = createFileRoute("/_authenticated/content/")({
  component: ContentDashboard,
});

function ContentDashboard() {
  const { posts, subscribers, social, loading, live } = useContentWorkspace();
  const published = posts.filter((post) => post.status === "published");
  const pending = posts.filter((post) => post.status === "pending_review");
  const scheduled = posts.filter((post) => post.status === "scheduled");
  const views = published.reduce((total, post) => total + post.viewCount, 0);
  const leads = published.reduce((total, post) => total + post.leadCount, 0);
  const topPosts = [...published].sort((a, b) => b.viewCount - a.viewCount).slice(0, 5);
  const recent = [...posts]
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 6);

  return (
    <div className="space-y-6">
      <ContentPageHeader
        eyebrow="Editorial command centre"
        title="Content overview"
        description="Plan, review, publish and measure Kay-Steph property intelligence from one accountable workspace."
        actions={
          <>
            <Button asChild variant="outline" className="border-[#ccd8d3] bg-white text-[#244f44]">
              <Link to="/content/posts">Review posts</Link>
            </Button>
            <Button asChild className="bg-[#0e5949] text-white hover:bg-[#0a493d]">
              <Link to="/content/editor">
                <PenLine className="mr-2 h-4 w-4" />
                Create post
              </Link>
            </Button>
          </>
        }
      />

      {!live && !loading && (
        <div className="border border-[#ead9ac] bg-[#fff9e8] px-4 py-3 text-xs leading-5 text-[#735b24]">
          Preview data is active. Apply the social blog migration to connect publishing, media,
          subscribers and analytics to Supabase.
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
        <ContentStat
          icon={FileText}
          label="All posts"
          value={posts.length}
          detail="Across every workflow status"
        />
        <ContentStat
          icon={FileCheck2}
          label="Published"
          value={published.length}
          detail="Visible in the Journal"
          tone="green"
        />
        <ContentStat
          icon={CalendarClock}
          label="In queue"
          value={pending.length + scheduled.length}
          detail={`${pending.length} review, ${scheduled.length} scheduled`}
          tone="gold"
        />
        <ContentStat
          icon={Eye}
          label="Article views"
          value={compactNumber(views)}
          detail="Published content total"
          tone="blue"
        />
        <ContentStat
          icon={UsersRound}
          label="Attributed leads"
          value={leads}
          detail="Newsletter and content actions"
          tone="rose"
        />
        <ContentStat
          icon={MailCheck}
          label="Subscribers"
          value={subscribers.filter((item) => item.status === "active").length}
          detail="Consent-recorded audience"
          tone="green"
        />
      </div>

      <div className="grid gap-5 2xl:grid-cols-[1.35fr_0.65fr]">
        <ContentPanel
          title="Editorial queue"
          description="Recent work, ownership and publishing status"
          action={
            <Link
              to="/content/posts"
              className="text-xs font-semibold text-[#9b6f25] hover:text-[#765116]"
            >
              All posts
            </Link>
          }
        >
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left">
              <thead className="border-b border-[#e7ebe9] bg-[#f9faf9] text-[9px] font-bold uppercase tracking-[0.13em] text-[#87918d]">
                <tr>
                  <th className="px-5 py-3">Story</th>
                  <th className="px-4 py-3">Author</th>
                  <th className="px-4 py-3">Format</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Updated</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#edf0ee]">
                {recent.map((post) => (
                  <tr key={post.id} className="hover:bg-[#fafbf9]">
                    <td className="px-5 py-3.5">
                      <Link
                        to="/content/editor"
                        search={{ post: post.id }}
                        className="block max-w-md text-sm font-semibold text-[#24463e] hover:text-[#9a6d22]"
                      >
                        {post.title}
                      </Link>
                      <p className="mt-1 text-[10px] text-[#8a948f]">{post.primaryCategory.name}</p>
                    </td>
                    <td className="px-4 py-3 text-xs text-[#607069]">{post.author.fullName}</td>
                    <td className="px-4 py-3 text-xs text-[#607069]">
                      {contentFormatLabel(post.format)}
                    </td>
                    <td className="px-4 py-3">
                      <ContentStatusBadge status={post.status} />
                    </td>
                    <td className="px-4 py-3 text-[11px] text-[#7a8580]">
                      {formatContentDate(post.updatedAt, true)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </ContentPanel>

        <ContentPanel title="Workflow" description="What needs attention next">
          <div className="divide-y divide-[#edf0ee]">
            <WorkflowLink
              icon={FileCheck2}
              label="Waiting for review"
              value={pending.length}
              to="/content/posts"
              search={{ status: "pending_review" }}
            />
            <WorkflowLink
              icon={CalendarClock}
              label="Scheduled to publish"
              value={scheduled.length}
              to="/content/posts"
              search={{ status: "scheduled" }}
            />
            <WorkflowLink
              icon={Send}
              label="Social items ready"
              value={
                social.filter((item) => item.status === "ready" || item.status === "scheduled")
                  .length
              }
              to="/content/social"
            />
            <WorkflowLink
              icon={MailCheck}
              label="New subscribers this month"
              value={
                subscribers.filter((item) => new Date(item.subscribedAt).getMonth() === 6).length
              }
              to="/content/newsletter"
            />
          </div>
          <div className="grid grid-cols-2 gap-2 border-t border-[#e7ebe9] p-4">
            <QuickAction to="/content/editor" icon={PenLine} label="New post" />
            <QuickAction to="/content/media" icon={MousePointerClick} label="Add media" />
          </div>
        </ContentPanel>
      </div>

      <ContentPanel
        title="Content performance"
        description="Published stories ranked by qualified attention"
      >
        <div className="grid gap-0 divide-y divide-[#edf0ee] lg:grid-cols-5 lg:divide-x lg:divide-y-0">
          {topPosts.map((post, index) => (
            <Link
              key={post.id}
              to="/blog/$slug"
              params={{ slug: post.slug }}
              className="group p-4 hover:bg-[#fafbf9]"
              target="_blank"
            >
              <span className="text-[10px] font-bold text-[#b38635]">0{index + 1}</span>
              <h3 className="mt-3 line-clamp-3 min-h-14 text-xs font-semibold leading-5 text-[#29483f] group-hover:text-[#9a6d22]">
                {post.title}
              </h3>
              <div className="mt-4 flex items-center justify-between text-[10px] text-[#7d8883]">
                <span>{compactNumber(post.viewCount)} views</span>
                <span>{post.leadCount} leads</span>
              </div>
              <div className="mt-2 h-1.5 bg-[#e6ebe8]">
                <div
                  className="h-full bg-[#b78a36]"
                  style={{
                    width: `${Math.max(12, Math.round((post.viewCount / Math.max(topPosts[0]?.viewCount || 1, 1)) * 100))}%`,
                  }}
                />
              </div>
            </Link>
          ))}
        </div>
      </ContentPanel>
    </div>
  );
}

function WorkflowLink({
  icon: Icon,
  label,
  value,
  to,
  search,
}: {
  icon: typeof FileText;
  label: string;
  value: number;
  to: "/content/posts" | "/content/social" | "/content/newsletter";
  search?: Record<string, string>;
}) {
  return (
    <Link to={to} search={search} className="flex items-center gap-3 px-4 py-4 hover:bg-[#fafbf9]">
      <span className="flex h-8 w-8 items-center justify-center bg-[#eef4f1] text-[#32675a]">
        <Icon className="h-4 w-4" />
      </span>
      <span className="flex-1 text-xs font-medium text-[#4e625a]">{label}</span>
      <strong className="font-serif text-xl text-[#183f35]">{value}</strong>
      <ArrowRight className="h-3.5 w-3.5 text-[#a4ada9]" />
    </Link>
  );
}

function QuickAction({
  to,
  icon: Icon,
  label,
}: {
  to: "/content/editor" | "/content/media";
  icon: typeof PenLine;
  label: string;
}) {
  return (
    <Link
      to={to}
      className="flex items-center justify-center gap-2 border border-[#dce4e0] bg-[#f8faf8] px-3 py-2.5 text-xs font-semibold text-[#31564c] hover:border-[#b7c9c1]"
    >
      <Icon className="h-3.5 w-3.5" />
      {label}
    </Link>
  );
}

function compactNumber(value: number) {
  return new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 }).format(
    value,
  );
}
