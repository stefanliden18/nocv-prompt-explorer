// Temporary function to fetch REAL concept_ids from AF Taxonomy API
// This will help us get the correct data to replace fake fallback values

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const AF_TAXONOMY_API = 'https://taxonomy.api.jobtechdev.se/v1/taxonomy';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const taxonomyTypes = [
      'employment-type',
      'occupation-name',
      'municipality',
      'worktime-extent',
      'employment-duration' // AF uses "employment-duration" not "duration"
    ];

    const results: Record<string, any[]> = {};

    console.log('🔄 Fetching real AF taxonomy data...');

    for (const type of taxonomyTypes) {
      try {
        const url = `${AF_TAXONOMY_API}/main/concepts?type=${type}&offset=0&limit=500`;
        console.log(`📥 Fetching ${type} from: ${url}`);
        
        const response = await fetch(url);
        
        if (!response.ok) {
          console.error(`❌ Failed to fetch ${type}: ${response.status}`);
          results[type] = [];
          continue;
        }

        const data = await response.json();
        
        // AF API returns an array of concepts
        results[type] = Array.isArray(data) ? data : [];
        
        console.log(`✅ ${type}: ${results[type].length} items fetched`);
        
        // Log first 3 items to see structure
        console.log(`📊 Sample data for ${type}:`, results[type].slice(0, 3));
        
      } catch (error) {
        console.error(`❌ Error fetching ${type}:`, error);
        results[type] = [];
      }
    }

    // Return formatted results
    return new Response(
      JSON.stringify({
        success: true,
        timestamp: new Date().toISOString(),
        results,
        summary: {
          'employment-type': results['employment-type']?.length || 0,
          'occupation-name': results['occupation-name']?.length || 0,
          'municipality': results['municipality']?.length || 0,
          'worktime-extent': results['worktime-extent']?.length || 0,
          'employment-duration': results['employment-duration']?.length || 0,
        }
      }, null, 2),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    );

  } catch (error) {
    console.error('❌ Unexpected error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      },
    );
  }
});
