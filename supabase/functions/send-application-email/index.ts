import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      name, 
      email, 
      phone, 
      message, 
      cv_url, 
      job_id 
    } = await req.json();

    // Validate required fields
    if (!name || !email || !phone || !job_id) {
      return new Response(
        JSON.stringify({ error: 'Namn, e-post, telefon och jobb-ID är obligatoriska' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return new Response(
        JSON.stringify({ error: 'Ange en giltig e-postadress' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Create Supabase client
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Get job details with company info
    const { data: job, error: jobError } = await supabase
      .from('jobs')
      .select(`
        id,
        title,
        slug,
        created_by,
        companies (
          name
        )
      `)
      .eq('id', job_id)
      .single();

    if (jobError || !job) {
      console.error('Job not found:', jobError);
      return new Response(
        JSON.stringify({ error: 'Jobbet kunde inte hittas' }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Get job creator's email
    const { data: creator, error: creatorError } = await supabase
      .from('profiles')
      .select('email')
      .eq('id', job.created_by)
      .single();

    if (creatorError) {
      console.error('Creator not found:', creatorError);
    }

    // Save application to database
    const { data: application, error: applicationError } = await supabase
      .from('applications')
      .insert({
        candidate_name: name,
        email: email,
        phone: phone,
        message: message || null,
        cv_url: cv_url || null,
        job_id: job_id,
        status: 'new'
      })
      .select()
      .single();

    if (applicationError) {
      console.error('Error saving application:', applicationError);
      return new Response(
        JSON.stringify({ error: 'Kunde inte spara ansökan' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('Application saved successfully:', application);

    // Create HTML email template for candidate
    const candidateEmailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Bekräftelse av din ansökan</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;
      line-height: 1.6;
      color: #333;
      margin: 0;
      padding: 0;
      background-color: #f5f5f5;
    }
    .container {
      max-width: 600px;
      margin: 40px auto;
      background-color: #ffffff;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }
    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 40px 30px;
      text-align: center;
    }
    .header h1 {
      margin: 0;
      font-size: 28px;
      font-weight: 600;
    }
    .content {
      padding: 40px 30px;
    }
    .content h2 {
      color: #667eea;
      font-size: 20px;
      margin-top: 0;
      margin-bottom: 20px;
    }
    .content p {
      margin: 15px 0;
      color: #555;
    }
    .summary-box {
      background-color: #f8f9fa;
      border-left: 4px solid #667eea;
      padding: 20px;
      margin: 25px 0;
      border-radius: 4px;
    }
    .summary-box h3 {
      margin-top: 0;
      color: #333;
      font-size: 16px;
      font-weight: 600;
    }
    .summary-item {
      margin: 10px 0;
      color: #555;
    }
    .summary-item strong {
      color: #333;
      display: inline-block;
      min-width: 100px;
    }
    .next-steps {
      background-color: #e8eaf6;
      padding: 20px;
      border-radius: 4px;
      margin: 25px 0;
    }
    .next-steps h3 {
      margin-top: 0;
      color: #667eea;
      font-size: 16px;
    }
    .next-steps p {
      margin: 10px 0;
      color: #555;
    }
    .footer {
      background-color: #f8f9fa;
      padding: 30px;
      text-align: center;
      border-top: 1px solid #e0e0e0;
    }
    .footer p {
      margin: 5px 0;
      font-size: 14px;
      color: #666;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>✓ Ansökan mottagen!</h1>
    </div>
    
    <div class="content">
      <h2>Tack för din ansökan, ${name}!</h2>
      
      <p>Vi har tagit emot din ansökan och vill bekräfta att allt har gått igenom korrekt.</p>
      
      <div class="summary-box">
        <h3>Sammanfattning av din ansökan</h3>
        <div class="summary-item">
          <strong>Tjänst:</strong> ${job.title}
        </div>
        <div class="summary-item">
          <strong>Företag:</strong> ${job.companies?.name || 'Okänt företag'}
        </div>
        <div class="summary-item">
          <strong>Ditt namn:</strong> ${name}
        </div>
        <div class="summary-item">
          <strong>E-post:</strong> ${email}
        </div>
        <div class="summary-item">
          <strong>Telefon:</strong> ${phone}
        </div>
        ${message ? `<div class="summary-item">
          <strong>Meddelande:</strong> ${message}
        </div>` : ''}
        ${cv_url ? `<div class="summary-item">
          <strong>CV:</strong> <a href="${cv_url}" style="color: #667eea;">Bifogat</a>
        </div>` : ''}
      </div>
      
      <div class="next-steps">
        <h3>Nästa steg</h3>
        <p>Vi kommer att granska din ansökan och höra av oss inom <strong>5 arbetsdagar</strong>.</p>
        <p>Om din profil matchar våra krav kommer vi att kontakta dig för att boka en AI-intervju där du får visa dina praktiska färdigheter.</p>
      </div>
      
      <p>Har du några frågor under tiden? Svara gärna på detta mail så återkommer vi till dig.</p>
      
      <p style="margin-top: 30px;">Med vänliga hälsningar,<br><strong>NOCV-teamet</strong></p>
    </div>
    
    <div class="footer">
      <p><strong>NOCV</strong></p>
      <p>Hitta jobb baserat på vad du kan – inte vad du studerat</p>
      <p style="font-size: 12px; color: #999; margin-top: 15px;">
        Detta är ett automatiskt meddelande. Vänligen svara inte direkt på detta mail.
      </p>
    </div>
  </div>
</body>
</html>
    `.trim();

    // Create HTML email template for recruiter/admin
    const recruiterEmailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Ny ansökan mottagen</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;
      line-height: 1.6;
      color: #333;
      margin: 0;
      padding: 0;
      background-color: #f5f5f5;
    }
    .container {
      max-width: 600px;
      margin: 40px auto;
      background-color: #ffffff;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }
    .header {
      background: linear-gradient(135deg, #1e88e5 0%, #1565c0 100%);
      color: white;
      padding: 40px 30px;
      text-align: center;
    }
    .header h1 {
      margin: 0;
      font-size: 28px;
      font-weight: 600;
    }
    .content {
      padding: 40px 30px;
    }
    .alert-badge {
      display: inline-block;
      background-color: #ff5722;
      color: white;
      padding: 6px 12px;
      border-radius: 4px;
      font-size: 14px;
      font-weight: 600;
      margin-bottom: 20px;
    }
    .job-info {
      background-color: #e3f2fd;
      border-left: 4px solid #1e88e5;
      padding: 20px;
      margin: 25px 0;
      border-radius: 4px;
    }
    .job-info h3 {
      margin-top: 0;
      color: #1565c0;
      font-size: 18px;
    }
    .job-info p {
      margin: 8px 0;
      color: #555;
    }
    .candidate-info {
      background-color: #f8f9fa;
      padding: 20px;
      margin: 25px 0;
      border-radius: 4px;
    }
    .candidate-info h3 {
      margin-top: 0;
      color: #333;
      font-size: 16px;
      font-weight: 600;
    }
    .info-row {
      display: flex;
      margin: 12px 0;
      align-items: flex-start;
    }
    .info-label {
      font-weight: 600;
      color: #333;
      min-width: 100px;
      flex-shrink: 0;
    }
    .info-value {
      color: #555;
      flex: 1;
    }
    .info-value a {
      color: #1e88e5;
      text-decoration: none;
    }
    .info-value a:hover {
      text-decoration: underline;
    }
    .message-box {
      background-color: #fff9e6;
      border: 1px solid #ffd54f;
      padding: 15px;
      margin: 20px 0;
      border-radius: 4px;
    }
    .message-box p {
      margin: 0;
      color: #555;
      font-style: italic;
    }
    .cta-button {
      display: inline-block;
      background: linear-gradient(135deg, #1e88e5 0%, #1565c0 100%);
      color: white;
      padding: 14px 32px;
      text-decoration: none;
      border-radius: 6px;
      font-weight: 600;
      font-size: 16px;
      margin: 25px 0;
      box-shadow: 0 2px 6px rgba(30, 136, 229, 0.3);
    }
    .cta-button:hover {
      opacity: 0.9;
    }
    .footer {
      background-color: #f8f9fa;
      padding: 20px 30px;
      text-align: center;
      border-top: 1px solid #e0e0e0;
    }
    .footer p {
      margin: 5px 0;
      font-size: 14px;
      color: #666;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🔔 Ny ansökan mottagen</h1>
    </div>
    
    <div class="content">
      <div class="alert-badge">NY ANSÖKAN</div>
      
      <p>En ny kandidat har ansökt till en av era tjänster.</p>
      
      <div class="job-info">
        <h3>${job.title}</h3>
        <p><strong>Företag:</strong> ${job.companies?.name || 'Okänt företag'}</p>
        <p><strong>Ansökan mottagen:</strong> ${new Date().toLocaleDateString('sv-SE', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
      </div>
      
      <div class="candidate-info">
        <h3>Kandidatinformation</h3>
        
        <div class="info-row">
          <span class="info-label">Namn:</span>
          <span class="info-value">${name}</span>
        </div>
        
        <div class="info-row">
          <span class="info-label">E-post:</span>
          <span class="info-value">
            <a href="mailto:${email}">${email}</a>
          </span>
        </div>
        
        <div class="info-row">
          <span class="info-label">Telefon:</span>
          <span class="info-value">
            <a href="tel:${phone}">${phone}</a>
          </span>
        </div>
        
        ${cv_url ? `<div class="info-row">
          <span class="info-label">CV:</span>
          <span class="info-value">
            <a href="${cv_url}" target="_blank">Öppna CV</a>
          </span>
        </div>` : ''}
      </div>
      
      ${message ? `<div class="message-box">
        <p><strong>Meddelande från kandidaten:</strong></p>
        <p>"${message}"</p>
      </div>` : ''}
      
      <div style="text-align: center;">
        <a href="https://nocv.se/admin/applications/${application.id}" class="cta-button">
          Granska ansökan i admin →
        </a>
      </div>
      
      <p style="font-size: 14px; color: #666; margin-top: 30px;">
        Klicka på knappen ovan för att se fullständig information och hantera ansökan.
      </p>
    </div>
    
    <div class="footer">
      <p><strong>NOCV Admin</strong></p>
      <p style="font-size: 12px; color: #999;">
        Detta är ett automatiskt meddelande från NOCV-plattformen
      </p>
    </div>
  </div>
</body>
</html>
    `.trim();

    // Send confirmation email to candidate
    const candidateEmailResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'NOCV <noreply@nocv.se>',
        to: [email],
        subject: `✓ Bekräftelse: Din ansökan till ${job.title}`,
        html: candidateEmailHtml,
      }),
    });

    if (!candidateEmailResponse.ok) {
      const error = await candidateEmailResponse.text();
      console.error('Failed to send candidate confirmation:', error);
    } else {
      console.log('Candidate confirmation sent successfully');
    }

    // Send notification to job creator
    if (creator?.email) {
      const creatorEmailResponse = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'NOCV <noreply@nocv.se>',
          to: [creator.email],
          subject: `🔔 Ny ansökan: ${job.title}`,
          html: recruiterEmailHtml,
          reply_to: email,
        }),
      });

      if (!creatorEmailResponse.ok) {
        const error = await creatorEmailResponse.text();
        console.error('Failed to send creator notification:', error);
      } else {
        console.log('Creator notification sent successfully');
      }
    }

    // Send notification to admin
    const adminEmailResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'NOCV <noreply@nocv.se>',
        to: ['hello@nocv.se'],
        subject: `🔔 Ny ansökan: ${job.title}`,
        html: recruiterEmailHtml,
        reply_to: email,
      }),
    });

    if (!adminEmailResponse.ok) {
      const error = await adminEmailResponse.text();
      console.error('Failed to send admin notification:', error);
    } else {
      console.log('Admin notification sent successfully');
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Ansökan skickad!',
        application_id: application.id
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error in send-application-email function:', error);
    
    return new Response(
      JSON.stringify({ error: 'Ett fel uppstod. Försök igen senare.' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});