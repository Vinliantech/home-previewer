import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useClientFn } from "@/lib/client-function";
import {
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  CalendarClock,
  Check,
  ChevronDown,
  Copy,
  Eye,
  FileCheck2,
  GripVertical,
  Image as ImageIcon,
  LayoutTemplate,
  ListPlus,
  MonitorSmartphone,
  Plus,
  Save,
  SearchCheck,
  Send,
  Settings2,
  Trash2,
  Type,
  Undo2,
} from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { useContentWorkspace } from "@/components/content/ContentWorkspaceContext";
import { ContentStatusBadge } from "@/components/content/ContentUi";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  CONTENT_BLOCK_TYPES,
  CONTENT_POST_FORMATS,
  seoScore,
  estimateReadingTime,
  slugifyContent,
  type ContentBlock,
  type ContentBlockType,
  type ContentJsonValue,
  type ContentPost,
  type ContentPostStatus,
} from "@/lib/content";
import { saveContentPost } from "@/lib/content.functions";

const searchSchema = z.object({ post: z.string().optional() });

export const Route = createFileRoute("/_authenticated/content/editor")({
  validateSearch: (search) => searchSchema.parse(search),
  component: ContentEditor,
});

function ContentEditor() {
  const { post: postId } = Route.useSearch();
  const { posts, authors, categories, tags, media, refresh } = useContentWorkspace();
  const existing = posts.find((post) => post.id === postId);
  const [draft, setDraft] = useState<ContentPost>(() =>
    existing ? structuredClone(existing) : createBlankPost(authors[0], categories[0]),
  );
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(
    draft.contentBlocks[0]?.id ?? null,
  );
  const savePost = useClientFn(saveContentPost);
  const seoHealth = seoScore(draft);
  const readingTime = estimateReadingTime(draft.contentBlocks);

  function patchDraft(patch: Partial<ContentPost>) {
    setDraft((current) => ({ ...current, ...patch }));
    setDirty(true);
  }

  function setTitle(title: string) {
    setDraft((current) => ({
      ...current,
      title,
      slug:
        current.slug === slugifyContent(current.title) || current.slug === "untitled-post"
          ? slugifyContent(title) || "untitled-post"
          : current.slug,
      seoTitle: current.seoTitle === current.title ? title : current.seoTitle,
      ogTitle: current.ogTitle === current.title ? title : current.ogTitle,
      twitterTitle: current.twitterTitle === current.title ? title : current.twitterTitle,
    }));
    setDirty(true);
  }

  function updateBlock(blockId: string, data: Record<string, ContentJsonValue>) {
    patchDraft({
      contentBlocks: draft.contentBlocks.map((block) =>
        block.id === blockId ? { ...block, data: { ...block.data, ...data } } : block,
      ),
    });
  }

  function addBlock(type: ContentBlockType) {
    const block = createBlock(type);
    patchDraft({ contentBlocks: [...draft.contentBlocks, block] });
    setSelectedBlockId(block.id);
  }

  function moveBlock(blockId: string, direction: -1 | 1) {
    const from = draft.contentBlocks.findIndex((block) => block.id === blockId);
    const to = from + direction;
    if (from < 0 || to < 0 || to >= draft.contentBlocks.length) return;
    const next = [...draft.contentBlocks];
    const [block] = next.splice(from, 1);
    next.splice(to, 0, block);
    patchDraft({ contentBlocks: next });
  }

  function duplicateBlock(block: ContentBlock) {
    const index = draft.contentBlocks.findIndex((item) => item.id === block.id);
    const copy = { ...structuredClone(block), id: `${block.type}-${Date.now()}` };
    const next = [...draft.contentBlocks];
    next.splice(index + 1, 0, copy);
    patchDraft({ contentBlocks: next });
    setSelectedBlockId(copy.id);
  }

  function removeBlock(blockId: string) {
    patchDraft({ contentBlocks: draft.contentBlocks.filter((block) => block.id !== blockId) });
    if (selectedBlockId === blockId) setSelectedBlockId(null);
  }

  async function persist(status: ContentPostStatus = draft.status) {
    if (!draft.title.trim() || !draft.slug.trim()) {
      toast.error("Add a title and valid URL slug before saving.");
      return;
    }
    if (status === "scheduled" && !draft.scheduledAt) {
      toast.error("Choose a publishing date and time before scheduling.");
      return;
    }
    setSaving(true);
    try {
      const id = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
        draft.id,
      )
        ? draft.id
        : undefined;
      const result = await savePost({
        data: {
          id,
          title: draft.title,
          slug: draft.slug,
          excerpt: draft.excerpt,
          contentBlocks: draft.contentBlocks,
          featuredImageUrl: draft.featuredImageUrl,
          featuredVideoUrl: draft.featuredVideoUrl || undefined,
          videoCaption: draft.videoCaption || undefined,
          videoTranscript: draft.videoTranscript || undefined,
          posterImageUrl: draft.posterImageUrl || undefined,
          format: draft.format,
          authorId: uuidOrUndefined(draft.author.id),
          primaryCategoryId: uuidOrUndefined(draft.primaryCategory.id),
          secondaryCategoryIds: draft.secondaryCategories.map((item) => item.id).filter(isUuid),
          tagIds: draft.tags.map((item) => item.id).filter(isUuid),
          status,
          scheduledAt: draft.scheduledAt || undefined,
          ctaLabel: draft.ctaLabel || undefined,
          ctaUrl: draft.ctaUrl || undefined,
          seoTitle: draft.seoTitle,
          metaDescription: draft.metaDescription,
          focusKeyword: draft.focusKeyword,
          secondaryKeywords: draft.secondaryKeywords,
          canonicalUrl: draft.canonicalUrl,
          ogTitle: draft.ogTitle,
          ogDescription: draft.ogDescription,
          ogImageUrl: draft.ogImageUrl,
          twitterTitle: draft.twitterTitle,
          twitterDescription: draft.twitterDescription,
          twitterImageUrl: draft.twitterImageUrl,
          robotsIndex: draft.robotsIndex,
          robotsFollow: draft.robotsFollow,
          includeInSitemap: draft.includeInSitemap,
          facebookCaption: draft.facebookCaption,
          instagramCaption: draft.instagramCaption,
          linkedinCaption: draft.linkedinCaption,
          twitterCaption: draft.twitterCaption,
          whatsappShareText: draft.whatsappShareText,
          socialImageUrl: draft.socialImageUrl,
          socialVideoUrl: draft.socialVideoUrl || undefined,
          socialScheduledAt: draft.socialScheduledAt || undefined,
          commentsEnabled: draft.commentsEnabled,
          isFeatured: draft.isFeatured,
          isPopular: draft.isPopular,
        },
      });
      patchDraft({ id: result.postId, status, readingTimeMinutes: result.readingTime });
      setDirty(false);
      toast.success(
        status === "published"
          ? "Article published."
          : status === "scheduled"
            ? "Article scheduled."
            : "Draft saved.",
      );
      await refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "The post could not be saved.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="-mx-4 -my-5 min-h-[calc(100vh-4rem)] bg-[#eef2ef] md:-mx-6 md:-my-6">
      <div className="sticky top-16 z-20 flex flex-wrap items-center gap-2 border-b border-[#d7dfdb] bg-white px-4 py-3 md:px-6">
        <Button asChild variant="ghost" size="icon" aria-label="Back to posts">
          <Link to="/content/posts">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="truncate text-sm font-semibold text-[#284a41]">
              {draft.title || "Untitled post"}
            </p>
            <ContentStatusBadge status={draft.status} />
          </div>
          <p className="mt-0.5 text-[10px] text-[#87918d]">
            {dirty
              ? "Unsaved changes"
              : existing
                ? `Last saved ${new Date(draft.updatedAt).toLocaleString()}`
                : "New editorial draft"}{" "}
            · {readingTime} min read
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="rounded-none border-[#d6dfdb]"
          onClick={() => existing && setDraft(structuredClone(existing))}
          disabled={!existing || !dirty}
        >
          <Undo2 className="mr-2 h-3.5 w-3.5" />
          Reset
        </Button>
        {draft.status === "published" && (
          <Button asChild variant="outline" size="sm" className="rounded-none border-[#d6dfdb]">
            <Link to="/blog/$slug" params={{ slug: draft.slug }} target="_blank">
              <Eye className="mr-2 h-3.5 w-3.5" />
              Preview
            </Link>
          </Button>
        )}
        <Button
          variant="outline"
          size="sm"
          className="rounded-none border-[#b8cbc2] text-[#245248]"
          onClick={() => void persist("draft")}
          disabled={saving}
        >
          <Save className="mr-2 h-3.5 w-3.5" />
          Save draft
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              size="sm"
              className="rounded-none bg-[#0d5949] text-white hover:bg-[#09483c]"
              disabled={saving}
            >
              {saving ? "Saving..." : draft.status === "published" ? "Update" : "Publish"}
              <ChevronDown className="ml-2 h-3.5 w-3.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            <DropdownMenuLabel>Publishing workflow</DropdownMenuLabel>
            <DropdownMenuItem onClick={() => void persist("pending_review")}>
              <FileCheck2 className="mr-2 h-4 w-4" />
              Submit for review
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => void persist("scheduled")}>
              <CalendarClock className="mr-2 h-4 w-4" />
              Schedule article
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => void persist("published")}>
              <Check className="mr-2 h-4 w-4" />
              Publish now
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="grid min-h-[calc(100vh-8.1rem)] xl:grid-cols-[minmax(0,1fr)_360px]">
        <main className="p-4 md:p-6 xl:p-8">
          <div className="mx-auto max-w-[900px] border border-[#d9e1dd] bg-white shadow-[0_10px_35px_rgba(23,62,53,0.05)]">
            <div className="border-b border-[#e5eae7] px-5 py-6 sm:px-8 sm:py-8">
              <Input
                value={draft.title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="Add article title"
                className="h-auto rounded-none border-0 p-0 font-serif text-3xl font-semibold leading-tight text-[#183f36] shadow-none placeholder:text-[#aeb8b3] focus-visible:ring-0 sm:text-4xl"
              />
              <div className="mt-4 flex items-center gap-2 text-[11px] text-[#85908b]">
                <span>kaystephgroup.com/blog/</span>
                <Input
                  value={draft.slug}
                  onChange={(event) => patchDraft({ slug: slugifyContent(event.target.value) })}
                  className="h-7 max-w-sm rounded-none border-[#dfe5e2] px-2 text-[11px]"
                />
              </div>
              <Textarea
                value={draft.excerpt}
                onChange={(event) => patchDraft({ excerpt: event.target.value })}
                placeholder="Write a clear editorial summary for cards, search results and social previews."
                className="mt-5 min-h-24 rounded-none border-[#dfe5e2] text-sm leading-6"
                maxLength={500}
              />
              <p className="mt-1 text-right text-[10px] text-[#98a19d]">
                {draft.excerpt.length}/500
              </p>
            </div>

            <div className="min-h-[520px] px-4 py-6 sm:px-8">
              <div className="mb-5 flex items-center justify-between border-b border-[#edf0ee] pb-3">
                <div>
                  <p className="text-xs font-semibold text-[#34554c]">Article blocks</p>
                  <p className="mt-0.5 text-[10px] text-[#8a948f]">
                    Select a block to edit, reorder or duplicate it.
                  </p>
                </div>
                <AddBlockMenu onAdd={addBlock} />
              </div>
              <div className="space-y-3">
                {draft.contentBlocks.map((block, index) => (
                  <BlockEditor
                    key={block.id}
                    block={block}
                    selected={selectedBlockId === block.id}
                    first={index === 0}
                    last={index === draft.contentBlocks.length - 1}
                    onSelect={() => setSelectedBlockId(block.id)}
                    onUpdate={(data) => updateBlock(block.id, data)}
                    onMove={(direction) => moveBlock(block.id, direction)}
                    onDuplicate={() => duplicateBlock(block)}
                    onRemove={() => removeBlock(block.id)}
                  />
                ))}
                {!draft.contentBlocks.length && (
                  <button
                    type="button"
                    onClick={() => addBlock("paragraph")}
                    className="flex min-h-40 w-full flex-col items-center justify-center border border-dashed border-[#becdc6] bg-[#fafcfb] text-[#667871]"
                  >
                    <Plus className="h-5 w-5" />
                    <span className="mt-2 text-xs font-semibold">Add the first content block</span>
                  </button>
                )}
              </div>
              <div className="mt-5 flex justify-center">
                <AddBlockMenu onAdd={addBlock} label="Add block" />
              </div>
            </div>
          </div>
        </main>

        <aside className="border-l border-[#d9e1dd] bg-white xl:sticky xl:top-[8.1rem] xl:h-[calc(100vh-8.1rem)] xl:overflow-y-auto">
          <Tabs defaultValue="document">
            <TabsList className="sticky top-0 z-10 grid h-12 w-full grid-cols-3 rounded-none border-b border-[#dfe5e2] bg-white p-0">
              <TabsTrigger
                value="document"
                className="h-12 rounded-none text-xs data-[state=active]:border-b-2 data-[state=active]:border-[#b48733] data-[state=active]:shadow-none"
              >
                <Settings2 className="mr-1.5 h-3.5 w-3.5" />
                Document
              </TabsTrigger>
              <TabsTrigger
                value="seo"
                className="h-12 rounded-none text-xs data-[state=active]:border-b-2 data-[state=active]:border-[#b48733] data-[state=active]:shadow-none"
              >
                <SearchCheck className="mr-1.5 h-3.5 w-3.5" />
                SEO
              </TabsTrigger>
              <TabsTrigger
                value="social"
                className="h-12 rounded-none text-xs data-[state=active]:border-b-2 data-[state=active]:border-[#b48733] data-[state=active]:shadow-none"
              >
                <Send className="mr-1.5 h-3.5 w-3.5" />
                Social
              </TabsTrigger>
            </TabsList>
            <TabsContent value="document" className="m-0">
              <DocumentSettings
                draft={draft}
                authors={authors}
                categories={categories}
                tags={tags}
                media={media}
                patch={patchDraft}
              />
            </TabsContent>
            <TabsContent value="seo" className="m-0">
              <SeoSettings draft={draft} score={seoHealth} patch={patchDraft} />
            </TabsContent>
            <TabsContent value="social" className="m-0">
              <SocialSettings draft={draft} patch={patchDraft} />
            </TabsContent>
          </Tabs>
        </aside>
      </div>
    </div>
  );
}

