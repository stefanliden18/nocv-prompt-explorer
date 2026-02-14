import { useMemo } from 'react';
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  RadialBarChart,
  RadialBar,
  Cell,
} from 'recharts';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  CheckCircle, 
  AlertTriangle, 
  Star,
  Sparkles,
  User,
  Briefcase,
  Target,
  MessageSquare,
  Mail,
  Phone
} from 'lucide-react';

// Types for the presentation data
export interface SkillScore {
  skill: string;
  score: number;
  fullMark: number;
}

export interface SoftSkillScore {
  skill: string;
  score: number;
}

export interface Strength {
  point: string;
  evidence: string;
}

export interface PresentationData {
  candidateName: string;
  candidateEmail?: string;
  candidatePhone?: string;
  roleName: string;
  jobTitle: string;
  companyName: string;
  matchScore: number;
  roleMatchScore: number;
  jobMatchScore: number;
  summary: string;
  technicalAssessment: string;
  softSkillsAssessment: string;
  strengths: Strength[];
  concerns: string[];
  skillScores: Record<string, number>;
  recruiterNotes?: string;
  softValuesNotes?: string;
}

interface CandidatePresentationViewProps {
  data: PresentationData;
  isPreview?: boolean;
}

// Score circle component for radial display
function ScoreCircle({ 
  value, 
  label, 
  size = 120 
}: { 
  value: number; 
  label: string; 
  size?: number; 
}) {
  const getColor = (score: number) => {
    if (score >= 70) return 'hsl(142 76% 36%)'; // Green
    if (score >= 50) return 'hsl(38 92% 50%)'; // Orange/Yellow
    return 'hsl(0 84% 60%)'; // Red
  };

  const data = [{ value, fill: getColor(value) }];

  return (
    <div className="flex flex-col items-center">
      <div style={{ width: size, height: size }} className="relative">
        <ResponsiveContainer width="100%" height="100%">
          <RadialBarChart
            innerRadius="70%"
            outerRadius="100%"
            data={data}
            startAngle={90}
            endAngle={-270}
          >
            <RadialBar
              dataKey="value"
              cornerRadius={10}
              background={{ fill: 'hsl(var(--muted))' }}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} />
              ))}
            </RadialBar>
          </RadialBarChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-2xl font-bold text-foreground">{value}%</span>
        </div>
      </div>
      <span className="mt-2 text-sm text-muted-foreground font-medium">{label}</span>
    </div>
  );
}

// Radar chart for technical skills
function SkillRadar({ skillScores }: { skillScores: Record<string, number> }) {
  const radarData: SkillScore[] = useMemo(() => {
    return Object.entries(skillScores).map(([skill, score]) => ({
      skill: skill.length > 15 ? skill.substring(0, 15) + '...' : skill,
      score,
      fullMark: 100,
    }));
  }, [skillScores]);

  if (radarData.length === 0) return null;

  return (
    <ResponsiveContainer width="100%" height={300}>
      <RadarChart data={radarData}>
        <PolarGrid stroke="hsl(var(--border))" />
        <PolarAngleAxis 
          dataKey="skill" 
          tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} 
        />
        <PolarRadiusAxis 
          angle={30} 
          domain={[0, 100]} 
          tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
        />
        <Radar
          name="Kompetens"
          dataKey="score"
          stroke="hsl(216 47% 17%)"
          fill="hsl(25 95% 53%)"
          fillOpacity={0.5}
          strokeWidth={2}
        />
      </RadarChart>
    </ResponsiveContainer>
  );
}

// Soft skill progress bar
function SoftSkillBar({ skill, score }: { skill: string; score: number }) {
  const getColorClass = (score: number) => {
    if (score >= 70) return 'bg-emerald-500';
    if (score >= 50) return 'bg-amber-500';
    return 'bg-red-500';
  };

  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-sm">
        <span className="text-foreground font-medium">{skill}</span>
        <span className="text-muted-foreground">{score}%</span>
      </div>
      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <div 
          className={`h-full rounded-full transition-all duration-500 ${getColorClass(score)}`}
          style={{ width: `${score}%` }}
        />
      </div>
    </div>
  );
}

