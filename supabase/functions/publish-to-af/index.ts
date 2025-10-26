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

    // === VALIDATE CONCEPT IDS AGAINST AF_TAXONOMY ===
    const validateConceptId = async (
      conceptId: string | null,
      expectedType: string,
      expectedVersion: number,
      fieldName: string
    ): Promise<{ valid: boolean; error?: string }> => {
      if (!conceptId) {
        return { valid: false, error: `${fieldName} saknas` };
      }

      const { data, error } = await supabase
        .from('af_taxonomy')
        .select('concept_id')
        .eq('concept_id', conceptId)
        .eq('type', expectedType)
        .eq('version', expectedVersion)
        .maybeSingle();

      if (error) {
        return { valid: false, error: `DB error validating ${fieldName}: ${error.message}` };
      }

      if (!data) {
        return { 
          valid: false, 
          error: `${fieldName} concept_id '${conceptId}' finns inte i taxonomin (type: ${expectedType}, version: ${expectedVersion})` 
        };
      }

      return { valid: true };
    };

    // Validate all concept IDs
    console.log('🔍 Validating concept IDs against af_taxonomy...');
    
    // FÖRST: Kontrollera obligatoriska fält
    const validationErrors: string[] = [];
    
    // Kolla att worktime finns för Tillsvidareanställning
    if (job.af_employment_type_cid === 'kpPX_CNN_gDU' && !job.af_worktime_extent_cid) {
      validationErrors.push('Arbetstidsomfattning (Heltid/Deltid) är obligatoriskt för Tillsvidareanställning');
    }
    
    console.log('[VALIDATION] Using taxonomy version 16 for all validations');
    
    // SEDAN: Validera concept IDs (endast om de finns)
    const validations = await Promise.all([
      validateConceptId(job.af_occupation_cid, 'occupation-name', 16, 'Occupation'),
      validateConceptId(job.af_municipality_cid, 'municipality', 16, 'Municipality'),
      validateConceptId(job.af_employment_type_cid, 'employment-type', 16, 'Employment Type'),
      job.af_duration_cid ? validateConceptId(job.af_duration_cid, 'duration', 16, 'Duration') : Promise.resolve({ valid: true }),
      job.af_worktime_extent_cid ? validateConceptId(job.af_worktime_extent_cid, 'worktime-extent', 16, 'Worktime Extent') : Promise.resolve({ valid: true })
    ]);

    validationErrors.push(...validations.filter(v => !v.valid).map(v => v.error!));

    if (validationErrors.length > 0) {
      console.error('[VALIDATION] Failed:', validationErrors);
      const errorMessage = validationErrors.join('; ');
      
      await supabase
        .from('jobs')
        .update({ 
          af_error: errorMessage,
          af_last_sync: new Date().toISOString()
        })
        .eq('id', job_id);

      return new Response(
        JSON.stringify({ 
          error: 'Validation failed', 
          details: validationErrors 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('✅ All concept IDs validated successfully');

    // ✅ AF API kombinationsregler (baserat på officiell dokumentation)
    const AF_RULES = {
      // Dessa anställningstyper KRÄVER automatiskt "Tillsvidare" som duration
      autoSetTillsvidare: [
        'PFZr_Syz_cUq',    // Vanlig anställning
        'kpPX_CNN_gDU'     // Tillsvidareanställning (inkl. provanställning)
      ],
      
      // Dessa anställningstyper KRÄVER duration (tidsbegränsade)
      requiresDuration: [
        '1paU_aCR_nGn', // Behovsanställning
        'h4fe_E7e_UqV', // Extratjänst
        'bYfG_jXa_zik', // Frilans
        'nuKG_MXb_Yua', // Säsongsarbete
        'EBhX_Qm2_8eX', // Säsongsanställning
        'Jh8f_q9J_pbJ', // Sommarjobb
        'sTu5_NBQ_udq', // Tidsbegränsad anställning
        '8qLN_bEY_bhk', // Vikariat
        'gro4_cWF_6D7'  // Vikariat (dublett)
      ],
      
      // Dessa anställningstyper FÖRBJUDER worktimeExtent
      forbidsWorktimeExtent: ['1paU_aCR_nGn'], // Behovsanställning
      
      // Förbjudna kombinationer
      forbiddenCombinations: [
        { employmentType: 'Jh8f_q9J_pbJ', duration: 'a7uU_j21_mkL' } // Sommarjobb + Tillsvidare
      ]
    };

    const validateConditionalFields = (job: any) => {
      const employmentType = job.af_employment_type_cid;
      let duration = job.af_duration_cid;
      const worktimeExtent = job.af_worktime_extent_cid;
      
      // ✅ Auto-sätt "Tillsvidare" för permanenta anställningar
      if (AF_RULES.autoSetTillsvidare.includes(employmentType)) {
        if (!duration || duration !== 'a7uU_j21_mkL') {
          console.log(`✅ Auto-setting duration to Tillsvidare for ${employmentType}`);
          duration = 'a7uU_j21_mkL';
        }
      }
      
      // ✅ KRÄV duration för tidsbegränsade anställningar
      if (AF_RULES.requiresDuration.includes(employmentType) && !duration) {
        throw new Error(`Duration is mandatory for employment type "${employmentType}"`);
      }
      
      // ✅ KRÄV worktimeExtent för Vanlig anställning
      if (employmentType === 'PFZr_Syz_cUq' && !worktimeExtent) {
        throw new Error(
          'worktimeExtent (Heltid/Deltid) is REQUIRED for Vanlig anställning (PFZr_Syz_cUq). ' +
          'Choose: Heltid (6YE1_gAC_R2G) or Deltid (947z_JGS_Uk2)'
        );
      }
      
      // ❌ FÖRBJUD worktimeExtent för vissa typer
      if (AF_RULES.forbidsWorktimeExtent.includes(employmentType) && worktimeExtent) {
        throw new Error(`WorktimeExtent cannot be specified for "${employmentType}"`);
      }
      
      // ❌ Kontrollera förbjudna kombinationer
      for (const combo of AF_RULES.forbiddenCombinations) {
        if (employmentType === combo.employmentType && duration === combo.duration) {
          throw new Error(`Invalid combination: employmentType "${employmentType}" cannot be combined with duration "${duration}"`);
        }
      }
      
      return duration; // Returnera den validerade/uppdaterade duration
    };

    // ✅ Validera förbjudna employment types och kombinationer
    const validateEmploymentType = (job: any) => {
      // Forbidden: Arbete utomlands
      if (job.af_employment_type_cid === '9Wuo_2Yb_36E') {
        throw new Error('employmentType "Arbete utomlands" (9Wuo_2Yb_36E) is not allowed by AF');
      }
      
      // Forbidden combination: Sommarjobb + Tillsvidare
      if (job.af_employment_type_cid === 'Jh8f_q9J_pbJ' && job.af_duration_cid === 'a7uU_j21_mkL') {
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

    // Validera obligatoriska fält (använd nya _cid kolumner)
  const requiredFields = [
    'contact_person_name',
    'last_application_date',
    'af_occupation_cid',
    'af_municipality_cid',
    'af_employment_type_cid'
  ];

    const missingFields = requiredFields.filter(field => !job[field]);
    if (missingFields.length > 0) {
      const errorMsg = `Missing required AF fields: ${missingFields.join(', ')}`;
      console.error('❌ Validation failed:', errorMsg);
      throw new Error(errorMsg);
    }

    // ✅ Kör alla valideringar och få validerad duration
    validateFieldLengths(job);
    validateEmploymentType(job);
    const validatedDuration = validateConditionalFields(job);
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

    console.log('🔍 AF payload taxonomy concept_ids:', {
      occupation: job.af_occupation_cid,
      employmentType: job.af_employment_type_cid,
      worktimeExtent: job.af_worktime_extent_cid,
      duration: job.af_duration_cid,
      municipality: job.af_municipality_cid
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
      
      // Kategorisering (JobTech Taxonomy concept IDs) - använd direkt concept_ids
      occupation: job.af_occupation_cid,
      employmentType: job.af_employment_type_cid,
      wageType: job.af_wage_type_code || "oG8G_9cW_nRf", // Fast månadslön (default)
      duration: job.af_duration_cid || validatedDuration,
    };

    console.log('✅ Duration set:', afRequestBody.duration);

    // ✅ Conditional: Lägg till worktimeExtent om tillåtet och angivet
    if (!AF_RULES.forbidsWorktimeExtent.includes(job.af_employment_type_cid) && job.af_worktime_extent_cid) {
      afRequestBody.worktimeExtent = job.af_worktime_extent_cid;
      console.log('✅ Added worktimeExtent');
    } else if (AF_RULES.forbidsWorktimeExtent.includes(job.af_employment_type_cid)) {
      console.log('⚠️ WorktimeExtent excluded (forbidden for this employment type)');
    }

    // ✅ Workplaces måste ALLTID finnas enligt AF dokumentation
    afRequestBody.workplaces = [
      {
        name: String(job.companies?.name || ""),
        municipality: job.af_municipality_cid, // ✅ Använd RIKTIG concept_id från AF taxonomy
        country: "i46j_HmG_v64", // ✅ Sverige (required enligt AF docs)
        postalAddress: {
          street: String(job.companies?.address || ""),
          postalCode: String(job.companies?.postal_code || ""),
          city: String(job.companies?.city || "")
        }
      }
    ];

    // Kontakter (array enligt AF API)
    afRequestBody.contacts = [
      {
        firstname: String(firstname || ""),
        surname: String(surname || ""),
        email: String(job.contact_person_email || ""),
        phoneNumber: String(formatPhoneNumber(job.contact_person_phone) || ""),
        title: "Kontaktperson"
      }
    ];

    // Ansökan
    afRequestBody.application = {
      method: {
        webAddress: String(`https://nocv.se/jobb/${job.slug}`)
      }
    };

    // Övrigt
    afRequestBody.eures = false;
    afRequestBody.keywords = ["OPEN_TO_ALL"];

    // Debug: Visa concept IDs
    console.log("🔍 Final AF payload taxonomy (concept_ids):", {
      occupation: afRequestBody.occupation,
      employmentType: afRequestBody.employmentType,
      worktimeExtent: afRequestBody.worktimeExtent || 'not set',
      duration: afRequestBody.duration,
      municipality: afRequestBody.workplaces[0].municipality
    });

    // 🔥 VALIDERA ATT ALLA KRITISKA FÄLT ÄR STRÄNGAR (inte objekt)
    console.log("🔍 Validating payload field types:");
    const criticalFields: Record<string, any> = {
      occupation: afRequestBody.occupation,
      employmentType: afRequestBody.employmentType,
      worktimeExtent: afRequestBody.worktimeExtent,
      duration: afRequestBody.duration,
      wageType: afRequestBody.wageType,
      municipality: afRequestBody.workplaces?.[0]?.municipality,
      postalCode: afRequestBody.workplaces?.[0]?.postalAddress?.postalCode,
      country: afRequestBody.workplaces?.[0]?.country,
      phoneNumber: afRequestBody.contacts?.[0]?.phoneNumber,
    };

    for (const [key, value] of Object.entries(criticalFields)) {
      if (value === undefined || value === null) {
        console.log(`  ${key}: ${value} (skipped - undefined/null)`);
        continue;
      }
      
      const valueType = typeof value;
      console.log(`  ${key}: ${valueType} = "${value}"`);
      
      if (valueType === 'object') {
        throw new Error(`❌ Field "${key}" is an object, must be string! Value: ${JSON.stringify(value)}`);
      }
      
      // Extra validering för tomma strängar på kritiska fält
      if (valueType === 'string' && value.trim() === '' && ['occupation', 'employmentType', 'municipality'].includes(key)) {
        throw new Error(`❌ Field "${key}" cannot be empty!`);
      }
    }

    console.log("✅ All critical fields are valid");
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
      
      // Parse AF errors into readable format
      let errorMessage = '';

      if (afResponseData.cause?.message?.errors) {
        // AF field-level errors: array of {field, message}
        errorMessage = afResponseData.cause.message.errors
          .map((err: any) => `${err.field}: ${err.message}`)
          .join('; ');
      } else if (afResponseData.errors) {
        // Alternative structure: array of errors
        errorMessage = Array.isArray(afResponseData.errors)
          ? afResponseData.errors.map((e: any) => e.message || JSON.stringify(e)).join('; ')
          : JSON.stringify(afResponseData.errors);
      } else if (afResponseData.message) {
        // Simple message string
        errorMessage = afResponseData.message;
      } else {
        // Fallback: Save entire object
        errorMessage = JSON.stringify(afResponseData);
      }

      // Limit length (max 500 chars for af_error)
      if (errorMessage.length > 500) {
        errorMessage = errorMessage.substring(0, 497) + '...';
      }
      
      // Save error to database
      await supabase
        .from('jobs')
        .update({ 
          af_error: errorMessage,
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