import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const AF_API_BASE = 'https://api.arbetsformedlingen.se';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🔍 DIAGNOSE: Starting AF Taxonomy API diagnostics...');

    const diagnostics: any = {
      timestamp: new Date().toISOString(),
      tests: []
    };

    // TEST 1: Hämta ett specifikt yrke (Säljare)
    console.log('\n📊 TEST 1: Fetching occupation "Säljare"...');
    try {
      const occResponse = await fetch(
        `${AF_API_BASE}/taxonomy/v1/occupation-name?offset=0&limit=500`,
        { headers: { 'Accept': 'application/json' } }
      );
      const occData = await occResponse.json();
      
      const saljare = occData.concepts?.find((c: any) => 
        c['taxonomy/preferred-label'] === 'Säljare' || 
        c['taxonomy/preferred-label']?.includes('Säljare')
      );

      console.log('🔍 RAW Säljare data:', JSON.stringify(saljare, null, 2));

      diagnostics.tests.push({
        test: 'occupation-saljare',
        success: !!saljare,
        rawData: saljare,
        fields: saljare ? Object.keys(saljare) : [],
        hasLegacyId: saljare ? ('legacy-ams-taxonomy-id' in saljare) : false,
        legacyIdValue: saljare?.['legacy-ams-taxonomy-id'] || null
      });
    } catch (error) {
      console.error('❌ TEST 1 failed:', error);
      diagnostics.tests.push({
        test: 'occupation-saljare',
        success: false,
        error: error.message
      });
    }

    // TEST 2: Hämta kommun (Stockholm)
    console.log('\n📊 TEST 2: Fetching municipality "Stockholm"...');
    try {
      const munResponse = await fetch(
        `${AF_API_BASE}/taxonomy/v1/municipality?offset=0&limit=300`,
        { headers: { 'Accept': 'application/json' } }
      );
      const munData = await munResponse.json();
      
      const stockholm = munData.concepts?.find((c: any) => 
        c['taxonomy/preferred-label'] === 'Stockholm'
      );

      console.log('🔍 RAW Stockholm data:', JSON.stringify(stockholm, null, 2));

      diagnostics.tests.push({
        test: 'municipality-stockholm',
        success: !!stockholm,
        rawData: stockholm,
        fields: stockholm ? Object.keys(stockholm) : [],
        hasLegacyId: stockholm ? ('legacy-ams-taxonomy-id' in stockholm) : false,
        legacyIdValue: stockholm?.['legacy-ams-taxonomy-id'] || null
      });
    } catch (error) {
      console.error('❌ TEST 2 failed:', error);
      diagnostics.tests.push({
        test: 'municipality-stockholm',
        success: false,
        error: error.message
      });
    }

    // TEST 3: Hämta employment-type
    console.log('\n📊 TEST 3: Fetching employment-type...');
    try {
      const empResponse = await fetch(
        `${AF_API_BASE}/taxonomy/v1/employment-type?offset=0&limit=50`,
        { headers: { 'Accept': 'application/json' } }
      );
      const empData = await empResponse.json();
      
      const tillsvidare = empData.concepts?.find((c: any) => 
        c['taxonomy/preferred-label']?.includes('Tillsvidare')
      );

      console.log('🔍 RAW Employment type data:', JSON.stringify(tillsvidare, null, 2));

      diagnostics.tests.push({
        test: 'employment-type-tillsvidare',
        success: !!tillsvidare,
        rawData: tillsvidare,
        fields: tillsvidare ? Object.keys(tillsvidare) : [],
        hasLegacyId: tillsvidare ? ('legacy-ams-taxonomy-id' in tillsvidare) : false,
        legacyIdValue: tillsvidare?.['legacy-ams-taxonomy-id'] || null
      });
    } catch (error) {
      console.error('❌ TEST 3 failed:', error);
      diagnostics.tests.push({
        test: 'employment-type-tillsvidare',
        success: false,
        error: error.message
      });
    }

    // TEST 4: Hämta employment-duration
    console.log('\n📊 TEST 4: Fetching employment-duration...');
    try {
      const durResponse = await fetch(
        `${AF_API_BASE}/taxonomy/v1/employment-duration?offset=0&limit=50`,
        { headers: { 'Accept': 'application/json' } }
      );
      const durData = await durResponse.json();
      
      const tillsVidare = durData.concepts?.find((c: any) => 
        c['taxonomy/preferred-label']?.includes('Tills vidare')
      );

      console.log('🔍 RAW Duration data:', JSON.stringify(tillsVidare, null, 2));

      diagnostics.tests.push({
        test: 'employment-duration-tills-vidare',
        success: !!tillsVidare,
        rawData: tillsVidare,
        fields: tillsVidare ? Object.keys(tillsVidare) : [],
        hasLegacyId: tillsVidare ? ('legacy-ams-taxonomy-id' in tillsVidare) : false,
        legacyIdValue: tillsVidare?.['legacy-ams-taxonomy-id'] || null
      });
    } catch (error) {
      console.error('❌ TEST 4 failed:', error);
      diagnostics.tests.push({
        test: 'employment-duration-tills-vidare',
        success: false,
        error: error.message
      });
    }

    // TEST 5: Hämta worktime-extent
    console.log('\n📊 TEST 5: Fetching worktime-extent...');
    try {
      const wtResponse = await fetch(
        `${AF_API_BASE}/taxonomy/v1/worktime-extent?offset=0&limit=50`,
        { headers: { 'Accept': 'application/json' } }
      );
      const wtData = await wtResponse.json();
      
      const heltid = wtData.concepts?.find((c: any) => 
        c['taxonomy/preferred-label'] === 'Heltid'
      );

      console.log('🔍 RAW Worktime extent data:', JSON.stringify(heltid, null, 2));

      diagnostics.tests.push({
        test: 'worktime-extent-heltid',
        success: !!heltid,
        rawData: heltid,
        fields: heltid ? Object.keys(heltid) : [],
        hasLegacyId: heltid ? ('legacy-ams-taxonomy-id' in heltid) : false,
        legacyIdValue: heltid?.['legacy-ams-taxonomy-id'] || null
      });
    } catch (error) {
      console.error('❌ TEST 5 failed:', error);
      diagnostics.tests.push({
        test: 'worktime-extent-heltid',
        success: false,
        error: error.message
      });
    }

    // SAMMANFATTNING
    const summary = {
      totalTests: diagnostics.tests.length,
      successfulTests: diagnostics.tests.filter((t: any) => t.success).length,
      testsWithLegacyId: diagnostics.tests.filter((t: any) => t.hasLegacyId).length,
      conclusion: ''
    };

    if (summary.testsWithLegacyId === 0) {
      summary.conclusion = '⚠️ INGEN taxonomy returnerar legacy-ams-taxonomy-id från AF API. Vi MÅSTE använda fallback-mappningar (SSYK, kommunkoder etc).';
    } else if (summary.testsWithLegacyId < summary.successfulTests) {
      summary.conclusion = `⚠️ Endast ${summary.testsWithLegacyId}/${summary.successfulTests} taxonomier har legacy-ams-taxonomy-id. Vi behöver fallback-mappningar för resten.`;
    } else {
      summary.conclusion = '✅ Alla taxonomier returnerar legacy-ams-taxonomy-id från AF API.';
    }

    diagnostics.summary = summary;

    console.log('\n📊 FINAL SUMMARY:', JSON.stringify(summary, null, 2));

    return new Response(
      JSON.stringify(diagnostics, null, 2),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );

  } catch (error) {
    console.error('❌ DIAGNOSE ERROR:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        stack: error.stack 
      }),
      { 
        status: 500,
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );
  }
});
