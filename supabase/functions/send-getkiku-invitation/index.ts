import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface GetkikuInvitationRequest {
  email: string;
  candidateName: string;
  phone: string;
  jobId: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, candidateName, phone, jobId }: GetkikuInvitationRequest = await req.json();

    console.log("Processing Getkiku invitation for:", { email, candidateName, jobId });

    // Validate input
    if (!email || !candidateName || !jobId) {
      console.error("Missing required fields");
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch job details
    const { data: job, error: jobError } = await supabase
      .from("jobs")
      .select(`
        id,
        title,
        kiku_interview_url,
        hide_company_in_emails,
        companies (
          name
        )
      `)
      .eq("id", jobId)
      .single();

    if (jobError || !job) {
      console.error("Error fetching job:", jobError);
      return new Response(
        JSON.stringify({ error: "Job not found" }),
        { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    if (!job.kiku_interview_url) {
      console.error("Job does not have a Getkiku interview URL");
      return new Response(
        JSON.stringify({ error: "Job does not have a Getkiku interview URL" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const hideCompany = job.hide_company_in_emails === true;
    const companyName = hideCompany ? "arbetsgivaren" : (job.companies?.name || "företaget");

    // Send Getkiku invitation email
    const emailResponse = await resend.emails.send({
      from: "NOCV <noreply@nocv.se>",
      to: [email],
      subject: hideCompany
        ? `Din AI-intervju med Sara för ${job.title}`
        : `Din AI-intervju med Sara för ${job.title} hos ${companyName}`,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
              body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f4f4f4; }
              .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
              .header { background: linear-gradient(135deg, #1a1a1a 0%, #333333 100%); padding: 40px 30px; text-align: center; }
              .header h1 { color: #ffffff; margin: 0; font-size: 28px; font-weight: 600; }
              .content { padding: 40px 30px; }
              .content h2 { color: #1a1a1a; font-size: 22px; margin-top: 0; margin-bottom: 20px; }
              .content p { margin: 16px 0; color: #555; }
              .cta-button { display: inline-block; background: linear-gradient(135deg, #f97316 0%, #ea580c 100%); color: #ffffff !important; padding: 16px 40px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; margin: 24px 0; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
              .cta-button:hover { box-shadow: 0 6px 12px rgba(0,0,0,0.15); }
              .tips-box { background-color: #f8f9fa; border-left: 4px solid #1a1a1a; padding: 20px; margin: 24px 0; border-radius: 4px; }
              .tips-box h3 { margin-top: 0; color: #1a1a1a; font-size: 18px; }
              .tips-box ul { margin: 12px 0; padding-left: 20px; }
              .tips-box li { margin: 8px 0; color: #555; }
              .footer { background-color: #f8f9fa; padding: 30px; text-align: center; color: #777; font-size: 14px; }
              .footer a { color: #1a1a1a; text-decoration: none; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>🤖 Din AI-intervju med Sara väntar!</h1>
              </div>
              
              <div class="content">
                <h2>Hej ${candidateName}!</h2>
                
                <p>Tack för ditt intresse för tjänsten som <strong>${job.title}</strong>${hideCompany ? '' : ` hos <strong>${companyName}</strong>`}!</p>
                
                <p>För att slutföra din ansökan behöver du genomföra en kort AI-intervju med Sara via Getkiku. Intervjun tar cirka <strong>5-10 minuter</strong> och du kan göra den när det passar dig bäst.</p>
                
                <div style="text-align: center; margin: 32px 0;">
                  <a href="${job.kiku_interview_url}" style="display: inline-block; background: linear-gradient(135deg, #f97316 0%, #ea580c 100%); color: #ffffff !important; padding: 16px 40px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; margin: 24px 0; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                    🤖 Starta min AI-intervju
                  </a>
                </div>
                
                <div class="tips-box">
                  <h3>💡 Tips innan du börjar:</h3>
                  <ul>
                    <li>Se till att du har en fungerande mikrofon</li>
                    <li>Välj en lugn plats där du kan prata ostört</li>
                    <li>Svara ärligt och var dig själv</li>
                    <li>Du kan genomföra intervjun när det passar dig</li>
                  </ul>
                </div>
                
                <p style="color: #777; font-size: 14px; margin-top: 32px;">
                  <strong>Problem att starta intervjun?</strong><br>
                  Klicka på länken igen eller kopiera denna URL till din webbläsare:<br>
                  <a href="${job.kiku_interview_url}" style="color: #1a1a1a; word-break: break-all;">${job.kiku_interview_url}</a>
                </p>
                
                <p style="margin-top: 32px;">Lycka till med intervjun!</p>
                
                <p style="margin-top: 24px;">
                  Med vänliga hälsningar,<br>
                  <strong>NOCV Team</strong>
                </p>
              </div>
              
              <div class="footer">
                <p style="margin: 0 0 8px 0;">
                  Dina personuppgifter behandlas enligt GDPR.
                </p>
                <p style="margin: 8px 0;">
                  <a href="https://nocv.se">www.nocv.se</a>
                </p>
              </div>
            </div>
          </body>
        </html>
      `,
    });

    console.log("Getkiku invitation email sent:", emailResponse);

    if (emailResponse.error) {
      console.error("Error sending email:", emailResponse.error);
      return new Response(
        JSON.stringify({ error: "Failed to send email" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Getkiku invitation sent successfully",
        emailId: emailResponse.data?.id 
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in send-getkiku-invitation function:", error);
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
