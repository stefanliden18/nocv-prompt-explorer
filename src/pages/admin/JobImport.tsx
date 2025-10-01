import React, { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Upload, FileText, CheckCircle, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import Papa from 'papaparse';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

interface Company {
  id: string;
  name: string;
}

interface CSVRow {
  [key: string]: string;
}

interface ColumnMapping {
  csvColumn: string;
  jobField: string;
}

const jobFields = [
  { value: '', label: '-- Ignorera --' },
  { value: 'title', label: 'Titel (obligatorisk)' },
  { value: 'company_name', label: 'Företagsnamn (obligatorisk)' },
  { value: 'category', label: 'Kategori' },
  { value: 'employment_type', label: 'Anställningstyp' },
  { value: 'city', label: 'Stad' },
  { value: 'region', label: 'Region' },
  { value: 'language', label: 'Språk' },
  { value: 'description_md', label: 'Beskrivning (Markdown)' },
  { value: 'requirements_md', label: 'Krav (Markdown)' },
  { value: 'driver_license', label: 'Körkort (ja/nej)' },
  { value: 'publish_at', label: 'Publiceringsdatum (YYYY-MM-DD)' },
];

export default function JobImport() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [csvData, setCsvData] = useState<CSVRow[]>([]);
  const [csvColumns, setCsvColumns] = useState<string[]>([]);
  const [columnMappings, setColumnMappings] = useState<ColumnMapping[]>([]);
  const [importing, setImporting] = useState(false);
  const [previewVisible, setPreviewVisible] = useState(false);

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

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const data = results.data as CSVRow[];
        if (data.length === 0) {
          toast.error('CSV-filen är tom');
          return;
        }

        const columns = Object.keys(data[0]);
        setCsvData(data);
        setCsvColumns(columns);
        
        // Auto-map columns based on name similarity
        const autoMappings = columns.map(col => {
          const lowerCol = col.toLowerCase();
          let jobField = '';
          
          if (lowerCol.includes('titel') || lowerCol.includes('title')) jobField = 'title';
          else if (lowerCol.includes('företag') || lowerCol.includes('company')) jobField = 'company_name';
          else if (lowerCol.includes('kategori') || lowerCol.includes('category')) jobField = 'category';
          else if (lowerCol.includes('anställning') || lowerCol.includes('employment')) jobField = 'employment_type';
          else if (lowerCol.includes('stad') || lowerCol.includes('city')) jobField = 'city';
          else if (lowerCol.includes('region')) jobField = 'region';
          else if (lowerCol.includes('språk') || lowerCol.includes('language')) jobField = 'language';
          else if (lowerCol.includes('beskrivning') || lowerCol.includes('description')) jobField = 'description_md';
          else if (lowerCol.includes('krav') || lowerCol.includes('requirements')) jobField = 'requirements_md';
          else if (lowerCol.includes('körkort') || lowerCol.includes('driver')) jobField = 'driver_license';
          else if (lowerCol.includes('publicering') || lowerCol.includes('publish')) jobField = 'publish_at';

          return { csvColumn: col, jobField };
        });

        setColumnMappings(autoMappings);
        setPreviewVisible(true);
        toast.success(`Laddade ${data.length} rader från CSV`);
      },
      error: (error) => {
        console.error('CSV parsing error:', error);
        toast.error('Kunde inte läsa CSV-filen');
      }
    });
  };

  const updateMapping = (csvColumn: string, jobField: string) => {
    setColumnMappings(prev =>
      prev.map(m => m.csvColumn === csvColumn ? { ...m, jobField } : m)
    );
  };

  const generateSlug = (title: string): string => {
    return title
      .toLowerCase()
      .trim()
      .replace(/[åä]/g, 'a')
      .replace(/ö/g, 'o')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  const validateAndImport = async () => {
    if (!user) {
      toast.error('Du måste vara inloggad');
      return;
    }

    // Check required fields are mapped
    const titleMapped = columnMappings.some(m => m.jobField === 'title');
    const companyMapped = columnMappings.some(m => m.jobField === 'company_name');

    if (!titleMapped || !companyMapped) {
      toast.error('Du måste mappa både "Titel" och "Företagsnamn"');
      return;
    }

    setImporting(true);

    try {
      let successCount = 0;
      let errorCount = 0;

      for (const row of csvData) {
        try {
          // Build job object from mappings
          const jobData: any = {
            status: 'draft',
            created_by: user.id,
          };

          let companyName = '';

          for (const mapping of columnMappings) {
            if (!mapping.jobField || mapping.jobField === '') continue;

            const value = row[mapping.csvColumn]?.trim() || '';
            
            if (mapping.jobField === 'company_name') {
              companyName = value;
              continue;
            }

            if (mapping.jobField === 'driver_license') {
              jobData.driver_license = ['ja', 'yes', 'true', '1'].includes(value.toLowerCase());
            } else if (mapping.jobField === 'publish_at') {
              if (value) {
                jobData.publish_at = value;
              }
            } else {
              jobData[mapping.jobField] = value;
            }
          }

          // Validate required fields
          if (!jobData.title) {
            console.error('Row missing title:', row);
            errorCount++;
            continue;
          }

          if (!companyName) {
            console.error('Row missing company name:', row);
            errorCount++;
            continue;
          }

          // Find or create company
          let company = companies.find(c => c.name.toLowerCase() === companyName.toLowerCase());
          
          if (!company) {
            const { data: newCompany, error: companyError } = await supabase
              .from('companies')
              .insert({ 
                name: companyName,
                contact_person: 'Ej angivet',
                contact_email: 'info@example.com',
                contact_phone: '000-000 00 00'
              })
              .select('id, name')
              .single();

            if (companyError) throw companyError;
            company = newCompany;
            setCompanies(prev => [...prev, newCompany]);
          }

          jobData.company_id = company.id;
          jobData.slug = generateSlug(jobData.title);

          // Insert job
          const { error: jobError } = await supabase
            .from('jobs')
            .insert(jobData);

          if (jobError) {
            console.error('Error inserting job:', jobError);
            errorCount++;
          } else {
            successCount++;
          }

        } catch (error: any) {
          console.error('Error processing row:', error);
          errorCount++;
        }
      }

      if (successCount > 0) {
        toast.success(`Importerade ${successCount} jobb som utkast`);
      }
      
      if (errorCount > 0) {
        toast.error(`${errorCount} jobb kunde inte importeras`);
      }

      if (successCount > 0) {
        setTimeout(() => {
          navigate('/admin/jobs');
        }, 1500);
      }

    } catch (error: any) {
      console.error('Import error:', error);
      toast.error('Ett fel uppstod vid import');
    } finally {
      setImporting(false);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Importera jobb från CSV</h1>
          <p className="text-muted-foreground">Ladda upp en CSV-fil för att snabbt importera flera jobb</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>1. Ladda upp CSV-fil</CardTitle>
            <CardDescription>
              Välj en CSV-fil med jobbdata. Första raden ska innehålla kolumnnamn.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label htmlFor="csv-file">CSV-fil</Label>
                <Input
                  id="csv-file"
                  type="file"
                  accept=".csv"
                  onChange={handleFileUpload}
                  disabled={importing}
                />
              </div>
              {csvData.length > 0 && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <FileText className="h-4 w-4" />
                  <span>{csvData.length} rader laddade</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {previewVisible && (
          <>
            <Card>
              <CardHeader>
                <CardTitle>2. Mappa kolumner</CardTitle>
                <CardDescription>
                  Välj vilket fält varje CSV-kolumn motsvarar. "Titel" och "Företagsnamn" är obligatoriska.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {csvColumns.map((csvCol) => {
                    const mapping = columnMappings.find(m => m.csvColumn === csvCol);
                    return (
                      <div key={csvCol} className="grid grid-cols-2 gap-4 items-center">
                        <div className="font-medium text-sm">{csvCol}</div>
                        <Select
                          value={mapping?.jobField || ''}
                          onValueChange={(value) => updateMapping(csvCol, value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Välj fält" />
                          </SelectTrigger>
                          <SelectContent>
                            {jobFields.map(field => (
                              <SelectItem key={field.value} value={field.value}>
                                {field.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>3. Förhandsgranskning</CardTitle>
                <CardDescription>
                  De första 5 raderna från CSV-filen
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        {csvColumns.map(col => (
                          <TableHead key={col}>{col}</TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {csvData.slice(0, 5).map((row, idx) => (
                        <TableRow key={idx}>
                          {csvColumns.map(col => (
                            <TableCell key={col} className="max-w-xs truncate">
                              {row[col]}
                            </TableCell>
                          ))}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>4. Importera</CardTitle>
                <CardDescription>
                  Alla jobb importeras med status "Utkast". Du kan sedan granska och publicera dem individuellt.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-start gap-2 p-3 bg-muted rounded-lg">
                    <AlertCircle className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div className="text-sm text-muted-foreground">
                      <p className="font-medium mb-1">Observera:</p>
                      <ul className="list-disc list-inside space-y-1">
                        <li>Om ett företag inte finns skapas det automatiskt</li>
                        <li>Alla jobb importeras som utkast</li>
                        <li>Du kan redigera och publicera dem efteråt</li>
                      </ul>
                    </div>
                  </div>
                  
                  <Button 
                    onClick={validateAndImport}
                    disabled={importing}
                    size="lg"
                    className="w-full"
                  >
                    {importing ? (
                      <>Importerar...</>
                    ) : (
                      <>
                        <Upload className="h-4 w-4 mr-2" />
                        Importera {csvData.length} jobb
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </AdminLayout>
  );
}
