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
      .select(`
        *,
        companies (*)
      `)
      .eq('id', job_id)
      .single();

    if (jobError || !job || !job.af_ad_id) {
      console.error('Job not found or not published to AF');
      throw new Error('Job not found or not published to AF');
    }

    console.log('✅ Job found, AF Ad ID:', job.af_ad_id);

    // Format phone number to Swedish format
    const formatPhoneNumber = (phone: string | null | undefined): string => {
      if (!phone) return '';  // Returnera tom sträng istället för undefined
      
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

    console.log('🔍 AF payload taxonomy codes:', {
      occupation: job.af_occupation_code,
      employmentType: job.af_employment_type_code,
      worktimeExtent: job.af_worktime_extent_code,
      duration: job.af_duration_code,
      municipality: job.af_municipality_code
    });

    const afRequestBody = {
      // Obligatoriska administrativa fält
      jobAdResponsibleEmail: "admin@nocv.se",
      employerWebAddress: job.companies.website || "https://nocv.se",
      
      // Grundläggande info
      title: job.title,
      description: description,
      lastPublishDate: job.last_application_date,
      totalJobOpenings: job.total_positions || 1,
      
      // Kategorisering (JobTech Taxonomy concept IDs)
      occupation: job.af_occupation_code,
      employmentType: job.af_employment_type_code,
      worktimeExtent: job.af_worktime_extent_code,
      duration: job.af_duration_code,
      wageType: job.af_wage_type_code || "oG8G_9cW_nRf", // Fast månadslön (default)
      
      // Arbetsplats (obligatoriskt enligt AF API)
      workplaces: [
        {
          name: String(job.companies.name || ""),
          municipality: job.af_municipality_code,
          postalAddress: {
            street: String(job.companies.address || ""),
            postalCode: String(job.companies.postal_code || ""),
            city: String(job.companies.city || "")
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

    // Debug: Visa concept IDs
    console.log("🔍 Final AF payload taxonomy:", {
      occupation: afRequestBody.occupation,
      employmentType: afRequestBody.employmentType,
      worktimeExtent: afRequestBody.worktimeExtent,
      duration: afRequestBody.duration,
      municipality: afRequestBody.workplaces[0].municipality
    });

    // Validera att alla kritiska fält är strängar
    console.log("🔍 AF payload field types:", {
      municipality: `${typeof afRequestBody.workplaces[0].municipality} = "${afRequestBody.workplaces[0].municipality}"`,
      postalCode: `${typeof afRequestBody.workplaces[0].postalAddress.postalCode} = "${afRequestBody.workplaces[0].postalAddress.postalCode}"`,
      phoneNumber: `${typeof afRequestBody.contacts[0].phoneNumber} = "${afRequestBody.contacts[0].phoneNumber}"`,
      occupation: `${typeof afRequestBody.occupation} = "${afRequestBody.occupation}"`
    });

    if (typeof afRequestBody.workplaces[0].municipality !== 'string') {
      throw new Error(`municipality must be string, got ${typeof afRequestBody.workplaces[0].municipality}`);
    }
    if (typeof afRequestBody.workplaces[0].postalAddress.postalCode !== 'string') {
      throw new Error(`postalCode must be string, got ${typeof afRequestBody.workplaces[0].postalAddress.postalCode}`);
    }
    if (typeof afRequestBody.contacts[0].phoneNumber !== 'string') {
      throw new Error(`phoneNumber must be string, got ${typeof afRequestBody.contacts[0].phoneNumber}`);
    }

    console.log('📨 Sending PUT request to AF API...');
    console.log('Updating AF ad:', job.af_ad_id);
    console.log('Request payload:', JSON.stringify(afRequestBody, null, 2));

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

    // Hämta AF:s svar (både status och body)
    const afResponseText = await afResponse.text();
    let afResponseData;
    try {
      afResponseData = JSON.parse(afResponseText);
    } catch {
      afResponseData = { rawResponse: afResponseText };
    }

    console.log('📥 AF Response Status:', afResponse.status);
    console.log('📥 AF Response Body:', JSON.stringify(afResponseData, null, 2));

    // Vid AF-fel: logga, spara i DB, men returnera AF:s faktiska svar
    if (!afResponse.ok) {
      console.error('❌ AF API returned error status:', afResponse.status);
      
      // Detaljerad loggning
      if (afResponseData.trackingId) {
        console.error('🔍 Tracking ID:', afResponseData.trackingId);
      }
      if (afResponseData.cause?.message?.errors) {
        console.error('🔍 Field Errors:', JSON.stringify(afResponseData.cause.message.errors, null, 2));
      }
      if (afResponseData.errors) {
        console.error('🔍 Validation Errors:', JSON.stringify(afResponseData.errors, null, 2));
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
      
      // Spara felet i databasen
      await supabase
        .from('jobs')
        .update({ 
          af_error: JSON.stringify(afResponseData),
          af_last_sync: new Date().toISOString()
        })
        .eq('id', job_id);
      
      // VIKTIGT: Returnera AF:s faktiska status och body till frontend
      return new Response(afResponseText || '{}', {
        status: afResponse.status,
        headers: { 
          ...corsHeaders,
          'Content-Type': afResponse.headers.get('content-type') || 'application/json'
        }
      });
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

    // VIKTIGT: Returnera AF:s faktiska svar till frontend
    return new Response(afResponseText, {
      status: afResponse.status,
      headers: { 
        ...corsHeaders,
        'Content-Type': afResponse.headers.get('content-type') || 'application/json'
      }
    });

  } catch (error) {
    console.error('❌ EDGE FUNCTION CRASHED:', error);
    
    // Detta är en krasch i edge functionen själv, inte ett AF API-fel
    return new Response(
      JSON.stringify({ 
        error: 'EDGE_CRASH',
        message: String(error?.message || error)
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});