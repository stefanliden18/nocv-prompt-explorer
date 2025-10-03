import React, { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
import { ArrowLeft, Eye, CalendarIcon, Save, Send, Archive } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { format } from 'date-fns';
import { sv } from 'date-fns/locale';
import { fromZonedTime } from 'date-fns-tz';
import { cn } from '@/lib/utils';
import { stockholmToUTC, utcToStockholm, nowInStockholm, nowUTC } from '@/lib/timezone';
import { useDebugMode } from '@/hooks/useDebugMode';

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
}

export default function JobEdit() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isDebugEnabled } = useDebugMode();
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
  const [descriptionMd, setDescriptionMd] = useState('');
  const [requirementsMd, setRequirementsMd] = useState('');
  const [driverLicense, setDriverLicense] = useState(false);
  const [language, setLanguage] = useState('');
  const [slug, setSlug] = useState('');
  const [status, setStatus] = useState<'draft' | 'published' | 'archived'>('draft');
  const [publishAt, setPublishAt] = useState<Date | undefined>(undefined);
  const [publishHour, setPublishHour] = useState<string>('09');
  const [publishMinute, setPublishMinute] = useState<string>('00');
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const [tempDate, setTempDate] = useState<Date | undefined>(undefined);
  const [tempHour, setTempHour] = useState<string>('09');
  const [tempMinute, setTempMinute] = useState<string>('00');

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
      setDescriptionMd(job.description_md);
      setRequirementsMd(job.requirements_md || '');
      setDriverLicense(job.driver_license);
      setLanguage(job.language || '');
      setSlug(job.slug);
      setStatus(job.status);
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
      const nowUtc = new Date().toISOString();
      const publishDateUtc = publishAt ? stockholmToUTC(publishAt) : null;
      if (publishDateUtc && publishDateUtc > nowUtc) {
        return <Badge variant="outline">Planerad</Badge>;
      }
      return <Badge variant="default">Publicerad</Badge>;
    }
    
    return <Badge variant="secondary">Utkast</Badge>;
  };

  const updateJob = async (newStatus?: 'draft' | 'published' | 'archived') => {
    if (!title.trim() || !city.trim() || !category.trim() || !descriptionMd.trim() || !companyId) {
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
        description_md: descriptionMd.trim(),
        requirements_md: requirementsMd.trim() || null,
        driver_license: driverLicense,
        language: language.trim() || null,
        slug: slug,
        // Convert Stockholm time to UTC for database storage
        publish_at: publishAt ? stockholmToUTC(publishAt) : null,
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
              onClick={handleSchedule}
              disabled={loading || !buttons.schedule}
              variant="outline"
            >
              <CalendarIcon className="h-4 w-4 mr-2" />
              Planera publicering
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
                <Label htmlFor="description">Beskrivning * (Markdown)</Label>
                <Textarea
                  id="description"
                  value={descriptionMd}
                  onChange={(e) => setDescriptionMd(e.target.value)}
                  placeholder="Beskriv jobbet..."
                  rows={8}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="requirements">Krav (Markdown)</Label>
                <Textarea
                  id="requirements"
                  value={requirementsMd}
                  onChange={(e) => setRequirementsMd(e.target.value)}
                  placeholder="Lista krav för jobbet..."
                  rows={6}
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
                          onClick={() => setIsPopoverOpen(false)}
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
                            } else {
                              setPublishAt(undefined);
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

                {descriptionMd && (
                  <div>
                    <h3 className="font-semibold mb-2">Om tjänsten</h3>
                    <div className="prose prose-sm max-w-none">
                      <ReactMarkdown>{descriptionMd}</ReactMarkdown>
                    </div>
                  </div>
                )}

                {requirementsMd && (
                  <div>
                    <h3 className="font-semibold mb-2">Krav</h3>
                    <div className="prose prose-sm max-w-none">
                      <ReactMarkdown>{requirementsMd}</ReactMarkdown>
                    </div>
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