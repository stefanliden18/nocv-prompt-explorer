import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "npm:resend@2.0.0";
import { format } from "https://esm.sh/date-fns@3.6.0";
import { sv } from "https://esm.sh/date-fns@3.6.0/locale";
import { toZonedTime } from "https://esm.sh/date-fns-tz@3.2.0";

const STOCKHOLM_TZ = 'Europe/Stockholm';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface RequestBody {
  applicationId: string;
  interviewLink: string;
  scheduledAt: string;
  message: string;
  isUpdate?: boolean;
  sendEmail?: boolean;
}

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    const { applicationId, interviewLink, scheduledAt, message, isUpdate, sendEmail = true }: RequestBody = await req.json();

    if (!applicationId || !interviewLink || !scheduledAt || !message) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Validate URL format
    try {
      new URL(interviewLink);
    } catch {
      return new Response(
        JSON.stringify({ error: "Invalid interview link URL" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Validate date is in the future
    const scheduledDate = new Date(scheduledAt);
    const minTime = new Date();
    minTime.setHours(minTime.getHours() + 2);

    if (scheduledDate < minTime) {
      return new Response(
        JSON.stringify({ error: "Interview must be scheduled at least 2 hours in advance" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Get application details
    const { data: application, error: appError } = await supabaseAdmin
      .from("applications")
      .select("id, candidate_name, email, jobs(title)")
      .eq("id", applicationId)
      .single();

    if (appError || !application) {
      console.error("Application fetch error:", appError);
      return new Response(
        JSON.stringify({ error: "Application not found" }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Update application in database
    const { error: updateError } = await supabaseAdmin
      .from("applications")
      .update({
        status: "booked",
        interview_link: interviewLink,
        interview_scheduled_at: scheduledAt,
        interview_notes: message,
        reminder_sent: false,
      })
      .eq("id", applicationId);

    if (updateError) {
      console.error("Application update error:", updateError);
      return new Response(
        JSON.stringify({ error: "Failed to update application" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Send email if requested
    if (sendEmail) {
      // Konvertera UTC till Stockholm-tid för visning
      const stockholmDate = toZonedTime(scheduledDate, STOCKHOLM_TZ);
      const interviewDate = format(stockholmDate, "d MMMM yyyy", { locale: sv });
      const interviewTime = format(stockholmDate, "HH:mm", { locale: sv });
      const jobTitle = application.jobs?.title || "denna position";

      const emailHtml = getInvitationEmailTemplate(
        application.candidate_name,
        jobTitle,
        message,
        interviewDate,
        interviewTime,
        interviewLink,
        isUpdate || false
      );

      const { error: emailError } = await resend.emails.send({
        from: "NOCV <onboarding@resend.dev>",
        to: [application.email],
        subject: `${isUpdate ? 'Uppdaterad ' : ''}Inbjudan till intervju - ${jobTitle}`,
        html: emailHtml,
      });

      if (emailError) {
        console.error("Email send error:", emailError);
        return new Response(
          JSON.stringify({ 
            error: "Interview saved but email failed to send",
            details: emailError 
          }),
          {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
    }

    return new Response(
      JSON.stringify({ success: true, message: "Interview booked successfully" }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error in send-interview-invitation:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

function getInvitationEmailTemplate(
  candidateName: string,
  jobTitle: string,
  message: string,
  interviewDate: string,
  interviewTime: string,
  interviewLink: string,
  isUpdate: boolean = false
): string {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  
  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
    <h1 style="color: white; margin: 0;">${isUpdate ? 'Uppdaterad ' : ''}Inbjudan till intervju</h1>
  </div>
  
  <div style="background: #ffffff; padding: 30px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 8px 8px;">
    <p style="font-size: 16px; margin-bottom: 20px; white-space: pre-wrap;">${message}</p>
    
    <div style="background: #f7f7f7; padding: 20px; border-radius: 8px; margin: 25px 0;">
      <p style="margin: 8px 0;"><strong>📅 Datum:</strong> ${interviewDate}</p>
      <p style="margin: 8px 0;"><strong>🕒 Tid:</strong> ${interviewTime}</p>
      <p style="margin: 8px 0;"><strong>📍 Plats:</strong> Videointervju</p>
    </div>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="${interviewLink}" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px 40px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">
        Gå med i intervjun
      </a>
    </div>
    
    <div style="background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 25px 0; border-radius: 4px;">
      <p style="margin: 0; color: #856404;"><strong>💡 Tips inför intervjun:</strong></p>
      <ul style="margin: 10px 0; padding-left: 20px; color: #856404;">
        <li>Testa din kamera och mikrofon i förväg</li>
        <li>Se till att du har en stabil internetanslutning</li>
        <li>Välj en lugn plats utan störande moment</li>
      </ul>
    </div>
    
    <p style="color: #666; font-size: 14px; margin-top: 30px;">
      Om du behöver ändra tiden eller har frågor, vänligen kontakta oss så snart som möjligt.
    </p>
    
    <p style="color: #666; font-size: 14px;">
      Med vänliga hälsningar,<br>
      Rekryteringsavdelningen
    </p>
  </div>
  
  <div style="text-align: center; padding: 20px; color: #999; font-size: 12px;">
    <p>Detta är ett automatiskt meddelande, vänligen svara inte på detta mail.</p>
  </div>
  
</body>
</html>`;
}
