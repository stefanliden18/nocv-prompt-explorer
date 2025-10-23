import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Mappa JobTech Taxonomy concept IDs till AF JobAd API enum-värden
const mapEmploymentType = (conceptId: string): string => {
  const mapping: Record<string, string> = {
    '6a5G_Jy3_5qG': 'PERMANENT',      // Vanlig anställning
    '8qLN_bEY_bhk': 'TEMPORARY',      // Vikariat
    'nuKG_MXb_Yua': 'SEASONAL',       // Säsongsarbete
    'kcfG_GDe_Fum': 'TEMPORARY',      // Behovsanställning
    'bYfG_jXa_zik': 'TEMPORARY',      // Frilans
    'h4fe_E7e_UqV': 'TEMPORARY'       // Extratjänst
  };
  const result = mapping[conceptId] || 'PERMANENT';
  console.log(`🔄 Mapping employmentType: ${conceptId} → ${result}`);
  return result;
};

const mapWorktimeExtent = (conceptId: string): string => {
  const mapping: Record<string, string> = {
    'wYi8_aFg_R1m': 'FULL_TIME',      // Heltid
    'aUF9_eHe_iUe': 'PART_TIME'       // Deltid
  };
  const result = mapping[conceptId] || 'FULL_TIME';
  console.log(`🔄 Mapping worktimeExtent: ${conceptId} → ${result}`);
  return result;
};

const mapDuration = (conceptId: string): string => {
  const mapping: Record<string, string> = {
    'nDg4_eBE_ueQ': 'TILLSVIDARE',      // Tillsvidare
    'k4MG_eqN_aqh': 'VIKARIAT',         // Vikariat
    'aUdG_VuE_fCe': 'BEGRÄNSAD_TID',    // Tidsbegränsad anställning
    '9uK9_HfZ_uGj': 'BEGRÄNSAD_TID',    // Visstid mer än 6 månader
    'roiG_Mii_fiZ': 'BEGRÄNSAD_TID',    // Visstid 3-6 månader
    'fPhi_RmE_iUg': 'BEGRÄNSAD_TID'     // Visstid mindre än 3 månader
  };
  const result = mapping[conceptId] || 'TILLSVIDARE';
  console.log(`🔄 Mapping duration: ${conceptId} → ${result}`);
  return result;
};

// formatMunicipalityCode removed - now using concept_id directly from database

const validateAfCombinations = (employmentType: string, worktimeExtent: string, duration: string): void => {
  console.log('🔍 Validating AF combinations:', { employmentType, worktimeExtent, duration });
  
  // Regel 1: PERMANENT kräver TILLSVIDARE
  if (employmentType === 'PERMANENT' && duration !== 'TILLSVIDARE') {
    throw new Error(`Invalid combination: PERMANENT requires duration TILLSVIDARE (got: ${duration})`);
  }
  
  // Regel 2: TEMPORARY kan inte vara TILLSVIDARE
  if (employmentType === 'TEMPORARY' && duration === 'TILLSVIDARE') {
    throw new Error('Invalid combination: TEMPORARY cannot have duration TILLSVIDARE');
  }
  
  // Regel 3: worktimeExtent måste vara FULL_TIME eller PART_TIME
  if (!['FULL_TIME', 'PART_TIME'].includes(worktimeExtent)) {
    throw new Error(`Invalid worktimeExtent: Must be FULL_TIME or PART_TIME (got: ${worktimeExtent})`);
  }
  
  // Regel 4: SEASONAL kan inte vara TILLSVIDARE
  if (employmentType === 'SEASONAL' && duration === 'TILLSVIDARE') {
    throw new Error('Invalid combination: SEASONAL cannot have duration TILLSVIDARE');
  }
  
  console.log('✅ AF combinations validated successfully');
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
        companies (*),
        municipality:af_municipality_codes!jobs_af_municipality_code_fkey(concept_id)
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

    // Mappa värden
    const mappedEmploymentType = mapEmploymentType(job.af_employment_type_code);
    const mappedWorktimeExtent = mapWorktimeExtent(job.af_worktime_extent_code);
    const mappedDuration = mapDuration(job.af_duration_code);

    // Validera kombinationer INNAN vi bygger payload
    validateAfCombinations(mappedEmploymentType, mappedWorktimeExtent, mappedDuration);

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
      employmentType: mappedEmploymentType,
      worktimeExtent: mappedWorktimeExtent,
      duration: mappedDuration,
      wageType: job.af_wage_type_code || "oG8G_9cW_nRf", // Fast månadslön (default)
      
      // Arbetsplats (obligatoriskt enligt AF API)
      workplaces: [
        {
          name: job.companies.name,
          municipality: job.municipality?.[0]?.concept_id || job.af_municipality_code,
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

    // Debug: Visa mappade värden
    console.log("🔍 AF payload preview:", {
      employmentType: afRequestBody.employmentType,
      worktimeExtent: afRequestBody.worktimeExtent,
      duration: afRequestBody.duration,
      occupation: afRequestBody.occupation,
      municipality: job.municipality?.[0]?.concept_id || job.af_municipality_code,
    });

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