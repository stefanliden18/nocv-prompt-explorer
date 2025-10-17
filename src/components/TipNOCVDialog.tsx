import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Lightbulb } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { analytics } from "@/lib/analytics";

const tipNOCVSchema = z.object({
  senderName: z.string().min(1, "Ditt namn är obligatoriskt").max(100),
  senderEmail: z.string().email("Ogiltig e-postadress").max(255),
  friendEmail: z.string().email("Ogiltig e-postadress").max(255),
  category: z.enum(["jobseeker", "recruiter", "general"], {
    required_error: "Välj en kategori",
  }),
  personalMessage: z.string().max(500, "Meddelandet får max vara 500 tecken").optional(),
  honeypot: z.string().max(0, "Bot detected"),
});

type TipNOCVFormData = z.infer<typeof tipNOCVSchema>;

interface TipNOCVDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TipNOCVDialog({ open, onOpenChange }: TipNOCVDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>("");

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
  } = useForm<TipNOCVFormData>({
    resolver: zodResolver(tipNOCVSchema),
  });

  const onSubmit = async (data: TipNOCVFormData) => {
    if (data.honeypot) {
      console.log("Bot detected");
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await supabase.functions.invoke("send-nocv-tip", {
        body: {
          senderName: data.senderName,
          senderEmail: data.senderEmail,
          friendEmail: data.friendEmail,
          category: data.category,
          personalMessage: data.personalMessage || "",
        },
      });

      if (error) throw error;

      // Track analytics
      analytics.trackNOCVTipSent(data.category);

      setSuccess(true);
      toast.success("Tips skickat!", {
        description: `Vi har skickat ett mail till ${data.friendEmail}`,
      });

      setTimeout(() => {
        onOpenChange(false);
        setSuccess(false);
        reset();
        setSelectedCategory("");
      }, 2000);
    } catch (error: any) {
      console.error("Error sending NOCV tip:", error);
      toast.error("Kunde inte skicka tips", {
        description: error.message || "Försök igen senare",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-primary" />
            Tipsa en vän om NOCV
          </DialogTitle>
          <DialogDescription>
            Dela NOCV med någon som skulle ha nytta av vår tjänst
          </DialogDescription>
        </DialogHeader>

        {success ? (
          <div className="py-8 text-center">
            <div className="mb-4 text-4xl">✅</div>
            <h3 className="text-lg font-semibold mb-2">Tips skickat!</h3>
            <p className="text-sm text-muted-foreground">
              Din vän kommer snart få ett mail om NOCV.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Honeypot field */}
            <input
              type="text"
              {...register("honeypot")}
              style={{ display: "none" }}
              tabIndex={-1}
              autoComplete="off"
            />

            <div className="space-y-2">
              <Label htmlFor="senderName">Ditt namn *</Label>
              <Input
                id="senderName"
                {...register("senderName")}
                placeholder="Ditt för- och efternamn"
              />
              {errors.senderName && (
                <p className="text-sm text-destructive">{errors.senderName.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="senderEmail">Din e-post *</Label>
              <Input
                id="senderEmail"
                type="email"
                {...register("senderEmail")}
                placeholder="din@email.se"
              />
              {errors.senderEmail && (
                <p className="text-sm text-destructive">{errors.senderEmail.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="friendEmail">Vännens e-post *</Label>
              <Input
                id="friendEmail"
                type="email"
                {...register("friendEmail")}
                placeholder="van@email.se"
              />
              {errors.friendEmail && (
                <p className="text-sm text-destructive">{errors.friendEmail.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Varför tipsar du? *</Label>
              <Select
                value={selectedCategory}
                onValueChange={(value) => {
                  setSelectedCategory(value);
                  setValue("category", value as any);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Välj anledning..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="jobseeker">Min vän söker jobb</SelectItem>
                  <SelectItem value="recruiter">Min vän rekryterar</SelectItem>
                  <SelectItem value="general">Bara nyfiken på NOCV</SelectItem>
                </SelectContent>
              </Select>
              {errors.category && (
                <p className="text-sm text-destructive">{errors.category.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="personalMessage">
                Personligt meddelande (valfritt)
              </Label>
              <Textarea
                id="personalMessage"
                {...register("personalMessage")}
                placeholder="Lägg till ett personligt meddelande till din vän..."
                rows={4}
                maxLength={500}
              />
              {errors.personalMessage && (
                <p className="text-sm text-destructive">
                  {errors.personalMessage.message}
                </p>
              )}
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
                className="flex-1"
              >
                Avbryt
              </Button>
              <Button type="submit" disabled={isSubmitting} className="flex-1">
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Skickar...
                  </>
                ) : (
                  "Skicka tips"
                )}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
