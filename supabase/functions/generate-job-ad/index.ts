import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

interface RequirementProfile {
  template_id: string;
  role_key: string;
  values: Record<string, Record<string, any>>;
  section_notes?: Record<string, string>;
}

interface CustomerInfo {
  companyName: string;
  contactPerson: string;
  desiredStartDate: string;
  salaryRange: string;
}

interface GenerateJobAdRequest {
  requirement_profile: RequirementProfile;
  customer_info: CustomerInfo;
  role_display_name: string;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      console.error("LOVABLE_API_KEY is not configured");
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const { requirement_profile, customer_info, role_display_name } = await req.json() as GenerateJobAdRequest;

    console.log("Generating job ad for role:", role_display_name);
    console.log("Customer:", customer_info.companyName);

    // Build a structured representation of the requirement profile
    const profileSummary = Object.entries(requirement_profile.values)
      .map(([sectionKey, fields]) => {
        const activeFields = Object.entries(fields)
          .filter(([_, value]) => {
            if (typeof value === 'boolean') return value;
            if (typeof value === 'object' && value?.enabled) return true;
            if (value === 'required' || value === 'preferred') return true;
            if (Array.isArray(value) && value.length > 0) return true;
            if (typeof value === 'string' && value.trim()) return true;
            if (typeof value === 'number' && value > 0) return true;
            return false;
          })
          .map(([key, value]) => {
            if (typeof value === 'boolean') return key;
            if (typeof value === 'object' && value?.enabled) {
              return `${key} (${value.level || 'aktiv'})`;
            }
            if (value === 'required') return `${key} (KRAV)`;
            if (value === 'preferred') return `${key} (meriterande)`;
            if (Array.isArray(value)) return `${key}: ${value.join(', ')}`;
            return `${key}: ${value}`;
          });
        
        const notes = requirement_profile.section_notes?.[sectionKey];
        return activeFields.length > 0 || notes ? 
          `## ${sectionKey}\n${activeFields.join('\n')}${notes ? `\n\nNotering: ${notes}` : ''}` : '';
      })
      .filter(Boolean)
      .join('\n\n');

    const systemPrompt = `Du är en erfaren rekryteringsskribent som arbetar för ett svenskt bemanningsföretag. Din uppgift är att skriva professionella och engagerande platsannonser.

VIKTIGA REGLER:
- Skriv ALLTID på svenska
- Nämn ALDRIG kundens företagsnamn i annonsen (vi är ett bemanningsföretag)
- Var positiv och säljande men professionell
- Använd HTML-formatering för struktur
- Skapa EN SAMMANSLAGEN annons som inkluderar både beskrivning och krav
- Använd <h3> för rubriker, <p> för stycken, <ul>/<li> för punktlistor

INFORMATION OM TJÄNSTEN:
Roll: ${role_display_name}
Kund: ${customer_info.companyName} (visa EJ i annonsen - skriv istället "vår kund" eller liknande)
Önskat tillträde: ${customer_info.desiredStartDate || 'Enligt överenskommelse'}
Lön: ${customer_info.salaryRange || 'Enligt överenskommelse'}

KRAVPROFIL:
${profileSummary}`;

    const userPrompt = `Skriv en komplett platsannons för rollen "${role_display_name}" baserat på kravprofilen ovan. 

Annonsen ska innehålla:
1. En engagerande inledning om tjänsten och arbetsplatsen
2. Beskrivning av arbetsuppgifter
3. Krav och meriterande kvalifikationer i punktlistor

Använd tool calling för att returnera strukturerad data.`;

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
          { role: "user", content: userPrompt }
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "generate_job_ad",
              description: "Genererar en strukturerad platsannons",
              parameters: {
                type: "object",
                properties: {
                  title: {
                    type: "string",
                    description: "Kort, tydlig jobbtitel på svenska (t.ex. 'Bilmekaniker', 'CNC-operatör')"
                  },
                  ad_html: {
                    type: "string",
                    description: "Komplett platsannons i HTML-format. Inkluderar beskrivning av tjänsten, arbetsuppgifter, samt krav och meriterande kvalifikationer. Använd <h3> för rubriker, <p> för stycken, <ul>/<li> för punktlistor."
                  },
                  category: {
                    type: "string",
                    description: "Jobbkategori (t.ex. 'Fordon', 'Industri', 'Bygg', 'Lager')"
                  },
                  employment_type: {
                    type: "string",
                    description: "Anställningsform (t.ex. 'Heltid, Tillsvidare', 'Heltid, Visstid')"
                  }
                },
                required: ["title", "ad_html", "category", "employment_type"],
                additionalProperties: false
              }
            }
          }
        ],
        tool_choice: { type: "function", function: { name: "generate_job_ad" } }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Vänta en stund och försök igen." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Krediter slut. Kontakta administratör." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const aiResponse = await response.json();
    console.log("AI response received");

    // Extract the tool call result
    const toolCall = aiResponse.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall || toolCall.function.name !== "generate_job_ad") {
      console.error("Unexpected AI response format:", JSON.stringify(aiResponse));
      throw new Error("Kunde inte generera annons. Försök igen.");
    }

    const generatedAd = JSON.parse(toolCall.function.arguments);
    console.log("Generated ad title:", generatedAd.title);

    return new Response(
      JSON.stringify(generatedAd),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error in generate-job-ad:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Ett fel uppstod" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
