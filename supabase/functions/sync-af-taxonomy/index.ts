import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Define all taxonomy types we need to fetch
const TAXONOMY_TYPES = [
  { type: "occupation-name", version: 16 },
  { type: "employment-type", version: 1 },
  { type: "municipality", version: 1 },
  { type: "wage-type", version: 1 },
  { type: "country", version: 1 },
  { type: "worktime-extent", version: 16 },
  { type: "employment-duration", version: 1 },
  { type: "skill", version: 16 },
  { type: "language", version: 1 },
  { type: "driving-licence", version: 1 },
  { type: "sun-education-level-1", version: 1 },
  { type: "sun-education-field-2", version: 1 },
  { type: "occupation-experience-year", version: 16 },
];

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabase = createClient(Deno.env.get("SUPABASE_URL") ?? "", Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "");

    console.log("Starting AF taxonomy sync for all types...");

    let totalSynced = 0;
    const results = [];

    // Fetch each taxonomy type
    for (const taxonomyType of TAXONOMY_TYPES) {
      console.log(`Fetching ${taxonomyType.type} version ${taxonomyType.version}...`);

      try {
        const url =
          taxonomyType.type === "language"
            ? `https://taxonomy.api.jobtechdev.se/v1/taxonomy/specific/concepts/${taxonomyType.type}?version=${taxonomyType.version}`
            : `https://taxonomy.api.jobtechdev.se/v1/taxonomy/main/concepts?type=${taxonomyType.type}&version=${taxonomyType.version}`;

        const response = await fetch(url);

        if (!response.ok) {
          console.error(`Failed to fetch ${taxonomyType.type}: ${response.statusText}`);
          results.push({
            type: taxonomyType.type,
            version: taxonomyType.version,
            status: "error",
            message: response.statusText,
          });
          continue;
        }

        const data = await response.json();
        const concepts = data.concepts || data;

        if (!Array.isArray(concepts)) {
          console.error(`Invalid response format for ${taxonomyType.type}`);
          results.push({
            type: taxonomyType.type,
            version: taxonomyType.version,
            status: "error",
            message: "Invalid response format",
          });
          continue;
        }

        console.log(`Found ${concepts.length} concepts for ${taxonomyType.type}`);

        // Prepare data for insertion
        const taxonomyData = concepts.map((concept: any) => ({
          concept_id: concept.id,
          type: taxonomyType.type,
          version: taxonomyType.version.toString(),
          label: concept.label || concept.term || concept.preferred_label,
          code: concept.code || null,
        }));

        // Delete existing entries for this type and version
        const { error: deleteError } = await supabase
          .from("af_taxonomy")
          .delete()
          .eq("type", taxonomyType.type)
          .eq("version", taxonomyType.version.toString());

        if (deleteError) {
          console.error(`Error deleting old ${taxonomyType.type} data:`, deleteError);
        }

        // Insert new data in batches
        const batchSize = 100;
        let inserted = 0;

        for (let i = 0; i < taxonomyData.length; i += batchSize) {
          const batch = taxonomyData.slice(i, i + batchSize);
          const { error: insertError } = await supabase.from("af_taxonomy").insert(batch);

          if (insertError) {
            console.error(`Error inserting batch for ${taxonomyType.type}:`, insertError);
          } else {
            inserted += batch.length;
          }
        }

        totalSynced += inserted;
        results.push({
          type: taxonomyType.type,
          version: taxonomyType.version,
          status: "success",
          count: inserted,
        });

        console.log(`Successfully synced ${inserted} ${taxonomyType.type} concepts`);
      } catch (error) {
        console.error(`Error processing ${taxonomyType.type}:`, error);
        results.push({
          type: taxonomyType.type,
          version: taxonomyType.version,
          status: "error",
          message: error.message,
        });
      }
    }

    console.log(`Sync completed. Total concepts synced: ${totalSynced}`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Successfully synced ${totalSynced} taxonomy concepts`,
        totalSynced,
        results,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      },
    );
  } catch (error) {
    console.error("Error in sync-af-taxonomy:", error);
    return new Response(
      JSON.stringify({
        error: error.message,
        success: false,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      },
    );
  }
});
