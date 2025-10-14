import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { DateTimePicker } from "@/components/ui/date-time-picker";
import { getInterviewMessageTemplate } from "@/utils/interviewTemplates";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Calendar, Edit } from "lucide-react";
import { stockholmToUTC } from "@/lib/timezone";

interface InterviewBookingDialogProps {
  application: {
    id: string;
    candidate_name: string;
    email: string;
    interview_scheduled_at?: string | null;
    interview_link?: string | null;
    interview_notes?: string | null;
    jobs?: { title: string };
  };
  onInterviewBooked: (success: boolean) => void;
  disabled?: boolean;
  mode?: 'create' | 'edit';
}

export function InterviewBookingDialog({
  application,
  onInterviewBooked,
  disabled,
  mode = 'create'
}: InterviewBookingDialogProps) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [interviewLink, setInterviewLink] = useState("");
  const [scheduledAt, setScheduledAt] = useState<Date | undefined>(undefined);
  const [message, setMessage] = useState("");
  const [sendEmail, setSendEmail] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      if (mode === 'edit' && application.interview_scheduled_at) {
        setInterviewLink(application.interview_link || "");
        setScheduledAt(new Date(application.interview_scheduled_at));
        setMessage(application.interview_notes || "");
        setSendEmail(false);
      } else {
        setInterviewLink("");
        setScheduledAt(undefined);
        setMessage(getInterviewMessageTemplate(
          application.candidate_name,
          application.jobs?.title || "denna position"
        ));
        setSendEmail(true);
      }
    }
  }, [open, mode, application]);

  const validateUrl = (url: string): boolean => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const handleSave = async () => {
    if (!interviewLink.trim()) {
      toast({
        title: "Obligatoriskt fält",
        description: "Vänligen ange en videolänk",
        variant: "destructive",
      });
      return;
    }

    if (!validateUrl(interviewLink)) {
      toast({
        title: "Ogiltig länk",
        description: "Vänligen ange en giltig URL",
        variant: "destructive",
      });
      return;
    }

    if (!scheduledAt) {
      toast({
        title: "Obligatoriskt fält",
        description: "Vänligen välj datum och tid",
        variant: "destructive",
      });
      return;
    }

    const minTime = new Date();
    minTime.setHours(minTime.getHours() + 2);
    
    if (scheduledAt < minTime) {
      toast({
        title: "Ogiltig tid",
        description: "Intervjun måste bokas minst 2 timmar i förväg",
        variant: "destructive",
      });
      return;
    }

    if (!message.trim()) {
      toast({
        title: "Obligatoriskt fält",
        description: "Vänligen ange ett meddelande till kandidaten",
        variant: "destructive",
      });
      return;
    }

    if (message.length > 1000) {
      toast({
        title: "För långt meddelande",
        description: "Meddelandet får max vara 1000 tecken",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase.functions.invoke('send-interview-invitation', {
        body: {
          applicationId: application.id,
          interviewLink,
          scheduledAt: stockholmToUTC(scheduledAt),
          message,
          isUpdate: mode === 'edit',
          sendEmail,
        },
      });

      if (error) {
        console.error('Error booking interview:', error);
        
        if (error.message.includes('Rate limit')) {
          toast({
            title: "För många förfrågningar",
            description: "Vänligen vänta en stund innan du försöker igen",
            variant: "destructive",
          });
        } else if (error.message.includes('Payment required')) {
          toast({
            title: "Krediter saknas",
            description: "Vänligen lägg till krediter till ditt Lovable AI-konto",
            variant: "destructive",
          });
        } else {
          toast({
            title: "Ett fel uppstod",
            description: sendEmail ? "Intervjun har sparats men e-posten kunde inte skickas" : "Kunde inte spara intervjun",
            variant: "destructive",
          });
        }
        
        if (!sendEmail) {
          onInterviewBooked(false);
          return;
        }
      } else {
        toast({
          title: mode === 'edit' ? "Intervju uppdaterad!" : "Intervju bokad!",
          description: sendEmail 
            ? "Kandidaten har meddelats via e-post." 
            : "Intervju sparad utan e-postutskick.",
        });
      }

      setOpen(false);
      onInterviewBooked(true);
    } catch (error) {
      console.error('Error booking interview:', error);
      toast({
        title: "Ett fel uppstod",
        description: "Kunde inte boka intervju",
        variant: "destructive",
      });
      onInterviewBooked(false);
    } finally {
      setSaving(false);
    }
  };

  const minDate = new Date();
  minDate.setHours(minDate.getHours() + 2);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {mode === 'create' ? (
          <Button variant="outline" size="sm" disabled={disabled}>
            <Calendar className="w-4 h-4 mr-2" />
            Boka intervju
          </Button>
        ) : (
          <Button variant="outline" size="sm" className="flex-1" disabled={disabled}>
            <Edit className="w-4 h-4 mr-2" />
            Redigera intervju
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {mode === 'edit' ? 'Redigera intervju' : 'Boka videointervju'}
          </DialogTitle>
          <DialogDescription>
            {mode === 'edit' 
              ? 'Uppdatera intervjudetaljer för ' + application.candidate_name
              : 'Bjud in ' + application.candidate_name + ' till en videointervju'
            }
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="interview-link">Länk till videointervju *</Label>
            <Input
              id="interview-link"
              placeholder="https://teams.microsoft.com/... eller Zoom/Meet-länk"
              value={interviewLink}
              onChange={(e) => setInterviewLink(e.target.value)}
              disabled={saving}
            />
            <p className="text-xs text-muted-foreground">
              Skapa ett möte i Teams, Zoom eller Google Meet och klistra in länken här
            </p>
          </div>

          <div className="space-y-2">
            <Label>Datum och tid *</Label>
            <DateTimePicker
              value={scheduledAt}
              onChange={setScheduledAt}
              minDate={minDate}
              disabled={saving}
            />
            <p className="text-xs text-muted-foreground">
              Intervjun måste bokas minst 2 timmar i förväg
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="message">Personligt meddelande till kandidat *</Label>
            <Textarea
              id="message"
              placeholder="Ditt meddelande till kandidaten..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              disabled={saving}
              rows={10}
              className="resize-none"
            />
            <p className="text-xs text-muted-foreground">
              Max 1000 tecken. Du kan redigera standardmallen ovan.
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="send-email"
              checked={sendEmail}
              onCheckedChange={(checked) => setSendEmail(checked as boolean)}
              disabled={saving}
            />
            <Label htmlFor="send-email" className="cursor-pointer">
              {mode === 'edit' 
                ? 'Skicka uppdaterad inbjudan via e-post till kandidaten'
                : 'Skicka inbjudan via e-post till kandidaten'
              }
            </Label>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={saving}>
            Avbryt
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Sparar..." : (mode === 'edit' ? "Uppdatera intervju" : "Skicka inbjudan")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