function DocumentSettings({
  draft,
  authors,
  categories,
  tags,
  media,
  patch,
}: {
  draft: ContentPost;
  authors: ReturnType<typeof useContentWorkspace>["authors"];
  categories: ReturnType<typeof useContentWorkspace>["categories"];
  tags: ReturnType<typeof useContentWorkspace>["tags"];
  media: ReturnType<typeof useContentWorkspace>["media"];
  patch: (value: Partial<ContentPost>) => void;
}) {
  return (
    <div className="divide-y divide-[#e8ecea]">
      <SettingSection title="Publishing">
        <Field label="Status">
          <Select
            value={draft.status}
            onValueChange={(value) => patch({ status: value as ContentPostStatus })}
          >
            <SelectTrigger className="rounded-none">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {["draft", "pending_review", "scheduled", "published", "unpublished", "archived"].map(
                (status) => (
                  <SelectItem key={status} value={status}>
                    {status.replace("_", " ")}
                  </SelectItem>
                ),
              )}
            </SelectContent>
          </Select>
        </Field>
        {draft.status === "scheduled" && (
          <Field label="Publish date and time">
            <Input
              type="datetime-local"
              value={toDateTimeLocal(draft.scheduledAt)}
              onChange={(event) =>
                patch({
                  scheduledAt: event.target.value
                    ? new Date(event.target.value).toISOString()
                    : null,
                })
              }
              className="rounded-none"
            />
          </Field>
        )}
        <div className="grid grid-cols-2 gap-3">
          <Toggle
            label="Featured"
            checked={draft.isFeatured}
            onChange={(value) => patch({ isFeatured: value })}
          />
          <Toggle
            label="Popular"
            checked={draft.isPopular}
            onChange={(value) => patch({ isPopular: value })}
          />
        </div>
      </SettingSection>
      <SettingSection title="Story details">
        <Field label="Post format">
          <Select
            value={draft.format}
            onValueChange={(value) => patch({ format: value as ContentPost["format"] })}
          >
            <SelectTrigger className="rounded-none">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CONTENT_POST_FORMATS.map((item) => (
                <SelectItem key={item.key} value={item.key}>
                  {item.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Field label="Author">
          <Select
            value={draft.author.id}
            onValueChange={(value) => {
              const author = authors.find((item) => item.id === value);
              if (author) patch({ author });
            }}
          >
            <SelectTrigger className="rounded-none">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {authors.map((item) => (
                <SelectItem key={item.id} value={item.id}>
                  {item.fullName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Field label="Primary category">
          <Select
            value={draft.primaryCategory.id}
            onValueChange={(value) => {
              const item = categories.find((category) => category.id === value);
              if (item) patch({ primaryCategory: item });
            }}
          >
            <SelectTrigger className="rounded-none">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {categories.map((item) => (
                <SelectItem key={item.id} value={item.id}>
                  {item.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Field label="Secondary categories">
          <CheckList
            items={categories
              .filter((item) => item.id !== draft.primaryCategory.id)
              .map((item) => ({ id: item.id, label: item.name }))}
            selected={draft.secondaryCategories.map((item) => item.id)}
            onChange={(ids) =>
              patch({ secondaryCategories: categories.filter((item) => ids.includes(item.id)) })
            }
          />
        </Field>
        <Field label="Tags">
          <CheckList
            items={tags.map((item) => ({ id: item.id, label: item.name }))}
            selected={draft.tags.map((item) => item.id)}
            onChange={(ids) => patch({ tags: tags.filter((item) => ids.includes(item.id)) })}
          />
        </Field>
      </SettingSection>
      <SettingSection title="Featured media">
        <div className="aspect-[16/9] overflow-hidden bg-[#eef2f0]">
          {draft.featuredImageUrl ? (
            <img src={draft.featuredImageUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center text-[#87938e]">
              <ImageIcon className="h-6 w-6" />
            </div>
          )}
        </div>
        <Field label="Choose from media library">
          <Select
            value={draft.featuredImageUrl || "none"}
            onValueChange={(value) =>
              patch({
                featuredImageUrl: value === "none" ? "" : value,
                ogImageUrl: value === "none" ? draft.ogImageUrl : value,
                twitterImageUrl: value === "none" ? draft.twitterImageUrl : value,
                socialImageUrl: value === "none" ? draft.socialImageUrl : value,
              })
            }
          >
            <SelectTrigger className="rounded-none">
              <SelectValue placeholder="Select image" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">No featured image</SelectItem>
              {media
                .filter((item) => item.fileType === "image")
                .map((item) => (
                  <SelectItem key={item.id} value={item.publicUrl}>
                    {item.title}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        </Field>
        <Field label="Or image URL">
          <Input
            value={draft.featuredImageUrl}
            onChange={(event) => patch({ featuredImageUrl: event.target.value })}
            className="rounded-none"
          />
        </Field>
        {(draft.format === "video" || draft.format === "embedded_video") && (
          <>
            <Field label="Video URL">
              <Input
                value={draft.featuredVideoUrl ?? ""}
                onChange={(event) => patch({ featuredVideoUrl: event.target.value })}
                placeholder="YouTube, Vimeo or uploaded file"
                className="rounded-none"
              />
            </Field>
            <Field label="Video caption">
              <Textarea
                value={draft.videoCaption ?? ""}
                onChange={(event) => patch({ videoCaption: event.target.value })}
                className="rounded-none"
              />
            </Field>
          </>
        )}
      </SettingSection>
      <SettingSection title="Conversion">
        <Field label="Article call-to-action">
          <Input
            value={draft.ctaLabel ?? ""}
            onChange={(event) => patch({ ctaLabel: event.target.value })}
            placeholder="Request an investment pack"
            className="rounded-none"
          />
        </Field>
        <Field label="CTA destination">
          <Input
            value={draft.ctaUrl ?? ""}
            onChange={(event) => patch({ ctaUrl: event.target.value })}
            placeholder="/contact"
            className="rounded-none"
          />
        </Field>
        <Toggle
          label="Allow comments"
          checked={draft.commentsEnabled}
          onChange={(value) => patch({ commentsEnabled: value })}
        />
      </SettingSection>
    </div>
  );
}

function SeoSettings({
  draft,
  score,
  patch,
}: {
  draft: ContentPost;
  score: number;
  patch: (value: Partial<ContentPost>) => void;
}) {
  const title = draft.seoTitle || draft.title;
  const description = draft.metaDescription || draft.excerpt;
  return (
    <div className="divide-y divide-[#e8ecea]">
      <SettingSection title="SEO health">
        <div className="flex items-center gap-3">
          <div className="relative flex h-14 w-14 items-center justify-center rounded-full border-4 border-[#e6ece9]">
            <span className="font-serif text-lg font-semibold text-[#1c5043]">{score}</span>
          </div>
          <div>
            <p className="text-xs font-semibold text-[#31534a]">
              {score >= 80
                ? "Ready for review"
                : score >= 55
                  ? "Good foundation"
                  : "Needs attention"}
            </p>
            <p className="mt-1 text-[10px] leading-4 text-[#81908a]">
              Score checks title, description, keyword, image and index settings.
            </p>
          </div>
        </div>
      </SettingSection>
      <SettingSection title="Search preview">
        <div className="border border-[#e1e7e4] bg-[#fafbfa] p-3">
          <p className="truncate text-[10px] text-[#547b6c]">
            kaystephgroup.com › blog › {draft.slug}
          </p>
          <p className="mt-1 line-clamp-2 text-[15px] font-medium text-[#2453a5]">
            {title || "Article title"}
          </p>
          <p className="mt-1 line-clamp-3 text-[11px] leading-4 text-[#5d6863]">
            {description || "Add a meta description to control how this article appears in search."}
          </p>
        </div>
      </SettingSection>
      <SettingSection title="Metadata">
        <Field label="SEO title">
          <Input
            value={draft.seoTitle}
            onChange={(event) => patch({ seoTitle: event.target.value })}
            maxLength={80}
            className="rounded-none"
          />
          <Counter value={draft.seoTitle.length} target="50–60" max={80} />
        </Field>
        <Field label="Meta description">
          <Textarea
            value={draft.metaDescription}
            onChange={(event) => patch({ metaDescription: event.target.value })}
            maxLength={200}
            className="rounded-none"
          />
          <Counter value={draft.metaDescription.length} target="140–160" max={200} />
        </Field>
        <Field label="Focus keyword">
          <Input
            value={draft.focusKeyword}
            onChange={(event) => patch({ focusKeyword: event.target.value })}
            className="rounded-none"
          />
        </Field>
        <Field label="Secondary keywords">
          <Input
            value={draft.secondaryKeywords.join(", ")}
            onChange={(event) =>
              patch({
                secondaryKeywords: event.target.value
                  .split(",")
                  .map((item) => item.trim())
                  .filter(Boolean),
              })
            }
            placeholder="Abuja property, investment"
            className="rounded-none"
          />
        </Field>
        <Field label="Canonical URL">
          <Input
            value={draft.canonicalUrl}
            onChange={(event) => patch({ canonicalUrl: event.target.value })}
            className="rounded-none"
          />
        </Field>
      </SettingSection>
      <SettingSection title="Open Graph">
        <Field label="Social title">
          <Input
            value={draft.ogTitle}
            onChange={(event) => patch({ ogTitle: event.target.value })}
            className="rounded-none"
          />
        </Field>
        <Field label="Social description">
          <Textarea
            value={draft.ogDescription}
            onChange={(event) => patch({ ogDescription: event.target.value })}
            className="rounded-none"
          />
        </Field>
        <Field label="Social image URL">
          <Input
            value={draft.ogImageUrl}
            onChange={(event) => patch({ ogImageUrl: event.target.value })}
            className="rounded-none"
          />
        </Field>
      </SettingSection>
      <SettingSection title="Search controls">
        <Toggle
          label="Allow indexing"
          checked={draft.robotsIndex}
          onChange={(value) => patch({ robotsIndex: value })}
        />
        <Toggle
          label="Allow link following"
          checked={draft.robotsFollow}
          onChange={(value) => patch({ robotsFollow: value })}
        />
        <Toggle
          label="Include in sitemap"
          checked={draft.includeInSitemap}
          onChange={(value) => patch({ includeInSitemap: value })}
        />
      </SettingSection>
    </div>
  );
}

function SocialSettings({
  draft,
  patch,
}: {
  draft: ContentPost;
  patch: (value: Partial<ContentPost>) => void;
}) {
  return (
    <div className="divide-y divide-[#e8ecea]">
      <SettingSection title="Distribution preview">
        <div className="overflow-hidden border border-[#dfe5e2]">
          <div className="aspect-[1.91/1] bg-[#edf1ef]">
            {draft.socialImageUrl || draft.featuredImageUrl ? (
              <img
                src={draft.socialImageUrl || draft.featuredImageUrl}
                alt=""
                className="h-full w-full object-cover"
              />
            ) : null}
          </div>
          <div className="p-3">
            <p className="line-clamp-2 text-xs font-semibold text-[#304f47]">
              {draft.ogTitle || draft.title}
            </p>
            <p className="mt-1 line-clamp-2 text-[10px] leading-4 text-[#7d8983]">
              {draft.ogDescription || draft.excerpt}
            </p>
          </div>
        </div>
      </SettingSection>
      <SettingSection title="Social media">
        <Field label="Facebook caption">
          <Textarea
            value={draft.facebookCaption}
            onChange={(event) => patch({ facebookCaption: event.target.value })}
            className="min-h-24 rounded-none"
          />
        </Field>
        <Field label="Instagram caption">
          <Textarea
            value={draft.instagramCaption}
            onChange={(event) => patch({ instagramCaption: event.target.value })}
            className="min-h-28 rounded-none"
          />
        </Field>
        <Field label="LinkedIn caption">
          <Textarea
            value={draft.linkedinCaption}
            onChange={(event) => patch({ linkedinCaption: event.target.value })}
            className="min-h-24 rounded-none"
          />
        </Field>
        <Field label="X caption">
          <Textarea
            value={draft.twitterCaption}
            onChange={(event) => patch({ twitterCaption: event.target.value })}
            maxLength={1000}
            className="rounded-none"
          />
        </Field>
        <Field label="WhatsApp share text">
          <Textarea
            value={draft.whatsappShareText}
            onChange={(event) => patch({ whatsappShareText: event.target.value })}
            className="rounded-none"
          />
        </Field>
      </SettingSection>
      <SettingSection title="Social media asset">
        <Field label="Image URL">
          <Input
            value={draft.socialImageUrl}
            onChange={(event) => patch({ socialImageUrl: event.target.value })}
            className="rounded-none"
          />
        </Field>
        <Field label="Video URL">
          <Input
            value={draft.socialVideoUrl ?? ""}
            onChange={(event) => patch({ socialVideoUrl: event.target.value })}
            className="rounded-none"
          />
        </Field>
        <Field label="Distribution time">
          <Input
            type="datetime-local"
            value={toDateTimeLocal(draft.socialScheduledAt)}
            onChange={(event) =>
              patch({
                socialScheduledAt: event.target.value
                  ? new Date(event.target.value).toISOString()
                  : null,
              })
            }
            className="rounded-none"
          />
        </Field>
        <p className="text-[10px] leading-5 text-[#7c8983]">
          Platform credentials and approval rules are configured under Social Publishing and
          Settings.
        </p>
      </SettingSection>
    </div>
  );
}

function BlockEditor({
  block,
  selected,
  first,
  last,
  onSelect,
  onUpdate,
  onMove,
  onDuplicate,
  onRemove,
}: {
  block: ContentBlock;
  selected: boolean;
  first: boolean;
  last: boolean;
  onSelect: () => void;
  onUpdate: (data: Record<string, ContentJsonValue>) => void;
  onMove: (direction: -1 | 1) => void;
  onDuplicate: () => void;
  onRemove: () => void;
}) {
  return (
    <div
      onClick={onSelect}
      className={`relative border bg-white transition ${selected ? "border-[#b48735] shadow-[0_0_0_1px_#b48735]" : "border-transparent hover:border-[#d9e1dd]"}`}
    >
      <div
        className={`flex items-center gap-1 border-b px-2 py-1.5 ${selected ? "border-[#ead9b8] bg-[#fffaf0]" : "border-[#edf0ee] bg-[#fafbf9] opacity-0 group-hover:opacity-100"}`}
      >
        <GripVertical className="h-3.5 w-3.5 text-[#9ba49f]" />
        <span className="flex-1 text-[9px] font-bold uppercase tracking-[0.12em] text-[#7c8882]">
          {CONTENT_BLOCK_TYPES.find((item) => item.key === block.type)?.label ?? block.type}
        </span>
        <IconButton label="Move up" disabled={first} onClick={() => onMove(-1)}>
          <ArrowUp className="h-3.5 w-3.5" />
        </IconButton>
        <IconButton label="Move down" disabled={last} onClick={() => onMove(1)}>
          <ArrowDown className="h-3.5 w-3.5" />
        </IconButton>
        <IconButton label="Duplicate" onClick={onDuplicate}>
          <Copy className="h-3.5 w-3.5" />
        </IconButton>
        <IconButton label="Delete" onClick={onRemove} danger>
          <Trash2 className="h-3.5 w-3.5" />
        </IconButton>
      </div>
      <div className="p-3 sm:p-4">
        <BlockFields block={block} update={onUpdate} />
      </div>
    </div>
  );
}

function BlockFields({
  block,
  update,
}: {
  block: ContentBlock;
  update: (data: Record<string, ContentJsonValue>) => void;
}) {
  const text = String(block.data.text ?? "");
  if (block.type === "heading")
    return (
      <div className="flex gap-2">
        <Select
          value={String(block.data.level ?? 2)}
          onValueChange={(value) => update({ level: Number(value) })}
        >
          <SelectTrigger className="w-20 rounded-none">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {[2, 3, 4].map((level) => (
              <SelectItem key={level} value={String(level)}>
                H{level}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Input
          value={text}
          onChange={(event) => update({ text: event.target.value })}
          placeholder="Section heading"
          className="rounded-none font-serif text-lg"
        />
      </div>
    );
  if (block.type === "paragraph")
    return (
      <Textarea
        value={text}
        onChange={(event) => update({ text: event.target.value })}
        placeholder="Write a paragraph..."
        className="min-h-32 resize-y rounded-none border-0 p-1 text-[15px] leading-7 shadow-none focus-visible:ring-0"
      />
    );
  if (block.type === "quote")
    return (
      <Textarea
        value={text}
        onChange={(event) => update({ text: event.target.value })}
        placeholder="Add a memorable quotation"
        className="min-h-24 rounded-none border-l-4 border-[#b78936] bg-[#fffbf2] font-serif text-lg italic"
      />
    );
  if (block.type === "list")
    return (
      <>
        <Textarea
          value={toStringArray(block.data.items).join("\n")}
          onChange={(event) => update({ items: event.target.value.split("\n") })}
          placeholder="One list item per line"
          className="min-h-28 rounded-none"
        />
        <Toggle
          label="Numbered list"
          checked={Boolean(block.data.ordered)}
          onChange={(value) => update({ ordered: value })}
        />
      </>
    );
  if (block.type === "table")
    return (
      <>
        <Field label="Column headings (use | between columns)">
          <Input
            value={toStringArray(block.data.headers).join(" | ")}
            onChange={(event) =>
              update({ headers: event.target.value.split("|").map((item) => item.trim()) })
            }
            className="rounded-none"
          />
        </Field>
        <Field label="Rows (one row per line, use | between cells)">
          <Textarea
            value={toStringRows(block.data.rows)
              .map((row) => row.join(" | "))
              .join("\n")}
            onChange={(event) =>
              update({
                rows: event.target.value
                  .split("\n")
                  .map((row) => row.split("|").map((cell) => cell.trim())),
              })
            }
            className="min-h-28 rounded-none font-mono text-xs"
          />
        </Field>
      </>
    );
  if (["image", "video", "download"].includes(block.type))
    return (
      <div className="grid gap-3">
        <Field
          label={
            block.type === "video"
              ? "Video URL"
              : block.type === "download"
                ? "File URL"
                : "Image URL"
          }
        >
          <Input
            value={String(block.data.url ?? "")}
            onChange={(event) => update({ url: event.target.value })}
            className="rounded-none"
          />
        </Field>
        {block.type === "video" && (
          <Field label="Poster image URL">
            <Input
              value={String(block.data.poster ?? "")}
              onChange={(event) => update({ poster: event.target.value })}
              className="rounded-none"
            />
          </Field>
        )}
        <Field label={block.type === "download" ? "Download title" : "Caption"}>
          <Input
            value={String(block.data.caption ?? block.data.title ?? "")}
            onChange={(event) =>
              update(
                block.type === "download"
                  ? { title: event.target.value }
                  : { caption: event.target.value },
              )
            }
            className="rounded-none"
          />
        </Field>
        {block.type === "image" && (
          <Field label="Alternative text">
            <Input
              value={String(block.data.alt ?? "")}
              onChange={(event) => update({ alt: event.target.value })}
              className="rounded-none"
            />
          </Field>
        )}
      </div>
    );
  if (block.type === "gallery")
    return (
      <Field label="Image URLs (one per line)">
        <Textarea
          value={toStringArray(block.data.images).join("\n")}
          onChange={(event) => update({ images: event.target.value.split("\n").filter(Boolean) })}
          className="min-h-32 rounded-none"
        />
      </Field>
    );
  if (["cta", "button", "callout"].includes(block.type))
    return (
      <div className="grid gap-3">
        <Field label="Title">
          <Input
            value={String(block.data.title ?? "")}
            onChange={(event) => update({ title: event.target.value })}
            className="rounded-none"
          />
        </Field>
        <Field label="Supporting text">
          <Textarea
            value={String(block.data.text ?? "")}
            onChange={(event) => update({ text: event.target.value })}
            className="rounded-none"
          />
        </Field>
        {block.type !== "callout" && (
          <div className="grid grid-cols-2 gap-3">
            <Field label="Button label">
              <Input
                value={String(block.data.label ?? "")}
                onChange={(event) => update({ label: event.target.value })}
                className="rounded-none"
              />
            </Field>
            <Field label="Destination">
              <Input
                value={String(block.data.url ?? "")}
                onChange={(event) => update({ url: event.target.value })}
                className="rounded-none"
              />
            </Field>
          </div>
        )}
      </div>
    );
  if (["property_card", "investment_card"].includes(block.type))
    return (
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Name">
          <Input
            value={String(block.data.name ?? "")}
            onChange={(event) => update({ name: event.target.value })}
            className="rounded-none"
          />
        </Field>
        <Field label={block.type === "property_card" ? "Location" : "Minimum contribution"}>
          <Input
            value={String(block.data.location ?? block.data.minimum ?? "")}
            onChange={(event) =>
              update(
                block.type === "property_card"
                  ? { location: event.target.value }
                  : { minimum: event.target.value },
              )
            }
            className="rounded-none"
          />
        </Field>
        <Field label="Description">
          <Textarea
            value={String(block.data.detail ?? "")}
            onChange={(event) => update({ detail: event.target.value })}
            className="rounded-none"
          />
        </Field>
        <Field label="Destination">
          <Input
            value={String(block.data.url ?? "")}
            onChange={(event) => update({ url: event.target.value })}
            className="rounded-none"
          />
        </Field>
      </div>
    );
  if (block.type === "custom_html")
    return (
      <>
        <div className="mb-3 border border-[#ebd7a6] bg-[#fff8e4] p-3 text-[10px] leading-5 text-[#74561e]">
          Custom HTML is sandboxed on the public page and can only be published by a platform
          administrator.
        </div>
        <Textarea
          value={String(block.data.html ?? "")}
          onChange={(event) => update({ html: event.target.value })}
          className="min-h-44 rounded-none font-mono text-xs"
        />
      </>
    );
  if (block.type === "columns")
    return (
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Left column">
          <Textarea
            value={String(block.data.left ?? "")}
            onChange={(event) => update({ left: event.target.value })}
            className="min-h-28 rounded-none"
          />
        </Field>
        <Field label="Right column">
          <Textarea
            value={String(block.data.right ?? "")}
            onChange={(event) => update({ right: event.target.value })}
            className="min-h-28 rounded-none"
          />
        </Field>
      </div>
    );
  if (block.type === "divider") return <div className="my-5 border-t border-[#cad5d0]" />;
  if (block.type === "newsletter")
    return (
      <div className="border border-[#cbdad4] bg-[#f1f7f4] p-4">
        <p className="text-xs font-semibold text-[#285248]">Newsletter capture block</p>
        <Input
          value={String(block.data.title ?? "")}
          onChange={(event) => update({ title: event.target.value })}
          placeholder="Get the next property brief"
          className="mt-3 rounded-none bg-white"
        />
      </div>
    );
  if (block.type === "related_posts")
    return (
      <div className="border border-dashed border-[#cbd6d1] bg-[#fafbf9] p-5 text-center text-xs text-[#708078]">
        Related articles are selected automatically by category and tags.
      </div>
    );
  return (
    <Textarea
      value={text}
      onChange={(event) => update({ text: event.target.value })}
      className="rounded-none"
    />
  );
}

function AddBlockMenu({
  onAdd,
  label = "Add",
}: {
  onAdd: (type: ContentBlockType) => void;
  label?: string;
}) {
  const icons = { Text: Type, Media: ImageIcon, Conversion: Send, Layout: LayoutTemplate } as const;
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="rounded-none border-[#cfdad5] text-[#31584e]"
        >
          <Plus className="mr-2 h-3.5 w-3.5" />
          {label}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="max-h-[420px] w-64 overflow-y-auto">
        {(["Text", "Media", "Conversion", "Layout"] as const).map((group, index) => {
          const Icon = icons[group];
          return (
            <div key={group}>
              {index > 0 && <DropdownMenuSeparator />}
              <DropdownMenuLabel className="flex items-center gap-2 text-[10px] uppercase tracking-wider text-[#7c8983]">
                <Icon className="h-3.5 w-3.5" />
                {group}
              </DropdownMenuLabel>
              {CONTENT_BLOCK_TYPES.filter((item) => item.group === group).map((item) => (
                <DropdownMenuItem key={item.key} onClick={() => onAdd(item.key)}>
                  {item.label}
                </DropdownMenuItem>
              ))}
            </div>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function SettingSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-4 p-4">
      <h3 className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#6d7d76]">{title}</h3>
      {children}
    </section>
  );
}
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[10px] font-semibold text-[#64756e]">{label}</span>
      {children}
    </label>
  );
}
function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3 py-1">
      <Label className="text-[11px] font-medium text-[#51675e]">{label}</Label>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );
}
function Counter({ value, target, max }: { value: number; target: string; max: number }) {
  return (
    <p className={`mt-1 text-right text-[9px] ${value > max ? "text-red-600" : "text-[#929c97]"}`}>
      {value}/{max} · ideal {target}
    </p>
  );
}
function IconButton({
  label,
  disabled,
  onClick,
  danger,
  children,
}: {
  label: string;
  disabled?: boolean;
  onClick: () => void;
  danger?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={(event) => {
        event.stopPropagation();
        onClick();
      }}
      className={`flex h-7 w-7 items-center justify-center hover:bg-white disabled:opacity-25 ${danger ? "text-red-500" : "text-[#64766f]"}`}
    >
      {children}
    </button>
  );
}
function CheckList({
  items,
  selected,
  onChange,
}: {
  items: Array<{ id: string; label: string }>;
  selected: string[];
  onChange: (ids: string[]) => void;
}) {
  return (
    <div className="max-h-36 space-y-2 overflow-y-auto border border-[#dfe5e2] p-3">
      {items.map((item) => (
        <label key={item.id} className="flex items-center gap-2 text-[11px] text-[#536860]">
          <Checkbox
            checked={selected.includes(item.id)}
            onCheckedChange={(value) =>
              onChange(value ? [...selected, item.id] : selected.filter((id) => id !== item.id))
            }
          />
          {item.label}
        </label>
      ))}
    </div>
  );
}

function createBlankPost(
  author: ContentPost["author"] | undefined,
  category: ContentPost["primaryCategory"] | undefined,
): ContentPost {
  const blankAuthor = author ?? {
    id: "",
    fullName: "Kay-Steph Editorial Desk",
    slug: "kay-steph-editorial-desk",
    jobTitle: "Company Newsroom",
    biography: "",
    email: "",
    socialLinks: {},
    seoDescription: "",
  };
  const blankCategory = category ?? {
    id: "",
    name: "Investment Education",
    slug: "investment-education",
    description: "",
    seoTitle: "",
    seoDescription: "",
    isActive: true,
  };
  return {
    id: "new-post",
    title: "",
    slug: "untitled-post",
    excerpt: "",
    contentBlocks: [{ id: "paragraph-1", type: "paragraph", data: { text: "" } }],
    featuredImageUrl: "",
    featuredVideoUrl: null,
    posterImageUrl: null,
    videoCaption: null,
    videoTranscript: null,
    format: "standard",
    status: "draft",
    author: blankAuthor,
    primaryCategory: blankCategory,
    secondaryCategories: [],
    tags: [],
    publishedAt: null,
    scheduledAt: null,
    updatedAt: new Date(0).toISOString(),
    readingTimeMinutes: 1,
    isFeatured: false,
    isPopular: false,
    commentsEnabled: false,
    relatedProperty: null,
    relatedInvestment: null,
    ctaLabel: "Talk to an adviser",
    ctaUrl: "/contact",
    seoTitle: "",
    metaDescription: "",
    focusKeyword: "",
    secondaryKeywords: [],
    canonicalUrl: "https://kaystephgroup.com/blog/untitled-post",
    ogTitle: "",
    ogDescription: "",
    ogImageUrl: "",
    twitterTitle: "",
    twitterDescription: "",
    twitterImageUrl: "",
    robotsIndex: true,
    robotsFollow: true,
    includeInSitemap: true,
    facebookCaption: "",
    instagramCaption: "",
    linkedinCaption: "",
    twitterCaption: "",
    whatsappShareText: "",
    socialImageUrl: "",
    socialVideoUrl: null,
    socialScheduledAt: null,
    viewCount: 0,
    uniqueVisitorCount: 0,
    averageReadSeconds: 0,
    videoPlayCount: 0,
    socialShareCount: 0,
    leadCount: 0,
  };
}

function createBlock(type: ContentBlockType): ContentBlock {
  const defaults: Partial<Record<ContentBlockType, Record<string, ContentJsonValue>>> = {
    heading: { text: "New section", level: 2 },
    paragraph: { text: "" },
    quote: { text: "" },
    list: { items: [""], ordered: false },
    table: { headers: ["Column 1", "Column 2"], rows: [["", ""]] },
    image: { url: "", alt: "", caption: "" },
    gallery: { images: [] },
    video: { url: "", poster: "", caption: "" },
    download: { title: "Download resource", url: "", detail: "" },
    callout: { title: "Important note", text: "", tone: "gold" },
    cta: { title: "Take the next step", text: "", label: "Contact us", url: "/contact" },
    button: { label: "Learn more", url: "/" },
    property_card: { name: "", location: "", detail: "", url: "/properties" },
    investment_card: { name: "", minimum: "", detail: "", url: "/invest" },
    newsletter: { title: "Get the next property brief", interests: ["Property opportunities"] },
    columns: { left: "", right: "" },
    custom_html: { html: "" },
  };
  return { id: `${type}-${Date.now()}`, type, data: defaults[type] ?? {} };
}

function toDateTimeLocal(value?: string | null) {
  if (!value) return "";
  const date = new Date(value);
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}
function toStringArray(value: ContentJsonValue | undefined) {
  return Array.isArray(value) ? value.map(String) : [];
}
function toStringRows(value: ContentJsonValue | undefined) {
  return Array.isArray(value)
    ? value.map((row) => (Array.isArray(row) ? row.map(String) : [String(row)]))
    : [];
}
function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}
function uuidOrUndefined(value: string) {
  return isUuid(value) ? value : undefined;
}
