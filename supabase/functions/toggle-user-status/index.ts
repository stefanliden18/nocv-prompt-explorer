import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { userId, suspend } = await req.json();

    if (!userId || typeof suspend !== 'boolean') {
      return new Response(
        JSON.stringify({ error: 'userId and suspend (boolean) are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get user profile to check if admin
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role, email')
      .eq('id', userId)
      .single();

    if (profileError || !profile) {
      console.error('Error fetching profile:', profileError);
      return new Response(
        JSON.stringify({ error: 'User not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // If suspending an admin, check if this is the last active admin
    if (suspend && profile.role === 'admin') {
      const { data: adminCount, error: countError } = await supabase
        .rpc('count_active_admins');

      if (countError) {
        console.error('Error counting admins:', countError);
        return new Response(
          JSON.stringify({ error: 'Failed to validate admin count' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (adminCount <= 1) {
        return new Response(
          JSON.stringify({ error: 'Cannot suspend the last active admin' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Use Admin API to ban/unban user
    const banDuration = suspend ? '876000h' : 'none'; // 100 years or none
    const { data, error } = await supabase.auth.admin.updateUserById(userId, {
      ban_duration: banDuration,
    });

    if (error) {
      console.error('Error updating user status:', error);
      return new Response(
        JSON.stringify({ error: 'Failed to update user status' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get auth token to log event
    const authHeader = req.headers.get('authorization');
    let performedBy = null;
    if (authHeader) {
      const token = authHeader.replace('Bearer ', '');
      const { data: { user } } = await supabase.auth.getUser(token);
      performedBy = user?.id;
    }

    // Log event
    const eventType = suspend ? 'user_suspended' : 'user_activated';
    const { error: logError } = await supabase
      .from('activity_logs')
      .insert({
        event_type: eventType,
        entity_type: 'user',
        entity_id: userId,
        user_id: performedBy,
        metadata: {
          email: profile.email,
          role: profile.role,
          suspended: suspend,
        },
      });

    if (logError) {
      console.error('Error logging event:', logError);
    }

    return new Response(
      JSON.stringify({ success: true, suspended: suspend }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in toggle-user-status function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
