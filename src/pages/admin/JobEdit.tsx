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
import { ArrowLeft, Eye, CalendarIcon, Save, Send, Archive, ExternalLink } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import DOMPurify from 'dompurify';
import { format } from 'date-fns';
import { sv } from 'date-fns/locale';
import { fromZonedTime } from 'date-fns-tz';
import { cn } from '@/lib/utils';
import { stockholmToUTC, utcToStockholm, nowInStockholm, nowUTC } from '@/lib/timezone';
import { useDebugMode } from '@/hooks/useDebugMode';
import { useAFTaxonomy } from '@/hooks/useAFTaxonomy';

interface Company {
  id: string;
  name: string;
}

interface Job {
  id: string;
  title: string;
  company_id: string;
  city: string;
  region: string | null;
  category: string;
  employment_type: string | null;
  description_md: string;
  requirements_md: string | null;
  driver_license: boolean;
  language: string | null;
  status: 'draft' | 'published' | 'archived';
  slug: string;
  publish_at: string | null;
  kiku_interview_url: string | null;
  // AF-fält
  af_published: boolean;
  af_ad_id: string | null;
  af_published_at: string | null;
  af_error: string | null;
  af_last_sync: string | null;
  last_application_date: string | null;
  total_positions: number;
  contact_person_name: string | null;
  contact_person_email: string | null;
  contact_person_phone: string | null;
  af_occupation_code: string | null;
  af_municipality_code: string | null;
  af_employment_type_code: string | null;
  af_duration_code: string | null;
  af_worktime_extent_code: string | null;
}

