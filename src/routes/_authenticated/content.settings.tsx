import { useMemo, useState, type ReactNode } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import {
  Check,
  CircleHelp,
  Globe2,
  KeyRound,
  LockKeyhole,
  MessageSquare,
  Save,
  SearchCheck,
  Send,
  Settings2,
  ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { useContentWorkspace } from "@/components/content/ContentWorkspaceContext";
import { ContentPageHeader, ContentPanel } from "@/components/content/ContentUi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { saveContentSetting } from "@/lib/content.functions";

const searchSchema = z.object({
  tab: z.enum(["general", "seo", "social", "comments", "permissions"]).optional(),
});

export const Route = createFileRoute("/_authenticated/content/settings")({
  validateSearch: (search) => searchSchema.parse(search),
  component: ContentSettings,
});

function ContentSettings() {
  const { tab } = Route.useSearch();
  const { settings, refresh } = useContentWorkspace();
  const saveSetting = useServerFn(saveContentSetting);
  const defaults = useMemo(() => settingDefaults(settings), [settings]);
  const [general, setGeneral] = useState(defaults.general);
  const [seo, setSeo] = useState(defaults.seo);
  const [social, setSocial] = useState(defaults.social);
  const [comments, setComments] = useState(defaults.comments);
  const [saving, setSaving] = useState<string | null>(null);

  async function save(key: string, value: Record<string, string | boolean>) {
    setSaving(key);
    try {
      await saveSetting({ data: { key, value } });
      toast.success("Content settings saved.");
      await refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Settings could not be saved.");
    } finally {
      setSaving(null);
    }
  }

  return (
    <div className="space-y-6">
      <ContentPageHeader
        eyebrow="Publishing configuration"
        title="Blog settings"
        description="Control public identity, search behaviour, social delivery, moderation and editorial permissions from one place."
      />
      <Tabs defaultValue={tab ?? "general"}>
        <TabsList className="flex h-auto flex-wrap justify-start rounded-none border border-[#dce4e0] bg-white p-1">
          <Tab value="general" icon={Settings2} label="General" />
          <Tab value="seo" icon={SearchCheck} label="SEO" />
          <Tab value="social" icon={Send} label="Social" />
          <Tab value="comments" icon={MessageSquare} label="Comments" />
          <Tab value="permissions" icon={ShieldCheck} label="Permissions" />
        </TabsList>
        <TabsContent value="general" className="mt-5">
          <SettingsGrid
            aside={
              <Aside
                icon={Globe2}
                title="Publication identity"
                text="These values appear across the Journal, archive metadata and newsletter forms."
              />
            }
          >
            <ContentPanel title="General settings">
              <form
                className="space-y-5 p-5"
                onSubmit={(event) => {
                  event.preventDefault();
                  void save("blog_identity", general);
                }}
              >
                <Field label="Publication name" hint="Public name shown above Journal content">
                  <Input
                    value={general.publication_name}
                    onChange={(event) =>
                      setGeneral({ ...general, publication_name: event.target.value })
                    }
                    className="rounded-none"
                  />
                </Field>
                <Field label="Tagline" hint="A clear promise to readers">
                  <Input
                    value={general.tagline}
                    onChange={(event) => setGeneral({ ...general, tagline: event.target.value })}
                    className="rounded-none"
                  />
                </Field>
                <Field label="Editorial contact email">
                  <Input
                    type="email"
                    value={general.editorial_email}
                    onChange={(event) =>
                      setGeneral({ ...general, editorial_email: event.target.value })
                    }
                    className="rounded-none"
                  />
                </Field>
                <Field label="Default newsletter source">
                  <Input
                    value={general.campaign_source}
                    onChange={(event) =>
                      setGeneral({ ...general, campaign_source: event.target.value })
                    }
                    className="rounded-none"
                  />
                </Field>
                <ToggleRow
                  label="Show Blog in public navigation"
                  description="Readers can reach the Journal from the main website header and footer."
                  checked={general.public_navigation}
                  setChecked={(value) => setGeneral({ ...general, public_navigation: value })}
                />
                <SaveButton loading={saving === "blog_identity"} />
              </form>
            </ContentPanel>
          </SettingsGrid>
        </TabsContent>
        <TabsContent value="seo" className="mt-5">
          <SettingsGrid
            aside={
              <Aside
                icon={SearchCheck}
                title="Search foundations"
                text="Article-level metadata is managed in the editor. These values set platform-wide defaults."
              />
            }
          >
            <ContentPanel title="SEO and discovery">
              <form
                className="space-y-5 p-5"
                onSubmit={(event) => {
                  event.preventDefault();
                  void save("seo", seo);
                }}
              >
                <Field label="Title template" hint="Use %s for the article or archive title">
                  <Input
                    value={seo.title_template}
                    onChange={(event) => setSeo({ ...seo, title_template: event.target.value })}
                    className="rounded-none"
                  />
                </Field>
                <Field label="Default meta description">
                  <Textarea
                    value={seo.default_description}
                    onChange={(event) =>
                      setSeo({ ...seo, default_description: event.target.value })
                    }
                    maxLength={200}
                    className="rounded-none"
                  />
                </Field>
                <Field label="Public site URL">
                  <Input
                    value={seo.site_url}
                    onChange={(event) => setSeo({ ...seo, site_url: event.target.value })}
                    className="rounded-none"
                  />
                </Field>
                <ToggleRow
                  label="Generate structured data"
                  description="Article, video, breadcrumb, organization and person schemas."
                  checked={seo.include_schema}
                  setChecked={(value) => setSeo({ ...seo, include_schema: value })}
                />
                <ToggleRow
                  label="Include content sitemap"
                  description="Published articles, categories and author pages are written to /sitemap.xml."
                  checked={seo.include_sitemap}
                  setChecked={(value) => setSeo({ ...seo, include_sitemap: value })}
                />
                <ToggleRow
                  label="Index author archives"
                  description="Allow credible author profiles to appear in search."
                  checked={seo.index_authors}
                  setChecked={(value) => setSeo({ ...seo, index_authors: value })}
                />
                <SaveButton loading={saving === "seo"} />
              </form>
            </ContentPanel>
          </SettingsGrid>
        </TabsContent>
        <TabsContent value="social" className="mt-5">
          <SettingsGrid
            aside={
              <Aside
                icon={KeyRound}
                title="Secure channel delivery"
                text="Secrets belong in server environment variables. The content database stores only connection state, workflow and publication records."
              />
            }
          >
            <div className="space-y-5">
              <ContentPanel title="Publishing workflow">
                <form
                  className="space-y-5 p-5"
                  onSubmit={(event) => {
                    event.preventDefault();
                    void save("social", social);
                  }}
                >
                  <ToggleRow
                    label="Require approval before social publishing"
                    description="Social managers can prepare variations; an approved item enters the delivery queue."
                    checked={social.approval_required}
                    setChecked={(value) => setSocial({ ...social, approval_required: value })}
                  />
                  <ToggleRow
                    label="Enable automatic delivery worker"
                    description="Process approved scheduled records when server-side API credentials are available."
                    checked={social.auto_publish}
                    setChecked={(value) => setSocial({ ...social, auto_publish: value })}
                  />
                  <Field label="Default campaign source">
                    <Input
                      value={social.campaign_source}
                      onChange={(event) =>
                        setSocial({ ...social, campaign_source: event.target.value })
                      }
                      className="rounded-none"
                    />
                  </Field>
                  <SaveButton loading={saving === "social"} />
                </form>
              </ContentPanel>
              <ContentPanel
                title="Channel credentials"
                description="Production environment variables detected by the delivery worker"
              >
                <div className="divide-y divide-[#e8ecea]">
                  <Credential
                    label="Meta: Facebook and Instagram"
                    variables="META_APP_ID, META_APP_SECRET, META_PAGE_ACCESS_TOKEN"
                  />
                  <Credential
                    label="LinkedIn"
                    variables="LINKEDIN_CLIENT_ID, LINKEDIN_CLIENT_SECRET, LINKEDIN_ORGANIZATION_ID"
                  />
                  <Credential label="X" variables="X_CLIENT_ID, X_CLIENT_SECRET, X_ACCESS_TOKEN" />
                  <Credential
                    label="WhatsApp Business"
                    variables="WHATSAPP_PHONE_NUMBER_ID, WHATSAPP_ACCESS_TOKEN"
                  />
                </div>
              </ContentPanel>
            </div>
          </SettingsGrid>
        </TabsContent>
        <TabsContent value="comments" className="mt-5">
          <SettingsGrid
            aside={
              <Aside
                icon={MessageSquare}
                title="Reader participation"
                text="Comments are optional and remain off by default for investment content."
              />
            }
          >
            <ContentPanel title="Comment moderation">
              <form
                className="space-y-5 p-5"
                onSubmit={(event) => {
                  event.preventDefault();
                  void save("comments", comments);
                }}
              >
                <ToggleRow
                  label="Allow comments globally"
                  description="Individual articles must also opt in before the form is visible."
                  checked={comments.enabled}
                  setChecked={(value) => setComments({ ...comments, enabled: value })}
                />
                <ToggleRow
                  label="Require moderation"
                  description="New comments remain pending until a content manager approves them."
                  checked={comments.moderation_required}
                  setChecked={(value) => setComments({ ...comments, moderation_required: value })}
                />
                <ToggleRow
                  label="Collect commenter email"
                  description="Email supports moderation and is never displayed publicly."
                  checked={comments.collect_email}
                  setChecked={(value) => setComments({ ...comments, collect_email: value })}
                />
                <Field label="Moderation notice">
                  <Textarea
                    value={comments.notice}
                    onChange={(event) => setComments({ ...comments, notice: event.target.value })}
                    className="rounded-none"
                  />
                </Field>
                <SaveButton loading={saving === "comments"} />
              </form>
            </ContentPanel>
          </SettingsGrid>
        </TabsContent>
        <TabsContent value="permissions" className="mt-5">
          <ContentPanel
            title="Role permissions"
            description="Database policies and workflow triggers enforce these boundaries"
          >
            <div className="overflow-x-auto">
              <table className="w-full min-w-[920px] text-left">
                <thead className="border-b border-[#e7ebe9] bg-[#fafbf9] text-[9px] font-bold uppercase tracking-[0.12em] text-[#87918d]">
                  <tr>
                    <th className="px-5 py-3">Role</th>
                    <th className="px-4 py-3">Create and edit</th>
                    <th className="px-4 py-3">Publish</th>
                    <th className="px-4 py-3">SEO</th>
                    <th className="px-4 py-3">Social</th>
                    <th className="px-4 py-3">Team and settings</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#edf0ee]">
                  {permissionRows.map((row) => (
                    <tr key={row.role}>
                      <td className="px-5 py-4">
                        <p className="text-xs font-semibold text-[#315047]">{row.role}</p>
                        <p className="mt-1 text-[10px] text-[#84908a]">{row.detail}</p>
                      </td>
                      {row.access.map((allowed, index) => (
                        <td key={index} className="px-4 py-4">
                          {allowed ? (
                            <Check className="h-4 w-4 text-emerald-600" />
                          ) : (
                            <span className="text-[#b4bcb8]">—</span>
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex gap-3 border-t border-[#e5ebe8] bg-[#fafbf9] p-4">
              <LockKeyhole className="mt-0.5 h-4 w-4 text-[#9b7028]" />
              <p className="text-[10px] leading-5 text-[#6d7b74]">
                Content roles are assigned in the main Admin User Roles workspace. Custom HTML
                publishing and permission management remain restricted to platform administrators.
              </p>
            </div>
          </ContentPanel>
        </TabsContent>
      </Tabs>
    </div>
  );
}

const permissionRows = [
  {
    role: "Content Author",
    detail: "Drafts and assigned stories",
    access: [true, false, false, false, false],
  },
  {
    role: "Content Editor",
    detail: "Editorial review and publishing",
    access: [true, true, true, false, false],
  },
  {
    role: "Content Manager",
    detail: "Full editorial operations",
    access: [true, true, true, true, true],
  },
  {
    role: "SEO Manager",
    detail: "Search metadata and reporting",
    access: [false, false, true, false, false],
  },
  {
    role: "Social Media Manager",
    detail: "Captions and distribution queue",
    access: [false, false, false, true, false],
  },
  {
    role: "Admin / Super Admin",
    detail: "Platform governance",
    access: [true, true, true, true, true],
  },
];

function settingDefaults(settings: ReturnType<typeof useContentWorkspace>["settings"]) {
  const value = (key: string) => settings.find((item) => item.key === key)?.value ?? {};
  const identity = value("blog_identity");
  const seo = value("seo");
  const social = value("social");
  const comments = value("comments");
  return {
    general: {
      publication_name: String(identity.publication_name ?? "Kay-Steph Journal"),
      tagline: String(identity.tagline ?? "Property intelligence for confident decisions"),
      editorial_email: String(identity.editorial_email ?? "editorial@kaystephgroup.com"),
      campaign_source: String(identity.campaign_source ?? "kaysteph_journal"),
      public_navigation: Boolean(identity.public_navigation ?? true),
    },
    seo: {
      title_template: String(seo.title_template ?? "%s | Kay-Steph Journal"),
      default_description: String(
        seo.default_description ??
          "Verified property guidance, market intelligence and investment education from Kay-Steph Group.",
      ),
      site_url: String(seo.site_url ?? "https://kaystephgroup.com"),
      include_schema: Boolean(seo.include_schema ?? true),
      include_sitemap: Boolean(seo.include_sitemap ?? true),
      index_authors: Boolean(seo.index_authors ?? true),
    },
    social: {
      approval_required: Boolean(social.approval_required ?? true),
      auto_publish: Boolean(social.auto_publish ?? false),
      campaign_source: String(social.campaign_source ?? "kaysteph_social"),
    },
    comments: {
      enabled: Boolean(comments.enabled ?? false),
      moderation_required: Boolean(comments.moderation_required ?? true),
      collect_email: Boolean(comments.collect_email ?? true),
      notice: String(
        comments.notice ??
          "Comments are reviewed before publication. Do not share personal financial or identity information.",
      ),
    },
  };
}

function SettingsGrid({ aside, children }: { aside: ReactNode; children: ReactNode }) {
  return (
    <div className="grid gap-5 xl:grid-cols-[280px_minmax(0,780px)]">
      {aside}
      {children}
    </div>
  );
}
function Aside({
  icon: Icon,
  title,
  text,
}: {
  icon: typeof Settings2;
  title: string;
  text: string;
}) {
  return (
    <aside className="border border-[#dce4e0] bg-[#f9faf9] p-5">
      <span className="flex h-10 w-10 items-center justify-center bg-[#eaf2ee] text-[#31675a]">
        <Icon className="h-5 w-5" />
      </span>
      <h2 className="mt-5 font-serif text-xl font-semibold text-[#21483e]">{title}</h2>
      <p className="mt-2 text-xs leading-5 text-[#718079]">{text}</p>
      <div className="mt-5 flex gap-2 border-t border-[#e1e7e4] pt-4 text-[10px] leading-4 text-[#7c8983]">
        <CircleHelp className="h-3.5 w-3.5 shrink-0" />
        Changes are recorded in the content audit log.
      </div>
    </aside>
  );
}
function Tab({
  value,
  icon: Icon,
  label,
}: {
  value: string;
  icon: typeof Settings2;
  label: string;
}) {
  return (
    <TabsTrigger value={value} className="h-9 rounded-none px-4 text-xs">
      <Icon className="mr-2 h-3.5 w-3.5" />
      {label}
    </TabsTrigger>
  );
}
function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <label>
      <span className="block text-xs font-semibold text-[#405b53]">{label}</span>
      {hint && <span className="mb-2 mt-0.5 block text-[10px] text-[#87928d]">{hint}</span>}
      {!hint && <span className="mb-2 block" />}
      {children}
    </label>
  );
}
function ToggleRow({
  label,
  description,
  checked,
  setChecked,
}: {
  label: string;
  description: string;
  checked: boolean;
  setChecked: (value: boolean) => void;
}) {
  return (
    <div className="flex items-start justify-between gap-5 border border-[#e0e6e3] p-4">
      <div>
        <Label className="text-xs font-semibold text-[#405b53]">{label}</Label>
        <p className="mt-1 text-[10px] leading-4 text-[#818d87]">{description}</p>
      </div>
      <Switch checked={checked} onCheckedChange={setChecked} />
    </div>
  );
}
function SaveButton({ loading }: { loading: boolean }) {
  return (
    <Button
      type="submit"
      className="rounded-none bg-[#0e5949] hover:bg-[#09483b]"
      disabled={loading}
    >
      <Save className="mr-2 h-4 w-4" />
      {loading ? "Saving..." : "Save settings"}
    </Button>
  );
}
function Credential({ label, variables }: { label: string; variables: string }) {
  return (
    <div className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center">
      <span className="flex h-9 w-9 items-center justify-center bg-[#f1f4f2] text-[#5a6c64]">
        <KeyRound className="h-4 w-4" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-semibold text-[#38554d]">{label}</p>
        <p className="mt-1 break-words font-mono text-[9px] text-[#87928d]">{variables}</p>
      </div>
      <span className="inline-flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-wider text-amber-700">
        <span className="h-2 w-2 rounded-full bg-amber-400" />
        Not detected
      </span>
    </div>
  );
}
