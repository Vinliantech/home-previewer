/* eslint-disable @typescript-eslint/no-explicit-any -- Supabase types are regenerated after the content migration is applied. */
import { createClientFn } from "@/lib/client-function";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabase } from "@/integrations/supabase/client";
import { invokeEdgeFunction } from "@/integrations/supabase/edge";
import {
  CONTENT_BLOCK_TYPES,
  CONTENT_POST_FORMATS,
  CONTENT_POST_STATUSES,
  estimateReadingTime,
  type ContentBlock,
  type ContentPost,
} from "@/lib/content";

const postStatuses = CONTENT_POST_STATUSES.map((item) => item.key) as [
  (typeof CONTENT_POST_STATUSES)[number]["key"],
  ...(typeof CONTENT_POST_STATUSES)[number]["key"][],
];
const postFormats = CONTENT_POST_FORMATS.map((item) => item.key) as [
  (typeof CONTENT_POST_FORMATS)[number]["key"],
  ...(typeof CONTENT_POST_FORMATS)[number]["key"][],
];
const blockTypes = CONTENT_BLOCK_TYPES.map((item) => item.key) as [
  (typeof CONTENT_BLOCK_TYPES)[number]["key"],
  ...(typeof CONTENT_BLOCK_TYPES)[number]["key"][],
];

const blockSchema = z.object({
  id: z.string().min(1).max(120),
  type: z.enum(blockTypes),
  data: z.record(z.unknown()),
});

const postInputSchema = z.object({
  id: z.string().uuid().optional(),
  title: z.string().trim().min(3).max(180),
  slug: z
    .string()
    .trim()
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
    .max(120),
  excerpt: z.string().trim().max(500).optional(),
  contentBlocks: z.array(blockSchema).max(250),
  featuredImageUrl: z.string().trim().max(1000).optional(),
  featuredMediaId: z.string().uuid().optional(),
  featuredVideoUrl: z.string().trim().max(1000).optional(),
  videoCaption: z.string().trim().max(500).optional(),
  videoTranscript: z.string().trim().max(100000).optional(),
  posterImageUrl: z.string().trim().max(1000).optional(),
  format: z.enum(postFormats),
  authorId: z.string().uuid().optional(),
  primaryCategoryId: z.string().uuid().optional(),
  secondaryCategoryIds: z.array(z.string().uuid()).max(20).default([]),
  tagIds: z.array(z.string().uuid()).max(40).default([]),
  status: z.enum(postStatuses),
  scheduledAt: z.string().datetime().optional(),
  relatedPropertyId: z.string().uuid().optional(),
  relatedInvestmentId: z.string().uuid().optional(),
  ctaLabel: z.string().trim().max(100).optional(),
  ctaUrl: z.string().trim().max(1000).optional(),
  seoTitle: z.string().trim().max(80).optional(),
  metaDescription: z.string().trim().max(200).optional(),
  focusKeyword: z.string().trim().max(100).optional(),
  secondaryKeywords: z.array(z.string().trim().max(100)).max(20).default([]),
  canonicalUrl: z.string().trim().max(1000).optional(),
  ogTitle: z.string().trim().max(120).optional(),
  ogDescription: z.string().trim().max(300).optional(),
  ogImageUrl: z.string().trim().max(1000).optional(),
  twitterTitle: z.string().trim().max(120).optional(),
  twitterDescription: z.string().trim().max(300).optional(),
  twitterImageUrl: z.string().trim().max(1000).optional(),
  robotsIndex: z.boolean().default(true),
  robotsFollow: z.boolean().default(true),
  includeInSitemap: z.boolean().default(true),
  facebookCaption: z.string().max(5000).optional(),
  instagramCaption: z.string().max(5000).optional(),
  linkedinCaption: z.string().max(5000).optional(),
  twitterCaption: z.string().max(1000).optional(),
  whatsappShareText: z.string().max(2000).optional(),
  socialImageUrl: z.string().trim().max(1000).optional(),
  socialVideoUrl: z.string().trim().max(1000).optional(),
  socialScheduledAt: z.string().datetime().optional(),
  commentsEnabled: z.boolean().default(false),
  isFeatured: z.boolean().default(false),
  isPopular: z.boolean().default(false),
});

