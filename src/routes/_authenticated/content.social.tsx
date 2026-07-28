import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useClientFn } from "@/lib/client-function";
import {
  CalendarClock,
  CheckCircle2,
  Copy,
  ExternalLink,
  Facebook,
  Image as ImageIcon,
  Instagram,
  Linkedin,
  MessageCircle,
  Plus,
  Send,
  Settings2,
  Twitter,
} from "lucide-react";
import { toast } from "sonner";
import {
  useContentWorkspace,
  type SocialPublicationRecord,
} from "@/components/content/ContentWorkspaceContext";
import { ContentPageHeader, ContentPanel, ContentStat } from "@/components/content/ContentUi";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { saveSocialPublication } from "@/lib/content.functions";
import { formatContentDate, type ContentPost } from "@/lib/content";

export const Route = createFileRoute("/_authenticated/content/social")({
  component: SocialPublishing,
});

const platforms = [
  {
    key: "facebook",
    label: "Facebook",
    icon: Facebook,
    tone: "bg-[#edf3ff] text-[#315f9f]",
    limit: 5000,
  },
  {
    key: "instagram",
    label: "Instagram",
    icon: Instagram,
    tone: "bg-[#fff0f5] text-[#a73e68]",
    limit: 2200,
  },
  {
    key: "linkedin",
    label: "LinkedIn",
    icon: Linkedin,
    tone: "bg-[#edf6fb] text-[#23658b]",
    limit: 3000,
  },
  { key: "twitter", label: "X", icon: Twitter, tone: "bg-[#f1f2f2] text-[#27332e]", limit: 280 },
  {
    key: "whatsapp",
    label: "WhatsApp",
    icon: MessageCircle,
    tone: "bg-[#edfaf2] text-[#22764a]",
    limit: 2000,
  },
] as const;

export const SOCIAL_PLATFORMS = platforms;

