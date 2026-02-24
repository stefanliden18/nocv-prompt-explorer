import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Helmet } from "react-helmet-async";
import { supabase } from "@/integrations/supabase/client";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { sv } from "date-fns/locale";
import DOMPurify from "dompurify";
import NotFound from "./NotFound";

const BlogPost = () => {
  const { slug } = useParams<{ slug: string }>();

  const { data: post, isLoading, error } = useQuery({
    queryKey: ["blog-post", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("blog_posts")
        .select("*")
        .eq("slug", slug!)
        .eq("status", "published")
        .not("published_at", "is", null)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!slug,
  });

  if (!isLoading && (error || !post)) {
    return <NotFound />;
  }

  const articleSchema = post
    ? {
        "@context": "https://schema.org",
        "@type": "Article",
        headline: post.meta_title || post.title,
        description: post.meta_description || post.excerpt || "",
        image: post.cover_image_url || "https://nocv.se/images/og-default.jpg",
        author: { "@type": "Person", name: post.author_name },
        publisher: {
          "@type": "Organization",
          name: "NoCV",
          logo: { "@type": "ImageObject", url: "https://nocv.se/favicon.ico" },
        },
        datePublished: post.published_at,
        dateModified: post.updated_at,
        mainEntityOfPage: `https://nocv.se/blogg/${post.slug}`,
      }
    : null;

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Hem", item: "https://nocv.se/" },
      { "@type": "ListItem", position: 2, name: "Blogg", item: "https://nocv.se/blogg" },
      ...(post
        ? [{ "@type": "ListItem", position: 3, name: post.title, item: `https://nocv.se/blogg/${post.slug}` }]
        : []),
    ],
  };

  const pageTitle = post?.meta_title || post?.title || "Laddar...";
  const pageDesc = post?.meta_description || post?.excerpt || "";

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>{`${pageTitle} | NoCV Blogg`}</title>
        <meta name="description" content={pageDesc} />
        {post && <link rel="canonical" href={`https://nocv.se/blogg/${post.slug}`} />}
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={pageDesc} />
        {post && <meta property="og:url" content={`https://nocv.se/blogg/${post.slug}`} />}
        <meta property="og:type" content="article" />
        <meta property="og:image" content={post?.cover_image_url || "https://nocv.se/images/og-default.jpg"} />
        <meta property="og:locale" content="sv_SE" />
        <meta name="twitter:card" content="summary_large_image" />
        {articleSchema && (
          <script type="application/ld+json">{JSON.stringify(articleSchema)}</script>
        )}
        <script type="application/ld+json">{JSON.stringify(breadcrumbSchema)}</script>
      </Helmet>
      <Navigation />

      <main className="pt-24 pb-16">
        <div className="container mx-auto px-6">
          <div className="max-w-[800px] mx-auto">
            {isLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-10 w-3/4" />
                <Skeleton className="h-5 w-1/3" />
                <Skeleton className="h-64 w-full rounded-lg" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
              </div>
            ) : post ? (
              <article>
                <header className="mb-8">
                  <h1 className="text-3xl md:text-4xl font-bold font-heading text-foreground mb-4">
                    {post.title}
                  </h1>
                  <div className="flex items-center gap-3 text-muted-foreground mb-6">
                    <span>{post.author_name}</span>
                    <span>•</span>
                    <time dateTime={post.published_at!}>
                      {format(new Date(post.published_at!), "d MMMM yyyy", { locale: sv })}
                    </time>
                  </div>
                  {post.cover_image_url && (
                    <img
                      src={post.cover_image_url}
                      alt={post.title}
                      className="w-full rounded-xl object-cover max-h-[400px]"
                    />
                  )}
                </header>

                <div
                  className="prose prose-lg max-w-none dark:prose-invert text-left [&>p]:mb-6 [&>h2]:mt-10 [&>h2]:mb-4 [&>h3]:mt-8 [&>h3]:mb-3"
                  dangerouslySetInnerHTML={{
                    __html: DOMPurify.sanitize(post.content_html),
                  }}
                />
              </article>
            ) : null}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default BlogPost;
