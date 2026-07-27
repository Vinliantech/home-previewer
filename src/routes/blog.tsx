import { useMemo, useState } from "react";
import { createFileRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";
import { ArrowRight, BookOpen, Clock3, Play, Search, Sparkles, TrendingUp } from "lucide-react";
import { EditorialPostCard, NewsletterForm } from "@/components/content/Editorial";
import { PageShell } from "@/components/site/PageShell";
import { Input } from "@/components/ui/input";
import { getPublicContentIndex } from "@/lib/content.functions";
import { contentFormatLabel, formatContentDate, type ContentPost } from "@/lib/content";

export const Route = createFileRoute("/blog")({
  loader: () => getPublicContentIndex(),
  head: () => ({
    meta: [
      { title: "Kay-Steph Journal | Property Intelligence and Investment Guides" },
      {
        name: "description",
        content:
          "Property research, Abuja and Lagos market insights, investment education, fractional ownership, group buy and tokenization guides from Kay-Steph.",
      },
      { property: "og:title", content: "Kay-Steph Journal" },
      {
        property: "og:description",
        content: "Property intelligence for confident ownership and investment decisions.",
      },
      { property: "og:type", content: "website" },
    ],
    links: [{ rel: "canonical", href: "https://kaystephgroup.com/blog" }],
  }),
  component: BlogRoute,
});

function BlogRoute() {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  return pathname === "/blog" ? <BlogPage /> : <Outlet />;
}

function BlogPage() {
  const loaderData = Route.useLoaderData();
  const posts = loaderData.posts as ContentPost[];
  const featured = posts.find((post) => post.isFeatured) ?? posts[0];
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [author, setAuthor] = useState("all");
  const [tag, setTag] = useState("all");
  const [visibleCount, setVisibleCount] = useState(6);

  const categories = useMemo(
    () =>
      uniqueBy(
        posts.map((post) => post.primaryCategory),
        (item) => item.slug,
      ),
    [posts],
  );
  const authors = useMemo(
    () =>
      uniqueBy(
        posts.map((post) => post.author),
        (item) => item.slug,
      ),
    [posts],
  );
  const tags = useMemo(
    () =>
      uniqueBy(
        posts.flatMap((post) => post.tags),
        (item) => item.slug,
      ),
    [posts],
  );
  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return posts.filter((post) => {
      if (category !== "all" && post.primaryCategory.slug !== category) return false;
      if (author !== "all" && post.author.slug !== author) return false;
      if (tag !== "all" && !post.tags.some((item) => item.slug === tag)) return false;
      if (!normalized) return true;
      return [
        post.title,
        post.excerpt,
        post.author.fullName,
        post.primaryCategory.name,
        ...post.tags.map((item) => item.name),
      ].some((value) => value.toLowerCase().includes(normalized));
    });
  }, [author, category, posts, query, tag]);

  const latest = filtered.filter((post) => post.id !== featured.id).slice(0, visibleCount);
  const popular = [...posts].sort((a, b) => b.viewCount - a.viewCount).slice(0, 4);
  const marketPosts = posts.filter((post) => post.format === "market_report").slice(0, 3);
  const videoPosts = posts.filter((post) => post.format.includes("video")).slice(0, 3);
  const guidePosts = posts
    .filter((post) => ["property_guide", "investment_guide"].includes(post.format))
    .slice(0, 3);

  // Every hook above has already run, so this early return is rules-of-hooks safe.
  if (!featured) {
    return (
      <PageShell>
        <section className="flex min-h-[70vh] items-center bg-[#f5f7f4] pb-20 pt-[150px]">
          <div className="mx-auto max-w-2xl px-4 text-center sm:px-6">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#a77828]">
              Kay-Steph Journal
            </p>
            <h1 className="mt-4 font-serif text-4xl font-semibold text-[#173e35]">
              No articles have been published yet.
            </h1>
            <p className="mt-4 text-sm leading-7 text-[#6f7b76]">
              The editorial team is preparing the first stories. Subscribe below and we will send
              them to you as they go live.
            </p>
            <div className="mx-auto mt-8 max-w-md text-left">
              <NewsletterForm />
            </div>
          </div>
        </section>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <section className="relative min-h-[650px] overflow-hidden bg-[#123d33] pt-[76px] text-white">
        <img
          src={featured.featuredImageUrl}
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-[#082e27]/75" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#082e27] via-transparent to-[#082e27]/30" />
        <div className="relative mx-auto flex min-h-[574px] max-w-7xl flex-col justify-end px-4 pb-16 sm:px-6 lg:pb-20">
          <div className="max-w-4xl">
            <div className="flex flex-wrap items-center gap-3 text-[10px] font-bold uppercase tracking-[0.18em] text-[#e6c479]">
              <span>Kay-Steph Journal</span>
              <span className="h-1 w-1 rounded-full bg-current" />
              <span>Featured insight</span>
            </div>
            <h1 className="mt-5 max-w-4xl font-serif text-4xl font-semibold leading-[1.06] sm:text-5xl lg:text-6xl">
              {featured.title}
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-white/75 sm:text-lg">
              {featured.excerpt}
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-white/60">
              <span>{featured.author.fullName}</span>
              <span>{formatContentDate(featured.publishedAt)}</span>
              <span className="inline-flex items-center gap-1.5">
                <Clock3 className="h-3.5 w-3.5" /> {featured.readingTimeMinutes} min read
              </span>
            </div>
            <Link
              to="/blog/$slug"
              params={{ slug: featured.slug }}
              className="mt-8 inline-flex min-h-12 items-center gap-2 bg-[#c3943e] px-7 text-sm font-bold text-white hover:bg-[#af8130]"
            >
              Read the report <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      <section className="border-b border-[#dfe5e1] bg-[#f7f8f5] py-7">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="grid gap-3 lg:grid-cols-[minmax(260px,1fr)_190px_190px_190px]">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3.5 top-3.5 h-4 w-4 text-[#7c8882]" />
              <Input
                value={query}
                onChange={(event) => {
                  setQuery(event.target.value);
                  setVisibleCount(6);
                }}
                placeholder="Search the journal"
                className="h-11 border-[#d5ddd9] bg-white pl-10 text-sm"
              />
            </div>
            <EditorialSelect
              label="All categories"
              value={category}
              onChange={(value) => {
                setCategory(value);
                setVisibleCount(6);
              }}
              options={categories.map((item) => ({ value: item.slug, label: item.name }))}
            />
            <EditorialSelect
              label="All authors"
              value={author}
              onChange={(value) => {
                setAuthor(value);
                setVisibleCount(6);
              }}
              options={authors.map((item) => ({ value: item.slug, label: item.fullName }))}
            />
            <EditorialSelect
              label="All tags"
              value={tag}
              onChange={(value) => {
                setTag(value);
                setVisibleCount(6);
              }}
              options={tags.map((item) => ({ value: item.slug, label: item.name }))}
            />
          </div>
          <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
            <button
              type="button"
              onClick={() => setCategory("all")}
              className={`shrink-0 rounded-full border px-4 py-2 text-xs font-semibold ${category === "all" ? "border-[#174b40] bg-[#174b40] text-white" : "border-[#d1dbd6] bg-white text-[#5f6d67]"}`}
            >
              All insights
            </button>
            {categories.slice(0, 7).map((item) => (
              <button
                key={item.slug}
                type="button"
                onClick={() => setCategory(item.slug)}
                className={`shrink-0 rounded-full border px-4 py-2 text-xs font-semibold ${category === item.slug ? "border-[#174b40] bg-[#174b40] text-white" : "border-[#d1dbd6] bg-white text-[#5f6d67]"}`}
              >
                {item.name}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_320px]">
            <div>
              <EditorialHeading
                eyebrow={
                  query || category !== "all" || author !== "all" || tag !== "all"
                    ? "Filtered results"
                    : "Latest stories"
                }
                title={
                  filtered.length
                    ? "Research and guidance for better decisions"
                    : "No stories match these filters"
                }
                detail={`${filtered.length} published ${filtered.length === 1 ? "article" : "articles"}`}
              />
              {latest.length ? (
                <>
                  <div className="mt-8 grid gap-x-7 gap-y-12 sm:grid-cols-2">
                    {latest.map((post) => (
                      <EditorialPostCard key={post.id} post={post} />
                    ))}
                  </div>
                  {visibleCount < filtered.length - 1 && (
                    <div className="mt-12 text-center">
                      <button
                        type="button"
                        onClick={() => setVisibleCount((count) => count + 6)}
                        className="inline-flex min-h-11 items-center border border-[#bfcac5] px-6 text-sm font-semibold text-[#214c40] hover:border-[#a77b2e]"
                      >
                        Load more articles
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <div className="mt-8 border border-[#dde4e0] bg-[#f8faf8] p-10 text-center">
                  <BookOpen className="mx-auto h-7 w-7 text-[#a77b2e]" />
                  <p className="mt-3 text-sm text-[#68756f]">
                    Try a broader search or clear one of the filters.
                  </p>
                </div>
              )}
            </div>

            <aside className="space-y-9">
              <div className="border-t-2 border-[#174b40] pt-5">
                <div className="flex items-center gap-2 text-[#174b40]">
                  <TrendingUp className="h-4 w-4" />
                  <h2 className="text-[11px] font-bold uppercase tracking-[0.18em]">Most read</h2>
                </div>
                <div className="mt-5 divide-y divide-[#e3e8e5]">
                  {popular.map((post, index) => (
                    <Link
                      key={post.id}
                      to="/blog/$slug"
                      params={{ slug: post.slug }}
                      className="grid grid-cols-[28px_1fr] gap-3 py-4 first:pt-0"
                    >
                      <span className="font-serif text-2xl text-[#c5a15c]">0{index + 1}</span>
                      <span>
                        <span className="block font-serif text-base font-semibold leading-snug text-[#24483e] hover:text-[#9b7028]">
                          {post.title}
                        </span>
                        <span className="mt-1 block text-[10px] text-[#87918d]">
                          {post.readingTimeMinutes} min · {post.viewCount.toLocaleString()} reads
                        </span>
                      </span>
                    </Link>
                  ))}
                </div>
              </div>

              <div className="bg-[#123f35] p-6 text-white">
                <Sparkles className="h-5 w-5 text-[#e0bd74]" />
                <h2 className="mt-4 font-serif text-2xl font-semibold">
                  Property intelligence, selected for you.
                </h2>
                <p className="mt-2 text-sm leading-6 text-white/65">
                  Choose the topics you care about and receive only relevant Kay-Steph updates.
                </p>
                <div className="mt-5">
                  <NewsletterForm compact dark />
                </div>
              </div>

              <div className="border-t border-[#d9e0dc] pt-5">
                <h2 className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#6f7b75]">
                  Browse categories
                </h2>
                <div className="mt-3 divide-y divide-[#e4e8e5]">
                  {categories.map((item) => (
                    <Link
                      key={item.slug}
                      to="/blog/category/$slug"
                      params={{ slug: item.slug }}
                      className="flex items-center justify-between py-3 text-sm text-[#3d5a51] hover:text-[#a4782b]"
                    >
                      <span>{item.name}</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  ))}
                </div>
              </div>
            </aside>
          </div>
        </div>
      </section>

      {marketPosts.length > 0 && (
        <section className="bg-[#eef2ef] py-16 sm:py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6">
            <EditorialHeading
              eyebrow="Market intelligence"
              title="Recent market insights"
              detail="Evidence-led notes from active property corridors."
            />
            <div className="mt-8 grid gap-7 md:grid-cols-3">
              {marketPosts.map((post) => (
                <EditorialPostCard key={post.id} post={post} compact />
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="bg-[#102f29] py-16 text-white sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="grid gap-12 lg:grid-cols-2">
            <div>
              <div className="flex items-center gap-2 text-[#e1bc70]">
                <Play className="h-4 w-4" />
                <span className="text-[10px] font-bold uppercase tracking-[0.18em]">
                  Watch and learn
                </span>
              </div>
              <h2 className="mt-3 font-serif text-3xl font-semibold sm:text-4xl">Video insights</h2>
              <p className="mt-3 max-w-lg text-sm leading-7 text-white/65">
                Short explanations of ownership structures, projects and investor reporting. Videos
                never autoplay with sound.
              </p>
            </div>
            <div className="grid gap-6 sm:grid-cols-2">
              {videoPosts.length
                ? videoPosts.map((post) => <EditorialPostCard key={post.id} post={post} compact />)
                : posts
                    .slice(0, 2)
                    .map((post) => <EditorialPostCard key={post.id} post={post} compact />)}
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <EditorialHeading
            eyebrow="Practical learning"
            title="Property guides and investment education"
            detail="Understand the documents, structures and trade-offs before you commit."
          />
          <div className="mt-8 grid gap-7 md:grid-cols-3">
            {guidePosts.map((post) => (
              <EditorialPostCard key={post.id} post={post} compact />
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-[#dfe5e1] bg-[#f5f7f4] py-14">
        <div className="mx-auto grid max-w-7xl gap-7 px-4 sm:px-6 lg:grid-cols-[0.8fr_1.2fr] lg:items-center">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#a77725]">
              Newsletter
            </p>
            <h2 className="mt-3 font-serif text-3xl font-semibold text-[#173f35]">
              One useful property brief at a time.
            </h2>
            <p className="mt-3 text-sm leading-6 text-[#6b7772]">
              Select your interests. Every subscription carries consent and source attribution into
              the Kay-Steph CRM.
            </p>
          </div>
          <NewsletterForm />
        </div>
      </section>
    </PageShell>
  );
}

function EditorialSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: Array<{ value: string; label: string }>;
  onChange: (value: string) => void;
}) {
  return (
    <select
      value={value}
      onChange={(event) => onChange(event.target.value)}
      aria-label={label}
      className="h-11 w-full border border-[#d5ddd9] bg-white px-3 text-sm text-[#43584f] outline-none focus:border-[#a97e31]"
    >
      <option value="all">{label}</option>
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}

function EditorialHeading({
  eyebrow,
  title,
  detail,
}: {
  eyebrow: string;
  title: string;
  detail: string;
}) {
  return (
    <div className="flex flex-col gap-2 border-b border-[#dfe5e1] pb-5 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <p className="text-[10px] font-bold uppercase tracking-[0.19em] text-[#a77725]">
          {eyebrow}
        </p>
        <h2 className="mt-2 max-w-2xl font-serif text-3xl font-semibold text-[#173f35]">{title}</h2>
      </div>
      <p className="text-xs text-[#7c8782]">{detail}</p>
    </div>
  );
}

function uniqueBy<T>(items: T[], key: (item: T) => string) {
  return Array.from(new Map(items.map((item) => [key(item), item])).values());
}
