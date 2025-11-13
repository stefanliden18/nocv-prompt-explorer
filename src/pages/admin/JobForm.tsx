import React, { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RichTextEditor } from '@/components/RichTextEditor';
import DOMPurify from 'dompurify';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { ArrowLeft, Eye } from 'lucide-react';
import { useAFTaxonomy } from '@/hooks/useAFTaxonomy';

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
  const { data: occupationCodes = [] } = useAFTaxonomy('occupation-name');
  const { data: municipalityCodes = [] } = useAFTaxonomy('municipality');
  const { data: employmentTypeCodes = [] } = useAFTaxonomy('employment-type');
  const { data: durationCodes = [] } = useAFTaxonomy('employment-duration');
  const { data: worktimeExtentCodes = [] } = useAFTaxonomy('worktime-extent');
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
  
  // AF fields
  const [lastApplicationDate, setLastApplicationDate] = useState('');
  const [totalPositions, setTotalPositions] = useState(1);
  const [contactPersonName, setContactPersonName] = useState('');
  const [contactPersonEmail, setContactPersonEmail] = useState('');
  const [contactPersonPhone, setContactPersonPhone] = useState('');
  const [afOccupationCid, setAfOccupationCid] = useState('');
  const [afMunicipalityCid, setAfMunicipalityCid] = useState('');
  const [afEmploymentTypeCid, setAfEmploymentTypeCid] = useState('');
  const [afDurationCid, setAfDurationCid] = useState('');
  const [afWorktimeExtentCid, setAfWorktimeExtentCid] = useState('');

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

  // Auto-sätt "Heltid" för Vanlig anställning om worktimeExtent saknas
  useEffect(() => {
    if (afEmploymentTypeCid === 'PFZr_Syz_cUq' && !afWorktimeExtentCid) {
      const heltid = worktimeExtentCodes.find(w => w.concept_id === '6YE1_gAC_R2G');
      if (heltid) {
        setAfWorktimeExtentCid(heltid.concept_id);
        toast.info('Arbetstidsomfattning automatiskt satt till "Heltid" (kan ändras)');
      }
    }
  }, [afEmploymentTypeCid, worktimeExtentCodes]);

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

    // AF-fält är helt valfria - ingen validering vid sparande
    // Validering sker endast när man aktivt publicerar till AF

    setLoading(true);
    try {
      // Auto-set worktime extent if employment type requires it
      let finalAfWorktimeExtentCid = afWorktimeExtentCid;
      if (afEmploymentTypeCid === 'PFZr_Syz_cUq' && !afWorktimeExtentCid) {
        finalAfWorktimeExtentCid = worktimeExtentCodes.find(w => w.label === 'Heltid')?.concept_id || null;
        if (finalAfWorktimeExtentCid) {
          toast.info("Arbetstidsomfattning sattes automatiskt till 'Heltid' för vanlig anställning");
        }
      }

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
          // AF fields - use concept_ids
          last_application_date: lastApplicationDate || null,
          total_positions: totalPositions,
          contact_person_name: contactPersonName.trim() || null,
          contact_person_email: contactPersonEmail.trim() || null,
          contact_person_phone: contactPersonPhone.trim() || null,
          af_occupation_cid: afOccupationCid || null,
          af_municipality_cid: afMunicipalityCid || null,
          af_employment_type_cid: afEmploymentTypeCid || null,
          af_duration_cid: afDurationCid || null,
          af_worktime_extent_cid: finalAfWorktimeExtentCid || null,
        })
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
                    className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold"
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

          {/* AF Fields Card */}
          <Card>
            <CardHeader>
              <CardTitle>Arbetsförmedlingen (valfritt)</CardTitle>
              <CardDescription>
                Fyll endast i dessa fält om du planerar att publicera jobbet på Arbetsförmedlingen. 
                Alla fält är valfria för vanliga jobb och demo-jobb.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Kontaktperson */}
                <div className="space-y-4">
                  <h4 className="font-semibold text-sm">Kontaktperson</h4>
                  <div>
                    <Label htmlFor="contact_person_name">Namn</Label>
                    <Input
                      id="contact_person_name"
                      value={contactPersonName}
                      onChange={(e) => setContactPersonName(e.target.value)}
                      placeholder="Anna Andersson"
                    />
                  </div>
                  <div>
                    <Label htmlFor="contact_person_email">E-post</Label>
                    <Input
                      id="contact_person_email"
                      type="email"
                      value={contactPersonEmail}
                      onChange={(e) => setContactPersonEmail(e.target.value)}
                      placeholder="anna@foretag.se"
                    />
                  </div>
                  <div>
                    <Label htmlFor="contact_person_phone">Telefon</Label>
                    <Input
                      id="contact_person_phone"
                      type="tel"
                      value={contactPersonPhone}
                      onChange={(e) => setContactPersonPhone(e.target.value)}
                      placeholder="070-123 45 67"
                    />
                  </div>
                </div>

                <Separator />

                {/* Datum och antal platser */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="last_application_date">Sista ansökningsdag</Label>
                    <Input
                      id="last_application_date"
                      type="date"
                      value={lastApplicationDate}
                      onChange={(e) => setLastApplicationDate(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="total_positions">Antal platser</Label>
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
                  <h4 className="font-semibold text-sm">Arbetsförmedlingens taxonomi</h4>
                  
                  <Alert className="mb-4">
                    <AlertDescription className="text-sm">
                      <strong>Anställningstyper och varaktighet:</strong>
                      <ul className="list-disc list-inside mt-2 space-y-1">
                        <li><strong>Vanlig anställning:</strong> Tillsvidareanställning (varaktighet anges inte)</li>
                        <li><strong>Vikariat, Sommarjobb, etc:</strong> Tidsbegränsad (varaktighet MÅSTE anges)</li>
                        <li><strong>Behovsanställning:</strong> Särskilda regler (ej arbetstidsomfattning)</li>
                      </ul>
                    </AlertDescription>
                  </Alert>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="af_occupation_cid">Yrke (endast vid AF-publicering)</Label>
                    <SearchableSelect
                      value={afOccupationCid}
                      onValueChange={setAfOccupationCid}
                      options={occupationCodes}
                      placeholder="Välj yrke"
                      searchPlaceholder="Sök yrke..."
                      emptyText="Inget yrke hittades"
                    />
                  </div>

                  <div>
                    <Label htmlFor="af_municipality_cid">Kommun (endast vid AF-publicering)</Label>
                    <SearchableSelect
                      value={afMunicipalityCid}
                      onValueChange={setAfMunicipalityCid}
                      options={municipalityCodes}
                      placeholder="Välj kommun"
                      searchPlaceholder="Sök kommun..."
                      emptyText="Ingen kommun hittades"
                    />
                  </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="af_employment_type_cid">Anställningstyp (endast vid AF-publicering)</Label>
                    <SearchableSelect
                      value={afEmploymentTypeCid}
                      onValueChange={(value) => {
                        setAfEmploymentTypeCid(value);
                        // Auto-clear duration om vanlig anställning väljs
                        if (value === 'PFZr_Syz_cUq' && afDurationCid) {
                          setAfDurationCid('');
                          toast.info("Varaktighet automatiskt borttagen: Vanlig anställning är redan tillsvidareanställning");
                        }
                        // Auto-clear worktimeExtent om behovsanställning väljs
                        if (value === '1paU_aCR_nGn' && afWorktimeExtentCid) {
                          setAfWorktimeExtentCid('');
                          toast.info("Arbetstidsomfattning automatiskt borttagen: Inte tillåtet för behovsanställning");
                        }
                      }}
                      options={employmentTypeCodes}
                      placeholder="Välj typ"
                      searchPlaceholder="Sök anställningstyp..."
                      emptyText="Ingen anställningstyp hittades"
                    />
                  </div>

                  {afEmploymentTypeCid !== '1paU_aCR_nGn' && (
                    <div>
                      <Label htmlFor="af_worktime_extent_cid">
                        Arbetstidsomfattning {afEmploymentTypeCid === 'PFZr_Syz_cUq' ? '*' : ''}
                      </Label>
                      <SearchableSelect
                        value={afWorktimeExtentCid}
                        onValueChange={setAfWorktimeExtentCid}
                        options={worktimeExtentCodes}
                        placeholder="Välj omfattning"
                        searchPlaceholder="Sök omfattning..."
                        emptyText="Ingen omfattning hittades"
                      />
                      {afEmploymentTypeCid === 'PFZr_Syz_cUq' && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Obligatoriskt för vanlig anställning
                        </p>
                      )}
                    </div>
                  )}
                  {afEmploymentTypeCid === '1paU_aCR_nGn' && (
                    <div className="text-sm text-muted-foreground bg-blue-50 p-3 rounded">
                      ℹ️ Arbetstidsomfattning anges inte för behovsanställning
                    </div>
                  )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="af_duration_cid">Varaktighet (endast vid AF-publicering)</Label>
                    <SearchableSelect
                      value={afDurationCid}
                      onValueChange={setAfDurationCid}
                      options={durationCodes}
                      placeholder="Välj varaktighet"
                      searchPlaceholder="Sök varaktighet..."
                      emptyText="Ingen varaktighet hittades"
                    />
                    {afEmploymentTypeCid === 'PFZr_Syz_cUq' ? (
                      <p className="text-xs text-blue-600 mt-1">
                        ℹ️ Vanlig anställning är automatiskt tillsvidareanställning
                      </p>
                    ) : (
                      <p className="text-xs text-muted-foreground mt-1">
                        Varaktighet anges för tidsbegränsade anställningar
                      </p>
                    )}
                  </div>
                  </div>
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