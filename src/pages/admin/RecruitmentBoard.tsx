import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/AdminLayout';
import { KanbanBoard } from '@/components/KanbanBoard';
import { StageManagementDialog } from '@/components/StageManagementDialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Settings2 } from 'lucide-react';
import { DragEndEvent } from '@dnd-kit/core';
import { Skeleton } from '@/components/ui/skeleton';

interface Stage {
  id: string;
  name: string;
  color: string;
  display_order: number;
}

interface Application {
  id: string;
  candidate_name: string;
  rating: number | null;
  job_id: string;
  pipeline_stage_id: string;
  jobs?: {
    title: string;
    companies?: {
      name: string;
    };
  };
}

interface Job {
  id: string;
  title: string;
}

export default function RecruitmentBoard() {
  const [stages, setStages] = useState<Stage[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [selectedJobId, setSelectedJobId] = useState<string>('all');
  const [tags, setTags] = useState<Record<string, Array<{ name: string }>>>({});
  const [managementDialogOpen, setManagementDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchData();
  }, [selectedJobId]);

  const fetchData = async () => {
    setLoading(true);
    await Promise.all([
      fetchStages(),
      fetchApplications(),
      fetchJobs(),
    ]);
    setLoading(false);
  };

  const fetchStages = async () => {
    const { data, error } = await supabase
      .from('pipeline_stages')
      .select('*')
      .order('display_order');

    if (error) {
      toast({
        title: 'Fel',
        description: 'Kunde inte hämta stadier',
        variant: 'destructive',
      });
      return;
    }

    setStages(data || []);
  };

  const fetchApplications = async () => {
    let query = supabase
      .from('applications')
      .select(`
        *,
        jobs (
          title,
          companies (
            name
          )
        )
      `);

    if (selectedJobId !== 'all') {
      query = query.eq('job_id', selectedJobId);
    }

    const { data, error } = await query;

    if (error) {
      toast({
        title: 'Fel',
        description: 'Kunde inte hämta ansökningar',
        variant: 'destructive',
      });
      return;
    }

    setApplications(data || []);
    
    // Fetch tags for all applications
    if (data && data.length > 0) {
      const { data: tagData } = await supabase
        .from('application_tag_relations')
        .select(`
          application_id,
          application_tags (
            name
          )
        `)
        .in('application_id', data.map(app => app.id));

      if (tagData) {
        const tagsByApplication: Record<string, Array<{ name: string }>> = {};
        tagData.forEach(relation => {
          if (!tagsByApplication[relation.application_id]) {
            tagsByApplication[relation.application_id] = [];
          }
          if (relation.application_tags) {
            tagsByApplication[relation.application_id].push({
              name: relation.application_tags.name
            });
          }
        });
        setTags(tagsByApplication);
      }
    }
  };

  const fetchJobs = async () => {
    const { data, error } = await supabase
      .from('jobs')
      .select('id, title')
      .order('created_at', { ascending: false });

    if (error) {
      toast({
        title: 'Fel',
        description: 'Kunde inte hämta jobb',
        variant: 'destructive',
      });
      return;
    }

    setJobs(data || []);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) return;

    const applicationId = active.id as string;
    const newStageId = over.id as string;

    // Optimistic update
    setApplications(prev =>
      prev.map(app =>
        app.id === applicationId
          ? { ...app, pipeline_stage_id: newStageId }
          : app
      )
    );

    // Database update
    const { error } = await supabase
      .from('applications')
      .update({ pipeline_stage_id: newStageId })
      .eq('id', applicationId);

    if (error) {
      toast({
        title: 'Fel',
        description: 'Kunde inte flytta kandidat',
        variant: 'destructive',
      });
      // Revert on error
      fetchApplications();
      return;
    }

    toast({
      title: 'Kandidat flyttad',
      description: 'Statusen har uppdaterats',
    });
  };

  const filteredApplications = applications;

  if (loading) {
    return (
      <AdminLayout>
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-10 w-32" />
          </div>
          <Skeleton className="h-10 w-64" />
          <div className="flex gap-4">
            {[1, 2, 3, 4].map(i => (
              <Skeleton key={i} className="w-80 h-[600px]" />
            ))}
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Rekryteringstavla</h1>
            <p className="text-muted-foreground mt-1">
              Visa: {filteredApplications.length} kandidater
            </p>
          </div>

          <Button
            variant="outline"
            onClick={() => setManagementDialogOpen(true)}
          >
            <Settings2 className="h-4 w-4 mr-2" />
            Hantera stadier
          </Button>
        </div>

        <div className="flex gap-4 items-center">
          <Select value={selectedJobId} onValueChange={setSelectedJobId}>
            <SelectTrigger className="w-64">
              <SelectValue placeholder="Välj jobb" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alla jobb</SelectItem>
              {jobs.map(job => (
                <SelectItem key={job.id} value={job.id}>
                  {job.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <KanbanBoard
          stages={stages}
          applications={filteredApplications}
          tags={tags}
          onDragEnd={handleDragEnd}
          onEditStage={() => setManagementDialogOpen(true)}
          onDeleteStage={() => setManagementDialogOpen(true)}
          onAddStage={() => setManagementDialogOpen(true)}
        />
      </div>

      <StageManagementDialog
        open={managementDialogOpen}
        onOpenChange={setManagementDialogOpen}
        onStagesUpdated={fetchData}
      />
    </AdminLayout>
  );
}
