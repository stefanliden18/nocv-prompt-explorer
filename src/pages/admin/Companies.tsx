import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Loader2, ExternalLink } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { CompanyForm } from '@/components/CompanyForm';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface Company {
  id: string;
  name: string;
  website: string | null;
  logo_url: string | null;
  created_at: string;
}

export default function AdminCompanies() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);

  const fetchCompanies = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from('companies')
        .select('*')
        .order('created_at', { ascending: false });

      if (fetchError) {
        console.error('Error fetching companies:', fetchError);
        setError('Misslyckades att hämta företag. Försök igen.');
        toast({
          variant: 'destructive',
          title: 'Fel vid hämtning',
          description: fetchError.message || 'Kunde inte hämta företag.',
        });
        return;
      }

      setCompanies(data || []);
    } catch (err) {
      console.error('Unexpected error:', err);
      setError('Ett oväntat fel uppstod.');
      toast({
        variant: 'destructive',
        title: 'Fel',
        description: 'Ett oväntat fel uppstod. Försök igen.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCompanies();
  }, []);

  const handleSuccess = () => {
    fetchCompanies();
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Företag</h1>
            <p className="text-muted-foreground">Hantera företag</p>
          </div>
          <Button onClick={() => setIsFormOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Nytt företag
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Alla företag</CardTitle>
            <CardDescription>
              Lista över alla företag i systemet
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : error ? (
              <div className="text-center py-8">
                <p className="text-sm text-destructive mb-4">{error}</p>
                <Button variant="outline" onClick={fetchCompanies}>
                  Försök igen
                </Button>
              </div>
            ) : companies.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Inga företag ännu. Klicka på "Nytt företag" för att lägga till ett företag.
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Namn</TableHead>
                    <TableHead>Webbplats</TableHead>
                    <TableHead>Skapad</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {companies.map((company) => (
                    <TableRow key={company.id}>
                      <TableCell className="font-medium">
                        {company.name}
                      </TableCell>
                      <TableCell>
                        {company.website ? (
                          <a
                            href={company.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-primary hover:underline"
                          >
                            {company.website}
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {new Date(company.created_at).toLocaleDateString('sv-SE')}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      <CompanyForm
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        onSuccess={handleSuccess}
      />
    </AdminLayout>
  );
}