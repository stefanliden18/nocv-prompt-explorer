import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";
import { Resend } from "npm:resend@2.0.0";
import { format } from "npm:date-fns@3.6.0";
import { sv } from "npm:date-fns@3.6.0/locale";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface RequestBody {
  applicationId: string;
}

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { applicationId }: RequestBody = await req.json();

    if (!applicationId) {
      return new Response(
        JSON.stringify({ error: "applicationId är obligatoriskt" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch application details with job and company info
    const { data: application, error: fetchError } = await supabase
      .from("applications")
      .select(`
        id,
        candidate_name,
        email,
        phone,
        created_at,
        job_id,
        jobs (
          id,
          title,
          contact_person_email,
          hide_company_in_emails,
          companies (
            name,
            contact_email
          )
        )
      `)
      .eq("id", applicationId)
      .single();

    if (fetchError || !application) {
      console.error("Error fetching application:", fetchError);
      return new Response(
        JSON.stringify({ error: "Kunde inte hitta ansökan" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Security check: Only allow emails for recently created applications (max 5 minutes old)
    const applicationAge = new Date().getTime() - new Date(application.created_at).getTime();
    const fiveMinutes = 5 * 60 * 1000;
    
    if (applicationAge > fiveMinutes) {
      console.warn(`Application ${applicationId} is too old (${Math.round(applicationAge / 1000)}s)`);
      return new Response(
        JSON.stringify({ error: "Ansökan är för gammal för att skicka email" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Security check: Prevent duplicate email sending
    const { data: emailCheck } = await supabase
      .from("applications")
      .select("email_sent")
      .eq("id", applicationId)
      .single();

    if (emailCheck?.email_sent) {
      console.warn(`Email already sent for application ${applicationId}`);
      return new Response(
        JSON.stringify({ error: "Email har redan skickats för denna ansökan" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const hideCompany = application.jobs?.hide_company_in_emails === true;
    const jobTitle = application.jobs?.title || "Okänt jobb";
    const companyName = hideCompany ? "Arbetsgivaren" : (application.jobs?.companies?.name || "Företaget");
    const recruiterEmail = application.jobs?.contact_person_email || application.jobs?.companies?.contact_email;
    
    if (!recruiterEmail) {
      console.error("No recruiter email found for application:", applicationId);
    }

    // Format creation date
    const createdDate = format(new Date(application.created_at), "PPP 'kl.' HH:mm", { locale: sv });

    // Admin link for recruiter - use origin from environment
    const origin = Deno.env.get("SITE_URL") || "https://nocv.se";
    const adminLink = `${origin}/admin/applications/${applicationId}`;

    // Email 1: Confirmation to candidate
    const candidateEmailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
            <h1 style="margin: 0; font-size: 28px;">Tack för din ansökan! 🎉</h1>
          </div>
          
          <div style="background: #ffffff; padding: 30px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 10px 10px;">
            <p style="font-size: 16px; margin-bottom: 20px;">Hej ${application.candidate_name}!</p>
            
            <p style="font-size: 16px; margin-bottom: 20px;">
              Vi har mottagit din ansökan till tjänsten som <strong>${jobTitle}</strong>${hideCompany ? '' : ` hos ${companyName}`}.
            </p>
            
            <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 25px 0;">
              <h2 style="margin-top: 0; font-size: 18px; color: #667eea;">Vad händer nu?</h2>
              <ul style="margin: 0; padding-left: 20px;">
                <li style="margin-bottom: 10px;">Vi granskar din ansökan noggrant</li>
                <li style="margin-bottom: 10px;">Du kommer att höra från oss inom kort</li>
                <li style="margin-bottom: 10px;">Ha tålamod - vi återkommer till dig så snart som möjligt</li>
              </ul>
            </div>
            
            <p style="font-size: 16px; margin-bottom: 20px;">
              Om du har några frågor är du välkommen att kontakta oss.
            </p>
            
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0; font-size: 14px; color: #666;">
              <p style="margin-bottom: 10px;"><strong>Dina uppgifter:</strong></p>
              <p style="margin: 5px 0;">Namn: ${application.candidate_name}</p>
              <p style="margin: 5px 0;">E-post: ${application.email}</p>
              ${application.phone ? `<p style="margin: 5px 0;">Telefon: ${application.phone}</p>` : ''}
              <p style="margin: 5px 0;">Tid: ${createdDate}</p>
            </div>
            
            <div style="margin-top: 30px; padding: 15px; background: #f0f4ff; border-left: 4px solid #667eea; border-radius: 4px;">
              <p style="margin: 0; font-size: 12px; color: #666;">
                <strong>GDPR:</strong> Dina personuppgifter behandlas i enlighet med GDPR och används endast för rekryteringsändamål. 
                Du har rätt att begära att få dina uppgifter raderade när som helst.
              </p>
            </div>
          </div>
          
          <div style="text-align: center; margin-top: 20px; padding: 20px; color: #666; font-size: 14px;">
            <p style="margin: 0;">Med vänliga hälsningar,</p>
            <p style="margin: 5px 0; font-weight: bold;">NoCV Team</p>
            <p style="margin: 10px 0;"><a href="https://nocv.se" style="color: #667eea; text-decoration: none;">nocv.se</a></p>
          </div>
        </body>
      </html>
    `;

    // Send email to candidate
    const candidateEmailResult = await resend.emails.send({
      from: "NoCV <noreply@nocv.se>",
      to: [application.email],
      subject: `Tack för din ansökan - ${jobTitle}`,
      html: candidateEmailHtml,
    });

    console.log("Candidate email sent:", candidateEmailResult);

    // Email 2: Notification to recruiter (only if email is available)
    if (recruiterEmail) {
      const recruiterEmailHtml = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
              <h1 style="margin: 0; font-size: 28px;">Ny ansökan mottagen! 📬</h1>
            </div>
            
            <div style="background: #ffffff; padding: 30px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 10px 10px;">
              <p style="font-size: 16px; margin-bottom: 20px;">En ny kandidat har ansökt till din tjänst!</p>
              
              <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 25px 0;">
                <h2 style="margin-top: 0; font-size: 18px; color: #667eea;">Jobbdetaljer</h2>
                <p style="margin: 5px 0;"><strong>Tjänst:</strong> ${jobTitle}</p>
                <p style="margin: 5px 0;"><strong>Företag:</strong> ${companyName}</p>
              </div>
              
              <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 25px 0;">
                <h2 style="margin-top: 0; font-size: 18px; color: #667eea;">Kandidatuppgifter</h2>
                <p style="margin: 5px 0;"><strong>Namn:</strong> ${application.candidate_name}</p>
                <p style="margin: 5px 0;"><strong>E-post:</strong> <a href="mailto:${application.email}" style="color: #667eea;">${application.email}</a></p>
                ${application.phone ? `<p style="margin: 5px 0;"><strong>Telefon:</strong> <a href="tel:${application.phone}" style="color: #667eea;">${application.phone}</a></p>` : ''}
                <p style="margin: 5px 0;"><strong>Ansökt:</strong> ${createdDate}</p>
              </div>
              
              <div style="text-align: center; margin-top: 30px;">
                <a href="${adminLink}" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 14px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">
                  Granska ansökan →
                </a>
              </div>
              
              <p style="font-size: 14px; margin-top: 25px; color: #666; text-align: center;">
                Eller kopiera denna länk: <br>
                <a href="${adminLink}" style="color: #667eea; word-break: break-all;">${adminLink}</a>
              </p>
            </div>
            
            <div style="text-align: center; margin-top: 20px; padding: 20px; color: #666; font-size: 14px;">
              <p style="margin: 0;">NoCV Recruitment Platform</p>
              <p style="margin: 10px 0;"><a href="https://nocv.se" style="color: #667eea; text-decoration: none;">nocv.se</a></p>
            </div>
          </body>
        </html>
      `;

      const recruiterEmailResult = await resend.emails.send({
        from: "NoCV <noreply@nocv.se>",
        to: [recruiterEmail],
        subject: `Ny ansökan: ${application.candidate_name} - ${jobTitle}`,
        html: recruiterEmailHtml,
      });

      console.log("Recruiter email sent:", recruiterEmailResult);
    }

    // Mark email as sent to prevent duplicates
    await supabase
      .from("applications")
      .update({ email_sent: true })
      .eq("id", applicationId);

    return new Response(
      JSON.stringify({ 
        success: true, 
        candidateEmailSent: true,
        recruiterEmailSent: !!recruiterEmail 
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: any) {
    console.error("Error in send-application-email function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
