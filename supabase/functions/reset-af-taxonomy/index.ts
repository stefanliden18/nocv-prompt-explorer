import { createClient } from 'jsr:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// AF API Base URL
const AF_API_BASE = 'https://taxonomy.api.jobtechdev.se/v1/taxonomy';

// Taxonomy types we need
const TAXONOMY_TYPES = [
  'occupation-name',
  'municipality',
  'employment-type',
  'employment-duration',
  'worktime-extent',
];

// ============================================================================
// LEGACY MAPPINGS - AF förväntar sig dessa koder
// ============================================================================

// SSYK-koder (Occupation-name → SSYK 4-siffrig kod)
const SSYK_MAPPING: Record<string, string> = {
  'Butikssäljare, fackhandel': '5223',
  'Säljare': '5223',
  'Butiksbiträde': '5223',
  'Kassapersonal': '5230',
  'Servitörer och bartendrar': '5131',
  'Kockar': '5120',
  'Mjukvaruutvecklare': '2512',
  'Systemanalytiker': '2511',
  'Webbmaster och webbadministratörer': '2513',
  'Datatekniker': '3512',
  'Webbtekniker': '3513',
  'Civilingenjörer': '2140',
  'Elektriningenjörer': '2151',
  'Kontorspersonal': '4110',
  'Receptionister': '4226',
  'Kundtjänstpersonal': '4222',
  'Trädgårdsarbetare': '6113',
  'Byggnadssnickare': '7115',
  'Rörarbetare och VVS-montörer': '7126',
  'Elektriker': '7411',
  'Målare': '7131',
  'Maskinoperatörer': '8189',
  'Truckförare': '8344',
  'Lastbilsförare': '8332',
  'Lagerarbetare': '9333',
  'Städare': '9112',
  'Köksbiträden': '9412',
  'Verkställande direktörer och organizationschefer': '1120',
  'Ekonomi- och finanschefer': '1211',
  'Personal- och personalutvecklingschefer': '1212',
  'Försäljnings- och marknadschefer': '1221',
  'IT-chefer': '1330',
};

// Kommunkoder (Municipality → SCB kommunkod)
const MUNICIPALITY_MAPPING: Record<string, string> = {
  'Stockholm': '0180',
  'Solna': '0184',
  'Sundbyberg': '0183',
  'Nacka': '0182',
  'Huddinge': '0126',
  'Göteborg': '1480',
  'Borås': '1490',
  'Malmö': '1280',
  'Lund': '1281',
  'Helsingborg': '1283',
  'Uppsala': '0380',
  'Linköping': '0580',
  'Norrköping': '0581',
  'Västerås': '1980',
  'Örebro': '1880',
  'Jönköping': '0680',
  'Umeå': '2480',
  'Luleå': '2580',
  'Gävle': '2180',
  'Sundsvall': '2281',
  'Eskilstuna': '0484',
  'Karlstad': '1780',
  'Halmstad': '1380',
  'Växjö': '0780',
  'Kalmar': '0880',
};

// Anställningstyper (Employment-type → AF legacy kod)
const EMPLOYMENT_TYPE_MAPPING: Record<string, string> = {
  'Tillsvidareanställning': 'PERMANENT',
  'Tidsbegränsad anställning': 'TEMPORARY',
  'Visstidsanställning': 'TEMPORARY',
  'Vikariat': 'TEMPORARY',
  'Säsongsarbete': 'SEASONAL',
  'Behovsanställning': 'ON_CALL',
  'Sommarjobb': 'SEASONAL',
};

// Varaktighet (Employment-duration → AF legacy kod)
const DURATION_MAPPING: Record<string, string> = {
  'Tills vidare': 'INDEFINITE',
  'Tillsvidare': 'INDEFINITE',
  '3 månader eller kortare': 'UP_TO_3_MONTHS',
  'Längre än 3 månader': 'MORE_THAN_3_MONTHS',
  '6 månader eller längre': '6_MONTHS_OR_MORE',
};

// Arbetstidsomfattning (Worktime-extent → AF legacy kod)
const WORKTIME_EXTENT_MAPPING: Record<string, string> = {
  'Heltid': 'FULL_TIME',
  'Deltid': 'PART_TIME',
};

