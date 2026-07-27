import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import {
  Archive,
  CalendarClock,
  Eye,
  FileText,
  Filter,
  MoreHorizontal,
  PenLine,
  Search,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { useContentWorkspace } from "@/components/content/ContentWorkspaceContext";
import {
  ContentEmpty,
  ContentPageHeader,
  ContentPanel,
  ContentStatusBadge,
} from "@/components/content/ContentUi";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { contentFormatLabel, formatContentDate, type ContentPostStatus } from "@/lib/content";
import { updateContentPostStatus } from "@/lib/content.functions";

const searchSchema = z.object({ status: z.string().optional() });

export const Route = createFileRoute("/_authenticated/content/posts")({
  validateSearch: (search) => searchSchema.parse(search),
  component: ContentPosts,
});

function ContentPosts() {
  const routeSearch = Route.useSearch();
  const { posts, categories, authors, refresh } = useContentWorkspace();
  const mutateStatus = useServerFn(updateContentPostStatus);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState(routeSearch.status ?? "all");
  const [category, setCategory] = useState("all");
  const [author, setAuthor] = useState("all");
  const [format, setFormat] = useState("all");
  const [selected, setSelected] = useState<string[]>([]);
  const [working, setWorking] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return posts.filter((post) => {
      if (status !== "all" && post.status !== status) return false;
      if (category !== "all" && post.primaryCategory.id !== category) return false;
      if (author !== "all" && post.author.id !== author) return false;
      if (format !== "all" && post.format !== format) return false;
      return (
        !needle ||
        `${post.title} ${post.excerpt} ${post.author.fullName}`.toLowerCase().includes(needle)
      );
    });
  }, [author, category, format, posts, query, status]);

  async function changeStatus(postId: string, next: ContentPostStatus) {
    setWorking(postId);
    try {
      await mutateStatus({ data: { postId, status: next } });
      toast.success(`Post moved to ${next.replace("_", " ")}.`);
      await refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "The post could not be updated.");
    } finally {
      setWorking(null);
    }
  }

  function toggleAll(checked: boolean) {
    setSelected(checked ? filtered.map((post) => post.id) : []);
  }

  return (
    <div className="space-y-6">
      <ContentPageHeader
        eyebrow="Editorial library"
        title="All posts"
        description="Search every story, refine by workflow and manage publishing without losing its revision history."
        actions={
          <Button asChild className="bg-[#0d5848] text-white hover:bg-[#09483b]">
            <Link to="/content/editor">
              <PenLine className="mr-2 h-4 w-4" />
              Add new post
            </Link>
          </Button>
        }
      />

      <div className="flex flex-wrap gap-2">
        {[
          ["all", "All", posts.length],
          ["published", "Published", posts.filter((item) => item.status === "published").length],
          ["draft", "Drafts", posts.filter((item) => item.status === "draft").length],
          [
            "pending_review",
            "Review",
            posts.filter((item) => item.status === "pending_review").length,
          ],
          ["scheduled", "Scheduled", posts.filter((item) => item.status === "scheduled").length],
          ["archived", "Archived", posts.filter((item) => item.status === "archived").length],
        ].map(([key, label, count]) => (
          <button
            key={String(key)}
            type="button"
            onClick={() => setStatus(String(key))}
            className={`border px-3 py-2 text-xs font-semibold ${status === key ? "border-[#165849] bg-[#165849] text-white" : "border-[#dce4e0] bg-white text-[#53665e] hover:border-[#afc2b9]"}`}
          >
            {label} <span className="ml-1 opacity-65">{count}</span>
          </button>
        ))}
      </div>

      <ContentPanel>
        <div className="grid gap-3 border-b border-[#e6ebe8] p-4 lg:grid-cols-[minmax(260px,1fr)_180px_180px_180px_auto]">
          <label className="relative">
            <span className="sr-only">Search posts</span>
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8b9691]" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search title, excerpt or author"
              className="h-10 rounded-none border-[#d9e1dd] pl-9"
            />
          </label>
          <FilterSelect
            value={category}
            onValueChange={setCategory}
            placeholder="All categories"
            items={categories.map((item) => ({ value: item.id, label: item.name }))}
          />
          <FilterSelect
            value={author}
            onValueChange={setAuthor}
            placeholder="All authors"
            items={authors.map((item) => ({ value: item.id, label: item.fullName }))}
          />
          <FilterSelect
            value={format}
            onValueChange={setFormat}
            placeholder="All formats"
            items={Array.from(
              new Map(
                posts.map((item) => [item.format, contentFormatLabel(item.format)]),
              ).entries(),
            ).map(([value, label]) => ({ value, label }))}
          />
          <Button
            type="button"
            variant="outline"
            className="h-10 rounded-none border-[#d9e1dd]"
            onClick={() => {
              setQuery("");
              setStatus("all");
              setCategory("all");
              setAuthor("all");
              setFormat("all");
            }}
          >
            <Filter className="mr-2 h-4 w-4" />
            Reset
          </Button>
        </div>

        {selected.length > 0 && (
          <div className="flex flex-wrap items-center gap-3 border-b border-[#dbe5e0] bg-[#f2f7f4] px-4 py-3 text-xs">
            <strong className="text-[#244d42]">{selected.length} selected</strong>
            <span className="text-[#77837e]">
              Bulk workflow changes remain permission-controlled.
            </span>
            <Button
              size="sm"
              variant="outline"
              className="h-7 rounded-none bg-white"
              onClick={() => setSelected([])}
            >
              Clear selection
            </Button>
          </div>
        )}

        {filtered.length ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1040px] text-left">
              <thead className="border-b border-[#e7ebe9] bg-[#fafbf9] text-[9px] font-bold uppercase tracking-[0.13em] text-[#84908b]">
                <tr>
                  <th className="w-10 px-4 py-3">
                    <Checkbox
                      checked={selected.length === filtered.length && filtered.length > 0}
                      onCheckedChange={(value) => toggleAll(Boolean(value))}
                      aria-label="Select all posts"
                    />
                  </th>
                  <th className="px-3 py-3">Post</th>
                  <th className="px-3 py-3">Author</th>
                  <th className="px-3 py-3">Category</th>
                  <th className="px-3 py-3">Status</th>
                  <th className="px-3 py-3">Performance</th>
                  <th className="px-3 py-3">Date</th>
                  <th className="w-12 px-3 py-3">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#edf0ee]">
                {filtered.map((post) => (
                  <tr key={post.id} className="group hover:bg-[#fbfcfa]">
                    <td className="px-4 py-3">
                      <Checkbox
                        checked={selected.includes(post.id)}
                        onCheckedChange={(value) =>
                          setSelected((current) =>
                            value
                              ? [...new Set([...current, post.id])]
                              : current.filter((id) => id !== post.id),
                          )
                        }
                        aria-label={`Select ${post.title}`}
                      />
                    </td>
                    <td className="px-3 py-3.5">
                      <div className="flex items-center gap-3">
                        <img
                          src={post.featuredImageUrl}
                          alt=""
                          className="h-12 w-16 object-cover"
                        />
                        <div className="min-w-0">
                          <Link
                            to="/content/editor"
                            search={{ post: post.id }}
                            className="line-clamp-1 text-sm font-semibold text-[#284a41] hover:text-[#986b20]"
                          >
                            {post.title}
                          </Link>
                          <p className="mt-1 text-[10px] text-[#89938f]">
                            /{post.slug} · {contentFormatLabel(post.format)}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-3 text-xs text-[#62726b]">{post.author.fullName}</td>
                    <td className="px-3 py-3 text-xs text-[#62726b]">
                      {post.primaryCategory.name}
                    </td>
                    <td className="px-3 py-3">
                      <ContentStatusBadge status={post.status} />
                    </td>
                    <td className="px-3 py-3">
                      <p className="text-xs font-semibold text-[#38574f]">
                        {post.viewCount.toLocaleString()} views
                      </p>
                      <p className="mt-1 text-[10px] text-[#89938f]">
                        {post.leadCount} attributed leads
                      </p>
                    </td>
                    <td className="px-3 py-3 text-[11px] leading-5 text-[#74807b]">
                      {post.status === "scheduled" ? (
                        <>
                          <CalendarClock className="mr-1 inline h-3 w-3" />
                          {formatContentDate(post.scheduledAt, true)}
                        </>
                      ) : (
                        formatContentDate(post.publishedAt ?? post.updatedAt, true)
                      )}
                    </td>
                    <td className="px-3 py-3">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            size="icon"
                            variant="ghost"
                            disabled={working === post.id}
                            aria-label={`Actions for ${post.title}`}
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuItem asChild>
                            <Link to="/content/editor" search={{ post: post.id }}>
                              <PenLine className="mr-2 h-4 w-4" />
                              Edit post
                            </Link>
                          </DropdownMenuItem>
                          {post.status === "published" && (
                            <DropdownMenuItem asChild>
                              <Link to="/blog/$slug" params={{ slug: post.slug }} target="_blank">
                                <Eye className="mr-2 h-4 w-4" />
                                View article
                              </Link>
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          {post.status !== "published" && (
                            <DropdownMenuItem
                              onClick={() => void changeStatus(post.id, "published")}
                            >
                              <FileText className="mr-2 h-4 w-4" />
                              Publish now
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem onClick={() => void changeStatus(post.id, "archived")}>
                            <Archive className="mr-2 h-4 w-4" />
                            Archive
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => void changeStatus(post.id, "trashed")}
                            className="text-red-600"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Move to trash
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <ContentEmpty
            title="No posts match these filters"
            body="Clear a filter or create a new story for the editorial queue."
          />
        )}
        <div className="flex items-center justify-between border-t border-[#e7ebe9] px-4 py-3 text-[11px] text-[#7d8883]">
          <span>
            {filtered.length} of {posts.length} posts
          </span>
          <span>Revision history and audit events are retained in the database</span>
        </div>
      </ContentPanel>
    </div>
  );
}

function FilterSelect({
  value,
  onValueChange,
  placeholder,
  items,
}: {
  value: string;
  onValueChange: (value: string) => void;
  placeholder: string;
  items: Array<{ value: string; label: string }>;
}) {
  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger className="h-10 rounded-none border-[#d9e1dd] bg-white">
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">{placeholder}</SelectItem>
        {items.map((item) => (
          <SelectItem key={item.value} value={item.value}>
            {item.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
