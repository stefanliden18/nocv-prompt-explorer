import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { GripVertical, Plus, X, Printer, Save, ClipboardList, Link2, Sparkles, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import type { 
  RequirementTemplate, 
  TemplateData, 
  TemplateField, 
  RequirementProfile,
  RequirementLevel,
  CheckboxWithLevelValue
} from "@/types/requirementTemplate";

interface JobWithCompany {
  id: string;
  title: string;
  city: string | null;
  status: string;
  companies: { name: string } | null;
}

interface CustomerInfo {
  companyName: string;
  contactPerson: string;
  desiredStartDate: string;
  salaryRange: string;
}

interface InterviewData {
  customerInfo: CustomerInfo;
  profile: RequirementProfile | null;
  templateId: string | null;
}

const STORAGE_KEY = 'nocv-interview-draft';

export function CustomerInterviewForm() {
  const navigate = useNavigate();
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo>({
    companyName: '',
    contactPerson: '',
    desiredStartDate: '',
    salaryRange: ''
  });
  const [profileValues, setProfileValues] = useState<RequirementProfile['values']>({});
  const [sectionNotes, setSectionNotes] = useState<Record<string, string>>({});
  
  // Job linking state
  const [linkMode, setLinkMode] = useState<'existing' | 'new' | null>(null);
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isLinking, setIsLinking] = useState(false);

  // Query for existing jobs (exclude demo jobs)
  const { data: jobs } = useQuery({
    queryKey: ['jobs-for-linking'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('jobs')
        .select('id, title, city, status, companies(name)')
        .in('status', ['draft', 'published'])
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return (data || []) as JobWithCompany[];
    }
  });

  const { data: templates, isLoading } = useQuery({
    queryKey: ['requirement-templates-active'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('requirement_templates')
        .select('*')
        .eq('is_active', true)
        .order('display_name');
      
      if (error) throw error;
      
      return (data || []).map(t => ({
        ...t,
        template_data: t.template_data as unknown as TemplateData
      })) as RequirementTemplate[];
    }
  });

  const selectedTemplate = templates?.find(t => t.id === selectedTemplateId);

  // Load draft from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const data: InterviewData = JSON.parse(saved);
        setCustomerInfo(data.customerInfo);
        if (data.templateId) {
          setSelectedTemplateId(data.templateId);
        }
        if (data.profile?.values) {
          setProfileValues(data.profile.values);
        }
        if (data.profile?.section_notes) {
          setSectionNotes(data.profile.section_notes);
        }
      } catch (e) {
        console.error('Error loading draft:', e);
      }
    }
  }, []);

  // Initialize profile values when template changes
  useEffect(() => {
    if (selectedTemplate) {
      const savedData = localStorage.getItem(STORAGE_KEY);
      let savedValues: RequirementProfile['values'] | null = null;
      let savedNotes: Record<string, string> | null = null;
      
      if (savedData) {
        try {
          const data: InterviewData = JSON.parse(savedData);
          if (data.templateId === selectedTemplateId && data.profile?.values) {
            savedValues = data.profile.values;
            savedNotes = data.profile.section_notes || null;
          }
        } catch (e) {
          console.error('Error parsing saved data:', e);
        }
      }

      if (savedValues) {
        setProfileValues(savedValues);
        setSectionNotes(savedNotes || {});
      } else {
        const initialValues: RequirementProfile['values'] = {};
        const initialNotes: Record<string, string> = {};
        selectedTemplate.template_data.sections.forEach(section => {
          initialValues[section.key] = {};
          initialNotes[section.key] = '';
          section.fields.forEach(field => {
            initialValues[section.key][field.key] = getDefaultValue(field);
          });
        });
        setProfileValues(initialValues);
        setSectionNotes(initialNotes);
      }
    }
  }, [selectedTemplateId, selectedTemplate]);

  const getDefaultValue = (field: TemplateField) => {
    switch (field.type) {
      case 'checkbox':
        return false;
      case 'checkbox_with_level':
        return { enabled: false, level: field.levels?.[0] || '' };
      case 'number':
        return null;
      case 'ranked_list':
        return [];
      case 'requirement_level':
        return 'not_relevant';
      default:
        return '';
    }
  };

  const updateFieldValue = (sectionKey: string, fieldKey: string, fieldValue: any) => {
    setProfileValues(prev => {
      const newValues = { ...prev };
      if (!newValues[sectionKey]) {
        newValues[sectionKey] = {};
      }
      newValues[sectionKey] = {
        ...newValues[sectionKey],
        [fieldKey]: fieldValue
      };
      return newValues;
    });
  };

  const getFieldValue = (sectionKey: string, fieldKey: string) => {
    return profileValues?.[sectionKey]?.[fieldKey];
  };

  const handleSaveDraft = () => {
    const data: InterviewData = {
      customerInfo,
      templateId: selectedTemplateId,
      profile: selectedTemplateId && selectedTemplate ? {
        template_id: selectedTemplateId,
        role_key: selectedTemplate.role_key,
        values: profileValues,
        section_notes: sectionNotes
      } : null
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    toast.success('Utkast sparat!');
  };

  const handleClearDraft = () => {
    localStorage.removeItem(STORAGE_KEY);
    setCustomerInfo({
      companyName: '',
      contactPerson: '',
      desiredStartDate: '',
      salaryRange: ''
    });
    setSelectedTemplateId(null);
    setProfileValues({});
    setSectionNotes({});
    toast.success('Utkast rensat');
  };

  const handlePrint = () => {
    window.print();
  };

  // Link requirement profile to an existing job
  const handleLinkToJob = async () => {
    if (!selectedJobId || !selectedTemplateId || !selectedTemplate) {
      toast.error('Välj både en tjänstetyp och ett jobb');
      return;
    }

    setIsLinking(true);
    try {
      const profile: RequirementProfile = {
        template_id: selectedTemplateId,
        role_key: selectedTemplate.role_key,
        values: profileValues,
        section_notes: sectionNotes
      };

      const { error } = await supabase
        .from('jobs')
        .update({ requirement_profile: profile as any })
        .eq('id', selectedJobId);

      if (error) throw error;

      toast.success('Kravprofil kopplad till jobbet!', {
        action: {
          label: 'Öppna jobb',
          onClick: () => navigate(`/admin/jobs/${selectedJobId}/edit`)
        }
      });
      
      // Reset linking state
      setLinkMode(null);
      setSelectedJobId(null);
    } catch (error: any) {
      console.error('Error linking profile to job:', error);
      toast.error('Kunde inte koppla kravprofilen: ' + error.message);
    } finally {
      setIsLinking(false);
    }
  };

  // Generate a new job ad using AI
  const handleGenerateAd = async () => {
    if (!selectedTemplateId || !selectedTemplate) {
      toast.error('Välj en tjänstetyp först');
      return;
    }

    setIsGenerating(true);
    try {
      const profile: RequirementProfile = {
        template_id: selectedTemplateId,
        role_key: selectedTemplate.role_key,
        values: profileValues,
        section_notes: sectionNotes
      };

      const { data, error } = await supabase.functions.invoke('generate-job-ad', {
        body: {
          requirement_profile: profile,
          customer_info: customerInfo,
          role_display_name: selectedTemplate.display_name.replace(' - Kravprofil', '')
        }
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);

      // Store AI-generated data and profile in sessionStorage
      sessionStorage.setItem('prefill-job-ad', JSON.stringify(data));
      sessionStorage.setItem('prefill-requirement-profile', JSON.stringify(profile));
      sessionStorage.setItem('prefill-customer-info', JSON.stringify(customerInfo));

      toast.success('Annons genererad! Navigerar till formuläret...');
      
      // Navigate to job form
      setTimeout(() => {
        window.location.href = '/admin/jobs/new';
      }, 500);
    } catch (error: any) {
      console.error('Error generating job ad:', error);
      toast.error('Kunde inte generera annons: ' + error.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const renderField = (sectionKey: string, field: TemplateField) => {
    const fieldValue = getFieldValue(sectionKey, field.key);

    switch (field.type) {
      case 'checkbox':
        return (
          <div className="flex items-center space-x-3 py-1.5">
            <Checkbox
              id={`${sectionKey}-${field.key}`}
              checked={fieldValue === true}
              onCheckedChange={(checked) => updateFieldValue(sectionKey, field.key, checked)}
              className="print:border-foreground"
            />
            <Label htmlFor={`${sectionKey}-${field.key}`} className="text-sm font-normal cursor-pointer">
              {field.label}
            </Label>
          </div>
        );

      case 'checkbox_with_level':
        const cbwlValue = fieldValue as CheckboxWithLevelValue | undefined;
        return (
          <div className="flex items-center gap-4 py-1.5 flex-wrap">
            <div className="flex items-center space-x-3">
              <Checkbox
                id={`${sectionKey}-${field.key}`}
                checked={cbwlValue?.enabled === true}
                onCheckedChange={(checked) => 
                  updateFieldValue(sectionKey, field.key, { 
                    enabled: checked, 
                    level: cbwlValue?.level || field.levels?.[0] || '' 
                  })
                }
                className="print:border-foreground"
              />
              <Label htmlFor={`${sectionKey}-${field.key}`} className="text-sm font-normal cursor-pointer min-w-[180px]">
                {field.label}
              </Label>
            </div>
            {cbwlValue?.enabled && field.levels && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Nivå:</span>
                <Select 
                  value={cbwlValue?.level || ''} 
                  onValueChange={(level) => updateFieldValue(sectionKey, field.key, { ...cbwlValue, level })}
                >
                  <SelectTrigger className="h-8 text-xs w-32 print:border-foreground">
                    <SelectValue placeholder="Välj nivå" />
                  </SelectTrigger>
                  <SelectContent>
                    {field.levels.map(level => (
                      <SelectItem key={level} value={level} className="text-xs">
                        {level}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        );

      case 'select':
        return (
          <div className="flex items-center gap-4 py-1.5">
            <Label htmlFor={`${sectionKey}-${field.key}`} className="text-sm min-w-[180px]">
              {field.label}
            </Label>
            <Select 
              value={fieldValue as string || ''} 
              onValueChange={(val) => updateFieldValue(sectionKey, field.key, val)}
            >
              <SelectTrigger className="h-9 max-w-xs print:border-foreground">
                <SelectValue placeholder="Välj..." />
              </SelectTrigger>
              <SelectContent>
                {field.options?.map(option => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        );

      case 'number':
        return (
          <div className="flex items-center gap-4 py-1.5">
            <Label htmlFor={`${sectionKey}-${field.key}`} className="text-sm min-w-[180px]">
              {field.label}
            </Label>
            <Input
              id={`${sectionKey}-${field.key}`}
              type="number"
              value={fieldValue as number || ''}
              onChange={(e) => updateFieldValue(sectionKey, field.key, e.target.value ? Number(e.target.value) : null)}
              className="h-9 w-24 print:border-foreground"
            />
          </div>
        );

      case 'text':
        return (
          <div className="space-y-1.5 py-1.5">
            <Label htmlFor={`${sectionKey}-${field.key}`} className="text-sm">
              {field.label}
            </Label>
            <Textarea
              id={`${sectionKey}-${field.key}`}
              value={fieldValue as string || ''}
              onChange={(e) => updateFieldValue(sectionKey, field.key, e.target.value)}
              className="min-h-[60px] text-sm print:border-foreground"
            />
          </div>
        );

      case 'requirement_level':
        return (
          <div className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
            <Label className="text-sm font-normal">{field.label}</Label>
            <RadioGroup
              value={fieldValue as RequirementLevel || 'not_relevant'}
              onValueChange={(val) => updateFieldValue(sectionKey, field.key, val)}
              className="flex gap-4"
            >
              <div className="flex items-center space-x-1.5">
                <RadioGroupItem value="required" id={`${field.key}-required`} className="h-4 w-4 print:border-foreground" />
                <Label htmlFor={`${field.key}-required`} className="text-sm font-normal cursor-pointer">Krävs</Label>
              </div>
              <div className="flex items-center space-x-1.5">
                <RadioGroupItem value="preferred" id={`${field.key}-preferred`} className="h-4 w-4 print:border-foreground" />
                <Label htmlFor={`${field.key}-preferred`} className="text-sm font-normal cursor-pointer">Meriterande</Label>
              </div>
              <div className="flex items-center space-x-1.5">
                <RadioGroupItem value="not_relevant" id={`${field.key}-not_relevant`} className="h-4 w-4 print:border-foreground" />
                <Label htmlFor={`${field.key}-not_relevant`} className="text-sm font-normal cursor-pointer">Ej relevant</Label>
              </div>
            </RadioGroup>
          </div>
        );

      case 'ranked_list':
        const listValue = (fieldValue as string[]) || [];
        return (
          <div className="space-y-2 py-1.5">
            <Label className="text-sm">{field.label}</Label>
            <div className="space-y-1.5">
              {listValue.map((item, index) => (
                <div key={index} className="flex items-center gap-2">
                  <GripVertical className="h-4 w-4 text-muted-foreground print:hidden" />
                  <Badge variant="outline" className="px-2 py-0.5 text-xs min-w-[24px] justify-center print:border-foreground">
                    {index + 1}
                  </Badge>
                  <Input
                    value={item}
                    onChange={(e) => {
                      const newList = [...listValue];
                      newList[index] = e.target.value;
                      updateFieldValue(sectionKey, field.key, newList);
                    }}
                    className="h-8 text-sm flex-1 print:border-foreground"
                    placeholder={`Punkt ${index + 1}`}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 print:hidden"
                    onClick={() => {
                      const newList = listValue.filter((_, i) => i !== index);
                      updateFieldValue(sectionKey, field.key, newList);
                    }}
                  >
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}
              {(!field.max_items || listValue.length < field.max_items) && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-8 text-xs print:hidden"
                  onClick={() => updateFieldValue(sectionKey, field.key, [...listValue, ''])}
                >
                  <Plus className="h-3.5 w-3.5 mr-1" />
                  Lägg till
                </Button>
              )}
            </div>
          </div>
        );

      case 'brand_selector':
        return (
          <div className="flex items-center gap-4 py-1.5">
            <Label htmlFor={`${sectionKey}-${field.key}`} className="text-sm min-w-[180px]">
              {field.label}
            </Label>
            <Input
              id={`${sectionKey}-${field.key}`}
              value={fieldValue as string || ''}
              onChange={(e) => updateFieldValue(sectionKey, field.key, e.target.value)}
              placeholder="T.ex. VAG, BMW, Toyota..."
              className="h-9 max-w-xs print:border-foreground"
            />
          </div>
        );

      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 print:space-y-4">
      {/* Header with actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <ClipboardList className="h-6 w-6 text-primary" />
            Kravprofil - Kundintervju
          </h1>
          <p className="text-muted-foreground">
            Välj tjänstetyp för att starta intervjun
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button variant="outline" size="sm" onClick={handlePrint}>
            <Printer className="h-4 w-4 mr-2" />
            Skriv ut
          </Button>
          <Button variant="outline" size="sm" onClick={handleSaveDraft}>
            <Save className="h-4 w-4 mr-2" />
            Spara utkast
          </Button>
        </div>
      </div>

      {/* Print header */}
      <div className="hidden print:block">
        <h1 className="text-xl font-bold">Kravprofil - Kundintervju</h1>
        <p className="text-sm text-muted-foreground">
          {selectedTemplate?.display_name || 'Ingen mall vald'}
        </p>
      </div>

      {/* Template selector */}
      <Card className="print:shadow-none print:border-0">
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <Label className="text-sm font-medium min-w-fit">Tjänstetyp:</Label>
            <Select 
              value={selectedTemplateId || ''} 
              onValueChange={(id) => setSelectedTemplateId(id)}
            >
              <SelectTrigger className="max-w-md print:hidden">
                <SelectValue placeholder="Välj tjänstetyp..." />
              </SelectTrigger>
              <SelectContent>
                {templates?.map(template => (
                  <SelectItem key={template.id} value={template.id}>
                    {template.display_name.replace(' - Kravprofil', '')}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedTemplateId && (
              <Button 
                type="button" 
                variant="ghost" 
                size="sm"
                onClick={handleClearDraft}
                className="print:hidden"
              >
                <X className="h-4 w-4 mr-1" />
                Rensa
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {selectedTemplateId && selectedTemplate && (
        <>
          {/* Customer Info Section */}
          <Card className="print:shadow-none print:border print:border-foreground/20">
            <CardHeader className="pb-3 print:pb-2">
              <CardTitle className="text-base font-semibold border-b pb-2 print:text-sm">
                GRUNDUPPGIFTER
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 print:space-y-2">
              <div className="grid gap-4 md:grid-cols-2 print:grid-cols-2">
                <div className="flex items-center gap-4">
                  <Label className="text-sm min-w-[120px]">Företag:</Label>
                  <Input
                    value={customerInfo.companyName}
                    onChange={(e) => setCustomerInfo(prev => ({ ...prev, companyName: e.target.value }))}
                    placeholder="Kundföretag"
                    className="h-9 print:border-foreground"
                  />
                </div>
                <div className="flex items-center gap-4">
                  <Label className="text-sm min-w-[120px]">Kontaktperson:</Label>
                  <Input
                    value={customerInfo.contactPerson}
                    onChange={(e) => setCustomerInfo(prev => ({ ...prev, contactPerson: e.target.value }))}
                    placeholder="Namn"
                    className="h-9 print:border-foreground"
                  />
                </div>
                <div className="flex items-center gap-4">
                  <Label className="text-sm min-w-[120px]">Önskat tillträde:</Label>
                  <Input
                    value={customerInfo.desiredStartDate}
                    onChange={(e) => setCustomerInfo(prev => ({ ...prev, desiredStartDate: e.target.value }))}
                    placeholder="T.ex. Omgående, Q2 2026"
                    className="h-9 print:border-foreground"
                  />
                </div>
                <div className="flex items-center gap-4">
                  <Label className="text-sm min-w-[120px]">Lönespann:</Label>
                  <Input
                    value={customerInfo.salaryRange}
                    onChange={(e) => setCustomerInfo(prev => ({ ...prev, salaryRange: e.target.value }))}
                    placeholder="T.ex. 35-42k"
                    className="h-9 print:border-foreground"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Template Sections */}
          {selectedTemplate.template_data.sections.map((section) => (
            <Card key={section.key} className="print:shadow-none print:border print:border-foreground/20 print:break-inside-avoid">
              <CardHeader className="pb-3 print:pb-2">
                <CardTitle className="text-base font-semibold border-b pb-2 print:text-sm uppercase">
                  {section.title}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-1 print:space-y-0">
                {section.fields.map((field) => (
                  <div key={field.key}>
                    {renderField(section.key, field)}
                  </div>
                ))}
                
                {/* Section notes textarea */}
                <div className="pt-4 mt-4 border-t border-border/50">
                  <Label className="text-sm text-muted-foreground mb-2 block">
                    Noteringar för {section.title.toLowerCase()}
                  </Label>
                  <Textarea
                    value={sectionNotes[section.key] || ''}
                    onChange={(e) => setSectionNotes(prev => ({
                      ...prev,
                      [section.key]: e.target.value
                    }))}
                    placeholder="Skriv eventuella specifika krav eller önskemål från kunden här..."
                    className="min-h-[80px] text-sm print:border-foreground"
                  />
                </div>
              </CardContent>
            </Card>
          ))}

          {/* Job Linking Section */}
          <Card className="print:hidden border-primary/20 bg-primary/5">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <Link2 className="h-5 w-5 text-primary" />
                Koppla kravprofil till jobb
              </CardTitle>
              <CardDescription>
                Välj om du vill koppla profilen till ett befintligt jobb eller skapa ett nytt med AI-hjälp
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <RadioGroup 
                value={linkMode || ''} 
                onValueChange={(val) => setLinkMode(val as 'existing' | 'new')}
              >
                {/* Option 1: Link to existing job */}
                <div className={`flex items-start space-x-3 p-4 border rounded-lg transition-colors ${linkMode === 'existing' ? 'border-primary bg-background' : 'border-border'}`}>
                  <RadioGroupItem value="existing" id="link-existing" className="mt-1" />
                  <div className="flex-1 space-y-3">
                    <Label htmlFor="link-existing" className="text-sm font-medium cursor-pointer">
                      Koppla till befintligt jobb
                    </Label>
                    {linkMode === 'existing' && (
                      <div className="space-y-3">
                        <Select value={selectedJobId || ''} onValueChange={setSelectedJobId}>
                          <SelectTrigger>
                            <SelectValue placeholder="Välj jobb..." />
                          </SelectTrigger>
                          <SelectContent>
                            {jobs?.map(job => (
                              <SelectItem key={job.id} value={job.id}>
                                {job.title} - {job.companies?.name || 'Okänt företag'} ({job.city || 'Ingen stad'})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Button 
                          onClick={handleLinkToJob} 
                          disabled={!selectedJobId || isLinking}
                          className="w-full sm:w-auto"
                        >
                          {isLinking ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Kopplar...
                            </>
                          ) : (
                            <>
                              <Link2 className="h-4 w-4 mr-2" />
                              Koppla kravprofil
                            </>
                          )}
                        </Button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Option 2: Create new job with AI */}
                <div className={`flex items-start space-x-3 p-4 border rounded-lg transition-colors ${linkMode === 'new' ? 'border-primary bg-background' : 'border-border'}`}>
                  <RadioGroupItem value="new" id="link-new" className="mt-1" />
                  <div className="flex-1 space-y-3">
                    <Label htmlFor="link-new" className="text-sm font-medium cursor-pointer">
                      Skapa nytt jobb med AI-hjälp
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      AI analyserar kravprofilen och genererar ett förslag till platsannons som du kan redigera innan publicering.
                    </p>
                    {linkMode === 'new' && (
                      <Button 
                        onClick={handleGenerateAd} 
                        disabled={isGenerating}
                        className="w-full sm:w-auto"
                      >
                        {isGenerating ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Genererar annons...
                          </>
                        ) : (
                          <>
                            <Sparkles className="h-4 w-4 mr-2" />
                            Generera annons →
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                </div>
              </RadioGroup>
            </CardContent>
          </Card>

          {/* Bottom actions */}
          <div className="flex items-center gap-2 justify-end print:hidden">
            <Button variant="outline" onClick={handlePrint}>
              <Printer className="h-4 w-4 mr-2" />
              Skriv ut
            </Button>
            <Button variant="outline" onClick={handleSaveDraft}>
              <Save className="h-4 w-4 mr-2" />
              Spara utkast
            </Button>
          </div>
        </>
      )}

      {!selectedTemplateId && (
        <div className="text-center py-16 text-muted-foreground">
          <ClipboardList className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>Välj en tjänstetyp ovan för att visa intervjuformuläret</p>
        </div>
      )}
    </div>
  );
}