function SocialPublishing() {
  const { posts, social, refresh } = useContentWorkspace();
  const [composer, setComposer] = useState<{
    post?: ContentPost;
    platform?: SocialPublicationRecord["platform"];
  } | null>(null);
  const queued = social.filter((item) => item.status === "ready" || item.status === "scheduled");
  const published = social.filter((item) => item.status === "published");
  const failed = social.filter((item) => item.status === "failed");

  return (
    <div className="space-y-6">
      <ContentPageHeader
        eyebrow="Content distribution"
        title="Social publishing"
        description="Prepare platform-specific captions, approve assets and coordinate publication from one accountable queue."
        actions={
          <>
            <Button asChild variant="outline" className="rounded-none border-[#ced9d4] bg-white">
              <Link to="/content/settings" search={{ tab: "social" }}>
                <Settings2 className="mr-2 h-4 w-4" />
                Channel settings
              </Link>
            </Button>
            <Button className="rounded-none bg-[#0e5949]" onClick={() => setComposer({})}>
              <Plus className="mr-2 h-4 w-4" />
              Create social post
            </Button>
          </>
        }
      />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <ContentStat
          icon={Send}
          label="Ready or scheduled"
          value={queued.length}
          detail="In the distribution queue"
          tone="gold"
        />
        <ContentStat
          icon={CheckCircle2}
          label="Published"
          value={published.length}
          detail="Recorded channel posts"
          tone="green"
        />
        <ContentStat
          icon={CalendarClock}
          label="Scheduled"
          value={social.filter((item) => item.status === "scheduled").length}
          detail="Awaiting publication time"
          tone="blue"
        />
        <ContentStat
          icon={ExternalLink}
          label="Needs attention"
          value={failed.length}
          detail="Failed delivery or credentials"
          tone="rose"
        />
      </div>
      <ContentPanel
        title="Channels"
        description="Connection state and platform-specific publishing support"
        action={
          <span className="text-[9px] font-semibold uppercase tracking-wider text-[#9a6e25]">
            Approval required
          </span>
        }
      >
        <div className="grid gap-px bg-[#e3e9e6] sm:grid-cols-2 xl:grid-cols-5">
          {platforms.map((platform) => {
            const Icon = platform.icon;
            const count = social.filter(
              (item) =>
                item.platform === platform.key && ["ready", "scheduled"].includes(item.status),
            ).length;
            return (
              <div key={platform.key} className="bg-white p-4">
                <div className="flex items-center justify-between">
                  <span
                    className={`flex h-9 w-9 items-center justify-center rounded-md ${platform.tone}`}
                  >
                    <Icon className="h-4 w-4" />
                  </span>
                  <span
                    className="h-2 w-2 rounded-full bg-amber-400"
                    title="Credentials required"
                  />
                </div>
                <h3 className="mt-4 text-sm font-semibold text-[#2e5047]">{platform.label}</h3>
                <p className="mt-1 text-[10px] text-[#85908b]">
                  {count} queued · credentials required
                </p>
                <button
                  type="button"
                  onClick={() => setComposer({ platform: platform.key })}
                  className="mt-4 text-[10px] font-semibold text-[#987029] hover:text-[#6e4d18]"
                >
                  Compose for {platform.label}
                </button>
              </div>
            );
          })}
        </div>
      </ContentPanel>
      <ContentPanel
        title="Publishing queue"
        description="Copy, review or send each approved platform variation"
      >
        {social.length ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[960px] text-left">
              <thead className="border-b border-[#e7ebe9] bg-[#fafbf9] text-[9px] font-bold uppercase tracking-[0.13em] text-[#87918d]">
                <tr>
                  <th className="px-5 py-3">Article</th>
                  <th className="px-4 py-3">Channel</th>
                  <th className="px-4 py-3">Caption preview</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Schedule</th>
                  <th className="px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#edf0ee]">
                {social.map((item) => {
                  const platform = platforms.find((value) => value.key === item.platform)!;
                  const Icon = platform.icon;
                  return (
                    <tr key={item.id}>
                      <td className="px-5 py-4">
                        <p className="max-w-xs text-xs font-semibold text-[#315047]">
                          {item.postTitle}
                        </p>
                      </td>
                      <td className="px-4 py-4">
                        <span
                          className={`inline-flex items-center gap-2 rounded-md px-2 py-1.5 text-[10px] font-semibold ${platform.tone}`}
                        >
                          <Icon className="h-3.5 w-3.5" />
                          {platform.label}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <p className="line-clamp-2 max-w-sm text-[11px] leading-5 text-[#64746d]">
                          {item.caption}
                        </p>
                      </td>
                      <td className="px-4 py-4">
                        <SocialStatus status={item.status} />
                      </td>
                      <td className="px-4 py-4 text-[10px] text-[#7c8983]">
                        {item.scheduledAt
                          ? formatContentDate(item.scheduledAt, true)
                          : "Not scheduled"}
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex gap-1">
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8 rounded-none"
                            onClick={() => {
                              void navigator.clipboard.writeText(item.caption);
                              toast.success("Caption copied.");
                            }}
                            aria-label="Copy caption"
                          >
                            <Copy className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8 rounded-none"
                            onClick={() => openNativeShare(item)}
                            aria-label={`Open ${platform.label} share`}
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8 rounded-none"
                            onClick={() =>
                              setComposer({
                                post: posts.find((post) => post.id === item.postId),
                                platform: item.platform,
                              })
                            }
                            aria-label="Edit distribution"
                          >
                            <Send className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-8 text-center text-xs text-[#76847d]">
            Create a social variation from any published article.
          </div>
        )}
      </ContentPanel>
      <div className="border border-[#dce4e0] bg-white p-4 text-[11px] leading-5 text-[#687870]">
        <strong className="text-[#315047]">Publishing architecture:</strong> approved items are
        stored with platform, asset, caption, schedule, status and audit history. Add each platform
        API credential in Settings to enable the production delivery worker; native share and copy
        controls remain available as a fallback.
      </div>
      <SocialComposer
        key={`${composer?.post?.id ?? "new"}-${composer?.platform ?? "none"}`}
        value={composer}
        posts={posts}
        onClose={() => setComposer(null)}
        onSaved={refresh}
      />
    </div>
  );
}

function SocialComposer({
  value,
  posts,
  onClose,
  onSaved,
}: {
  value: { post?: ContentPost; platform?: SocialPublicationRecord["platform"] } | null;
  posts: ContentPost[];
  onClose: () => void;
  onSaved: () => Promise<void>;
}) {
  const save = useClientFn(saveSocialPublication);
  const [postId, setPostId] = useState(value?.post?.id ?? "");
  const [platform, setPlatform] = useState<SocialPublicationRecord["platform"]>(
    value?.platform ?? "linkedin",
  );
  const selectedPost = posts.find((post) => post.id === postId) ?? value?.post;
  const [caption, setCaption] = useState(selectedPost ? captionFor(selectedPost, platform) : "");
  const [mediaUrl, setMediaUrl] = useState(
    selectedPost?.socialImageUrl ?? selectedPost?.featuredImageUrl ?? "",
  );
  const [status, setStatus] = useState<SocialPublicationRecord["status"]>("ready");
  const [scheduledAt, setScheduledAt] = useState("");
  const config = platforms.find((item) => item.key === platform)!;
  return (
    <Dialog
      open={Boolean(value)}
      onOpenChange={(open) => !open && onClose()}
      key={`${value?.post?.id ?? "new"}-${value?.platform ?? "none"}`}
    >
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle className="font-serif text-2xl text-[#21483e]">
            Create social variation
          </DialogTitle>
          <DialogDescription>
            Adapt the article for one channel, attach the right asset and set an approval state.
          </DialogDescription>
        </DialogHeader>
        <form
          className="grid gap-4"
          onSubmit={async (event) => {
            event.preventDefault();
            if (!selectedPost) return;
            const id = uuidOrUndefined(selectedPost.id);
            if (!id) return;
            try {
              await save({
                data: {
                  postId: id,
                  platform,
                  caption,
                  mediaUrl: mediaUrl || undefined,
                  status,
                  scheduledAt:
                    status === "scheduled" && scheduledAt
                      ? new Date(scheduledAt).toISOString()
                      : undefined,
                },
              });
              toast.success("Social publication saved.");
              await onSaved();
              onClose();
            } catch (error) {
              toast.error(
                error instanceof Error ? error.message : "Social publication could not be saved.",
              );
            }
          }}
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Article">
              <Select
                value={postId}
                onValueChange={(id) => {
                  setPostId(id);
                  const post = posts.find((item) => item.id === id);
                  if (post) {
                    setCaption(captionFor(post, platform));
                    setMediaUrl(post.socialImageUrl || post.featuredImageUrl);
                  }
                }}
              >
                <SelectTrigger className="rounded-none">
                  <SelectValue placeholder="Choose a published article" />
                </SelectTrigger>
                <SelectContent>
                  {posts
                    .filter((post) => post.status === "published")
                    .map((post) => (
                      <SelectItem key={post.id} value={post.id}>
                        {post.title}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Channel">
              <Select
                value={platform}
                onValueChange={(value) => {
                  const next = value as SocialPublicationRecord["platform"];
                  setPlatform(next);
                  if (selectedPost) setCaption(captionFor(selectedPost, next));
                }}
              >
                <SelectTrigger className="rounded-none">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {platforms.map((item) => (
                    <SelectItem key={item.key} value={item.key}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </div>
          {selectedPost && (
            <div className="flex gap-3 border border-[#e2e8e5] bg-[#fafbf9] p-3">
              <img src={selectedPost.featuredImageUrl} alt="" className="h-14 w-20 object-cover" />
              <div>
                <p className="text-xs font-semibold text-[#315047]">{selectedPost.title}</p>
                <p className="mt-1 line-clamp-2 text-[10px] text-[#7d8983]">
                  {selectedPost.excerpt}
                </p>
              </div>
            </div>
          )}
          <Field label={`${config.label} caption`}>
            <Textarea
              value={caption}
              onChange={(event) => setCaption(event.target.value)}
              maxLength={config.limit}
              className="min-h-40 rounded-none"
            />
            <p
              className={`mt-1 text-right text-[9px] ${caption.length > config.limit ? "text-red-600" : "text-[#8e9994]"}`}
            >
              {caption.length}/{config.limit}
            </p>
          </Field>
          <Field label="Image or video URL">
            <div className="relative">
              <ImageIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8b9691]" />
              <Input
                value={mediaUrl}
                onChange={(event) => setMediaUrl(event.target.value)}
                className="rounded-none pl-9"
              />
            </div>
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Queue state">
              <Select
                value={status}
                onValueChange={(value) => setStatus(value as SocialPublicationRecord["status"])}
              >
                <SelectTrigger className="rounded-none">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="ready">Ready for publishing</SelectItem>
                  <SelectItem value="scheduled">Scheduled</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            {status === "scheduled" && (
              <Field label="Publication date and time">
                <Input
                  type="datetime-local"
                  value={scheduledAt}
                  onChange={(event) => setScheduledAt(event.target.value)}
                  required
                  className="rounded-none"
                />
              </Field>
            )}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" className="bg-[#0e5949]">
              <Send className="mr-2 h-4 w-4" />
              Save to queue
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label>
      <span className="mb-1.5 block text-xs font-medium text-[#53675f]">{label}</span>
      {children}
    </label>
  );
}
function SocialStatus({ status }: { status: SocialPublicationRecord["status"] }) {
  const classes: Record<string, string> = {
    draft: "bg-slate-100 text-slate-600",
    ready: "bg-blue-50 text-blue-700",
    scheduled: "bg-amber-50 text-amber-700",
    published: "bg-emerald-50 text-emerald-700",
    failed: "bg-red-50 text-red-700",
    cancelled: "bg-slate-100 text-slate-500",
  };
  return (
    <span className={`px-2 py-1 text-[9px] font-bold uppercase ${classes[status]}`}>{status}</span>
  );
}
function captionFor(post: ContentPost, platform: SocialPublicationRecord["platform"]) {
  const values = {
    facebook: post.facebookCaption,
    instagram: post.instagramCaption,
    linkedin: post.linkedinCaption,
    twitter: post.twitterCaption,
    whatsapp: post.whatsappShareText,
  };
  return (
    values[platform] ||
    `${post.title}\n\n${post.excerpt}\n\nhttps://kaystephgroup.com/blog/${post.slug}`
  );
}
function uuidOrUndefined(value?: string) {
  return value && /^[0-9a-f-]{36}$/i.test(value) ? value : undefined;
}
function openNativeShare(item: SocialPublicationRecord) {
  const url = `https://kaystephgroup.com/blog/${item.postSlug}`;
  const links: Record<SocialPublicationRecord["platform"], string> = {
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
    instagram: "https://www.instagram.com/",
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
    twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(item.caption)}&url=${encodeURIComponent(url)}`,
    whatsapp: `https://wa.me/?text=${encodeURIComponent(`${item.caption}\n${url}`)}`,
  };
  window.open(links[item.platform], "_blank", "noopener,noreferrer");
}
