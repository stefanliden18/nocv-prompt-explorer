import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabase = createClient(Deno.env.get("SUPABASE_URL") ?? "", Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "");

    const { jobId } = await req.json();

    if (!jobId) {
      throw new Error("Job ID is required");
    }

    console.log("Publishing job to AF:", jobId);

    // Fetch job details
    const { data: job, error: jobError } = await supabase.from("jobs").select("*").eq("id", jobId).single();

    if (jobError || !job) {
      throw new Error("Job not found");
    }

    // Fetch company details
    const { data: company, error: companyError } = await supabase
      .from("companies")
      .select("*")
      .eq("id", job.company_id)
      .single();

    if (companyError || !company) {
      throw new Error("Company not found");
    }

    console.log("Job data:", job);
    console.log("Company data:", company);

    // Validate required AF fields (concept_ids should already be set)
    if (!job.af_occupation_cid) {
      throw new Error("Occupation (af_occupation_cid) is required");
    }
    if (!job.af_municipality_cid) {
      throw new Error("Municipality (af_municipality_cid) is required");
    }
    if (!job.af_employment_type_cid) {
      throw new Error("Employment type (af_employment_type_cid) is required");
    }

    // Prepare the job ad payload for AF
    const lastPublishDate = job.last_application_date || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

    const afPayload = {
      jobAdResponsibleEmail: company.contact_email || "kontakt@nocv.se",
      employerWebAddress: company.website || "https://nocv.se",
      contacts: [
        {
          email: job.contact_person_email || company.contact_email || "kontakt@nocv.se",
          firstname: (job.contact_person_name || company.contact_person || "Kontakt Person").split(" ")[0] || "Kontakt",
          surname: (job.contact_person_name || company.contact_person || "Kontakt Person").split(" ").slice(1).join(" ") || "Person",
          phoneNumber: job.contact_person_phone || company.contact_phone || "070-0000000",
          title: "Kontaktperson",
        },
      ],
      duration: job.af_duration_cid || "a7uU_j21_mkL",
      employmentType: job.af_employment_type_cid,
      eures: false,
      title: job.title,
      description: job.description_md || "Ingen beskrivning tillgänglig",
      keywords: [],
      lastPublishDate: lastPublishDate,
      totalJobOpenings: job.total_positions || 1,
      occupation: job.af_occupation_cid,
      application: {
        method: {
          email: company.contact_email || "jobb@nocv.se",
          webAddress: `https://nocv.se/jobb/${job.slug}`,
        },
        reference: jobId,
      },
      workplaces: [
        {
          name: company.name,
          municipality: job.af_municipality_cid,
          postalAddress: {
            street: company.address || "Okänd adress",
            city: company.city || "Stockholm",
            postalCode: company.postal_code || "11111",
          },
        },
      ],
      wageType: job.af_wage_type_code || "oG8G_9cW_nRf",
    };

    // Add worktimeExtent if available
    if (job.af_worktime_extent_cid) {
      afPayload.worktimeExtent = job.af_worktime_extent_cid;
    }

    console.log("AF Payload:", JSON.stringify(afPayload, null, 2));

    // Get AF credentials from environment
    const afClientId = Deno.env.get("AF_CLIENT_ID");
    const afClientSecret = Deno.env.get("AF_CLIENT_SECRET");
    const afEmployerId = Deno.env.get("NOCV_AF_EMPLOYER_ID");

    if (!afClientId || !afClientSecret || !afEmployerId) {
      throw new Error("AF credentials not configured");
    }

    // Publish to AF
    const afResponse = await fetch(
      "https://apier.arbetsformedlingen.se/direct-transferred-job-posting/v1/prod/jobads",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Employer-Id": afEmployerId,
          client_id: afClientId,
          client_secret: afClientSecret,
        },
        body: JSON.stringify(afPayload),
      },
    );

    const afResponseText = await afResponse.text();
    console.log("AF Response:", afResponseText);

    if (!afResponse.ok) {
      let errorMessage = "❌ Kunde inte publicera till Arbetsförmedlingen";
      let detailedError = "";
      
      try {
        const errorData = JSON.parse(afResponseText);
        
        // Kolla efter specifika AF API-fel
        if (errorData.cause?.message?.errors) {
          const errors = errorData.cause.message.errors;
          detailedError = errors.map((e: any) => `• ${e.field || 'Okänt fält'}: ${e.message || e.reason}`).join('\n');
          errorMessage = `❌ AF API-fel:\n${detailedError}\n\n💡 Tips: Kontrollera att alla fält är korrekt ifyllda och följer AF:s regler.`;
        } else if (errorData.message) {
          detailedError = errorData.message;
          errorMessage = `❌ AF API-fel: ${detailedError}`;
        } else {
          detailedError = JSON.stringify(errorData, null, 2);
          errorMessage = `❌ AF API-fel:\n${detailedError}`;
        }
      } catch {
        detailedError = afResponseText;
        errorMessage = `❌ AF API-fel: ${detailedError}`;
      }
      
      // Spara felmeddelandet i databasen
      await supabase
        .from("jobs")
        .update({
          af_error: errorMessage,
          af_last_sync: new Date().toISOString()
        })
        .eq("id", jobId);
      
      throw new Error(errorMessage);
    }

    const afResult = JSON.parse(afResponseText);
    const afJobId = afResult.id;

    // Update job with AF job ID
    const { error: updateError } = await supabase
      .from("jobs")
      .update({
        af_ad_id: afJobId,
        af_published_at: new Date().toISOString(),
        af_published: true,
      })
      .eq("id", jobId);

    if (updateError) {
      console.error("Error updating job with AF ID:", updateError);
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Job published to Arbetsförmedlingen",
        afJobId,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      },
    );
  } catch (error) {
    console.error("Error in publish-to-af:", error);
    return new Response(
      JSON.stringify({
        error: error.message,
        success: false,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      },
    );
  }
});
