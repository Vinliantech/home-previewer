import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import {
  ArrowRight,
  BookOpen,
  CalendarDays,
  Check,
  Clock3,
  Copy,
  Download,
  ExternalLink,
  FileText,
  Linkedin,
  Mail,
  MessageCircle,
  Play,
  Quote,
  Share2,
  Tag,
} from "lucide-react";
import { toast } from "sonner";
import { subscribeToBlogNewsletter, trackBlogEngagement } from "@/lib/content.functions";
import {
  NEWSLETTER_INTERESTS,
  contentFormatLabel,
  formatContentDate,
  slugifyContent,
  type ContentBlock,
  type ContentPost,
} from "@/lib/content";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function EditorialPostCard({
  post,
  compact = false,
}: {
  post: ContentPost;
  compact?: boolean;
}) {
  return (
    <article className="group min-w-0">
      <Link
        to="/blog/$slug"
        params={{ slug: post.slug }}
        className={`relative block overflow-hidden bg-[#e6ebe8] ${compact ? "aspect-[16/10]" : "aspect-[4/3]"}`}
      >
        <img
          src={post.featuredImageUrl}
          alt=""
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
        />
        {post.format.includes("video") && (
          <span className="absolute inset-0 flex items-center justify-center bg-black/15">
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-[#153f35] shadow-lg">
              <Play className="ml-0.5 h-4 w-4 fill-current" />
            </span>
          </span>
        )}
      </Link>
      <div className={compact ? "pt-3" : "pt-4"}>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] font-bold uppercase tracking-[0.13em] text-[#9b722e]">
          <Link
            to="/blog/category/$slug"
            params={{ slug: post.primaryCategory.slug }}
            className="hover:text-[#0f4b3e]"
          >
            {post.primaryCategory.name}
          </Link>
          <span className="text-[#8b948f]">{contentFormatLabel(post.format)}</span>
        </div>
        <h3
          className={`mt-2 font-serif font-semibold leading-tight text-[#163e34] group-hover:text-[#a77825] ${compact ? "text-lg" : "text-2xl"}`}
        >
          <Link to="/blog/$slug" params={{ slug: post.slug }}>
            {post.title}
          </Link>
        </h3>
        {!compact && (
          <p className="mt-2 line-clamp-3 text-sm leading-6 text-[#68756f]">{post.excerpt}</p>
        )}
        <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-[#85908b]">
          <span>{post.author.fullName}</span>
          <span>{formatContentDate(post.publishedAt)}</span>
          <span className="inline-flex items-center gap-1">
            <Clock3 className="h-3 w-3" /> {post.readingTimeMinutes} min
          </span>
        </div>
      </div>
    </article>
  );
}

export function NewsletterForm({
  sourcePostSlug,
  sourceCategorySlug,
  compact = false,
  dark = false,
}: {
  sourcePostSlug?: string;
  sourceCategorySlug?: string;
  compact?: boolean;
  dark?: boolean;
}) {
  const subscribe = useServerFn(subscribeToBlogNewsletter);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [interests, setInterests] = useState<string[]>([
    "Property opportunities",
    "Market reports",
  ]);
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [complete, setComplete] = useState(false);

  function toggleInterest(value: string) {
    setInterests((current) =>
      current.includes(value) ? current.filter((item) => item !== value) : [...current, value],
    );
  }

  async function submit() {
    if (name.trim().length < 2) return toast.error("Enter your name.");
    if (!email.includes("@")) return toast.error("Enter a valid email address.");
    if (!interests.length) return toast.error("Choose at least one interest.");
    if (!consent) return toast.error("Consent is required to subscribe.");
    setBusy(true);
    try {
      await subscribe({
        data: {
          fullName: name,
          email,
          interests,
          consentGiven: true,
          sourcePostSlug,
          sourceCategorySlug,
          campaignSource: "organic_blog",
          company: "",
        },
      });
      setComplete(true);
      toast.success("You are subscribed to Kay-Steph Journal.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Subscription could not be completed.");
    } finally {
      setBusy(false);
    }
  }

  const fieldClass = dark
    ? "border-white/20 bg-white/10 text-white placeholder:text-white/45"
    : "border-[#d4ddd8] bg-white text-[#24463c]";

  if (complete) {
    return (
      <div className={`flex items-center gap-3 ${dark ? "text-white" : "text-[#204b40]"}`}>
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#d9eee6] text-[#17634f]">
          <Check className="h-4 w-4" />
        </span>
        <div>
          <p className="font-semibold">Subscription confirmed</p>
          <p className={`text-xs ${dark ? "text-white/65" : "text-[#738079]"}`}>
            The next relevant property brief will arrive by email.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className={`grid gap-3 ${compact ? "sm:grid-cols-[1fr_1.2fr_auto]" : "sm:grid-cols-2"}`}>
        <Input
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Your name"
          aria-label="Your name"
          className={`h-11 ${fieldClass}`}
        />
        <Input
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="Email address"
          aria-label="Email address"
          className={`h-11 ${fieldClass}`}
        />
        {compact && (
          <Button
            onClick={submit}
            disabled={busy}
            className="h-11 bg-[#c3943e] px-6 font-semibold text-white hover:bg-[#ae8030]"
          >
            {busy ? "Joining..." : "Subscribe"}
          </Button>
        )}
      </div>
      {!compact && (
        <div>
          <Label className={dark ? "text-white/70" : "text-[#54645e]"}>Choose your interests</Label>
          <div className="mt-2 flex flex-wrap gap-2">
            {NEWSLETTER_INTERESTS.map((interest) => {
              const active = interests.includes(interest);
              return (
                <button
                  key={interest}
                  type="button"
                  onClick={() => toggleInterest(interest)}
                  className={`rounded-full border px-3 py-1.5 text-[10px] font-semibold transition-colors ${
                    active
                      ? "border-[#c3943e] bg-[#c3943e] text-white"
                      : dark
                        ? "border-white/20 text-white/70 hover:border-white/50"
                        : "border-[#d5ddd9] text-[#65716c] hover:border-[#b68b3b]"
                  }`}
                >
                  {interest}
                </button>
              );
            })}
          </div>
        </div>
      )}
      <label
        className={`flex items-start gap-2.5 text-[10px] leading-4 ${dark ? "text-white/60" : "text-[#6f7b76]"}`}
      >
        <Checkbox
          checked={consent}
          onCheckedChange={(value) => setConsent(value === true)}
          className="mt-0.5"
        />
        I agree that Kay-Steph may email me relevant property insights and opportunities. I can
        unsubscribe at any time.
      </label>
      {!compact && (
        <Button
          onClick={submit}
          disabled={busy}
          className="h-11 bg-[#0d5143] px-7 font-semibold text-white hover:bg-[#0a4237]"
        >
          <Mail className="mr-2 h-4 w-4" /> {busy ? "Joining..." : "Join the newsletter"}
        </Button>
      )}
    </div>
  );
}

export function ContentBlockRenderer({
  blocks,
  post,
}: {
  blocks: ContentBlock[];
  post: ContentPost;
}) {
  return (
    <div className="space-y-7">
      {blocks.map((contentBlock) => (
        <ContentBlockView key={contentBlock.id} block={contentBlock} post={post} />
      ))}
    </div>
  );
}

function ContentBlockView({ block, post }: { block: ContentBlock; post: ContentPost }) {
  // Blocks are validated as JSON at the server boundary, then interpreted by their discriminant here.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data = block.data as Record<string, any>;
  if (block.type === "heading") {
    const level = Number(data.level ?? 2);
    const id = slugifyContent(String(data.text ?? "section"));
    if (level === 3)
      return (
        <h3 id={id} className="scroll-mt-28 font-serif text-2xl font-semibold text-[#173f35]">
          {data.text}
        </h3>
      );
    return (
      <h2
        id={id}
        className="scroll-mt-28 font-serif text-3xl font-semibold leading-tight text-[#173f35]"
      >
        {data.text}
      </h2>
    );
  }
  if (block.type === "paragraph")
    return <p className="text-[17px] leading-8 text-[#4f5d57]">{data.text}</p>;
  if (block.type === "quote")
    return (
      <blockquote className="border-l-2 border-[#c3943e] py-2 pl-6 font-serif text-2xl italic leading-9 text-[#285247]">
        <Quote className="mb-3 h-5 w-5 text-[#c3943e]" />
        {data.text}
      </blockquote>
    );
  if (block.type === "list") {
    const TagName = data.ordered ? "ol" : "ul";
    return (
      <TagName
        className={`space-y-3 pl-5 text-[16px] leading-7 text-[#4f5d57] ${data.ordered ? "list-decimal" : "list-disc"}`}
      >
        {(data.items ?? []).map((item: string) => (
          <li key={item}>{item}</li>
        ))}
      </TagName>
    );
  }
  if (block.type === "table")
    return (
      <div className="overflow-x-auto border border-[#dde3df]">
        <table className="w-full min-w-[620px] text-left text-sm">
          <thead className="bg-[#eef3f0] text-[#2c5046]">
            <tr>
              {(data.headers ?? []).map((header: string) => (
                <th key={header} className="px-4 py-3 font-semibold">
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#e4e8e5]">
            {(data.rows ?? []).map((row: string[], index: number) => (
              <tr key={`${block.id}-${index}`}>
                {row.map((cell, cellIndex) => (
                  <td key={`${cell}-${cellIndex}`} className="px-4 py-3 text-[#5e6b65]">
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  if (block.type === "callout")
    return (
      <aside className="border border-[#e5d4ab] bg-[#fff8e7] p-5">
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#9a6c21]">
          {data.title}
        </p>
        <p className="mt-2 text-sm leading-7 text-[#5d604e]">{data.text}</p>
      </aside>
    );
  if (block.type === "image")
    return (
      <figure>
        <img src={data.url} alt={data.alt ?? ""} className="w-full object-cover" />
        {data.caption && (
          <figcaption className="mt-2 text-xs text-[#7c8782]">{data.caption}</figcaption>
        )}
      </figure>
    );
  if (block.type === "gallery")
    return (
      <div className="grid gap-3 sm:grid-cols-2">
        {(data.images ?? []).map((image: string | { url: string; alt?: string }) => {
          const source = typeof image === "string" ? image : image.url;
          const alt = typeof image === "string" ? "" : (image.alt ?? "");
          return (
            <img key={source} src={source} alt={alt} className="aspect-[4/3] w-full object-cover" />
          );
        })}
      </div>
    );
  if (block.type === "video")
    return (
      <figure>
        <div className="relative aspect-video overflow-hidden bg-[#153e34]">
          {data.url ? (
            <video
              controls
              preload="metadata"
              poster={data.poster}
              className="h-full w-full"
              onPlay={() => void trackPublicAction(post, "video_play")}
            >
              <source src={data.url} />
            </video>
          ) : (
            <>
              <img src={data.poster} alt="" className="h-full w-full object-cover opacity-75" />
              <span className="absolute inset-0 flex items-center justify-center">
                <span className="flex h-14 w-14 items-center justify-center rounded-full bg-white text-[#16473b] shadow-xl">
                  <Play className="ml-1 h-5 w-5 fill-current" />
                </span>
              </span>
            </>
          )}
        </div>
        {data.caption && (
          <figcaption className="mt-2 text-xs text-[#7c8782]">{data.caption}</figcaption>
        )}
      </figure>
    );
  if (block.type === "divider") return <hr className="border-[#dce2de]" />;
  if (block.type === "download")
    return (
      <a
        href={data.url}
        onClick={() => void trackPublicAction(post, "report_download")}
        className="flex items-center justify-between gap-4 border border-[#d9e0dc] bg-[#f5f8f6] p-5 hover:border-[#b7924d]"
      >
        <span className="flex items-center gap-3">
          <FileText className="h-5 w-5 text-[#a5792b]" />
          <span>
            <span className="block font-semibold text-[#244b40]">{data.title}</span>
            <span className="mt-0.5 block text-xs text-[#7a8580]">{data.detail}</span>
          </span>
        </span>
        <Download className="h-4 w-4 text-[#315c50]" />
      </a>
    );
  if (block.type === "property_card" || block.type === "investment_card")
    return (
      <div className="border border-[#dce2de] bg-[#f7f9f7] p-5">
        <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#9c7028]">
          {block.type === "property_card" ? "Related property" : "Investment opportunity"}
        </p>
        <div className="mt-2 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <h3 className="font-serif text-2xl font-semibold text-[#173e35]">{data.name}</h3>
            <p className="mt-1 text-sm text-[#6d7974]">
              {data.location ?? data.minimum} · {data.detail}
            </p>
          </div>
          <Link
            to={data.url ?? "/invest"}
            onClick={() =>
              void trackPublicAction(
                post,
                block.type === "property_card" ? "property_enquiry" : "investment_pack_request",
              )
            }
            className="inline-flex items-center gap-2 text-sm font-semibold text-[#155243]"
          >
            View details <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    );
  if (block.type === "newsletter")
    return (
      <aside className="bg-[#123f35] p-6 text-white sm:p-8">
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#e1bd72]">
          Kay-Steph Journal
        </p>
        <h3 className="mt-2 font-serif text-2xl font-semibold">
          {data.title ?? "Get the next property brief"}
        </h3>
        <p className="mt-2 text-sm leading-6 text-white/65">
          Choose the updates that matter to you. Your subscription is connected to your Kay-Steph
          enquiry history.
        </p>
        <div className="mt-5">
          <NewsletterForm sourcePostSlug={post.slug} dark />
        </div>
      </aside>
    );
  if (block.type === "cta" || block.type === "button")
    return (
      <aside className="border-y border-[#d8dfdb] py-7 text-center">
        <h3 className="font-serif text-2xl font-semibold text-[#173e35]">
          {data.title ?? data.label}
        </h3>
        {data.text && (
          <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-[#6d7974]">{data.text}</p>
        )}
        <Link
          to={data.url ?? "/contact"}
          onClick={() => void trackPublicAction(post, "cta_click")}
          className="mt-5 inline-flex min-h-11 items-center gap-2 bg-[#0d5143] px-6 text-sm font-semibold text-white hover:bg-[#0a4137]"
        >
          {data.label ?? "Continue"}
          <ArrowRight className="h-4 w-4" />
        </Link>
      </aside>
    );
  if (block.type === "columns")
    return (
      <div className="grid gap-5 sm:grid-cols-2">
        {(data.columns ?? []).map((column: string, index: number) => (
          <p key={`${block.id}-${index}`} className="text-sm leading-7 text-[#53615b]">
            {column}
          </p>
        ))}
      </div>
    );
  if (block.type === "custom_html")
    return (
      <iframe
        title="Embedded article content"
        sandbox=""
        srcDoc={String(data.html ?? "")}
        className="min-h-48 w-full border border-[#dce2de] bg-white"
      />
    );
  return null;
}

export function ArticleMeta({ post, dark = false }: { post: ContentPost; dark?: boolean }) {
  return (
    <div
      className={`flex flex-wrap items-center gap-x-4 gap-y-2 text-xs ${dark ? "text-white/75" : "text-[#738079]"}`}
    >
      <Link
        to="/blog/author/$slug"
        params={{ slug: post.author.slug }}
        className={`font-semibold ${dark ? "text-white hover:text-[#e8c779]" : "text-[#255247] hover:text-[#a77725]"}`}
      >
        {post.author.fullName}
      </Link>
      <span className="inline-flex items-center gap-1.5">
        <CalendarDays className="h-3.5 w-3.5" />
        {formatContentDate(post.publishedAt)}
      </span>
      <span className="inline-flex items-center gap-1.5">
        <Clock3 className="h-3.5 w-3.5" />
        {post.readingTimeMinutes} min read
      </span>
      <span className="inline-flex items-center gap-1.5">
        <BookOpen className="h-3.5 w-3.5" />
        Updated {formatContentDate(post.updatedAt)}
      </span>
    </div>
  );
}

export function ArticleShare({ post }: { post: ContentPost }) {
  const url = post.canonicalUrl;
  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(post.title);
  const shares = [
    {
      label: "LinkedIn",
      icon: Linkedin,
      href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
    },
    {
      label: "X",
      icon: Share2,
      href: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`,
    },
    {
      label: "WhatsApp",
      icon: MessageCircle,
      href: `https://wa.me/?text=${encodeURIComponent(post.whatsappShareText || `${post.title} ${url}`)}`,
    },
  ];
  async function copy() {
    await navigator.clipboard.writeText(url);
    void trackPublicAction(post, "social_share", { platform: "copy" });
    toast.success("Article link copied.");
  }
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="mr-1 text-[10px] font-bold uppercase tracking-[0.14em] text-[#87918d]">
        Share
      </span>
      {shares.map(({ label, icon: Icon, href }) => (
        <a
          key={label}
          href={href}
          target="_blank"
          rel="noreferrer"
          onClick={() =>
            void trackPublicAction(post, "social_share", { platform: label.toLowerCase() })
          }
          className="inline-flex h-9 items-center gap-1.5 border border-[#d8dfdb] bg-white px-3 text-xs font-medium text-[#496058] hover:border-[#b78c3e]"
        >
          <Icon className="h-3.5 w-3.5" /> {label}
        </a>
      ))}
      <button
        type="button"
        onClick={copy}
        className="inline-flex h-9 items-center gap-1.5 border border-[#d8dfdb] bg-white px-3 text-xs font-medium text-[#496058] hover:border-[#b78c3e]"
      >
        <Copy className="h-3.5 w-3.5" /> Copy link
      </button>
    </div>
  );
}

export function ArticleTableOfContents({ post }: { post: ContentPost }) {
  const headings = useMemo(
    () =>
      post.contentBlocks
        .filter((block) => block.type === "heading")
        .map((block) => String(block.data.text ?? ""))
        .filter(Boolean),
    [post.contentBlocks],
  );
  if (headings.length < 2) return null;
  return (
    <nav aria-label="Article contents" className="border-l-2 border-[#c3943e] pl-4">
      <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#8e692c]">
        In this article
      </p>
      <ol className="mt-3 space-y-2">
        {headings.map((heading) => (
          <li key={heading}>
            <a
              href={`#${slugifyContent(heading)}`}
              className="text-xs leading-5 text-[#66736d] hover:text-[#0e5041]"
            >
              {heading}
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}

async function trackPublicAction(
  post: ContentPost,
  eventType:
    | "view"
    | "read_progress"
    | "video_play"
    | "social_share"
    | "report_download"
    | "investment_pack_request"
    | "consultation_booking"
    | "event_registration"
    | "property_enquiry"
    | "cta_click",
  metadata: Record<string, unknown> = {},
) {
  if (post.id.startsWith("post-")) return;
  try {
    await trackBlogEngagement({
      data: {
        postSlug: post.slug,
        eventType,
        sourceUrl: window.location.href,
        referrer: document.referrer,
        metadata,
      },
    });
  } catch {
    // Engagement telemetry must never block reading or navigation.
  }
}
