import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useClientFn } from "@/lib/client-function";
import { Check, Eye, MessageSquare, Search, ShieldAlert, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import {
  useContentWorkspace,
  type ContentCommentRecord,
} from "@/components/content/ContentWorkspaceContext";
import {
  ContentEmpty,
  ContentPageHeader,
  ContentPanel,
  ContentStat,
} from "@/components/content/ContentUi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { moderateContentComment } from "@/lib/content.functions";
import { formatContentDate } from "@/lib/content";

export const Route = createFileRoute("/_authenticated/content/comments")({
  component: ContentComments,
});

function ContentComments() {
  const { comments, refresh } = useContentWorkspace();
  const moderate = useClientFn(moderateContentComment);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [working, setWorking] = useState<string | null>(null);
  const filtered = useMemo(
    () =>
      comments.filter((comment) => {
        if (status !== "all" && comment.status !== status) return false;
        const needle = query.toLowerCase();
        return (
          !needle ||
          `${comment.authorName} ${comment.authorEmail} ${comment.body} ${comment.postTitle}`
            .toLowerCase()
            .includes(needle)
        );
      }),
    [comments, query, status],
  );

  async function setCommentStatus(
    comment: ContentCommentRecord,
    next: ContentCommentRecord["status"],
  ) {
    if (!/^[0-9a-f-]{36}$/i.test(comment.id)) return;
    setWorking(comment.id);
    try {
      await moderate({ data: { commentId: comment.id, status: next } });
      toast.success(`Comment marked ${next}.`);
      await refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Comment could not be updated.");
    } finally {
      setWorking(null);
    }
  }

  return (
    <div className="space-y-6">
      <ContentPageHeader
        eyebrow="Community moderation"
        title="Comments"
        description="Review reader contributions before publication and protect the Journal from spam or inappropriate content."
      />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <ContentStat
          icon={MessageSquare}
          label="All comments"
          value={comments.length}
          detail="Across every article"
        />
        <ContentStat
          icon={ShieldAlert}
          label="Awaiting review"
          value={comments.filter((item) => item.status === "pending").length}
          detail="Requires a moderator"
          tone="gold"
        />
        <ContentStat
          icon={Check}
          label="Approved"
          value={comments.filter((item) => item.status === "approved").length}
          detail="Visible below articles"
          tone="green"
        />
        <ContentStat
          icon={X}
          label="Spam or trashed"
          value={
            comments.filter((item) => item.status === "spam" || item.status === "trashed").length
          }
          detail="Excluded from public view"
          tone="rose"
        />
      </div>
      <ContentPanel>
        <div className="grid gap-3 border-b border-[#e5ebe8] p-4 md:grid-cols-[1fr_220px]">
          <label className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#89958f]" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search comment, reader or article"
              className="rounded-none pl-9"
            />
          </label>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="rounded-none">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All moderation states</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="spam">Spam</SelectItem>
              <SelectItem value="trashed">Trashed</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {filtered.length ? (
          <div className="divide-y divide-[#e8ecea]">
            {filtered.map((comment) => (
              <article
                key={comment.id}
                className="grid gap-4 p-4 md:grid-cols-[190px_1fr_auto] md:p-5"
              >
                <div>
                  <p className="text-xs font-semibold text-[#315047]">{comment.authorName}</p>
                  <p className="mt-1 break-all text-[10px] text-[#87938d]">{comment.authorEmail}</p>
                  <p className="mt-2 text-[9px] text-[#9ba49f]">
                    {formatContentDate(comment.createdAt, true)}
                  </p>
                </div>
                <div>
                  <Link
                    to="/blog/$slug"
                    params={{ slug: comment.postSlug }}
                    target="_blank"
                    className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[#a47628] hover:text-[#755018]"
                  >
                    On: {comment.postTitle}
                  </Link>
                  <blockquote className="mt-3 border-l-2 border-[#c5d3cd] pl-4 text-sm leading-6 text-[#4d6259]">
                    {comment.body}
                  </blockquote>
                  <span
                    className={`mt-3 inline-flex px-2 py-1 text-[9px] font-bold uppercase ${comment.status === "approved" ? "bg-emerald-50 text-emerald-700" : comment.status === "pending" ? "bg-amber-50 text-amber-700" : "bg-rose-50 text-rose-700"}`}
                  >
                    {comment.status}
                  </span>
                </div>
                <div className="flex items-start gap-1">
                  <Button
                    variant="outline"
                    size="icon"
                    disabled={working === comment.id}
                    onClick={() => void setCommentStatus(comment, "approved")}
                    aria-label="Approve comment"
                    title="Approve"
                  >
                    <Check className="h-4 w-4 text-emerald-700" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    disabled={working === comment.id}
                    onClick={() => void setCommentStatus(comment, "spam")}
                    aria-label="Mark as spam"
                    title="Mark as spam"
                  >
                    <ShieldAlert className="h-4 w-4 text-amber-700" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    disabled={working === comment.id}
                    onClick={() => void setCommentStatus(comment, "trashed")}
                    aria-label="Trash comment"
                    title="Trash"
                  >
                    <Trash2 className="h-4 w-4 text-red-600" />
                  </Button>
                  <Button asChild variant="outline" size="icon">
                    <Link
                      to="/blog/$slug"
                      params={{ slug: comment.postSlug }}
                      target="_blank"
                      aria-label="View article"
                    >
                      <Eye className="h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <ContentEmpty
            title="No comments match this view"
            body="Try another moderation state or search term."
          />
        )}
      </ContentPanel>
      <div className="border border-[#dce4e0] bg-white p-4 text-xs leading-5 text-[#687870]">
        <strong className="text-[#315047]">Moderation policy:</strong> comments are disabled by
        default and can be enabled per article. When enabled, new submissions enter Pending until a
        content manager approves them.
      </div>
    </div>
  );
}
