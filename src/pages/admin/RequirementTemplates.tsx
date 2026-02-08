import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AdminLayout } from "@/components/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Accordion, 
  AccordionContent, 
  AccordionItem, 
  AccordionTrigger 
} from "@/components/ui/accordion";
import { 
  FileText, 
  Settings, 
  CheckCircle, 
  XCircle,
  Wrench,
  Car,
  Paintbrush,
  SprayCan,
  Sparkles,
  CircleDot,
  User,
  Cpu
} from "lucide-react";
import type { RequirementTemplate, TemplateData } from "@/types/requirementTemplate";

const roleIcons: Record<string, React.ReactNode> = {
  bilmekaniker: <Wrench className="h-5 w-5" />,
  servicetekniker: <Settings className="h-5 w-5" />,
  platslagare: <Car className="h-5 w-5" />,
  lackerare: <SprayCan className="h-5 w-5" />,
  rekondare: <Sparkles className="h-5 w-5" />,
  dackskiftare: <CircleDot className="h-5 w-5" />,
  kundmottagare: <User className="h-5 w-5" />,
  fordonstekniker: <Cpu className="h-5 w-5" />,
};

const RequirementTemplates = () => {
  const [expandedTemplate, setExpandedTemplate] = useState<string | null>(null);

  const { data: templates, isLoading } = useQuery({
    queryKey: ['requirement-templates'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('requirement_templates')
        .select('*')
        .order('display_name');
      
      if (error) throw error;
      
      // Parse template_data from JSON
      return (data || []).map(t => ({
        ...t,
        template_data: t.template_data as unknown as TemplateData
      })) as RequirementTemplate[];
    }
  });

  const getFieldTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      checkbox: 'Kryssruta',
      checkbox_with_level: 'Kryssruta med nivå',
      select: 'Dropdown',
      number: 'Nummer',
      text: 'Fritext',
      ranked_list: 'Rangordnad lista',
      requirement_level: 'Kravnivå',
      brand_selector: 'Bilmärkesväljare'
    };
    return labels[type] || type;
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="container py-8">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="container py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">Kravprofilmallar</h1>
            <p className="text-muted-foreground">
              Mallar för att samla in kravprofiler från kundföretag per tjänstetyp
            </p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {templates?.map((template) => (
            <Card 
              key={template.id} 
              className={`transition-all ${!template.is_active ? 'opacity-60' : ''}`}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-lg bg-primary/10 text-primary">
                      {roleIcons[template.role_key] || <FileText className="h-5 w-5" />}
                    </div>
                    <div>
                      <CardTitle className="text-lg">{template.display_name}</CardTitle>
                      <CardDescription className="text-xs">
                        {template.role_key}
                      </CardDescription>
                    </div>
                  </div>
                  {template.is_active ? (
                    <Badge variant="default" className="bg-primary/10 text-primary hover:bg-primary/20">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Aktiv
                    </Badge>
                  ) : (
                    <Badge variant="secondary">
                      <XCircle className="h-3 w-3 mr-1" />
                      Inaktiv
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <Accordion type="single" collapsible className="w-full">
                  <AccordionItem value="sections" className="border-none">
                    <AccordionTrigger className="text-sm py-2 hover:no-underline">
                      <span className="flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        {template.template_data.sections.length} sektioner
                      </span>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-3 pt-2">
                        {template.template_data.sections.map((section) => (
                          <div key={section.key} className="border rounded-lg p-3">
                            <h4 className="font-medium text-sm mb-2">{section.title}</h4>
                            <div className="space-y-1">
                              {section.fields.map((field) => (
                                <div 
                                  key={field.key} 
                                  className="flex items-center justify-between text-xs text-muted-foreground"
                                >
                                  <span>{field.label}</span>
                                  <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                                    {getFieldTypeLabel(field.type)}
                                  </Badge>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </CardContent>
            </Card>
          ))}
        </div>

        {templates?.length === 0 && (
          <Card className="p-12 text-center">
            <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">Inga mallar ännu</h3>
            <p className="text-muted-foreground mb-4">
              Skapa din första kravprofilmall för att komma igång.
            </p>
          </Card>
        )}
      </div>
    </AdminLayout>
  );
};

export default RequirementTemplates;
