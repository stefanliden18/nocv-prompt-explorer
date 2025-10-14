import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "npm:resend@2.0.0";
import { format } from "https://esm.sh/date-fns@3.6.0";
import { sv } from "https://esm.sh/date-fns@3.6.0/locale";
import { toZonedTime } from "https://esm.sh/date-fns-tz@3.2.0";

const STOCKHOLM_TZ = 'Europe/Stockholm';

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

serve(async (req) => {
  try {
    console.log("Starting interview reminder job...");

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

    // Calculate target time (24 hours from now, ±30 minutes)
    const targetTime = new Date();
    targetTime.setHours(targetTime.getHours() + 24);
    const startWindow = new Date(targetTime.getTime() - 30 * 60 * 1000);
    const endWindow = new Date(targetTime.getTime() + 30 * 60 * 1000);

    console.log("Looking for interviews between:", startWindow, "and", endWindow);

    // Find interviews that need reminders
    const { data: applications, error } = await supabaseAdmin
      .from("applications")
      .select("id, candidate_name, email, interview_scheduled_at, interview_link, jobs(title)")
      .eq("status", "booked")
      .eq("reminder_sent", false)
      .gte("interview_scheduled_at", startWindow.toISOString())
      .lte("interview_scheduled_at", endWindow.toISOString());

    if (error) {
      console.error("Error fetching applications:", error);
      throw error;
    }

    console.log(`Found ${applications?.length || 0} interviews needing reminders`);

    let successCount = 0;
    let errorCount = 0;

    // Send reminders
    for (const app of applications || []) {
      try {
        const scheduledDate = new Date(app.interview_scheduled_at);
        // Konvertera UTC till Stockholm-tid för visning
        const stockholmDate = toZonedTime(scheduledDate, STOCKHOLM_TZ);
        const interviewDate = format(stockholmDate, "d MMMM yyyy", { locale: sv });
        const interviewTime = format(stockholmDate, "HH:mm", { locale: sv });
        const jobTitle = app.jobs?.title || "denna position";

        const emailHtml = getReminderEmailTemplate(
          app.candidate_name,
          jobTitle,
          interviewDate,
          interviewTime,
          app.interview_link || ""
        );

        const { error: emailError } = await resend.emails.send({
          from: "NOCV <onboarding@resend.dev>",
          to: [app.email],
          subject: `Påminnelse: Intervju imorgon - ${jobTitle}`,
          html: emailHtml,
        });

        if (emailError) {
          console.error(`Failed to send reminder to ${app.email}:`, emailError);
          errorCount++;
          continue;
        }

        // Mark reminder as sent
        const { error: updateError } = await supabaseAdmin
          .from("applications")
          .update({ reminder_sent: true })
          .eq("id", app.id);

        if (updateError) {
          console.error(`Failed to update reminder_sent for ${app.id}:`, updateError);
          errorCount++;
        } else {
          successCount++;
          console.log(`Reminder sent successfully to ${app.email}`);
        }
      } catch (error) {
        console.error(`Error processing application ${app.id}:`, error);
        errorCount++;
      }
    }

    const result = {
      success: true,
      total: applications?.length || 0,
      sent: successCount,
      failed: errorCount,
      timestamp: new Date().toISOString(),
    };

    console.log("Interview reminder job completed:", result);

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in send-interview-reminder:", error);
    return new Response(
      JSON.stringify({ error: error.message, timestamp: new Date().toISOString() }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
});

function getReminderEmailTemplate(
  candidateName: string,
  jobTitle: string,
  interviewDate: string,
  interviewTime: string,
  interviewLink: string
): string {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  
  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
    <h1 style="color: white; margin: 0;">Påminnelse: Intervju imorgon</h1>
  </div>
  
  <div style="background: #ffffff; padding: 30px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 8px 8px;">
    <p style="font-size: 16px; margin-bottom: 20px;">Hej ${candidateName}!</p>
    <p style="font-size: 16px; margin-bottom: 20px;">Detta är en vänlig påminnelse om att du har en intervju schemalagd imorgon för tjänsten som ${jobTitle}.</p>
    
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
      Vi ser fram emot att träffa dig!
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
