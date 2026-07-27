import estatePlotsImage from "@/assets/estate-plots.jpg";
import guzapeImage from "@/assets/guzape-dream-homes.jpg";
import heroImage from "@/assets/hero.jpg";
import lillycrestResidenceImage from "@/assets/lillycrest-residence.jpg";
import lillycrestTerraceImage from "@/assets/lillycrest-terrace.jpg";
import rubysApartmentImage from "@/assets/rubys-apartment.jpg";

export type ContentPostStatus =
  | "draft"
  | "pending_review"
  | "scheduled"
  | "published"
  | "unpublished"
  | "archived"
  | "trashed";

export type ContentPostFormat =
  | "standard"
  | "image_led"
  | "video"
  | "embedded_video"
  | "market_report"
  | "property_guide"
  | "investment_guide"
  | "company_announcement"
  | "event_recap"
  | "interview"
  | "press_release";

export type ContentBlockType =
  | "heading"
  | "paragraph"
  | "quote"
  | "list"
  | "table"
  | "button"
  | "image"
  | "gallery"
  | "video"
  | "callout"
  | "divider"
  | "columns"
  | "download"
  | "property_card"
  | "investment_card"
  | "related_posts"
  | "newsletter"
  | "cta"
  | "custom_html";

export type ContentJsonValue =
  | string
  | number
  | boolean
  | null
  | ContentJsonValue[]
  | { [key: string]: ContentJsonValue };

export type ContentBlock = {
  id: string;
  type: ContentBlockType;
  data: Record<string, ContentJsonValue>;
};

export type ContentAuthor = {
  id: string;
  fullName: string;
  slug: string;
  jobTitle: string;
  biography: string;
  email: string;
  profileImageUrl?: string | null;
  socialLinks: Record<string, string>;
  seoDescription: string;
  postCount?: number;
};

export type ContentCategory = {
  id: string;
  name: string;
  slug: string;
  description: string;
  featuredImageUrl?: string | null;
  seoTitle: string;
  seoDescription: string;
  isActive: boolean;
  postCount?: number;
};

export type ContentTag = {
  id: string;
  name: string;
  slug: string;
  description?: string;
  postCount?: number;
};

export type RelatedEditorialItem = {
  name: string;
  eyebrow: string;
  detail: string;
  url: string;
  imageUrl: string;
};

export type ContentPost = {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  contentBlocks: ContentBlock[];
  featuredImageUrl: string;
  featuredVideoUrl?: string | null;
  posterImageUrl?: string | null;
  videoCaption?: string | null;
  videoTranscript?: string | null;
  format: ContentPostFormat;
  status: ContentPostStatus;
  author: ContentAuthor;
  primaryCategory: ContentCategory;
  secondaryCategories: ContentCategory[];
  tags: ContentTag[];
  publishedAt?: string | null;
  scheduledAt?: string | null;
  updatedAt: string;
  readingTimeMinutes: number;
  isFeatured: boolean;
  isPopular: boolean;
  commentsEnabled: boolean;
  relatedProperty?: RelatedEditorialItem | null;
  relatedInvestment?: RelatedEditorialItem | null;
  ctaLabel?: string | null;
  ctaUrl?: string | null;
  seoTitle: string;
  metaDescription: string;
  focusKeyword: string;
  secondaryKeywords: string[];
  canonicalUrl: string;
  ogTitle: string;
  ogDescription: string;
  ogImageUrl: string;
  twitterTitle: string;
  twitterDescription: string;
  twitterImageUrl: string;
  robotsIndex: boolean;
  robotsFollow: boolean;
  includeInSitemap: boolean;
  facebookCaption: string;
  instagramCaption: string;
  linkedinCaption: string;
  twitterCaption: string;
  whatsappShareText: string;
  socialImageUrl: string;
  socialVideoUrl?: string | null;
  socialScheduledAt?: string | null;
  viewCount: number;
  uniqueVisitorCount: number;
  averageReadSeconds: number;
  videoPlayCount: number;
  socialShareCount: number;
  leadCount: number;
};

export type ContentMedia = {
  id: string;
  fileName: string;
  title: string;
  altText: string;
  caption: string;
  description: string;
  mimeType: string;
  fileType: "image" | "video" | "pdf" | "document";
  fileSizeBytes: number;
  width?: number;
  height?: number;
  durationSeconds?: number;
  publicUrl: string;
  visibility: "public" | "private";
  status: "active" | "archived" | "deleted";
  sourceType: "upload" | "youtube" | "vimeo" | "external";
  uploadDate: string;
  usageCount: number;
};

export const CONTENT_POST_STATUSES: Array<{
  key: ContentPostStatus;
  label: string;
  description: string;
}> = [
  { key: "draft", label: "Draft", description: "Work in progress" },
  { key: "pending_review", label: "Pending Review", description: "Waiting for editorial approval" },
  { key: "scheduled", label: "Scheduled", description: "Queued for automatic publishing" },
  { key: "published", label: "Published", description: "Visible on the public blog" },
  { key: "unpublished", label: "Unpublished", description: "Removed from public view" },
  { key: "archived", label: "Archived", description: "Retained outside the active library" },
  { key: "trashed", label: "Trashed", description: "Awaiting permanent deletion" },
];