async function requireContentPermission(
  supabase: any,
  userId: string,
  permission: "member" | "publish" | "seo" | "social" | "team" = "member",
) {
  const functions = {
    member: "is_content_member",
    publish: "content_can_publish",
    seo: "content_can_manage_seo",
    social: "content_can_manage_social",
    team: "content_can_manage_team",
  } as const;
  const { data, error } = await supabase.rpc(functions[permission], { _uid: userId });
  if (error || !data) throw new Error("You do not have permission to perform this content action.");
}

function publicPostSelect() {
  return `
    *,
    author:content_authors(*),
    primary_category:blog_categories(*),
    secondary_categories:blog_post_categories(category:blog_categories(*)),
    post_tags:blog_post_tags(tag:blog_tags(*))
  `;
}

function mapPublicPost(row: any): ContentPost {
  const author = row.author ?? {};
  const primary = row.primary_category ?? {};
  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    excerpt: row.excerpt ?? "",
    contentBlocks: (row.content_blocks ?? []) as ContentBlock[],
    featuredImageUrl: row.featured_image_url ?? row.poster_image_url ?? "",
    featuredVideoUrl: row.featured_video_url,
    posterImageUrl: row.poster_image_url,
    videoCaption: row.video_caption,
    videoTranscript: row.video_transcript,
    format: row.format,
    status: row.status,
    author: {
      id: author.id ?? "",
      fullName: author.full_name ?? "Kay-Steph Editorial Desk",
      slug: author.slug ?? "kay-steph-editorial-desk",
      jobTitle: author.job_title ?? "Kay-Steph Group",
      biography: author.biography ?? "",
      email: author.email ?? "",
      profileImageUrl: author.profile_image_url,
      socialLinks: author.social_links ?? {},
      seoDescription: author.seo_description ?? "",
    },
    primaryCategory: {
      id: primary.id ?? "",
      name: primary.name ?? "Insights",
      slug: primary.slug ?? "insights",
      description: primary.description ?? "",
      featuredImageUrl: primary.featured_image_url,
      seoTitle: primary.seo_title ?? primary.name ?? "Insights",
      seoDescription: primary.seo_description ?? primary.description ?? "",
      isActive: primary.is_active ?? true,
    },
    secondaryCategories: (row.secondary_categories ?? []).map((item: any) => ({
      id: item.category?.id ?? "",
      name: item.category?.name ?? "",
      slug: item.category?.slug ?? "",
      description: item.category?.description ?? "",
      featuredImageUrl: item.category?.featured_image_url,
      seoTitle: item.category?.seo_title ?? item.category?.name ?? "",
      seoDescription: item.category?.seo_description ?? "",
      isActive: item.category?.is_active ?? true,
    })),
    tags: (row.post_tags ?? []).map((item: any) => ({
      id: item.tag?.id ?? "",
      name: item.tag?.name ?? "",
      slug: item.tag?.slug ?? "",
      description: item.tag?.description,
    })),
    publishedAt: row.published_at,
    scheduledAt: row.scheduled_at,
    updatedAt: row.updated_at,
    readingTimeMinutes: row.reading_time_minutes ?? 1,
    isFeatured: row.is_featured ?? false,
    isPopular: row.is_popular ?? false,
    commentsEnabled: row.comments_enabled ?? false,
    relatedProperty: null,
    relatedInvestment: null,
    ctaLabel: row.cta_label,
    ctaUrl: row.cta_url,
    seoTitle: row.seo_title ?? row.title,
    metaDescription: row.meta_description ?? row.excerpt ?? "",
    focusKeyword: row.focus_keyword ?? "",
    secondaryKeywords: row.secondary_keywords ?? [],
    canonicalUrl: row.canonical_url ?? `https://kaystephgroup.com/blog/${row.slug}`,
    ogTitle: row.og_title ?? row.title,
    ogDescription: row.og_description ?? row.excerpt ?? "",
    ogImageUrl: row.og_image_url ?? row.featured_image_url ?? "",
    twitterTitle: row.twitter_title ?? row.title,
    twitterDescription: row.twitter_description ?? row.excerpt ?? "",
    twitterImageUrl: row.twitter_image_url ?? row.featured_image_url ?? "",
    robotsIndex: row.robots_index ?? true,
    robotsFollow: row.robots_follow ?? true,
    includeInSitemap: row.include_in_sitemap ?? true,
    facebookCaption: row.facebook_caption ?? "",
    instagramCaption: row.instagram_caption ?? "",
    linkedinCaption: row.linkedin_caption ?? "",
    twitterCaption: row.twitter_caption ?? "",
    whatsappShareText: row.whatsapp_share_text ?? "",
    socialImageUrl: row.social_image_url ?? row.featured_image_url ?? "",
    socialVideoUrl: row.social_video_url,
    socialScheduledAt: row.social_scheduled_at,
    viewCount: Number(row.view_count ?? 0),
    uniqueVisitorCount: Number(row.unique_visitor_count ?? 0),
    averageReadSeconds: row.average_read_seconds ?? 0,
    videoPlayCount: Number(row.video_play_count ?? 0),
    socialShareCount: Number(row.social_share_count ?? 0),
    leadCount: Number(row.lead_count ?? 0),
  };
}

