import { createClient } from 'jsr:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// AF API Base URL
const AF_API_BASE = 'https://jobsearch.api.jobtechdev.se';

// Taxonomy types we need
const TAXONOMY_TYPES = [
  'occupation-name',
  'municipality', 
  'employment-type',
  'duration',
  'worktime-extent'
];

interface TaxonomyItem {
  id: string;
  legacy_ams_taxonomy_id?: string;
  type: string;
  version: number;
  term?: string;
  label?: {
    sv_SE?: string;
    en_GB?: string;
  };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🔄 Starting FRESH AF Taxonomy Import (Version 16 ONLY)');
    
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // STEP 1: Delete ALL existing data
    console.log('🗑️ STEP 1: Deleting ALL existing data from af_taxonomy...');
    const { error: deleteError } = await supabase
      .from('af_taxonomy')
      .delete()
      .neq('concept_id', ''); // Delete everything

    if (deleteError) {
      console.error('❌ Failed to delete existing data:', deleteError);
      throw deleteError;
    }
    console.log('✅ All existing data deleted');

    // STEP 2: Fetch fresh version 16 data from AF API
    console.log('🌐 STEP 2: Fetching fresh Version 16 data from AF API...');
    
    const allFreshData: any[] = [];
    
    for (const type of TAXONOMY_TYPES) {
      console.log(`  📥 Fetching ${type}...`);
      
      const response = await fetch(`${AF_API_BASE}/taxonomy/v1/${type}`, {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        console.error(`❌ Failed to fetch ${type}: ${response.status}`);
        continue;
      }

      const data: TaxonomyItem[] = await response.json();
      
      // Filter for version 16 only
      const v16Data = data.filter(item => item.version === 16);
      
      console.log(`  ✅ ${type}: Found ${v16Data.length} version 16 items (filtered from ${data.length} total)`);

      // Transform to our format
      for (const item of v16Data) {
        const label = item.term || item.label?.sv_SE || 'Unknown';
        
        allFreshData.push({
          concept_id: item.id,
          type: type,
          version: 16,
          code: item.legacy_ams_taxonomy_id || null,
          label: label,
          lang: 'sv',
          updated_at: new Date().toISOString()
        });
      }
    }

    console.log(`📊 Total Version 16 items to insert: ${allFreshData.length}`);

    // STEP 3: Insert fresh data in batches
    console.log('💾 STEP 3: Inserting fresh Version 16 data...');
    
    const batchSize = 500;
    let insertedCount = 0;
    
    for (let i = 0; i < allFreshData.length; i += batchSize) {
      const batch = allFreshData.slice(i, i + batchSize);
      
      const { error: insertError } = await supabase
        .from('af_taxonomy')
        .insert(batch);

      if (insertError) {
        console.error(`❌ Insert error at batch ${i}:`, insertError);
        throw insertError;
      }
      
      insertedCount += batch.length;
      console.log(`  ✅ Inserted batch: ${insertedCount}/${allFreshData.length}`);
    }

    // STEP 4: Verify the data
    console.log('🔍 STEP 4: Verifying data...');
    
    const { data: verifyData, error: verifyError } = await supabase
      .from('af_taxonomy')
      .select('type, version, count')
      .order('type');

    if (verifyError) {
      console.error('❌ Verification error:', verifyError);
    }

    // Count by type
    const summary: Record<string, any> = {};
    for (const type of TAXONOMY_TYPES) {
      const { count } = await supabase
        .from('af_taxonomy')
        .select('*', { count: 'exact', head: true })
        .eq('type', type)
        .eq('version', 16);
      
      summary[type] = count || 0;
    }

    console.log('✅ COMPLETE! Summary:', summary);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Fresh AF Taxonomy import completed successfully',
        summary: summary,
        totalInserted: insertedCount
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('❌ RESET FAILED:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
