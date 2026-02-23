import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const { data: jobs, error } = await supabase
      .from('jobs')
      .select('slug, updated_at, publish_at')
      .eq('status', 'published')
      .lte('publish_at', new Date().toISOString())
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('Error fetching jobs:', error);
      throw error;
    }

    const today = new Date().toISOString().split('T')[0];

    const staticPages = [
      { loc: 'https://nocv.se/', priority: '1.0', changefreq: 'daily' },
      { loc: 'https://nocv.se/jobs', priority: '0.9', changefreq: 'daily' },
      { loc: 'https://nocv.se/candidates', priority: '0.8', changefreq: 'weekly' },
      { loc: 'https://nocv.se/companies', priority: '0.8', changefreq: 'weekly' },
      { loc: 'https://nocv.se/contact', priority: '0.6', changefreq: 'monthly' },
      { loc: 'https://nocv.se/om-oss', priority: '0.7', changefreq: 'monthly' },
      { loc: 'https://nocv.se/sa-funkar-det', priority: '0.8', changefreq: 'monthly' },
    ];

    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">

${staticPages.map(page => `  <url>
    <loc>${page.loc}</loc>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
    <lastmod>${today}</lastmod>
  </url>`).join('\n')}

${jobs?.map(job => `  <url>
    <loc>https://nocv.se/jobb/${job.slug}</loc>
    <lastmod>${new Date(job.updated_at).toISOString().split('T')[0]}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`).join('\n') || ''}

</urlset>`;

    return new Response(sitemap, {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/xml; charset=utf-8',
        'Cache-Control': 'public, max-age=3600',
      },
    });

  } catch (error) {
    console.error('Error generating sitemap:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to generate sitemap' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