export const getPublicContentIndex = createClientFn({ method: "GET" }).handler(async () => {
  try {
    const sb = supabase as any;
    const [postsResult, categoriesResult, authorsResult, tagsResult] = await Promise.all([
      sb
        .from("blog_posts")
        .select(publicPostSelect())
        .eq("status", "published")
        .lte("published_at", new Date().toISOString())
        .order("published_at", { ascending: false })
        .limit(60),
      sb.from("blog_categories").select("*").eq("is_active", true).order("sort_order"),
      sb.from("content_authors").select("*").eq("is_active", true).order("full_name"),
      sb.from("blog_tags").select("*").eq("is_active", true).order("name"),
    ]);
    if (postsResult.error) return { live: false, posts: [], categories: [], authors: [], tags: [] };
    return {
      live: true,
      posts: (postsResult.data ?? []).map(mapPublicPost),
      categories: categoriesResult.data ?? [],
      authors: authorsResult.data ?? [],
      tags: tagsResult.data ?? [],
    };
  } catch {
    return { live: false, posts: [], categories: [], authors: [], tags: [] };
  }
});

export const getPublicContentPost = createClientFn({ method: "GET" })
  .validator((input) => z.object({ slug: z.string().trim().min(1).max(140) }).parse(input))
  .handler(async ({ data }) => {
    try {
      const sb = supabase as any;
      const { data: post, error } = await sb
        .from("blog_posts")
        .select(publicPostSelect())
        .eq("slug", data.slug)
        .eq("status", "published")
        .lte("published_at", new Date().toISOString())
        .maybeSingle();
      if (error || !post) return { live: false, post: null, related: [] };
      const mapped = mapPublicPost(post);
      const { data: related } = await sb
        .from("blog_posts")
        .select(publicPostSelect())
        .eq("status", "published")
        .neq("id", post.id)
        .eq("primary_category_id", post.primary_category_id)
        .order("published_at", { ascending: false })
        .limit(3);
      return {
        live: true,
        post: mapped,
        related: (related ?? []).map(mapPublicPost),
      };
    } catch {
      return { live: false, post: null, related: [] };
    }
  });

export const getContentWorkspaceData = createClientFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const sb = context.supabase as any;
    await requireContentPermission(sb, context.userId);
    const [posts, categories, tags, authors, media, comments, subscribers, social, settings] =
      await Promise.all([
        sb.from("blog_posts").select(publicPostSelect()).order("updated_at", { ascending: false }),
        sb.from("blog_categories").select("*").order("sort_order"),
        sb.from("blog_tags").select("*").order("name"),
        sb.from("content_authors").select("*").order("full_name"),
        sb.from("blog_media").select("*").order("created_at", { ascending: false }),
        sb
          .from("blog_comments")
          .select("*, post:blog_posts(title, slug)")
          .order("created_at", { ascending: false })
          .limit(500),
        sb
          .from("newsletter_subscribers")
          .select("*")
          .order("subscribed_at", { ascending: false })
          .limit(1000),
        sb
          .from("social_publications")
          .select("*, post:blog_posts(title, slug)")
          .order("created_at", { ascending: false }),
        sb.from("content_settings").select("*").order("key"),
      ]);
    return {
      live: true,
      posts: (posts.data ?? []).map(mapPublicPost),
      categories: categories.data ?? [],
      tags: tags.data ?? [],
      authors: authors.data ?? [],
      media: media.data ?? [],
      comments: comments.data ?? [],
      subscribers: subscribers.data ?? [],
      social: social.data ?? [],
      settings: settings.data ?? [],
    };
  });

