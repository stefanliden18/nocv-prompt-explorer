import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface InviteUserRequest {
  email: string;
  role: "user" | "recruiter" | "admin";
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";

    // Create admin client with service role FIRST — needed for admin verification
    const supabaseAdmin = createClient(
      supabaseUrl,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    // Validate that the caller is an admin
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized - No token provided' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get user from token using service-role client (bypasses RLS)
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);

    if (userError || !user) {
      console.error('Error validating user:', userError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized - Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check that the user is an admin using service-role client (bypasses RLS on profiles)
    const { data: callerRoles, error: rolesError } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin');

    if (rolesError || !callerRoles || callerRoles.length === 0) {
      console.error('User is not admin:', user.id);
      return new Response(
        JSON.stringify({ error: 'Forbidden - Admin access required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Now we know the caller is a verified admin
    const { email, role }: InviteUserRequest = await req.json();

    console.log("Processing user invitation/update:", email, "with role:", role);

    // Check if user already exists
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
    const existingUser = existingUsers?.users?.find(u => u.email === email);

    if (existingUser) {
      console.log("User already exists, updating role:", existingUser.id);
      
      // Update profile role (trigger will sync user_roles automatically)
      const { error: profileUpdateError } = await supabaseAdmin
        .from("profiles")
        .update({ role })
        .eq("id", existingUser.id);

      if (profileUpdateError) {
        console.error("Error updating profile:", profileUpdateError);
        throw profileUpdateError;
      }

      console.log("Role updated successfully for:", existingUser.id);

      return new Response(
        JSON.stringify({ 
          success: true, 
          userId: existingUser.id, 
          updated: true 
        }),
        {
          status: 200,
          headers: {
            "Content-Type": "application/json",
            ...corsHeaders,
          },
        }
      );
    }

    // Invite new user via admin API
    console.log("User does not exist, sending invitation");
    const appUrl = Deno.env.get("APP_URL") || "https://nocv-prompt-explorer.lovable.app";
    const redirectUrl = `${appUrl}/auth`;

    const { data: inviteData, error: inviteError } =
      await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
        redirectTo: redirectUrl,
      });

    if (inviteError) throw inviteError;

    if (!inviteData.user) {
      throw new Error("Failed to create user");
    }

    console.log("User invited successfully:", inviteData.user.id);

    // Update profile role (trigger will sync user_roles automatically)
    const { error: profileUpdateError } = await supabaseAdmin
      .from("profiles")
      .update({ role })
      .eq("id", inviteData.user.id);

    if (profileUpdateError) {
      console.error("Error updating profile:", profileUpdateError);
      throw profileUpdateError;
    }

    // Send invitation email
    const inviteLink = redirectUrl;
    const { error: emailError } = await supabaseAdmin.functions.invoke(
      "send-user-invitation",
      {
        body: { email, role, inviteLink },
      }
    );

    if (emailError) {
      console.error("Error sending invitation email:", emailError);
      // Don't throw - user is created, email is optional
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        userId: inviteData.user.id,
        updated: false
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      }
    );
  } catch (error: any) {
    console.error("Error in invite-user function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
