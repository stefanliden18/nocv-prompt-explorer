import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface PortalInvitationRequest {
  email: string;
  name: string;
  companyName: string;
  inviteLink: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, name, companyName, inviteLink }: PortalInvitationRequest =
      await req.json();

    console.log("Sending portal invitation to:", email, "for company:", companyName);

    const emailResponse = await resend.emails.send({
      from: "NoCV <noreply@nocv.se>",
      to: [email],
      subject: `Välkommen till kundportalen – ${companyName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #1a1a1a;">Välkommen till NoCV:s kundportal!</h1>
          <p>Hej ${name},</p>
          <p>Du har fått tillgång till NoCV:s kundportal för <strong>${companyName}</strong>.</p>
          <p>I portalen kan du:</p>
          <ul>
            <li>Se presenterade kandidater för era uppdrag</li>
            <li>Boka intervjuer direkt med kandidater</li>
            <li>Följa statusen på pågående rekryteringar</li>
          </ul>
          <p>Klicka på knappen nedan för att logga in och komma igång:</p>
          <p style="text-align: center; margin: 30px 0;">
            <a href="${inviteLink}" style="display: inline-block; padding: 14px 28px; background-color: #0066cc; color: white; text-decoration: none; border-radius: 6px; font-weight: bold;">
              Logga in på kundportalen
            </a>
          </p>
          <p style="color: #666; font-size: 14px;">Om knappen inte fungerar, kopiera och klistra in denna länk i din webbläsare:</p>
          <p style="color: #666; word-break: break-all; font-size: 14px;">${inviteLink}</p>
          <br>
          <p>Med vänliga hälsningar,<br>NoCV-teamet</p>
        </div>
      `,
    });

    console.log("Portal invitation email sent:", emailResponse);

    return new Response(JSON.stringify(emailResponse), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error in send-portal-invitation:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
