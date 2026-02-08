import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Slider } from '@/components/ui/slider';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { 
  Save, 
  Eye, 
  Loader2, 
  User, 
  MessageSquare,
  Sparkles,
  Settings
} from 'lucide-react';
import { CandidatePresentationView, type PresentationData, type Strength } from './CandidatePresentationView';

interface CandidatePresentationEditorProps {
  presentationId: string;
  applicationId: string;
  candidateName: string;
  roleName: string;
  jobTitle: string;
  companyName: string;
  assessment: {
    match_score: number;
    role_match_score: number;
    job_match_score: number;
    summary: string;
    technical_assessment: string;
    soft_skills_assessment: string;
    strengths: Strength[];
    concerns: string[];
  };
  initialRecruiterNotes?: string;
  initialSoftValuesNotes?: string;
  initialSkillScores?: Record<string, number>;
  onSave?: () => void;
}

export function CandidatePresentationEditor({
  presentationId,
  applicationId,
  candidateName,
  roleName,
  jobTitle,
  companyName,
  assessment,
  initialRecruiterNotes = '',
  initialSoftValuesNotes = '',
  initialSkillScores = {},
  onSave,
}: CandidatePresentationEditorProps) {
  const { toast } = useToast();
  const [recruiterNotes, setRecruiterNotes] = useState(initialRecruiterNotes);
  const [softValuesNotes, setSoftValuesNotes] = useState(initialSoftValuesNotes);
  const [skillScores, setSkillScores] = useState<Record<string, number>>(initialSkillScores);
  const [isSaving, setIsSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [showSkillEditor, setShowSkillEditor] = useState(false);

  // Build preview data
  const previewData: PresentationData = {
    candidateName,
    roleName,
    jobTitle,
    companyName,
    matchScore: assessment.match_score,
    roleMatchScore: assessment.role_match_score,
    jobMatchScore: assessment.job_match_score,
    summary: assessment.summary,
    technicalAssessment: assessment.technical_assessment,
    softSkillsAssessment: assessment.soft_skills_assessment,
    strengths: assessment.strengths,
    concerns: assessment.concerns,
    skillScores,
    recruiterNotes,
    softValuesNotes,
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('candidate_presentations')
        .update({
          recruiter_notes: recruiterNotes,
          soft_values_notes: softValuesNotes,
          skill_scores: skillScores,
          updated_at: new Date().toISOString(),
        })
        .eq('id', presentationId);

      if (error) throw error;

      toast({
        title: 'Ändringar sparade',
        description: 'Presentationen har uppdaterats',
      });

      onSave?.();
    } catch (error) {
      console.error('Save error:', error);
      toast({
        title: 'Ett fel uppstod',
        description: 'Kunde inte spara ändringar',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const updateSkillScore = (skill: string, value: number) => {
    setSkillScores(prev => ({
      ...prev,
      [skill]: value,
    }));
  };

  const addNewSkill = (skillName: string) => {
    if (skillName.trim() && !skillScores[skillName.trim()]) {
      setSkillScores(prev => ({
        ...prev,
        [skillName.trim()]: 70,
      }));
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-accent" />
          <h3 className="text-lg font-semibold">Redigera presentation</h3>
        </div>
        <div className="flex gap-2">
          <Dialog open={showPreview} onOpenChange={setShowPreview}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Eye className="w-4 h-4 mr-2" />
                Förhandsgranska
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-5xl max-h-[90vh] overflow-auto p-0">
              <DialogHeader className="sr-only">
                <DialogTitle>Förhandsgranskning av presentation</DialogTitle>
              </DialogHeader>
              <CandidatePresentationView data={previewData} isPreview />
            </DialogContent>
          </Dialog>
          
          <Button onClick={handleSave} disabled={isSaving} size="sm">
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Sparar...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Spara
              </>
            )}
          </Button>
        </div>
      </div>

      <Separator />

      {/* Editable Fields */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Recruiter Notes */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <User className="w-4 h-4 text-accent" />
              Personliga observationer
            </CardTitle>
            <CardDescription>
              Lägg till dina egna noteringar om kandidatens personlighet och intryck
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea
              placeholder="Beskriv dina intryck från intervjun, hur kandidaten framstod personligen, eventuella styrkor eller saker du noterade som inte fångas i den automatiska bedömningen..."
              value={recruiterNotes}
              onChange={(e) => setRecruiterNotes(e.target.value)}
              className="min-h-[150px] resize-none"
            />
          </CardContent>
        </Card>

        {/* Soft Values Notes */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <MessageSquare className="w-4 h-4 text-accent" />
              Mjuka värden från intervjun
            </CardTitle>
            <CardDescription>
              Beskriv hur kandidaten uppvisade mjuka färdigheter under intervjun
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea
              placeholder="Hur kommunicerade kandidaten? Vilka värderingar visade de? Hur passade de in kulturellt? Engagemang, attityd, samarbetsvilja..."
              value={softValuesNotes}
              onChange={(e) => setSoftValuesNotes(e.target.value)}
              className="min-h-[150px] resize-none"
            />
          </CardContent>
        </Card>
      </div>

      {/* Skill Scores Editor */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-base">
                <Settings className="w-4 h-4 text-accent" />
                Kompetenspoäng (valfritt)
              </CardTitle>
              <CardDescription>
                Justera poängen för tekniska kompetenser som visas i diagrammet
              </CardDescription>
            </div>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setShowSkillEditor(!showSkillEditor)}
            >
              {showSkillEditor ? 'Dölj' : 'Visa'} kompetenser
            </Button>
          </div>
        </CardHeader>
        {showSkillEditor && (
          <CardContent className="space-y-4">
            {Object.entries(skillScores).length === 0 ? (
              <p className="text-sm text-muted-foreground italic">
                Inga kompetenser har lagts till ännu. AI-genererade kompetenspoäng kommer visas när tillgängliga.
              </p>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                {Object.entries(skillScores).map(([skill, score]) => (
                  <div key={skill} className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <Label>{skill}</Label>
                      <span className="text-muted-foreground">{score}%</span>
                    </div>
                    <Slider
                      value={[score]}
                      onValueChange={([value]) => updateSkillScore(skill, value)}
                      max={100}
                      min={0}
                      step={5}
                      className="w-full"
                    />
                  </div>
                ))}
              </div>
            )}
            
            {/* Add new skill */}
            <div className="pt-4 border-t">
              <Label className="text-sm text-muted-foreground">Lägg till ny kompetens</Label>
              <div className="flex gap-2 mt-2">
                <input
                  type="text"
                  placeholder="Kompetensnamn..."
                  className="flex-1 px-3 py-2 text-sm border rounded-md"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      addNewSkill((e.target as HTMLInputElement).value);
                      (e.target as HTMLInputElement).value = '';
                    }
                  }}
                />
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={(e) => {
                    const input = (e.target as HTMLElement).parentElement?.querySelector('input');
                    if (input) {
                      addNewSkill(input.value);
                      input.value = '';
                    }
                  }}
                >
                  Lägg till
                </Button>
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Help text */}
      <p className="text-sm text-muted-foreground text-center">
        Ändringarna sparas och visas i den publicerade presentationen för kunden.
      </p>
    </div>
  );
}
