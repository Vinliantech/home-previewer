import { useEffect, useRef, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useClientFn } from "@/lib/client-function";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  ChevronRight,
  MessageCircle,
  Send,
  Tag,
  UserRound,
} from "lucide-react";
import { toast } from "sonner";
import {
  ArticleMeta,
  ArticleShare,
  ArticleTableOfContents,
  ContentBlockRenderer,
  EditorialPostCard,
  NewsletterForm,
} from "@/components/content/Editorial";
import { PageShell } from "@/components/site/PageShell";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  createBlogComment,
  getPublicContentPost,
  trackBlogEngagement,
} from "@/lib/content.functions";
import { contentFormatLabel, type ContentPost } from "@/lib/content";

export const Route = createFileRoute("/blog/$slug")({
  loader: ({ params }) => getPublicContentPost({ data: { slug: params.slug } }),
  head: ({ loaderData, params }) => {
    const post = loaderData?.post;
    if (!post) return { meta: [{ title: "Article not found | Kay-Steph Journal" }] };
    return {
      meta: [
        { title: post.seoTitle },
        { name: "description", content: post.metaDescription },
        {
          name: "robots",
          content: `${post.robotsIndex ? "index" : "noindex"},${post.robotsFollow ? "follow" : "nofollow"}`,
        },
        { property: "og:title", content: post.ogTitle },
        { property: "og:description", content: post.ogDescription },
        { property: "og:image", content: post.ogImageUrl },
        { property: "og:type", content: "article" },
        { name: "twitter:card", content: "summary_large_image" },
        { name: "twitter:title", content: post.twitterTitle },
        { name: "twitter:description", content: post.twitterDescription },
        { name: "twitter:image", content: post.twitterImageUrl },
      ],
      links: [{ rel: "canonical", href: post.canonicalUrl }],
    };
  },
  component: BlogPostPage,
});

