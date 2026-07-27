/* eslint-disable @typescript-eslint/no-explicit-any -- Normalizes untyped rows until generated Supabase types include the content schema. */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useServerFn } from "@tanstack/react-start";
import { getContentWorkspaceData } from "@/lib/content.functions";
import {
  type ContentAuthor,
  type ContentCategory,
  type ContentMedia,
  type ContentPost,
  type ContentTag,
} from "@/lib/content";

export type ContentCommentRecord = {
  id: string;
  postTitle: string;
  postSlug: string;
  authorName: string;
  authorEmail: string;
  body: string;
  status: "pending" | "approved" | "spam" | "trashed";
  createdAt: string;
};

export type NewsletterRecord = {
  id: string;
  fullName: string;
  email: string;
  interests: string[];
  source: string;
  status: "active" | "unsubscribed" | "bounced" | "pending";
  subscribedAt: string;
  leadId?: string | null;
};

export type SocialPublicationRecord = {
  id: string;
  postId: string;
  postTitle: string;
  postSlug: string;
  platform: "facebook" | "instagram" | "linkedin" | "twitter" | "whatsapp";
  caption: string;
  mediaUrl?: string | null;
  status: "draft" | "ready" | "scheduled" | "published" | "failed" | "cancelled";
  scheduledAt?: string | null;
};

type ContentWorkspaceValue = {
  live: boolean;
  loading: boolean;
  posts: ContentPost[];
  categories: ContentCategory[];
  tags: ContentTag[];
  authors: ContentAuthor[];
  media: ContentMedia[];
  comments: ContentCommentRecord[];
  subscribers: NewsletterRecord[];
  social: SocialPublicationRecord[];
  settings: Array<{ key: string; value: Record<string, unknown>; description?: string }>;
  refresh: () => Promise<void>;
};

const ContentWorkspaceContext = createContext<ContentWorkspaceValue | null>(null);

export function ContentWorkspaceProvider({ children }: { children: ReactNode }) {
  const getWorkspace = useServerFn(getContentWorkspaceData);
  const emptyValue = useMemo(() => emptyWorkspace(), []);
  const [data, setData] =
    useState<Omit<ContentWorkspaceValue, "loading" | "refresh">>(emptyValue);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getWorkspace();
      setData(normalizeWorkspace(result));
    } finally {
      setLoading(false);
    }
  }, [getWorkspace]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return (
    <ContentWorkspaceContext.Provider value={{ loading, ...data, refresh }}>
      {children}
    </ContentWorkspaceContext.Provider>
  );
}

export function useContentWorkspace() {
  const value = useContext(ContentWorkspaceContext);
  if (!value) throw new Error("useContentWorkspace must be used inside ContentWorkspaceProvider");
  return value;
}

function emptyWorkspace(): Omit<ContentWorkspaceValue, "loading" | "refresh"> {
  return {
    live: false,
    posts: [],
    categories: [],
    tags: [],
    authors: [],
    media: [],
    comments: [],
    subscribers: [],
    social: [],
    settings: [],
  };
}

function socialRecord(
  id: string,
  post: ContentPost,
  platform: SocialPublicationRecord["platform"],
  status: SocialPublicationRecord["status"],
  caption: string,
): SocialPublicationRecord {
  return {
    id,
    postId: post.id,
    postTitle: post.title,
    postSlug: post.slug,
    platform,
    caption,
    mediaUrl: post.socialImageUrl,
    status,
    scheduledAt: status === "scheduled" ? "2026-07-18T09:00:00.000Z" : null,
  };
}

function normalizeWorkspace(
  result: any,
): Omit<ContentWorkspaceValue, "loading" | "refresh"> {
  return {
    live: Boolean(result.live),
    posts: result.posts ?? [],
    categories: (result.categories ?? []).map((row: any) => ({
      id: row.id,
      name: row.name,
      slug: row.slug,
      description: row.description ?? "",
      featuredImageUrl: row.featured_image_url,
      seoTitle: row.seo_title ?? row.name,
      seoDescription: row.seo_description ?? row.description ?? "",
      isActive: row.is_active ?? true,
    })),
    tags: (result.tags ?? []).map((row: any) => ({
      id: row.id,
      name: row.name,
      slug: row.slug,
      description: row.description,
    })),
    authors: (result.authors ?? []).map((row: any) => ({
      id: row.id,
      fullName: row.full_name,
      slug: row.slug,
      jobTitle: row.job_title ?? "",
      biography: row.biography ?? "",
      email: row.email ?? "",
      profileImageUrl: row.profile_image_url,
      socialLinks: row.social_links ?? {},
      seoDescription: row.seo_description ?? "",
    })),
    media: (result.media ?? []).map((row: any) => ({
      id: row.id,
      fileName: row.file_name,
      title: row.title ?? row.file_name,
      altText: row.alt_text ?? "",
      caption: row.caption ?? "",
      description: row.description ?? "",
      mimeType: row.mime_type ?? "application/octet-stream",
      fileType: row.file_type,
      fileSizeBytes: Number(row.file_size_bytes ?? 0),
      width: row.width,
      height: row.height,
      durationSeconds: row.duration_seconds,
      publicUrl: row.public_url ?? row.source_url ?? "",
      visibility: row.visibility,
      status: row.status,
      sourceType: row.source_type,
      uploadDate: row.created_at,
      usageCount: 0,
    })),
    comments: (result.comments ?? []).map((row: any) => ({
      id: row.id,
      postTitle: row.post?.title ?? "Unknown article",
      postSlug: row.post?.slug ?? "",
      authorName: row.author_name,
      authorEmail: row.author_email,
      body: row.body,
      status: row.status,
      createdAt: row.created_at,
    })),
    subscribers: (result.subscribers ?? []).map((row: any) => ({
      id: row.id,
      fullName: row.full_name ?? "Reader",
      email: row.email,
      interests: row.interests ?? [],
      source: row.campaign_source ?? "Blog",
      status: row.status,
      subscribedAt: row.subscribed_at,
      leadId: row.lead_id,
    })),
    social: (result.social ?? []).map((row: any) => ({
      id: row.id,
      postId: row.post_id,
      postTitle: row.post?.title ?? "Unknown article",
      postSlug: row.post?.slug ?? "",
      platform: row.platform,
      caption: row.caption,
      mediaUrl: row.media_url,
      status: row.status,
      scheduledAt: row.scheduled_at,
    })),
    settings: (result.settings ?? []).map((row: any) => ({
      key: row.key,
      value: row.value ?? {},
      description: row.description,
    })),
  };
}
