import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useClientFn } from "@/lib/client-function";
import { Edit3, ExternalLink, Linkedin, Mail, Plus, ShieldCheck, UserRoundPen } from "lucide-react";
import { toast } from "sonner";
import { useContentWorkspace } from "@/components/content/ContentWorkspaceContext";
import { ContentAvatar, ContentPageHeader, ContentPanel } from "@/components/content/ContentUi";
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
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { saveContentAuthor } from "@/lib/content.functions";
import { slugifyContent, type ContentAuthor } from "@/lib/content";

export const Route = createFileRoute("/_authenticated/content/authors")({
  component: ContentAuthors,
});

function ContentAuthors() {
  const { authors, posts, refresh } = useContentWorkspace();
  const [editor, setEditor] = useState<ContentAuthor | "new" | null>(null);
  return (
    <div className="space-y-6">
      <ContentPageHeader
        eyebrow="People and credibility"
        title="Authors"
        description="Manage public expertise profiles, biographies and accountable ownership for every published story."
        actions={
          <Button className="bg-[#0e5949] hover:bg-[#09483b]" onClick={() => setEditor("new")}>
            <Plus className="mr-2 h-4 w-4" />
            Add author
          </Button>
        }
      />
      <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
        {authors.map((author) => {
          const authored = posts.filter((post) => post.author.id === author.id);
          const published = authored.filter((post) => post.status === "published");
          return (
            <article key={author.id} className="border border-[#dce4e0] bg-white">
              <div className="flex items-start gap-4 border-b border-[#e7ebe9] p-5">
                <div className="scale-125">
                  <ContentAvatar name={author.fullName} imageUrl={author.profileImageUrl} />
                </div>
                <div className="min-w-0 flex-1">
                  <h2 className="font-serif text-xl font-semibold text-[#21473d]">
                    {author.fullName}
                  </h2>
                  <p className="mt-1 text-xs font-medium text-[#a17428]">{author.jobTitle}</p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setEditor(author)}
                  aria-label={`Edit ${author.fullName}`}
                >
                  <Edit3 className="h-4 w-4" />
                </Button>
              </div>
              <div className="p-5">
                <p className="line-clamp-4 min-h-20 text-xs leading-5 text-[#6f7d77]">
                  {author.biography}
                </p>
                <div className="mt-5 grid grid-cols-3 divide-x divide-[#e1e7e4] border-y border-[#e1e7e4] py-3 text-center">
                  <div>
                    <strong className="font-serif text-xl text-[#21483e]">{authored.length}</strong>
                    <p className="text-[9px] uppercase text-[#8c9792]">All posts</p>
                  </div>
                  <div>
                    <strong className="font-serif text-xl text-[#21483e]">
                      {published.length}
                    </strong>
                    <p className="text-[9px] uppercase text-[#8c9792]">Published</p>
                  </div>
                  <div>
                    <strong className="font-serif text-xl text-[#21483e]">
                      {published.reduce((sum, post) => sum + post.viewCount, 0).toLocaleString()}
                    </strong>
                    <p className="text-[9px] uppercase text-[#8c9792]">Views</p>
                  </div>
                </div>
                <div className="mt-4 flex items-center gap-2">
                  <Button
                    asChild
                    variant="outline"
                    size="sm"
                    className="h-8 flex-1 rounded-none border-[#d9e2de]"
                  >
                    <Link to="/blog/author/$slug" params={{ slug: author.slug }} target="_blank">
                      <ExternalLink className="mr-2 h-3.5 w-3.5" />
                      Public profile
                    </Link>
                  </Button>
                  {author.email && (
                    <Button
                      asChild
                      variant="outline"
                      size="icon"
                      className="h-8 w-8 rounded-none border-[#d9e2de]"
                    >
                      <a href={`mailto:${author.email}`} aria-label={`Email ${author.fullName}`}>
                        <Mail className="h-3.5 w-3.5" />
                      </a>
                    </Button>
                  )}
                </div>
              </div>
            </article>
          );
        })}
      </div>
      <ContentPanel
        title="Editorial accountability"
        description="Role separation is enforced in the publishing workflow"
      >
        <div className="grid gap-px bg-[#e5ebe8] md:grid-cols-3">
          <RoleNote
            icon={UserRoundPen}
            title="Authors"
            text="Create and revise assigned stories, then submit work for editorial review."
          />
          <RoleNote
            icon={ShieldCheck}
            title="Editors and managers"
            text="Review quality, approve scheduling and publish stories to the public Journal."
          />
          <RoleNote
            icon={Linkedin}
            title="SEO and social managers"
            text="Own search metadata, captions, distribution schedules and channel reporting."
          />
        </div>
      </ContentPanel>
      <AuthorDialog
        key={editor === "new" ? "new" : (editor?.id ?? "closed")}
        value={editor}
        onClose={() => setEditor(null)}
        onSaved={refresh}
      />
    </div>
  );
}

