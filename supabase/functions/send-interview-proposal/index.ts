import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "npm:resend@2.0.0";
import { formatInTimeZone } from "https://esm.sh/date-fns-tz@3.2.0";
import { sv } from "https://esm.sh/date-fns@3.6.0/locale";

const STOCKHOLM_TZ = "Europe/Stockholm";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

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

    const { proposalId } = await req.json();
    if (!proposalId) {
      return new Response(JSON.stringify({ error: "Missing proposalId" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: proposal, error: pErr } = await supabaseAdmin
      .from("portal_interview_proposals")
      .select("*, portal_candidates(name, email), company_users(name, companies(name))")
      .eq("id", proposalId)
      .single();

    if (pErr || !proposal) {
      console.error("Proposal fetch error:", pErr);
      return new Response(JSON.stringify({ error: "Proposal not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const candidateName = proposal.portal_candidates?.name || "Kandidat";
    const candidateEmail = proposal.portal_candidates?.email;
    const bookerName = proposal.company_users?.name || "Rekryterare";
    const companyName = proposal.company_users?.companies?.name || "";

    if (!candidateEmail) {
      return new Response(
        JSON.stringify({ success: false, reason: "no_email", message: "Kandidaten saknar e-postadress" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const opt1Date = formatInTimeZone(new Date(proposal.option_1_at), STOCKHOLM_TZ, "EEEE d MMMM yyyy", { locale: sv });
    const opt1Time = formatInTimeZone(new Date(proposal.option_1_at), STOCKHOLM_TZ, "HH:mm", { locale: sv });
    const opt2Date = formatInTimeZone(new Date(proposal.option_2_at), STOCKHOLM_TZ, "EEEE d MMMM yyyy", { locale: sv });
    const opt2Time = formatInTimeZone(new Date(proposal.option_2_at), STOCKHOLM_TZ, "HH:mm", { locale: sv });

    const locationLabel =
      proposal.location_type === "onsite" ? "På plats" :
      proposal.location_type === "teams" ? "Teams / Videomöte" : "Telefon";
    const locationLine = proposal.location_details ? `${locationLabel} — ${proposal.location_details}` : locationLabel;

    const respondUrl = `${Deno.env.get("SUPABASE_URL")?.replace('.supabase.co', '.lovable.app') || 'https://nocv-prompt-explorer.lovable.app'}/interview-respond/${proposal.respond_token}`;

    // Use the public site URL from env or fallback
    const siteUrl = Deno.env.get("SITE_URL") || "https://nocv-prompt-explorer.lovable.app";
    const respondLink = `${siteUrl}/interview-respond/${proposal.respond_token}`;

    const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #F97316 0%, #EA580C 100%); padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
    <h1 style="color: white; margin: 0;">Intervjuförslag${companyName ? ` — ${companyName}` : ""}</h1>
  </div>
  <div style="background: #ffffff; padding: 30px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 8px 8px;">
    <p style="font-size: 16px;">Hej ${candidateName},</p>
    <p>${bookerName ? `${bookerName} ` : "Vi "}vill gärna bjuda in dig till en intervju. Välj den tid som passar dig bäst:</p>

    <div style="background: #f7f7f7; padding: 20px; border-radius: 8px; margin: 25px 0;">
      <p style="margin: 8px 0; font-weight: bold;">Alternativ 1</p>
      <p style="margin: 4px 0;">📅 ${opt1Date} kl ${opt1Time}</p>
      <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 12px 0;" />
      <p style="margin: 8px 0; font-weight: bold;">Alternativ 2</p>
      <p style="margin: 4px 0;">📅 ${opt2Date} kl ${opt2Time}</p>
      <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 12px 0;" />
      <p style="margin: 8px 0;">⏱️ Längd: ${proposal.duration_minutes} min</p>
      <p style="margin: 8px 0;">📍 Plats: ${locationLine}</p>
    </div>

    ${proposal.notes ? `<p><strong>Meddelande:</strong><br/>${proposal.notes}</p>` : ""}

    <div style="text-align: center; margin: 30px 0;">
      <a href="${respondLink}" style="display: inline-block; background: #F97316; color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 16px;">Välj din tid</a>
    </div>

    <p style="color: #666; font-size: 14px; margin-top: 30px;">
      Med vänliga hälsningar,<br/>${bookerName}<br/>via NoCV
    </p>
  </div>
  <div style="text-align: center; padding: 20px; color: #999; font-size: 12px;">
    <p>Detta är ett automatiskt meddelande, vänligen svara inte på detta mail.</p>
  </div>
</body>
</html>`;

    const { error: emailError } = await resend.emails.send({
      from: "NoCV <noreply@nocv.se>",
      to: [candidateEmail],
      subject: `Intervjuförslag — ${companyName || "Välj din tid"}`,
      html,
    });

    if (emailError) {
      console.error("Email send error:", emailError);
      return new Response(JSON.stringify({ error: "Email failed", details: emailError }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
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
