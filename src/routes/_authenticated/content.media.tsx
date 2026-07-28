import { useMemo, useRef, useState, type ChangeEvent } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useClientFn } from "@/lib/client-function";
import {
  Archive,
  File,
  FileText,
  Film,
  Grid3X3,
  Image as ImageIcon,
  Link2,
  List,
  Lock,
  MoreHorizontal,
  Plus,
  Search,
  Upload,
  Video,
} from "lucide-react";
import { toast } from "sonner";
import { useContentWorkspace } from "@/components/content/ContentWorkspaceContext";
import { ContentEmpty, ContentPageHeader, ContentPanel } from "@/components/content/ContentUi";
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
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { formatFileSize, type ContentMedia } from "@/lib/content";
import { registerContentMedia } from "@/lib/content.functions";

export const Route = createFileRoute("/_authenticated/content/media")({
  component: ContentMediaLibrary,
});

function ContentMediaLibrary() {
  const { media, refresh } = useContentWorkspace();
  const [query, setQuery] = useState("");
  const [type, setType] = useState("all");
  const [visibility, setVisibility] = useState("all");
  const [layout, setLayout] = useState<"grid" | "list">("grid");
  const [selected, setSelected] = useState<ContentMedia | null>(null);
  const [externalOpen, setExternalOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);
  const register = useClientFn(registerContentMedia);

  const filtered = useMemo(
    () =>
      media.filter((item) => {
        if (type !== "all" && item.fileType !== type) return false;
        if (visibility !== "all" && item.visibility !== visibility) return false;
        const needle = query.trim().toLowerCase();
        return (
          !needle || `${item.title} ${item.fileName} ${item.altText}`.toLowerCase().includes(needle)
        );
      }),
    [media, query, type, visibility],
  );

  async function uploadFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (!ALLOWED_MEDIA_MIME_TYPES.has(file.type)) {
      toast.error("Use JPG, PNG, WebP, GIF, MP4, WebM, MOV, PDF, Word or Excel files.");
      return;
    }
    const fileType = resolveFileType(file.type);
    const maxBytes = fileType === "video" ? 250 * 1024 * 1024 : 20 * 1024 * 1024;
    if (file.size > maxBytes) {
      toast.error(
        `${fileType === "video" ? "Videos" : "Files"} must be smaller than ${formatFileSize(maxBytes)}.`,
      );
      return;
    }
    setUploading(true);
    try {
      const visibility = fileType === "document" ? "private" : "public";
      const bucketId = visibility === "public" ? "blog-media" : "content-private";
      const safeName = file.name.toLowerCase().replace(/[^a-z0-9._-]+/g, "-");
      const storagePath = `${new Date().getFullYear()}/${crypto.randomUUID()}-${safeName}`;
      const { error } = await supabase.storage
        .from(bucketId)
        .upload(storagePath, file, { cacheControl: "31536000", upsert: false });
      if (error) throw error;
      const publicUrl =
        visibility === "public"
          ? supabase.storage.from(bucketId).getPublicUrl(storagePath).data.publicUrl
          : undefined;
      const dimensions = fileType === "image" ? await imageDimensions(file) : {};
      await register({
        data: {
          bucketId,
          storagePath,
          publicUrl,
          fileName: file.name,
          title: file.name.replace(/\.[^.]+$/, ""),
          altText: "",
          mimeType: file.type,
          fileType,
          fileSizeBytes: file.size,
          width: dimensions.width,
          height: dimensions.height,
          sourceType: "upload",
          visibility,
        },
      });
      toast.success("Media uploaded and registered.");
      await refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "The media file could not be uploaded.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="space-y-6">
      <ContentPageHeader
        eyebrow="Shared asset library"
        title="Media library"
        description="Upload, describe and reuse images, video, documents and external embeds with clear public or private visibility."
        actions={
          <>
            <input
              ref={fileInput}
              type="file"
              accept="image/*,video/*,.pdf,.doc,.docx,.xls,.xlsx"
              onChange={uploadFile}
              className="hidden"
            />
            <Button
              variant="outline"
              className="rounded-none border-[#cfdad5] bg-white"
              onClick={() => setExternalOpen(true)}
            >
              <Link2 className="mr-2 h-4 w-4" />
              Add video link
            </Button>
            <Button
              className="rounded-none bg-[#0e5949] hover:bg-[#09483b]"
              onClick={() => fileInput.current?.click()}
              disabled={uploading}
            >
              <Upload className="mr-2 h-4 w-4" />
              {uploading ? "Uploading..." : "Upload media"}
            </Button>
          </>
        }
      />
      <ContentPanel>
        <div className="grid gap-3 border-b border-[#e5ebe8] p-4 md:grid-cols-[minmax(240px,1fr)_180px_160px_auto]">
          <label className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8b9691]" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search title, filename or alt text"
              className="rounded-none pl-9"
            />
          </label>
          <Select value={type} onValueChange={setType}>
            <SelectTrigger className="rounded-none">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All media types</SelectItem>
              <SelectItem value="image">Images</SelectItem>
              <SelectItem value="video">Videos</SelectItem>
              <SelectItem value="pdf">PDFs</SelectItem>
              <SelectItem value="document">Documents</SelectItem>
            </SelectContent>
          </Select>
          <Select value={visibility} onValueChange={setVisibility}>
            <SelectTrigger className="rounded-none">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All visibility</SelectItem>
              <SelectItem value="public">Public</SelectItem>
              <SelectItem value="private">Private</SelectItem>
            </SelectContent>
          </Select>
          <div className="flex border border-[#dce4e0]">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className={`rounded-none ${layout === "grid" ? "bg-[#edf4f1]" : ""}`}
              onClick={() => setLayout("grid")}
              aria-label="Grid view"
            >
              <Grid3X3 className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className={`rounded-none ${layout === "list" ? "bg-[#edf4f1]" : ""}`}
              onClick={() => setLayout("list")}
              aria-label="List view"
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>
        {filtered.length ? (
          layout === "grid" ? (
            <div className="grid gap-px bg-[#e2e8e5] sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-5">
              {filtered.map((item) => (
                <MediaTile key={item.id} item={item} onSelect={() => setSelected(item)} />
              ))}
            </div>
          ) : (
            <div className="divide-y divide-[#e9edeb]">
              {filtered.map((item) => (
                <MediaRow key={item.id} item={item} onSelect={() => setSelected(item)} />
              ))}
            </div>
          )
        ) : (
          <ContentEmpty
            title="No media found"
            body="Change the filters, upload a new asset or add an external video link."
          />
        )}
        <div className="flex items-center justify-between border-t border-[#e5ebe8] px-4 py-3 text-[10px] text-[#7e8a84]">
          <span>{filtered.length} assets</span>
          <span>
            Public assets use long-lived caching; private documents remain access controlled.
          </span>
        </div>
      </ContentPanel>
      <MediaDetail
        key={selected?.id ?? "closed"}
        item={selected}
        onClose={() => setSelected(null)}
        onSaved={refresh}
      />
      <ExternalMediaDialog
        open={externalOpen}
        onClose={() => setExternalOpen(false)}
        onSaved={refresh}
      />
    </div>
  );
}

