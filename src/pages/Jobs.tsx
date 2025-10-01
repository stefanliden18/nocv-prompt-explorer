import { useState, useEffect } from "react";
import { Helmet } from 'react-helmet-async';
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { MapPin, Building2, Search } from "lucide-react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

const ITEMS_PER_PAGE = 12;

const Jobs = () => {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState<any[]>([]);
  const [filteredJobs, setFilteredJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [cityFilter, setCityFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [currentPage, setCurrentPage] = useState(1);
  const [cities, setCities] = useState<string[]>([]);
  const [categories, setCategories] = useState<string[]>([]);

  const [totalCount, setTotalCount] = useState(0);

  // Fetch jobs with filters
  useEffect(() => {
    fetchJobs();
  }, [currentPage, cityFilter, categoryFilter, searchQuery]);

  // Fetch initial data for filters
  useEffect(() => {
    fetchFilterOptions();
  }, []);

  const fetchFilterOptions = async () => {
    try {
      const { data, error } = await supabase
        .from('jobs')
        .select('city, category')
        .eq('status', 'published')
        .lte('publish_at', new Date().toISOString());

      if (error) throw error;

      const uniqueCities = [...new Set(data?.map(job => job.city).filter(Boolean))] as string[];
      const uniqueCategories = [...new Set(data?.map(job => job.category).filter(Boolean))] as string[];
      
      setCities(uniqueCities.sort());
      setCategories(uniqueCategories.sort());
    } catch (error) {
      console.error('Error fetching filter options:', error);
    }
  };

  /**
   * Job Query API
   * 
   * Parameters:
   * - search: Text search across title, description, and city
   * - city: Filter by specific city
   * - category: Filter by job category
   * - page: Current page number (1-indexed)
   * - limit: Number of items per page (default: 12)
   * 
   * Returns:
   * - data: Array of published jobs
   * - count: Total number of matching jobs for pagination
   * 
   * Only published jobs are returned (status='published' AND publish_at <= now())
   */
  const fetchJobs = async () => {
    setLoading(true);
    try {
      // Build query with filters
      let query = supabase
        .from('jobs')
        .select(`
          id,
          slug,
          title,
          city,
          category,
          description_md,
          company_id,
          companies (
            name
          )
        `, { count: 'exact' })
        .eq('status', 'published')
        .lte('publish_at', new Date().toISOString());

      // Apply city filter
      if (cityFilter !== "all") {
        query = query.eq('city', cityFilter);
      }

      // Apply category filter
      if (categoryFilter !== "all") {
        query = query.eq('category', categoryFilter);
      }

      // Apply search filter
      if (searchQuery.trim()) {
        query = query.or(`title.ilike.%${searchQuery}%,description_md.ilike.%${searchQuery}%,city.ilike.%${searchQuery}%`);
      }

      // Apply pagination
      const from = (currentPage - 1) * ITEMS_PER_PAGE;
      const to = from + ITEMS_PER_PAGE - 1;
      
      query = query
        .order('created_at', { ascending: false })
        .range(from, to);

      const { data, error, count } = await query;

      if (error) throw error;

      setJobs(data || []);
      setFilteredJobs(data || []);
      setTotalCount(count || 0);
    } catch (error) {
      console.error('Error fetching jobs:', error);
    } finally {
      setLoading(false);
    }
  };

  // Get intro text (first 120 chars of description)
  const getIntroText = (description: string) => {
    if (!description) return "";
    const text = description.replace(/[#*_\[\]]/g, '').trim();
    return text.length > 120 ? text.substring(0, 120) + '...' : text;
  };

  // Pagination calculations
  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleJobDetails = (slug: string) => {
    navigate(`/jobb/${slug}`);
  };

  const handleFilterChange = (type: 'city' | 'category' | 'search', value: string) => {
    setCurrentPage(1); // Reset to first page on filter change
    if (type === 'city') setCityFilter(value);
    if (type === 'category') setCategoryFilter(value);
    if (type === 'search') setSearchQuery(value);
  };

  // Generate dynamic SEO metadata based on filters
  const generatePageTitle = () => {
    let title = 'Lediga jobb';
    if (categoryFilter !== 'all') title = `${categoryFilter}-jobb`;
    if (cityFilter !== 'all') title += ` i ${cityFilter}`;
    if (searchQuery) title += ` - ${searchQuery}`;
    return `${title} | NOCV - Sök jobb utan CV`;
  };

  const generatePageDescription = () => {
    let desc = 'Hitta ditt nästa jobb baserat på vad du kan, inte vad du studerat.';
    if (categoryFilter !== 'all' || cityFilter !== 'all') {
      desc = `Sök bland ${totalCount} lediga jobb`;
      if (categoryFilter !== 'all') desc += ` inom ${categoryFilter}`;
      if (cityFilter !== 'all') desc += ` i ${cityFilter}`;
      desc += ' på NOCV. Ansök utan CV.';
    }
    return desc;
  };

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>{generatePageTitle()}</title>
        <meta name="description" content={generatePageDescription()} />
        <meta property="og:title" content={generatePageTitle()} />
        <meta property="og:description" content={generatePageDescription()} />
        <meta property="og:url" content="https://nocv.se/jobs" />
        <link rel="canonical" href="https://nocv.se/jobs" />
      </Helmet>

      <Navigation />
      
      {/* Header */}
      <section className="pt-24 pb-12 bg-background">
        <div className="container mx-auto px-6">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold font-heading text-foreground mb-4">
              Lediga jobb
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Hitta ditt nästa jobb baserat på vad du kan, inte vad du studerat
            </p>
          </div>

          {/* Filters */}
          <div className="flex flex-col gap-4 max-w-4xl mx-auto mb-8">
            {/* Search bar */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Sök efter jobb, företag eller stad..."
                value={searchQuery}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                className="pl-10 h-12"
              />
            </div>

            {/* Filter dropdowns */}
            <div className="grid sm:grid-cols-2 gap-4">
              <Select value={cityFilter} onValueChange={(value) => handleFilterChange('city', value)}>
                <SelectTrigger className="w-full">
                  <MapPin className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Välj stad" />
                </SelectTrigger>
                <SelectContent className="bg-white border border-border shadow-lg z-50">
                  <SelectItem value="all">Alla städer</SelectItem>
                  {cities.map(city => (
                    <SelectItem key={city} value={city}>
                      {city}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Select value={categoryFilter} onValueChange={(value) => handleFilterChange('category', value)}>
                <SelectTrigger className="w-full">
                  <Building2 className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Välj kategori" />
                </SelectTrigger>
                <SelectContent className="bg-white border border-border shadow-lg z-50">
                  <SelectItem value="all">Alla kategorier</SelectItem>
                  {categories.map(category => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Results counter */}
          {!loading && (
            <div className="text-center mb-8">
              <p className="text-muted-foreground">
                Visar {filteredJobs.length > 0 ? startIndex + 1 : 0}-{Math.min(startIndex + filteredJobs.length, totalCount)} av {totalCount} jobb
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Job listings */}
      <section className="pb-20">
        <div className="container mx-auto px-6">
          {loading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
              {[...Array(12)].map((_, i) => (
                <Card key={i} className="bg-white border border-border">
                  <CardHeader>
                    <Skeleton className="h-6 w-3/4 mb-2" />
                    <Skeleton className="h-4 w-1/2" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-4 w-full mb-2" />
                    <Skeleton className="h-4 w-full mb-2" />
                    <Skeleton className="h-4 w-2/3" />
                  </CardContent>
                  <CardFooter>
                    <Skeleton className="h-10 w-full" />
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : (
            <>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
                {filteredJobs.map((job) => (
                  <Card 
                    key={job.id} 
                    className="bg-white border border-border hover:shadow-card transition-all duration-300 hover:transform hover:scale-[1.02] flex flex-col h-full cursor-pointer"
                    onClick={() => handleJobDetails(job.slug)}
                  >
                    <CardHeader className="pb-4">
                      <div className="flex justify-between items-start mb-2 gap-2">
                        <CardTitle className="text-xl font-semibold text-foreground font-heading line-clamp-2">
                          {job.title}
                        </CardTitle>
                        {job.category && (
                          <Badge variant="secondary" className="bg-secondary/10 text-secondary border-secondary/20 shrink-0">
                            {job.category}
                          </Badge>
                        )}
                      </div>
                      
                      <div className="flex items-center text-muted-foreground text-sm">
                        <MapPin className="w-4 h-4 mr-1 shrink-0" />
                        {job.city || 'Ej angiven'}
                      </div>
                    </CardHeader>

                    <CardContent className="pt-0 flex-grow">
                      <p className="text-muted-foreground text-sm mb-3 font-medium">
                        {job.companies?.name || 'Okänt företag'}
                      </p>
                      <p className="text-foreground leading-relaxed line-clamp-3">
                        {getIntroText(job.description_md || '')}
                      </p>
                    </CardContent>

                    <CardFooter className="pt-4">
                      <Button 
                        variant="secondary" 
                        className="w-full"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleJobDetails(job.slug);
                        }}
                      >
                        Läs mer
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>

              {/* No results message */}
              {filteredJobs.length === 0 && !loading && (
                <div className="text-center py-12">
                  <p className="text-muted-foreground text-lg">
                    Inga jobb hittades med de valda filtren. Prova att ändra dina sökkriterier.
                  </p>
                </div>
              )}

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="mt-12">
                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious 
                          onClick={() => currentPage > 1 && handlePageChange(currentPage - 1)}
                          className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                        />
                      </PaginationItem>
                      
                      {[...Array(totalPages)].map((_, i) => {
                        const page = i + 1;
                        // Show first page, last page, current page, and pages around current
                        if (
                          page === 1 ||
                          page === totalPages ||
                          (page >= currentPage - 1 && page <= currentPage + 1)
                        ) {
                          return (
                            <PaginationItem key={page}>
                              <PaginationLink
                                onClick={() => handlePageChange(page)}
                                isActive={currentPage === page}
                                className="cursor-pointer"
                              >
                                {page}
                              </PaginationLink>
                            </PaginationItem>
                          );
                        } else if (
                          page === currentPage - 2 ||
                          page === currentPage + 2
                        ) {
                          return (
                            <PaginationItem key={page}>
                              <PaginationEllipsis />
                            </PaginationItem>
                          );
                        }
                        return null;
                      })}

                      <PaginationItem>
                        <PaginationNext 
                          onClick={() => currentPage < totalPages && handlePageChange(currentPage + 1)}
                          className={currentPage === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </div>
              )}
            </>
          )}
        </div>
      </section>
      
      <Footer />
    </div>
  );
};

export default Jobs;