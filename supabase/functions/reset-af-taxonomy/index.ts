import { createClient } from 'jsr:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// AF API Base URL - Taxonomy API
const AF_API_BASE = 'https://taxonomy.api.jobtechdev.se';

// Taxonomy types we need
const TAXONOMY_TYPES = [
  'occupation-name',
  'municipality', 
  'employment-type',
  'duration',
  'worktime-extent'
];

// Import correct municipality data with AF concept IDs
import municipalitiesData from './data/af-municipalities.json' with { type: 'json' };

// Employment types fallback data
const EMPLOYMENT_TYPES_FALLBACK = [
  { code: 'kpPX_CNN_gDU', label: 'Tillsvidareanställning (inkl. eventuell provanställning)' },
  { code: '8qLN_bEY_bhk', label: 'Vikariat' },
  { code: 'nuKG_MXb_Yua', label: 'Säsongsarbete' },
  { code: '1paU_aCR_nGn', label: 'Behovsanställning' },
  { code: 'bYfG_jXa_zik', label: 'Frilans' },
  { code: 'h4fe_E7e_UqV', label: 'Extratjänst' },
  { code: 'Jh8f_q9J_pbJ', label: 'Sommarjobb/Feriejobb' }
];

// Duration fallback data
const DURATIONS_FALLBACK = [
  { code: 'a7uU_j21_mkL', label: 'Tillsvidare' },
  { code: '9uK9_HfZ_uGj', label: 'Visstid mer än 6 månader' },
  { code: 'roiG_Mii_fiZ', label: 'Visstid 3-6 månader' },
  { code: 'fPhi_RmE_iUg', label: 'Visstid mindre än 3 månader' }
];

// Worktime extent fallback data
const WORKTIME_EXTENTS_FALLBACK = [
  { code: '6YE1_gAC_R2G', label: 'Heltid' },
  { code: '947z_JGS_Uk2', label: 'Deltid' }
];

// Top 50 occupations fallback data
const OCCUPATIONS = [
  { id: "apaJ_2YB_LuF", label: "Lastbilsförare", ssyk: "8332" },
  { id: "itoJ_h1z_LKr", label: "Lagerarbetare", ssyk: "4321" },
  { id: "hjHe_QXp_Upv", label: "Personlig assistent", ssyk: "5322" },
  { id: "bQRz_gGe_d8j", label: "Undersköterska", ssyk: "5321" },
  { id: "Yxq8_4Bd_FJt", label: "Busschaufför", ssyk: "8331" },
  { id: "WcqW_Ngb_oBj", label: "Vårdbiträde", ssyk: "5329" },
  { id: "iHpu_u2i_xBD", label: "Lokalvårdare", ssyk: "9112" },
  { id: "nqLg_Z5U_FXS", label: "Snickare", ssyk: "7115" },
  { id: "UKfm_ShJ_mgp", label: "Barnskötare", ssyk: "5311" },
  { id: "UGUB_ymo_oWW", label: "Säljare", ssyk: "5223" },
  { id: "ZXM4_2xg_gzV", label: "Städare", ssyk: "9112" },
  { id: "qmpF_ibd_mZ8", label: "Kock", ssyk: "5120" },
  { id: "EPFQ_ejx_2J4", label: "Elektriker", ssyk: "7411" },
  { id: "oZDm_8bJ_iiH", label: "Maskinoperatör", ssyk: "8189" },
  { id: "aTVQ_cS3_J3g", label: "Vaktmästare", ssyk: "5153" },
  { id: "mSRN_WYZ_dAh", label: "VVS-montör", ssyk: "7126" },
  { id: "j8pG_XEG_XiY", label: "Förskollärare", ssyk: "2342" },
  { id: "AUBi_qM1_RBc", label: "Svetsare", ssyk: "7212" },
  { id: "rnPh_xAP_4C9", label: "Byggarbetare", ssyk: "7119" },
  { id: "c2Dg_XL8_pjQ", label: "Servicetekniker", ssyk: "7421" },
  { id: "uXnb_pYj_hq2", label: "Programmerare", ssyk: "2512" },
  { id: "VFyF_oBj_Uc6", label: "Sjuksköterska", ssyk: "2223" },
  { id: "kZFG_Tub_hYv", label: "Fastighetsskötare", ssyk: "5153" },
  { id: "G5fi_Wfv_MGo", label: "Truckförare", ssyk: "8344" },
  { id: "DqaZ_iXU_Fy6", label: "Butikssäljare", ssyk: "5223" },
  { id: "NVUD_uKD_c6i", label: "Restaurangbiträde", ssyk: "9411" },
  { id: "WpEj_t3J_N6D", label: "Ekonomiassistent", ssyk: "4311" },
  { id: "LcFE_kfg_E2P", label: "Löneadministratör", ssyk: "4311" },
  { id: "oeG9_Jia_Anv", label: "Planerare", ssyk: "3323" },
  { id: "d7bS_2XZ_b6m", label: "Redovisningsekonom", ssyk: "2411" },
  { id: "vRpD_F5D_1vZ", label: "Controller", ssyk: "2411" },
  { id: "iTKy_Dft_iKH", label: "HR-specialist", ssyk: "2423" },
  { id: "76u8_fWN_YbZ", label: "Kundtjänstmedarbetare", ssyk: "4222" },
  { id: "NxLS_vkd_rRa", label: "Receptionist", ssyk: "4226" },
  { id: "YqL9_gwh_qGB", label: "Kontorist", ssyk: "4120" },
  { id: "CbFv_i4K_QbC", label: "Administratör", ssyk: "4120" },
  { id: "dVDe_WUt_4Xm", label: "Montör", ssyk: "7233" },
  { id: "Zk9z_E4t_4dw", label: "Rörmokare", ssyk: "7126" },
  { id: "y3bH_VG5_ZzH", label: "Målare", ssyk: "7131" },
  { id: "XuAX_xWN_PjN", label: "Plattsättare", ssyk: "7122" },
  { id: "oUuE_Gzo_2hX", label: "Anläggningsarbetare", ssyk: "9313" },
  { id: "QVrP_TN9_fVa", label: "Maskinställare", ssyk: "7223" },
  { id: "PfxS_5BL_Hh8", label: "Plåtslagare", ssyk: "7213" },
  { id: "f6Vq_hpX_Hhq", label: "CNC-operatör", ssyk: "7223" },
  { id: "jPhw_Eff_f3o", label: "Lärare", ssyk: "2340" },
  { id: "SXJW_PxX_vYA", label: "Barnskötare", ssyk: "5311" },
  { id: "dqFc_nNW_NGu", label: "Fritidspedagog", ssyk: "5312" },
  { id: "nVWs_6n4_Njc", label: "Behandlingsassistent", ssyk: "3412" },
  { id: "RUYy_YSA_bPk", label: "Tandhygienist", ssyk: "3251" },
  { id: "6CWB_iNs_1wJ", label: "Biomedicinsk analytiker", ssyk: "3212" }
];