export const CONTENT_POST_FORMATS: Array<{ key: ContentPostFormat; label: string }> = [
  { key: "standard", label: "Standard article" },
  { key: "image_led", label: "Image-led article" },
  { key: "video", label: "Video post" },
  { key: "embedded_video", label: "Embedded video post" },
  { key: "market_report", label: "Market report" },
  { key: "property_guide", label: "Property guide" },
  { key: "investment_guide", label: "Investment guide" },
  { key: "company_announcement", label: "Company announcement" },
  { key: "event_recap", label: "Event recap" },
  { key: "interview", label: "Interview" },
  { key: "press_release", label: "Press release" },
];

export const CONTENT_BLOCK_TYPES: Array<{
  key: ContentBlockType;
  label: string;
  group: "Text" | "Media" | "Conversion" | "Layout";
}> = [
  { key: "heading", label: "Heading", group: "Text" },
  { key: "paragraph", label: "Paragraph", group: "Text" },
  { key: "quote", label: "Quote", group: "Text" },
  { key: "list", label: "List", group: "Text" },
  { key: "table", label: "Table", group: "Text" },
  { key: "image", label: "Image", group: "Media" },
  { key: "gallery", label: "Gallery", group: "Media" },
  { key: "video", label: "Video", group: "Media" },
  { key: "download", label: "Download", group: "Media" },
  { key: "button", label: "Button", group: "Conversion" },
  { key: "callout", label: "Callout", group: "Conversion" },
  { key: "property_card", label: "Property card", group: "Conversion" },
  { key: "investment_card", label: "Investment card", group: "Conversion" },
  { key: "related_posts", label: "Related posts", group: "Conversion" },
  { key: "newsletter", label: "Newsletter form", group: "Conversion" },
  { key: "cta", label: "Call to action", group: "Conversion" },
  { key: "divider", label: "Divider", group: "Layout" },
  { key: "columns", label: "Columns", group: "Layout" },
  { key: "custom_html", label: "Custom HTML", group: "Layout" },
];

export const NEWSLETTER_INTERESTS = [
  "Property opportunities",
  "Market reports",
  "Group Buy",
  "Tokenized properties",
  "Abuja property updates",
  "Diaspora investment",
  "Events and workshops",
] as const;

export const CONTENT_ROLE_LABELS: Record<string, string> = {
  super_admin: "Super Admin",
  admin: "Admin",
  content_manager: "Content Manager",
  content_editor: "Editor",
  content_author: "Author",
  seo_manager: "SEO Manager",
  social_media_manager: "Social Media Manager",
};

export function contentStatusLabel(status: ContentPostStatus) {
  return CONTENT_POST_STATUSES.find((item) => item.key === status)?.label ?? status;
}

export function contentFormatLabel(format: ContentPostFormat) {
  return CONTENT_POST_FORMATS.find((item) => item.key === format)?.label ?? format;
}

export function contentStatusClass(status: ContentPostStatus) {
  const classes: Record<ContentPostStatus, string> = {
    draft: "border-slate-200 bg-slate-50 text-slate-600",
    pending_review: "border-amber-200 bg-amber-50 text-amber-700",
    scheduled: "border-blue-200 bg-blue-50 text-blue-700",
    published: "border-emerald-200 bg-emerald-50 text-emerald-700",
    unpublished: "border-orange-200 bg-orange-50 text-orange-700",
    archived: "border-zinc-200 bg-zinc-100 text-zinc-600",
    trashed: "border-rose-200 bg-rose-50 text-rose-700",
  };
  return classes[status];
}

export function formatContentDate(value?: string | null, withTime = false) {
  if (!value) return "Not set";
  return new Intl.DateTimeFormat("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
    ...(withTime ? { hour: "2-digit", minute: "2-digit" } : {}),
  }).format(new Date(value));
}

export function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function slugifyContent(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 100);
}

export function estimateReadingTime(blocks: ContentBlock[]) {
  const words = blocks.reduce((count, block) => {
    const text = Object.values(block.data)
      .flatMap((value) => (Array.isArray(value) ? value.flat(2) : [value]))
      .filter((value): value is string => typeof value === "string")
      .join(" ");
    return count + text.trim().split(/\s+/).filter(Boolean).length;
  }, 0);
  return Math.max(1, Math.ceil(words / 220));
}

export function seoScore(
  post: Pick<
    ContentPost,
    | "title"
    | "seoTitle"
    | "metaDescription"
    | "focusKeyword"
    | "excerpt"
    | "featuredImageUrl"
    | "contentBlocks"
  >,
) {
  let score = 0;
  if (post.title.length >= 35 && post.title.length <= 70) score += 15;
  if (post.seoTitle.length >= 35 && post.seoTitle.length <= 60) score += 15;
  if (post.metaDescription.length >= 120 && post.metaDescription.length <= 160) score += 20;
  if (
    post.focusKeyword &&
    `${post.title} ${post.excerpt}`.toLowerCase().includes(post.focusKeyword.toLowerCase())
  )
    score += 20;
  if (post.featuredImageUrl) score += 10;
  if (post.contentBlocks.some((block) => block.type === "heading")) score += 10;
  if (post.contentBlocks.some((block) => ["cta", "button", "newsletter"].includes(block.type)))
    score += 10;
  return score;
}
