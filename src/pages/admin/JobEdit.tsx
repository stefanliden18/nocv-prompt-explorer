import React, { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RichTextEditor } from '@/components/RichTextEditor';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { ArrowLeft, Eye, CalendarIcon, Save, Send, Archive, FolderOpen } from 'lucide-react';
import DOMPurify from 'dompurify';
import { format } from 'date-fns';
import { sv } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { stockholmToUTC, utcToStockholm, nowInStockholm } from '@/lib/timezone';
import { RequirementProfileForm } from '@/components/RequirementProfileForm';
import type { RequirementProfile } from '@/types/requirementTemplate';
import type { Database } from '@/integrations/supabase/types';

interface Company {
  id: string;
  name: string;
}

type Job = Database['public']['Tables']['jobs']['Row'] & {
  companies?: {
    name: string;
    org_number: string | null;
    address: string | null;
    postal_code: string | null;
    city: string | null;
    website: string | null;
  };
};

export default function JobEdit() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [jobLoading, setJobLoading] = useState(true);
  
  // Form state
  const [title, setTitle] = useState('');
  const [companyId, setCompanyId] = useState('');
  const [city, setCity] = useState('');
  const [region, setRegion] = useState('');
  const [category, setCategory] = useState('');
  const [employmentType, setEmploymentType] = useState('');
  const [descriptionHtml, setDescriptionHtml] = useState('');
  
  const [driverLicense, setDriverLicense] = useState(false);
  const [language, setLanguage] = useState('');
  const [slug, setSlug] = useState('');
  const [kikuInterviewUrl, setKikuInterviewUrl] = useState('');
  const [hideCompanyInEmails, setHideCompanyInEmails] = useState(false);
  const [status, setStatus] = useState<'draft' | 'published' | 'archived' | 'demo' | 'inactive'>('draft');
  const [publishAt, setPublishAt] = useState<Date | undefined>(undefined);
  const [publishHour, setPublishHour] = useState<string>('09');
  const [publishMinute, setPublishMinute] = useState<string>('00');
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const [tempDate, setTempDate] = useState<Date | undefined>(undefined);
  const [tempHour, setTempHour] = useState<string>('09');
  const [tempMinute, setTempMinute] = useState<string>('00');
  const [hasSelectedTime, setHasSelectedTime] = useState(false);
  const [requirementProfile, setRequirementProfile] = useState<RequirementProfile | null>(null);

  useEffect(() => {
    fetchCompanies();
    if (id) {
      fetchJob(id);
    }
  }, [id]);

  const fetchCompanies = async () => {
    try {
      const { data, error } = await supabase
        .from('companies')
        .select('id, name')
        .order('name');
      
      if (error) throw error;
      setCompanies(data || []);
    } catch (error: any) {
      console.error('Error fetching companies:', error);
      toast.error('Kunde inte hämta företag');
    }
  };

  const updateJobField = async (field: string, value: any) => {
    if (!id) return;
    try {
      const { error } = await supabase
        .from('jobs')
        .update({ [field]: value })
        .eq('id', id);
      if (error) throw error;
    } catch (error: any) {
      console.error(`Error updating ${field}:`, error);
    }
  };

  const fetchJob = async (jobId: string) => {
    setJobLoading(true);
    try {
      const { data: job, error } = await supabase
        .from('jobs')
        .select('*, companies(name, org_number, address, postal_code, city, website)')
        .eq('id', jobId)
        .single();

      if (error) throw error;

      if (job) {
        setTitle(job.title);
        setCompanyId(job.company_id);
        setCity(job.city || '');
        setRegion(job.region || '');
        setCategory(job.category || '');
        setEmploymentType(job.employment_type || '');
        // Combine description and requirements for backward compatibility
        const combinedDescription = job.description_md || '';
        const legacyRequirements = job.requirements_md || '';
        setDescriptionHtml(combinedDescription + (legacyRequirements ? legacyRequirements : ''));
        setDriverLicense(job.driver_license || false);
        setLanguage(job.language || '');
        setSlug(job.slug);
        setKikuInterviewUrl(job.kiku_interview_url || '');
        setHideCompanyInEmails((job as any).hide_company_in_emails || false);
        setStatus(job.status);
        
        // Handle requirement_profile
        if ((job as any).requirement_profile) {
          setRequirementProfile((job as any).requirement_profile as RequirementProfile);
        }

        // Handle publish_at - convert from UTC to Stockholm time
        if (job.publish_at) {
          const publishAtDate = utcToStockholm(job.publish_at);
          setPublishAt(publishAtDate);
          setPublishHour(publishAtDate.getHours().toString().padStart(2, '0'));
          setPublishMinute(publishAtDate.getMinutes().toString().padStart(2, '0'));
        }
      }
    } catch (error: any) {
      console.error('Error fetching job:', error);
      toast.error('Kunde inte hämta jobb');
    } finally {
      setJobLoading(false);
    }
  };

  const getStatusBadge = () => {
    const badges = {
      draft: <Badge variant="secondary">Utkast</Badge>,
      published: <Badge variant="default">Publicerad</Badge>,
      inactive: <Badge variant="outline" className="text-orange-600 border-orange-300">Vilande</Badge>,
      archived: <Badge variant="destructive">Arkiverad</Badge>,
      demo: <Badge className="bg-yellow-500 hover:bg-yellow-600 text-black">Demo</Badge>,
    };
    return badges[status] || null;
  };

  const getActionBarButtons = () => {
    const buttons = {
      save: true,
      preview: true,
      publish: status === 'draft' || status === 'inactive',
      schedule: status === 'draft' || status === 'published' || status === 'inactive',
      addToLibrary: status === 'published',
      archive: status === 'draft' || status === 'published' || status === 'inactive',
      setDemo: status !== 'demo',
      unsetDemo: status === 'demo',
    };
    return buttons;
  };

  const updateJob = async (newStatus?: 'draft' | 'published' | 'archived' | 'demo' | 'inactive') => {
    if (!id) return;

    // Basic validation
    if (!title.trim()) {
      toast.error('Titel är obligatoriskt');
      return;
    }
    if (!city.trim()) {
      toast.error('Stad är obligatoriskt');
      return;
    }
    if (!category.trim()) {
      toast.error('Kategori är obligatoriskt');
      return;
    }
    if (!descriptionHtml.trim()) {
      toast.error('Beskrivning är obligatoriskt');
      return;
    }
    if (!companyId) {
      toast.error('Företag är obligatoriskt');
      return;
    }

    setLoading(true);
    try {
      const updateData: any = {
        title: title.trim(),
        company_id: companyId,
        city: city.trim(),
        region: region.trim() || null,
        category: category.trim(),
        employment_type: employmentType || null,
        description_md: descriptionHtml.trim(),
        requirements_md: null,
        driver_license: driverLicense,
        language: language.trim() || null,
        slug: slug,
        kiku_interview_url: kikuInterviewUrl.trim() || null,
        hide_company_in_emails: hideCompanyInEmails,
        publish_at: (() => {
          if (!publishAt) return null;
          const publishAtUTC = stockholmToUTC(publishAt);
          return publishAtUTC;
        })(),
        requirement_profile: requirementProfile as any,
      };

      if (newStatus) {
        updateData.status = newStatus;
      }

      const { error } = await supabase
        .from('jobs')
        .update(updateData)
        .eq('id', id);

      if (error) throw error;

      if (newStatus) {
        setStatus(newStatus);
      }

      toast.success('Jobb uppdaterat!');
    } catch (error: any) {
      console.error('Error updating job:', error);
      toast.error(error.message || 'Kunde inte uppdatera jobb');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = () => updateJob();
  
  const handlePublish = () => {
    const now = nowInStockholm();
    setPublishAt(now);
    setTimeout(() => updateJob('published'), 10);
  };
  
  const handleArchive = () => updateJob('archived');

  const handleSetDemo = () => {
    if (window.confirm('Är du säker på att du vill sätta detta jobb som demo? Detta gör jobbet tillgängligt på /demo/{slug} och markerar alla ansökningar som demo-ansökningar.')) {
      updateJob('demo');
    }
  };

  const handleUnsetDemo = () => {
    if (window.confirm('Är du säker på att du vill ta bort demo-status? Jobbet kommer att bli ett vanligt utkast igen.')) {
      updateJob('draft');
    }
  };

  const handlePreview = () => {
    if (id) {
      window.open(`/jobs/${slug}`, '_blank');
    }
  };

  const handleSchedule = async () => {
    if (!publishAt) {
      toast.error('Välj datum och tid först');
      return;
    }

    await updateJob();
    toast.success('Publicering schemalagd!', {
      description: `Jobbet kommer att publiceras ${format(publishAt, "PPP 'kl.' HH:mm", { locale: sv })}`,
      duration: 5000
    });
  };

  const handleAddToLibrary = () => updateJob('inactive');

  const buttons = getActionBarButtons();

  if (jobLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <p className="text-muted-foreground">Laddar jobb...</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Fixed Action Bar */}
        <div className="sticky top-0 z-10 bg-background border-b pb-4 -mt-6 -mx-6 px-6 pt-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => navigate('/admin/jobs')}>
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold">
                  {id ? 'Redigera jobb' : 'Skapa nytt jobb'}
                </h1>
                {getStatusBadge()}
              </div>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-2">
            <Button
              onClick={handleSave}
              disabled={loading || !buttons.save}
              variant="outline"
            >
              <Save className="h-4 w-4 mr-2" />
              Spara
            </Button>
            
            <Button
              onClick={handlePreview}
              disabled={!buttons.preview || !id}
              variant="outline"
            >
              <Eye className="h-4 w-4 mr-2" />
              Förhandsgranska
            </Button>
            
            <Button
              onClick={handlePublish}
              disabled={loading || !buttons.publish}
              variant="default"
            >
              <Send className="h-4 w-4 mr-2" />
              Publicera
            </Button>
            
            <Button
              onClick={() => {
                if (hasSelectedTime) {
                  handleSchedule();
                  setHasSelectedTime(false);
                } else {
                  setIsPopoverOpen(true);
                }
              }}
              disabled={loading || !buttons.schedule}
              variant={hasSelectedTime ? "default" : "outline"}
              className={cn(
                hasSelectedTime && "bg-green-600 hover:bg-green-700 animate-pulse"
              )}
            >
              <CalendarIcon className="h-4 w-4 mr-2" />
              {hasSelectedTime ? "SPARA SCHEMALÄGGNING" : "VÄLJ DATUM OCH TID"}
            </Button>
            
            {buttons.addToLibrary && (
              <Button
                onClick={handleAddToLibrary}
                disabled={loading}
                variant="secondary"
              >
                <FolderOpen className="h-4 w-4 mr-2" />
                Lägg i bibliotek
              </Button>
            )}
            
            <Button
              onClick={handleArchive}
              disabled={loading || !buttons.archive}
              variant="destructive"
            >
              <Archive className="h-4 w-4 mr-2" />
              Arkivera
            </Button>

            {buttons.setDemo && (
              <Button
                onClick={handleSetDemo}
                disabled={loading}
                className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold"
              >
                🎬 Sätt som demo
              </Button>
            )}

            {buttons.unsetDemo && (
              <Button
                onClick={handleUnsetDemo}
                disabled={loading}
                variant="outline"
              >
                Ta bort demo-status
              </Button>
            )}
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Form */}
          <Card>
            <CardHeader>
              <CardTitle>Jobbinformation</CardTitle>
              <CardDescription>Uppdatera information om jobbet</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="title">Titel *</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="T.ex. Svetsare"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="company">Företag *</Label>
                <Select value={companyId} onValueChange={setCompanyId} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Välj företag" />
                  </SelectTrigger>
                  <SelectContent>
                    {companies.map((company) => (
                      <SelectItem key={company.id} value={company.id}>
                        {company.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="city">Stad *</Label>
                  <Input
                    id="city"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="Stockholm"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="region">Region</Label>
                  <Input
                    id="region"
                    value={region}
                    onChange={(e) => setRegion(e.target.value)}
                    placeholder="Stockholms län"
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="category">Kategori *</Label>
                  <Input
                    id="category"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    placeholder="Industri"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="employmentType">Anställningsform</Label>
                  <Input
                    id="employmentType"
                    value={employmentType}
                    onChange={(e) => setEmploymentType(e.target.value)}
                    placeholder="Heltid, Tillsvidare"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Annonstext *</Label>
                <RichTextEditor
                  content={descriptionHtml}
                  onChange={setDescriptionHtml}
                  placeholder="Beskriv tjänsten, arbetsuppgifter och krav..."
                  minHeight="300px"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="language">Språk</Label>
                <Input
                  id="language"
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  placeholder="Svenska, Engelska"
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="driverLicense"
                  checked={driverLicense}
                  onCheckedChange={setDriverLicense}
                />
                <Label htmlFor="driverLicense">Kräver körkort</Label>
              </div>

              <div className="flex items-center space-x-2 p-3 rounded-lg border border-amber-200 bg-amber-50">
                <Switch
                  id="hideCompanyInEmails"
                  checked={hideCompanyInEmails}
                  onCheckedChange={setHideCompanyInEmails}
                />
                <div>
                  <Label htmlFor="hideCompanyInEmails">Dölj företagsnamn för kandidater</Label>
                  <p className="text-xs text-muted-foreground">
                    Företaget visas inte i annonsen eller i mejl till kandidater
                  </p>
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <Label htmlFor="slug">Slug</Label>
                <Input
                  id="slug"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  placeholder="slug-for-jobbet"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="kikuInterviewUrl">GetKiku Intervjulänk (valfritt)</Label>
                <Input
                  id="kikuInterviewUrl"
                  value={kikuInterviewUrl}
                  onChange={(e) => setKikuInterviewUrl(e.target.value)}
                  placeholder="https://getkiku.com/interview/..."
                />
                <p className="text-xs text-muted-foreground">
                  Kandidater vidarebefordras automatiskt till denna länk efter att de bokat intervju.
                </p>
              </div>


              <div className="space-y-2">
                <Label>Publiceringsdatum (valfritt)</Label>
                <p className="text-xs text-muted-foreground mb-2">Stockholm-tid (CET/CEST)</p>
                <Popover open={isPopoverOpen} onOpenChange={(open) => {
                  setIsPopoverOpen(open);
                  if (open) {
                    if (publishAt) {
                      setTempDate(publishAt);
                      setTempHour(publishAt.getHours().toString().padStart(2, '0'));
                      setTempMinute(publishAt.getMinutes().toString().padStart(2, '0'));
                    } else {
                      setTempDate(undefined);
                      setTempHour('09');
                      setTempMinute('00');
                    }
                  } else {
                    if (!publishAt) {
                      setHasSelectedTime(false);
                    }
                  }
                }}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !publishAt && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {publishAt ? (
                        <>
                          {format(publishAt, "PPP", { locale: sv })} kl. {publishHour}:{publishMinute}
                        </>
                      ) : (
                        "Välj datum och tid"
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={tempDate}
                      onSelect={(date) => setTempDate(date)}
                      initialFocus
                      locale={sv}
                    />
                    <div className="p-3 border-t flex gap-2">
                      <Select value={tempHour} onValueChange={setTempHour}>
                        <SelectTrigger className="w-[70px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Array.from({ length: 24 }, (_, i) => {
                            const hour = i.toString().padStart(2, '0');
                            return (
                              <SelectItem key={hour} value={hour}>
                                {hour}
                              </SelectItem>
                            );
                          })}
                        </SelectContent>
                      </Select>
                      :
                      <Select value={tempMinute} onValueChange={setTempMinute}>
                        <SelectTrigger className="w-[70px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Array.from({ length: 60 }, (_, i) => {
                            const minute = i.toString().padStart(2, '0');
                            return (
                              <SelectItem key={minute} value={minute}>
                                {minute}
                              </SelectItem>
                            );
                          })}
                        </SelectContent>
                      </Select>
                      <Button
                        size="sm"
                        onClick={() => {
                          if (!tempDate) {
                            toast.error('Välj datum först');
                            return;
                          }
                          const combined = new Date(tempDate);
                          combined.setHours(parseInt(tempHour), parseInt(tempMinute), 0, 0);
                          setPublishAt(combined);
                          setPublishHour(tempHour);
                          setPublishMinute(tempMinute);
                          setHasSelectedTime(true);
                          setIsPopoverOpen(false);
                        }}
                        className="ml-auto"
                      >
                        OK
                      </Button>
                    </div>
                  </PopoverContent>
                </Popover>
                {publishAt && (
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setPublishAt(undefined);
                        setHasSelectedTime(false);
                      }}
                    >
                      Rensa datum
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Requirement Profile */}
          <RequirementProfileForm 
            value={requirementProfile}
            onChange={setRequirementProfile}
          />

          {/* Preview */}
          <Card className="lg:sticky lg:top-6 h-fit">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Eye className="h-4 w-4" />
                <CardTitle>Förhandsvisning</CardTitle>
              </div>
              <CardDescription>Så kommer jobbet att se ut</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h2 className="text-2xl font-bold">
                    {title || 'Jobbtitel'}
                  </h2>
                  <p className="text-muted-foreground">
                    {companies.find(c => c.id === companyId)?.name || 'Företagsnamn'}
                  </p>
                </div>

                <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
                  {city && <span>📍 {city}</span>}
                  {region && <span>• {region}</span>}
                  {category && <span>• {category}</span>}
                  {employmentType && <span>• {employmentType}</span>}
                </div>

                {driverLicense && (
                  <div className="text-sm">
                    🚗 Körkort krävs
                  </div>
                )}

                {language && (
                  <div className="text-sm">
                    💬 Språk: {language}
                  </div>
                )}

                <Separator />

                {descriptionHtml && (
                  <div>
                    <h3 className="font-semibold mb-2">Om tjänsten</h3>
                    <div 
                      className="prose prose-sm max-w-none"
                      dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(descriptionHtml) }}
                    />
                  </div>
                )}

                <Separator />

                <Button className="w-full">Ansök nu</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}
