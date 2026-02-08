import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface ScreeningRequest {
  application_id: string;
  transcript_text: string;
  role_key: string;
}

interface ScreeningResult {
  match_score: number;
  strengths: string[];
  concerns: string[];
  recommendation: 'proceed' | 'maybe' | 'reject';
  summary: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Ej autentiserad' }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { application_id, transcript_text, role_key }: ScreeningRequest = await req.json();

    if (!application_id || !transcript_text || !role_key) {
      return new Response(
        JSON.stringify({ error: 'application_id, transcript_text och role_key krävs' }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch role profile
    const { data: roleProfile, error: roleError } = await supabase
      .from('role_profiles')
      .select('*')
      .eq('role_key', role_key)
      .single();

    if (roleError || !roleProfile) {
      console.error('Role profile error:', roleError);
      return new Response(
        JSON.stringify({ error: `Yrkesroll '${role_key}' hittades inte` }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch application details
    const { data: application, error: appError } = await supabase
      .from('applications')
      .select(`
        id,
        candidate_name,
        job_id,
        jobs (
          id,
          title,
          description_md,
          requirements_md,
          companies (name)
        )
      `)
      .eq('id', application_id)
      .single();

    if (appError || !application) {
      console.error('Application error:', appError);
      return new Response(
        JSON.stringify({ error: 'Ansökan hittades inte' }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Build AI prompt
    const systemPrompt = `Du är en erfaren rekryteringsexpert inom fordonsbranschen. Din uppgift är att göra en INITIAL SCREENING av en kandidat baserat på en kort intervjutranskribering.

Du bedömer om kandidaten ska gå vidare till en djupare intervju eller inte.

YRKESROLL: ${roleProfile.display_name}
ROLLBESKRIVNING: ${roleProfile.description}

TEKNISKA KOMPETENSER SOM SÖKS:
${JSON.stringify(roleProfile.technical_skills, null, 2)}

MJUKA FÄRDIGHETER SOM SÖKS:
${JSON.stringify(roleProfile.soft_skills, null, 2)}

SCREENING-KRITERIER:
${JSON.stringify(roleProfile.screening_criteria, null, 2)}

JOBB: ${application.jobs?.title || 'Okänt'}
FÖRETAG: ${application.jobs?.companies?.name || 'Okänt'}

Analysera transkriberingen och ge:
1. En match-score (0-100) baserat på hur väl kandidaten matchar screening-kriterierna
2. Nyckelstyrkor som framkommer i intervjun (max 4 punkter)
3. Eventuella orosmoln eller röda flaggor (max 3 punkter, kan vara tomt)
4. En rekommendation: "proceed" (gå vidare), "maybe" (tveksam, behöver mer info), eller "reject" (passar ej)
5. En kort sammanfattning (2-3 meningar)

Var ärlig men rättvis i bedömningen. Fokusera på potential och grundläggande kvalifikationer.`;

    const tools = [
      {
        type: "function",
        function: {
          name: "screening_assessment",
          description: "Returnerar screening-bedömningen av kandidaten",
          parameters: {
            type: "object",
            properties: {
              match_score: {
                type: "number",
                description: "Matchningspoäng 0-100 baserat på screening-kriterier"
              },
              strengths: {
                type: "array",
                items: { type: "string" },
                description: "Kandidatens nyckelstyrkor (max 4)"
              },
              concerns: {
                type: "array",
                items: { type: "string" },
                description: "Eventuella orosmoln eller röda flaggor (kan vara tomt)"
              },
              recommendation: {
                type: "string",
                enum: ["proceed", "maybe", "reject"],
                description: "Rekommendation: proceed (gå vidare), maybe (tveksam), reject (passar ej)"
              },
              summary: {
                type: "string",
                description: "Kort sammanfattning av kandidaten (2-3 meningar)"
              }
            },
            required: ["match_score", "strengths", "concerns", "recommendation", "summary"]
          }
        }
      }
    ];

    console.log(`Generating screening for application ${application_id}, role: ${role_key}`);

    // Call Lovable AI
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `KANDIDATENS INTERVJUTRANSKRIBERING:\n\n${transcript_text}` },
        ],
        tools,
        tool_choice: { type: "function", function: { name: "screening_assessment" } },
      }),
    });

    if (response.status === 429) {
      return new Response(
        JSON.stringify({ error: "För många förfrågningar. Vänta och försök igen." }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (response.status === 402) {
      return new Response(
        JSON.stringify({ error: "AI-tjänsten kräver påfyllning av krediter." }),
        { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(
        JSON.stringify({ error: "AI-tjänsten svarade inte korrekt" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const aiResult = await response.json();
    console.log('AI response:', JSON.stringify(aiResult, null, 2));

    // Parse tool call result
    const toolCall = aiResult.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) {
      throw new Error("AI returned no tool call");
    }

    const screeningResult: ScreeningResult = JSON.parse(toolCall.function.arguments);

    // Save transcript
    const { data: transcript, error: transcriptError } = await supabase
      .from('candidate_transcripts')
      .insert({
        application_id,
        interview_type: 'screening',
        transcript_text,
        source: 'manual'
      })
      .select()
      .single();

    if (transcriptError) {
      console.error('Error saving transcript:', transcriptError);
      throw new Error('Kunde inte spara transkribering');
    }

    // Save assessment
    const { data: assessment, error: assessmentError } = await supabase
      .from('candidate_assessments')
      .insert({
        application_id,
        transcript_id: transcript.id,
        role_profile_id: roleProfile.id,
        assessment_type: 'screening',
        match_score: screeningResult.match_score,
        recommendation: screeningResult.recommendation,
        strengths: screeningResult.strengths,
        concerns: screeningResult.concerns,
        summary: screeningResult.summary
      })
      .select()
      .single();

    if (assessmentError) {
      console.error('Error saving assessment:', assessmentError);
      throw new Error('Kunde inte spara bedömning');
    }

    console.log(`Screening completed for application ${application_id}: ${screeningResult.recommendation} (${screeningResult.match_score}%)`);

    return new Response(
      JSON.stringify({
        success: true,
        assessment: {
          id: assessment.id,
          match_score: screeningResult.match_score,
          recommendation: screeningResult.recommendation,
          strengths: screeningResult.strengths,
          concerns: screeningResult.concerns,
          summary: screeningResult.summary,
          role_profile: {
            role_key: roleProfile.role_key,
            display_name: roleProfile.display_name
          }
        }
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Screening error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Okänt fel uppstod" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