function RoleNote({
  icon: Icon,
  title,
  text,
}: {
  icon: typeof UserRoundPen;
  title: string;
  text: string;
}) {
  return (
    <div className="bg-white p-5">
      <Icon className="h-5 w-5 text-[#a87929]" />
      <h3 className="mt-4 text-sm font-semibold text-[#294a42]">{title}</h3>
      <p className="mt-2 text-xs leading-5 text-[#74817b]">{text}</p>
    </div>
  );
}

function AuthorDialog({
  value,
  onClose,
  onSaved,
}: {
  value: ContentAuthor | "new" | null;
  onClose: () => void;
  onSaved: () => Promise<void>;
}) {
  const original = value && value !== "new" ? value : null;
  const save = useClientFn(saveContentAuthor);
  const [form, setForm] = useState({
    fullName: original?.fullName ?? "",
    slug: original?.slug ?? "",
    jobTitle: original?.jobTitle ?? "",
    biography: original?.biography ?? "",
    email: original?.email ?? "",
    profileImageUrl: original?.profileImageUrl ?? "",
    linkedin: original?.socialLinks.linkedin ?? "",
    twitter: original?.socialLinks.twitter ?? "",
    seoDescription: original?.seoDescription ?? "",
    isActive: true,
  });
  function patch(key: keyof typeof form, value: string | boolean) {
    setForm((current) => ({ ...current, [key]: value }));
  }
  return (
    <Dialog
      open={Boolean(value)}
      onOpenChange={(open) => !open && onClose()}
      key={original?.id ?? String(value)}
    >
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="font-serif text-2xl text-[#21483e]">
            {original ? "Edit author" : "Add author"}
          </DialogTitle>
          <DialogDescription>
            Build a credible public profile and connect it to the right content-team member.
          </DialogDescription>
        </DialogHeader>
        <form
          className="grid gap-4"
          onSubmit={async (event) => {
            event.preventDefault();
            try {
              await save({
                data: {
                  id: uuidOrUndefined(original?.id),
                  fullName: form.fullName,
                  slug: form.slug || slugifyContent(form.fullName),
                  jobTitle: form.jobTitle,
                  biography: form.biography,
                  email: form.email || undefined,
                  profileImageUrl: form.profileImageUrl || undefined,
                  socialLinks: {
                    ...(form.linkedin ? { linkedin: form.linkedin } : {}),
                    ...(form.twitter ? { twitter: form.twitter } : {}),
                  },
                  seoDescription: form.seoDescription,
                  isActive: form.isActive,
                },
              });
              toast.success("Author profile saved.");
              await onSaved();
              onClose();
            } catch (error) {
              toast.error(error instanceof Error ? error.message : "Author could not be saved.");
            }
          }}
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Full name">
              <Input
                value={form.fullName}
                onChange={(event) => {
                  patch("fullName", event.target.value);
                  if (!original) patch("slug", slugifyContent(event.target.value));
                }}
                required
                className="rounded-none"
              />
            </Field>
            <Field label="Public profile slug">
              <Input
                value={form.slug}
                onChange={(event) => patch("slug", slugifyContent(event.target.value))}
                required
                className="rounded-none"
              />
            </Field>
            <Field label="Job title">
              <Input
                value={form.jobTitle}
                onChange={(event) => patch("jobTitle", event.target.value)}
                className="rounded-none"
              />
            </Field>
            <Field label="Email">
              <Input
                type="email"
                value={form.email}
                onChange={(event) => patch("email", event.target.value)}
                className="rounded-none"
              />
            </Field>
          </div>
          <Field label="Biography">
            <Textarea
              value={form.biography}
              onChange={(event) => patch("biography", event.target.value)}
              className="min-h-32 rounded-none"
            />
          </Field>
          <Field label="Profile image URL">
            <Input
              value={form.profileImageUrl}
              onChange={(event) => patch("profileImageUrl", event.target.value)}
              className="rounded-none"
            />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="LinkedIn URL">
              <Input
                value={form.linkedin}
                onChange={(event) => patch("linkedin", event.target.value)}
                className="rounded-none"
              />
            </Field>
            <Field label="X profile URL">
              <Input
                value={form.twitter}
                onChange={(event) => patch("twitter", event.target.value)}
                className="rounded-none"
              />
            </Field>
          </div>
          <Field label="SEO description">
            <Textarea
              value={form.seoDescription}
              onChange={(event) => patch("seoDescription", event.target.value)}
              maxLength={200}
              className="rounded-none"
            />
          </Field>
          <div className="flex items-center justify-between border border-[#dfe5e2] p-3">
            <Label className="text-xs">Active author profile</Label>
            <Switch checked={form.isActive} onCheckedChange={(value) => patch("isActive", value)} />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" className="bg-[#0e5949]">
              Save author
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
function uuidOrUndefined(value?: string) {
  return value && /^[0-9a-f-]{36}$/i.test(value) ? value : undefined;
}
