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

    // Helper function to lookup concept_id from taxonomy tables
    async function lookupConceptId(
      table: string,
      searchValue: string,
      searchField: string = "label",
    ): Promise<string | null> {
      console.log(`Looking up in ${table}: ${searchField} = ${searchValue}`);

      const { data, error } = await supabase.from(table).select("code").ilike(searchField, searchValue).single();

      if (error) {
        console.error(`Error looking up ${searchValue} in ${table}:`, error);
        return null;
      }

      console.log(`Found code: ${data?.code}`);
      return data?.code || null;
    }

    // Map employment type from your internal format to AF concept_id
    let employmentTypeCode = null;
    if (job.employment_type) {
      // Try to find by label match
      const employmentTypeMapping: Record<string, string> = {
        "full-time": "Vanlig anställning",
        "part-time": "Vanlig anställning",
        temporary: "Vikariat",
        contract: "Vikariat",
        seasonal: "Säsongsarbete",
        "on-demand": "Behovsanställning",
        freelance: "Frilans",
        "summer-job": "Sommarjobb/Feriejobb",
      };

      const mappedLabel = employmentTypeMapping[job.employment_type.toLowerCase()] || job.employment_type;
      employmentTypeCode = await lookupConceptId("af_employment_type_codes", mappedLabel);

      if (!employmentTypeCode) {
        throw new Error(`Employment type '${job.employment_type}' not found in af_employment_type_codes table`);
      }
    } else {
      throw new Error("Employment type is required");
    }

    // Map occupation to AF concept_id
    let occupationCode = null;
    if (job.title) {
      occupationCode = await lookupConceptId("af_occupation_codes", job.title);

      if (!occupationCode) {
        console.warn(`Occupation '${job.title}' not found in af_occupation_codes, trying generic search...`);
        // Try to find any occupation that contains the job title
        const { data: occupations } = await supabase
          .from("af_occupation_codes")
          .select("code, label")
          .ilike("label", `%${job.title}%`)
          .limit(1);

        if (occupations && occupations.length > 0) {
          occupationCode = occupations[0].code;
          console.log(`Found similar occupation: ${occupations[0].label} (${occupationCode})`);
        } else {
          throw new Error(`Occupation matching '${job.title}' not found in af_occupation_codes table`);
        }
      }
    } else {
      throw new Error("Job title is required");
    }

    // Map municipality
    let municipalityCode = null;
    if (job.location || company.city) {
      const locationToSearch = job.location || company.city;
      municipalityCode = await lookupConceptId("af_municipality_codes", locationToSearch);

      if (!municipalityCode) {
        console.warn(`Municipality '${locationToSearch}' not found in af_municipality_codes`);
        // Try to extract city name if location has full address
        const cityMatch = locationToSearch.match(/([A-Za-zåäöÅÄÖ\s]+)$/);
        if (cityMatch) {
          municipalityCode = await lookupConceptId("af_municipality_codes", cityMatch[1].trim());
        }

        if (!municipalityCode) {
          throw new Error(`Municipality '${locationToSearch}' not found in af_municipality_codes table`);
        }
      }
    } else {
      throw new Error("Location is required");
    }

    // Map worktime extent (default to full-time if not specified)
    let worktimeExtentCode = null;
    const worktimeMapping: Record<string, string> = {
      "full-time": "Heltid",
      "part-time": "Deltid",
    };

    const worktimeLabel = worktimeMapping[job.employment_type?.toLowerCase()] || "Heltid";
    worktimeExtentCode = await lookupConceptId("af_worktime_extent_codes", worktimeLabel);

    if (!worktimeExtentCode) {
      console.warn("Worktime extent not found, this might cause issues");
    }

    // Map duration (default to "Tillsvidare" if not specified)
    let durationCode = null;
    if (job.contract_type) {
      durationCode = await lookupConceptId("af_duration_codes", job.contract_type);
    }

    if (!durationCode) {
      // Default to "Tillsvidare" (permanent)
      durationCode = await lookupConceptId("af_duration_codes", "Tillsvidare");
    }

    // Prepare the job ad payload for AF
    const lastPublishDate = new Date();
    lastPublishDate.setDate(lastPublishDate.getDate() + 30); // 30 days from now

    const afPayload = {
      jobAdResponsibleEmail: company.contact_email || "kontakt@nocv.se",
      employerWebAddress: company.website || "https://nocv.se",
      contacts: [
        {
          email: company.contact_email || "kontakt@nocv.se",
          firstname: company.contact_name?.split(" ")[0] || "Kontakt",
          surname: company.contact_name?.split(" ").slice(1).join(" ") || "Person",
          phoneNumber: company.phone || "070-0000000",
          title: "Kontaktperson",
        },
      ],
      duration: durationCode,
      employmentType: employmentTypeCode,
      eures: false,
      title: job.title,
      description: job.description || "Ingen beskrivning tillgänglig",
      keywords: [],
      lastPublishDate: lastPublishDate.toISOString().split("T")[0],
      totalJobOpenings: 1,
      occupation: occupationCode,
      application: {
        method: {
          email: company.contact_email || "jobb@nocv.se",
          webAddress: `https://nocv.se/jobs/${jobId}`,
        },
        reference: jobId,
      },
      worktimeExtent: worktimeExtentCode,
      workplaces: [
        {
          name: company.name,
          municipality: municipalityCode,
          postalAddress: {
            street: company.address || "Okänd adress",
            city: company.city || "Stockholm",
            postalCode: company.postal_code || "11111",
          },
        },
      ],
      wageType: "oG8G_9cW_nRf", // Fixed salary - you might want to make this dynamic too
    };

    console.log("AF Payload:", JSON.stringify(afPayload, null, 2));

    // Get AF credentials from environment
    const afClientId = Deno.env.get("AF_CLIENT_ID");
    const afClientSecret = Deno.env.get("AF_CLIENT_SECRET");
    const afEmployerId = Deno.env.get("AF_EMPLOYER_ID") || company.af_employer_id;

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
      let errorMessage = "Failed to publish to Arbetsförmedlingen";
      try {
        const errorData = JSON.parse(afResponseText);
        errorMessage = JSON.stringify(errorData, null, 2);
      } catch {
        errorMessage = afResponseText;
      }
      throw new Error(errorMessage);
    }

    const afResult = JSON.parse(afResponseText);
    const afJobId = afResult.id;

    // Update job with AF job ID
    const { error: updateError } = await supabase
      .from("jobs")
      .update({
        af_job_id: afJobId,
        af_published_at: new Date().toISOString(),
        af_status: "published",
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
        conceptIds: {
          employmentType: employmentTypeCode,
          occupation: occupationCode,
          municipality: municipalityCode,
          worktimeExtent: worktimeExtentCode,
          duration: durationCode,
        },
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
