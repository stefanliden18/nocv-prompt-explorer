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

    // Samma body-struktur som publish
    const stripHtml = (html: string) => html.replace(/<[^>]*>/g, '').trim();
    const description = stripHtml(job.description_md || '');
    const nameParts = job.contact_person_name.split(' ');

    const afRequestBody = {
      jobAdResponsibleEmail: "admin@nocv.se",
      employerWebAddress: job.companies.website || "https://nocv.se",
      contacts: [{
        email: job.contact_person_email,
        firstname: nameParts[0],
        surname: nameParts.slice(1).join(' ') || nameParts[0],
        phoneNumber: job.contact_person_phone,
        title: "Kontaktperson"
      }],
      duration: job.af_duration_code,
      employmentType: job.af_employment_type_code,
      eures: false,
      title: job.title,
      description: description,
      keywords: ["OPEN_TO_ALL"],
      lastPublishDate: job.last_application_date,
      totalJobOpenings: job.total_positions || 1,
      occupation: job.af_occupation_code,
      application: {
        method: {
          code: "OtherApplication",
          url: `https://nocv.se/jobb/${job.slug}`
        }
      },
      workLocation: {
        municipality: job.af_municipality_code,
        country: "199"
      }
    };

    console.log('📨 Sending PUT request to AF API...');
    console.log('Updating AF ad:', job.af_ad_id);

    const afResponse = await fetch(`${AF_API_BASE}${AF_ENDPOINT}/${job.af_ad_id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Employer-Id': Deno.env.get('NOCV_AF_EMPLOYER_ID') ?? '',
        'client_id': Deno.env.get('AF_CLIENT_ID') ?? '',
        'client_secret': Deno.env.get('AF_CLIENT_SECRET') ?? ''
      },
      body: JSON.stringify(afRequestBody)
    });

    if (!afResponse.ok) {
      const errorData = await afResponse.json();
      console.error('❌ AF API update error:', errorData);
      
      await supabase
        .from('jobs')
        .update({ 
          af_error: JSON.stringify(errorData),
          af_last_sync: new Date().toISOString()
        })
        .eq('id', job_id);

      throw new Error(`AF API error (${afResponse.status}): ${JSON.stringify(errorData)}`);
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