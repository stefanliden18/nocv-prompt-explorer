import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface FinalAssessmentRequest {
  application_id: string;
  transcript_text: string;
  role_key: string;
}

interface FinalAssessmentResult {
  match_score: number;
  role_match_score: number;
  job_match_score: number;
  strengths: Array<{ point: string; evidence: string }>;
  concerns: string[];
  technical_assessment: string;
  soft_skills_assessment: string;
  summary: string;
  skill_scores: Record<string, number>;
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

    const { application_id, transcript_text, role_key }: FinalAssessmentRequest = await req.json();

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

    // Fetch application with job details
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
          city,
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

    // Build comprehensive AI prompt for final assessment
    const systemPrompt = `Du är en erfaren rekryteringsexpert inom fordonsbranschen. Din uppgift är att göra en FULLSTÄNDIG BEDÖMNING av en kandidat baserat på en djupintervju.

Detta är slutsteget i rekryteringsprocessen. Kandidaten har redan passerat initial screening och genomfört en fördjupad intervju.

YRKESROLL: ${roleProfile.display_name}
ROLLBESKRIVNING: ${roleProfile.description}

TEKNISKA KOMPETENSER SOM SÖKS:
${JSON.stringify(roleProfile.technical_skills, null, 2)}

MJUKA FÄRDIGHETER SOM SÖKS:
${JSON.stringify(roleProfile.soft_skills, null, 2)}

KUNSKAPSOMRÅDEN:
${JSON.stringify(roleProfile.knowledge_areas, null, 2)}

JOBB: ${application.jobs?.title || 'Okänt'}
FÖRETAG: ${application.jobs?.companies?.name || 'Okänt'}
PLATS: ${application.jobs?.city || 'Ej specificerat'}

JOBBESKRIVNING:
${application.jobs?.description_md || 'Ingen beskrivning tillgänglig'}

KRAVPROFIL:
${application.jobs?.requirements_md || 'Inga krav specificerade'}

Analysera intervjutranskriberingen noggrant och ge en detaljerad bedömning:

1. **Övergripande matchningspoäng** (0-100): Genomsnitt av roll- och jobbmatchning
2. **Rollmatchning** (0-100): Hur väl kandidaten matchar yrkesrollens baskrav
3. **Jobbmatchning** (0-100): Hur väl kandidaten matchar den specifika platsannonsens krav
4. **Styrkor** (max 5): Konkreta styrkor med citat/bevis från intervjun
5. **Utvecklingsområden** (max 3): Eventuella gap eller områden att utveckla
6. **Teknisk bedömning**: Utförlig bedömning av tekniska färdigheter
7. **Bedömning av mjuka färdigheter**: Utförlig bedömning av personliga egenskaper
8. **Sammanfattning**: Professionell sammanfattning (3-5 meningar) lämplig att dela med kund
9. **Kompetenspoäng**: Ge 0-100 poäng för varje teknisk kompetens och kunskapsområde baserat på intervjun

Var objektiv, professionell och fokusera på konkreta exempel från intervjun.`;