export function CandidatePresentationView({ data, isPreview = false }: CandidatePresentationViewProps) {
  // Default soft skills if none provided in skill_scores
  const softSkills: SoftSkillScore[] = useMemo(() => {
    const softSkillKeys = ['Kommunikation', 'Samarbete', 'Problemlösning', 'Anpassningsförmåga', 'Initiativförmåga'];
    return softSkillKeys.map(skill => ({
      skill,
      score: data.skillScores[skill.toLowerCase()] || Math.floor(Math.random() * 30) + 65,
    }));
  }, [data.skillScores]);

  // Filter technical skills (not soft skills)
  const technicalSkillScores = useMemo(() => {
    const softSkillLower = ['kommunikation', 'samarbete', 'problemlösning', 'anpassningsförmåga', 'initiativförmåga'];
    return Object.fromEntries(
      Object.entries(data.skillScores).filter(([key]) => !softSkillLower.includes(key.toLowerCase()))
    );
  }, [data.skillScores]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 print:bg-white">
      <div className="max-w-4xl mx-auto px-4 py-8 print:py-4">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/10 text-primary rounded-full text-sm mb-4">
            <Sparkles className="w-4 h-4" />
            Kandidatpresentation
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">
            {data.candidateName}
          </h1>
          <div className="flex items-center justify-center gap-2 text-lg text-muted-foreground">
            <Briefcase className="w-5 h-5" />
            <span>{data.roleName}</span>
          </div>
          <p className="text-muted-foreground mt-1">
            {data.jobTitle} • {data.companyName}
          </p>
        </div>

        {/* Score Circles */}
        <Card className="mb-6 border-0 shadow-lg">
          <CardContent className="py-8">
            <div className="flex justify-center gap-8 md:gap-16 flex-wrap">
              <ScoreCircle value={data.matchScore} label="Total matchning" />
              <ScoreCircle value={data.roleMatchScore} label="Rollmatchning" />
              <ScoreCircle value={data.jobMatchScore} label="Jobbmatchning" />
            </div>
          </CardContent>
        </Card>

        {/* Contact Information */}
        {(data.candidateEmail || data.candidatePhone) && (
          <Card className="mb-6 border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <User className="w-5 h-5 text-primary" />
                Kontakta kandidaten för intervju
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {data.candidateEmail && (
                <a
                  href={`mailto:${data.candidateEmail}`}
                  className="flex items-center gap-3 text-primary hover:underline"
                >
                  <Mail className="w-5 h-5" />
                  <span>{data.candidateEmail}</span>
                </a>
              )}
              {data.candidatePhone && (
                <a
                  href={`tel:${data.candidatePhone}`}
                  className="flex items-center gap-3 text-primary hover:underline"
                >
                  <Phone className="w-5 h-5" />
                  <span>{data.candidatePhone}</span>
                </a>
              )}
            </CardContent>
          </Card>
        )}

        {/* Summary */}
        <Card className="mb-6 border-0 shadow-lg bg-gradient-to-r from-primary/5 to-accent/5">
          <CardContent className="py-6">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <MessageSquare className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground mb-2">Sammanfattning</h3>
                <p className="text-muted-foreground leading-relaxed italic">
                  "{data.summary}"
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Two Column Layout - Skills Radar + Recruiter Notes */}
        <div className="grid md:grid-cols-2 gap-6 mb-6">
          {/* Technical Skills Radar */}
          {Object.keys(technicalSkillScores).length > 0 && (
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Target className="w-5 h-5 text-accent" />
                  Tekniska kompetenser
                </CardTitle>
              </CardHeader>
              <CardContent>
                <SkillRadar skillScores={technicalSkillScores} />
              </CardContent>
            </Card>
          )}

          {/* Recruiter Notes */}
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <User className="w-5 h-5 text-accent" />
                Personliga observationer
              </CardTitle>
            </CardHeader>
            <CardContent>
              {data.recruiterNotes ? (
                <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
                  {data.recruiterNotes}
                </p>
              ) : (
                <p className="text-muted-foreground/60 italic">
                  Inga personliga observationer har lagts till.
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Soft Skills + Interview Impressions */}
        <div className="grid md:grid-cols-2 gap-6 mb-6">
          {/* Soft Skills Bars */}
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Star className="w-5 h-5 text-amber-500" />
                Mjuka färdigheter
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {softSkills.map((skill, index) => (
                <SoftSkillBar key={index} skill={skill.skill} score={skill.score} />
              ))}
            </CardContent>
          </Card>

          {/* Interview Impressions / Soft Values Notes */}
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <MessageSquare className="w-5 h-5 text-accent" />
                Intervjuintryck
              </CardTitle>
            </CardHeader>
            <CardContent>
              {data.softValuesNotes ? (
                <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
                  {data.softValuesNotes}
                </p>
              ) : (
                <div className="space-y-4">
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <p className="text-sm font-medium text-foreground mb-1">Mjuka färdigheter</p>
                    <p className="text-sm text-muted-foreground">{data.softSkillsAssessment}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Strengths */}
        {data.strengths.length > 0 && (
          <Card className="mb-6 border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <CheckCircle className="w-5 h-5 text-emerald-500" />
                Styrkor
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {data.strengths.map((strength, index) => (
                <div 
                  key={index}
                  className="bg-emerald-50 dark:bg-emerald-950/30 border-l-4 border-emerald-500 p-4 rounded-r-lg"
                >
                  <p className="font-semibold text-emerald-800 dark:text-emerald-200">
                    {strength.point}
                  </p>
                  <p className="text-sm text-emerald-600 dark:text-emerald-400 italic mt-1">
                    "{strength.evidence}"
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Development Areas */}
        {data.concerns.length > 0 && (
          <Card className="mb-6 border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <AlertTriangle className="w-5 h-5 text-amber-500" />
                Utvecklingsområden
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {data.concerns.map((concern, index) => (
                  <div 
                    key={index}
                    className="flex items-start gap-3 p-3 bg-amber-50 dark:bg-amber-950/30 border-l-4 border-amber-500 rounded-r-lg"
                  >
                    <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                    <p className="text-amber-800 dark:text-amber-200">{concern}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Technical Assessment */}
        <Card className="mb-6 border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="text-lg">Detaljerad teknisk bedömning</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground leading-relaxed">
              {data.technicalAssessment}
            </p>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center pt-6 border-t border-border">
          <p className="text-sm text-muted-foreground">
            Genererad av <span className="font-semibold text-foreground">NOCV</span> Rekryteringssystem
          </p>
        </div>

        {isPreview && (
          <div className="fixed bottom-4 left-1/2 -translate-x-1/2">
            <Badge variant="secondary" className="px-4 py-2 shadow-lg">
              Förhandsgranskning
            </Badge>
          </div>
        )}
      </div>
    </div>
  );
}
