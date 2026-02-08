import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { 
  ChevronDown, 
  Plus, 
  Trash2, 
  Sparkles,
  FileText,
  Target,
  Heart,
  CheckCircle,
  AlertTriangle
} from 'lucide-react';
import type { Strength } from '@/components/CandidatePresentationView';

interface AITextEditorProps {
  summary: string;
  technicalAssessment: string;
  softSkillsAssessment: string;
  strengths: Strength[];
  concerns: string[];
  onSummaryChange: (value: string) => void;
  onTechnicalChange: (value: string) => void;
  onSoftSkillsChange: (value: string) => void;
  onStrengthsChange: (value: Strength[]) => void;
  onConcernsChange: (value: string[]) => void;
}

export function AITextEditor({
  summary,
  technicalAssessment,
  softSkillsAssessment,
  strengths,
  concerns,
  onSummaryChange,
  onTechnicalChange,
  onSoftSkillsChange,
  onStrengthsChange,
  onConcernsChange,
}: AITextEditorProps) {
  const [isOpen, setIsOpen] = useState(false);

  const updateStrength = (index: number, field: 'point' | 'evidence', value: string) => {
    const updated = [...strengths];
    updated[index] = { ...updated[index], [field]: value };
    onStrengthsChange(updated);
  };

  const addStrength = () => {
    onStrengthsChange([...strengths, { point: '', evidence: '' }]);
  };

  const removeStrength = (index: number) => {
    onStrengthsChange(strengths.filter((_, i) => i !== index));
  };

  const updateConcern = (index: number, value: string) => {
    const updated = [...concerns];
    updated[index] = value;
    onConcernsChange(updated);
  };

  const addConcern = () => {
    onConcernsChange([...concerns, '']);
  };

  const removeConcern = (index: number) => {
    onConcernsChange(concerns.filter((_, i) => i !== index));
  };

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger asChild>
        <Button variant="outline" className="w-full justify-between mb-4">
          <span className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-accent" />
            AI-genererade texter (redigerbar)
          </span>
          <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </Button>
      </CollapsibleTrigger>
      
      <CollapsibleContent className="space-y-4">
        {/* Summary & Technical Assessment - 2 column */}
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <FileText className="w-4 h-4 text-accent" />
                Sammanfattning
              </CardTitle>
              <CardDescription>
                Övergripande sammanfattning av kandidaten
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder="Sammanfattande beskrivning av kandidaten..."
                value={summary}
                onChange={(e) => onSummaryChange(e.target.value)}
                className="min-h-[120px] resize-none"
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Target className="w-4 h-4 text-accent" />
                Teknisk bedömning
              </CardTitle>
              <CardDescription>
                Bedömning av tekniska kunskaper och erfarenheter
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder="Teknisk bedömning av kandidaten..."
                value={technicalAssessment}
                onChange={(e) => onTechnicalChange(e.target.value)}
                className="min-h-[120px] resize-none"
              />
            </CardContent>
          </Card>
        </div>

        {/* Soft Skills Assessment */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Heart className="w-4 h-4 text-accent" />
              Mjuka färdigheter (AI-bedömning)
            </CardTitle>
            <CardDescription>
              AI:ns bedömning av kandidatens mjuka färdigheter
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea
              placeholder="Bedömning av mjuka färdigheter..."
              value={softSkillsAssessment}
              onChange={(e) => onSoftSkillsChange(e.target.value)}
              className="min-h-[100px] resize-none"
            />
          </CardContent>
        </Card>

        {/* Strengths Editor */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <CheckCircle className="w-4 h-4 text-emerald-500" />
              Styrkor
            </CardTitle>
            <CardDescription>
              Kandidatens styrkor med citat från intervjun
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {strengths.length === 0 ? (
              <p className="text-sm text-muted-foreground italic">
                Inga styrkor har lagts till ännu.
              </p>
            ) : (
              strengths.map((strength, index) => (
                <div 
                  key={index} 
                  className="p-3 border rounded-lg space-y-3 bg-secondary/50 dark:bg-secondary/20 border-border"
                >
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium">Styrka {index + 1}</Label>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeStrength(index)}
                      className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="space-y-2">
                    <Input
                      placeholder="Styrka (t.ex. 'Stark problemlösare')"
                      value={strength.point}
                      onChange={(e) => updateStrength(index, 'point', e.target.value)}
                    />
                    <Input
                      placeholder="Citat från intervjun som stödjer detta..."
                      value={strength.evidence}
                      onChange={(e) => updateStrength(index, 'evidence', e.target.value)}
                    />
                  </div>
                </div>
              ))
            )}
            <Button variant="outline" size="sm" onClick={addStrength} className="w-full">
              <Plus className="w-4 h-4 mr-2" />
              Lägg till styrka
            </Button>
          </CardContent>
        </Card>

        {/* Concerns Editor */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              Utvecklingsområden
            </CardTitle>
            <CardDescription>
              Områden där kandidaten kan utvecklas
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {concerns.length === 0 ? (
              <p className="text-sm text-muted-foreground italic">
                Inga utvecklingsområden har lagts till ännu.
              </p>
            ) : (
              concerns.map((concern, index) => (
                <div 
                  key={index} 
                  className="flex items-center gap-2"
                >
                  <Input
                    placeholder="Utvecklingsområde..."
                    value={concern}
                    onChange={(e) => updateConcern(index, e.target.value)}
                    className="flex-1"
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeConcern(index)}
                    className="h-10 w-10 p-0 text-destructive hover:text-destructive hover:bg-destructive/10 flex-shrink-0"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))
            )}
            <Button variant="outline" size="sm" onClick={addConcern} className="w-full">
              <Plus className="w-4 h-4 mr-2" />
              Lägg till utvecklingsområde
            </Button>
          </CardContent>
        </Card>
      </CollapsibleContent>
    </Collapsible>
  );
}
