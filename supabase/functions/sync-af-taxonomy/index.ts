import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Define all taxonomy types with their versions
const TAXONOMY_CONFIG = [
  {
    type: "occupation-name",
    version: 16,
    url: "https://taxonomy.api.jobtechdev.se/v1/taxonomy/main/concepts?type=occupation-name&version=16",
  },
  {
    type: "employment-type",
    version: 1,
    url: "https://taxonomy.api.jobtechdev.se/v1/taxonomy/main/concepts?type=employment-type&version=1",
  },
  {
    type: "municipality",
    version: 1,
    url: "https://taxonomy.api.jobtechdev.se/v1/taxonomy/main/concepts?type=municipality&version=1",
  },
  {
    type: "worktime-extent",
    version: 16,
    url: "https://taxonomy.api.jobtechdev.se/v1/taxonomy/main/concepts?type=worktime-extent&version=16",
  },
  {
    type: "employment-duration",
    version: 1,
    url: "https://taxonomy.api.jobtechdev.se/v1/taxonomy/main/concepts?type=employment-duration&version=1",
  },
];

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabase = createClient(Deno.env.get("SUPABASE_URL") ?? "", Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "");

    console.log("🔄 Starting AF taxonomy sync to af_taxonomy table...");

    const results = [];
    let totalSynced = 0;

    // Sync each taxonomy type to af_taxonomy table
    for (const config of TAXONOMY_CONFIG) {
      console.log(`\n=== Syncing ${config.type} (v${config.version}) ===`);

      try {
        // Fetch data from AF API
        const response = await fetch(config.url);

        if (!response.ok) {
          console.error(`❌ Failed to fetch ${config.type}: ${response.statusText}`);
          results.push({
            type: config.type,
            version: config.version,
            status: "error",
            message: response.statusText,
          });
          continue;
        }

        const data = await response.json();
        const concepts = data.concepts || data;

        if (!Array.isArray(concepts)) {
          console.error(`❌ Invalid response format for ${config.type}`);
          results.push({
            type: config.type,
            version: config.version,
            status: "error",
            message: "Invalid response format",
          });
          continue;
        }

        console.log(`📊 Found ${concepts.length} ${config.type} concepts`);

        // Delete old data for this type and version
        const { error: deleteError } = await supabase
          .from('af_taxonomy')
          .delete()
          .eq('type', config.type)
          .eq('version', config.version);

        if (deleteError) {
          console.error(`⚠️ Error deleting old ${config.type} data:`, deleteError);
        } else {
          console.log(`🗑️ Cleared old ${config.type} (v${config.version}) data`);
        }

        // Prepare records for insertion
        const records = concepts.map((concept: any) => ({
          concept_id: concept.id,
          type: config.type,
          version: config.version,
          label: concept.label || concept.term || concept.preferred_label,
          is_common: false, // Will be set separately for occupations
        }));

        // Insert data in batches
        const batchSize = 100;
        let inserted = 0;

        for (let i = 0; i < records.length; i += batchSize) {
          const batch = records.slice(i, i + batchSize);

          const { error: insertError } = await supabase
            .from('af_taxonomy')
            .insert(batch);

          if (insertError) {
            console.error(`❌ Error inserting batch ${i}-${i + batch.length}:`, insertError);
          } else {
            inserted += batch.length;
          }
        }

        totalSynced += inserted;
        results.push({
          type: config.type,
          version: config.version,
          status: "success",
          count: inserted,
        });

        console.log(`✅ Successfully synced ${inserted} ${config.type} (v${config.version})`);
      } catch (error) {
        console.error(`❌ Error processing ${config.type}:`, error);
        results.push({
          type: config.type,
          version: config.version,
          status: "error",
          message: error.message,
        });
      }
    }

    console.log(`\n✅ Sync completed!`);
    console.log(`📊 Total concepts synced: ${totalSynced}`);
    console.log("📋 Results:", JSON.stringify(results, null, 2));

    return new Response(
      JSON.stringify({
        success: true,
        message: `Successfully synced ${totalSynced} taxonomy concepts to af_taxonomy table`,
        totalSynced,
        results,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      },
    );
  } catch (error) {
    console.error("❌ Error in sync-af-taxonomy:", error);
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