function MediaTile({ item, onSelect }: { item: ContentMedia; onSelect: () => void }) {
  return (
    <button type="button" onClick={onSelect} className="group bg-white text-left">
      <div className="relative aspect-[4/3] overflow-hidden bg-[#eef2f0]">
        {item.fileType === "image" && item.publicUrl ? (
          <img
            src={item.publicUrl}
            alt={item.altText || ""}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
          />
        ) : (
          <MediaPlaceholder item={item} />
        )}
        <span className="absolute left-2 top-2 flex items-center gap-1 bg-[#173f36]/90 px-2 py-1 text-[8px] font-bold uppercase tracking-wider text-white">
          {item.visibility === "private" && <Lock className="h-2.5 w-2.5" />}
          {item.fileType}
        </span>
      </div>
      <div className="p-3">
        <p className="truncate text-xs font-semibold text-[#315047]">{item.title}</p>
        <div className="mt-2 flex items-center justify-between text-[9px] text-[#89938f]">
          <span>{formatFileSize(item.fileSizeBytes)}</span>
          <span>{item.usageCount} uses</span>
        </div>
        {item.fileType === "image" && !item.altText && (
          <p className="mt-2 text-[9px] font-semibold text-amber-700">Alt text needed</p>
        )}
      </div>
    </button>
  );
}
function MediaRow({ item, onSelect }: { item: ContentMedia; onSelect: () => void }) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className="flex w-full items-center gap-4 bg-white p-4 text-left hover:bg-[#fafbf9]"
    >
      <div className="h-14 w-20 overflow-hidden bg-[#eef2f0]">
        {item.fileType === "image" && item.publicUrl ? (
          <img src={item.publicUrl} alt="" className="h-full w-full object-cover" />
        ) : (
          <MediaPlaceholder item={item} />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-xs font-semibold text-[#315047]">{item.title}</p>
        <p className="mt-1 truncate text-[10px] text-[#8b9691]">{item.fileName}</p>
      </div>
      <span className="text-[10px] text-[#708078]">{item.fileType}</span>
      <span className="text-[10px] text-[#708078]">{formatFileSize(item.fileSizeBytes)}</span>
      <span className="text-[10px] text-[#708078]">{item.visibility}</span>
      <MoreHorizontal className="h-4 w-4 text-[#87928d]" />
    </button>
  );
}
function MediaPlaceholder({ item }: { item: ContentMedia }) {
  const Icon = item.fileType === "video" ? Film : item.fileType === "pdf" ? FileText : File;
  return (
    <span className="flex h-full w-full items-center justify-center text-[#6d7d76]">
      <Icon className="h-8 w-8" />
    </span>
  );
}

function MediaDetail({
  item,
  onClose,
  onSaved,
}: {
  item: ContentMedia | null;
  onClose: () => void;
  onSaved: () => Promise<void>;
}) {
  const register = useClientFn(registerContentMedia);
  const [form, setForm] = useState({
    title: item?.title ?? "",
    altText: item?.altText ?? "",
    caption: item?.caption ?? "",
    description: item?.description ?? "",
    visibility: item?.visibility ?? ("public" as "public" | "private"),
  });
  return (
    <Dialog open={Boolean(item)} onOpenChange={(open) => !open && onClose()} key={item?.id}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle className="font-serif text-2xl text-[#21483e]">Media details</DialogTitle>
          <DialogDescription>
            Accessibility, editorial context and storage metadata for this asset.
          </DialogDescription>
        </DialogHeader>
        {item && (
          <div className="grid gap-5 md:grid-cols-[1fr_1.1fr]">
            <div>
              <div className="aspect-[4/3] overflow-hidden bg-[#edf2ef]">
                {item.fileType === "image" && item.publicUrl ? (
                  <img src={item.publicUrl} alt="" className="h-full w-full object-contain" />
                ) : (
                  <MediaPlaceholder item={item} />
                )}
              </div>
              <dl className="mt-3 space-y-2 text-[10px] text-[#75827c]">
                <div className="flex justify-between gap-3">
                  <dt>Filename</dt>
                  <dd className="truncate font-medium text-[#4b6158]">{item.fileName}</dd>
                </div>
                <div className="flex justify-between">
                  <dt>Type</dt>
                  <dd>{item.mimeType}</dd>
                </div>
                <div className="flex justify-between">
                  <dt>Size</dt>
                  <dd>{formatFileSize(item.fileSizeBytes)}</dd>
                </div>
                {item.width && item.height && (
                  <div className="flex justify-between">
                    <dt>Dimensions</dt>
                    <dd>
                      {item.width} × {item.height}
                    </dd>
                  </div>
                )}
                <div className="flex justify-between">
                  <dt>Usage</dt>
                  <dd>{item.usageCount} placements</dd>
                </div>
              </dl>
            </div>
            <form
              className="grid gap-4"
              onSubmit={async (event) => {
                event.preventDefault();
                try {
                  await register({
                    data: {
                      id: uuidOrUndefined(item.id),
                      bucketId: item.visibility === "private" ? "content-private" : "blog-media",
                      publicUrl: item.publicUrl || undefined,
                      fileName: item.fileName,
                      title: form.title,
                      altText: form.altText,
                      caption: form.caption,
                      description: form.description,
                      mimeType: item.mimeType,
                      fileType: item.fileType,
                      fileSizeBytes: item.fileSizeBytes,
                      width: item.width ?? undefined,
                      height: item.height ?? undefined,
                      durationSeconds: item.durationSeconds ?? undefined,
                      sourceType: item.sourceType,
                      sourceUrl: item.sourceType !== "upload" ? item.publicUrl : undefined,
                      visibility: form.visibility,
                    },
                  });
                  toast.success("Media details saved.");
                  await onSaved();
                  onClose();
                } catch (error) {
                  toast.error(
                    error instanceof Error ? error.message : "Media could not be updated.",
                  );
                }
              }}
            >
              <Field label="Title">
                <Input
                  value={form.title}
                  onChange={(event) => setForm({ ...form, title: event.target.value })}
                  className="rounded-none"
                />
              </Field>
              {item.fileType === "image" && (
                <Field label="Alternative text">
                  <Textarea
                    value={form.altText}
                    onChange={(event) => setForm({ ...form, altText: event.target.value })}
                    className="rounded-none"
                  />
                  <p className="mt-1 text-[9px] text-[#88948e]">
                    Describe the content and purpose of the image for readers using assistive
                    technology.
                  </p>
                </Field>
              )}
              <Field label="Caption">
                <Input
                  value={form.caption}
                  onChange={(event) => setForm({ ...form, caption: event.target.value })}
                  className="rounded-none"
                />
              </Field>
              <Field label="Description">
                <Textarea
                  value={form.description}
                  onChange={(event) => setForm({ ...form, description: event.target.value })}
                  className="min-h-24 rounded-none"
                />
              </Field>
              <div className="flex items-center justify-between border border-[#dfe5e2] p-3">
                <div>
                  <Label className="text-xs">Private asset</Label>
                  <p className="mt-1 text-[9px] text-[#87928d]">
                    Private files are never exposed through a public storage URL.
                  </p>
                </div>
                <Switch
                  checked={form.visibility === "private"}
                  onCheckedChange={(value) =>
                    setForm({ ...form, visibility: value ? "private" : "public" })
                  }
                />
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={onClose}>
                  Cancel
                </Button>
                <Button type="submit" className="bg-[#0e5949]">
                  Save details
                </Button>
              </DialogFooter>
            </form>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function ExternalMediaDialog({
  open,
  onClose,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  onSaved: () => Promise<void>;
}) {
  const register = useClientFn(registerContentMedia);
  const [form, setForm] = useState({
    title: "",
    url: "",
    poster: "",
    caption: "",
    transcript: "",
    source: "youtube" as "youtube" | "vimeo" | "external",
  });
  return (
    <Dialog open={open} onOpenChange={(value) => !value && onClose()}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="font-serif text-2xl text-[#21483e]">
            Add external video
          </DialogTitle>
          <DialogDescription>
            Register a YouTube, Vimeo or other hosted video without enabling autoplay.
          </DialogDescription>
        </DialogHeader>
        <form
          className="grid gap-4"
          onSubmit={async (event) => {
            event.preventDefault();
            try {
              await register({
                data: {
                  bucketId: "blog-media",
                  fileName: form.title || "external-video",
                  title: form.title,
                  caption: form.caption,
                  fileType: "video",
                  sourceType: form.source,
                  sourceUrl: form.url,
                  embedUrl: form.url,
                  posterImageUrl: form.poster || undefined,
                  transcript: form.transcript || undefined,
                  visibility: "public",
                },
              });
              toast.success("Video registered.");
              await onSaved();
              onClose();
            } catch (error) {
              toast.error(
                error instanceof Error ? error.message : "Video could not be registered.",
              );
            }
          }}
        >
          <Field label="Video title">
            <Input
              value={form.title}
              onChange={(event) => setForm({ ...form, title: event.target.value })}
              required
              className="rounded-none"
            />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Source">
              <Select
                value={form.source}
                onValueChange={(value) => setForm({ ...form, source: value as typeof form.source })}
              >
                <SelectTrigger className="rounded-none">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="youtube">YouTube</SelectItem>
                  <SelectItem value="vimeo">Vimeo</SelectItem>
                  <SelectItem value="external">Other hosted video</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <Field label="Video or embed URL">
              <Input
                type="url"
                value={form.url}
                onChange={(event) => setForm({ ...form, url: event.target.value })}
                required
                className="rounded-none"
              />
            </Field>
          </div>
          <Field label="Poster image URL">
            <Input
              type="url"
              value={form.poster}
              onChange={(event) => setForm({ ...form, poster: event.target.value })}
              className="rounded-none"
            />
          </Field>
          <Field label="Caption">
            <Input
              value={form.caption}
              onChange={(event) => setForm({ ...form, caption: event.target.value })}
              className="rounded-none"
            />
          </Field>
          <Field label="Transcript">
            <Textarea
              value={form.transcript}
              onChange={(event) => setForm({ ...form, transcript: event.target.value })}
              className="min-h-28 rounded-none"
            />
          </Field>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" className="bg-[#0e5949]">
              <Video className="mr-2 h-4 w-4" />
              Add video
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
function resolveFileType(mime: string): "image" | "video" | "pdf" | "document" {
  if (mime.startsWith("image/")) return "image";
  if (mime.startsWith("video/")) return "video";
  if (mime === "application/pdf") return "pdf";
  return "document";
}

const ALLOWED_MEDIA_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "video/mp4",
  "video/webm",
  "video/quicktime",
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
]);
function uuidOrUndefined(value?: string) {
  return value && /^[0-9a-f-]{36}$/i.test(value) ? value : undefined;
}
function imageDimensions(file: File) {
  return new Promise<{ width?: number; height?: number }>((resolve) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      resolve({ width: image.naturalWidth, height: image.naturalHeight });
      URL.revokeObjectURL(url);
    };
    image.onerror = () => {
      resolve({});
      URL.revokeObjectURL(url);
    };
    image.src = url;
  });
}
