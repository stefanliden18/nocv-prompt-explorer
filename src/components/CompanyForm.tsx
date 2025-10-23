import { useState } from 'react';
import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { ImageUpload } from '@/components/ImageUpload';
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
  org_number: z.string().regex(/^\d{10}$/, 'Organisationsnummer måste vara 10 siffror').optional().or(z.literal('')),
  contact_person: z.string().min(1, 'Kontaktperson är obligatoriskt').max(255),
  contact_email: z.string().min(1, 'E-post är obligatoriskt').email('Ogiltig e-postadress'),
  contact_phone: z.string().min(1, 'Mobiltelefon är obligatoriskt').regex(/^[\d\s\-+()]+$/, 'Ogiltigt telefonnummer'),
  address: z.string().optional().or(z.literal('')),
  postal_code: z.string().optional().or(z.literal('')),
  city: z.string().optional().or(z.literal('')),
});

type CompanyFormData = z.infer<typeof companySchema>;

interface Company {
  id: string;
  name: string;
  description: string | null;
  website: string | null;
  logo_url: string | null;
  org_number: string | null;
  contact_person: string;
  contact_email: string;
  contact_phone: string;
  address: string | null;
  postal_code: string | null;
  city: string | null;
}

interface CompanyFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  company?: Company | null;
}

export function CompanyForm({ open, onOpenChange, onSuccess, company }: CompanyFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [currentLogoUrl, setCurrentLogoUrl] = useState<string | null>(company?.logo_url || null);
  const isEditMode = !!company;

  const form = useForm<CompanyFormData>({
    resolver: zodResolver(companySchema),
    defaultValues: {
      name: company?.name || '',
      description: company?.description || '',
      website: company?.website || '',
      org_number: company?.org_number || '',
      contact_person: company?.contact_person || '',
      contact_email: company?.contact_email || '',
      contact_phone: company?.contact_phone || '',
      address: company?.address || '',
      postal_code: company?.postal_code || '',
      city: company?.city || '',
    },
  });

  // Update form when company changes
  React.useEffect(() => {
    if (company) {
      form.reset({
        name: company.name,
        description: company.description || '',
        website: company.website || '',
        org_number: company.org_number || '',
        contact_person: company.contact_person,
        contact_email: company.contact_email,
        contact_phone: company.contact_phone,
        address: company.address || '',
        postal_code: company.postal_code || '',
        city: company.city || '',
      });
      setCurrentLogoUrl(company.logo_url || null);
      setLogoFile(null);
    } else {
      form.reset({
        name: '',
        description: '',
        website: '',
        org_number: '',
        contact_person: '',
        contact_email: '',
        contact_phone: '',
        address: '',
        postal_code: '',
        city: '',
      });
      setCurrentLogoUrl(null);
      setLogoFile(null);
    }
  }, [company, form]);

  const onSubmit = async (data: CompanyFormData) => {
    setIsSubmitting(true);

    try {
      let logoUrl = currentLogoUrl;

      // Upload new logo if file is selected
      if (logoFile) {
        const fileExt = logoFile.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = fileName;

        // Delete old logo if exists
        if (currentLogoUrl && isEditMode) {
          const oldPath = currentLogoUrl.split('/').pop();
          if (oldPath) {
            await supabase.storage.from('company-logos').remove([oldPath]);
          }
        }

        const { error: uploadError } = await supabase.storage
          .from('company-logos')
          .upload(filePath, logoFile, {
            cacheControl: '3600',
            upsert: false
          });

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('company-logos')
          .getPublicUrl(filePath);

        logoUrl = publicUrl;
      }

      if (isEditMode && company) {
        // Update existing company
        const { error } = await supabase
          .from('companies')
          .update({
            name: data.name,
            description: data.description || null,
            website: data.website || null,
            org_number: data.org_number || null,
            logo_url: logoUrl,
            contact_person: data.contact_person,
            contact_email: data.contact_email,
            contact_phone: data.contact_phone,
            address: data.address || null,
            postal_code: data.postal_code || null,
            city: data.city || null,
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
            org_number: data.org_number || null,
            logo_url: logoUrl,
            contact_person: data.contact_person,
            contact_email: data.contact_email,
            contact_phone: data.contact_phone,
            address: data.address || null,
            postal_code: data.postal_code || null,
            city: data.city || null,
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
      setLogoFile(null);
      setCurrentLogoUrl(null);
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

  const handleLogoRemove = async () => {
    if (currentLogoUrl && isEditMode) {
      const oldPath = currentLogoUrl.split('/').pop();
      if (oldPath) {
        await supabase.storage.from('company-logos').remove([oldPath]);
      }
    }
    setCurrentLogoUrl(null);
    setLogoFile(null);
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
              name="org_number"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Organisationsnummer</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="5569012345" 
                      {...field}
                      disabled={isSubmitting}
                      maxLength={10}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-2">
              <FormLabel>Logotyp</FormLabel>
              <ImageUpload
                value={currentLogoUrl}
                onChange={setLogoFile}
                onRemove={handleLogoRemove}
                maxSizeMB={5}
              />
            </div>

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

            <div className="border-t pt-4 mt-4">
              <h3 className="font-semibold mb-4">Adressinformation</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Krävs för publicering till Arbetsförmedlingen
              </p>
              
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Gatuadress</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Exempelgatan 123" 
                          {...field}
                          disabled={isSubmitting}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="postal_code"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Postnummer</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="123 45" 
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
                    name="city"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Stad</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Stockholm" 
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
