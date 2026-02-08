import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Loader2, CheckCircle, AlertTriangle, XCircle, Sparkles } from 'lucide-react';
import type { RoleProfile, ScreeningResult } from './CandidateAssessment';

interface ScreeningAssessmentProps {
  applicationId: string;
  roleProfiles: RoleProfile[];
  existingAssessment: ScreeningResult | null;
  onComplete: (result: ScreeningResult) => void;
}

const recommendationConfig = {
  proceed: { label: 'Gå vidare', color: 'bg-green-500', icon: CheckCircle },
  maybe: { label: 'Tveksam', color: 'bg-yellow-500', icon: AlertTriangle },
  reject: { label: 'Ej lämplig', color: 'bg-red-500', icon: XCircle },
};

export function ScreeningAssessment({
  applicationId,
  roleProfiles,
  existingAssessment,
  onComplete,
}: ScreeningAssessmentProps) {
  const { toast } = useToast();
  const [transcriptText, setTranscriptText] = useState('');
  const [selectedRole, setSelectedRole] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = async () => {
    if (!transcriptText.trim()) {
      toast({
        title: 'Transkribering saknas',
        description: 'Klistra in intervjutranskribering för att generera screening',
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
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-screening-assessment`,
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
        throw new Error(error.error || 'Kunde inte generera screening');
      }

      const result = await response.json();
      
      toast({
        title: 'Screening genererad',
        description: `Matchningspoäng: ${result.assessment.match_score}%`,
      });

      onComplete(result.assessment);
      setTranscriptText('');
    } catch (error) {
      console.error('Screening error:', error);
      toast({
        title: 'Ett fel uppstod',
        description: error instanceof Error ? error.message : 'Kunde inte generera screening',
        variant: 'destructive',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  // Show existing result
  if (existingAssessment) {
    const recConfig = recommendationConfig[existingAssessment.recommendation];
    const RecIcon = recConfig.icon;

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Yrkesroll</p>
            <p className="font-medium">{existingAssessment.role_profile.display_name}</p>
          </div>
          <Badge className={`${recConfig.color} text-white`}>
            <RecIcon className="w-3 h-3 mr-1" />
            {recConfig.label}
          </Badge>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium">Matchningspoäng</p>
            <span className="text-lg font-bold">{existingAssessment.match_score}%</span>
          </div>
          <Progress value={existingAssessment.match_score} className="h-2" />
        </div>

        <div>
          <p className="text-sm font-medium mb-2">Sammanfattning</p>
          <p className="text-sm text-muted-foreground">{existingAssessment.summary}</p>
        </div>

        {existingAssessment.strengths.length > 0 && (
          <div>
            <p className="text-sm font-medium mb-2">Styrkor</p>
            <ul className="space-y-1">
              {existingAssessment.strengths.map((strength, i) => (
                <li key={i} className="text-sm flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                  {strength}
                </li>
              ))}
            </ul>
          </div>
        )}

        {existingAssessment.concerns.length > 0 && (
          <div>
            <p className="text-sm font-medium mb-2">Orosmoln</p>
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

        <Alert>
          <AlertDescription className="text-sm">
            Screening slutförd. Gå till "Slutmatchning" för att importera fullständig intervju efter djupintervju.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // Show import form
  return (
    <div className="space-y-4">
      <Alert>
        <Sparkles className="h-4 w-4" />
        <AlertDescription>
          Klistra in transkriberingen från den initiala Kiku/Sara-intervjun. AI:n analyserar och ger en rekommendation om kandidaten ska gå vidare till djupintervju.
        </AlertDescription>
      </Alert>

      <div className="space-y-2">
        <Label htmlFor="role">Yrkesroll</Label>
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
        <Label htmlFor="transcript">Intervjutranskribering</Label>
        <Textarea
          id="transcript"
          placeholder="Klistra in transkriberingen här..."
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
            Generera screening
          </>
        )}
      </Button>
    </div>
  );
}
