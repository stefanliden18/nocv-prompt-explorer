import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, context } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Create Supabase client for tool calls
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Build system prompt with context
    const systemPrompt = `Du är en AI-assistent för rekryterare. Du hjälper till att hitta, analysera och hantera kandidater i rekryteringssystemet.

Aktuell kontext:
${context?.selectedJobIds?.length > 0 ? `- Valda jobb: ${context.selectedJobIds.length} st` : '- Alla jobb visas'}
${context?.searchQuery ? `- Sökning: "${context.searchQuery}"` : ''}
${context?.ratingFilter?.length > 0 ? `- Rating-filter: ${context.ratingFilter.join(', ')} stjärnor` : ''}
${context?.tagFilter?.length > 0 ? `- Tagg-filter: ${context.tagFilter.join(', ')}` : ''}

Du kan:
- Söka och filtrera kandidater baserat på olika kriterier
- Ge rekommendationer baserat på rating och taggar
- Ge insikter och statistik om kandidatpool

Svara alltid på svenska och var koncis men informativ. Presentera resultat i tydliga listor eller punkter när det är relevant.`;

    // Define tools for AI
    const tools = [
      {
        type: "function",
        function: {
          name: "get_candidates",
          description: "Hämta kandidater från databasen baserat på filter. Returnerar kandidater med deras information.",
          parameters: {
            type: "object",
            properties: {
              job_ids: {
                type: "array",
                items: { type: "string" },
                description: "Filtrera på specifika jobb-ID:n"
              },
              min_rating: {
                type: "number",
                description: "Minimum rating (1-5)"
              },
              max_rating: {
                type: "number",
                description: "Maximum rating (1-5)"
              },
              tags: {
                type: "array",
                items: { type: "string" },
                description: "Filtrera på taggar"
              },
              stage_names: {
                type: "array",
                items: { type: "string" },
                description: "Filtrera på pipeline-stadier (t.ex. 'Ny ansökan', 'Intervju')"
              },
              limit: {
                type: "number",
                description: "Max antal kandidater att returnera (default: 50)"
              }
            }
          }
        }
      },
      {
        type: "function",
        function: {
          name: "get_statistics",
          description: "Hämta statistik om kandidater i systemet",
          parameters: {
            type: "object",
            properties: {
              job_ids: {
                type: "array",
                items: { type: "string" },
                description: "Filtrera statistik på specifika jobb-ID:n"
              }
            }
          }
        }
      }
    ];

    // Handle tool calls
    const handleToolCall = async (toolName: string, args: any) => {
      console.log(`Executing tool: ${toolName}`, args);

      if (toolName === "get_candidates") {
        let query = supabase
          .from('applications')
          .select(`
            id,
            candidate_name,
            email,
            phone,
            rating,
            status,
            created_at,
            cv_url,
            message,
            notes,
            job_id,
            jobs (
              id,
              title,
              companies (
                name
              )
            ),
            pipeline_stages (
              name
            )
          `)
          .order('created_at', { ascending: false });

        // Apply filters
        if (args.job_ids && args.job_ids.length > 0) {
          query = query.in('job_id', args.job_ids);
        }
        if (args.min_rating) {
          query = query.gte('rating', args.min_rating);
        }
        if (args.max_rating) {
          query = query.lte('rating', args.max_rating);
        }
        if (args.stage_names && args.stage_names.length > 0) {
          const { data: stages } = await supabase
            .from('pipeline_stages')
            .select('id')
            .in('name', args.stage_names);
          
          if (stages && stages.length > 0) {
            query = query.in('pipeline_stage_id', stages.map(s => s.id));
          }
        }
        if (args.limit) {
          query = query.limit(args.limit);
        } else {
          query = query.limit(50);
        }

        const { data, error } = await query;

        if (error) {
          console.error('Database error:', error);
          return { error: error.message };
        }

        // Filter by tags if needed
        let filteredData = data || [];
        if (args.tags && args.tags.length > 0) {
          const { data: tagRelations } = await supabase
            .from('application_tag_relations')
            .select(`
              application_id,
              application_tags (
                name
              )
            `);

          const appIdsWithTags = new Set(
            tagRelations
              ?.filter(rel => 
                args.tags.some((tag: string) => 
                  rel.application_tags?.name?.toLowerCase() === tag.toLowerCase()
                )
              )
              .map(rel => rel.application_id) || []
          );

          filteredData = filteredData.filter(app => appIdsWithTags.has(app.id));
        }

        return {
          candidates: filteredData.map(app => ({
            id: app.id,
            name: app.candidate_name,
            email: app.email,
            phone: app.phone,
            rating: app.rating || 0,
            stage: app.pipeline_stages?.name || 'Okänt',
            job: app.jobs?.title || 'Okänt jobb',
            company: app.jobs?.companies?.name || 'Okänt företag',
            applied_date: app.created_at,
            has_cv: !!app.cv_url,
            notes: app.notes
          })),
          total: filteredData.length
        };
      }

      if (toolName === "get_statistics") {
        let query = supabase
          .from('applications')
          .select(`
            id,
            rating,
            status,
            job_id,
            pipeline_stages (
              name
            )
          `);

        if (args.job_ids && args.job_ids.length > 0) {
          query = query.in('job_id', args.job_ids);
        }

        const { data, error } = await query;

        if (error) {
          console.error('Database error:', error);
          return { error: error.message };
        }

        const stats = {
          total_candidates: data?.length || 0,
          by_rating: {
            5: data?.filter(a => a.rating === 5).length || 0,
            4: data?.filter(a => a.rating === 4).length || 0,
            3: data?.filter(a => a.rating === 3).length || 0,
            2: data?.filter(a => a.rating === 2).length || 0,
            1: data?.filter(a => a.rating === 1).length || 0,
            unrated: data?.filter(a => !a.rating).length || 0
          },
          by_stage: {} as Record<string, number>
        };

        // Count by stage
        data?.forEach(app => {
          const stageName = app.pipeline_stages?.name || 'Okänt';
          stats.by_stage[stageName] = (stats.by_stage[stageName] || 0) + 1;
        });

        return stats;
      }

      return { error: "Unknown tool" };
    };

    // Call Lovable AI
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
        tools,
        stream: true,
      }),
    });

    // Handle rate limits
    if (response.status === 429) {
      return new Response(
        JSON.stringify({ 
          error: "För många förfrågningar just nu. Vänligen försök igen om en stund." 
        }),
        {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (response.status === 402) {
      return new Response(
        JSON.stringify({ 
          error: "AI-tjänsten är tillfälligt otillgänglig. Kontakta support." 
        }),
        {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(
        JSON.stringify({ error: "AI gateway error" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Check if response needs tool calls
    const reader = response.body?.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let toolCallsNeeded: any[] = [];

    if (reader) {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.trim() || line.startsWith(':')) continue;
          if (!line.startsWith('data: ')) continue;
          
          const data = line.slice(6).trim();
          if (data === '[DONE]') continue;

          try {
            const parsed = JSON.parse(data);
            const toolCalls = parsed.choices?.[0]?.delta?.tool_calls;
            if (toolCalls) {
              toolCallsNeeded.push(...toolCalls);
            }
          } catch (e) {
            // Ignore parse errors for streaming chunks
          }
        }
      }
    }

    // If tool calls needed, execute them and make another request
    if (toolCallsNeeded.length > 0) {
      const toolResults = await Promise.all(
        toolCallsNeeded.map(async (toolCall: any) => {
          const result = await handleToolCall(
            toolCall.function.name,
            JSON.parse(toolCall.function.arguments)
          );
          return {
            tool_call_id: toolCall.id,
            role: "tool",
            name: toolCall.function.name,
            content: JSON.stringify(result)
          };
        })
      );

      // Make second request with tool results
      const secondResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            { role: "system", content: systemPrompt },
            ...messages,
            ...toolResults
          ],
          stream: true,
        }),
      });

      return new Response(secondResponse.body, {
        headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
      });
    }

    // Return streaming response
    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("AI chat error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