function BlogPostPage() {
  const { slug } = Route.useParams();
  const loaderData = Route.useLoaderData();
  const post = loaderData.post as ContentPost | undefined;
  const liveRelated = loaderData.related as ContentPost[];
  const related = post ? liveRelated : [];
  const track = useClientFn(trackBlogEngagement);
  const trackedSlug = useRef<string | null>(null);

  useEffect(() => {
    if (!post || !loaderData.live || trackedSlug.current === post.slug) return;
    trackedSlug.current = post.slug;
    const visitorKey = "kaysteph-content-visitor";
    const sessionKey = "kaysteph-content-session";
    const viewedKey = `kaysteph-content-viewed:${post.slug}`;
    let visitorId = window.localStorage.getItem(visitorKey);
    if (!visitorId) {
      visitorId = crypto.randomUUID();
      window.localStorage.setItem(visitorKey, visitorId);
    }
    let sessionId = window.sessionStorage.getItem(sessionKey);
    if (!sessionId) {
      sessionId = crypto.randomUUID();
      window.sessionStorage.setItem(sessionKey, sessionId);
    }
    const isUnique = window.localStorage.getItem(viewedKey) !== "1";
    if (isUnique) window.localStorage.setItem(viewedKey, "1");
    void track({
      data: {
        postSlug: post.slug,
        eventType: "view",
        visitorId,
        sessionId,
        isUnique,
        sourceUrl: window.location.href,
        referrer: document.referrer,
        metadata: {},
      },
    }).catch(() => undefined);

    const sent = new Set<number>();
    const trackProgress = () => {
      const available = document.documentElement.scrollHeight - window.innerHeight;
      if (available <= 0) return;
      const progress = Math.round((window.scrollY / available) * 100);
      for (const threshold of [50, 90]) {
        const progressKey = `kaysteph-content-progress:${post.slug}:${threshold}`;
        if (
          progress >= threshold &&
          !sent.has(threshold) &&
          window.sessionStorage.getItem(progressKey) !== "1"
        ) {
          sent.add(threshold);
          window.sessionStorage.setItem(progressKey, "1");
          void track({
            data: {
              postSlug: post.slug,
              eventType: "read_progress",
              visitorId,
              sessionId,
              sourceUrl: window.location.href,
              referrer: document.referrer,
              metadata: { percent: threshold },
            },
          }).catch(() => undefined);
        }
      }
    };
    window.addEventListener("scroll", trackProgress, { passive: true });
    trackProgress();
    return () => window.removeEventListener("scroll", trackProgress);
  }, [loaderData.live, post, track]);

  if (!post) {
    return (
      <PageShell>
        <section className="flex min-h-[70vh] items-center bg-[#f5f7f4] pb-20 pt-[150px]">
          <div className="mx-auto max-w-2xl px-4 text-center sm:px-6">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#a77828]">
              Kay-Steph Journal
            </p>
            <h1 className="mt-4 font-serif text-4xl font-semibold text-[#173e35]">
              This article is not available.
            </h1>
            <p className="mt-4 text-sm leading-7 text-[#6f7b76]">
              It may have been unpublished, archived or moved during editorial review.
            </p>
            <Link
              to="/blog"
              className="mt-7 inline-flex items-center gap-2 bg-[#0d5143] px-6 py-3 text-sm font-semibold text-white"
            >
              <ArrowLeft className="h-4 w-4" />
              Return to the journal
            </Link>
          </div>
        </section>
      </PageShell>
    );
  }

  const articleSchema = {
    "@context": "https://schema.org",
    "@type": post.format.includes("video") ? ["Article", "VideoObject"] : "Article",
    headline: post.title,
    description: post.metaDescription,
    image: [post.featuredImageUrl],
    datePublished: post.publishedAt,
    dateModified: post.updatedAt,
    author: {
      "@type": "Person",
      name: post.author.fullName,
      url: `https://kaystephgroup.com/blog/author/${post.author.slug}`,
      jobTitle: post.author.jobTitle,
    },
    publisher: {
      "@type": "Organization",
      name: "Kay-Steph Group",
      url: "https://kaystephgroup.com",
    },
    mainEntityOfPage: post.canonicalUrl,
    ...(post.format.includes("video")
      ? {
          name: post.title,
          thumbnailUrl: [post.posterImageUrl ?? post.featuredImageUrl],
          uploadDate: post.publishedAt,
          description: post.videoCaption ?? post.excerpt,
        }
      : {}),
  };
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: "https://kaystephgroup.com" },
      { "@type": "ListItem", position: 2, name: "Journal", item: "https://kaystephgroup.com/blog" },
      {
        "@type": "ListItem",
        position: 3,
        name: post.primaryCategory.name,
        item: `https://kaystephgroup.com/blog/category/${post.primaryCategory.slug}`,
      },
      { "@type": "ListItem", position: 4, name: post.title, item: post.canonicalUrl },
    ],
  };

  // The loader returns this post plus its most recent same-category siblings,
  // so the footer links walk real published content. AdjacentPost renders a
  // blank cell when a slot is missing.
  const previous = related[0] ?? null;
  const next = related[1] ?? null;

  return (
    <PageShell>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJson(articleSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJson(breadcrumbSchema) }}
      />

      <article>
        <header className="relative min-h-[670px] overflow-hidden bg-[#123d33] pt-[76px] text-white">
          <img
            src={post.featuredImageUrl}
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-[#062a23]/75" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#062a23] via-transparent to-[#062a23]/25" />
          <div className="relative mx-auto flex min-h-[594px] max-w-7xl flex-col justify-end px-4 pb-16 sm:px-6 lg:pb-20">
            <nav
              className="mb-8 flex flex-wrap items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-white/55"
              aria-label="Breadcrumb"
            >
              <Link to="/blog" className="hover:text-[#e5bf70]">
                Journal
              </Link>
              <ChevronRight className="h-3 w-3" />
              <Link
                to="/blog/category/$slug"
                params={{ slug: post.primaryCategory.slug }}
                className="hover:text-[#e5bf70]"
              >
                {post.primaryCategory.name}
              </Link>
            </nav>
            <div className="max-w-5xl">
              <div className="flex flex-wrap items-center gap-3 text-[10px] font-bold uppercase tracking-[0.18em] text-[#e5bf70]">
                <span>{post.primaryCategory.name}</span>
                <span className="h-1 w-1 rounded-full bg-current" />
                <span>{contentFormatLabel(post.format)}</span>
              </div>
              <h1 className="mt-5 max-w-5xl font-serif text-4xl font-semibold leading-[1.06] sm:text-5xl lg:text-6xl">
                {post.title}
              </h1>
              <p className="mt-5 max-w-3xl text-base leading-7 text-white/75 sm:text-lg">
                {post.excerpt}
              </p>
              <div className="mt-7 text-white/70">
                <ArticleMeta post={post} dark />
              </div>
            </div>
          </div>
        </header>

        <div className="border-b border-[#dfe5e1] bg-[#f8faf8]">
          <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-5 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
            <ArticleShare post={post} />
            <Link
              to="/contact"
              search={{ subject: `Article consultation: ${post.title}` }}
              className="inline-flex items-center gap-2 text-sm font-semibold text-[#174f41]"
            >
              Speak with an adviser <MessageCircle className="h-4 w-4" />
            </Link>
          </div>
        </div>

        <div className="mx-auto grid max-w-7xl gap-12 px-4 py-14 sm:px-6 lg:grid-cols-[minmax(0,760px)_280px] lg:justify-between lg:py-20">
          <div className="min-w-0">
            <ContentBlockRenderer blocks={post.contentBlocks} post={post} />

            <div className="mt-12 flex flex-wrap items-center gap-2 border-t border-[#dde4e0] pt-7">
              <Tag className="mr-1 h-4 w-4 text-[#9d742d]" />
              {post.tags.map((item) => (
                <Link
                  key={item.slug}
                  to="/blog"
                  className="rounded-full border border-[#d5ddd9] px-3 py-1.5 text-xs text-[#607069] hover:border-[#ae8438]"
                >
                  {item.name}
                </Link>
              ))}
            </div>

            <div className="mt-10 border border-[#dae2de] bg-[#f6f8f6] p-6 sm:p-8">
              <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
                {post.author.profileImageUrl ? (
                  <img
                    src={post.author.profileImageUrl}
                    alt=""
                    className="h-16 w-16 rounded-full object-cover"
                  />
                ) : (
                  <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-[#dfece7] text-[#175344]">
                    <UserRound className="h-6 w-6" />
                  </span>
                )}
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.17em] text-[#9d742d]">
                    About the author
                  </p>
                  <h2 className="mt-1 font-serif text-2xl font-semibold text-[#183f35]">
                    {post.author.fullName}
                  </h2>
                  <p className="mt-0.5 text-xs font-medium text-[#4e685f]">
                    {post.author.jobTitle}
                  </p>
                  <p className="mt-3 text-sm leading-6 text-[#6c7973]">{post.author.biography}</p>
                  <Link
                    to="/blog/author/$slug"
                    params={{ slug: post.author.slug }}
                    className="mt-4 inline-flex items-center gap-2 text-xs font-semibold text-[#154f41]"
                  >
                    View author profile <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
            </div>

            {post.commentsEnabled && <CommentForm post={post} />}
          </div>

          <aside className="space-y-8 lg:sticky lg:top-28 lg:self-start">
            <ArticleTableOfContents post={post} />
            <div className="border-t border-[#dce2de] pt-5">
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#8e692c]">
                Editorial standard
              </p>
              <div className="mt-3 space-y-3 text-xs leading-5 text-[#6c7973]">
                <p className="flex gap-2">
                  <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#26705b]" />
                  Reviewed for clarity and source accuracy.
                </p>
                <p className="flex gap-2">
                  <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#26705b]" />
                  Investment projections are not guarantees.
                </p>
                <p className="flex gap-2">
                  <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#26705b]" />
                  Property decisions require independent due diligence.
                </p>
              </div>
            </div>
            <div className="bg-[#123f35] p-5 text-white">
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#dfbc71]">
                Stay informed
              </p>
              <h2 className="mt-2 font-serif text-xl font-semibold">
                Get related property briefs.
              </h2>
              <p className="mt-2 text-xs leading-5 text-white/65">
                Choose your interests and receive relevant updates.
              </p>
              <div className="mt-4">
                <NewsletterForm sourcePostSlug={post.slug} compact dark />
              </div>
            </div>
          </aside>
        </div>
      </article>

      {(post.relatedProperty || post.relatedInvestment) && (
        <section className="bg-[#eef3f0] py-14">
          <div className="mx-auto max-w-7xl px-4 sm:px-6">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#9b722d]">
              Continue the research
            </p>
            <div className="mt-5 grid gap-5 sm:grid-cols-2">
              {[post.relatedProperty, post.relatedInvestment].filter(Boolean).map(
                (item) =>
                  item && (
                    <Link
                      key={item.name}
                      to={item.url}
                      className="group grid min-h-56 overflow-hidden bg-white sm:grid-cols-[0.8fr_1.2fr]"
                    >
                      <img
                        src={item.imageUrl}
                        alt=""
                        className="h-full min-h-48 w-full object-cover"
                      />
                      <span className="flex flex-col justify-center p-6">
                        <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#a1762d]">
                          {item.eyebrow}
                        </span>
                        <span className="mt-2 font-serif text-2xl font-semibold text-[#193f36]">
                          {item.name}
                        </span>
                        <span className="mt-2 text-sm leading-6 text-[#6d7974]">{item.detail}</span>
                        <span className="mt-4 inline-flex items-center gap-2 text-xs font-semibold text-[#174e41]">
                          View details <ArrowRight className="h-3.5 w-3.5" />
                        </span>
                      </span>
                    </Link>
                  ),
              )}
            </div>
          </div>
        </section>
      )}

      {related.length > 0 && (
        <section className="bg-white py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6">
            <div className="flex items-end justify-between border-b border-[#dfe5e1] pb-5">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#9c722b]">
                  Keep reading
                </p>
                <h2 className="mt-2 font-serif text-3xl font-semibold text-[#173e35]">
                  Related insights
                </h2>
              </div>
              <Link
                to="/blog"
                className="hidden items-center gap-2 text-xs font-semibold text-[#174f41] sm:inline-flex"
              >
                View the journal <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
            <div className="mt-8 grid gap-7 md:grid-cols-3">
              {related.map((item) => (
                <EditorialPostCard key={item.id} post={item} compact />
              ))}
            </div>
          </div>
        </section>
      )}

      <nav className="border-t border-[#dfe5e1] bg-[#f7f8f5]" aria-label="Adjacent articles">
        <div className="mx-auto grid max-w-7xl sm:grid-cols-2">
          <AdjacentPost direction="previous" post={previous} />
          <AdjacentPost direction="next" post={next} />
        </div>
      </nav>
    </PageShell>
  );
}

