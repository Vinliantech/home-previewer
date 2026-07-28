import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useClientFn } from "@/lib/client-function";
import { Edit3, ExternalLink, FolderTree, Plus, Search, Tags } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { useContentWorkspace } from "@/components/content/ContentWorkspaceContext";
import { ContentPageHeader, ContentPanel } from "@/components/content/ContentUi";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { saveContentCategory, saveContentTag } from "@/lib/content.functions";
import { slugifyContent, type ContentCategory, type ContentTag } from "@/lib/content";

const searchSchema = z.object({ tab: z.enum(["categories", "tags"]).optional() });

export const Route = createFileRoute("/_authenticated/content/taxonomy")({
  validateSearch: (search) => searchSchema.parse(search),
  component: ContentTaxonomy,
});

function ContentTaxonomy() {
  const { tab } = Route.useSearch();
  const { categories, tags, posts, refresh } = useContentWorkspace();
  const [categoryEditor, setCategoryEditor] = useState<ContentCategory | "new" | null>(null);
  const [tagEditor, setTagEditor] = useState<ContentTag | "new" | null>(null);
  const [categorySearch, setCategorySearch] = useState("");
  const [tagSearch, setTagSearch] = useState("");
  const visibleCategories = useMemo(
    () =>
      categories.filter((item) => item.name.toLowerCase().includes(categorySearch.toLowerCase())),
    [categories, categorySearch],
  );
  const visibleTags = useMemo(
    () => tags.filter((item) => item.name.toLowerCase().includes(tagSearch.toLowerCase())),
    [tags, tagSearch],
  );

  return (
    <div className="space-y-6">
      <ContentPageHeader
        eyebrow="Editorial taxonomy"
        title="Categories and tags"
        description="Shape clear discovery paths for readers while maintaining clean, indexable archive pages."
      />
      <Tabs defaultValue={tab ?? "categories"}>
        <TabsList className="h-11 rounded-none border border-[#dce4e0] bg-white p-1">
          <TabsTrigger value="categories" className="rounded-none px-5 text-xs">
            <FolderTree className="mr-2 h-4 w-4" />
            Categories
          </TabsTrigger>
          <TabsTrigger value="tags" className="rounded-none px-5 text-xs">
            <Tags className="mr-2 h-4 w-4" />
            Tags
          </TabsTrigger>
        </TabsList>
        <TabsContent value="categories" className="mt-5">
          <ContentPanel
            title="Categories"
            description="Primary editorial sections with public archive and SEO metadata"
            action={
              <Button
                size="sm"
                className="rounded-none bg-[#0e5949]"
                onClick={() => setCategoryEditor("new")}
              >
                <Plus className="mr-2 h-3.5 w-3.5" />
                New category
              </Button>
            }
          >
            <SearchBar
              value={categorySearch}
              setValue={setCategorySearch}
              placeholder="Search categories"
            />
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-left">
                <thead className="border-y border-[#e7ebe9] bg-[#fafbf9] text-[9px] font-bold uppercase tracking-[0.13em] text-[#87918d]">
                  <tr>
                    <th className="px-5 py-3">Category</th>
                    <th className="px-4 py-3">Slug</th>
                    <th className="px-4 py-3">Posts</th>
                    <th className="px-4 py-3">SEO</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="w-28 px-4 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#edf0ee]">
                  {visibleCategories.map((category) => {
                    const count = posts.filter(
                      (post) =>
                        post.primaryCategory.id === category.id ||
                        post.secondaryCategories.some((item) => item.id === category.id),
                    ).length;
                    return (
                      <tr key={category.id}>
                        <td className="px-5 py-4">
                          <p className="text-sm font-semibold text-[#294b42]">{category.name}</p>
                          <p className="mt-1 max-w-lg text-[11px] leading-5 text-[#7f8b85]">
                            {category.description}
                          </p>
                        </td>
                        <td className="px-4 py-4 font-mono text-[10px] text-[#738079]">
                          {category.slug}
                        </td>
                        <td className="px-4 py-4 font-serif text-lg text-[#244b40]">{count}</td>
                        <td className="px-4 py-4">
                          <span
                            className={`text-[10px] font-semibold ${category.seoTitle && category.seoDescription ? "text-emerald-700" : "text-amber-700"}`}
                          >
                            {category.seoTitle && category.seoDescription
                              ? "Complete"
                              : "Needs review"}
                          </span>
                        </td>
                        <td className="px-4 py-4">
                          <span
                            className={`rounded-sm px-2 py-1 text-[9px] font-bold uppercase ${category.isActive ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}
                          >
                            {category.isActive ? "Active" : "Hidden"}
                          </span>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setCategoryEditor(category)}
                              aria-label={`Edit ${category.name}`}
                            >
                              <Edit3 className="h-4 w-4" />
                            </Button>
                            <Button asChild variant="ghost" size="icon">
                              <Link
                                to="/blog/category/$slug"
                                params={{ slug: category.slug }}
                                target="_blank"
                                aria-label={`View ${category.name} archive`}
                              >
                                <ExternalLink className="h-4 w-4" />
                              </Link>
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </ContentPanel>
        </TabsContent>
        <TabsContent value="tags" className="mt-5">
          <ContentPanel
            title="Tags"
            description="Cross-category topics used for filtering, related content and campaigns"
            action={
              <Button
                size="sm"
                className="rounded-none bg-[#0e5949]"
                onClick={() => setTagEditor("new")}
              >
                <Plus className="mr-2 h-3.5 w-3.5" />
                New tag
              </Button>
            }
          >
            <SearchBar value={tagSearch} setValue={setTagSearch} placeholder="Search tags" />
            <div className="grid gap-px bg-[#e5ebe8] sm:grid-cols-2 xl:grid-cols-3">
              {visibleTags.map((tag) => {
                const count = posts.filter((post) =>
                  post.tags.some((item) => item.id === tag.id),
                ).length;
                return (
                  <div key={tag.id} className="flex items-center gap-3 bg-white p-4">
                    <span className="flex h-9 w-9 items-center justify-center bg-[#eef4f1] text-[#36665a]">
                      <Tags className="h-4 w-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-[#2c4d44]">{tag.name}</p>
                      <p className="mt-1 truncate font-mono text-[9px] text-[#8b9691]">
                        /{tag.slug}
                      </p>
                    </div>
                    <span className="text-[10px] text-[#7b8781]">{count} posts</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setTagEditor(tag)}
                      aria-label={`Edit ${tag.name}`}
                    >
                      <Edit3 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                );
              })}
            </div>
          </ContentPanel>
        </TabsContent>
      </Tabs>
      <CategoryDialog
        key={categoryEditor === "new" ? "new" : (categoryEditor?.id ?? "closed")}
        value={categoryEditor}
        onClose={() => setCategoryEditor(null)}
        onSaved={refresh}
      />
      <TagDialog
        key={tagEditor === "new" ? "new" : (tagEditor?.id ?? "closed")}
        value={tagEditor}
        onClose={() => setTagEditor(null)}
        onSaved={refresh}
      />
    </div>
  );
}

function SearchBar({
  value,
  setValue,
  placeholder,
}: {
  value: string;
  setValue: (value: string) => void;
  placeholder: string;
}) {
  return (
    <div className="relative max-w-md p-4">
      <Search className="absolute left-7 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8b9691]" />
      <Input
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder={placeholder}
        className="rounded-none border-[#dce4e0] pl-9"
      />
    </div>
  );
}

function CategoryDialog({
  value,
  onClose,
  onSaved,
}: {
  value: ContentCategory | "new" | null;
  onClose: () => void;
  onSaved: () => Promise<void>;
}) {
  const save = useClientFn(saveContentCategory);
  const original = value && value !== "new" ? value : null;
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [image, setImage] = useState("");
  const [seoTitle, setSeoTitle] = useState("");
  const [seoDescription, setSeoDescription] = useState("");
  const [active, setActive] = useState(original?.isActive ?? true);
  const key = original?.id ?? String(value);
  return (
    <Dialog open={Boolean(value)} onOpenChange={(open) => !open && onClose()} key={key}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="font-serif text-2xl text-[#21483e]">
            {original ? "Edit category" : "Create category"}
          </DialogTitle>
          <DialogDescription>
            Category details also power the public archive, sitemap and search metadata.
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
                  name: name || original?.name || "",
                  slug: slug || original?.slug || slugifyContent(name),
                  description: description || original?.description,
                  featuredImageUrl: image || original?.featuredImageUrl || undefined,
                  seoTitle: seoTitle || original?.seoTitle,
                  seoDescription: seoDescription || original?.seoDescription,
                  isActive: original ? active : true,
                },
              });
              toast.success("Category saved.");
              await onSaved();
              onClose();
            } catch (error) {
              toast.error(error instanceof Error ? error.message : "Category could not be saved.");
            }
          }}
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Name">
              <Input
                defaultValue={original?.name}
                onChange={(event) => {
                  setName(event.target.value);
                  if (!original) setSlug(slugifyContent(event.target.value));
                }}
                required
                className="rounded-none"
              />
            </FormField>
            <FormField label="Slug">
              <Input
                defaultValue={original?.slug}
                value={slug || undefined}
                onChange={(event) => setSlug(slugifyContent(event.target.value))}
                required
                className="rounded-none"
              />
            </FormField>
          </div>
          <FormField label="Description">
            <Textarea
              defaultValue={original?.description}
              onChange={(event) => setDescription(event.target.value)}
              className="min-h-24 rounded-none"
            />
          </FormField>
          <FormField label="Featured image URL">
            <Input
              defaultValue={original?.featuredImageUrl ?? ""}
              onChange={(event) => setImage(event.target.value)}
              className="rounded-none"
            />
          </FormField>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="SEO title">
              <Input
                defaultValue={original?.seoTitle}
                onChange={(event) => setSeoTitle(event.target.value)}
                className="rounded-none"
              />
            </FormField>
            <FormField label="SEO description">
              <Textarea
                defaultValue={original?.seoDescription}
                onChange={(event) => setSeoDescription(event.target.value)}
                className="rounded-none"
              />
            </FormField>
          </div>
          <div className="flex items-center justify-between border border-[#e1e7e4] p-3">
            <Label className="text-xs">Visible on the public Journal</Label>
            <Switch defaultChecked={original?.isActive ?? true} onCheckedChange={setActive} />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" className="bg-[#0e5949]">
              Save category
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function TagDialog({
  value,
  onClose,
  onSaved,
}: {
  value: ContentTag | "new" | null;
  onClose: () => void;
  onSaved: () => Promise<void>;
}) {
  const save = useClientFn(saveContentTag);
  const original = value && value !== "new" ? value : null;
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  return (
    <Dialog
      open={Boolean(value)}
      onOpenChange={(open) => !open && onClose()}
      key={original?.id ?? String(value)}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="font-serif text-2xl text-[#21483e]">
            {original ? "Edit tag" : "Create tag"}
          </DialogTitle>
          <DialogDescription>
            Use concise topics that can connect useful stories across categories.
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
                  name: name || original?.name || "",
                  slug: slug || original?.slug || slugifyContent(name),
                  description: description || original?.description,
                },
              });
              toast.success("Tag saved.");
              await onSaved();
              onClose();
            } catch (error) {
              toast.error(error instanceof Error ? error.message : "Tag could not be saved.");
            }
          }}
        >
          <FormField label="Name">
            <Input
              defaultValue={original?.name}
              onChange={(event) => {
                setName(event.target.value);
                if (!original) setSlug(slugifyContent(event.target.value));
              }}
              required
              className="rounded-none"
            />
          </FormField>
          <FormField label="Slug">
            <Input
              defaultValue={original?.slug}
              value={slug || undefined}
              onChange={(event) => setSlug(slugifyContent(event.target.value))}
              required
              className="rounded-none"
            />
          </FormField>
          <FormField label="Description">
            <Textarea
              defaultValue={original?.description}
              onChange={(event) => setDescription(event.target.value)}
              className="rounded-none"
            />
          </FormField>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" className="bg-[#0e5949]">
              Save tag
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function FormField({ label, children }: { label: string; children: React.ReactNode }) {
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
