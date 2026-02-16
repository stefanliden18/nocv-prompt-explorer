import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { 
  Loader2, 
  CheckCircle, 
  AlertTriangle, 
  Sparkles, 
  ExternalLink, 
  Copy,
  Share2,
  ChevronDown,
  Pencil
} from 'lucide-react';
import type { RoleProfile, FinalResult, PresentationInfo } from './CandidateAssessment';
import { CandidatePresentationEditor } from './CandidatePresentationEditor';

interface ExtendedPresentationInfo extends PresentationInfo {
  recruiter_notes?: string;
  soft_values_notes?: string;
  skill_scores?: Record<string, number>;
}

interface FinalAssessmentProps {
  applicationId: string;
  candidateName: string;
  jobTitle?: string;
  companyName?: string;
  roleProfiles: RoleProfile[];
  existingAssessment: FinalResult | null;
  presentation: PresentationInfo | null;
  screeningCompleted: boolean;
  onComplete: (result: FinalResult, presentation: PresentationInfo) => void;
  onPublish: (presentation: PresentationInfo) => void;
  onAssessmentUpdate?: (updates: Partial<FinalResult>) => void;
}

export function FinalAssessment({
  applicationId,
  candidateName,
  jobTitle = '',
  companyName = '',
  roleProfiles,
  existingAssessment,
  presentation,
  screeningCompleted,
  onComplete,
  onPublish,
  onAssessmentUpdate,
}: FinalAssessmentProps) {
  const { toast } = useToast();
  const [transcriptText, setTranscriptText] = useState('');
  const [selectedRole, setSelectedRole] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [showEditor, setShowEditor] = useState(false);
  const [extendedPresentation, setExtendedPresentation] = useState<ExtendedPresentationInfo | null>(null);

  // Fetch extended presentation data when presentation changes
  useEffect(() => {
    if (presentation) {
      fetchExtendedPresentationData();
    }
  }, [presentation?.id]);

  const fetchExtendedPresentationData = async () => {
    if (!presentation) return;
    
    const { data } = await supabase
      .from('candidate_presentations')
      .select('id, share_token, status, recruiter_notes, soft_values_notes, skill_scores')
      .eq('id', presentation.id)
      .single();
    
    if (data) {
      setExtendedPresentation({
        id: data.id,
        share_token: data.share_token || '',
        status: data.status as 'draft' | 'published' | 'archived',
        recruiter_notes: data.recruiter_notes || '',
        soft_values_notes: data.soft_values_notes || '',
        skill_scores: (data.skill_scores as Record<string, number>) || {},
      });
    }
  };

  const handleGenerate = async () => {
    if (!transcriptText.trim()) {
      toast({
        title: 'Transkribering saknas',
        description: 'Klistra in fullständig intervjutranskribering',
        variant: 'destructive',
      });
      return;
    }

    if (!selectedRole) {
      toast({
        title: 'Välj yrkesroll',
        description: 'Du måste välja vilken yrkesroll kandidaten söker',
        variant: 'destructive',
      });
      return;
    }

    setIsGenerating(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-final-assessment`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${sessionData.session?.access_token}`,
          },
          body: JSON.stringify({
            application_id: applicationId,
            transcript_text: transcriptText,
            role_key: selectedRole,
          }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Kunde inte generera slutmatchning');
      }

      const result = await response.json();
      
      toast({
        title: 'Slutmatchning genererad',
        description: `Matchningspoäng: ${result.assessment.match_score}%`,
      });

      onComplete(result.assessment, result.presentation);
      setTranscriptText('');
    } catch (error) {
      console.error('Final assessment error:', error);
      toast({
        title: 'Ett fel uppstod',
        description: error instanceof Error ? error.message : 'Kunde inte generera slutmatchning',
        variant: 'destructive',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePublish = async () => {
    if (!presentation) return;

    setIsPublishing(true);
    try {
      const { error } = await supabase
        .from('candidate_presentations')
        .update({ 
          status: 'published',
          published_at: new Date().toISOString()
        })
        .eq('id', presentation.id);

      if (error) throw error;

      toast({
        title: 'Presentation publicerad',
        description: 'Delningslänken är nu aktiv för kund',
      });

      onPublish({ ...presentation, status: 'published' });
    } catch (error) {
      console.error('Publish error:', error);
      toast({
        title: 'Ett fel uppstod',
        description: 'Kunde inte publicera presentation',
        variant: 'destructive',
      });
    } finally {
      setIsPublishing(false);
    }
  };

  const copyShareLink = () => {
    if (!presentation?.share_token) return;
    const link = `${window.location.origin}/presentation/${presentation.share_token}`;
    navigator.clipboard.writeText(link);
    toast({
      title: 'Länk kopierad',
      description: 'Delningslänken har kopierats till urklipp',
    });
  };

  // Show existing result
  if (existingAssessment) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Yrkesroll</p>
            <p className="font-medium">{existingAssessment.role_profile.display_name}</p>
          </div>
          {presentation && (
            <Badge variant={presentation.status === 'published' ? 'default' : 'secondary'}>
              {presentation.status === 'published' ? 'Publicerad' : 'Utkast'}
            </Badge>
          )}
        </div>

        {/* Match scores */}
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <div className="flex items-center justify-between mb-1">
              <p className="text-xs text-muted-foreground">Total</p>
              <span className="text-sm font-bold">{existingAssessment.match_score}%</span>
            </div>
            <Progress value={existingAssessment.match_score} className="h-2" />
          </div>
          <div>
            <div className="flex items-center justify-between mb-1">
              <p className="text-xs text-muted-foreground">Rollmatchning</p>
              <span className="text-sm font-bold">{existingAssessment.role_match_score}%</span>
            </div>
            <Progress value={existingAssessment.role_match_score} className="h-2" />
          </div>
          <div>
            <div className="flex items-center justify-between mb-1">
              <p className="text-xs text-muted-foreground">Jobbmatchning</p>
              <span className="text-sm font-bold">{existingAssessment.job_match_score}%</span>
            </div>
            <Progress value={existingAssessment.job_match_score} className="h-2" />
          </div>
        </div>

        <Separator />

        <div>
          <p className="text-sm font-medium mb-2">Sammanfattning</p>
          <p className="text-sm text-muted-foreground">{existingAssessment.summary}</p>
        </div>

        {existingAssessment.strengths.length > 0 && (
          <div>
            <p className="text-sm font-medium mb-2">Styrkor</p>
            <div className="space-y-2">
              {existingAssessment.strengths.map((s, i) => (
                <div key={i} className="bg-green-50 dark:bg-green-950/30 border-l-2 border-green-500 p-3 rounded-r">
                  <p className="text-sm font-medium text-green-800 dark:text-green-200">{s.point}</p>
                  <p className="text-xs text-green-600 dark:text-green-400 italic mt-1">"{s.evidence}"</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {existingAssessment.concerns.length > 0 && (
          <div>
            <p className="text-sm font-medium mb-2">Utvecklingsområden</p>
            <ul className="space-y-1">
              {existingAssessment.concerns.map((concern, i) => (
                <li key={i} className="text-sm flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                  {concern}
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="bg-muted/50 p-3 rounded-lg">
            <p className="text-sm font-medium mb-1">Teknisk bedömning</p>
            <p className="text-sm text-muted-foreground">{existingAssessment.technical_assessment}</p>
          </div>
          <div className="bg-muted/50 p-3 rounded-lg">
            <p className="text-sm font-medium mb-1">Mjuka färdigheter</p>
            <p className="text-sm text-muted-foreground">{existingAssessment.soft_skills_assessment}</p>
          </div>
        </div>

        <Separator />

        {/* Presentation Editor Section */}
        {presentation && (
          <Collapsible open={showEditor} onOpenChange={setShowEditor}>
            <CollapsibleTrigger asChild>
              <Button variant="outline" className="w-full justify-between">
                <span className="flex items-center gap-2">
                  <Pencil className="w-4 h-4" />
                  Redigera presentation
                </span>
                <ChevronDown className={`w-4 h-4 transition-transform ${showEditor ? 'rotate-180' : ''}`} />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-4">
              <CandidatePresentationEditor
                presentationId={presentation.id}
                applicationId={applicationId}
                assessmentId={existingAssessment.id}
                candidateName={candidateName}
                roleName={existingAssessment.role_profile.display_name}
                jobTitle={jobTitle}
                companyName={companyName}
                shareToken={presentation.share_token}
                assessment={{
                  match_score: existingAssessment.match_score,
                  role_match_score: existingAssessment.role_match_score,
                  job_match_score: existingAssessment.job_match_score,
                  summary: existingAssessment.summary,
                  technical_assessment: existingAssessment.technical_assessment,
                  soft_skills_assessment: existingAssessment.soft_skills_assessment,
                  strengths: existingAssessment.strengths,
                  concerns: existingAssessment.concerns,
                }}
                initialRecruiterNotes={extendedPresentation?.recruiter_notes}
                initialSoftValuesNotes={extendedPresentation?.soft_values_notes}
                initialSkillScores={extendedPresentation?.skill_scores}
                onSave={fetchExtendedPresentationData}
                onAssessmentUpdate={(updates) => {
                  onAssessmentUpdate?.({
                    summary: updates.summary ?? existingAssessment.summary,
                    technical_assessment: updates.technical_assessment ?? existingAssessment.technical_assessment,
                    soft_skills_assessment: updates.soft_skills_assessment ?? existingAssessment.soft_skills_assessment,
                    strengths: updates.strengths ?? existingAssessment.strengths,
                    concerns: updates.concerns ?? existingAssessment.concerns,
                  });
                }}
              />
            </CollapsibleContent>
          </Collapsible>
        )}

        <Separator />

        {/* Presentation actions */}
        {presentation && (
          <div className="space-y-3">
            <p className="text-sm font-medium">Kundpresentation</p>
            
            {presentation.status === 'draft' && (
              <Button onClick={handlePublish} disabled={isPublishing} className="w-full">
                {isPublishing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Publicerar...
                  </>
                ) : (
                  <>
                    <Share2 className="w-4 h-4 mr-2" />
                    Publicera för kund
                  </>
                )}
              </Button>
            )}

            {presentation.status === 'published' && (
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={copyShareLink}>
                  <Copy className="w-4 h-4 mr-2" />
                  Kopiera länk
                </Button>
                <Button variant="outline" asChild>
                  <a 
                    href={`/presentation/${presentation.share_token}`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  // Show import form
  if (!screeningCompleted) {
    return (
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Genomför screening-steget först innan du importerar den fullständiga intervjun.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-4">
      <Alert>
        <Sparkles className="h-4 w-4" />
        <AlertDescription>
          Klistra in transkriberingen från den fullständiga djupintervjun. AI:n gör en detaljerad analys och skapar en professionell kandidatpresentation för kund.
        </AlertDescription>
      </Alert>

      <div className="space-y-2">
        <Label htmlFor="role-final">Yrkesroll</Label>
        <Select value={selectedRole} onValueChange={setSelectedRole}>
          <SelectTrigger>
            <SelectValue placeholder="Välj yrkesroll..." />
          </SelectTrigger>
          <SelectContent>
            {roleProfiles.map((role) => (
              <SelectItem key={role.id} value={role.role_key}>
                {role.display_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="transcript-final">Fullständig intervjutranskribering</Label>
        <Textarea
          id="transcript-final"
          placeholder="Klistra in den fullständiga transkriberingen här..."
          value={transcriptText}
          onChange={(e) => setTranscriptText(e.target.value)}
          className="min-h-[200px]"
          disabled={isGenerating}
        />
        <p className="text-xs text-muted-foreground">
          {transcriptText.length} tecken
        </p>
      </div>

      <Button 
        onClick={handleGenerate} 
        disabled={isGenerating || !transcriptText.trim() || !selectedRole}
        className="w-full"
      >
        {isGenerating ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Analyserar med AI...
          </>
        ) : (
          <>
            <Sparkles className="w-4 h-4 mr-2" />
            Generera slutmatchning & presentation
          </>
        )}
      </Button>
    </div>
  );
}
