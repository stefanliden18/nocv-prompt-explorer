import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { ScreeningAssessment } from './ScreeningAssessment';
import { FinalAssessment } from './FinalAssessment';
import { Brain } from 'lucide-react';

interface CandidateAssessmentProps {
  applicationId: string;
  jobId: string;
  candidateName: string;
  jobTitle?: string;
  companyName?: string;
  onAssessmentComplete?: () => void;
}

export interface RoleProfile {
  id: string;
  role_key: string;
  display_name: string;
  description: string;
}

export interface ScreeningResult {
  id: string;
  match_score: number;
  recommendation: 'proceed' | 'maybe' | 'reject';
  strengths: string[];
  concerns: string[];
  summary: string;
  role_profile: {
    role_key: string;
    display_name: string;
  };
}

export interface FinalResult {
  id: string;
  match_score: number;
  role_match_score: number;
  job_match_score: number;
  strengths: Array<{ point: string; evidence: string }>;
  concerns: string[];
  technical_assessment: string;
  soft_skills_assessment: string;
  summary: string;
  role_profile: {
    role_key: string;
    display_name: string;
  };
}

export interface PresentationInfo {
  id: string;
  share_token: string;
  status: 'draft' | 'published' | 'archived';
}

export function CandidateAssessment({ 
  applicationId, 
  jobId,
  candidateName,
  jobTitle,
  companyName,
  onAssessmentComplete 
}: CandidateAssessmentProps) {
  const [roleProfiles, setRoleProfiles] = useState<RoleProfile[]>([]);
  const [screeningAssessment, setScreeningAssessment] = useState<ScreeningResult | null>(null);
  const [finalAssessment, setFinalAssessment] = useState<FinalResult | null>(null);
  const [presentation, setPresentation] = useState<PresentationInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('screening');

  useEffect(() => {
    fetchData();
  }, [applicationId]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch role profiles
      const { data: profiles } = await supabase
        .from('role_profiles')
        .select('id, role_key, display_name, description')
        .order('display_name');
      
      if (profiles) {
        setRoleProfiles(profiles);
      }

      // Fetch existing assessments
      const { data: assessments } = await supabase
        .from('candidate_assessments')
        .select(`
          id,
          assessment_type,
          match_score,
          role_match_score,
          job_match_score,
          recommendation,
          strengths,
          concerns,
          technical_assessment,
          soft_skills_assessment,
          summary,
          role_profiles (
            role_key,
            display_name
          )
        `)
        .eq('application_id', applicationId);

      if (assessments) {
        const screening = assessments.find(a => a.assessment_type === 'screening');
        const final = assessments.find(a => a.assessment_type === 'final');

        if (screening) {
          setScreeningAssessment({
            id: screening.id,
            match_score: screening.match_score || 0,
            recommendation: screening.recommendation as 'proceed' | 'maybe' | 'reject',
            strengths: (screening.strengths as string[]) || [],
            concerns: (screening.concerns as string[]) || [],
            summary: screening.summary || '',
            role_profile: {
              role_key: screening.role_profiles?.role_key || '',
              display_name: screening.role_profiles?.display_name || ''
            }
          });
        }

        if (final) {
          setFinalAssessment({
            id: final.id,
            match_score: final.match_score || 0,
            role_match_score: final.role_match_score || 0,
            job_match_score: final.job_match_score || 0,
            strengths: (final.strengths as Array<{ point: string; evidence: string }>) || [],
            concerns: (final.concerns as string[]) || [],
            technical_assessment: final.technical_assessment || '',
            soft_skills_assessment: final.soft_skills_assessment || '',
            summary: final.summary || '',
            role_profile: {
              role_key: final.role_profiles?.role_key || '',
              display_name: final.role_profiles?.display_name || ''
            }
          });
          setActiveTab('final');
        }
      }

      // Fetch presentation if exists
      const { data: pres } = await supabase
        .from('candidate_presentations')
        .select('id, share_token, status')
        .eq('application_id', applicationId)
        .maybeSingle();

      if (pres) {
        setPresentation({
          id: pres.id,
          share_token: pres.share_token || '',
          status: pres.status as 'draft' | 'published' | 'archived'
        });
      }

    } catch (error) {
      console.error('Error fetching assessment data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleScreeningComplete = (result: ScreeningResult) => {
    setScreeningAssessment(result);
    onAssessmentComplete?.();
  };

  const handleFinalComplete = (result: FinalResult, pres: PresentationInfo) => {
    setFinalAssessment(result);
    setPresentation(pres);
    onAssessmentComplete?.();
  };

  const handlePresentationPublished = (pres: PresentationInfo) => {
    setPresentation(pres);
  };

  const handleAssessmentUpdate = (updates: Partial<FinalResult>) => {
    setFinalAssessment(prev => prev ? { ...prev, ...updates } : prev);
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            Kandidatbedömning
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-10 bg-muted rounded" />
            <div className="h-32 bg-muted rounded" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="h-5 w-5 text-primary" />
          AI-bedömning
        </CardTitle>
        <CardDescription>
          Importera intervjutranskribering och få AI-genererad matchning
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="screening" className="relative">
              Screening
              {screeningAssessment && (
                <span className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full" />
              )}
            </TabsTrigger>
            <TabsTrigger value="final" className="relative">
              Slutmatchning
              {finalAssessment && (
                <span className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full" />
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="screening" className="mt-4">
            <ScreeningAssessment
              applicationId={applicationId}
              roleProfiles={roleProfiles}
              existingAssessment={screeningAssessment}
              onComplete={handleScreeningComplete}
            />
          </TabsContent>

          <TabsContent value="final" className="mt-4">
            <FinalAssessment
              applicationId={applicationId}
              candidateName={candidateName}
              jobTitle={jobTitle}
              companyName={companyName}
              roleProfiles={roleProfiles}
              existingAssessment={finalAssessment}
              presentation={presentation}
              screeningCompleted={!!screeningAssessment}
              onComplete={handleFinalComplete}
              onPublish={handlePresentationPublished}
              onAssessmentUpdate={handleAssessmentUpdate}
            />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
