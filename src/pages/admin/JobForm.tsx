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
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { ArrowLeft, Eye } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface Company {
  id: string;
  name: string;
}

export default function JobForm() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [companies, setCompanies] = useState<Company[]>([]);
  
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
  const [publishAt, setPublishAt] = useState('');

  // Fetch companies
  useEffect(() => {
    fetchCompanies();
  }, []);

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

  // Auto-generate slug from title
  useEffect(() => {
    if (title) {
      const generatedSlug = title
        .toLowerCase()
        .replace(/[åä]/g, 'a')
        .replace(/ö/g, 'o')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
      setSlug(generatedSlug);
    }
  }, [title]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
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
    if (!descriptionMd.trim()) {
      toast.error('Beskrivning är obligatoriskt');
      return;
    }
    if (!companyId) {
      toast.error('Företag är obligatoriskt');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('jobs')
        .insert({
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
          status: 'draft',
          slug: slug,
          publish_at: publishAt || null,
          created_by: user!.id,
        });

      if (error) throw error;

      toast.success('Jobb skapat!');
      navigate('/admin/jobs');
    } catch (error: any) {
      console.error('Error creating job:', error);
      toast.error(error.message || 'Kunde inte skapa jobb');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/admin/jobs')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Nytt jobb</h1>
            <p className="text-muted-foreground">Skapa en ny jobbannons</p>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Form */}
          <Card>
            <CardHeader>
              <CardTitle>Jobbinformation</CardTitle>
              <CardDescription>Fyll i information om jobbet</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
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
                  <Label htmlFor="slug">Slug (genereras automatiskt)</Label>
                  <Input
                    id="slug"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    placeholder="slug-genereras-automatiskt"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="publishAt">Publiceringsdatum</Label>
                  <Input
                    id="publishAt"
                    type="datetime-local"
                    value={publishAt}
                    onChange={(e) => setPublishAt(e.target.value)}
                  />
                </div>

                <div className="flex gap-2">
                  <Button type="submit" disabled={loading}>
                    {loading ? 'Sparar...' : 'Spara som utkast'}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => navigate('/admin/jobs')}
                  >
                    Avbryt
                  </Button>
                </div>
              </form>
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