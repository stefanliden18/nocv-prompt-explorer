import { createClient } from 'jsr:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const AF_API_BASE = 'https://taxonomy.api.jobtechdev.se';

// Taxonomy types to fetch with their versions
const TAXONOMY_TYPES = [
  { type: 'occupation-name', version: 16 },
  { type: 'municipality', version: 1 },
  { type: 'employment-type', version: 1 },
  { type: 'employment-duration', version: 1 },
  { type: 'worktime-extent', version: 16 },
];

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

    // Step 2: Fetch fresh data from AF API
    console.log('📥 Step 2: Fetching fresh taxonomy data from AF API...');
    const allTaxonomyData = [];

    for (const { type, version } of TAXONOMY_TYPES) {
      const url = `${AF_API_BASE}/v1/taxonomy/versioned/concepts/${version}?type=${type}&offset=0&limit=500`;
      console.log(`Fetching ${type} v${version} from ${url}...`);

      try {
        const response = await fetch(url, {
          headers: {
            'Accept': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error(`AF API returned ${response.status} for ${type}`);
        }

        const data = await response.json();
        
        if (!Array.isArray(data) || data.length === 0) {
          throw new Error(`Invalid or empty response for ${type}`);
        }

        console.log(`✅ Fetched ${data.length} items for ${type} v${version}`);

        // Map to simplified format - only concept_id, type, version, label
        const mappedData = data.map((item: any) => ({
          concept_id: item['taxonomy/id'] || item.id || item.concept_id,
          type: type,
          version: version,
          label: item['taxonomy/preferred-label'] || item.term || item.label || item.name || 'Okänd',
          updated_at: new Date().toISOString(),
        }));

        allTaxonomyData.push(...mappedData);
      } catch (error) {
        console.error(`❌ Failed to fetch ${type}:`, error);
        throw new Error(`Failed to fetch taxonomy ${type}: ${error.message}`);
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

    // Step 4: Verify data
    console.log('🔍 Step 4: Verifying inserted data...');
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
        summary[`${type} (v${version})`] = count || 0;
        console.log(`  ${type} (v${version}): ${count} items`);
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