// Helper function för att få legacy ID
function getLegacyId(label: string, type: string): string | null {
  const normalizedLabel = label.trim();
  
  switch (type) {
    case 'occupation-name':
      return SSYK_MAPPING[normalizedLabel] || null;
    case 'municipality':
      return MUNICIPALITY_MAPPING[normalizedLabel] || null;
    case 'employment-type':
      return EMPLOYMENT_TYPE_MAPPING[normalizedLabel] || null;
    case 'employment-duration':
      return DURATION_MAPPING[normalizedLabel] || null;
    case 'worktime-extent':
      return WORKTIME_EXTENT_MAPPING[normalizedLabel] || null;
    default:
      return null;
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    console.log('🚀 Starting AF Taxonomy sync with legacy mappings...');

    const results: any[] = [];
    let totalFetched = 0;
    let totalWithLegacyFromAPI = 0;
    let totalWithLegacyFromMapping = 0;
    let totalWithoutLegacy = 0;

    // Hämta data för varje taxonomy-typ
    for (const type of TAXONOMY_TYPES) {
      console.log(`\n📥 Fetching ${type}...`);
      
      const items: any[] = [];
      let offset = 0;
      const limit = 1000;
      let hasMore = true;
      let withLegacyFromAPI = 0;
      let withLegacyFromMapping = 0;
      let withoutLegacy = 0;

      while (hasMore) {
        const url = `${AF_API_BASE}/specific?type=${type}&offset=${offset}&limit=${limit}`;
        
        try {
          const response = await fetch(url);
          
          if (!response.ok) {
            console.error(`  ❌ Failed to fetch ${type} at offset ${offset}`);
            break;
          }

          const data = await response.json();
          
          if (!data || data.length === 0) {
            hasMore = false;
            break;
          }

          for (const item of data) {
            const label = item['taxonomy/preferred-label'];
            const definition = item['taxonomy/definition'] || null;
            const conceptId = item.id;
            
            let legacyId: string | null = null;
            
            // 1. Försök få legacy ID från API
            if (item['legacy-ams-taxonomy-id']) {
              legacyId = item['legacy-ams-taxonomy-id'];
              withLegacyFromAPI++;
            }
            // 2. Annars använd fallback-mappning
            else {
              legacyId = getLegacyId(label, type);
              if (legacyId) {
                withLegacyFromMapping++;
              } else {
                withoutLegacy++;
              }
            }

            items.push({
              concept_id: conceptId,
              label,
              definition,
              legacy_id: legacyId,
              type,
            });
          }

          totalFetched += data.length;
          offset += limit;

          if (data.length < limit) {
            hasMore = false;
          }

        } catch (error) {
          console.error(`  ❌ Error fetching ${type}:`, error);
          hasMore = false;
        }
      }

      totalWithLegacyFromAPI += withLegacyFromAPI;
      totalWithLegacyFromMapping += withLegacyFromMapping;
      totalWithoutLegacy += withoutLegacy;

      console.log(`  ✅ ${items.length} items fetched`);
      console.log(`  📋 ${withLegacyFromAPI} with legacy from API`);
      console.log(`  🗺️  ${withLegacyFromMapping} with legacy from mapping`);
      console.log(`  ⚠️  ${withoutLegacy} without legacy`);

      results.push({ type, items });
    }

    // Rensa befintlig data
    console.log('\n🗑️  Clearing existing af_taxonomy table...');
    const { error: deleteError } = await supabaseClient
      .from('af_taxonomy')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');

    if (deleteError) throw deleteError;

    // Sätt in all ny data
    console.log('💾 Inserting new taxonomy data...');
    const allItems = results.flatMap(r => r.items);
    
    const BATCH_SIZE = 500;
    for (let i = 0; i < allItems.length; i += BATCH_SIZE) {
      const batch = allItems.slice(i, i + BATCH_SIZE);
      const { error: insertError } = await supabaseClient
        .from('af_taxonomy')
        .insert(batch);

      if (insertError) {
        console.error(`Error inserting batch ${i / BATCH_SIZE + 1}:`, insertError);
        throw insertError;
      }
      
      console.log(`  ✅ Inserted batch ${i / BATCH_SIZE + 1}/${Math.ceil(allItems.length / BATCH_SIZE)}`);
    }

    const summary = {
      success: true,
      totalFetched,
      totalInserted: allItems.length,
      totalWithLegacyFromAPI,
      totalWithLegacyFromMapping,
      totalWithoutLegacy,
      coveragePercent: Math.round(
        ((totalWithLegacyFromAPI + totalWithLegacyFromMapping) / totalFetched) * 100
      ),
    };

    console.log('\n✅ AF Taxonomy sync completed!');
    console.log('📊 Summary:', JSON.stringify(summary, null, 2));

    return new Response(JSON.stringify(summary), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('❌ Error in reset-af-taxonomy:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: error.stack 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});