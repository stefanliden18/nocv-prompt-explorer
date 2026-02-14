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
import { JobFilterChips } from '@/components/JobFilterChips';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Settings2, X, Filter, CheckSquare, Archive, RotateCcw, Trash2, ArrowRight } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DragEndEvent } from '@dnd-kit/core';
import { Skeleton } from '@/components/ui/skeleton';
import { Checkbox } from '@/components/ui/checkbox';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { format } from 'date-fns';
import { sv } from 'date-fns/locale';

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
  status: string;
  company_name: string | null;
  application_count: number;
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
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showArchived, setShowArchived] = useState(false);
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
      .select('id, title, status, companies(name)')
      .in('status', ['published', 'inactive', 'draft'])
      .order('created_at', { ascending: false });

    if (error) {
      toast({
        title: 'Fel',
        description: 'Kunde inte hämta jobb',
        variant: 'destructive',
      });
      return;
    }

    // Count applications per job
    const { data: countData } = await supabase
      .from('applications')
      .select('job_id');

    const countMap: Record<string, number> = {};
    (countData || []).forEach(app => {
      countMap[app.job_id] = (countMap[app.job_id] || 0) + 1;
    });

    setJobs((data || []).map(job => ({
      id: job.id,
      title: job.title,
      status: job.status,
      company_name: (job.companies as any)?.name || null,
      application_count: countMap[job.id] || 0,
    })));
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

  const handleToggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleArchiveSelected = async () => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;

    const { error } = await supabase
      .from('applications')
      .update({ archived_at: new Date().toISOString() } as any)
      .in('id', ids);

    if (error) {
      toast({ title: 'Fel', description: 'Kunde inte arkivera kandidater', variant: 'destructive' });
      return;
    }

    toast({ title: 'Arkiverade', description: `${ids.length} kandidat(er) arkiverade` });
    setSelectedIds(new Set());
    setSelectionMode(false);
    fetchApplications();
  };

  const handleRestoreSelected = async () => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;

    const { error } = await supabase
      .from('applications')
      .update({ archived_at: null } as any)
      .in('id', ids);

    if (error) {
      toast({ title: 'Fel', description: 'Kunde inte återställa kandidater', variant: 'destructive' });
      return;
    }

    toast({ title: 'Återställda', description: `${ids.length} kandidat(er) återställda` });
    setSelectedIds(new Set());
    fetchApplications();
  };

  const handleDeleteSelected = async () => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;

    const { error } = await supabase
      .from('applications')
      .delete()
      .in('id', ids);

    if (error) {
      toast({ title: 'Fel', description: 'Kunde inte radera kandidater', variant: 'destructive' });
      return;
    }

    toast({ title: 'Raderade', description: `${ids.length} kandidat(er) permanent raderade` });
    setSelectedIds(new Set());
    setSelectionMode(false);
    fetchApplications();
  };

  const handleBulkMoveToStage = async (stageId: string) => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;

    // Optimistic update
    setApplications(prev =>
      prev.map(app =>
        ids.includes(app.id) ? { ...app, pipeline_stage_id: stageId } : app
      )
    );

    const { error } = await supabase
      .from('applications')
      .update({ pipeline_stage_id: stageId })
      .in('id', ids);

    if (error) {
      toast({ title: 'Fel', description: 'Kunde inte flytta kandidater', variant: 'destructive' });
      fetchApplications();
      return;
    }

    const stageName = stages.find(s => s.id === stageId)?.name || 'valt stadie';
    toast({ title: 'Flyttade', description: `${ids.length} kandidat(er) flyttade till ${stageName}` });
    setSelectedIds(new Set());
    setSelectionMode(false);
  };

  const getAllUniqueTags = (): MultiSelectOption[] => {
    const uniqueTags = new Set<string>();
    Object.values(tags).forEach(tagArray => {
      tagArray.forEach(tag => uniqueTags.add(tag.name));
    });
    return Array.from(uniqueTags).map(tag => ({ value: tag, label: tag }));
  };

  const archivedApplications = applications.filter(app => (app as any).archived_at);
  const activeApplications = applications.filter(app => !(app as any).archived_at);

  const filteredApplications = activeApplications.filter(app => {
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

  const handleToggleJob = (jobId: string) => {
    setSelectedJobIds(prev =>
      prev.includes(jobId) ? prev.filter(id => id !== jobId) : [...prev, jobId]
    );
  };

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
            <h1 className="text-2xl sm:text-3xl font-bold">
              {showArchived ? 'Arkiv' : 'Rekryteringstavla'}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {showArchived 
                ? `${archivedApplications.length} arkiverade kandidater`
                : `Visar ${filteredApplications.length} kandidater${selectedJobIds.length > 0 ? ` för ${selectedJobIds.length} jobb` : ''}`
              }
            </p>
          </div>

          <div className="flex flex-wrap gap-2 w-full sm:w-auto">
            {!showArchived && (
              <Button
                variant={selectionMode ? "default" : "outline"}
                onClick={() => {
                  setSelectionMode(!selectionMode);
                  setSelectedIds(new Set());
                }}
                className="w-full sm:w-auto"
              >
                <CheckSquare className="h-4 w-4 mr-2" />
                {selectionMode ? 'Avsluta markering' : 'Markera'}
              </Button>
            )}
            
            <Button
              variant={showArchived ? "default" : "outline"}
              onClick={() => {
                setShowArchived(!showArchived);
                setSelectionMode(false);
                setSelectedIds(new Set());
              }}
              className="w-full sm:w-auto"
            >
              <Archive className="h-4 w-4 mr-2" />
              {showArchived ? 'Tillbaka till tavlan' : `Arkiv (${archivedApplications.length})`}
            </Button>

            {!showArchived && (
              <Button
                variant="outline"
                onClick={() => setManagementDialogOpen(true)}
                className="w-full sm:w-auto"
              >
                <Settings2 className="h-4 w-4 mr-2" />
                Hantera stadier
              </Button>
            )}
          </div>
        </div>

        {/* Selection action bar */}
        {selectionMode && selectedIds.size > 0 && !showArchived && (
          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="py-3 px-4 flex flex-wrap items-center gap-3">
              <span className="text-sm font-medium">{selectedIds.size} markerade</span>
              
              <Select onValueChange={handleBulkMoveToStage}>
                <SelectTrigger className="w-[180px] h-9 text-sm">
                  <ArrowRight className="h-4 w-4 mr-1" />
                  <SelectValue placeholder="Flytta till..." />
                </SelectTrigger>
                <SelectContent>
                  {stages
                    .sort((a, b) => a.display_order - b.display_order)
                    .map((stage) => (
                      <SelectItem key={stage.id} value={stage.id}>
                        <div className="flex items-center gap-2">
                          <div
                            className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                            style={{ backgroundColor: stage.color }}
                          />
                          {stage.name}
                        </div>
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>

              <Button size="sm" variant="outline" onClick={handleArchiveSelected}>
                <Archive className="h-4 w-4 mr-2" />
                Arkivera
              </Button>

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button size="sm" variant="destructive">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Radera
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Radera {selectedIds.size} kandidat(er) permanent?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Detta kan inte ångras. Alla markerade kandidater och deras data kommer att tas bort permanent.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Avbryt</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDeleteSelected} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                      Radera permanent
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>

              <Button size="sm" variant="ghost" onClick={() => setSelectedIds(new Set())}>
                Avmarkera alla
              </Button>
            </CardContent>
          </Card>
        )}

        {showArchived ? (
          /* Archive view */
          <Card>
            <CardContent className="p-0">
              {archivedApplications.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">
                  <Archive className="h-12 w-12 mx-auto mb-3 opacity-30" />
                  <p>Arkivet är tomt</p>
                </div>
              ) : (
                <>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-10">
                          <Checkbox
                            checked={archivedApplications.length > 0 && archivedApplications.every(a => selectedIds.has(a.id))}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setSelectedIds(new Set(archivedApplications.map(a => a.id)));
                              } else {
                                setSelectedIds(new Set());
                              }
                            }}
                          />
                        </TableHead>
                        <TableHead>Kandidat</TableHead>
                        <TableHead>Jobb</TableHead>
                        <TableHead>Företag</TableHead>
                        <TableHead>Arkiverad</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {archivedApplications.map(app => (
                        <TableRow key={app.id}>
                          <TableCell>
                            <Checkbox
                              checked={selectedIds.has(app.id)}
                              onCheckedChange={() => handleToggleSelect(app.id)}
                            />
                          </TableCell>
                          <TableCell className="font-medium">{app.candidate_name}</TableCell>
                          <TableCell>{app.jobs?.title || '-'}</TableCell>
                          <TableCell>{app.jobs?.companies?.name || '-'}</TableCell>
                          <TableCell className="text-muted-foreground text-sm">
                            {(app as any).archived_at
                              ? format(new Date((app as any).archived_at), 'd MMM yyyy', { locale: sv })
                              : '-'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>

                  {selectedIds.size > 0 && (
                    <div className="p-4 border-t flex flex-wrap gap-2">
                      <Button size="sm" onClick={handleRestoreSelected}>
                        <RotateCcw className="h-4 w-4 mr-2" />
                        Återställ ({selectedIds.size})
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button size="sm" variant="destructive">
                            <Trash2 className="h-4 w-4 mr-2" />
                            Radera permanent ({selectedIds.size})
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Radera permanent?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Detta kommer att permanent radera {selectedIds.size} kandidat(er). Denna åtgärd kan inte ångras.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Avbryt</AlertDialogCancel>
                            <AlertDialogAction onClick={handleDeleteSelected}>
                              Radera permanent
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Jobbfilter med chips */}
            <JobFilterChips
              jobs={jobs}
              selectedJobIds={selectedJobIds}
              onToggleJob={handleToggleJob}
              onClearAll={() => setSelectedJobIds([])}
            />

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
              selectionMode={selectionMode}
              selectedIds={selectedIds}
              onToggleSelect={handleToggleSelect}
            />
          </>
        )}
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
