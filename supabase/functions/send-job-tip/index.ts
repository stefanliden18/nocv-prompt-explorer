import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import { createClient } from "jsr:@supabase/supabase-js@2";
import * as DOMPurify from "npm:isomorphic-dompurify@2.14.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface JobTipRequest {
  senderName: string;
  senderEmail: string;
  friendEmail: string;
  jobTitle: string;
  jobSlug: string;
  companyName: string;
  location: string;
  personalMessage?: string;
}

// Rate limiting store (in-memory, resets on function restart)
const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

const checkRateLimit = (identifier: string): boolean => {
  const now = Date.now();
  const limit = rateLimitStore.get(identifier);

  if (!limit || now > limit.resetAt) {
    // Reset or create new limit
    rateLimitStore.set(identifier, {
      count: 1,
      resetAt: now + 24 * 60 * 60 * 1000, // 24 hours
    });
    return true;
  }

  if (limit.count >= 10) {
    return false; // Rate limit exceeded
  }

  limit.count++;
  return true;
};

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const {
      senderName,
      senderEmail,
      friendEmail,
      jobTitle,
      jobSlug,
      companyName,
      location,
      personalMessage = "",
    }: JobTipRequest = await req.json();

    // Validate required fields
    if (!senderName || !senderEmail || !friendEmail || !jobTitle || !jobSlug || !companyName) {
      throw new Error("Missing required fields");
    }

    // Rate limiting by email
    if (!checkRateLimit(senderEmail)) {
      throw new Error("För många försök. Max 10 tips per dag.");
    }

    // Sanitize personal message
    const sanitizedMessage = DOMPurify.sanitize(personalMessage.substring(0, 500));

    // Construct job URL
    const jobUrl = `https://nocv.se/jobb/${jobSlug}`;

    // Build email HTML
    const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #1a365d 0%, #2c5282 100%); color: white; padding: 30px; border-radius: 8px 8px 0 0; }
    .content { background: #f8fafc; padding: 30px; border-radius: 0 0 8px 8px; }
    .job-card { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f97316; }
    .btn { display: inline-block; background: #f97316; color: white; padding: 14px 32px; text-decoration: none; border-radius: 6px; font-weight: 600; margin: 20px 0; }
    .personal-message { background: #fff7ed; padding: 15px; border-radius: 6px; border-left: 3px solid #f97316; margin: 20px 0; font-style: italic; }
    .benefits { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
    .benefit-item { display: flex; align-items: start; margin: 10px 0; }
    .footer { text-align: center; padding: 20px; color: #64748b; font-size: 14px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 style="margin: 0; font-size: 28px;">💡 Jobbtips från ${senderName}</h1>
    </div>
    
    <div class="content">
      <p style="font-size: 16px; margin-top: 0;">Hej!</p>
      
      <p><strong>${senderName}</strong> tänkte att detta jobb skulle passa dig perfekt:</p>
      
      <div class="job-card">
        <h2 style="margin-top: 0; color: #1a365d; font-size: 22px;">${jobTitle}</h2>
        <p style="margin: 8px 0; color: #64748b;">
          <strong>🏢 Företag:</strong> ${companyName}<br>
          <strong>📍 Plats:</strong> ${location}
        </p>
      </div>
      
      ${sanitizedMessage ? `
      <div class="personal-message">
        <strong>Personligt meddelande från ${senderName}:</strong><br>
        "${sanitizedMessage}"
      </div>
      ` : ''}
      
      <div style="text-align: center;">
        <a href="${jobUrl}" class="btn">Se jobbet</a>
      </div>
      
      <div class="benefits">
        <h3 style="margin-top: 0; color: #1a365d;">Varför NOCV?</h3>
        <div class="benefit-item">✅ <strong>Inget CV behövs</strong> - Sök jobb på 2 minuter</div>
        <div class="benefit-item">✅ <strong>Snabb ansökan</strong> - Hoppa över det traditionella pappersarbetet</div>
        <div class="benefit-item">✅ <strong>Personlig matchning</strong> - Vi fokuserar på din kompetens</div>
        <div class="benefit-item">✅ <strong>Moderna verktyg</strong> - Boka videointervjuer direkt</div>
      </div>
      
      <p style="color: #64748b; font-size: 14px; margin-top: 30px;">
        Detta tips skickades från <strong>${senderEmail}</strong>. Du kan svara direkt till dem om du har frågor.
      </p>
    </div>
    
    <div class="footer">
      <p>NOCV - Rekrytering för framtidens industri</p>
      <p style="font-size: 12px; color: #94a3b8;">
        <a href="https://nocv.se" style="color: #f97316; text-decoration: none;">nocv.se</a> | 
        <a href="https://nocv.se/jobs" style="color: #f97316; text-decoration: none;">Lediga jobb</a>
      </p>
    </div>
  </div>
</body>
</html>
    `;

    // Send email via Resend
    const emailResponse = await resend.emails.send({
      from: "NOCV <onboarding@resend.dev>",
      to: [friendEmail],
      replyTo: senderEmail,
      subject: `${senderName} tipsar om ett jobb: ${jobTitle}`,
      html: emailHtml,
    });

    console.log("Job tip email sent successfully:", emailResponse);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Tip sent successfully",
        emailId: emailResponse.data?.id 
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in send-job-tip function:", error);
    return new Response(
      JSON.stringify({ 
        error: error.message || "Failed to send tip",
        success: false 
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
