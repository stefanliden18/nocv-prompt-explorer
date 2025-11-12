import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { AdminLayout } from '@/components/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Plus, FileText, Film, ExternalLink, Edit, Trash2, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface DemoJob {
  id: string;
  title: string;
  slug: string;
  city: string;
  created_at: string;
  companies: { name: string } | null;
  applications: { count: number }[];
}

export default function DemoJobs() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [demoJobs, setDemoJobs] = useState<DemoJob[]>([]);
  const [deleteJobId, setDeleteJobId] = useState<string | null>(null);
  const [unsetDemoJobId, setUnsetDemoJobId] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchDemoJobs = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('jobs')
        .select(`
          id,
          title,
          slug,
          city,
          created_at,
          companies (name),
          applications (id)
        `)
        .eq('status', 'demo')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const jobsWithCount = data?.map(job => ({
        ...job,
        applications: [{ count: job.applications?.length || 0 }]
      })) || [];

      setDemoJobs(jobsWithCount);
    } catch (error) {
      console.error('Error fetching demo jobs:', error);
      toast.error('Kunde inte hämta demo-jobb');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDemoJobs();
  }, []);

  const totalApplications = demoJobs.reduce((sum, job) => sum + (job.applications[0]?.count || 0), 0);
  const avgApplications = demoJobs.length > 0 ? (totalApplications / demoJobs.length).toFixed(1) : '0';

  const handleUnsetDemo = async (jobId: string) => {
    setActionLoading(true);
    try {
      const { error } = await supabase
        .from('jobs')
        .update({ status: 'draft' })
        .eq('id', jobId);

      if (error) throw error;

      toast.success('Demo-status borttagen');
      fetchDemoJobs();
    } catch (error) {
      console.error('Error unsetting demo:', error);
      toast.error('Kunde inte ta bort demo-status');
    } finally {
      setActionLoading(false);
      setUnsetDemoJobId(null);
    }
  };

  const handleDeleteJob = async (jobId: string) => {
    setActionLoading(true);
    try {
      const { error } = await supabase
        .from('jobs')
        .delete()
        .eq('id', jobId);

      if (error) throw error;

      toast.success('Demo-jobb raderat');
      fetchDemoJobs();
    } catch (error) {
      console.error('Error deleting job:', error);
      toast.error('Kunde inte radera jobb');
    } finally {
      setActionLoading(false);
      setDeleteJobId(null);
    }
  };

  const jobToUnset = demoJobs.find(j => j.id === unsetDemoJobId);
  const jobToDelete = demoJobs.find(j => j.id === deleteJobId);

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">🎬 Demo-jobb</h1>
            <p className="text-muted-foreground">
              Hantera alla demo-jobb på ett ställe
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => navigate('/admin/applications?demo=1')}
              variant="outline"
            >
              <FileText className="h-4 w-4 mr-2" />
              Se alla ansökningar
            </Button>
            <Button
              onClick={() => navigate('/admin/jobs/new')}
            >
              <Plus className="h-4 w-4 mr-2" />
              Skapa demo-jobb
            </Button>
          </div>
        </div>

        {/* Statistics */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Aktiva demo-jobb
              </CardTitle>
              <Film className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{demoJobs.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Totalt ansökningar
              </CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalApplications}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Genomsnitt per jobb
              </CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{avgApplications}</div>
            </CardContent>
          </Card>
        </div>

        {/* Jobs List */}
        <Card>
          <CardHeader>
            <CardTitle>Demo-jobb</CardTitle>
            <CardDescription>
              Alla jobb markerade som demo för testning
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : demoJobs.length === 0 ? (
              <div className="text-center py-12">
                <Film className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Inga demo-jobb ännu</h3>
                <p className="text-muted-foreground mb-4">
                  Skapa ditt första demo-jobb för att testa systemet
                </p>
                <Button onClick={() => navigate('/admin/jobs/new')}>
                  <Plus className="h-4 w-4 mr-2" />
                  Skapa demo-jobb
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {demoJobs.map((job) => (
                  <div
                    key={job.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge className="bg-yellow-500/10 text-yellow-700 border-yellow-500/20">
                          🎬 DEMO
                        </Badge>
                        <h3 className="font-semibold">{job.title}</h3>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>{job.companies?.name || 'Inget företag'}</span>
                        <span>•</span>
                        <span>{job.city}</span>
                        <span>•</span>
                        <span>{job.applications[0]?.count || 0} ansökningar</span>
                        <span>•</span>
                        <span>
                          Skapad: {new Date(job.created_at).toLocaleDateString('sv-SE')}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          console.log('=== [DemoJobs] CLICK on Visa ===');
                          console.log('[DemoJobs] Job slug:', job.slug);
                          console.log('[DemoJobs] Job title:', job.title);
                          console.log('[DemoJobs] window.location.origin:', window.location.origin);
                          
                          const demoUrl = `${window.location.origin}/demo/${job.slug}`;
                          console.log('[DemoJobs] Full demo URL:', demoUrl);
                          console.log('[DemoJobs] Opening in new tab...');
                          
                          const newWindow = window.open(demoUrl, '_blank');
                          
                          if (!newWindow) {
                            console.error('[DemoJobs] ❌ Failed to open new window');
                            toast.error("Kunde inte öppna nytt fönster");
                          } else {
                            console.log('[DemoJobs] ✅ New window opened successfully');
                          }
                          
                          console.log('=== [DemoJobs] END ===');
                        }}
                      >
                        <ExternalLink className="h-4 w-4 mr-1" />
                        Visa
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate(`/admin/jobs/${job.id}/edit`)}
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        Redigera
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setUnsetDemoJobId(job.id)}
                        disabled={actionLoading}
                      >
                        <XCircle className="h-4 w-4 mr-1" />
                        Ta bort demo
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => setDeleteJobId(job.id)}
                        disabled={actionLoading}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Unset Demo Dialog */}
      <AlertDialog open={!!unsetDemoJobId} onOpenChange={() => setUnsetDemoJobId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Ta bort demo-status?</AlertDialogTitle>
            <AlertDialogDescription>
              Detta kommer att ändra jobbets status till "Utkast".
              {jobToUnset && jobToUnset.applications[0]?.count > 0 && (
                <span className="block mt-2 font-semibold text-yellow-600">
                  ⚠️ Detta jobb har {jobToUnset.applications[0].count} demo-ansökningar. 
                  Demo-ansökningarna förblir markerade som demo.
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={actionLoading}>Avbryt</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => unsetDemoJobId && handleUnsetDemo(unsetDemoJobId)}
              disabled={actionLoading}
            >
              {actionLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Ta bort demo-status
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Job Dialog */}
      <AlertDialog open={!!deleteJobId} onOpenChange={() => setDeleteJobId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Radera demo-jobb?</AlertDialogTitle>
            <AlertDialogDescription>
              Detta kommer att permanent radera jobbet och alla dess ansökningar.
              {jobToDelete && jobToDelete.applications[0]?.count > 0 && (
                <span className="block mt-2 font-semibold text-destructive">
                  ⚠️ Detta kommer att radera {jobToDelete.applications[0].count} ansökningar. 
                  Denna åtgärd kan inte ångras.
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={actionLoading}>Avbryt</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteJobId && handleDeleteJob(deleteJobId)}
              disabled={actionLoading}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {actionLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Radera permanent
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
}