// Helper function to get fallback data
function getFallbackData(type: string) {
  console.log(`⚠️ Using fallback data for ${type}`);
  
  switch (type) {
    case 'occupation-name':
      return OCCUPATIONS.map(occ => ({
        concept_id: occ.id,
        type: 'occupation-name',
        version: 16,
        code: occ.ssyk || null,
        label: occ.label,
        lang: 'sv',
        updated_at: new Date().toISOString()
      }));
    
    case 'municipality':
      // Use correct AF concept IDs from imported JSON data
      return municipalitiesData.map(m => ({
        concept_id: m.id, // AF concept ID like "jNrY_Gve_R9n"
        type: 'municipality',
        version: 16,
        code: null, // No SCB codes in this dataset
        label: m.label,
        lang: 'sv',
        updated_at: new Date().toISOString()
      }));
    
    case 'employment-type':
      return EMPLOYMENT_TYPES_FALLBACK.map(et => ({
        concept_id: et.code,
        type: 'employment-type',
        version: 16,
        code: null,
        label: et.label,
        lang: 'sv',
        updated_at: new Date().toISOString()
      }));
    
    case 'duration':
      return DURATIONS_FALLBACK.map(dur => ({
        concept_id: dur.code,
        type: 'duration',
        version: 16,
        code: null,
        label: dur.label,
        lang: 'sv',
        updated_at: new Date().toISOString()
      }));
    
    case 'worktime-extent':
      return WORKTIME_EXTENTS_FALLBACK.map(wt => ({
        concept_id: wt.code,
        type: 'worktime-extent',
        version: 16,
        code: null,
        label: wt.label,
        lang: 'sv',
        updated_at: new Date().toISOString()
      }));
    
    default:
      console.log(`No fallback data available for type: ${type}`);
      return [];
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🔄 Starting FRESH AF Taxonomy Import with Fallback Data');
    
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

    // STEP 2: Fetch fresh data with fallback
    console.log('🌐 STEP 2: Fetching data from AF API (with fallback)...');
    
    const allFreshData: any[] = [];
    
    for (const type of TAXONOMY_TYPES) {
      console.log(`  📥 Fetching ${type}...`);
      
      const url = `${AF_API_BASE}/v1/taxonomy/versioned/concepts?type=${type}&version=16`;
      
      try {
        const response = await fetch(url);
        
        if (!response.ok) {
          console.error(`❌ API failed for ${type} (${response.status}) - using fallback`);
          const fallbackData = getFallbackData(type);
          allFreshData.push(...fallbackData);
          console.log(`  ✅ ${type}: Loaded ${fallbackData.length} items from FALLBACK`);
          continue;
        }

        const data = await response.json();
        
        // AF versioned endpoint returns ROOT ARRAY directly
        if (!Array.isArray(data)) {
          console.error(`❌ Invalid response for ${type} - using fallback`);
          const fallbackData = getFallbackData(type);
          allFreshData.push(...fallbackData);
          console.log(`  ✅ ${type}: Loaded ${fallbackData.length} items from FALLBACK`);
          continue;
        }
        
        if (data.length === 0) {
          console.warn(`⚠️ API returned 0 items for ${type} - using fallback`);
          const fallbackData = getFallbackData(type);
          allFreshData.push(...fallbackData);
          console.log(`  ✅ ${type}: Loaded ${fallbackData.length} items from FALLBACK`);
          continue;
        }

        console.log(`  ✅ ${type}: Found ${data.length} items from API`);
        
        // Transform API data
        for (const concept of data) {
          const label = concept['taxonomy/preferred-label'] || concept['taxonomy/definition'] || 'Unknown';
          
          allFreshData.push({
            concept_id: concept['taxonomy/id'],
            type: type,
            version: 16,
            code: concept['legacy-ams-taxonomy-id'] || null,
            label: label,
            lang: 'sv',
            updated_at: new Date().toISOString()
          });
        }
      } catch (error) {
        console.error(`❌ Error fetching ${type}:`, error);
        const fallbackData = getFallbackData(type);
        allFreshData.push(...fallbackData);
        console.log(`  ✅ ${type}: Loaded ${fallbackData.length} items from FALLBACK`);
      }
    }

    console.log(`📊 Total items to insert: ${allFreshData.length}`);

    // STEP 3: Insert fresh data in batches
    console.log('💾 STEP 3: Inserting data...');
    
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
