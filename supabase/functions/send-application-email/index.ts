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

    // Prepare email content
    const applicationDetails = `
Ny ansökan till: ${job.title}
Företag: ${job.companies?.name || 'Okänt företag'}

Kandidatinformation:
- Namn: ${name}
- E-post: ${email}
- Telefon: ${phone}
${message ? `- Meddelande: ${message}` : ''}
${cv_url ? `- CV: ${cv_url}` : ''}

Se ansökan i admin: https://nocv.se/admin/applications
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
        subject: `Bekräftelse: Din ansökan till ${job.title}`,
        text: `
Hej ${name}!

Tack för din ansökan till ${job.title} hos ${job.companies?.name || 'företaget'}.

Vi har tagit emot din ansökan och kommer att kontakta dig inom kort för att boka en AI-intervju.

Med vänliga hälsningar,
NOCV-teamet

---
Detta är ett automatiskt meddelande från NOCV.
        `.trim(),
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
          subject: `Ny ansökan: ${job.title}`,
          text: applicationDetails,
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
        subject: `Ny ansökan: ${job.title}`,
        text: applicationDetails,
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