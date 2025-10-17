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
    console.log('🗑️ Starting AF unpublish for job:', job_id);
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { data: job, error: jobError } = await supabase
      .from('jobs')
      .select('af_ad_id')
      .eq('id', job_id)
      .single();

    if (jobError || !job || !job.af_ad_id) {
      console.error('Job not found or not published to AF');
      throw new Error('Job not found or not published to AF');
    }

    console.log('✅ Job found, unpublishing AF Ad ID:', job.af_ad_id);
    console.log('📨 Sending DELETE request to AF API...');

    const afResponse = await fetch(`${AF_API_BASE}${AF_ENDPOINT}/${job.af_ad_id}`, {
      method: 'DELETE',
      headers: {
        'Employer-Id': Deno.env.get('NOCV_AF_EMPLOYER_ID') ?? '',
        'client_id': Deno.env.get('AF_CLIENT_ID') ?? '',
        'client_secret': Deno.env.get('AF_CLIENT_SECRET') ?? ''
      }
    });

    if (!afResponse.ok) {
      const errorData = await afResponse.json();
      console.error('❌ AF API delete error:', errorData);
      throw new Error(`AF API error (${afResponse.status}): ${JSON.stringify(errorData)}`);
    }

    console.log('✅ Successfully unpublished from AF');

    await supabase
      .from('jobs')
      .update({
        af_published: false,
        af_ad_id: null,
        af_last_sync: new Date().toISOString()
      })
      .eq('id', job_id);

    console.log('✅ Database updated - job unmarked as AF published');

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Error in unpublish-af-ad:', error);
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