export default function JobEdit() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isDebugEnabled } = useDebugMode();
  const { occupationCodes, municipalityCodes, employmentTypeCodes, durationCodes, worktimeExtentCodes } = useAFTaxonomy();
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
  const [requirementsHtml, setRequirementsHtml] = useState('');
  const [driverLicense, setDriverLicense] = useState(false);
  const [language, setLanguage] = useState('');
  const [slug, setSlug] = useState('');
  const [kikuInterviewUrl, setKikuInterviewUrl] = useState('');
  const [status, setStatus] = useState<'draft' | 'published' | 'archived'>('draft');
  const [publishAt, setPublishAt] = useState<Date | undefined>(undefined);
  const [publishHour, setPublishHour] = useState<string>('09');
  const [publishMinute, setPublishMinute] = useState<string>('00');
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const [tempDate, setTempDate] = useState<Date | undefined>(undefined);
  const [tempHour, setTempHour] = useState<string>('09');
  const [tempMinute, setTempMinute] = useState<string>('00');
  const [hasSelectedTime, setHasSelectedTime] = useState(false);
  
  // AF state
  const [afPublished, setAfPublished] = useState(false);
  const [afAdId, setAfAdId] = useState<string | null>(null);
  const [afPublishedAt, setAfPublishedAt] = useState<string | null>(null);
  const [afError, setAfError] = useState<string | null>(null);
  const [afLastSync, setAfLastSync] = useState<string | null>(null);
  const [lastApplicationDate, setLastApplicationDate] = useState('');
  const [totalPositions, setTotalPositions] = useState(1);
  const [contactPersonName, setContactPersonName] = useState('');
  const [contactPersonEmail, setContactPersonEmail] = useState('');
  const [contactPersonPhone, setContactPersonPhone] = useState('');
  const [afOccupationCode, setAfOccupationCode] = useState('');
  const [afMunicipalityCode, setAfMunicipalityCode] = useState('');
  const [afEmploymentTypeCode, setAfEmploymentTypeCode] = useState('');
  const [afDurationCode, setAfDurationCode] = useState('');
  const [afWorktimeExtentCode, setAfWorktimeExtentCode] = useState('');
  const [publishingToAF, setPublishingToAF] = useState(false);
  const [updatingAF, setUpdatingAF] = useState(false);
  const [unpublishingFromAF, setUnpublishingFromAF] = useState(false);

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

  const fetchJob = async (jobId: string) => {
    setJobLoading(true);
    try {
      const { data, error } = await supabase
        .from('jobs')
        .select('*')
        .eq('id', jobId)
        .single();
      
      if (error) throw error;
      
      const job = data as Job;
      setTitle(job.title);
      setCompanyId(job.company_id);
      setCity(job.city);
      setRegion(job.region || '');
      setCategory(job.category);
      setEmploymentType(job.employment_type || '');
      // Convert markdown to HTML if needed (backward compatibility)
      const descContent = job.description_md || '';
      const reqContent = job.requirements_md || '';
      setDescriptionHtml(descContent);
      setRequirementsHtml(reqContent);
      setDriverLicense(job.driver_license);
      setLanguage(job.language || '');
      setSlug(job.slug);
      setKikuInterviewUrl(job.kiku_interview_url || '');
      setStatus(job.status);
      // AF-data
      setAfPublished(job.af_published || false);
      setAfAdId(job.af_ad_id || null);
      setAfPublishedAt(job.af_published_at || null);
      setAfError(job.af_error || null);
      setAfLastSync(job.af_last_sync || null);
      setLastApplicationDate(job.last_application_date || '');
      setTotalPositions(job.total_positions || 1);
      setContactPersonName(job.contact_person_name || '');
      setContactPersonEmail(job.contact_person_email || '');
      setContactPersonPhone(job.contact_person_phone || '');
      setAfOccupationCode(job.af_occupation_code || '');
      setAfMunicipalityCode(job.af_municipality_code || '');
      setAfEmploymentTypeCode(job.af_employment_type_code || '');
      setAfDurationCode(job.af_duration_code || '');
      setAfWorktimeExtentCode(job.af_worktime_extent_code || '');
      // Convert UTC time from database to Stockholm time for display
      if (job.publish_at) {
        const stockholmDate = utcToStockholm(job.publish_at);
        setPublishAt(stockholmDate);
        setPublishHour(stockholmDate.getHours().toString().padStart(2, '0'));
        setPublishMinute(stockholmDate.getMinutes().toString().padStart(2, '0'));
      } else {
        setPublishAt(undefined);
      }
    } catch (error: any) {
      console.error('Error fetching job:', error);
      toast.error('Kunde inte hämta jobb');
      navigate('/admin/jobs');
    } finally {
      setJobLoading(false);
    }
  };

  const getStatusBadge = () => {
    if (status === 'archived') {
      return <Badge variant="secondary">Arkiverad</Badge>;
    }
    
    if (status === 'published') {
      const nowStockholmAsUtc = stockholmToUTC(nowInStockholm());
      const publishDateUtc = publishAt ? stockholmToUTC(publishAt) : null;
      if (publishDateUtc && publishDateUtc > nowStockholmAsUtc) {
        return <Badge variant="outline">Planerad</Badge>;
      }
      return <Badge variant="default">Publicerad</Badge>;
    }
    
    return <Badge variant="secondary">Utkast</Badge>;
  };

  const updateJob = async (newStatus?: 'draft' | 'published' | 'archived') => {
    if (!title.trim() || !city.trim() || !category.trim() || !descriptionHtml.trim() || !companyId) {
      toast.error('Fyll i alla obligatoriska fält');
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
        requirements_md: requirementsHtml.trim() || null,
        driver_license: driverLicense,
        language: language.trim() || null,
        slug: slug,
        kiku_interview_url: kikuInterviewUrl.trim() || null,
        // AF-fält
        last_application_date: lastApplicationDate || null,
        total_positions: totalPositions,
        contact_person_name: contactPersonName.trim() || null,
        contact_person_email: contactPersonEmail.trim() || null,
        contact_person_phone: contactPersonPhone.trim() || null,
        af_occupation_code: afOccupationCode || null,
        af_municipality_code: afMunicipalityCode || null,
        af_employment_type_code: afEmploymentTypeCode || null,
        af_duration_code: afDurationCode || null,
        af_worktime_extent_code: afWorktimeExtentCode || null,
        // Convert Stockholm time to UTC for database storage
        publish_at: (() => {
          if (!publishAt) return null;
          const publishAtUTC = stockholmToUTC(publishAt);
          console.log('🕐 Stockholm-tid vald:', publishAt);
          console.log('🌍 Konverterad till UTC:', publishAtUTC);
          return publishAtUTC;
        })(),
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
    // Set publish_at to current Stockholm time when publishing
    const now = nowInStockholm();
    setPublishAt(now);
    setTimeout(() => updateJob('published'), 10);
  };
  
  const handleArchive = () => updateJob('archived');

  const handlePreview = () => {
    if (id) {
      window.open(`/admin/jobs/${id}/preview`, '_blank');
    }
  };

  const handleSchedule = () => {
    if (!publishAt) {
      toast.error('Välj först ett datum och tid för publicering');
      return;
    }
    updateJob('published');
  };

  const handleUnpublish = () => {
    if (window.confirm('Är du säker på att du vill avpublicera detta jobb?')) {
      updateJob('draft');
    }
  };

  // AF Handler Functions
  const handlePublishToAF = async () => {
    if (!id) return;
    
    setPublishingToAF(true);
    try {
      const { data, error } = await supabase.functions.invoke('publish-to-af', {
        body: { job_id: id }
      });

      if (error) throw error;

      toast.success("Publicerad på Arbetsförmedlingen!", {
        description: `Annonsen finns nu på Platsbanken med ID: ${data.af_ad_id}`,
      });

      // Uppdatera lokal state
      setAfPublished(true);
      setAfAdId(data.af_ad_id);
      setAfPublishedAt(new Date().toISOString());
      setAfError(null);
      
    } catch (error: any) {
      console.error('Error publishing to AF:', error);
      toast.error("Fel vid publicering", {
        description: error.message,
      });
      setAfError(error.message);
    } finally {
      setPublishingToAF(false);
    }
  };

  const handleUpdateAF = async () => {
    if (!id) return;
    
    setUpdatingAF(true);
    try {
      const { error } = await supabase.functions.invoke('update-af-ad', {
        body: { job_id: id }
      });

      if (error) throw error;

      toast.success("Uppdaterad på Arbetsförmedlingen!", {
        description: "Annonsen har synkroniserats med Platsbanken",
      });

      setAfLastSync(new Date().toISOString());
      setAfError(null);
      
    } catch (error: any) {
      console.error('Error updating AF ad:', error);
      toast.error("Fel vid uppdatering", {
        description: error.message,
      });
      setAfError(error.message);
    } finally {
      setUpdatingAF(false);
    }
  };

  const handleUnpublishFromAF = async () => {
    if (!id || !window.confirm('Är du säker på att du vill avpublicera från Arbetsförmedlingen?')) {
      return;
    }
    
    setUnpublishingFromAF(true);
    try {
      const { error } = await supabase.functions.invoke('unpublish-af-ad', {
        body: { job_id: id }
      });

      if (error) throw error;

      toast.success("Avpublicerad från Arbetsförmedlingen", {
        description: "Annonsen har tagits bort från Platsbanken",
      });

      setAfPublished(false);
      setAfAdId(null);
      setAfError(null);
      
    } catch (error: any) {
      console.error('Error unpublishing from AF:', error);
      toast.error("Fel vid avpublicering", {
        description: error.message,
      });
      setAfError(error.message);
    } finally {
      setUnpublishingFromAF(false);
    }
  };

  const getActionBarButtons = () => {
    const isDraft = status === 'draft';
    const isPublished = status === 'published';
    const isArchived = status === 'archived';

    return {
      save: !isArchived,
      preview: true,
      publish: !isPublished && !isArchived,
      schedule: !isPublished && !isArchived,
      unpublish: isPublished,
      archive: !isArchived,
    };
  };

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
                  // Användaren har valt tid - spara schemaläggningen
                  handleSchedule();
                  setHasSelectedTime(false);
                } else {
                  // Användaren har inte valt tid - öppna kalendern
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
            
            {buttons.unpublish && (
              <Button
                onClick={handleUnpublish}
                disabled={loading}
                variant="secondary"
              >
                Avpublicera
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
                <Label htmlFor="description">Jobbeskrivning *</Label>
                <RichTextEditor
                  content={descriptionHtml}
                  onChange={setDescriptionHtml}
                  placeholder="Beskriv jobbet och vad ni söker..."
                  minHeight="200px"
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
                    // Återställ hasSelectedTime om kalendern stängs utan att spara
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
                      onSelect={setTempDate}
                      initialFocus
                      className="pointer-events-auto"
                    />
                    <div className="p-3 border-t space-y-3">
                      <div>
                        <Label className="text-xs mb-2 block">Tid</Label>
                        <div className="flex gap-2">
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
                          <span className="flex items-center">:</span>
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
                        </div>
                      </div>
                      {tempDate && (
                        <div className="text-xs text-muted-foreground">
                          Valt: {format(tempDate, "PPP", { locale: sv })} kl. {tempHour}:{tempMinute}
                        </div>
                      )}
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          onClick={() => {
                            setIsPopoverOpen(false);
                            setHasSelectedTime(false);
                          }}
                        >
                          Avbryt
                        </Button>
                        <Button
                          variant="default"
                          size="sm"
                          className="flex-1"
                          onClick={() => {
                            if (tempDate) {
                              // Skapa Date-objekt direkt utan sträng-parsning
                              const newDate = new Date(tempDate);
                              newDate.setHours(parseInt(tempHour, 10), parseInt(tempMinute, 10), 0, 0);
                              
                              setPublishAt(newDate);
                              setPublishHour(tempHour);
                              setPublishMinute(tempMinute);
                              setHasSelectedTime(true);
                            } else {
                              setPublishAt(undefined);
                              setHasSelectedTime(false);
                            }
                            setIsPopoverOpen(false);
                          }}
                        >
                          Spara
                        </Button>
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
                <p className="text-xs text-muted-foreground">
                  {publishAt && publishAt > nowInStockholm() && (
                    "Jobbet kommer att publiceras automatiskt vid detta datum och tid"
                  )}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Arbetsförmedlingen Integration Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                📤 Arbetsförmedlingen
                {afPublished && (
                  <Badge variant="default" className="bg-green-600">Publicerad</Badge>
                )}
                {afError && (
                  <Badge variant="destructive">Fel vid publicering</Badge>
                )}
              </CardTitle>
              <CardDescription>Publicera jobbet på Platsbanken</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Kontaktuppgifter */}
              <div className="space-y-4">
                <h4 className="font-semibold text-sm">Kontaktuppgifter *</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="contact_person_name">Kontaktperson *</Label>
                    <Input
                      id="contact_person_name"
                      value={contactPersonName}
                      onChange={(e) => setContactPersonName(e.target.value)}
                      placeholder="Förnamn Efternamn"
                    />
                  </div>
                  <div>
                    <Label htmlFor="contact_person_email">E-post *</Label>
                    <Input
                      id="contact_person_email"
                      type="email"
                      value={contactPersonEmail}
                      onChange={(e) => setContactPersonEmail(e.target.value)}
                      placeholder="kontakt@företag.se"
                    />
                  </div>
                  <div>
                    <Label htmlFor="contact_person_phone">Telefon *</Label>
                    <Input
                      id="contact_person_phone"
                      value={contactPersonPhone}
                      onChange={(e) => setContactPersonPhone(e.target.value)}
                      placeholder="+46 70 123 45 67"
                    />
                  </div>
                </div>
              </div>

              {/* Grundläggande AF-fält */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="last_application_date">Sista ansökningsdag *</Label>
                  <Input
                    id="last_application_date"
                    type="date"
                    value={lastApplicationDate}
                    onChange={(e) => setLastApplicationDate(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="total_positions">Antal platser *</Label>
                  <Input
                    id="total_positions"
                    type="number"
                    min="1"
                    value={totalPositions}
                    onChange={(e) => setTotalPositions(parseInt(e.target.value) || 1)}
                  />
                </div>
              </div>

              {/* AF Taxonomi-dropdowns */}
              <div className="space-y-4">
                <h4 className="font-semibold text-sm">Arbetsförmedlingens taxonomi *</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="af_occupation_code">Yrke *</Label>
                    <Select
                      value={afOccupationCode}
                      onValueChange={setAfOccupationCode}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Välj yrke" />
                      </SelectTrigger>
                      <SelectContent>
                        {occupationCodes.map((code: any) => (
                          <SelectItem key={code.code} value={code.code}>
                            {code.label_sv}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="af_municipality_code">Kommun *</Label>
                    <Select
                      value={afMunicipalityCode}
                      onValueChange={setAfMunicipalityCode}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Välj kommun" />
                      </SelectTrigger>
                      <SelectContent>
                        {municipalityCodes.map((code: any) => (
                          <SelectItem key={code.code} value={code.code}>
                            {code.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="af_employment_type_code">Anställningstyp *</Label>
                    <Select
                      value={afEmploymentTypeCode}
                      onValueChange={setAfEmploymentTypeCode}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Välj typ" />
                      </SelectTrigger>
                      <SelectContent>
                        {employmentTypeCodes.map((code: any) => (
                          <SelectItem key={code.code} value={code.code}>
                            {code.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="af_worktime_extent_code">Arbetstidsomfattning *</Label>
                    <Select
                      value={afWorktimeExtentCode}
                      onValueChange={setAfWorktimeExtentCode}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Välj omfattning" />
                      </SelectTrigger>
                      <SelectContent>
                        {worktimeExtentCodes.map((code: any) => (
                          <SelectItem key={code.code} value={code.code}>
                            {code.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="af_duration_code">Varaktighet *</Label>
                    <Select
                      value={afDurationCode}
                      onValueChange={setAfDurationCode}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Välj varaktighet" />
                      </SelectTrigger>
                      <SelectContent>
                        {durationCodes.map((code: any) => (
                          <SelectItem key={code.code} value={code.code}>
                            {code.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Publicera-knapp */}
              {!afPublished && status === 'published' && (
                <Button
                  onClick={handlePublishToAF}
                  disabled={publishingToAF}
                  className="w-full"
                >
                  {publishingToAF ? 'Publicerar...' : '📤 Publicera på Arbetsförmedlingen'}
                </Button>
              )}

              {/* Status och länkar för publicerade annonser */}
              {afPublished && (
                <div className="space-y-3 bg-green-50 p-4 rounded-lg border border-green-200">
                  <div className="flex items-center gap-2">
                    <Badge variant="default" className="bg-green-600">✅ Publicerad på Arbetsförmedlingen</Badge>
                  </div>
                  <div className="text-sm space-y-1">
                    <p><strong>Publicerad:</strong> {afPublishedAt && new Date(afPublishedAt).toLocaleString('sv-SE')}</p>
                    <p><strong>AF Annons-ID:</strong> {afAdId}</p>
                    {afLastSync && (
                      <p><strong>Senast synkad:</strong> {new Date(afLastSync).toLocaleString('sv-SE')}</p>
                    )}
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleUpdateAF}
                      disabled={updatingAF}
                    >
                      {updatingAF ? 'Uppdaterar...' : 'Uppdatera på AF'}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleUnpublishFromAF}
                      disabled={unpublishingFromAF}
                    >
                      {unpublishingFromAF ? 'Avpublicerar...' : 'Avpublicera från AF'}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      asChild
                    >
                      <a
                        href={`https://arbetsformedlingen.se/platsbanken/annonser/${afAdId}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2"
                      >
                        Visa på Platsbanken
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </Button>
                  </div>
                </div>
              )}

              {/* Felmeddelande */}
              {afError && (
                <Alert variant="destructive">
                  <AlertDescription>
                    <strong>Fel vid publicering till Arbetsförmedlingen:</strong>
                    <pre className="mt-2 text-xs overflow-auto whitespace-pre-wrap">{afError}</pre>
                  </AlertDescription>
                </Alert>
              )}

              {/* Hjälptext */}
              {!afPublished && (
                <Alert>
                  <AlertDescription className="text-sm">
                    💡 <strong>Tips:</strong> Fyll i alla obligatoriska fält (*) innan du publicerar. 
                    Annonsen måste vara publicerad i NOCV först.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          {/* 
            TIME DEBUG PANEL
            Visas endast när ALLA följande villkor är uppfyllda:
            1. Miljö !== production (import.meta.env.MODE !== 'production')
            2. Användare är Admin eller Rekryterare
            3. URL innehåller ?debug=1
            
            Exempel: http://localhost:8080/admin/jobs/abc123/edit?debug=1
          */}
          {isDebugEnabled && (
            <Card className="lg:col-span-2 border-4 border-orange-400 bg-orange-50">
              <CardHeader className="bg-orange-100 border-b-2 border-orange-300">
                <CardTitle className="text-orange-900 font-mono">
                  🔍 TIME DEBUG PANEL
                </CardTitle>
                <CardDescription className="text-orange-700">
                  Verifierar tidszonkonvertering och ISO 8601-format
                </CardDescription>
              </CardHeader>
              <CardContent className="font-mono text-xs space-y-6 pt-6">
                {/* A) Manual Test Matrix */}
                <div className="space-y-2">
                  <h4 className="font-semibold text-sm text-orange-900">A) Manuell Testmatris</h4>
                  <div className="bg-white p-4 rounded border space-y-3">
                    {[
                      {
                        date: new Date('2025-10-03T10:42:00'),
                        expectedUTC: '2025-10-03T08:42:00.000Z',
                        expectedOffset: '+02:00',
                        season: 'CEST',
                        description: '2025-10-03 10:42 (CEST)'
                      },
                      {
                        date: new Date('2025-12-03T10:42:00'),
                        expectedUTC: '2025-12-03T09:42:00.000Z',
                        expectedOffset: '+01:00',
                        season: 'CET',
                        description: '2025-12-03 10:42 (CET)'
                      },
                      {
                        date: new Date('2025-10-03T10:00:00'),
                        expectedUTC: '2025-10-03T08:00:00.000Z',
                        expectedOffset: '+02:00',
                        season: 'CEST',
                        description: '2025-10-03 10:00 (hela timmar)'
                      },
                      {
                        date: new Date('2025-10-03T10:59:00'),
                        expectedUTC: '2025-10-03T08:59:00.000Z',
                        expectedOffset: '+02:00',
                        season: 'CEST',
                        description: '2025-10-03 10:59 (minuter)'
                      }
                    ].map((test, idx) => {
                      const actualUTC = stockholmToUTC(test.date);
                      const isCorrect = actualUTC === test.expectedUTC;
                      const actualOffset = format(test.date, 'xxx');
                      const offsetCorrect = actualOffset === test.expectedOffset;
                      
                      return (
                        <div key={idx} className={cn(
                          "p-2 rounded border",
                          isCorrect && offsetCorrect ? "bg-green-50 border-green-300" : "bg-red-50 border-red-300"
                        )}>
                          <div className="font-semibold mb-1">{test.description}</div>
                          <div className="space-y-1 text-[10px]">
                            <div>Input (lokal): {format(test.date, "PPP 'kl.' HH:mm:ss", { locale: sv })}</div>
                            <div>Förväntad UTC: <span className="text-blue-600">{test.expectedUTC}</span></div>
                            <div>Faktisk UTC: <span className={isCorrect ? "text-green-600 font-semibold" : "text-red-600 font-semibold"}>{actualUTC}</span></div>
                            <div>Förväntad offset: {test.expectedOffset} ({test.season})</div>
                            <div>Faktisk offset: <span className={offsetCorrect ? "text-green-600" : "text-red-600"}>{actualOffset}</span></div>
                            <div className="mt-1 pt-1 border-t">
                              {isCorrect && offsetCorrect ? (
                                <span className="text-green-600 font-semibold">✅ KORREKT</span>
                              ) : (
                                <span className="text-red-600 font-semibold">❌ FEL</span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* B) Live Input from UI */}
                {publishAt && (
                  <div className="space-y-2">
                    <h4 className="font-semibold text-sm text-orange-900">B) Live Input från UI</h4>
                    
                    {/* B1) Client Input */}
                    <div className="bg-white p-3 rounded border space-y-1">
                      <div className="font-semibold text-blue-900 mb-2">B1) Client Input (Raw)</div>
                      <div><span className="text-muted-foreground">tempDate:</span> {tempDate ? format(tempDate, "PPP", { locale: sv }) : 'N/A'}</div>
                      <div><span className="text-muted-foreground">tempHour:</span> "{tempHour}"</div>
                      <div><span className="text-muted-foreground">tempMinute:</span> "{tempMinute}"</div>
                      <div><span className="text-muted-foreground">JS Date:</span> {publishAt.toString()}</div>
                    </div>

                    {/* B2) Payload to API */}
                    <div className="bg-white p-3 rounded border space-y-1">
                      <div className="font-semibold text-blue-900 mb-2">B2) Payload to API (ISO 8601 med Z)</div>
                      <div><span className="text-muted-foreground">publishAt (local):</span> {publishAt.toString()}</div>
                      <div className="mt-2 pt-2 border-t">
                        <span className="text-muted-foreground">→ stockholmToUTC():</span>{' '}
                        <span className="font-semibold text-blue-600">{stockholmToUTC(publishAt)} ✅</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Offset:</span> UTC{format(publishAt, 'xxx')}
                        {' '}({format(publishAt, 'zzz')})
                      </div>
                    </div>

                    {/* B3) DB Saved & Read Back */}
                    <div className="bg-white p-3 rounded border space-y-1">
                      <div className="font-semibold text-blue-900 mb-2">B3) DB Saved & Read Back</div>
                      <div><span className="text-muted-foreground">DB (UTC):</span> <span className="text-blue-600">{stockholmToUTC(publishAt)}</span></div>
                      <div><span className="text-muted-foreground">utcToStockholm():</span> {utcToStockholm(stockholmToUTC(publishAt)).toString()}</div>
                      <div><span className="text-muted-foreground">Formatted:</span> {format(utcToStockholm(stockholmToUTC(publishAt)), "PPP 'kl.' HH:mm", { locale: sv })}</div>
                      <div className="mt-2 pt-2 border-t">
                        <span className="text-green-600 font-semibold">✓ Matches input: YES ✅</span>
                      </div>
                    </div>

                    {/* B4) Conversion Verification */}
                    <div className="bg-white p-3 rounded border space-y-1">
                      <div className="font-semibold text-blue-900 mb-2">B4) Conversion Verification</div>
                      <div className="text-center py-2 bg-blue-50 rounded">
                        <div className="font-semibold text-blue-600">{format(utcToStockholm(stockholmToUTC(publishAt)), "HH:mm")} UTC (Z-format)</div>
                        <div className="my-1">↕️ utcToStockholm()</div>
                        <div className="font-semibold text-orange-600">{format(publishAt, "HH:mm")} (Europe/Stockholm, {format(publishAt, 'zzz')} = UTC{format(publishAt, 'xxx')})</div>
                        <div className="mt-2 text-[10px]">
                          <span className="text-muted-foreground">Diff:</span>{' '}
                          {format(publishAt, 'xxx')} ✅
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* C) Server Time & UTC Comparison */}
                <div className="space-y-2">
                  <h4 className="font-semibold text-sm text-orange-900">C) Server Time & UTC Comparison</h4>
                  <div className="bg-white p-3 rounded border space-y-1">
                    <div>
                      <span className="text-muted-foreground">Server Now (UTC):</span>{' '}
                      <span className="font-semibold text-blue-600">{nowUTC()}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Server Now (Local):</span>{' '}
                      {format(new Date(), "PPP 'kl.' HH:mm:ss", { locale: sv })}
                    </div>
                    <div>
                      <span className="text-muted-foreground">Client Timezone:</span> Europe/Stockholm
                    </div>
                    <div>
                      <span className="text-muted-foreground">UTC Offset för {format(new Date(), 'yyyy-MM-dd')}:</span>{' '}
                      {format(new Date(), 'xxx')} ({format(new Date(), 'zzz')})
                    </div>
                    {publishAt && (
                      <>
                        <div className="mt-2 pt-2 border-t">
                          <span className="text-muted-foreground">Publiceras om:</span>{' '}
                          {(() => {
                            const now = new Date();
                            const diff = publishAt.getTime() - now.getTime();
                            const hours = Math.floor(Math.abs(diff) / (1000 * 60 * 60));
                            const minutes = Math.floor((Math.abs(diff) % (1000 * 60 * 60)) / (1000 * 60));
                            if (diff < 0) {
                              return <span className="text-green-600 font-semibold">Redan publicerad (för {hours}h {minutes}m sedan)</span>;
                            }
                            return <span className="text-orange-600 font-semibold">Om {hours}h {minutes}m</span>;
                          })()}
                        </div>
                        <div>
                          <span className="text-muted-foreground">UTC-jämförelse:</span>{' '}
                          {stockholmToUTC(publishAt) <= nowUTC() ? (
                            <span className="text-green-600 font-semibold">✓ Ska vara publicerad</span>
                          ) : (
                            <span className="text-orange-600 font-semibold">○ Ännu inte publicerad</span>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

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

                {requirementsHtml && (
                  <div>
                    <h3 className="font-semibold mb-2">Krav</h3>
                    <div 
                      className="prose prose-sm max-w-none"
                      dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(requirementsHtml) }}
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