import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/AdminLayout';
import { KanbanBoard } from '@/components/KanbanBoard';
import { StageManagementDialog } from '@/components/StageManagementDialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { MultiSelect, MultiSelectWithBadges, type MultiSelectOption } from '@/components/ui/multi-select';
import { AIChat } from '@/components/AIChat';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Settings2, X, Filter } from 'lucide-react';
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
  const [selectedJobIds, setSelectedJobIds] = useState<string[]>([]);
  const [tags, setTags] = useState<Record<string, Array<{ name: string }>>>({});
  const [managementDialogOpen, setManagementDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [ratingFilter, setRatingFilter] = useState<string[]>([]);
  const [tagFilter, setTagFilter] = useState<string[]>([]);
  const [showDemoApplications, setShowDemoApplications] = useState<boolean>(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchData();
  }, [selectedJobIds]);

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

    if (selectedJobIds.length > 0) {
      query = query.in('job_id', selectedJobIds);
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

  const getAllUniqueTags = (): MultiSelectOption[] => {
    const uniqueTags = new Set<string>();
    Object.values(tags).forEach(tagArray => {
      tagArray.forEach(tag => uniqueTags.add(tag.name));
    });
    return Array.from(uniqueTags).map(tag => ({ value: tag, label: tag }));
  };

  const filteredApplications = applications.filter(app => {
    // Demo filter
    if (!showDemoApplications && (app as any).is_demo) {
      return false;
    }

    // Fritextsökning (namn, jobb, företag)
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesName = app.candidate_name.toLowerCase().includes(query);
      const matchesJob = app.jobs?.title.toLowerCase().includes(query);
      const matchesCompany = app.jobs?.companies?.name.toLowerCase().includes(query);
      
      if (!matchesName && !matchesJob && !matchesCompany) {
        return false;
      }
    }
    
    // Rating-filter
    if (ratingFilter.length > 0) {
      if (!app.rating || !ratingFilter.includes(app.rating.toString())) {
        return false;
      }
    }
    
    // Tagg-filter
    if (tagFilter.length > 0) {
      const appTags = tags[app.id]?.map(t => t.name) || [];
      const hasMatchingTag = tagFilter.some(tag => appTags.includes(tag));
      if (!hasMatchingTag) {
        return false;
      }
    }
    
    return true;
  });

  const clearFilters = () => {
    setSearchQuery('');
    setRatingFilter([]);
    setTagFilter([]);
  };

  const hasActiveFilters = searchQuery || ratingFilter.length > 0 || tagFilter.length > 0;

  const ratingOptions: MultiSelectOption[] = [
    { value: '5', label: '5 stjärnor' },
    { value: '4', label: '4 stjärnor' },
    { value: '3', label: '3 stjärnor' },
    { value: '2', label: '2 stjärnor' },
    { value: '1', label: '1 stjärna' },
  ];

  const jobOptions: MultiSelectOption[] = jobs.map(job => ({
    value: job.id,
    label: job.title,
  }));

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
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">Rekryteringstavla</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Visa: {filteredApplications.length} kandidater
            </p>
          </div>

          <Button
            variant="outline"
            onClick={() => setManagementDialogOpen(true)}
            className="w-full sm:w-auto"
          >
            <Settings2 className="h-4 w-4 mr-2" />
            Hantera stadier
          </Button>
        </div>

        {/* Jobb-filter med badges */}
        <div className="space-y-3">
          <div className="flex gap-3 items-start flex-wrap">
            <MultiSelect
              options={jobOptions}
              selected={selectedJobIds}
              onChange={setSelectedJobIds}
              placeholder="Välj jobb att visa"
              className="w-64"
            />
            
            {selectedJobIds.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedJobIds([])}
              >
                Visa alla jobb
              </Button>
            )}
          </div>

          {selectedJobIds.length > 0 && (
            <div className="flex gap-2 flex-wrap">
              {selectedJobIds.map(jobId => {
                const job = jobs.find(j => j.id === jobId);
                if (!job) return null;
                
                return (
                  <Badge key={jobId} variant="secondary" className="gap-1">
                    {job.title}
                    <X 
                      className="h-3 w-3 cursor-pointer hover:text-destructive" 
                      onClick={() => setSelectedJobIds(prev => 
                        prev.filter(id => id !== jobId)
                      )}
                    />
                  </Badge>
                );
              })}
            </div>
          )}
        </div>

        {/* Sök- och filter-sektion */}
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
            <div className="w-full sm:flex-1 sm:min-w-64">
              <Input
                placeholder="Sök på namn, jobb eller företag..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full"
              />
            </div>
            
            <MultiSelect
              options={ratingOptions}
              selected={ratingFilter}
              onChange={setRatingFilter}
              placeholder="Filtrera på betyg"
              className="w-full sm:w-auto"
            />
            
            <MultiSelect
              options={getAllUniqueTags()}
              selected={tagFilter}
              onChange={setTagFilter}
              placeholder="Filtrera på taggar"
              className="w-full sm:w-auto"
            />
            
            {hasActiveFilters && (
              <Button variant="outline" size="sm" onClick={clearFilters} className="w-full sm:w-auto">
                <Filter className="h-4 w-4 mr-2" />
                Rensa filter
              </Button>
            )}
          </div>

          {/* Demo-filter */}
          <Card className="bg-muted/50">
            <CardContent className="py-3 px-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="bg-yellow-500/10 text-yellow-700 border-yellow-500/20">
                  🎬 DEMO
                </Badge>
                <span className="text-sm text-muted-foreground">
                  Visa demo-ansökningar
                </span>
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showDemoApplications}
                  onChange={(e) => setShowDemoApplications(e.target.checked)}
                  className="h-4 w-4 rounded border-border"
                />
                <span className="text-sm">
                  {showDemoApplications ? 'Visa' : 'Dölj'}
                </span>
              </label>
            </CardContent>
          </Card>
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

      <AIChat 
        context={{
          selectedJobIds,
          searchQuery,
          ratingFilter,
          tagFilter
        }}
      />
    </AdminLayout>
  );
}
