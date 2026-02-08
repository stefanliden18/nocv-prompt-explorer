import React, { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RichTextEditor } from '@/components/RichTextEditor';
import DOMPurify from 'dompurify';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { ArrowLeft, Eye } from 'lucide-react';
import { RequirementProfileForm } from '@/components/RequirementProfileForm';
import type { RequirementProfile } from '@/types/requirementTemplate';

interface Company {
  id: string;
  name: string;
}

// Helper function to generate unique slug for demo jobs
const generateDemoSlug = (baseSlug: string) => {
  const timestamp = Date.now();
  return `${baseSlug}-demo-${timestamp}`;
};

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
  const [descriptionHtml, setDescriptionHtml] = useState('');
  const [requirementsHtml, setRequirementsHtml] = useState('');
  const [driverLicense, setDriverLicense] = useState(false);
  const [language, setLanguage] = useState('');
  const [slug, setSlug] = useState('');
  const [requirementProfile, setRequirementProfile] = useState<RequirementProfile | null>(null);

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

  const handleSubmit = async (e: React.FormEvent, targetStatus: 'draft' | 'demo' = 'draft') => {
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
      // Generate unique slug for demo jobs
      const finalSlug = targetStatus === 'demo' 
        ? generateDemoSlug(slug)
        : slug;

      const { data: insertedJob, error } = await supabase
        .from('jobs')
        .insert({
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
          status: targetStatus,
          slug: finalSlug,
          publish_at: null,
          created_by: user!.id,
          requirement_profile: requirementProfile as any,
        } as any)
        .select()
        .single();

      if (error) throw error;

      if (targetStatus === 'demo' && insertedJob) {
        const demoUrl = `${window.location.origin}/demo/${insertedJob.slug}`;
        
        // Copy link automatically to clipboard
        navigator.clipboard.writeText(demoUrl);
        
        toast.success('Demo-jobb skapat!', {
          description: (
            <div className="space-y-2">
              <p>Jobbet är nu tillgängligt som demo</p>
              <code className="block p-2 bg-muted rounded text-xs break-all">
                {demoUrl}
              </code>
              <p className="text-xs text-muted-foreground">Länk kopierad till urklipp</p>
            </div>
          ),
          duration: 15000,
          action: {
            label: 'Öppna demo-jobb',
            onClick: () => window.open(demoUrl, '_blank')
          }
        });
        
        // Navigate to demo jobs list after 2 seconds
        setTimeout(() => {
          navigate('/admin/demo-jobs');
        }, 2000);
      } else {
        toast.success('Jobb skapat!');
      }
      
      // For non-demo jobs, navigate immediately
      if (targetStatus !== 'demo') {
        navigate('/admin/jobs');
      }
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
                  <Label htmlFor="description">Beskrivning *</Label>
                  <RichTextEditor
                    content={descriptionHtml}
                    onChange={setDescriptionHtml}
                    placeholder="Beskriv jobbet..."
                    minHeight="200px"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="requirements">Krav</Label>
                  <RichTextEditor
                    content={requirementsHtml}
                    onChange={setRequirementsHtml}
                    placeholder="Lista krav för jobbet..."
                    minHeight="150px"
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
                  <p className="text-xs text-muted-foreground">
                    ℹ️ Demo-jobb får automatiskt ett unikt suffix (t.ex. -demo-1736780123456)
                  </p>
                </div>

                <Separator />

                {/* Requirement Profile Form */}
                <RequirementProfileForm 
                  value={requirementProfile}
                  onChange={setRequirementProfile}
                />

                <Separator />

                <div className="flex gap-2 flex-wrap">
                  <Button 
                    type="button"
                    onClick={(e) => {
                      const form = e.currentTarget.closest('form');
                      if (form) {
                        const formEvent = new Event('submit', { bubbles: true, cancelable: true });
                        Object.defineProperty(formEvent, 'target', { value: form, enumerable: true });
                        handleSubmit(formEvent as any, 'draft');
                      }
                    }}
                    disabled={loading}
                  >
                    {loading ? 'Sparar...' : 'Spara som utkast'}
                  </Button>
                  <Button 
                    type="button"
                    variant="default"
                    onClick={(e) => {
                      const form = e.currentTarget.closest('form');
                      if (form) {
                        const formEvent = new Event('submit', { bubbles: true, cancelable: true });
                        Object.defineProperty(formEvent, 'target', { value: form, enumerable: true });
                        handleSubmit(formEvent as any, 'demo');
                      }
                    }}
                    disabled={loading}
                    className="bg-accent hover:bg-accent/90 text-accent-foreground font-bold"
                  >
                    🎬 Spara som demo-jobb
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
