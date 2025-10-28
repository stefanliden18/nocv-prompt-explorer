import { createClient } from 'jsr:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// AF API Base URL - RIKTIGT Taxonomy API
const AF_API_BASE = 'https://taxonomy.api.jobtechdev.se/v1/taxonomy';

// ✅ KRITISKT: Taxonomi-versioner enligt AF Partner API dokumentation (sektion 6.2)
// https://arbetsformedlingen.se/for-arbetsgivare/rekrytera/annonsera-i-platsbanken/for-over-annonser-till-platsbanken/koppla-ditt-rekryteringsverktyg-till-platsbanken
const TAXONOMY_TYPES = [
  { type: 'occupation-name', version: 16 },       // ✅ Version 16
  { type: 'municipality', version: 1 },           // ✅ Version 1
  { type: 'employment-type', version: 1 },        // ✅ Version 1
  { type: 'employment-duration', version: 1 },    // ✅ Version 1 (AF använder "employment-duration")
  { type: 'worktime-extent', version: 16 }        // ✅ Version 16
];

// Import municipality data from external JSON file
import municipalitiesData from './data/af-municipalities.json' with { type: 'json' };

// ✅ RIKTIGA Employment types från AF Taxonomy API
const EMPLOYMENT_TYPES_FALLBACK = [
  { code: 'kpPX_CNN_gDU', label: 'Tillsvidareanställning (inkl. eventuell provanställning)' },
  { code: 'sTu5_NBQ_udq', label: 'Tidsbegränsad anställning' },
  { code: 'gro4_cWF_6D7', label: 'Vikariat' },
  { code: '1paU_aCR_nGn', label: 'Behovsanställning' },
  { code: 'EBhX_Qm2_8eX', label: 'Säsongsanställning' }
];

