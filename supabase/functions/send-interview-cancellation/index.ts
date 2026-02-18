import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface RequestBody {
  candidateName: string;
  candidateEmail: string;
  jobTitle: string;
}

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { candidateName, candidateEmail, jobTitle }: RequestBody = await req.json();

    if (!candidateName || !candidateEmail || !jobTitle) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const emailHtml = getCancellationEmailTemplate(candidateName, jobTitle);

    const { error: emailError } = await resend.emails.send({
      from: "NoCV <noreply@nocv.se>",
      to: [candidateEmail],
      subject: `Intervju avbokad - ${jobTitle}`,
      html: emailHtml,
    });

    if (emailError) {
      console.error("Email send error:", emailError);
      return new Response(
        JSON.stringify({ error: "Failed to send cancellation email", details: emailError }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    return new Response(
      JSON.stringify({ success: true, message: "Cancellation email sent successfully" }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error in send-interview-cancellation:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

function getCancellationEmailTemplate(
  candidateName: string,
  jobTitle: string
): string {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  
  <div style="background: #6c757d; padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
    <h1 style="color: white; margin: 0;">Intervju avbokad</h1>
  </div>
  
  <div style="background: #ffffff; padding: 30px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 8px 8px;">
    <p style="font-size: 16px; margin-bottom: 20px;">Hej ${candidateName}!</p>
    <p style="font-size: 16px; margin-bottom: 20px;">Vi måste tyvärr meddela att intervjun för tjänsten som ${jobTitle} har blivit avbokad.</p>
    <p style="font-size: 16px; margin-bottom: 20px;">Vi kommer att kontakta dig om vi önskar boka en ny tid.</p>
    <p style="font-size: 16px; margin-bottom: 20px;">Tack för din förståelse.</p>
    
    <p style="color: #666; font-size: 14px; margin-top: 30px;">
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
