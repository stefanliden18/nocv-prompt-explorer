import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🧪 PARTNER API TEST: Testing with concept_ids from AF documentation');

    const AF_API_BASE_URL = 'https://partner-api.af.se/jobpositions';
    const AF_CLIENT_ID = Deno.env.get('AF_CLIENT_ID');
    const AF_CLIENT_SECRET = Deno.env.get('AF_CLIENT_SECRET');
    const NOCV_AF_EMPLOYER_ID = Deno.env.get('NOCV_AF_EMPLOYER_ID');

    if (!AF_CLIENT_ID || !AF_CLIENT_SECRET || !NOCV_AF_EMPLOYER_ID) {
      throw new Error('Missing AF credentials');
    }

    // Get OAuth token
    console.log('🔑 Getting OAuth token...');
    const tokenResponse = await fetch('https://api.af.se/partner/oauth/v1/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: `grant_type=client_credentials&client_id=${AF_CLIENT_ID}&client_secret=${AF_CLIENT_SECRET}`,
    });

    if (!tokenResponse.ok) {
      throw new Error(`Token request failed: ${tokenResponse.status}`);
    }

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;
    console.log('✅ OAuth token obtained');

    // Test payload using EXACT concept_ids from AF documentation (Direct_Transferred_Job_Posting-4.pdf, page 88-102)
    const testPayload = {
      jobAdResponsibleEmail: 'admin@nocv.se',
      employerWebAddress: 'https://nocv.se',
      title: 'TEST: Diagnostic med AF Dokumentation concept_ids',
      description: 'Detta är ett diagnostiskt test för att verifiera vilka concept_id:n som AF Partner API accepterar. Testannonsen använder concept_id:n direkt från AF:s egen dokumentation (Direct_Transferred_Job_Posting-4.pdf, exempel request body sida 88-102). Om denna test misslyckas betyder det att AF:s dokumentation inte matchar deras Partner API.',
      lastPublishDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days from now
      totalJobOpenings: 1,
      
      // EXACT concept_ids from AF documentation example request body:
      occupation: 'XMbW_XR6_Zeh',        // From AF doc example (page 88)
      employmentType: 'PFZr_Syz_cUq',    // From AF doc example (page 89)
      duration: 'a7uU_j21_mkL',          // From AF doc example (page 90) - this worked in our previous tests
      worktimeExtent: '6YE1_gAC_R2G',    // Our working concept_id (Heltid)
      wageType: 'oG8G_9cW_nRf',          // Fixed monthly salary
      
      workplaces: [
        {
          name: 'NoCV Diagnostics AB',
          municipality: 'jNrY_Gve_R9n',  // Our concept_id for Vallentuna (v1)
          country: 'i46j_HmG_v64',       // Sweden
          postalAddress: {
            street: 'Mörbylundsvägen 8',
            postalCode: '18633',
            city: 'Vallentuna'
          }
        }
      ],
      
      contacts: [
        {
          firstname: 'Test',
          surname: 'Diagnostics',
          email: 'admin@nocv.se',
          phoneNumber: '+46707520500',
          title: 'Testansvarig'
        }
      ],
      
      application: {
        method: {
          webAddress: 'https://nocv.se'
        }
      },
      
      eures: false,
      keywords: ['OPEN_TO_ALL']
    };

    console.log('📋 Test payload (using AF doc examples):');
    console.log(JSON.stringify(testPayload, null, 2));

    // Send to AF Partner API
    console.log('\n📨 Sending test request to AF Partner API...');
    const afResponse = await fetch(AF_API_BASE_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'X-Employer-Id': NOCV_AF_EMPLOYER_ID,
      },
      body: JSON.stringify(testPayload),
    });

    const responseText = await afResponse.text();
    console.log(`\n📥 AF Response Status: ${afResponse.status}`);
    console.log(`📥 AF Response Body:`);
    console.log(responseText);

    let responseData;
    try {
      responseData = JSON.parse(responseText);
    } catch (e) {
      responseData = { rawText: responseText };
    }

    const result: any = {
      test: 'AF Partner API with Documentation concept_ids',
      timestamp: new Date().toISOString(),
      success: afResponse.ok,
      status: afResponse.status,
      testPayload,
      afResponse: responseData,
    };

    if (!afResponse.ok) {
      console.error('\n❌ AF API REJECTED THE REQUEST');
      
      // Parse error details
      if (responseData?.cause?.message?.errors) {
        console.error('🔍 Field Errors:');
        responseData.cause.message.errors.forEach((err: any) => {
          console.error(`  - ${err.field}: ${err.message}`);
        });
        result.fieldErrors = responseData.cause.message.errors;
      }

      result.conclusion = '❌ AF Partner API rejected concept_ids from their own documentation. This indicates either: (1) Documentation is outdated, (2) Partner API uses different taxonomy version, (3) There is a bug in AF\'s API';
    } else {
      console.log('\n✅ AF API ACCEPTED THE REQUEST!');
      result.conclusion = '✅ AF Partner API accepted the concept_ids from their documentation. This proves our code is correct and the issue was with the specific concept_ids from the database.';
      
      if (responseData?.id) {
        result.afAdId = responseData.id;
        console.log(`📝 Created AF Ad ID: ${responseData.id}`);
      }
    }

    console.log('\n📊 CONCLUSION:', result.conclusion);

    return new Response(
      JSON.stringify(result, null, 2),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('💥 Test failed with error:', error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message,
        stack: error.stack,
        conclusion: 'Test kunde inte köras på grund av ett tekniskt fel'
      }),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
