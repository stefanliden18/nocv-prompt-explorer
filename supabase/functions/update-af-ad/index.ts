import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const AF_API_BASE = 'https://apier.arbetsformedlingen.se';
const AF_ENDPOINT = '/direct-transferred-job-posting/v1/prod/jobads';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { job_id } = await req.json();
    console.log('🔄 Starting AF update for job:', job_id);
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { data: job, error: jobError } = await supabase
      .from('jobs')
      .select(`*, companies (*)`)
      .eq('id', job_id)
      .single();

    if (jobError || !job || !job.af_ad_id) {
      console.error('Job not found or not published to AF');
      throw new Error('Job not found or not published to AF');
    }

    console.log('✅ Job found, AF Ad ID:', job.af_ad_id);

    // Format phone number to Swedish format
    const formatPhoneNumber = (phone: string) => {
      let cleaned = phone.replace(/[\s-]/g, '');
      if (cleaned.startsWith('07')) {
        cleaned = '+46' + cleaned.substring(1);
      }
      return cleaned;
    };

    // Prepare payload according to AF API specs
    const stripHtml = (html: string) => html.replace(/<[^>]*>/g, '').trim();
    const description = stripHtml(job.description_md || '');

    const afRequestBody = {
      title: job.title,
      description: description,
      applicationDeadline: job.last_application_date,
      positions: job.total_positions || 1,
      employmentType: job.af_employment_type_code,
      duration: job.af_duration_code,
      occupation: {
        id: job.af_occupation_code
      },
      workplace: {
        municipalityId: job.af_municipality_code,
        country: "199"
      },
      employer: {
        name: job.companies.name,
        organizationNumber: job.companies.org_number || "",
        website: job.companies.website || "https://nocv.se"
      },
      applyUrl: `https://nocv.se/jobb/${job.slug}`,
      contact: {
        name: job.contact_person_name,
        email: job.contact_person_email,
        phone: formatPhoneNumber(job.contact_person_phone)
      },
      eures: false,
      keywords: ["OPEN_TO_ALL"],
      jobAdResponsibleEmail: "admin@nocv.se"
    };

    console.log('📨 Sending PUT request to AF API...');
    console.log('Updating AF ad:', job.af_ad_id);

    // Create Basic Auth header
    const basicAuth = btoa(`${Deno.env.get('AF_CLIENT_ID')}:${Deno.env.get('AF_CLIENT_SECRET')}`);

    const afResponse = await fetch(`${AF_API_BASE}${AF_ENDPOINT}/${job.af_ad_id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${basicAuth}`,
        'Employer-Id': Deno.env.get('NOCV_AF_EMPLOYER_ID') ?? ''
      },
      body: JSON.stringify(afRequestBody)
    });

    if (!afResponse.ok) {
      const afResponseData = await afResponse.json();
      
      // Detailed error logging
      console.error('❌ AF API Error Details:');
      console.error('Status:', afResponse.status, afResponse.statusText);
      console.error('Response Headers:', Object.fromEntries(afResponse.headers.entries()));
      console.error('Response Body:', JSON.stringify(afResponseData, null, 2));
      
      if (afResponseData.errors) {
        console.error('🔍 Validation Errors:', JSON.stringify(afResponseData.errors, null, 2));
      }
      if (afResponseData.message) {
        console.error('🔍 Error Message:', afResponseData.message);
      }
      if (afResponseData.error) {
        console.error('🔍 Error:', afResponseData.error);
      }
      
      await supabase
        .from('jobs')
        .update({ 
          af_error: JSON.stringify(afResponseData),
          af_last_sync: new Date().toISOString()
        })
        .eq('id', job_id);

      throw new Error(`AF API error (${afResponse.status}): ${JSON.stringify(afResponseData)}`);
    }

    console.log('✅ Successfully updated AF ad');

    await supabase
      .from('jobs')
      .update({
        af_last_sync: new Date().toISOString(),
        af_error: null
      })
      .eq('id', job_id);

    console.log('✅ Database updated with sync status');

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Error in update-af-ad:', error);
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