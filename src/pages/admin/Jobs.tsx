import React, { useEffect, useState } from 'react';
import { AdminLayout } from '@/components/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Eye, Upload, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { sv } from 'date-fns/locale';
import { utcToStockholm, nowInStockholm, stockholmToUTC } from '@/lib/timezone';

interface TaxonomyResult {
  type: string;
  count: number;
}

interface Job {
  id: string;
  title: string;
  city: string;
  status: 'draft' | 'published' | 'archived' | 'demo';
  publish_at: string | null;
  created_at: string;
  companies: {
    name: string;
  };
}

export default function AdminJobs() {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    try {
      const { data, error } = await supabase
        .from('jobs')
        .select(`
          id,
          title,
          city,
          status,
          publish_at,
          created_at,
          companies (
            name
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setJobs(data || []);
    } catch (error: any) {
      console.error('Error fetching jobs:', error);
      toast.error('Kunde inte hämta jobb');
    } finally {
      setLoading(false);
    }
  };

  const handleSyncTaxonomy = async () => {
    const loadingToast = toast.loading('Synkroniserar AF-taxonomi version 16 från Jobtech API...');
    try {
      const { data, error } = await supabase.functions.invoke('sync-af-taxonomy');
      
      if (error) throw error;
      
      const results = data.results as TaxonomyResult[];
      
      const occupations = results.find(r => r.type === 'occupation-name')?.count || 0;
      const municipalities = results.find(r => r.type === 'municipality')?.count || 0;
      const employmentTypes = results.find(r => r.type === 'employment-type')?.count || 0;
      const durations = results.find(r => r.type === 'duration')?.count || 0;
      const worktimeExtents = results.find(r => r.type === 'worktime-extent')?.count || 0;
      
      toast.success(
        `✅ Taxonomi uppdaterad till version 16!\n\nYrkeskoder: ${occupations}\nKommunkoder: ${municipalities}\nAnställningstyper: ${employmentTypes} (inkl. "Tillsvidareanställning")\nVaraktighet: ${durations}\nArbetstid: ${worktimeExtents}`,
        { id: loadingToast, duration: 6000 }
      );
      
      // Refresh jobs list after sync to reflect any changes
      fetchJobs();
    } catch (error: any) {
      console.error('Error syncing taxonomy:', error);
      toast.error('Kunde inte synka taxonomi: ' + error.message, { id: loadingToast });
    }
  };

  const getStatusBadge = (job: Job) => {
    if (job.status === 'demo') {
      return <Badge className="bg-yellow-500 text-black font-bold">🎬 DEMO</Badge>;
    }
    
    if (job.status === 'archived') {
      return <Badge variant="secondary">Arkiverad</Badge>;
    }
    
    if (job.status === 'published') {
      const nowStockholmAsUtc = stockholmToUTC(nowInStockholm());
      const publishDateUtc = job.publish_at;
      if (publishDateUtc && publishDateUtc > nowStockholmAsUtc) {
        return <Badge variant="outline">Planerad</Badge>;
      }
      return <Badge variant="default">Publicerad</Badge>;
    }
    
    return <Badge variant="secondary">Utkast</Badge>;
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Jobb</h1>
            <p className="text-muted-foreground">Hantera jobbannonser</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleSyncTaxonomy}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Synka Taxonomy (Version 16)
            </Button>
            <Button variant="outline" onClick={() => navigate('/admin/jobs/import')}>
              <Upload className="h-4 w-4 mr-2" />
              Importera CSV
            </Button>
            <Button onClick={() => navigate('/admin/jobs/new')}>
              <Plus className="h-4 w-4 mr-2" />
              Nytt jobb
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Alla jobb</CardTitle>
            <CardDescription>
              Lista över alla jobbannonser i systemet
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-sm text-muted-foreground">Laddar jobb...</p>
            ) : jobs.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Inga jobb ännu. Klicka på "Nytt jobb" för att skapa din första jobbannons.
              </p>
            ) : (
              <div className="space-y-4">
                {jobs.map((job) => (
                  <div
                    key={job.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold">{job.title}</h3>
                        {getStatusBadge(job)}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {job.companies.name} • {job.city}
                      </div>
                       <div className="text-xs text-muted-foreground mt-1">
                        Skapad: {format(utcToStockholm(job.created_at), "PPP 'kl.' HH:mm", { locale: sv })}
                        {job.publish_at && job.publish_at > stockholmToUTC(nowInStockholm()) && (
                          <> • Planerad: {format(utcToStockholm(job.publish_at), "PPP 'kl.' HH:mm", { locale: sv })}</>
                        )}
                       </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate(`/admin/jobs/${job.id}/preview`)}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        Visa
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate(`/admin/jobs/${job.id}/edit`)}
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        Redigera
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}