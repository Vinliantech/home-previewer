import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight, Linkedin, Mail, UserRound } from "lucide-react";
import { EditorialPostCard } from "@/components/content/Editorial";
import { PageShell } from "@/components/site/PageShell";
import { getPublicContentIndex } from "@/lib/content.functions";
import { type ContentAuthor, type ContentPost } from "@/lib/content";

export const Route = createFileRoute("/blog/author/$slug")({
  loader: () => getPublicContentIndex(),
  head: ({ loaderData, params }) => {
    const posts = (loaderData?.posts ?? []) as ContentPost[];
    const author = posts.find((post) => post.author.slug === params.slug)?.author;
    return {
      meta: [
        { title: author ? `${author.fullName} | Kay-Steph Journal` : "Author | Kay-Steph Journal" },
        { name: "description", content: author?.seoDescription ?? "Kay-Steph Journal author." },
      ],
      links: [{ rel: "canonical", href: `https://kaystephgroup.com/blog/author/${params.slug}` }],
    };
  },
  component: BlogAuthorPage,
});

function BlogAuthorPage() {
  const { slug } = Route.useParams();
  const loaderData = Route.useLoaderData();
  const allPosts = loaderData.posts as ContentPost[];
  const posts = allPosts.filter((post) => post.author.slug === slug);
  const author = posts[0]?.author as ContentAuthor | undefined;

  if (!author) {
    return (
      <PageShell>
        <section className="flex min-h-[70vh] items-center bg-[#f5f7f4] pb-20 pt-[150px]">
          <div className="mx-auto max-w-xl px-4 text-center">
            <UserRound className="mx-auto h-7 w-7 text-[#a77725]" />
            <h1 className="mt-4 font-serif text-4xl font-semibold text-[#173e35]">
              Author not found
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

  const authorSchema = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: author.fullName,
    jobTitle: author.jobTitle,
    description: author.biography,
    email: author.email,
    url: `https://kaystephgroup.com/blog/author/${author.slug}`,
  };

  return (
    <PageShell>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(authorSchema).replace(/</g, "\\u003c") }}
      />
      <header className="bg-[#113f35] pb-16 pt-[145px] text-white sm:pb-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <Link
            to="/blog"
            className="inline-flex items-center gap-2 text-xs font-semibold text-white/65 hover:text-[#e2bf73]"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Kay-Steph Journal
          </Link>
          <div className="mt-10 flex max-w-4xl flex-col gap-6 sm:flex-row sm:items-center">
            {author.profileImageUrl ? (
              <img
                src={author.profileImageUrl}
                alt=""
                className="h-28 w-28 rounded-full object-cover"
              />
            ) : (
              <span className="flex h-28 w-28 shrink-0 items-center justify-center rounded-full bg-white/10 text-[#e2bf73]">
                <UserRound className="h-10 w-10" />
              </span>
            )}
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#e2bf73]">
                Journal author
              </p>
              <h1 className="mt-2 font-serif text-4xl font-semibold sm:text-5xl">
                {author.fullName}
              </h1>
              <p className="mt-2 text-sm font-medium text-white/75">{author.jobTitle}</p>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-white/65">{author.biography}</p>
              <div className="mt-5 flex flex-wrap gap-3">
                {author.email && (
                  <a
                    href={`mailto:${author.email}`}
                    className="inline-flex items-center gap-2 text-xs font-semibold text-white/75 hover:text-[#e2bf73]"
                  >
                    <Mail className="h-3.5 w-3.5" />
                    Email
                  </a>
                )}
                {author.socialLinks.linkedin && (
                  <a
                    href={author.socialLinks.linkedin}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 text-xs font-semibold text-white/75 hover:text-[#e2bf73]"
                  >
                    <Linkedin className="h-3.5 w-3.5" />
                    LinkedIn
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="bg-white py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="flex items-end justify-between border-b border-[#dfe5e1] pb-5">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#a2772d]">
                Published work
              </p>
              <h2 className="mt-2 font-serif text-3xl font-semibold text-[#173e35]">
                Articles by {author.fullName}
              </h2>
            </div>
            <p className="text-xs text-[#7c8782]">{posts.length} posts</p>
          </div>
          <div className="mt-8 grid gap-x-7 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
            {posts.map((post) => (
              <EditorialPostCard key={post.id} post={post} />
            ))}
          </div>
          {!posts.length && (
            <div className="mt-8 border border-[#dde4e0] bg-[#f7f9f7] p-10 text-center text-sm text-[#68756f]">
              No published articles are currently assigned to this author.
            </div>
          )}
        </div>
      </main>
      <div className="border-t border-[#dfe5e1] bg-[#f6f8f6] py-10 text-center">
        <Link
          to="/blog"
          className="inline-flex items-center gap-2 text-sm font-semibold text-[#174f41]"
        >
          Browse the full journal <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </PageShell>
  );
}
