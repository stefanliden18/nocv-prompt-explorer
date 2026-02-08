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
import { 
  Accordion, 
  AccordionContent, 
  AccordionItem, 
  AccordionTrigger 
} from "@/components/ui/accordion";
import { GripVertical, Plus, X, ClipboardList } from "lucide-react";
import type { 
  RequirementTemplate, 
  TemplateData, 
  TemplateField, 
  RequirementProfile,
  RequirementLevel,
  CheckboxWithLevelValue
} from "@/types/requirementTemplate";

interface RequirementProfileFormProps {
  value: RequirementProfile | null;
  onChange: (profile: RequirementProfile | null) => void;
  className?: string;
}

export function RequirementProfileForm({ value, onChange, className }: RequirementProfileFormProps) {
   const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(value?.template_id || null);
   const [openSections, setOpenSections] = useState<string[]>([]);

  // Synkronisera selectedTemplateId med inkommande value
  useEffect(() => {
    if (value?.template_id && value.template_id !== selectedTemplateId) {
      setSelectedTemplateId(value.template_id);
    }
  }, [value?.template_id]);

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

  // Initiera openSections när template finns och sektioner är tomma
  useEffect(() => {
    if (selectedTemplate && openSections.length === 0) {
      setOpenSections(selectedTemplate.template_data.sections.map(s => s.key));
    }
  }, [selectedTemplate, openSections.length]);

   // Initialize profile values when template changes (only for new/empty profiles)
   useEffect(() => {
     if (selectedTemplate && selectedTemplateId) {
       const isNewProfile = !value || value.template_id !== selectedTemplateId;
       const hasExistingValues = value && Object.keys(value.values || {}).length > 0;
       
       // Endast initiera om profilen är ny OCH saknar existerande värden
       if (isNewProfile && !hasExistingValues) {
         const initialValues: RequirementProfile['values'] = {};
         const initialNotes: Record<string, string> = {};
         const sectionKeys: string[] = [];
         selectedTemplate.template_data.sections.forEach(section => {
           initialValues[section.key] = {};
           initialNotes[section.key] = '';
           sectionKeys.push(section.key);
           section.fields.forEach(field => {
             initialValues[section.key][field.key] = getDefaultValue(field);
           });
         });
         setOpenSections(sectionKeys);
         onChange({
           template_id: selectedTemplate.id,
           role_key: selectedTemplate.role_key,
           values: initialValues,
           section_notes: initialNotes
         });
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
    if (!value) return;
    
    const newValues = { ...value.values };
    if (!newValues[sectionKey]) {
      newValues[sectionKey] = {};
    }
    newValues[sectionKey] = {
      ...newValues[sectionKey],
      [fieldKey]: fieldValue
    };
    
    onChange({
      ...value,
      values: newValues
    });
  };

   const getFieldValue = (sectionKey: string, fieldKey: string) => {
     return value?.values?.[sectionKey]?.[fieldKey];
   };

   const updateSectionNotes = (sectionKey: string, notes: string) => {
     if (!value) return;
     
     onChange({
       ...value,
       section_notes: {
         ...value.section_notes,
         [sectionKey]: notes
       }
     });
   };

   const getSectionNotes = (sectionKey: string) => {
     return value?.section_notes?.[sectionKey] || '';
   };

   const handleClearProfile = () => {
    setSelectedTemplateId(null);
    onChange(null);
  };

  const renderField = (sectionKey: string, field: TemplateField) => {
    const fieldValue = getFieldValue(sectionKey, field.key);

    switch (field.type) {
      case 'checkbox':
        return (
          <div className="flex items-center space-x-2">
            <Checkbox
              id={`${sectionKey}-${field.key}`}
              checked={fieldValue === true}
              onCheckedChange={(checked) => updateFieldValue(sectionKey, field.key, checked)}
            />
            <Label htmlFor={`${sectionKey}-${field.key}`} className="text-sm font-normal">
              {field.label}
            </Label>
          </div>
        );

      case 'checkbox_with_level':
        const cbwlValue = fieldValue as CheckboxWithLevelValue | undefined;
        return (
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Checkbox
                id={`${sectionKey}-${field.key}`}
                checked={cbwlValue?.enabled === true}
                onCheckedChange={(checked) => 
                  updateFieldValue(sectionKey, field.key, { 
                    enabled: checked, 
                    level: cbwlValue?.level || field.levels?.[0] || '' 
                  })
                }
              />
              <Label htmlFor={`${sectionKey}-${field.key}`} className="text-sm font-normal">
                {field.label}
              </Label>
            </div>
            {cbwlValue?.enabled && field.levels && (
              <div className="ml-6">
                <Select 
                  value={cbwlValue?.level || ''} 
                  onValueChange={(level) => updateFieldValue(sectionKey, field.key, { ...cbwlValue, level })}
                >
                  <SelectTrigger className="h-8 text-xs w-40">
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
          <div className="space-y-1.5">
            <Label htmlFor={`${sectionKey}-${field.key}`} className="text-sm">
              {field.label}
            </Label>
            <Select 
              value={fieldValue as string || ''} 
              onValueChange={(val) => updateFieldValue(sectionKey, field.key, val)}
            >
              <SelectTrigger className="h-9">
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
          <div className="space-y-1.5">
            <Label htmlFor={`${sectionKey}-${field.key}`} className="text-sm">
              {field.label}
            </Label>
            <Input
              id={`${sectionKey}-${field.key}`}
              type="number"
              value={fieldValue as number || ''}
              onChange={(e) => updateFieldValue(sectionKey, field.key, e.target.value ? Number(e.target.value) : null)}
              className="h-9"
            />
          </div>
        );

      case 'text':
        return (
          <div className="space-y-1.5">
            <Label htmlFor={`${sectionKey}-${field.key}`} className="text-sm">
              {field.label}
            </Label>
            <Textarea
              id={`${sectionKey}-${field.key}`}
              value={fieldValue as string || ''}
              onChange={(e) => updateFieldValue(sectionKey, field.key, e.target.value)}
              className="min-h-[60px] text-sm"
            />
          </div>
        );

      case 'requirement_level':
        return (
          <div className="flex items-center justify-between py-1">
            <Label className="text-sm font-normal">{field.label}</Label>
            <RadioGroup
              value={fieldValue as RequirementLevel || 'not_relevant'}
              onValueChange={(val) => updateFieldValue(sectionKey, field.key, val)}
              className="flex gap-2"
            >
              <div className="flex items-center space-x-1">
                <RadioGroupItem value="required" id={`${field.key}-required`} className="h-3.5 w-3.5" />
                <Label htmlFor={`${field.key}-required`} className="text-xs font-normal">Krävs</Label>
              </div>
              <div className="flex items-center space-x-1">
                <RadioGroupItem value="preferred" id={`${field.key}-preferred`} className="h-3.5 w-3.5" />
                <Label htmlFor={`${field.key}-preferred`} className="text-xs font-normal">Meriterande</Label>
              </div>
              <div className="flex items-center space-x-1">
                <RadioGroupItem value="not_relevant" id={`${field.key}-not_relevant`} className="h-3.5 w-3.5" />
                <Label htmlFor={`${field.key}-not_relevant`} className="text-xs font-normal">Ej relevant</Label>
              </div>
            </RadioGroup>
          </div>
        );

      case 'ranked_list':
        const listValue = (fieldValue as string[]) || [];
        return (
          <div className="space-y-2">
            <Label className="text-sm">{field.label}</Label>
            <div className="space-y-1">
              {listValue.map((item, index) => (
                <div key={index} className="flex items-center gap-2">
                  <GripVertical className="h-4 w-4 text-muted-foreground" />
                  <Badge variant="outline" className="px-2 py-0.5 text-xs">
                    {index + 1}
                  </Badge>
                  <Input
                    value={item}
                    onChange={(e) => {
                      const newList = [...listValue];
                      newList[index] = e.target.value;
                      updateFieldValue(sectionKey, field.key, newList);
                    }}
                    className="h-8 text-sm"
                    placeholder={`Punkt ${index + 1}`}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
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
                  className="h-8 text-xs"
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
          <div className="space-y-1.5">
            <Label htmlFor={`${sectionKey}-${field.key}`} className="text-sm">
              {field.label}
            </Label>
            <Input
              id={`${sectionKey}-${field.key}`}
              value={fieldValue as string || ''}
              onChange={(e) => updateFieldValue(sectionKey, field.key, e.target.value)}
              placeholder="T.ex. VAG, BMW, Toyota..."
              className="h-9"
            />
          </div>
        );

      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="flex items-center justify-center h-24">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <ClipboardList className="h-5 w-5 text-primary" />
          <CardTitle className="text-lg">Kravprofil</CardTitle>
        </div>
        <CardDescription>
          Välj en tjänstetyp för att fylla i strukturerade krav
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-2">
          <Select 
            value={selectedTemplateId || ''} 
            onValueChange={(id) => setSelectedTemplateId(id)}
          >
            <SelectTrigger>
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
              size="icon"
              onClick={handleClearProfile}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

         {selectedTemplate && value && (
           <Accordion type="multiple" value={openSections} onValueChange={setOpenSections} className="w-full">
            {selectedTemplate.template_data.sections.map((section) => (
              <AccordionItem key={section.key} value={section.key}>
                <AccordionTrigger className="text-sm font-medium py-2">
                  {section.title}
                </AccordionTrigger>
                <AccordionContent>
                   <div className="space-y-3 pt-2">
                     {section.fields.map((field) => (
                       <div key={field.key}>
                         {renderField(section.key, field)}
                       </div>
                     ))}
                     
                     {/* Section notes textarea */}
                     <div className="pt-2 mt-3 border-t border-border/50">
                       <Label className="text-sm text-muted-foreground mb-2 block">
                         Noteringar för {section.title.toLowerCase()}
                       </Label>
                       <Textarea
                         value={getSectionNotes(section.key)}
                         onChange={(e) => updateSectionNotes(section.key, e.target.value)}
                         placeholder="Skriv eventuella specifika krav eller önskemål här..."
                         className="min-h-[60px] text-sm"
                       />
                     </div>
                   </div>
                 </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        )}

        {!selectedTemplateId && (
          <div className="text-center py-8 text-muted-foreground text-sm">
            Välj en tjänstetyp ovan för att visa kravprofilen
          </div>
        )}
      </CardContent>
    </Card>
  );
}
