import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log('Starting AF taxonomy sync from static files...');
    
    // Läs från statiska datafiler istället för API
    console.log('Reading occupation codes from static file...');
    const occupationsResponse = await fetch(
      `${Deno.env.get('SUPABASE_URL')?.replace('/rest/v1', '')}/storage/v1/object/public/static-data/af-occupations.json`
    );
    
    if (!occupationsResponse.ok) {
      console.error('Failed to read occupations file, using bundled data');
      // Fallback: läs från lokal fil i funktionen
      const occupationsUrl = new URL('./data/af-occupations.json', import.meta.url);
      const occupationsText = await Deno.readTextFile(occupationsUrl.pathname);
      var occupations = JSON.parse(occupationsText);
    } else {
      var occupations = await occupationsResponse.json();
    }
    
    console.log(`Loaded ${occupations.length} occupation codes`);
    
    // Läs kommunkoder från statisk fil
    console.log('Reading municipality codes from static file...');
    const municipalitiesResponse = await fetch(
      `${Deno.env.get('SUPABASE_URL')?.replace('/rest/v1', '')}/storage/v1/object/public/static-data/af-municipalities.json`
    );
    
    if (!municipalitiesResponse.ok) {
      console.error('Failed to read municipalities file, using bundled data');
      const municipalitiesUrl = new URL('./data/af-municipalities.json', import.meta.url);
      const municipalitiesText = await Deno.readTextFile(municipalitiesUrl.pathname);
      var municipalities = JSON.parse(municipalitiesText);
    } else {
      var municipalities = await municipalitiesResponse.json();
    }
    
    console.log(`Loaded ${municipalities.length} municipality codes`);

    // Förbered yrkeskoder för upsert (från statisk fil)
    const occupationCodes = occupations.map((occ: any) => ({
      code: occ.id,
      label_sv: occ.label,
      label_en: occ.label_en || null,
      ssyk_code: occ.ssyk || null
    }));

    console.log('Inserting occupation codes into database...');
    const { error: occError } = await supabase
      .from('af_occupation_codes')
      .upsert(occupationCodes, { onConflict: 'code' });

    if (occError) {
      console.error('Error inserting occupation codes:', occError);
      throw occError;
    }
    console.log(`✅ Inserted ${occupationCodes.length} occupation codes`);

    // Förbered kommunkoder för upsert (från statisk fil)
    const municipalityCodes = municipalities.map((mun: any) => ({
      code: mun.id,
      label: mun.label,
      county: mun.county || null
    }));

    console.log('Inserting municipality codes into database...');
    const { error: munError } = await supabase
      .from('af_municipality_codes')
      .upsert(municipalityCodes, { onConflict: 'code' });

    if (munError) {
      console.error('Error inserting municipality codes:', munError);
      throw munError;
    }
    console.log(`✅ Inserted ${municipalityCodes.length} municipality codes`);

    // Infoga anställningstyper (hårdkodade enligt AF-standard)
    const employmentTypes = [
      { code: 'HEL', label: 'Heltid' },
      { code: 'DEL', label: 'Deltid' },
      { code: 'TILF', label: 'Timanställning' },
      { code: 'SASR', label: 'Säsongsarbete' }
    ];

    console.log('Inserting employment type codes into database...');
    const { error: empError } = await supabase
      .from('af_employment_type_codes')
      .upsert(employmentTypes, { onConflict: 'code' });

    if (empError) {
      console.error('Error inserting employment types:', empError);
      throw empError;
    }
    console.log(`✅ Inserted ${employmentTypes.length} employment types`);

    // Infoga varaktighet (hårdkodade enligt AF-standard)
    const durations = [
      { code: 'TIL', label: 'Tillsvidare' },
      { code: 'TID', label: 'Tidsbegränsad anställning' },
      { code: 'VIK', label: 'Vikariat' },
      { code: 'PROJ', label: 'Projektanställning' }
    ];

    console.log('Inserting duration codes into database...');
    const { error: durError } = await supabase
      .from('af_duration_codes')
      .upsert(durations, { onConflict: 'code' });

    if (durError) {
      console.error('Error inserting durations:', durError);
      throw durError;
    }
    console.log(`✅ Inserted ${durations.length} duration codes`);

    console.log('✅ Taxonomy sync completed successfully!');

    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'AF taxonomy sync completed successfully',
        occupations: occupationCodes.length,
        municipalities: municipalityCodes.length,
        employmentTypes: employmentTypes.length,
        durations: durations.length
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Error syncing AF taxonomy:', error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});