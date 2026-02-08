import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import DOMPurify from "npm:isomorphic-dompurify@2.14.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface NOCVTipRequest {
  senderName: string;
  senderEmail: string;
  friendEmail: string;
  category: "jobseeker" | "recruiter" | "general";
  personalMessage?: string;
}

// Rate limiting store
const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

const checkRateLimit = (identifier: string): boolean => {
  const now = Date.now();
  const limit = rateLimitStore.get(identifier);

  if (!limit || now > limit.resetAt) {
    rateLimitStore.set(identifier, {
      count: 1,
      resetAt: now + 24 * 60 * 60 * 1000, // 24 hours
    });
    return true;
  }

  if (limit.count >= 10) {
    return false;
  }

  limit.count++;
  return true;
};

const getEmailContent = (
  category: string,
  senderName: string,
  personalMessage: string
): { subject: string; html: string } => {
  const baseStyles = `
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #1a365d 0%, #2c5282 100%); color: white; padding: 30px; border-radius: 8px 8px 0 0; }
    .content { background: #f8fafc; padding: 30px; border-radius: 0 0 8px 8px; }
    .btn { display: inline-block; background: #f97316; color: white; padding: 14px 32px; text-decoration: none; border-radius: 6px; font-weight: 600; margin: 20px 0; }
    .personal-message { background: #fff7ed; padding: 15px; border-radius: 6px; border-left: 3px solid #f97316; margin: 20px 0; font-style: italic; }
    .benefits { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
    .benefit-item { display: flex; align-items: start; margin: 10px 0; }
    .footer { text-align: center; padding: 20px; color: #64748b; font-size: 14px; }
    .highlight-box { background: white; padding: 25px; border-radius: 8px; margin: 20px 0; border: 2px solid #f97316; }
  `;

  const personalMessageHtml = personalMessage ? `
    <div class="personal-message">
      <strong>Personligt meddelande från ${senderName}:</strong><br>
      "${personalMessage}"
    </div>
  ` : '';

  if (category === "jobseeker") {
    return {
      subject: `${senderName} tipsar: Slipp CV:t - testa dina kunskaper!`,
      html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>${baseStyles}</style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 style="margin: 0; font-size: 28px;">💡 Tips från ${senderName}</h1>
    </div>
    
    <div class="content">
      <p style="font-size: 16px; margin-top: 0;">Hej!</p>
      
      <p><strong>${senderName}</strong> tänkte att NOCV skulle kunna hjälpa dig i din jobbsökning!</p>
      
      ${personalMessageHtml}
      
      <div class="highlight-box">
        <h2 style="margin-top: 0; color: #1a365d;">🎯 Slipp CV:t - sök jobb genom kunskapsfrågor</h2>
        <p>Sök jobb genom att svara på kunskapsfrågor under 5-10 minuter. Testa om du når över 50% rätt! :)</p>
      </div>
      
      <div class="benefits">
        <h3 style="margin-top: 0; color: #1a365d;">✨ Fördelar för dig:</h3>
        <div class="benefit-item">✅ <strong>Inga dokument</strong> - Glöm CV och personligt brev</div>
        <div class="benefit-item">✅ <strong>Kunskapsfrågor</strong> - Visa vad du kan på 5-10 min</div>
        <div class="benefit-item">✅ <strong>Testa dig själv</strong> - Nå över 50% och sök jobbet</div>
        <div class="benefit-item">✅ <strong>Fokus på kunskap</strong> - Inte på papper</div>
      </div>
      
      <div style="text-align: center;">
        <a href="https://nocv.se/jobs" class="btn">Hitta ditt nästa jobb</a>
      </div>
      
      <p style="color: #64748b; font-size: 14px; margin-top: 30px;">
        Detta tips skickades från <strong>${senderName}</strong>.
      </p>
    </div>
    
    <div class="footer">
      <p>NOCV - Rekrytering för framtidens industri</p>
      <p style="font-size: 12px; color: #94a3b8;">
        <a href="https://nocv.se" style="color: #f97316;">nocv.se</a> | 
        <a href="https://nocv.se/jobs" style="color: #f97316;">Lediga jobb</a>
      </p>
    </div>
  </div>
</body>
</html>
      `,
    };
  }

  if (category === "recruiter") {
    return {
      subject: `${senderName} tipsar: Rekrytera snabbare utan dokument`,
      html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>${baseStyles}</style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 style="margin: 0; font-size: 28px;">💡 Tips från ${senderName}</h1>
    </div>
    
    <div class="content">
      <p style="font-size: 16px; margin-top: 0;">Hej!</p>
      
      <p><strong>${senderName}</strong> tipsar om NOCV - en modern rekryteringslösning!</p>
      
      ${personalMessageHtml}
      
      <div class="highlight-box">
        <h2 style="margin-top: 0; color: #1a365d;">🚀 Rekrytera snabbare - helt utan dokument</h2>
        <p>NOCV eliminerar CV-granskning och fokuserar på det som spelar roll: rätt kompetens för jobbet.</p>
      </div>
      
      <div class="benefits">
        <h3 style="margin-top: 0; color: #1a365d;">✨ Fördelar:</h3>
        <div class="benefit-item">✅ <strong>Inga CV att granska</strong> - Spara upp till 50% av tiden på varje rekrytering</div>
        <div class="benefit-item">✅ <strong>Kunskapsbaserade frågor</strong> - Mäter verklig kompetens</div>
        <div class="benefit-item">✅ <strong>Hög träffsäkerhet</strong> - Rätt kandidater redan från start</div>
        <div class="benefit-item">✅ <strong>Snabbare till anställning</strong> - Ingen dokumenthantering</div>
      </div>
      
      <div style="text-align: center;">
        <a href="https://nocv.se/companies" class="btn">Läs mer för företag</a>
      </div>
      
      <p style="color: #64748b; font-size: 14px; margin-top: 30px;">
        Detta tips skickades från <strong>${senderName}</strong>.
      </p>
    </div>
    
    <div class="footer">
      <p>NOCV - Rekrytering för framtidens industri</p>
      <p style="font-size: 12px; color: #94a3b8;">
        <a href="https://nocv.se" style="color: #f97316;">nocv.se</a> | 
        <a href="https://nocv.se/companies" style="color: #f97316;">För företag</a>
      </p>
    </div>
  </div>
</body>
</html>
      `,
    };
  }

  // General category
  return {
    subject: `${senderName} tipsar om NOCV`,
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>${baseStyles}</style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 style="margin: 0; font-size: 28px;">💡 Tips från ${senderName}</h1>
    </div>
    
    <div class="content">
      <p style="font-size: 16px; margin-top: 0;">Hej!</p>
      
      <p><strong>${senderName}</strong> vill tipsa dig om NOCV!</p>
      
      ${personalMessageHtml}
      
      <div class="highlight-box">
        <h2 style="margin-top: 0; color: #1a365d;">💡 Framtiden för rekrytering är här</h2>
        <p>NOCV tar bort CV:t från rekryteringsprocessen. Istället fokuserar vi på vad som verkligen räknas: kompetens, erfarenhet och personlighet.</p>
      </div>
      
      <div class="benefits">
        <h3 style="margin-top: 0; color: #1a365d;">🎯 Hur det fungerar:</h3>
        <div class="benefit-item">👤 <strong>Jobbsökare:</strong> Ansök på 2 minuter utan CV</div>
        <div class="benefit-item">🏢 <strong>Företag:</strong> Hitta rätt kandidater snabbare</div>
        <div class="benefit-item">🤖 <strong>AI:</strong> Matcha kompetens automatiskt</div>
        <div class="benefit-item">🎥 <strong>GetKiku:</strong> Videointervjuer som fungerar</div>
      </div>
      
      <div style="text-align: center;">
        <a href="https://nocv.se" class="btn">Läs mer om NOCV</a>
      </div>
      
      <p style="color: #64748b; font-size: 14px; margin-top: 30px;">
        Detta tips skickades från <strong>${senderName}</strong>.
      </p>
    </div>
    
    <div class="footer">
      <p>NOCV - Rekrytering för framtidens industri</p>
      <p style="font-size: 12px; color: #94a3b8;">
        <a href="https://nocv.se" style="color: #f97316;">nocv.se</a> | 
        <a href="https://nocv.se/jobs" style="color: #f97316;">Lediga jobb</a> | 
        <a href="https://nocv.se/companies" style="color: #f97316;">För företag</a>
      </p>
    </div>
  </div>
</body>
</html>
    `,
  };
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const requestBody = await req.json();
    console.log("Received NOCV tip request:", JSON.stringify(requestBody, null, 2));

    const {
      senderName,
      senderEmail,
      friendEmail,
      category,
      personalMessage = "",
    }: NOCVTipRequest = requestBody;

    // Validate required fields with detailed error
    const missingFields = [];
    if (!senderName?.trim()) missingFields.push('senderName');
    if (!senderEmail?.trim()) missingFields.push('senderEmail');
    if (!friendEmail?.trim()) missingFields.push('friendEmail');
    if (!category) missingFields.push('category');

    if (missingFields.length > 0) {
      throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
    }

    if (!checkRateLimit(senderEmail)) {
      throw new Error("För många försök. Max 10 tips per dag.");
    }

    const sanitizedMessage = DOMPurify.sanitize(personalMessage.substring(0, 500));
    const { subject, html } = getEmailContent(category, senderName, sanitizedMessage);

    const emailResponse = await resend.emails.send({
      from: "NOCV <noreply@nocv.se>",
      to: [friendEmail],
      replyTo: senderEmail,
      subject,
      html,
    });

    console.log("NOCV tip email sent successfully:", emailResponse);

    return new Response(
      JSON.stringify({
        success: true,
        message: "Tip sent successfully",
        emailId: emailResponse.data?.id,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in send-nocv-tip function:", error);
    return new Response(
      JSON.stringify({
        error: error.message || "Failed to send tip",
        success: false,
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
