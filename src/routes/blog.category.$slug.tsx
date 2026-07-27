import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight, BookOpen } from "lucide-react";
import { EditorialPostCard, NewsletterForm } from "@/components/content/Editorial";
import { PageShell } from "@/components/site/PageShell";
import { getPublicContentIndex } from "@/lib/content.functions";
import { type ContentCategory, type ContentPost } from "@/lib/content";

export const Route = createFileRoute("/blog/category/$slug")({
  loader: () => getPublicContentIndex(),
  head: ({ loaderData, params }) => {
    const posts = (loaderData?.posts ?? []) as ContentPost[];
    const category = posts.find(
      (post) => post.primaryCategory.slug === params.slug,
    )?.primaryCategory;
    return {
      meta: [
        { title: category?.seoTitle ?? "Category | Kay-Steph Journal" },
        {
          name: "description",
          content: category?.seoDescription ?? "Kay-Steph property insights.",
        },
      ],
      links: [{ rel: "canonical", href: `https://kaystephgroup.com/blog/category/${params.slug}` }],
    };
  },
  component: BlogCategoryPage,
});

function BlogCategoryPage() {
  const { slug } = Route.useParams();
  const loaderData = Route.useLoaderData();
  const allPosts = loaderData.posts as ContentPost[];
  const posts = allPosts.filter(
    (post) =>
      post.primaryCategory.slug === slug ||
      post.secondaryCategories.some((category) => category.slug === slug),
  );
  const category = posts[0]?.primaryCategory as ContentCategory | undefined;

  if (!category) {
    return (
      <PageShell>
        <section className="flex min-h-[70vh] items-center bg-[#f5f7f4] pb-20 pt-[150px]">
          <div className="mx-auto max-w-xl px-4 text-center">
            <BookOpen className="mx-auto h-7 w-7 text-[#a77725]" />
            <h1 className="mt-4 font-serif text-4xl font-semibold text-[#173e35]">
              Category not found
            </h1>
            <Link
              to="/blog"
              className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-[#174f41]"
            >
              <ArrowLeft className="h-4 w-4" />
              Return to the journal
            </Link>
          </div>
        </section>
      </PageShell>
    );
  }

  const heroImage = posts[0]?.featuredImageUrl;
  return (
    <PageShell>
      <header className="relative overflow-hidden bg-[#123d33] pb-16 pt-[145px] text-white sm:pb-20">
        {heroImage && (
          <img
            src={heroImage}
            alt=""
            className="absolute inset-0 h-full w-full object-cover opacity-25"
          />
        )}
        <div className="absolute inset-0 bg-[#0a352d]/75" />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6">
          <Link
            to="/blog"
            className="inline-flex items-center gap-2 text-xs font-semibold text-white/65 hover:text-[#e2bf73]"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Kay-Steph Journal
          </Link>
          <p className="mt-9 text-[10px] font-bold uppercase tracking-[0.2em] text-[#e3bf72]">
            Category
          </p>
          <h1 className="mt-3 max-w-3xl font-serif text-4xl font-semibold sm:text-5xl">
            {category.name}
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-white/70">{category.description}</p>
          <p className="mt-5 text-xs text-white/50">
            {posts.length} published {posts.length === 1 ? "article" : "articles"}
          </p>
        </div>
      </header>

      <main className="bg-white py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          {posts.length ? (
            <div className="grid gap-x-7 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
              {posts.map((post) => (
                <EditorialPostCard key={post.id} post={post} />
              ))}
            </div>
          ) : (
            <div className="border border-[#dde4e0] bg-[#f7f9f7] p-10 text-center">
              <p className="text-sm text-[#68756f]">
                No published articles are currently assigned to this category.
              </p>
            </div>
          )}
        </div>
      </main>

      <section className="border-y border-[#dce3df] bg-[#f3f6f3] py-14">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 sm:px-6 lg:grid-cols-[0.8fr_1.2fr] lg:items-center">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#a2772d]">
              Follow this topic
            </p>
            <h2 className="mt-2 font-serif text-3xl font-semibold text-[#173e35]">
              Receive new {category.name.toLowerCase()} insights.
            </h2>
            <p className="mt-3 text-sm leading-6 text-[#6e7974]">
              Your interest and consent are recorded alongside the article source in the Kay-Steph
              CRM.
            </p>
          </div>
          <NewsletterForm sourceCategorySlug={category.slug} />
        </div>
      </section>

      <div className="bg-white py-10 text-center">
        <Link
          to="/blog"
          className="inline-flex items-center gap-2 text-sm font-semibold text-[#174f41]"
        >
          Browse all Journal articles <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </PageShell>
  );
}
