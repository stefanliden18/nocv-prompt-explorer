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

    const { portalInterviewId } = await req.json();

    if (!portalInterviewId) {
      return new Response(
        JSON.stringify({ error: "Missing portalInterviewId" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch interview with candidate info
    const { data: interview, error: intErr } = await supabaseAdmin
      .from("portal_interviews")
      .select("*, portal_candidates(name, email), company_users(name, companies(name))")
      .eq("id", portalInterviewId)
      .single();

    if (intErr || !interview) {
      console.error("Interview fetch error:", intErr);
      return new Response(
        JSON.stringify({ error: "Interview not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const candidateName = (interview.portal_candidates as any)?.name || "Kandidat";
    const candidateEmail = (interview.portal_candidates as any)?.email;
    const bookerName = (interview.company_users as any)?.name || "Rekryterare";
    const companyName = (interview.company_users as any)?.companies?.name || "";

    if (!candidateEmail) {
      // No email on file — mark not sent and return info
      return new Response(
        JSON.stringify({ success: false, reason: "no_email", message: "Kandidaten saknar e-postadress" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const scheduledDate = new Date(interview.scheduled_at);
    const interviewDate = formatInTimeZone(scheduledDate, STOCKHOLM_TZ, "d MMMM yyyy", { locale: sv });
    const interviewTime = formatInTimeZone(scheduledDate, STOCKHOLM_TZ, "HH:mm", { locale: sv });
    const durationMinutes = interview.duration_minutes || 30;

    const locationLabel =
      interview.location_type === "onsite" ? "På plats" :
      interview.location_type === "teams" ? "Teams / Videomöte" : "Telefon";

    // Build iCal content
    const icsContent = buildICalEvent({
      summary: `Intervju med ${companyName || bookerName}`,
      dtStart: scheduledDate,
      durationMinutes,
      location: interview.location_details || locationLabel,
      description: interview.notes || "",
    });

    // Build email HTML
    const emailHtml = getEmailTemplate({
      candidateName,
      interviewDate,
      interviewTime,
      durationMinutes,
      locationLabel,
      locationDetails: interview.location_details,
      notes: interview.notes,
      bookerName,
      companyName,
    });

    const { error: emailError } = await resend.emails.send({
      from: "NoCV <noreply@nocv.se>",
      to: [candidateEmail],
      subject: `Inbjudan till intervju — ${companyName || interviewDate}`,
      html: emailHtml,
      attachments: [
        {
          filename: "intervju.ics",
          content: btoa(icsContent),
          content_type: "text/calendar",
        },
      ],
    });

    if (emailError) {
      console.error("Email send error:", emailError);
      return new Response(
        JSON.stringify({ error: "Email failed", details: emailError }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Mark email_sent on the interview
    await supabaseAdmin
      .from("portal_interviews")
      .update({ email_sent: true })
      .eq("id", portalInterviewId);

    return new Response(
      JSON.stringify({ success: true, message: "Email skickat" }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in send-portal-interview-invitation:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

function pad(n: number): string {
  return n.toString().padStart(2, "0");
}

function toICalDateUTC(date: Date): string {
  return (
    date.getUTCFullYear().toString() +
    pad(date.getUTCMonth() + 1) +
    pad(date.getUTCDate()) +
    "T" +
    pad(date.getUTCHours()) +
    pad(date.getUTCMinutes()) +
    pad(date.getUTCSeconds()) +
    "Z"
  );
}

function buildICalEvent(opts: {
  summary: string;
  dtStart: Date;
  durationMinutes: number;
  location: string;
  description: string;
}): string {
  const dtEnd = new Date(opts.dtStart.getTime() + opts.durationMinutes * 60000);
  const now = new Date();
  const uid = crypto.randomUUID() + "@nocv.se";

  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//NoCV//Portal//SV",
    "CALSCALE:GREGORIAN",
    "METHOD:REQUEST",
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTAMP:${toICalDateUTC(now)}`,
    `DTSTART:${toICalDateUTC(opts.dtStart)}`,
    `DTEND:${toICalDateUTC(dtEnd)}`,
    `SUMMARY:${opts.summary}`,
    `LOCATION:${opts.location}`,
    `DESCRIPTION:${opts.description.replace(/\n/g, "\\n")}`,
    "STATUS:CONFIRMED",
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
}

function getEmailTemplate(opts: {
  candidateName: string;
  interviewDate: string;
  interviewTime: string;
  durationMinutes: number;
  locationLabel: string;
  locationDetails: string | null;
  notes: string | null;
  bookerName: string;
  companyName: string;
}): string {
  const locationLine = opts.locationDetails
    ? `${opts.locationLabel} — ${opts.locationDetails}`
    : opts.locationLabel;

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #F97316 0%, #EA580C 100%); padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
    <h1 style="color: white; margin: 0;">Inbjudan till intervju${opts.companyName ? ` — ${opts.companyName}` : ""}</h1>
  </div>
  <div style="background: #ffffff; padding: 30px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 8px 8px;">
    <p style="font-size: 16px;">Hej ${opts.candidateName},</p>
    <p>Vi vill gärna bjuda in dig till en intervju. Här är detaljerna:</p>

    <div style="background: #f7f7f7; padding: 20px; border-radius: 8px; margin: 25px 0;">
      <p style="margin: 8px 0;"><strong>📅 Datum:</strong> ${opts.interviewDate}</p>
      <p style="margin: 8px 0;"><strong>🕒 Tid:</strong> ${opts.interviewTime}</p>
      <p style="margin: 8px 0;"><strong>⏱️ Längd:</strong> ${opts.durationMinutes} min</p>
      <p style="margin: 8px 0;"><strong>📍 Plats:</strong> ${locationLine}</p>
    </div>

    ${opts.notes ? `<p style="margin-top: 20px;"><strong>Anteckningar:</strong><br/>${opts.notes}</p>` : ""}

    <p style="margin-top: 20px;">En kalenderinbjudan (.ics) bifogas — öppna den för att lägga in mötet i din kalender.</p>

    <p style="color: #666; font-size: 14px; margin-top: 30px;">
      Med vänliga hälsningar,<br/>${opts.bookerName}<br/>via NoCV
    </p>
  </div>
  <div style="text-align: center; padding: 20px; color: #999; font-size: 12px;">
    <p>Detta är ett automatiskt meddelande, vänligen svara inte på detta mail.</p>
  </div>
</body>
</html>`;
}
