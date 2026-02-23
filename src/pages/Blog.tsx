import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { supabase } from "@/integrations/supabase/client";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { sv } from "date-fns/locale";

const Blog = () => {
  const { data: posts, isLoading } = useQuery({
    queryKey: ["blog-posts-public"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("blog_posts")
        .select("id, title, slug, excerpt, cover_image_url, author_name, published_at")
        .eq("status", "published")
        .not("published_at", "is", null)
        .lte("published_at", new Date().toISOString())
        .order("published_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Hem", item: "https://nocv.se/" },
      { "@type": "ListItem", position: 2, name: "Blogg", item: "https://nocv.se/blogg" },
    ],
  };

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Blogg – Tips om jobb och rekrytering utan CV | NoCV</title>
        <meta name="description" content="Läs artiklar om rekrytering, jobbsökande och karriärtips från NoCV. Vi delar insikter om hur du hittar rätt jobb utan CV." />
        <link rel="canonical" href="https://nocv.se/blogg" />
        <meta property="og:title" content="Blogg – Tips om jobb och rekrytering utan CV | NoCV" />
        <meta property="og:description" content="Artiklar om rekrytering, jobbsökande och karriärtips från NoCV." />
        <meta property="og:url" content="https://nocv.se/blogg" />
        <meta property="og:type" content="website" />
        <meta property="og:image" content="https://nocv.se/images/og-default.jpg" />
        <meta property="og:locale" content="sv_SE" />
        <meta name="twitter:card" content="summary_large_image" />
        <script type="application/ld+json">{JSON.stringify(breadcrumbSchema)}</script>
      </Helmet>
      <Navigation />

      <main className="pt-24 pb-16">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-4xl font-bold font-heading text-foreground mb-2">Blogg</h1>
            <p className="text-muted-foreground text-lg mb-10">
              Tips och insikter om rekrytering, jobbsökande och karriär.
            </p>

            {isLoading ? (
              <div className="space-y-8">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex gap-6">
                    <Skeleton className="w-48 h-32 rounded-lg shrink-0" />
                    <div className="flex-1 space-y-3">
                      <Skeleton className="h-6 w-3/4" />
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-1/3" />
                    </div>
                  </div>
                ))}
              </div>
            ) : posts && posts.length > 0 ? (
              <div className="space-y-8">
                {posts.map((post) => (
                  <article key={post.id} className="group">
                    <Link
                      to={`/blogg/${post.slug}`}
                      className="flex flex-col sm:flex-row gap-6 p-4 -mx-4 rounded-xl hover:bg-muted/50 transition-colors"
                    >
                      {post.cover_image_url && (
                        <img
                          src={post.cover_image_url}
                          alt={post.title}
                          className="w-full sm:w-48 h-32 object-cover rounded-lg"
                          loading="lazy"
                        />
                      )}
                      <div className="flex-1">
                        <h2 className="text-xl font-semibold text-foreground group-hover:text-primary transition-colors mb-2">
                          {post.title}
                        </h2>
                        {post.excerpt && (
                          <p className="text-muted-foreground line-clamp-2 mb-3">{post.excerpt}</p>
                        )}
                        <div className="flex items-center gap-3 text-sm text-muted-foreground">
                          <span>{post.author_name}</span>
                          <span>•</span>
                          <time dateTime={post.published_at!}>
                            {format(new Date(post.published_at!), "d MMMM yyyy", { locale: sv })}
                          </time>
                        </div>
                      </div>
                    </Link>
                  </article>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-12">
                Inga artiklar publicerade ännu. Kom tillbaka snart!
              </p>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Blog;
