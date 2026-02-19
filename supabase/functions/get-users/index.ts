import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    console.log("Fetching all user profiles...");

    // Fetch all profiles
    const { data: profiles, error: profilesError } = await supabaseAdmin
      .from("profiles")
      .select("id, email, role, created_at, first_name, last_name")
      .order("created_at", { ascending: false });

    if (profilesError) {
      console.error("Error fetching profiles:", profilesError);
      throw profilesError;
    }

    console.log(`Found ${profiles?.length || 0} profiles`);

    // Fetch auth data for each user
    const usersWithAuth = await Promise.all(
      (profiles || []).map(async (profile) => {
        try {
          const { data: authData, error: authError } = await supabaseAdmin.auth.admin.getUserById(profile.id);
          
          if (authError) {
            console.error(`Error fetching auth data for ${profile.email}:`, authError);
            return {
              ...profile,
              last_sign_in_at: null,
              banned_until: null,
            };
          }

          return {
            ...profile,
            last_sign_in_at: authData.user?.last_sign_in_at || null,
            banned_until: authData.user?.banned_until || null,
          };
        } catch (error) {
          console.error(`Exception fetching auth data for ${profile.email}:`, error);
          return {
            ...profile,
            last_sign_in_at: null,
            banned_until: null,
          };
        }
      })
    );

    console.log("Successfully fetched all user data");

    return new Response(
      JSON.stringify({ users: usersWithAuth }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  } catch (error) {
    console.error("Error in get-users function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