// ✅ RIKTIGA Duration (employment-duration) från AF Taxonomy API
const DURATIONS_FALLBACK = [
  { code: 'a7uU_j21_mkL', label: 'Tills vidare' },
  { code: '9RGe_UxD_FZw', label: '12 månader - upp till 2 år' },
  { code: 'gJRb_akA_95y', label: '6 månader – upp till 12 månader' },
  { code: 'Xj7x_7yZ_jEn', label: '3 månader – upp till 6 månader' },
  { code: 'Sy9J_aRd_ALx', label: '11 dagar - upp till 3 månader' },
  { code: 'cAQ8_TpB_Tdv', label: 'Upp till 10 dagar' }
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

// SSYK-mappning: Yrkesnamn → SSYK-kod för Partner API legacy_id
// Genererad från OCCUPATIONS listan ovan
const SSYK_MAPPING: Record<string, string> = {
  'Lastbilsförare': '8332',
  'Lagerarbetare': '4321',
  'Personlig assistent': '5322',
  'Undersköterska': '5321',
  'Busschaufför': '8331',
  'Vårdbiträde': '5329',
  'Lokalvårdare': '9112',
  'Snickare': '7115',
  'Barnskötare': '5311',
  'Säljare': '5223',
  'Städare': '9112',
  'Kock': '5120',
  'Elektriker': '7411',
  'Maskinoperatör': '8189',
  'Vaktmästare': '5153',
  'VVS-montör': '7126',
  'Förskollärare': '2342',
  'Svetsare': '7212',
  'Byggarbetare': '7119',
  'Servicetekniker': '7421',
  'Programmerare': '2512',
  'Sjuksköterska': '2223',
  'Fastighetsskötare': '5153',
  'Truckförare': '8344',
  'Butikssäljare': '5223',
  'Restaurangbiträde': '9411',
  'Ekonomiassistent': '4311',
  'Löneadministratör': '4311',
  'Planerare': '3323',
  'Redovisningsekonom': '2411',
  'Controller': '2411',
  'HR-specialist': '2423',
  'Kundtjänstmedarbetare': '4222',
  'Receptionist': '4226',
  'Kontorist': '4120',
  'Administratör': '4120',
  'Montör': '7233',
  'Rörmokare': '7126',
  'Målare': '7131',
  'Plattsättare': '7122',
  'Anläggningsarbetare': '9313',
  'Maskinställare': '7223',
  'Plåtslagare': '7213',
  'CNC-operatör': '7223',
  'Lärare': '2340',
  'Fritidspedagog': '5312',
  'Behandlingsassistent': '3412',
  'Tandhygienist': '3251',
  'Biomedicinsk analytiker': '3212',
  
  // Vanliga varianter och synonymer
  'Lastbilschaufför': '8332',
  'Chaufför': '8322',
  'Åkare': '8332',
  'Distributionschaufför': '8322',
  'Förare': '8322',
  'Sjukvårdspersonal': '5321',
  'Vårdpersonal': '5321',
  'Omvårdnadspersonal': '5321',
  'Städpersonal': '9112',
  'Städerska': '9112',
  'Byggnadssnickare': '7115',
  'Möbelsnickare': '7115',
  'Finsnickare': '7115',
  'Försäljare': '5223',
  'Butiksbiträde': '5223',
  'Detaljhandlare': '5223',
  'Köksbiträde': '9412',
  'Restaurangpersonal': '9411',
  'Servitör': '5131',
  'Serveringspersonal': '5131',
  'Produktionstekniker': '3119',
  'Processtekniker': '3119',
  'Driftstekniker': '3119',
  'Underhållstekniker': '7233',
  'Mekaniker': '7231',
  'Fordonsmekaniker': '7231',
  'Bilmekaniker': '7231',
  'Verkstadsmekaniker': '7223',
  'Industrielektriker': '7412',
  'Anläggningselektriker': '7411',
  'Installatör': '7126',
  'VS-montör': '7126',
  'Rörläggare': '7126',
  'Måleriarbetare': '7131',
  'Industrimålare': '7131',
  'Byggmålare': '7131',
  'Murare': '7112',
  'Betongarbetare': '7112',
  'Cementgjutare': '7112',
  'Anläggare': '9313',
  'Vägarbetare': '9313',
  'Markarbetare': '9313',
  'Maskinförare': '8342',
  'Grävmaskinförare': '8342',
  'Hjullastarförare': '8342',
  'Dumperkörare': '8342',
  'Truckförare': '8344',
  'Truckführare': '8344',
  'Lagerist': '4321',
  'Terminalarbetare': '4321',
  'Godshanterare': '9333',
  'Lagerpersonal': '4321',
  'Ekonomichef': '1211',
  'CFO': '1211',
  'Ekonomiansvarig': '1211',
  'HR-chef': '1213',
  'Personalchef': '1213',
  'Personalansvarig': '1213',
  'HR-ansvarig': '1213',
  'IT-chef': '1330',
  'Systemadministratör': '2522',
  'IT-tekniker': '3512',
  'IT-support': '3512',
  'Helpdesk': '3512',
  'Nätverkstekniker': '3513',
  'Systemutvecklare': '2512',
  'Mjukvaruutvecklare': '2512',
  'Webbutvecklare': '2513',
  'Frontendutvecklare': '2513',
  'Backendutvecklare': '2512',
  'Fullstackutvecklare': '2512',
  'Apputvecklare': '2512',
  'Mobil utvecklare': '2512',
  'Databasadministratör': '2521',
  'Läkare': '2210',
  'Distriktsläkare': '2211',
  'Specialist': '2212',
  'Överläkare': '2212',
  'Sjukgymnast': '2264',
  'Fysioterapeut': '2264',
  'Arbetsterapeut': '2265',
  'Kurator': '2635',
  'Socionom': '2635',
  'Socialsekreterare': '2635',
  'Biståndshandläggare': '2635',
  'Grundskollärare': '2341',
  'Högstadielärare': '2341',
  'Gymnasielärare': '2330',
  'Yrkeslärare': '2320',
  'Speciallärare': '2352',
  'Specialpedagog': '2352',
  'Fritidspedagog': '5312',
  'Fritidsledare': '5312',
  'Behandlingspersonal': '3412',
  'Behandlare': '3412',
  'Stödpersonal': '5322',
  'LSS-handläggare': '2635',
  'Projektledare': '2419',
  'Projektchef': '2419',
  'Projektkoordinator': '3339',
  'Inköpare': '3324',
  'Inköpsansvarig': '3324',
  'Inköpschef': '1219',
  'Produktionschef': '1321',
  'Produktionsansvarig': '1321',
  'Produktionsledare': '3122',
  'Produktionsplanerare': '3122',
  'Logistiker': '3333',
  'Logistiksamordnare': '3333',
  'Kvalitetschef': '1323',
  'Kvalitetsansvarig': '1323',
  'Kvalitetssamordnare': '3119',
  'Marknadsförare': '2431',
  'Marknadschef': '1221',
  'Marknadskommunikatör': '2431',
  'Content Manager': '2431',
  'Digital marknadsförare': '2431',
  'SEO-specialist': '2513',
  'Säljare': '5223',
  'Säljledare': '2433',
  'Säljchef': '1221',
  'Account Manager': '2433',
  'Key Account Manager': '2433',
  'Business Developer': '2419',
  'Affärsutvecklare': '2419',
  'VD': '1120',
  'Verkställande direktör': '1120',
  'Platschef': '1120',
  'Chef': '1219',
  'Avdelningschef': '1219',
  'Enhetschef': '1219',
  'Kontorschef': '1219',
  'Arbetsledare': '3339',
  'Lagledare': '3339',
  'Produktionsassistent': '8189',
  'Processoperatör': '8131',
  'Produktionsoperatör': '8131',
  'Maskinoperatör': '8189',
  'Betongindustriarbetare': '8142',
  'Gjutare': '8121',
  'Formgjutare': '8121',
  'Plastindustriarbetare': '8143',
  'Verktygsoperatör': '8122',
  'Verktygsmakare': '7224',
  'Grov arbetare': '9329',
  'Fabriksarbetare': '9329',
  'Industriarbetare': '9329',
  'Trädgårdsarbetare': '9214',
  'Trädgårdsmästare': '6113',
  'Anläggningsskötare': '6113',
  'Parkarbetare': '9214',
  'Odlare': '6121',
  'Växthusträdgårdsmästare': '6121',
  'Lantarbetare': '9211',
  'Jordbruksarbetare': '9211',
  'Djurskötare': '5164',
  'Djurvårdare': '5164'
};

// Helper function to get SSYK code from OCCUPATIONS or SSYK_MAPPING
function getSSYKCode(conceptId: string, label: string): string | null {
  // 1. Try exact concept_id match first (most reliable)
  const occupation = OCCUPATIONS.find(o => o.id === conceptId);
  if (occupation?.ssyk) {
    return occupation.ssyk;
  }
  
  // 2. Try label match with normalization
  const normalizedLabel = label.trim();
  if (SSYK_MAPPING[normalizedLabel]) {
    return SSYK_MAPPING[normalizedLabel];
  }
  
  // 3. No match found
  console.warn(`⚠️ No SSYK code found for: ${conceptId} / ${label}`);
  return null;
}

// Helper function to get fallback data
function getFallbackData(type: string, version: number) {
  console.log(`⚠️ Using fallback data for ${type} (version ${version})`);
  
  switch (type) {
    case 'occupation-name':
      return OCCUPATIONS.map(occ => ({
        concept_id: occ.id,
        legacy_id: occ.ssyk || null,  // ✅ SSYK hamnar i legacy_id
        type: 'occupation-name',
        version: version,
        code: null,  // ✅ NULL för occupation-name
        label: occ.label,
        lang: 'sv',
        updated_at: new Date().toISOString()
      }));
    
    case 'municipality':
      // Use AF's real concept_id from the JSON file
      return municipalitiesData.map((m, index) => ({
        concept_id: m.id,  // ✅ Use AF's actual concept_id (e.g., "jNrY_Gve_R9n")
        type: 'municipality',
        version: version,
        code: null,
        label: m.label,
        lang: 'sv',
        updated_at: new Date().toISOString()
      }));
    
    case 'employment-type':
      return EMPLOYMENT_TYPES_FALLBACK.map(et => ({
        concept_id: et.code,
        type: 'employment-type',
        version: version,
        code: null,
        label: et.label,
        lang: 'sv',
        updated_at: new Date().toISOString()
      }));
    
    case 'employment-duration':
      return DURATIONS_FALLBACK.map(dur => ({
        concept_id: dur.code,
        type: 'employment-duration',  // ✅ AF använder "employment-duration"
        version: version,
        code: null,
        label: dur.label,
        lang: 'sv',
        updated_at: new Date().toISOString()
      }));
    
    case 'worktime-extent':
      return WORKTIME_EXTENTS_FALLBACK.map(wt => ({
        concept_id: wt.code,
        type: 'worktime-extent',
        version: version,
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
      .gte('version', 0); // Match all rows (version is always >= 0)

    if (deleteError) {
      console.error('❌ Failed to delete existing data:', deleteError);
      throw deleteError;
    }
    console.log('✅ All existing data deleted');

    // STEP 2: Fetch fresh data with fallback
    console.log('🌐 STEP 2: Fetching data from AF API (with fallback)...');
    
    const allFreshData: any[] = [];
    
    for (const taxonomyConfig of TAXONOMY_TYPES) {
      const { type, version: expectedVersion } = taxonomyConfig;
      console.log(`  📥 Fetching ${type} (version ${expectedVersion})...`);
      
      // Use embedded municipality data (AF API not reliable)
      if (type === 'municipality') {
        const fallbackData = getFallbackData(type, expectedVersion);
        allFreshData.push(...fallbackData);
        console.log(`  ✅ ${type}: Loaded ${fallbackData.length} items from EMBEDDED DATA`);
        continue;
      }
      
      // ✅ KRITISKT: Använd /versioned/concepts med specifik version enligt AF Partner API docs
      const url = `${AF_API_BASE}/versioned/concepts/${expectedVersion}?type=${type}&offset=0&limit=500`;
      
      try {
        const response = await fetch(url);
        
        if (!response.ok) {
          console.error(`❌ API failed for ${type} (${response.status}) - using fallback`);
          const fallbackData = getFallbackData(type, expectedVersion);
          allFreshData.push(...fallbackData);
          console.log(`  ✅ ${type}: Loaded ${fallbackData.length} items from FALLBACK`);
          continue;
        }

        const data = await response.json();
        
        // AF versioned endpoint returns ROOT ARRAY directly
        if (!Array.isArray(data)) {
          console.error(`❌ Invalid response for ${type} - using fallback`);
          const fallbackData = getFallbackData(type, expectedVersion);
          allFreshData.push(...fallbackData);
          console.log(`  ✅ ${type}: Loaded ${fallbackData.length} items from FALLBACK`);
          continue;
        }
        
        if (data.length === 0) {
          console.warn(`⚠️ API returned 0 items for ${type} - using fallback`);
          const fallbackData = getFallbackData(type, expectedVersion);
          allFreshData.push(...fallbackData);
          console.log(`  ✅ ${type}: Loaded ${fallbackData.length} items from FALLBACK`);
          continue;
        }

        console.log(`  ✅ ${type}: Found ${data.length} items from API`);
        console.log(`  📝 Saving with FORCED version ${expectedVersion} (ignoring any API version metadata)`);
        
        // Transform API data
        for (const concept of data) {
          const label = concept['taxonomy/preferred-label'] || concept['taxonomy/definition'] || 'Unknown';
          
          // ✅ ENDAST occupation-name behöver legacy_id (SSYK), övriga använder concept_id direkt
          const legacyId = type === 'occupation-name' 
            ? (concept['legacy-ams-taxonomy-id'] || getSSYKCode(concept['taxonomy/id'], label))
            : null;  // municipality, employment-type, duration, worktime-extent använder concept_id direkt
          
          allFreshData.push({
            concept_id: concept['taxonomy/id'],
            legacy_id: legacyId,  // ✅ SSYK för occupation
            type: type,
            version: expectedVersion,  // ✅ TVINGA version från TAXONOMY_TYPES, ignorera AF API version
            code: type === 'occupation-name' ? null : (concept['legacy-ams-taxonomy-id'] || null),  // ✅ Ta bort dubblett för occupation
            label: label,
            lang: 'sv',
            updated_at: new Date().toISOString()
          });
        }
      } catch (error) {
        console.error(`❌ Error fetching ${type}:`, error);
        const fallbackData = getFallbackData(type, version);
        allFreshData.push(...fallbackData);
        console.log(`  ✅ ${type}: Loaded ${fallbackData.length} items from FALLBACK`);
      }
    }

    console.log(`📊 Total items collected: ${allFreshData.length}`);

    // Deduplicate by concept_id (safety measure)
    const uniqueData = allFreshData.filter((item, index, self) => 
      index === self.findIndex(t => t.concept_id === item.concept_id)
    );
    
    const removedDuplicates = allFreshData.length - uniqueData.length;
    if (removedDuplicates > 0) {
      console.warn(`⚠️ Removed ${removedDuplicates} duplicate concept_ids`);
    }
    console.log(`✅ Final items to insert: ${uniqueData.length}`);

    // STEP 3: Insert fresh data in batches
    console.log('💾 STEP 3: Inserting data...');
    
    const batchSize = 500;
    let insertedCount = 0;
    
    for (let i = 0; i < uniqueData.length; i += batchSize) {
      const batch = uniqueData.slice(i, i + batchSize);
      
      const { error: insertError } = await supabase
        .from('af_taxonomy')
        .upsert(batch, { onConflict: 'concept_id' });

      if (insertError) {
        console.error(`❌ Insert error at batch ${i}:`, insertError);
        throw insertError;
      }
      
      insertedCount += batch.length;
      console.log(`  ✅ Inserted batch: ${insertedCount}/${uniqueData.length}`);
    }

    // STEP 4: Verify the data
    console.log('🔍 STEP 4: Verifying data...');
    
    const summary: Record<string, any> = {};
    for (const taxonomyType of TAXONOMY_TYPES) {
      const { count } = await supabase
        .from('af_taxonomy')
        .select('*', { count: 'exact', head: true })
        .eq('type', taxonomyType.type)
        .eq('version', taxonomyType.version);
      
      summary[taxonomyType.type] = count || 0;
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
