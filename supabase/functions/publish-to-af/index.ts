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
      'af_duration_code',
      'af_worktime_extent_code'
    ];

    const missingFields = requiredFields.filter(field => !job[field]);
    if (missingFields.length > 0) {
      const errorMsg = `Missing required AF fields: ${missingFields.join(', ')}`;
      console.error('❌ Validation failed:', errorMsg);
      throw new Error(errorMsg);
    }

    console.log('✅ All required fields present');

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

    // Split contact name into firstname and surname
    const nameParts = (job.contact_person_name || '').split(' ');
    const firstname = nameParts[0] || '';
    const surname = nameParts.slice(1).join(' ') || '';

    const afRequestBody = {
      // Obligatoriska administrativa fält
      jobAdResponsibleEmail: "admin@nocv.se",
      employerWebAddress: job.companies.website || "https://nocv.se",
      
      // Grundläggande info
      title: job.title,
      description: description,
      lastPublishDate: job.last_application_date,
      totalJobOpenings: job.total_positions || 1,
      
      // Kategorisering (direkta strängar enligt AF API)
      occupation: job.af_occupation_code,
      employmentType: job.af_employment_type_code,
      worktimeExtent: job.af_worktime_extent_code,
      duration: job.af_duration_code,
      wageType: job.af_wage_type_code || "oG8G_9cW_nRf", // Fast månadslön (default)
      
      // Arbetsplats (obligatoriskt enligt AF API)
      workplaces: [
        {
          name: job.companies.name,
          municipality: job.af_municipality_code,
          postalAddress: {
            street: job.companies.address || "",
            postalCode: job.companies.postal_code || "",
            city: job.companies.city || ""
          }
        }
      ],
      
      // Kontakter (array enligt AF API)
      contacts: [
        {
          firstname: firstname,
          surname: surname,
          email: job.contact_person_email,
          phoneNumber: formatPhoneNumber(job.contact_person_phone),
          title: "Kontaktperson"
        }
      ],
      
      // Ansökan
      application: {
        method: {
          webAddress: `https://nocv.se/jobb/${job.slug}`
        }
      },
      
      // Övrigt
      eures: false,
      keywords: ["OPEN_TO_ALL"]
    };

    console.log('📨 Sending POST request to AF API...');
    console.log('Request payload:', JSON.stringify(afRequestBody, null, 2));

    // Skicka POST till AF API med separata auth headers
    const afResponse = await fetch(`${AF_API_BASE}${AF_ENDPOINT}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Employer-Id': Deno.env.get('NOCV_AF_EMPLOYER_ID') ?? '',
        'client_id': Deno.env.get('AF_CLIENT_ID') ?? '',
        'client_secret': Deno.env.get('AF_CLIENT_SECRET') ?? ''
      },
      body: JSON.stringify(afRequestBody)
    });

    const afResponseData = await afResponse.json();

    if (!afResponse.ok) {
      // Detailed error logging
      console.error('❌ AF API Error Details:');
      console.error('Status:', afResponse.status, afResponse.statusText);
      console.error('Response Headers:', Object.fromEntries(afResponse.headers.entries()));
      console.error('Response Body:', JSON.stringify(afResponseData, null, 2));
      
      // AF-specifik error struktur
      if (afResponseData.trackingId) {
        console.error('🔍 Tracking ID:', afResponseData.trackingId);
      }
      if (afResponseData.cause?.message?.errors) {
        console.error('🔍 Field Errors:', JSON.stringify(afResponseData.cause.message.errors, null, 2));
      }
      if (afResponseData.errors) {
        console.error('🔍 Validation Errors:', JSON.stringify(afResponseData.errors, null, 2));
      }
      if (afResponseData.message) {
        console.error('🔍 Error Message:', afResponseData.message);
      }
      if (afResponseData.error) {
        console.error('🔍 Error:', afResponseData.error);
      }
      
      // Tolkningar baserat på statuskod
      let errorHint = '';
      switch (afResponse.status) {
        case 400:
        case 422:
          errorHint = 'Validation error - check payload fields';
          break;
        case 401:
        case 403:
          errorHint = 'Authentication error - check client_id/client_secret';
          break;
        case 404:
          errorHint = 'Endpoint not found - check URL';
          break;
        case 405:
          errorHint = 'Method not allowed - check HTTP method';
          break;
        case 409:
          errorHint = 'Duplicate - this job might already be published';
          break;
        case 415:
          errorHint = 'Wrong Content-Type header';
          break;
        default:
          errorHint = afResponse.status >= 500 ? 'Server error at AF' : 'Unknown error';
      }
      console.error('💡 Hint:', errorHint);
      
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