import React, { useEffect, useState } from 'react';
import { AdminLayout } from '@/components/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Edit, Send, Archive, Search, FolderOpen } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { sv } from 'date-fns/locale';
import { utcToStockholm, nowInStockholm, stockholmToUTC } from '@/lib/timezone';

interface InactiveJob {
  id: string;
  title: string;
  city: string;
  updated_at: string;
  companies: {
    name: string;
  };
}

export default function JobLibrary() {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState<InactiveJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    fetchInactiveJobs();
  }, []);

  const fetchInactiveJobs = async () => {
    try {
      const { data, error } = await supabase
        .from('jobs')
        .select(`
          id,
          title,
          city,
          updated_at,
          companies (
            name
          )
        `)
        .eq('status', 'inactive')
        .order('updated_at', { ascending: false });

      if (error) throw error;
      setJobs(data || []);
    } catch (error: any) {
      console.error('Error fetching inactive jobs:', error);
      toast.error('Kunde inte hämta vilande jobb');
    } finally {
      setLoading(false);
    }
  };

  const handlePublish = async (jobId: string) => {
    setActionLoading(jobId);
    try {
      const now = stockholmToUTC(nowInStockholm());
      const { error } = await supabase
        .from('jobs')
        .update({ 
          status: 'published',
          publish_at: now
        })
        .eq('id', jobId);

      if (error) throw error;
      
      toast.success('Jobb publicerat!');
      setJobs(jobs.filter(j => j.id !== jobId));
    } catch (error: any) {
      console.error('Error publishing job:', error);
      toast.error('Kunde inte publicera jobb');
    } finally {
      setActionLoading(null);
    }
  };

  const handleArchive = async (jobId: string) => {
    if (!window.confirm('Är du säker på att du vill arkivera detta jobb permanent?')) {
      return;
    }

    setActionLoading(jobId);
    try {
      const { error } = await supabase
        .from('jobs')
        .update({ status: 'archived' })
        .eq('id', jobId);

      if (error) throw error;
      
      toast.success('Jobb arkiverat');
      setJobs(jobs.filter(j => j.id !== jobId));
    } catch (error: any) {
      console.error('Error archiving job:', error);
      toast.error('Kunde inte arkivera jobb');
    } finally {
      setActionLoading(null);
    }
  };

  const filteredJobs = jobs.filter(job => 
    job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    job.companies.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    job.city.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <FolderOpen className="h-8 w-8" />
              Jobbbibliotek
            </h1>
            <p className="text-muted-foreground">
              Vilande jobb som kan återaktiveras
            </p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Vilande jobb</CardTitle>
                <CardDescription>
                  {jobs.length} jobb i biblioteket
                </CardDescription>
              </div>
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Sök jobb..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-sm text-muted-foreground">Laddar vilande jobb...</p>
            ) : filteredJobs.length === 0 ? (
              <div className="text-center py-12">
                <FolderOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  {searchTerm ? 'Inga jobb matchar sökningen' : 'Inga vilande jobb i biblioteket'}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  Avpublicerade jobb hamnar här automatiskt
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredJobs.map((job) => (
                  <div
                    key={job.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold">{job.title}</h3>
                        <Badge variant="outline" className="text-orange-600 border-orange-300">
                          Vilande
                        </Badge>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {job.companies.name} • {job.city}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        Vilande sedan: {format(utcToStockholm(job.updated_at), "d MMM yyyy", { locale: sv })}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => handlePublish(job.id)}
                        disabled={actionLoading === job.id}
                      >
                        <Send className="h-4 w-4 mr-2" />
                        Publicera
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate(`/admin/jobs/${job.id}/edit`)}
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        Redigera
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleArchive(job.id)}
                        disabled={actionLoading === job.id}
                        className="text-destructive hover:text-destructive"
                      >
                        <Archive className="h-4 w-4" />
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
