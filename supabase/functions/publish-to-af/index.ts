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
    console.log('📤 Starting AF publication for job:', job_id);
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Hämta jobbdata med company
    console.log('Fetching job data from database...');
    const { data: job, error: jobError } = await supabase
      .from('jobs')
      .select(`
        *,
        companies (*)
      `)
      .eq('id', job_id)
      .single();

    if (jobError || !job) {
      console.error('Job not found:', jobError?.message);
      throw new Error('Job not found: ' + jobError?.message);
    }

    console.log('✅ Job found:', job.title);

    // Validera obligatoriska fält
    const requiredFields = [
      'contact_person_name',
      'contact_person_email',
      'contact_person_phone',
      'last_application_date',
      'af_occupation_code',
      'af_municipality_code',
      'af_employment_type_code',
      'af_duration_code'
    ];

    const missingFields = requiredFields.filter(field => !job[field]);
    if (missingFields.length > 0) {
      const errorMsg = `Missing required AF fields: ${missingFields.join(', ')}`;
      console.error('❌ Validation failed:', errorMsg);
      throw new Error(errorMsg);
    }

    console.log('✅ All required fields present');

    // Konvertera Markdown/HTML till plain text
    const stripHtml = (html: string) => html.replace(/<[^>]*>/g, '').trim();
    const description = stripHtml(job.description_md || '');
    
    // Splitta kontaktpersonens namn
    const nameParts = job.contact_person_name.split(' ');
    const firstname = nameParts[0];
    const surname = nameParts.slice(1).join(' ') || firstname;

    // Bygg AF API request body
    const afRequestBody = {
      jobAdResponsibleEmail: "admin@nocv.se",
      employerWebAddress: job.companies.website || "https://nocv.se",
      contacts: [{
        email: job.contact_person_email,
        firstname: firstname,
        surname: surname,
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
        country: "199" // Sverige
      }
    };

    console.log('📨 Sending POST request to AF API...');
    console.log('Request body:', JSON.stringify(afRequestBody, null, 2));

    // Create Basic Auth header
    const basicAuth = btoa(`${Deno.env.get('AF_CLIENT_ID')}:${Deno.env.get('AF_CLIENT_SECRET')}`);

    // Skicka POST till AF API
    const afResponse = await fetch(`${AF_API_BASE}${AF_ENDPOINT}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${basicAuth}`,
        'Employer-Id': Deno.env.get('NOCV_AF_EMPLOYER_ID') ?? ''
      },
      body: JSON.stringify(afRequestBody)
    });

    const afResponseData = await afResponse.json();

    if (!afResponse.ok) {
      console.error('❌ AF API error response:', afResponseData);
      
      // Spara felmeddelande i databasen
      await supabase
        .from('jobs')
        .update({ 
          af_error: JSON.stringify(afResponseData),
          af_last_sync: new Date().toISOString()
        })
        .eq('id', job_id);

      throw new Error(`AF API error (${afResponse.status}): ${JSON.stringify(afResponseData)}`);
    }

    // Lyckat svar - spara AF Ad ID
    const afAdId = afResponseData.id;
    console.log('✅ Successfully published to AF with ID:', afAdId);
    
    await supabase
      .from('jobs')
      .update({
        af_published: true,
        af_ad_id: afAdId,
        af_published_at: new Date().toISOString(),
        af_last_sync: new Date().toISOString(),
        af_error: null
      })
      .eq('id', job_id);

    console.log('✅ Database updated with AF publication status');

    return new Response(
      JSON.stringify({ 
        success: true,
        af_ad_id: afAdId,
        platsbanken_url: `https://arbetsformedlingen.se/platsbanken/annonser/${afAdId}`
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Error in publish-to-af:', error);
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