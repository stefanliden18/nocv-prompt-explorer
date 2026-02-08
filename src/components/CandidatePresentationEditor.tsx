import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Slider } from '@/components/ui/slider';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { 
  Save, 
  Eye, 
  Loader2, 
  User, 
  MessageSquare,
  Sparkles,
  Settings,
  ChevronDown,
  ExternalLink
} from 'lucide-react';
import { type Strength } from './CandidatePresentationView';
import { AITextEditor } from './presentation/AITextEditor';

interface CandidatePresentationEditorProps {
  presentationId: string;
  applicationId: string;
  assessmentId: string;
  candidateName: string;
  roleName: string;
  jobTitle: string;
  companyName: string;
  shareToken?: string;
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
  onAssessmentUpdate?: (updates: Partial<{
    summary: string;
    technical_assessment: string;
    soft_skills_assessment: string;
    strengths: Strength[];
    concerns: string[];
  }>) => void;
}

export function CandidatePresentationEditor({
  presentationId,
  applicationId,
  assessmentId,
  candidateName,
  roleName,
  jobTitle,
  companyName,
  shareToken,
  assessment,
  initialRecruiterNotes = '',
  initialSoftValuesNotes = '',
  initialSkillScores = {},
  onSave,
  onAssessmentUpdate,
}: CandidatePresentationEditorProps) {
  const { toast } = useToast();
  
  // Recruiter fields
  const [recruiterNotes, setRecruiterNotes] = useState(initialRecruiterNotes);
  const [softValuesNotes, setSoftValuesNotes] = useState(initialSoftValuesNotes);
  const [skillScores, setSkillScores] = useState<Record<string, number>>(initialSkillScores);
  
  // AI-generated fields (editable)
  const [summary, setSummary] = useState(assessment.summary);
  const [technicalAssessment, setTechnicalAssessment] = useState(assessment.technical_assessment);
  const [softSkillsAssessment, setSoftSkillsAssessment] = useState(assessment.soft_skills_assessment);
  const [strengths, setStrengths] = useState<Strength[]>(assessment.strengths);
  const [concerns, setConcerns] = useState<string[]>(assessment.concerns);
  
  const [isSaving, setIsSaving] = useState(false);
  const [showSkillEditor, setShowSkillEditor] = useState(false);

  const handlePreview = () => {
    // Open preview in new tab with current edited data
    if (shareToken) {
      window.open(`/presentation/${shareToken}`, '_blank');
    } else {
      toast({
        title: 'Ingen delningslänk',
        description: 'Presentationen måste ha en share_token för att kunna förhandsgranskas.',
        variant: 'destructive',
      });
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      console.log('📝 Saving assessment:', { assessmentId, presentationId, summary: summary.substring(0, 50) });
      
      // Update candidate_presentations table
      const { error: presentationError } = await supabase
        .from('candidate_presentations')
        .update({
          recruiter_notes: recruiterNotes,
          soft_values_notes: softValuesNotes,
          skill_scores: skillScores,
          updated_at: new Date().toISOString(),
        })
        .eq('id', presentationId);

      if (presentationError) {
        console.error('Presentation update error:', presentationError);
        throw presentationError;
      }

      // Update candidate_assessments table with AI text changes
      const { data, error: assessmentError } = await supabase
        .from('candidate_assessments')
        .update({
          summary,
          technical_assessment: technicalAssessment,
          soft_skills_assessment: softSkillsAssessment,
          strengths: JSON.parse(JSON.stringify(strengths)),
          concerns: JSON.parse(JSON.stringify(concerns)),
          updated_at: new Date().toISOString(),
        })
        .eq('id', assessmentId);

      if (assessmentError) {
        console.error('Assessment update error:', assessmentError);
        throw assessmentError;
      }

      console.log('✅ Save successful');

      toast({
        title: 'Ändringar sparade',
        description: 'Presentationen och bedömningen har uppdaterats',
      });

      // Notify parent about assessment updates
      onAssessmentUpdate?.({
        summary,
        technical_assessment: technicalAssessment,
        soft_skills_assessment: softSkillsAssessment,
        strengths,
        concerns,
      });

      onSave?.();
    } catch (error) {
      console.error('❌ Save error:', error);
      toast({
        title: 'Ett fel uppstod',
        description: error instanceof Error ? error.message : 'Kunde inte spara ändringar',
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
          <Button variant="outline" size="sm" onClick={handlePreview}>
            <ExternalLink className="w-4 h-4 mr-2" />
            Öppna förhandsvisning
          </Button>
          
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

      {/* AI Text Editor Section */}
      <AITextEditor
        summary={summary}
        technicalAssessment={technicalAssessment}
        softSkillsAssessment={softSkillsAssessment}
        strengths={strengths}
        concerns={concerns}
        onSummaryChange={setSummary}
        onTechnicalChange={setTechnicalAssessment}
        onSoftSkillsChange={setSoftSkillsAssessment}
        onStrengthsChange={setStrengths}
        onConcernsChange={setConcerns}
      />

      <Separator />

      {/* Recruiter's Editable Fields */}
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
      <Collapsible open={showSkillEditor} onOpenChange={setShowSkillEditor}>
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
              <CollapsibleTrigger asChild>
                <Button variant="outline" size="sm">
                  <ChevronDown className={`w-4 h-4 mr-2 transition-transform ${showSkillEditor ? 'rotate-180' : ''}`} />
                  {showSkillEditor ? 'Dölj' : 'Visa'}
                </Button>
              </CollapsibleTrigger>
            </div>
          </CardHeader>
          <CollapsibleContent>
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
                    className="flex-1 px-3 py-2 text-sm border rounded-md bg-background"
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
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* Help text */}
      <p className="text-sm text-muted-foreground text-center">
        Ändringarna sparas och visas i den publicerade presentationen för kunden.
      </p>
    </div>
  );
}