export const saveContentPost = createClientFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input) => postInputSchema.parse(input))
  .handler(async ({ data, context }) => {
    const sb = context.supabase as any;
    await requireContentPermission(sb, context.userId);
    if (["scheduled", "published"].includes(data.status)) {
      await requireContentPermission(sb, context.userId, "publish");
    }
    const readingTime = estimateReadingTime(data.contentBlocks as ContentBlock[]);
    const values = {
      title: data.title,
      slug: data.slug,
      excerpt: data.excerpt || null,
      content_blocks: data.contentBlocks,
      featured_image_url: data.featuredImageUrl || null,
      featured_media_id: data.featuredMediaId || null,
      featured_video_url: data.featuredVideoUrl || null,
      video_caption: data.videoCaption || null,
      video_transcript: data.videoTranscript || null,
      poster_image_url: data.posterImageUrl || null,
      format: data.format,
      author_id: data.authorId || null,
      primary_category_id: data.primaryCategoryId || null,
      status: data.status,
      scheduled_at: data.scheduledAt || null,
      reading_time_minutes: readingTime,
      related_property_id: data.relatedPropertyId || null,
      related_investment_id: data.relatedInvestmentId || null,
      cta_label: data.ctaLabel || null,
      cta_url: data.ctaUrl || null,
      seo_title: data.seoTitle || null,
      meta_description: data.metaDescription || null,
      focus_keyword: data.focusKeyword || null,
      secondary_keywords: data.secondaryKeywords,
      canonical_url: data.canonicalUrl || null,
      og_title: data.ogTitle || null,
      og_description: data.ogDescription || null,
      og_image_url: data.ogImageUrl || null,
      twitter_title: data.twitterTitle || null,
      twitter_description: data.twitterDescription || null,
      twitter_image_url: data.twitterImageUrl || null,
      robots_index: data.robotsIndex,
      robots_follow: data.robotsFollow,
      include_in_sitemap: data.includeInSitemap,
      facebook_caption: data.facebookCaption || null,
      instagram_caption: data.instagramCaption || null,
      linkedin_caption: data.linkedinCaption || null,
      twitter_caption: data.twitterCaption || null,
      whatsapp_share_text: data.whatsappShareText || null,
      social_image_url: data.socialImageUrl || null,
      social_video_url: data.socialVideoUrl || null,
      social_scheduled_at: data.socialScheduledAt || null,
      comments_enabled: data.commentsEnabled,
      is_featured: data.isFeatured,
      is_popular: data.isPopular,
      updated_by: context.userId,
    };

    let postId = data.id;
    if (postId) {
      const { error } = await sb.from("blog_posts").update(values).eq("id", postId);
      if (error) throw new Error(error.message);
    } else {
      const { data: created, error } = await sb
        .from("blog_posts")
        .insert({ ...values, created_by: context.userId })
        .select("id")
        .single();
      if (error || !created) throw new Error(error?.message ?? "Post could not be created.");
      postId = created.id;
    }

    await Promise.all([
      sb.from("blog_post_categories").delete().eq("post_id", postId),
      sb.from("blog_post_tags").delete().eq("post_id", postId),
    ]);
    const secondaryCategoryIds = data.secondaryCategoryIds.filter(
      (id) => id !== data.primaryCategoryId,
    );
    if (secondaryCategoryIds.length) {
      const { error } = await sb
        .from("blog_post_categories")
        .insert(
          secondaryCategoryIds.map((categoryId) => ({ post_id: postId, category_id: categoryId })),
        );
      if (error) throw new Error(error.message);
    }
    if (data.tagIds.length) {
      const { error } = await sb
        .from("blog_post_tags")
        .insert(data.tagIds.map((tagId) => ({ post_id: postId, tag_id: tagId })));
      if (error) throw new Error(error.message);
    }
    return { ok: true, postId, readingTime };
  });