    const tools = [
      {
        type: "function",
        function: {
          name: "final_assessment",
          description: "Returnerar den fullständiga bedömningen av kandidaten",
          parameters: {
            type: "object",
            properties: {
              match_score: {
                type: "number",
                description: "Övergripande matchningspoäng 0-100"
              },
              role_match_score: {
                type: "number",
                description: "Matchning mot yrkesrollens baskrav 0-100"
              },
              job_match_score: {
                type: "number",
                description: "Matchning mot platsannonsens krav 0-100"
              },
              strengths: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    point: { type: "string", description: "Styrkan i korthet" },
                    evidence: { type: "string", description: "Citat eller exempel från intervjun" }
                  },
                  required: ["point", "evidence"]
                },
                description: "Kandidatens styrkor med bevis (max 5)"
              },
              concerns: {
                type: "array",
                items: { type: "string" },
                description: "Utvecklingsområden eller gap (max 3)"
              },
              technical_assessment: {
                type: "string",
                description: "Utförlig bedömning av tekniska färdigheter (2-4 meningar)"
              },
              soft_skills_assessment: {
                type: "string",
                description: "Utförlig bedömning av mjuka färdigheter (2-4 meningar)"
              },
              summary: {
                type: "string",
                description: "Professionell sammanfattning för kund (3-5 meningar)"
              },
              skill_scores: {
                type: "object",
                description: "Poäng 0-100 för varje teknisk kompetens och kunskapsområde (t.ex. {'Motordiagnostik': 85, 'Bromssystem': 70})"
              }
            },
            required: ["match_score", "role_match_score", "job_match_score", "strengths", "concerns", "technical_assessment", "soft_skills_assessment", "summary", "skill_scores"]
          }
        }
      }
    ];

    console.log(`Generating final assessment for application ${application_id}, role: ${role_key}`);

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
          { role: "user", content: `KANDIDATENS FULLSTÄNDIGA INTERVJUTRANSKRIBERING:\n\n${transcript_text}` },
        ],
        tools,
        tool_choice: { type: "function", function: { name: "final_assessment" } },
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

    const assessmentResult: FinalAssessmentResult = JSON.parse(toolCall.function.arguments);

    // Save transcript
    const { data: transcript, error: transcriptError } = await supabase
      .from('candidate_transcripts')
      .insert({
        application_id,
        interview_type: 'full_interview',
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
        assessment_type: 'final',
        match_score: assessmentResult.match_score,
        role_match_score: assessmentResult.role_match_score,
        job_match_score: assessmentResult.job_match_score,
        strengths: assessmentResult.strengths,
        concerns: assessmentResult.concerns,
        technical_assessment: assessmentResult.technical_assessment,
        soft_skills_assessment: assessmentResult.soft_skills_assessment,
        summary: assessmentResult.summary
      })
      .select()
      .single();

    if (assessmentError) {
      console.error('Error saving assessment:', assessmentError);
      throw new Error('Kunde inte spara bedömning');
    }

    // Generate share token and create presentation
    const shareToken = crypto.randomUUID().replace(/-/g, '') + crypto.randomUUID().replace(/-/g, '');
    
    // Generate HTML presentation
    const presentationHtml = generatePresentationHtml({
      candidateName: application.candidate_name,
      roleName: roleProfile.display_name,
      jobTitle: application.jobs?.title || '',
      companyName: application.jobs?.companies?.name || '',
      assessment: assessmentResult
    });

    const { data: presentation, error: presentationError } = await supabase
      .from('candidate_presentations')
      .insert({
        application_id,
        final_assessment_id: assessment.id,
        presentation_html: presentationHtml,
        status: 'draft',
        share_token: shareToken,
        skill_scores: assessmentResult.skill_scores || {},
        recruiter_notes: '',
        soft_values_notes: ''
      })
      .select()
      .single();

    if (presentationError) {
      console.error('Error saving presentation:', presentationError);
      throw new Error('Kunde inte spara presentation');
    }

    console.log(`Final assessment completed for application ${application_id}: ${assessmentResult.match_score}%`);

    return new Response(
      JSON.stringify({
        success: true,
        assessment: {
          id: assessment.id,
          match_score: assessmentResult.match_score,
          role_match_score: assessmentResult.role_match_score,
          job_match_score: assessmentResult.job_match_score,
          strengths: assessmentResult.strengths,
          concerns: assessmentResult.concerns,
          technical_assessment: assessmentResult.technical_assessment,
          soft_skills_assessment: assessmentResult.soft_skills_assessment,
          summary: assessmentResult.summary,
          role_profile: {
            role_key: roleProfile.role_key,
            display_name: roleProfile.display_name
          }
        },
        presentation: {
          id: presentation.id,
          share_token: shareToken,
          status: 'draft'
        }
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Final assessment error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Okänt fel uppstod" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

function generatePresentationHtml(data: {
  candidateName: string;
  roleName: string;
  jobTitle: string;
  companyName: string;
  assessment: FinalAssessmentResult;
}): string {
  const { candidateName, roleName, jobTitle, companyName, assessment } = data;
  
  const strengthsHtml = assessment.strengths.map(s => `
    <div class="strength-item">
      <h4>${escapeHtml(s.point)}</h4>
      <p class="evidence">"${escapeHtml(s.evidence)}"</p>
    </div>
  `).join('');

  const concernsHtml = assessment.concerns.length > 0 
    ? `<div class="concerns-section">
        <h3>Utvecklingsområden</h3>
        <ul>
          ${assessment.concerns.map(c => `<li>${escapeHtml(c)}</li>`).join('')}
        </ul>
      </div>`
    : '';

  return `
<!DOCTYPE html>
<html lang="sv">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Kandidatpresentation - ${escapeHtml(candidateName)}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { 
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      line-height: 1.6;
      color: #1a1a1a;
      background: #f5f5f5;
    }
    .container { max-width: 800px; margin: 0 auto; padding: 40px 20px; }
    .card { 
      background: white;
      border-radius: 12px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.08);
      padding: 32px;
      margin-bottom: 24px;
    }
    .header { text-align: center; margin-bottom: 32px; }
    .header h1 { font-size: 28px; color: #1a1a1a; margin-bottom: 8px; }
    .header .role { color: #666; font-size: 18px; }
    .header .job { color: #888; font-size: 14px; margin-top: 4px; }
    .score-section { 
      display: flex; 
      justify-content: center; 
      gap: 40px; 
      margin: 32px 0;
      flex-wrap: wrap;
    }
    .score-item { text-align: center; }
    .score-circle {
      width: 100px;
      height: 100px;
      border-radius: 50%;
      background: linear-gradient(135deg, #10b981 0%, #059669 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 8px;
    }
    .score-circle.medium { background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); }
    .score-circle.low { background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); }
    .score-value { font-size: 28px; font-weight: 700; color: white; }
    .score-label { font-size: 13px; color: #666; }
    h2 { font-size: 20px; color: #1a1a1a; margin-bottom: 16px; border-bottom: 2px solid #e5e5e5; padding-bottom: 8px; }
    h3 { font-size: 16px; color: #333; margin-bottom: 12px; }
    .summary { font-size: 16px; color: #444; font-style: italic; }
    .strengths-section { margin-top: 24px; }
    .strength-item { 
      background: #f0fdf4; 
      border-left: 4px solid #10b981; 
      padding: 16px; 
      margin-bottom: 12px;
      border-radius: 0 8px 8px 0;
    }
    .strength-item h4 { color: #166534; font-size: 15px; margin-bottom: 8px; }
    .strength-item .evidence { color: #666; font-size: 14px; font-style: italic; }
    .concerns-section { margin-top: 24px; }
    .concerns-section ul { 
      list-style: none; 
      padding: 0;
    }
    .concerns-section li { 
      background: #fef3c7; 
      border-left: 4px solid #f59e0b; 
      padding: 12px 16px;
      margin-bottom: 8px;
      border-radius: 0 8px 8px 0;
      color: #92400e;
    }
    .assessment-section { margin-top: 24px; }
    .assessment-block { 
      background: #f8fafc; 
      padding: 16px; 
      border-radius: 8px; 
      margin-bottom: 16px;
    }
    .assessment-block h3 { color: #334155; margin-bottom: 8px; }
    .assessment-block p { color: #475569; }
    .footer { 
      text-align: center; 
      color: #888; 
      font-size: 12px; 
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #e5e5e5;
    }
    @media print {
      body { background: white; }
      .card { box-shadow: none; border: 1px solid #e5e5e5; }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="card">
      <div class="header">
        <h1>${escapeHtml(candidateName)}</h1>
        <div class="role">${escapeHtml(roleName)}</div>
        <div class="job">${escapeHtml(jobTitle)} • ${escapeHtml(companyName)}</div>
      </div>

      <div class="score-section">
        <div class="score-item">
          <div class="score-circle ${assessment.match_score < 50 ? 'low' : assessment.match_score < 70 ? 'medium' : ''}">
            <span class="score-value">${assessment.match_score}%</span>
          </div>
          <div class="score-label">Total matchning</div>
        </div>
        <div class="score-item">
          <div class="score-circle ${assessment.role_match_score < 50 ? 'low' : assessment.role_match_score < 70 ? 'medium' : ''}">
            <span class="score-value">${assessment.role_match_score}%</span>
          </div>
          <div class="score-label">Rollmatchning</div>
        </div>
        <div class="score-item">
          <div class="score-circle ${assessment.job_match_score < 50 ? 'low' : assessment.job_match_score < 70 ? 'medium' : ''}">
            <span class="score-value">${assessment.job_match_score}%</span>
          </div>
          <div class="score-label">Jobbmatchning</div>
        </div>
      </div>

      <h2>Sammanfattning</h2>
      <p class="summary">${escapeHtml(assessment.summary)}</p>

      <div class="strengths-section">
        <h2>Styrkor</h2>
        ${strengthsHtml}
      </div>

      ${concernsHtml}

      <div class="assessment-section">
        <h2>Detaljerad bedömning</h2>
        <div class="assessment-block">
          <h3>Tekniska färdigheter</h3>
          <p>${escapeHtml(assessment.technical_assessment)}</p>
        </div>
        <div class="assessment-block">
          <h3>Mjuka färdigheter</h3>
          <p>${escapeHtml(assessment.soft_skills_assessment)}</p>
        </div>
      </div>
    </div>

    <div class="footer">
      Genererad av NOCV Rekryteringssystem
    </div>
  </div>
</body>
</html>
  `.trim();
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
