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
import { cn } from '@/lib/utils';

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
      setPublishAt(job.publish_at ? new Date(job.publish_at) : undefined);
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
      if (publishAt && publishAt > new Date()) {
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
        publish_at: publishAt ? publishAt.toISOString() : null,
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
  const handlePublish = () => updateJob('published');
  const handleArchive = () => updateJob('archived');

  const handlePreview = () => {
    if (id) {
      window.open(`/admin/jobs/${id}/preview`, '_blank');
    }
  };

  const handleSchedule = () => {
    const date = window.prompt('Ange datum och tid för publicering (YYYY-MM-DD HH:MM):');
    if (date) {
      try {
        const selectedDate = new Date(date);
        setPublishAt(selectedDate);
        toast.success('Publiceringsdatum satt');
      } catch (error) {
        toast.error('Ogiltigt datum');
      }
    }
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
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !publishAt && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {publishAt ? format(publishAt, "PPP", { locale: sv }) : "Välj datum"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={publishAt}
                      onSelect={setPublishAt}
                      initialFocus
                      className="pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
                <p className="text-xs text-muted-foreground">
                  {publishAt && publishAt > new Date() && (
                    "Jobbet kommer att publiceras automatiskt vid detta datum"
                  )}
                </p>
              </div>
            </CardContent>
          </Card>

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