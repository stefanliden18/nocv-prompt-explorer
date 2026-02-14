import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { MessageSquare, HelpCircle } from "lucide-react";
import { format } from "date-fns";
import { sv } from "date-fns/locale";

interface QAPair {
  question: string;
  answer: string;
}

interface Transcript {
  id: string;
  interview_type: "screening" | "full_interview";
  transcript_text: string;
  imported_at: string;
  structured_data: any;
}

function parseTranscript(text: string): QAPair[] | null {
  // Try "Fråga:" / "Svar:" format
  const qaPrefixPattern = /(?:Fråga|Fraga|Question)\s*:\s*([\s\S]*?)(?:Svar|Answer)\s*:\s*([\s\S]*?)(?=(?:Fråga|Fraga|Question)\s*:|$)/gi;
  let matches = [...text.matchAll(qaPrefixPattern)];
  if (matches.length > 0) {
    return matches.map((m) => ({
      question: m[1].trim(),
      answer: m[2].trim(),
    }));
  }

  // Try "Kiku:" / other speaker dialog format
  const dialogPattern = /(?:Kiku|Sara)\s*:\s*([\s\S]*?)(?:\n)([A-ZÅÄÖ][a-zåäö]+)\s*:\s*([\s\S]*?)(?=(?:Kiku|Sara)\s*:|$)/gi;
  matches = [...text.matchAll(dialogPattern)];
  if (matches.length > 0) {
    return matches.map((m) => ({
      question: m[1].trim(),
      answer: m[3].trim(),
    }));
  }

  // Try question-mark based parsing: lines ending with ? are questions
  const lines = text.split("\n");
  const pairs: QAPair[] = [];
  let currentQuestion: string | null = null;
  let answerLines: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) {
      if (currentQuestion) answerLines.push("");
      continue;
    }
    // Detect question: ends with ? optionally followed by (required) or similar
    if (/\?\s*(\(.*?\))?\s*$/.test(trimmed)) {
      if (currentQuestion) {
        pairs.push({ question: currentQuestion, answer: answerLines.join("\n").trim() });
      }
      currentQuestion = trimmed;
      answerLines = [];
    } else if (currentQuestion) {
      answerLines.push(trimmed);
    }
  }
  if (currentQuestion) {
    pairs.push({ question: currentQuestion, answer: answerLines.join("\n").trim() });
  }
  if (pairs.length > 0) return pairs;

  return null;
}

const interviewTypeLabels: Record<string, { label: string; color: string }> = {
  screening: { label: "Screening", color: "bg-blue-100 text-blue-800 border-blue-200" },
  full_interview: { label: "Djupintervju", color: "bg-purple-100 text-purple-800 border-purple-200" },
};

export function KikuTranscriptViewer({ applicationId }: { applicationId: string }) {
  const [transcripts, setTranscripts] = useState<Transcript[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTranscripts = async () => {
      const { data, error } = await supabase
        .from("candidate_transcripts")
        .select("id, interview_type, transcript_text, imported_at, structured_data")
        .eq("application_id", applicationId)
        .order("imported_at", { ascending: true });

      if (!error && data) {
        setTranscripts(data);
      }
      setLoading(false);
    };
    fetchTranscripts();
  }, [applicationId]);

  if (loading || transcripts.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-primary" />
            <CardTitle>Intervjusvar från Kiku</CardTitle>
          </div>
          <Badge variant="secondary">
            {transcripts.length} {transcripts.length === 1 ? "intervju" : "intervjuer"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <Accordion type="multiple" defaultValue={[transcripts[0]?.id]}>
          {transcripts.map((t) => {
            const meta = interviewTypeLabels[t.interview_type] || interviewTypeLabels.screening;
            const pairs = parseTranscript(t.transcript_text);

            return (
              <AccordionItem key={t.id} value={t.id} className="border rounded-lg mb-3 last:mb-0 px-1">
                <AccordionTrigger className="hover:no-underline py-3">
                  <div className="flex items-center gap-3">
                    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${meta.color}`}>
                      {meta.label}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {format(new Date(t.imported_at), "d MMM yyyy", { locale: sv })}
                    </span>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  {pairs ? (
                    <div className="space-y-4">
                      {pairs.map((pair, i) => (
                        <div key={i} className="rounded-lg overflow-hidden border">
                          <div className="bg-muted/60 px-4 py-3 flex items-start gap-2">
                            <span className="text-sm font-bold text-primary shrink-0">{i + 1}.</span>
                            <p className="text-sm font-bold leading-relaxed">{pair.question}</p>
                          </div>
                          <div className="px-4 py-3 bg-background">
                            <p className="text-sm leading-relaxed text-foreground whitespace-pre-wrap pl-7">
                              {pair.answer}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="rounded-lg border bg-muted/30 p-4">
                      <p className="text-sm whitespace-pre-wrap text-foreground">
                        {t.transcript_text}
                      </p>
                    </div>
                  )}
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>
      </CardContent>
    </Card>
  );
}