function AdjacentPost({
  direction,
  post,
}: {
  direction: "previous" | "next";
  post: ContentPost | null;
}) {
  if (!post) return <div className="min-h-32" />;
  const Icon = direction === "previous" ? ArrowLeft : ArrowRight;
  return (
    <Link
      to="/blog/$slug"
      params={{ slug: post.slug }}
      className={`flex min-h-32 flex-col justify-center border-[#dfe5e1] p-6 hover:bg-white sm:p-8 ${direction === "next" ? "border-t text-right sm:border-l sm:border-t-0" : ""}`}
    >
      <span
        className={`flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.15em] text-[#9b722d] ${direction === "next" ? "justify-end" : ""}`}
      >
        <Icon className="h-3.5 w-3.5" />
        {direction}
      </span>
      <span className="mt-2 font-serif text-lg font-semibold leading-snug text-[#25493f]">
        {post.title}
      </span>
    </Link>
  );
}

function CommentForm({ post }: { post: ContentPost }) {
  const submitComment = useClientFn(createBlogComment);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [body, setBody] = useState("");
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false);

  async function submit() {
    setBusy(true);
    try {
      await submitComment({
        data: {
          postSlug: post.slug,
          authorName: name,
          authorEmail: email,
          body,
          consentGiven: consent,
          company: "",
        },
      });
      toast.success("Comment submitted for review.");
      setName("");
      setEmail("");
      setBody("");
      setConsent(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Comment could not be submitted.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="mt-12 border-t border-[#dce2de] pt-9">
      <h2 className="font-serif text-2xl font-semibold text-[#173e35]">Join the discussion</h2>
      <p className="mt-2 text-sm text-[#6e7a75]">Comments are reviewed before publication.</p>
      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <Input
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Your name"
        />
        <Input
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="Email address"
        />
      </div>
      <Textarea
        value={body}
        onChange={(event) => setBody(event.target.value)}
        placeholder="Write your comment"
        className="mt-3 min-h-32"
      />
      <label className="mt-3 flex items-start gap-2 text-xs leading-5 text-[#6e7a75]">
        <Checkbox
          checked={consent}
          onCheckedChange={(value) => setConsent(value === true)}
          className="mt-0.5"
        />
        I consent to the processing of my details for comment moderation.
      </label>
      <Button onClick={submit} disabled={busy} className="mt-4 bg-[#0d5143] text-white">
        <Send className="mr-2 h-4 w-4" />
        {busy ? "Submitting..." : "Submit comment"}
      </Button>
    </section>
  );
}

function safeJson(value: unknown) {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}
