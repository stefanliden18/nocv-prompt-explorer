import { useState, useEffect } from "react";
import { AdminLayout } from "@/components/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RichTextEditor } from "@/components/RichTextEditor";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient, useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import DOMPurify from "dompurify";
import { Save, FileText } from "lucide-react";

// Helper function to clean empty content
const cleanEmptyContent = (html: string) => {
  const stripped = html.replace(/<[^>]*>/g, '').trim();
  return stripped.length === 0 ? '' : html;
};

export default function GDPRPolicyEdit() {
  const queryClient = useQueryClient();
  const [policyContent, setPolicyContent] = useState("");
  const [policyId, setPolicyId] = useState<string | null>(null);

  // Fetch current GDPR policy
  const { data: policyData, isLoading } = useQuery({
    queryKey: ['gdpr-policy'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('gdpr_policies')
        .select('*')
        .eq('is_active', true)
        .single();
      
      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        throw error;
      }
      
      return data;
    },
  });

  useEffect(() => {
    if (policyData) {
      setPolicyContent(policyData.policy_text || '');
      setPolicyId(policyData.id);
    }
  }, [policyData]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const cleanedContent = cleanEmptyContent(policyContent);
      const sanitizedContent = DOMPurify.sanitize(cleanedContent);
      
      if (policyId) {
        // Update existing policy
        const { error } = await supabase
          .from('gdpr_policies')
          .update({ 
            policy_text: sanitizedContent,
            updated_at: new Date().toISOString()
          })
          .eq('id', policyId);
        
        if (error) throw error;
      } else {
        // Create new policy (deactivate old ones first)
        const { error: deactivateError } = await supabase
          .from('gdpr_policies')
          .update({ is_active: false })
          .eq('is_active', true);
        
        if (deactivateError) throw deactivateError;
        
        const { data, error } = await supabase
          .from('gdpr_policies')
          .insert({ 
            policy_text: sanitizedContent,
            is_active: true
          })
          .select()
          .single();
        
        if (error) throw error;
        setPolicyId(data.id);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gdpr-policy'] });
      toast.success('GDPR-policy sparad', {
        description: 'Ändringarna har sparats och kommer visas för alla nya ansökningar.',
      });
    },
    onError: (error) => {
      console.error('Error saving GDPR policy:', error);
      toast.error('Kunde inte spara', {
        description: 'Ett fel uppstod när GDPR-policyn skulle sparas.',
      });
    },
  });

  const handleSave = () => {
    saveMutation.mutate();
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-heading">Redigera GDPR-policy</h1>
          </div>
          <Card>
            <CardContent className="p-6">
              <p>Laddar...</p>
            </CardContent>
          </Card>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-heading flex items-center gap-2">
              <FileText className="h-8 w-8" />
              Redigera GDPR-policy
            </h1>
            <p className="text-muted-foreground mt-2">
              Denna text visas för alla kandidater när de ansöker till ett jobb
            </p>
          </div>
          <Button 
            onClick={handleSave}
            disabled={saveMutation.isPending}
            size="lg"
          >
            <Save className="h-4 w-4 mr-2" />
            {saveMutation.isPending ? 'Sparar...' : 'Spara ändringar'}
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>GDPR-policytext</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Redigera texten om behandling av personuppgifter som kandidater måste godkänna innan de ansöker. 
                Denna text bör innehålla information om vilka uppgifter som samlas in, varför, hur länge de sparas, 
                och kandidaternas rättigheter enligt GDPR.
              </p>
              <RichTextEditor
                content={policyContent}
                onChange={setPolicyContent}
                placeholder="Skriv GDPR-policytexten här..."
              />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-muted/50">
          <CardHeader>
            <CardTitle className="text-base">Information</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-2">
            <p><strong>Viktigt att inkludera:</strong></p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>Personuppgiftsansvarig</li>
              <li>Vilka uppgifter som samlas in (namn, e-post, telefon)</li>
              <li>Ändamål med behandlingen</li>
              <li>Rättslig grund för behandlingen</li>
              <li>Hur länge uppgifterna sparas</li>
              <li>Kandidatens rättigheter (tillgång, rättelse, radering, invändning)</li>
              <li>Kontaktinformation för dataskyddsfrågor</li>
              <li>Rätt att lämna klagomål till Integritetsskyddsmyndigheten (IMY)</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
