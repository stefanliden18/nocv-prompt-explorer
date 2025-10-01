import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface InvitationEmailRequest {
  email: string;
  role: string;
  inviteLink: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, role, inviteLink }: InvitationEmailRequest = await req.json();

    console.log("Sending invitation email to:", email, "with role:", role);

    const roleLabels: Record<string, string> = {
      admin: "Administratör",
      recruiter: "Rekryterare",
      user: "Användare",
    };

    const emailResponse = await resend.emails.send({
      from: "NOCV <onboarding@resend.dev>",
      to: [email],
      subject: "Inbjudan till NOCV",
      html: `
        <h1>Välkommen till NOCV!</h1>
        <p>Du har blivit inbjuden att gå med i NOCV som <strong>${roleLabels[role] || role}</strong>.</p>
        <p>Klicka på länken nedan för att sätta ditt lösenord och komma igång:</p>
        <p><a href="${inviteLink}" style="display: inline-block; padding: 12px 24px; background-color: #0066cc; color: white; text-decoration: none; border-radius: 6px;">Acceptera inbjudan</a></p>
        <p>Om knappen inte fungerar, kopiera och klistra in denna länk i din webbläsare:</p>
        <p style="color: #666; word-break: break-all;">${inviteLink}</p>
        <br>
        <p>Med vänliga hälsningar,<br>NOCV-teamet</p>
      `,
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(JSON.stringify(emailResponse), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-user-invitation function:", error);
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
