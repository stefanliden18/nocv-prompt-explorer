import { createClient } from 'jsr:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const AF_API_BASE = 'https://taxonomy.api.jobtechdev.se/v1/taxonomy';

// Taxonomy types to fetch with their versions
const TAXONOMY_TYPES = [
  { type: 'occupation-name', version: 16 },
  { type: 'municipality', version: 1 },
  { type: 'employment-type', version: 1 },
  { type: 'employment-duration', version: 1 },
  { type: 'worktime-extent', version: 16 },
] as const;

const MAX_PAGES_PER_TYPE = 10; // Safety limit
const PAGE_SIZE = 500;

// Helper function to fetch all pages for a taxonomy type
async function fetchAllPages(type: string, version: number): Promise<any[]> {
  const allItems: any[] = [];
  let offset = 0;
  let pageNumber = 1;
  
  console.log(`📥 Starting paginated fetch for ${type}...`);
  
  while (pageNumber <= MAX_PAGES_PER_TYPE) {
    const url = `${AF_API_BASE}/main/concepts?type=${type}&version=${version}&offset=${offset}&limit=${PAGE_SIZE}`;
    console.log(`  📄 Fetching page ${pageNumber} (offset=${offset})...`);
    
    try {
      const response = await fetch(url, {
        headers: { 'Accept': 'application/json' },
      });

      if (!response.ok) {
        throw new Error(`AF API returned ${response.status} for ${type}`);
      }

      const data = await response.json();
      
      if (!Array.isArray(data)) {
        throw new Error(`Invalid response format for ${type}`);
      }

      console.log(`  ✅ Page ${pageNumber}: ${data.length} items`);
      
      // If empty page, we're done
      if (data.length === 0) {
        console.log(`  🏁 Reached end of ${type} (empty page)`);
        break;
      }
      
      allItems.push(...data);
      
      // If we got fewer items than PAGE_SIZE, this is the last page
      if (data.length < PAGE_SIZE) {
        console.log(`  🏁 Last page for ${type} (${data.length} < ${PAGE_SIZE})`);
        break;
      }
      
      // Move to next page
      offset += PAGE_SIZE;
      pageNumber++;
      
    } catch (error) {
      console.error(`  ❌ Failed to fetch page ${pageNumber} for ${type}:`, error);
      throw new Error(`Failed to fetch ${type} at page ${pageNumber}: ${error.message}`);
    }
  }
  
  if (pageNumber > MAX_PAGES_PER_TYPE) {
    console.warn(`⚠️ Hit max page limit (${MAX_PAGES_PER_TYPE}) for ${type}`);
  }
  
  console.log(`✅ Total fetched for ${type}: ${allItems.length} items from ${pageNumber - 1} pages`);
  return allItems;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🔄 Starting AF Taxonomy Reset (simplified - concept_id only)');
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Step 1: Delete existing data
    console.log('🗑️ Step 1: Clearing af_taxonomy table...');
    const { error: deleteError } = await supabase
      .from('af_taxonomy')
      .delete()
      .gte('version', 0);

    if (deleteError) {
      console.error('❌ Failed to delete existing data:', deleteError);
      throw deleteError;
    }
    console.log('✅ Table cleared');

    // Step 2: Fetch fresh data from AF API with pagination
    console.log('📥 Step 2: Fetching fresh taxonomy data from AF API (paginated)...');
    const allTaxonomyData = [];

    for (const { type, version } of TAXONOMY_TYPES) {
      try {
        // Fetch all pages for this type with explicit version
        const items = await fetchAllPages(type, version);
        
        if (items.length === 0) {
          console.warn(`⚠️ No items found for ${type} v${version}`);
          continue;
        }

        // Map to simplified format - use explicit version from TAXONOMY_TYPES
        const mappedData = items.map((item: any) => ({
          concept_id: item['taxonomy/id'],
          type: type,
          version: version,
          label: item['taxonomy/preferred-label'],
          updated_at: new Date().toISOString(),
        }));

        allTaxonomyData.push(...mappedData);
        console.log(`✅ Mapped ${items.length} items for ${type} v${version}`);
        
      } catch (error) {
        console.error(`❌ Failed to fetch ${type} v${version}:`, error);
        throw new Error(`Failed to fetch taxonomy ${type} v${version}: ${error.message}`);
      }
    }

    console.log(`✅ Collected ${allTaxonomyData.length} taxonomy items total`);

    // Step 3: Insert fresh data in batches
    console.log('💾 Step 3: Inserting fresh data...');
    const batchSize = 100;
    for (let i = 0; i < allTaxonomyData.length; i += batchSize) {
      const batch = allTaxonomyData.slice(i, i + batchSize);
      const { error: insertError } = await supabase
        .from('af_taxonomy')
        .upsert(batch, {
          onConflict: 'concept_id',
          ignoreDuplicates: false,
        });

      if (insertError) {
        console.error(`❌ Batch insert failed at index ${i}:`, insertError);
        throw insertError;
      }

      console.log(`  ✅ Inserted batch ${Math.floor(i / batchSize) + 1} (${batch.length} items)`);
    }

    // Step 4: Verify data (with delay to ensure DB consistency)
    console.log('🔍 Step 4: Verifying inserted data...');
    await new Promise(resolve => setTimeout(resolve, 1000));
    const summary: Record<string, number> = {};

    for (const { type, version } of TAXONOMY_TYPES) {
      const { count, error } = await supabase
        .from('af_taxonomy')
        .select('*', { count: 'exact', head: true })
        .eq('type', type)
        .eq('version', version);

      if (error) {
        console.error(`❌ Failed to count ${type}:`, error);
      } else {
        summary[type] = count || 0;
        console.log(`  ${type}: ${count} items`);
      }
    }

    const totalCount = Object.values(summary).reduce((a, b) => a + b, 0);
    console.log(`✅ Total: ${totalCount} items`);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'AF Taxonomy reset successfully',
        summary,
        total: totalCount,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('❌ Error resetting AF taxonomy:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
