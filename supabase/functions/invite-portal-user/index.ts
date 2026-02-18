import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface InvitePortalUserRequest {
  email: string;
  name: string;
  companyId: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validate caller is admin
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Unauthorized - No token provided" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
    const supabaseClient = createClient(supabaseUrl, supabaseAnonKey);

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabaseClient.auth.getClaims(token);

    if (claimsError || !claimsData?.claims) {
      return new Response(
        JSON.stringify({ error: "Unauthorized - Invalid token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userId = claimsData.claims.sub;

    // Create admin client
    const supabaseAdmin = createClient(
      supabaseUrl,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // Check admin role
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("role")
      .eq("id", userId)
      .single();

    if (!profile || profile.role !== "admin") {
      return new Response(
        JSON.stringify({ error: "Forbidden - Admin access required" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { email, name, companyId }: InvitePortalUserRequest = await req.json();
    console.log("Inviting portal user:", email, "to company:", companyId);

    // Get company name
    const { data: company, error: companyError } = await supabaseAdmin
      .from("companies")
      .select("name")
      .eq("id", companyId)
      .single();

    if (companyError || !company) {
      return new Response(
        JSON.stringify({ error: "Company not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if user already exists
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
    const existingUser = existingUsers?.users?.find((u) => u.email === email);

    let targetUserId: string;

    if (existingUser) {
      console.log("User already exists:", existingUser.id);
      targetUserId = existingUser.id;
    } else {
      // Invite new user
      console.log("Creating new user via invite");
      const redirectUrl = `${supabaseUrl.replace(".supabase.co", ".lovableproject.com")}/auth`;

      const { data: inviteData, error: inviteError } =
        await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
          redirectTo: redirectUrl,
        });

      if (inviteError) throw inviteError;
      if (!inviteData.user) throw new Error("Failed to create user");

      targetUserId = inviteData.user.id;
      console.log("User created:", targetUserId);
    }

    // Check if company_users link already exists
    const { data: existingLink } = await supabaseAdmin
      .from("company_users")
      .select("id")
      .eq("user_id", targetUserId)
      .eq("company_id", companyId)
      .maybeSingle();

    if (existingLink) {
      return new Response(
        JSON.stringify({ error: "Användaren är redan kopplad till detta företag" }),
        { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create company_users link
    const { error: linkError } = await supabaseAdmin
      .from("company_users")
      .insert({
        user_id: targetUserId,
        company_id: companyId,
        name,
        role: "viewer",
      });

    if (linkError) {
      console.error("Error creating company_users link:", linkError);
      throw linkError;
    }

    console.log("Company user link created for:", targetUserId);

    // Send portal invitation email
    const inviteLink = `${supabaseUrl.replace(".supabase.co", ".lovableproject.com")}/auth`;

    const { error: emailError } = await supabaseAdmin.functions.invoke(
      "send-portal-invitation",
      {
        body: { email, name, companyName: company.name, inviteLink },
      }
    );

    if (emailError) {
      console.error("Error sending portal invitation email:", emailError);
      // Don't throw - user link is created, email is optional
    }

    return new Response(
      JSON.stringify({
        success: true,
        userId: targetUserId,
        isExistingUser: !!existingUser,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in invite-portal-user:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
