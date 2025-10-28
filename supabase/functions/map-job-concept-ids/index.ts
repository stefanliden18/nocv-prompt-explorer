import { createClient } from 'jsr:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Helper to find best fuzzy match for occupation
function findBestOccupationMatch(searchText: string, occupations: any[]): string | null {
  if (!searchText) return null;
  
  const normalized = searchText.toLowerCase().trim();
  
  // Try exact match first
  const exactMatch = occupations.find(o => 
    o.label.toLowerCase() === normalized
  );
  if (exactMatch) return exactMatch.concept_id;
  
  // Try partial match
  const partialMatch = occupations.find(o => 
    o.label.toLowerCase().includes(normalized) || 
    normalized.includes(o.label.toLowerCase())
  );
  if (partialMatch) return partialMatch.concept_id;
  
  return null;
}

// Helper to find exact match for municipality
function findMunicipalityMatch(cityText: string, municipalities: any[]): string | null {
  if (!cityText) return null;
  
  const normalized = cityText.toLowerCase().trim();
  
  const match = municipalities.find(m => 
    m.label.toLowerCase() === normalized
  );
  
  return match ? match.concept_id : null;
}

// Helper to map employment type text to concept_id
function mapEmploymentType(typeText: string, employmentTypes: any[]): string | null {
  if (!typeText) return null;
  
  const normalized = typeText.toLowerCase().trim();
  
  // Common mappings
  const mappings: Record<string, string[]> = {
    'heltid': ['heltid', 'full time', 'fulltime'],
    'deltid': ['deltid', 'part time', 'parttime'],
    'tillsvidare': ['tillsvidare', 'permanent', 'fast anställning'],
    'visstid': ['visstid', 'temporary', 'tidsbegränsad'],
    'sommarjobb': ['sommarjobb', 'summer job', 'feriejobb'],
  };
  
  for (const [key, variants] of Object.entries(mappings)) {
    if (variants.some(v => normalized.includes(v))) {
      const match = employmentTypes.find(et => 
        et.label.toLowerCase().includes(key)
      );
      if (match) return match.concept_id;
    }
  }
  
  return null;
}

