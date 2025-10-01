import { useState } from 'react';
import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

const companySchema = z.object({
  name: z.string().min(1, 'Företagsnamn är obligatoriskt').max(255),
  description: z.string().max(500, 'Beskrivningen får max vara 500 tecken').optional().or(z.literal('')),
  website: z.string().url('Ogiltig URL').optional().or(z.literal('')),
  logo_url: z.string().url('Ogiltig URL').optional().or(z.literal('')),
  contact_person: z.string().min(1, 'Kontaktperson är obligatoriskt').max(255),
  contact_email: z.string().min(1, 'E-post är obligatoriskt').email('Ogiltig e-postadress'),
  contact_phone: z.string().min(1, 'Mobiltelefon är obligatoriskt').regex(/^[\d\s\-+()]+$/, 'Ogiltigt telefonnummer'),
});

type CompanyFormData = z.infer<typeof companySchema>;

interface Company {
  id: string;
  name: string;
  description: string | null;
  website: string | null;
  logo_url: string | null;
  contact_person: string;
  contact_email: string;
  contact_phone: string;
}

interface CompanyFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  company?: Company | null;
}

export function CompanyForm({ open, onOpenChange, onSuccess, company }: CompanyFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isEditMode = !!company;

  const form = useForm<CompanyFormData>({
    resolver: zodResolver(companySchema),
    defaultValues: {
      name: company?.name || '',
      description: company?.description || '',
      website: company?.website || '',
      logo_url: company?.logo_url || '',
      contact_person: company?.contact_person || '',
      contact_email: company?.contact_email || '',
      contact_phone: company?.contact_phone || '',
    },
  });

  // Update form when company changes
  React.useEffect(() => {
    if (company) {
      form.reset({
        name: company.name,
        description: company.description || '',
        website: company.website || '',
        logo_url: company.logo_url || '',
        contact_person: company.contact_person,
        contact_email: company.contact_email,
        contact_phone: company.contact_phone,
      });
    } else {
      form.reset({
        name: '',
        description: '',
        website: '',
        logo_url: '',
        contact_person: '',
        contact_email: '',
        contact_phone: '',
      });
    }
  }, [company, form]);

  const onSubmit = async (data: CompanyFormData) => {
    setIsSubmitting(true);

    try {
      if (isEditMode && company) {
        // Update existing company
        const { error } = await supabase
          .from('companies')
          .update({
            name: data.name,
            description: data.description || null,
            website: data.website || null,
            logo_url: data.logo_url || null,
            contact_person: data.contact_person,
            contact_email: data.contact_email,
            contact_phone: data.contact_phone,
          })
          .eq('id', company.id);

        if (error) {
          console.error('Supabase error:', error);
          toast({
            variant: 'destructive',
            title: 'Misslyckades att uppdatera företag',
            description: error.message || 'Ett oväntat fel uppstod. Försök igen.',
          });
          return;
        }

        toast({
          title: 'Företag uppdaterat',
          description: `${data.name} har uppdaterats.`,
        });
      } else {
        // Create new company
        const { error } = await supabase
          .from('companies')
          .insert({
            name: data.name,
            description: data.description || null,
            website: data.website || null,
            logo_url: data.logo_url || null,
            contact_person: data.contact_person,
            contact_email: data.contact_email,
            contact_phone: data.contact_phone,
          });

        if (error) {
          console.error('Supabase error:', error);
          toast({
            variant: 'destructive',
            title: 'Misslyckades att skapa företag',
            description: error.message || 'Ett oväntat fel uppstod. Försök igen.',
          });
          return;
        }

        toast({
          title: 'Företag skapat',
          description: `${data.name} har lagts till i systemet.`,
        });
      }

      form.reset();
      onOpenChange(false);
      onSuccess();
    } catch (error) {
      console.error('Error saving company:', error);
      toast({
        variant: 'destructive',
        title: isEditMode ? 'Misslyckades att uppdatera företag' : 'Misslyckades att skapa företag',
        description: 'Ett oväntat fel uppstod. Försök igen.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle>{isEditMode ? 'Redigera företag' : 'Nytt företag'}</DialogTitle>
          <DialogDescription>
            {isEditMode 
              ? 'Uppdatera företagets information. Fält markerade med * är obligatoriska.'
              : 'Lägg till ett nytt företag i systemet. Fält markerade med * är obligatoriska.'
            }
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 max-h-[65vh] overflow-y-auto px-1">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Företagsnamn *</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Exempel AB" 
                      {...field}
                      disabled={isSubmitting}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Kort beskrivning</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="En kort beskrivning av företaget..." 
                      {...field}
                      disabled={isSubmitting}
                      rows={3}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="website"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Webbplats</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="https://exempel.se" 
                      {...field}
                      disabled={isSubmitting}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="logo_url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Logotyp (URL)</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="https://exempel.se/logo.png" 
                      {...field}
                      disabled={isSubmitting}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="border-t pt-4 mt-4">
              <h3 className="font-semibold mb-4">Kontaktuppgifter</h3>
              
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="contact_person"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Kontaktperson *</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Anna Andersson" 
                          {...field}
                          disabled={isSubmitting}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="contact_email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>E-post *</FormLabel>
                      <FormControl>
                        <Input 
                          type="email"
                          placeholder="anna@exempel.se" 
                          {...field}
                          disabled={isSubmitting}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="contact_phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Mobiltelefon *</FormLabel>
                      <FormControl>
                        <Input 
                          type="tel"
                          placeholder="070-123 45 67" 
                          {...field}
                          disabled={isSubmitting}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <DialogFooter className="mt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Avbryt
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {isEditMode ? 'Uppdatera företag' : 'Skapa företag'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
