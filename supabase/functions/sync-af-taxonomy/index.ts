import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Define all taxonomy types and their corresponding tables
const TAXONOMY_CONFIG = [
  {
    type: "occupation-name",
    version: 16,
    table: "af_occupation_codes",
    url: "https://taxonomy.api.jobtechdev.se/v1/taxonomy/main/concepts?type=occupation-name&version=16",
  },
  {
    type: "employment-type",
    version: 1,
    table: "af_employment_type_codes",
    url: "https://taxonomy.api.jobtechdev.se/v1/taxonomy/main/concepts?type=employment-type&version=1",
  },
  {
    type: "municipality",
    version: 1,
    table: "af_municipality_codes",
    url: "https://taxonomy.api.jobtechdev.se/v1/taxonomy/main/concepts?type=municipality&version=1",
  },
  {
    type: "worktime-extent",
    version: 16,
    table: "af_worktime_extent_codes",
    url: "https://taxonomy.api.jobtechdev.se/v1/taxonomy/main/concepts?type=worktime-extent&version=16",
  },
  {
    type: "employment-duration",
    version: 1,
    table: "af_duration_codes",
    url: "https://taxonomy.api.jobtechdev.se/v1/taxonomy/main/concepts?type=employment-duration&version=1",
  },
];

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabase = createClient(Deno.env.get("SUPABASE_URL") ?? "", Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "");

    console.log("Starting comprehensive AF taxonomy sync...");

    const results = [];
    let totalSynced = 0;

    // Sync each taxonomy type to its corresponding table
    for (const config of TAXONOMY_CONFIG) {
      console.log(`\n=== Syncing ${config.type} to ${config.table} ===`);

      try {
        // Fetch data from AF API
        const response = await fetch(config.url);

        if (!response.ok) {
          console.error(`Failed to fetch ${config.type}: ${response.statusText}`);
          results.push({
            type: config.type,
            table: config.table,
            status: "error",
            message: response.statusText,
          });
          continue;
        }

        const data = await response.json();
        const concepts = data.concepts || data;

        if (!Array.isArray(concepts)) {
          console.error(`Invalid response format for ${config.type}`);
          results.push({
            type: config.type,
            table: config.table,
            status: "error",
            message: "Invalid response format",
          });
          continue;
        }

        console.log(`Found ${concepts.length} ${config.type} concepts`);

        // Delete old data from table (but not all rows to avoid deleting dummy UUID)
        const { error: deleteError } = await supabase
          .from(config.table)
          .delete()
          .neq("id", "00000000-0000-0000-0000-000000000000");

        if (deleteError) {
          console.error(`Error deleting old data from ${config.table}:`, deleteError);
        }

        // Prepare records for insertion
        const records = concepts.map((concept: any) => {
          const record: any = {
            code: concept.id,
            label: concept.label || concept.term || concept.preferred_label,
          };

          // Add popularity_score for occupations
          if (config.table === "af_occupation_codes") {
            record.popularity_score = 0;
          }

          return record;
        });

        // Insert data in batches (for large datasets like occupations)
        const batchSize = 100;
        let inserted = 0;

        for (let i = 0; i < records.length; i += batchSize) {
          const batch = records.slice(i, i + batchSize);

          const { error: insertError } = await supabase.from(config.table).insert(batch);

          if (insertError) {
            console.error(`Error inserting batch into ${config.table}:`, insertError);
            // Continue with next batch even if one fails
          } else {
            inserted += batch.length;
          }
        }

        totalSynced += inserted;
        results.push({
          type: config.type,
          table: config.table,
          status: "success",
          count: inserted,
        });

        console.log(`✓ Successfully synced ${inserted} ${config.type} to ${config.table}`);
      } catch (error) {
        console.error(`Error processing ${config.type}:`, error);
        results.push({
          type: config.type,
          table: config.table,
          status: "error",
          message: error.message,
        });
      }
    }

    console.log(`\n=== Sync completed ===`);
    console.log(`Total concepts synced: ${totalSynced}`);
    console.log("Results:", JSON.stringify(results, null, 2));

    return new Response(
      JSON.stringify({
        success: true,
        message: `Successfully synced ${totalSynced} taxonomy concepts across all tables`,
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
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Define all taxonomy types and their corresponding tables
const TAXONOMY_CONFIG = [
  {
    type: "occupation-name",
    version: 16,
    table: "af_occupation_codes",
    url: "https://taxonomy.api.jobtechdev.se/v1/taxonomy/main/concepts?type=occupation-name&version=16",
  },
  {
    type: "employment-type",
    version: 1,
    table: "af_employment_type_codes",
    url: "https://taxonomy.api.jobtechdev.se/v1/taxonomy/main/concepts?type=employment-type&version=1",
  },
  {
    type: "municipality",
    version: 1,
    table: "af_municipality_codes",
    url: "https://taxonomy.api.jobtechdev.se/v1/taxonomy/main/concepts?type=municipality&version=1",
  },
  {
    type: "worktime-extent",
    version: 16,
    table: "af_worktime_extent_codes",
    url: "https://taxonomy.api.jobtechdev.se/v1/taxonomy/main/concepts?type=worktime-extent&version=16",
  },
  {
    type: "employment-duration",
    version: 1,
    table: "af_duration_codes",
    url: "https://taxonomy.api.jobtechdev.se/v1/taxonomy/main/concepts?type=employment-duration&version=1",
  },
];

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabase = createClient(Deno.env.get("SUPABASE_URL") ?? "", Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "");

    console.log("Starting comprehensive AF taxonomy sync...");

    const results = [];
    let totalSynced = 0;

    // Sync each taxonomy type to its corresponding table
    for (const config of TAXONOMY_CONFIG) {
      console.log(`\n=== Syncing ${config.type} to ${config.table} ===`);

      try {
        // Fetch data from AF API
        const response = await fetch(config.url);

        if (!response.ok) {
          console.error(`Failed to fetch ${config.type}: ${response.statusText}`);
          results.push({
            type: config.type,
            table: config.table,
            status: "error",
            message: response.statusText,
          });
          continue;
        }

        const data = await response.json();
        const concepts = data.concepts || data;

        if (!Array.isArray(concepts)) {
          console.error(`Invalid response format for ${config.type}`);
          results.push({
            type: config.type,
            table: config.table,
            status: "error",
            message: "Invalid response format",
          });
          continue;
        }

        console.log(`Found ${concepts.length} ${config.type} concepts`);

        // Delete old data from table (but not all rows to avoid deleting dummy UUID)
        const { error: deleteError } = await supabase
          .from(config.table)
          .delete()
          .neq("id", "00000000-0000-0000-0000-000000000000");

        if (deleteError) {
          console.error(`Error deleting old data from ${config.table}:`, deleteError);
        }

        // Prepare records for insertion
        const records = concepts.map((concept: any) => {
          const record: any = {
            code: concept.id,
            label: concept.label || concept.term || concept.preferred_label,
          };

          // Add popularity_score for occupations
          if (config.table === "af_occupation_codes") {
            record.popularity_score = 0;
          }

          return record;
        });

        // Insert data in batches (for large datasets like occupations)
        const batchSize = 100;
        let inserted = 0;

        for (let i = 0; i < records.length; i += batchSize) {
          const batch = records.slice(i, i + batchSize);

          const { error: insertError } = await supabase.from(config.table).insert(batch);

          if (insertError) {
            console.error(`Error inserting batch into ${config.table}:`, insertError);
            // Continue with next batch even if one fails
          } else {
            inserted += batch.length;
          }
        }

        totalSynced += inserted;
        results.push({
          type: config.type,
          table: config.table,
          status: "success",
          count: inserted,
        });

        console.log(`✓ Successfully synced ${inserted} ${config.type} to ${config.table}`);
      } catch (error) {
        console.error(`Error processing ${config.type}:`, error);
        results.push({
          type: config.type,
          table: config.table,
          status: "error",
          message: error.message,
        });
      }
    }

    console.log(`\n=== Sync completed ===`);
    console.log(`Total concepts synced: ${totalSynced}`);
    console.log("Results:", JSON.stringify(results, null, 2));

    return new Response(
      JSON.stringify({
        success: true,
        message: `Successfully synced ${totalSynced} taxonomy concepts across all tables`,
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
