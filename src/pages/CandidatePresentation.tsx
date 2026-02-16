import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Skeleton } from '@/components/ui/skeleton';
import { HelmetProvider, Helmet } from 'react-helmet-async';
import { CandidatePresentationView, type PresentationData } from '@/components/CandidatePresentationView';
import type { Json } from '@/integrations/supabase/types';

interface PresentationRow {
  id: string;
  presentation_html: string | null;
  status: string;
  published_at: string | null;
  recruiter_notes: string | null;
  soft_values_notes: string | null;
  skill_scores: Json;
  applications: {
    candidate_name: string;
    email: string;
    phone: string | null;
    jobs: {
      title: string;
      companies: {
        name: string;
      } | null;
    } | null;
  } | null;
  candidate_assessments: {
    match_score: number | null;
    role_match_score: number | null;
    job_match_score: number | null;
    summary: string | null;
    technical_assessment: string | null;
    soft_skills_assessment: string | null;
    strengths: Json;
    concerns: Json;
    role_profiles: {
      display_name: string;
    } | null;
  } | null;
}

export default function CandidatePresentation() {
  const { token } = useParams();
  const { isAdmin, loading: authLoading } = useAuth();
  const [presentation, setPresentation] = useState<PresentationRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;
    fetchPresentation();
  }, [token, isAdmin, authLoading]);

  const fetchPresentation = async () => {
    if (!token) {
      setError('Ogiltig länk');
      setLoading(false);
      return;
    }

    try {
      let query = supabase
        .from('candidate_presentations')
        .select(`
          id,
          presentation_html,
          status,
          published_at,
          recruiter_notes,
          soft_values_notes,
          skill_scores,
          applications (
            candidate_name,
            email,
            phone,
            jobs (
              title,
              companies (name)
            )
          ),
          candidate_assessments:final_assessment_id (
            match_score,
            role_match_score,
            job_match_score,
            summary,
            technical_assessment,
            soft_skills_assessment,
            strengths,
            concerns,
            role_profiles:role_profile_id (
              display_name
            )
          )
        `)
        .eq('share_token', token);

      if (!isAdmin) {
        query = query.eq('status', 'published');
      }

      const { data, error: fetchError } = await query.maybeSingle();

      if (fetchError) throw fetchError;

      if (!data) {
        setError('Presentationen hittades inte eller är inte tillgänglig');
        setLoading(false);
        return;
      }

      setPresentation(data as unknown as PresentationRow);
    } catch (err) {
      console.error('Error fetching presentation:', err);
      setError('Kunde inte ladda presentationen');
    } finally {
      setLoading(false);
    }
  };

  if (loading || authLoading) {
    return (
      <div className="min-h-screen bg-muted/30 p-4">
        <div className="max-w-3xl mx-auto space-y-4">
          <Skeleton className="h-12 w-64 mx-auto" />
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-muted/30 flex items-center justify-center p-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-2">Sidan kunde inte visas</h1>
          <p className="text-muted-foreground">{error}</p>
        </div>
      </div>
    );
  }

  // Check if we have modern React data or need to fall back to HTML
  const assessment = presentation?.candidate_assessments;
  const hasModernData = assessment && assessment.match_score !== null;

  const candidateName = presentation?.applications?.candidate_name || 'Kandidat';

  // If we have modern data, render the React component
  if (hasModernData) {
    const parseJsonArray = <T,>(json: Json): T[] => {
      if (Array.isArray(json)) return json as T[];
      return [];
    };

    const parseSkillScores = (json: Json): Record<string, number> => {
      if (json && typeof json === 'object' && !Array.isArray(json)) {
        return json as Record<string, number>;
      }
      return {};
    };

    const presentationData: PresentationData = {
      candidateName,
      candidateEmail: presentation?.applications?.email || undefined,
      candidatePhone: presentation?.applications?.phone || undefined,
      roleName: assessment.role_profiles?.display_name || 'Yrkesroll',
      jobTitle: presentation?.applications?.jobs?.title || 'Tjänst',
      companyName: presentation?.applications?.jobs?.companies?.name || 'Företag',
      matchScore: assessment.match_score || 0,
      roleMatchScore: assessment.role_match_score || 0,
      jobMatchScore: assessment.job_match_score || 0,
      summary: assessment.summary || '',
      technicalAssessment: assessment.technical_assessment || '',
      softSkillsAssessment: assessment.soft_skills_assessment || '',
      strengths: parseJsonArray<{ point: string; evidence: string }>(assessment.strengths),
      concerns: parseJsonArray<string>(assessment.concerns),
      skillScores: parseSkillScores(presentation?.skill_scores || {}),
      recruiterNotes: presentation?.recruiter_notes || undefined,
      softValuesNotes: presentation?.soft_values_notes || undefined,
    };

    return (
      <HelmetProvider>
        <Helmet>
          <title>Kandidatpresentation - {candidateName}</title>
          <meta name="robots" content="noindex, nofollow" />
        </Helmet>
        {presentation?.status === 'draft' && isAdmin && (
          <div className="bg-warning text-warning-foreground px-4 py-2 text-center text-sm font-medium">
            Förhandsvisning – denna presentation är ännu inte publicerad
          </div>
        )}
        <CandidatePresentationView data={presentationData} />
      </HelmetProvider>
    );
  }

  // Fallback to HTML rendering for backwards compatibility
  if (!presentation?.presentation_html) {
    return (
      <div className="min-h-screen bg-muted/30 flex items-center justify-center p-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-2">Ingen presentation</h1>
          <p className="text-muted-foreground">Presentationen har inget innehåll</p>
        </div>
      </div>
    );
  }

  return (
    <HelmetProvider>
      <Helmet>
        <title>Kandidatpresentation - {candidateName}</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>
      <div 
        className="min-h-screen"
        dangerouslySetInnerHTML={{ __html: presentation.presentation_html }}
      />
    </HelmetProvider>
  );
}