export const updateContentPostStatus = createClientFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input) =>
    z
      .object({
        postId: z.string().uuid(),
        status: z.enum(postStatuses),
        scheduledAt: z.string().datetime().optional(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const sb = context.supabase as any;
    await requireContentPermission(sb, context.userId);
    if (["scheduled", "published"].includes(data.status)) {
      await requireContentPermission(sb, context.userId, "publish");
    }
    const patch: Record<string, unknown> = {
      status: data.status,
      updated_by: context.userId,
    };
    if (data.status === "scheduled") patch.scheduled_at = data.scheduledAt;
    if (data.status === "published") patch.published_at = new Date().toISOString();
    const { error } = await sb.from("blog_posts").update(patch).eq("id", data.postId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const saveContentCategory = createClientFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input) =>
    z
      .object({
        id: z.string().uuid().optional(),
        name: z.string().trim().min(2).max(100),
        slug: z
          .string()
          .trim()
          .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
        description: z.string().max(1000).optional(),
        featuredImageUrl: z.string().max(1000).optional(),
        seoTitle: z.string().max(80).optional(),
        seoDescription: z.string().max(200).optional(),
        isActive: z.boolean().default(true),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const sb = context.supabase as any;
    await requireContentPermission(sb, context.userId);
    const values = {
      name: data.name,
      slug: data.slug,
      description: data.description || null,
      featured_image_url: data.featuredImageUrl || null,
      seo_title: data.seoTitle || null,
      seo_description: data.seoDescription || null,
      is_active: data.isActive,
    };
    const query = data.id
      ? sb.from("blog_categories").update(values).eq("id", data.id)
      : sb.from("blog_categories").insert({ ...values, created_by: context.userId });
    const { error } = await query;
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const saveContentTag = createClientFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input) =>
    z
      .object({
        id: z.string().uuid().optional(),
        name: z.string().trim().min(2).max(80),
        slug: z
          .string()
          .trim()
          .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
        description: z.string().max(500).optional(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const sb = context.supabase as any;
    await requireContentPermission(sb, context.userId);
    const values = { name: data.name, slug: data.slug, description: data.description || null };
    const query = data.id
      ? sb.from("blog_tags").update(values).eq("id", data.id)
      : sb.from("blog_tags").insert({ ...values, created_by: context.userId });
    const { error } = await query;
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const saveContentAuthor = createClientFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input) =>
    z
      .object({
        id: z.string().uuid().optional(),
        fullName: z.string().trim().min(2).max(120),
        slug: z
          .string()
          .trim()
          .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
        jobTitle: z.string().max(160).optional(),
        biography: z.string().max(3000).optional(),
        email: z.string().email().optional(),
        profileImageUrl: z.string().max(1000).optional(),
        socialLinks: z.record(z.string()).default({}),
        seoDescription: z.string().max(200).optional(),
        isActive: z.boolean().default(true),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const sb = context.supabase as any;
    await requireContentPermission(sb, context.userId, "team");
    const values = {
      full_name: data.fullName,
      slug: data.slug,
      job_title: data.jobTitle || null,
      biography: data.biography || null,
      email: data.email || null,
      profile_image_url: data.profileImageUrl || null,
      social_links: data.socialLinks,
      seo_description: data.seoDescription || null,
      is_active: data.isActive,
    };
    const query = data.id
      ? sb.from("content_authors").update(values).eq("id", data.id)
      : sb.from("content_authors").insert(values);
    const { error } = await query;
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const registerContentMedia = createClientFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input) =>
    z
      .object({
        id: z.string().uuid().optional(),
        bucketId: z.enum(["blog-media", "content-private"]),
        storagePath: z.string().max(1000).optional(),
        publicUrl: z.string().max(2000).optional(),
        fileName: z.string().min(1).max(255),
        title: z.string().max(255).optional(),
        altText: z.string().max(500).optional(),
        caption: z.string().max(1000).optional(),
        description: z.string().max(3000).optional(),
        mimeType: z.string().max(150).optional(),
        fileType: z.enum(["image", "video", "pdf", "document"]),
        fileSizeBytes: z.number().int().nonnegative().optional(),
        width: z.number().int().positive().optional(),
        height: z.number().int().positive().optional(),
        durationSeconds: z.number().int().nonnegative().optional(),
        sourceType: z.enum(["upload", "youtube", "vimeo", "external"]),
        sourceUrl: z.string().max(2000).optional(),
        embedUrl: z.string().max(2000).optional(),
        posterImageUrl: z.string().max(2000).optional(),
        transcript: z.string().max(100000).optional(),
        visibility: z.enum(["public", "private"]),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const sb = context.supabase as any;
    await requireContentPermission(sb, context.userId);
    const values = {
      bucket_id: data.bucketId,
      storage_path: data.storagePath || null,
      public_url: data.publicUrl || null,
      original_file_name: data.fileName,
      file_name: data.fileName,
      title: data.title || null,
      alt_text: data.altText || null,
      caption: data.caption || null,
      description: data.description || null,
      mime_type: data.mimeType || null,
      file_type: data.fileType,
      file_size_bytes: data.fileSizeBytes || null,
      width: data.width || null,
      height: data.height || null,
      duration_seconds: data.durationSeconds || null,
      source_type: data.sourceType,
      source_url: data.sourceUrl || null,
      embed_url: data.embedUrl || null,
      poster_image_url: data.posterImageUrl || null,
      transcript: data.transcript || null,
      visibility: data.visibility,
      uploaded_by: context.userId,
    };
    const query = data.id
      ? sb.from("blog_media").update(values).eq("id", data.id)
      : sb.from("blog_media").insert(values);
    const { error } = await query;
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const moderateContentComment = createClientFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input) =>
    z
      .object({
        commentId: z.string().uuid(),
        status: z.enum(["pending", "approved", "spam", "trashed"]),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const sb = context.supabase as any;
    await requireContentPermission(sb, context.userId);
    const { error } = await sb
      .from("blog_comments")
      .update({
        status: data.status,
        moderated_by: context.userId,
        moderated_at: new Date().toISOString(),
      })
      .eq("id", data.commentId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const saveSocialPublication = createClientFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input) =>
    z
      .object({
        postId: z.string().uuid(),
        platform: z.enum(["facebook", "instagram", "linkedin", "twitter", "whatsapp"]),
        caption: z.string().trim().min(1).max(5000),
        mediaUrl: z.string().max(2000).optional(),
        status: z.enum(["draft", "ready", "scheduled", "published", "failed", "cancelled"]),
        scheduledAt: z.string().datetime().optional(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const sb = context.supabase as any;
    await requireContentPermission(sb, context.userId, "social");
    const { error } = await sb.from("social_publications").upsert(
      {
        post_id: data.postId,
        platform: data.platform,
        caption: data.caption,
        media_url: data.mediaUrl || null,
        status: data.status,
        scheduled_at: data.scheduledAt || null,
        created_by: context.userId,
      },
      { onConflict: "post_id,platform" },
    );
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const saveContentSetting = createClientFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input) =>
    z.object({ key: z.string().min(2).max(100), value: z.record(z.unknown()) }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const sb = context.supabase as any;
    await requireContentPermission(sb, context.userId, "team");
    const { error } = await sb
      .from("content_settings")
      .upsert(
        { key: data.key, value: data.value, updated_by: context.userId },
        { onConflict: "key" },
      );
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const subscribeToBlogNewsletter = createClientFn({ method: "POST" })
  .validator((input) =>
    z
      .object({
        fullName: z.string().trim().min(2).max(120),
        email: z.string().trim().email().max(180),
        interests: z.array(z.string().trim().max(100)).min(1).max(20),
        consentGiven: z.boolean().refine(Boolean),
        sourcePostSlug: z.string().trim().max(140).optional(),
        sourceCategorySlug: z.string().trim().max(140).optional(),
        campaignSource: z.string().trim().max(140).optional(),
        company: z.string().max(0).optional(),
      })
      .parse(input),
  )
  .handler(({ data }) =>
    invokeEdgeFunction<{ ok: true; merged: boolean }>(
      "public-workflows",
      "newsletter",
      data,
    ),
  );

export const trackBlogEngagement = createClientFn({ method: "POST" })
  .validator((input) =>
    z
      .object({
        postSlug: z.string().trim().max(140),
        eventType: z.enum([
          "view",
          "read_progress",
          "video_play",
          "social_share",
          "report_download",
          "investment_pack_request",
          "consultation_booking",
          "event_registration",
          "property_enquiry",
          "cta_click",
        ]),
        visitorId: z.string().max(160).optional(),
        sessionId: z.string().max(160).optional(),
        isUnique: z.boolean().optional(),
        sourceUrl: z.string().max(2000).optional(),
        referrer: z.string().max(2000).optional(),
        metadata: z.record(z.unknown()).optional(),
      })
      .parse(input),
  )
  .handler(({ data }) =>
    invokeEdgeFunction<{ ok: boolean }>("public-workflows", "engagement", data),
  );

export const createBlogComment = createClientFn({ method: "POST" })
  .validator((input) =>
    z
      .object({
        postSlug: z.string().trim().max(140),
        authorName: z.string().trim().min(2).max(120),
        authorEmail: z.string().trim().email().max(180),
        body: z.string().trim().min(2).max(5000),
        consentGiven: z.boolean().refine(Boolean),
        company: z.string().max(0).optional(),
      })
      .parse(input),
  )
  .handler(({ data }) =>
    invokeEdgeFunction<{ ok: true }>("public-workflows", "comment", data),
  );