// Default concept_ids based on common patterns
const DEFAULTS = {
  // Heltid (Full time)
  worktimeExtentFullTime: '6YE1_gAC_R2G',
  // Deltid (Part time)
  worktimeExtentPartTime: 'ePb4_hCi_JVG',
  // Tills vidare (Indefinite)
  durationIndefinite: 'a7uU_j21_mkL',
  // 3-6 månader (common for temp jobs)
  duration3to6Months: 'x4pL_FYv_HYe',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🔄 Starting job concept_id mapping...');
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Step 1: Fetch all taxonomy data
    console.log('📥 Step 1: Fetching taxonomy data...');
    const { data: taxonomyData, error: taxonomyError } = await supabase
      .from('af_taxonomy')
      .select('concept_id, type, label, version');

    if (taxonomyError) {
      console.error('❌ Failed to fetch taxonomy:', taxonomyError);
      throw taxonomyError;
    }

    const occupations = taxonomyData.filter(t => t.type === 'occupation-name');
    const municipalities = taxonomyData.filter(t => t.type === 'municipality');
    const employmentTypes = taxonomyData.filter(t => t.type === 'employment-type');
    const durations = taxonomyData.filter(t => t.type === 'employment-duration');
    const worktimeExtents = taxonomyData.filter(t => t.type === 'worktime-extent');

    console.log(`✅ Loaded taxonomy: ${occupations.length} occupations, ${municipalities.length} municipalities`);

    // Step 2: Fetch jobs that need mapping
    console.log('📥 Step 2: Fetching jobs that need mapping...');
    const { data: jobs, error: jobsError } = await supabase
      .from('jobs')
      .select('id, title, category, city, employment_type, af_occupation_cid, af_municipality_cid, af_employment_type_cid, af_duration_cid, af_worktime_extent_cid')
      .or('af_occupation_cid.is.null,af_municipality_cid.is.null,af_employment_type_cid.is.null,af_duration_cid.is.null,af_worktime_extent_cid.is.null');

    if (jobsError) {
      console.error('❌ Failed to fetch jobs:', jobsError);
      throw jobsError;
    }

    console.log(`✅ Found ${jobs?.length || 0} jobs needing mapping`);

    if (!jobs || jobs.length === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          message: 'No jobs need mapping',
          mapped: 0,
          failed: [],
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    }

    // Step 3: Map each job
    console.log('🔄 Step 3: Mapping jobs to concept_ids...');
    const results = {
      mapped: 0,
      failed: [] as any[],
    };

    for (const job of jobs) {
      console.log(`\n📝 Processing job ${job.id}: "${job.title}"`);
      
      const updates: any = {};
      const mappingLog: any = {
        jobId: job.id,
        title: job.title,
        mappings: {},
        warnings: [],
      };

      // Map occupation
      if (!job.af_occupation_cid && job.category) {
        const occupationCid = findBestOccupationMatch(job.category, occupations);
        if (occupationCid) {
          updates.af_occupation_cid = occupationCid;
          mappingLog.mappings.occupation = `${job.category} → ${occupationCid}`;
          console.log(`  ✅ Occupation: ${job.category} → ${occupationCid}`);
        } else {
          mappingLog.warnings.push(`Could not map occupation: "${job.category}"`);
          console.warn(`  ⚠️ Could not map occupation: "${job.category}"`);
        }
      }

      // Map municipality
      if (!job.af_municipality_cid && job.city) {
        const municipalityCid = findMunicipalityMatch(job.city, municipalities);
        if (municipalityCid) {
          updates.af_municipality_cid = municipalityCid;
          mappingLog.mappings.municipality = `${job.city} → ${municipalityCid}`;
          console.log(`  ✅ Municipality: ${job.city} → ${municipalityCid}`);
        } else {
          mappingLog.warnings.push(`Could not map municipality: "${job.city}"`);
          console.warn(`  ⚠️ Could not map municipality: "${job.city}"`);
        }
      }

      // Map employment type
      if (!job.af_employment_type_cid && job.employment_type) {
        const employmentTypeCid = mapEmploymentType(job.employment_type, employmentTypes);
        if (employmentTypeCid) {
          updates.af_employment_type_cid = employmentTypeCid;
          mappingLog.mappings.employmentType = `${job.employment_type} → ${employmentTypeCid}`;
          console.log(`  ✅ Employment type: ${job.employment_type} → ${employmentTypeCid}`);
        } else {
          mappingLog.warnings.push(`Could not map employment type: "${job.employment_type}"`);
          console.warn(`  ⚠️ Could not map employment type: "${job.employment_type}"`);
        }
      }

      // Set worktime extent based on employment type or default to full time
      if (!job.af_worktime_extent_cid) {
        const isPartTime = job.employment_type?.toLowerCase().includes('deltid');
        updates.af_worktime_extent_cid = isPartTime 
          ? DEFAULTS.worktimeExtentPartTime 
          : DEFAULTS.worktimeExtentFullTime;
        mappingLog.mappings.worktimeExtent = `Default: ${isPartTime ? 'Deltid' : 'Heltid'}`;
        console.log(`  ✅ Worktime extent: ${isPartTime ? 'Deltid' : 'Heltid'} (default)`);
      }

      // Set duration based on employment type or default to indefinite
      if (!job.af_duration_cid) {
        const isTemporary = job.employment_type?.toLowerCase().includes('visstid') || 
                           job.employment_type?.toLowerCase().includes('sommar');
        updates.af_duration_cid = isTemporary 
          ? DEFAULTS.duration3to6Months 
          : DEFAULTS.durationIndefinite;
        mappingLog.mappings.duration = `Default: ${isTemporary ? '3-6 månader' : 'Tills vidare'}`;
        console.log(`  ✅ Duration: ${isTemporary ? '3-6 månader' : 'Tills vidare'} (default)`);
      }

      // Update job if we have any mappings
      if (Object.keys(updates).length > 0) {
        const { error: updateError } = await supabase
          .from('jobs')
          .update(updates)
          .eq('id', job.id);

        if (updateError) {
          console.error(`  ❌ Failed to update job ${job.id}:`, updateError);
          mappingLog.error = updateError.message;
          results.failed.push(mappingLog);
        } else {
          console.log(`  ✅ Updated job ${job.id} with ${Object.keys(updates).length} mappings`);
          results.mapped++;
          if (mappingLog.warnings.length > 0) {
            results.failed.push(mappingLog);
          }
        }
      } else {
        console.log(`  ℹ️ No updates needed for job ${job.id}`);
      }
    }

    console.log(`\n✅ Mapping complete: ${results.mapped} jobs updated`);
    if (results.failed.length > 0) {
      console.log(`⚠️ ${results.failed.length} jobs had warnings or errors`);
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Job mapping completed',
        mapped: results.mapped,
        total: jobs.length,
        failed: results.failed,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('❌ Error mapping jobs:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
