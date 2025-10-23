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

    // Validera conditional fields enligt AF dokumentation
    const validateConditionalFields = (job: any) => {
      const requiresWorktimeAndDuration = ['PFZr_Syz_cUq', 'Jh8f_q9J_pbJ']; // ✅ Vanlig anställning (CORRECTED), Sommarjobb
      const forbidsWorktime = ['1paU_aCR_nGn']; // Behovsanställning

      if (requiresWorktimeAndDuration.includes(job.af_employment_type_code)) {
        if (!job.af_worktime_extent_code) {
          throw new Error(`worktimeExtent is mandatory for employmentType ${job.af_employment_type_code}`);
        }
        if (!job.af_duration_code) {
          throw new Error(`duration is mandatory for employmentType ${job.af_employment_type_code}`);
        }
      }

      if (forbidsWorktime.includes(job.af_employment_type_code) && job.af_worktime_extent_code) {
        throw new Error(`worktimeExtent cannot be used with employmentType ${job.af_employment_type_code}`);
      }
    };

    // ✅ Validera förbjudna employment types och kombinationer
    const validateEmploymentType = (job: any) => {
      // Forbidden: Arbete utomlands
      if (job.af_employment_type_code === '9Wuo_2Yb_36E') {
        throw new Error('employmentType "Arbete utomlands" (9Wuo_2Yb_36E) is not allowed by AF');
      }
      
      // Forbidden combination: Sommarjobb + Tillsvidare
      if (job.af_employment_type_code === 'Jh8f_q9J_pbJ' && job.af_duration_code === 'a7uU_j21_mkL') {
        throw new Error('Sommarjobb cannot be combined with duration Tillsvidare');
      }
    };

    // Validera lastPublishDate (1-180 dagar framåt)
    const validateLastPublishDate = (date: string | null) => {
      if (!date) throw new Error('lastPublishDate is required');
      
      const publishDate = new Date(date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const maxDate = new Date(today);
      maxDate.setDate(maxDate.getDate() + 180);
      
      const daysDiff = Math.ceil((publishDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysDiff < 1) {
        throw new Error(`lastPublishDate must be at least 1 day in the future, got ${date}`);
      }
      if (daysDiff > 180) {
        throw new Error(`lastPublishDate cannot be more than 180 days in the future, got ${date}`);
      }
    };

    // ✅ Validera alla fältlängder och format enligt AF dokumentation
    const validateFieldLengths = (job: any) => {
      // Title: 1-75 chars
      if (!job.title || job.title.length < 1) throw new Error('Title is required');
      if (job.title.length > 75) throw new Error(`Title max 75 chars, got ${job.title.length}`);

      // Description: 100-6500 chars (strippad HTML)
      const description = job.description_md?.replace(/<[^>]*>/g, '').trim() || '';
      if (description.length < 100) throw new Error(`Description min 100 chars, got ${description.length}`);
      if (description.length > 6500) throw new Error(`Description max 6500 chars, got ${description.length}`);

      // Contact person name: firstname & surname 1-50 chars each
      const nameParts = (job.contact_person_name || '').split(' ');
      const firstname = nameParts[0] || '';
      const surname = nameParts.slice(1).join(' ') || '';
      if (!firstname || firstname.length < 1 || firstname.length > 50) {
        throw new Error(`Contact firstname must be 1-50 chars, got ${firstname.length}: "${firstname}"`);
      }
      if (!surname || surname.length < 1 || surname.length > 50) {
        throw new Error(`Contact surname must be 1-50 chars, got ${surname.length}: "${surname}"`);
      }

      // Contact: must have email AND/OR phone
      if (!job.contact_person_email && !job.contact_person_phone) {
        throw new Error('Contact must have email and/or phone');
      }

      // Email: 5-100 chars
      if (job.contact_person_email) {
        if (job.contact_person_email.length < 5 || job.contact_person_email.length > 100) {
          throw new Error(`Contact email must be 5-100 chars, got ${job.contact_person_email.length}`);
        }
      }

      // Employer web address: 11-200 chars
      const webAddress = job.companies?.website || "https://nocv.se";
      if (webAddress.length < 11 || webAddress.length > 200) {
        throw new Error(`Employer web address must be 11-200 chars, got ${webAddress.length}`);
      }

      // Workplace name: 1-100 chars
      const workplaceName = String(job.companies?.name || "");
      if (workplaceName.length < 1 || workplaceName.length > 100) {
        throw new Error(`Workplace name must be 1-100 chars, got ${workplaceName.length}`);
      }

      // Postal code: exactly 5 chars for Sweden
      const postalCode = String(job.companies?.postal_code || "");
      if (postalCode.length !== 5) {
        throw new Error(`Postal code must be exactly 5 chars for Sweden, got ${postalCode.length}: "${postalCode}"`);
      }

      // City: 1-50 chars
      const city = String(job.companies?.city || "");
      if (city.length < 1 || city.length > 50) {
        throw new Error(`City must be 1-50 chars, got ${city.length}`);
      }

      // Street: 1-100 chars (if provided)
      const street = String(job.companies?.address || "");
      if (street && (street.length < 1 || street.length > 100)) {
        throw new Error(`Street must be 1-100 chars, got ${street.length}`);
      }

      // Total positions: 1-499
      const totalPositions = job.total_positions || 1;
      if (totalPositions < 1 || totalPositions > 499) {
        throw new Error(`totalJobOpenings must be 1-499, got ${totalPositions}`);
      }

      // Application URL: 11-200 chars
      const applicationUrl = `https://nocv.se/jobb/${job.slug}`;
      if (applicationUrl.length < 11 || applicationUrl.length > 200) {
        throw new Error(`Application URL must be 11-200 chars, got ${applicationUrl.length}`);
      }
    };

    // Validera obligatoriska fält
  const requiredFields = [
    'contact_person_name',
    'last_application_date',
    'af_occupation_code',
    'af_municipality_code',
    'af_employment_type_code'
  ];

    const missingFields = requiredFields.filter(field => !job[field]);
    if (missingFields.length > 0) {
      const errorMsg = `Missing required AF fields: ${missingFields.join(', ')}`;
      console.error('❌ Validation failed:', errorMsg);
      throw new Error(errorMsg);
    }

    // ✅ Kör alla valideringar
    validateFieldLengths(job);
    validateEmploymentType(job);
    validateConditionalFields(job);
    validateLastPublishDate(job.last_application_date);

    console.log('✅ All validation passed');

    // ✅ Format phone number to Swedish format with length validation
    const formatPhoneNumber = (phone: string | null | undefined): string => {
      if (!phone) return '';
      
      let cleaned = phone.replace(/[\s-]/g, '');
      if (cleaned.startsWith('07')) {
        cleaned = '+46' + cleaned.substring(1);
      }
      
      // Phone: 7-20 chars
      if (cleaned.length < 7 || cleaned.length > 20) {
        throw new Error(`Phone number must be 7-20 chars, got ${cleaned.length}: "${cleaned}"`);
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

    // Bygg payload baserat på conditional rules
    const afRequestBody: any = {
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
      wageType: job.af_wage_type_code || "oG8G_9cW_nRf", // Fast månadslön (default)
    };

    // ✅ Lägg till conditional fields endast om employmentType kräver dem (CORRECTED concept ID)
    const requiresWorktimeAndDuration = ['PFZr_Syz_cUq', 'Jh8f_q9J_pbJ']; // Vanlig anställning, Sommarjobb
    if (requiresWorktimeAndDuration.includes(job.af_employment_type_code)) {
      afRequestBody.worktimeExtent = job.af_worktime_extent_code;
      afRequestBody.duration = job.af_duration_code;
      console.log('✅ Added conditional fields worktimeExtent & duration');
    }

    // ✅ Behovsanställning får ALDRIG ha worktimeExtent enligt AF
    if (job.af_employment_type_code === '1paU_aCR_nGn') {
      delete afRequestBody.worktimeExtent;
      console.log('✅ Removed worktimeExtent for behovsanställning');
    }

    // ✅ Fortsätt med resten av payload (inkl. country för Sverige)
    afRequestBody.workplaces = [
      {
        name: String(job.companies.name || ""),
        municipality: job.af_municipality_code,
        postalAddress: {
          street: String(job.companies.address || ""),
          postalCode: String(job.companies.postal_code || ""),
          city: String(job.companies.city || ""),
          country: "i46j_HmG_v64" // ✅ Sverige (required per AF documentation)
        }
      }
    ];
    
    // Kontakter (array enligt AF API)
    afRequestBody.contacts = [
      {
        firstname: firstname,
        surname: surname,
        email: job.contact_person_email,
        phoneNumber: formatPhoneNumber(job.contact_person_phone),
        title: "Kontaktperson"
      }
    ];
    
    // Ansökan
    afRequestBody.application = {
      method: {
        webAddress: `https://nocv.se/jobb/${job.slug}`
      }
    };
    
    // Övrigt
    afRequestBody.eures = false;
    afRequestBody.keywords = ["OPEN_TO_ALL"];

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