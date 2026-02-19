import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    const { token, chosenOption } = await req.json();

    if (!token || ![1, 2, 3].includes(chosenOption)) {
      return new Response(JSON.stringify({ error: "Missing token or invalid chosenOption" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch proposal by token
    const { data: proposal, error: pErr } = await supabaseAdmin
      .from("portal_interview_proposals")
      .select("*")
      .eq("respond_token", token)
      .eq("status", "pending")
      .single();

    if (pErr || !proposal) {
      return new Response(
        JSON.stringify({ error: "Förslaget har redan besvarats eller är ogiltigt." }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const chosenTime = chosenOption === 1 ? proposal.option_1_at : chosenOption === 2 ? proposal.option_2_at : proposal.option_3_at;

    // Update proposal status
    const { error: updateErr } = await supabaseAdmin
      .from("portal_interview_proposals")
      .update({
        status: "accepted",
        chosen_option: chosenOption,
        responded_at: new Date().toISOString(),
      })
      .eq("id", proposal.id);

    if (updateErr) {
      console.error("Update proposal error:", updateErr);
      throw new Error("Kunde inte uppdatera förslaget");
    }

    // Create the actual interview booking
    const { data: interview, error: intErr } = await supabaseAdmin
      .from("portal_interviews")
      .insert({
        candidate_id: proposal.candidate_id,
        company_user_id: proposal.company_user_id,
        scheduled_at: chosenTime,
        duration_minutes: proposal.duration_minutes,
        location_type: proposal.location_type,
        location_details: proposal.location_details,
        notes: proposal.notes,
      })
      .select("id")
      .single();

    if (intErr) {
      console.error("Interview insert error:", intErr);
      throw new Error("Kunde inte skapa intervjubokning");
    }

    // Update candidate status
    await supabaseAdmin
      .from("portal_candidates")
      .update({ status: "interview_booked" })
      .eq("id", proposal.candidate_id);

    // Send confirmation emails (reuse existing edge function via fetch)
    if (interview?.id) {
      try {
        const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
        const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
        
        const response = await fetch(`${supabaseUrl}/functions/v1/send-portal-interview-invitation`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${serviceKey}`,
          },
          body: JSON.stringify({ portalInterviewId: interview.id }),
        });
        
        const result = await response.json();
        console.log("Confirmation email result:", result);
      } catch (emailErr) {
        console.error("Confirmation email error:", emailErr);
        // Don't fail — interview is already booked
      }
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
