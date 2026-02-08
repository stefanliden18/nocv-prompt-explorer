import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle 
} from "@/components/ui/alert-dialog";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  FolderOpen, 
  Search, 
  Trash2, 
  FileEdit, 
  Link2, 
  ExternalLink,
  Calendar,
  Building2,
  Loader2
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { sv } from "date-fns/locale";

interface SavedProfile {
  id: string;
  created_by: string;
  template_id: string;
  company_name: string;
  contact_person: string | null;
  desired_start_date: string | null;
  salary_range: string | null;
  profile_data: any;
  section_notes: any;
  linked_job_id: string | null;
  created_at: string;
  updated_at: string;
  requirement_templates?: {
    display_name: string;
    role_key: string;
  };
  jobs?: {
    id: string;
    title: string;
    status: string;
  } | null;
}

interface SavedProfilesListProps {
  onEditProfile: (profile: SavedProfile) => void;
}

export function SavedProfilesList({ onEditProfile }: SavedProfilesListProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "draft" | "linked">("all");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [profileToDelete, setProfileToDelete] = useState<string | null>(null);

  const { data: profiles, isLoading } = useQuery({
    queryKey: ['saved-requirement-profiles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('saved_requirement_profiles')
        .select(`
          *,
          requirement_templates(display_name, role_key),
          jobs(id, title, status)
        `)
        .order('updated_at', { ascending: false });
      
      if (error) throw error;
      return data as SavedProfile[];
    },
    enabled: !!user
  });

  const deleteMutation = useMutation({
    mutationFn: async (profileId: string) => {
      const { error } = await supabase
        .from('saved_requirement_profiles')
        .delete()
        .eq('id', profileId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['saved-requirement-profiles'] });
      toast.success('Kravprofil borttagen');
      setDeleteDialogOpen(false);
      setProfileToDelete(null);
    },
    onError: (error: any) => {
      toast.error('Kunde inte ta bort profilen: ' + error.message);
    }
  });

  const filteredProfiles = profiles?.filter(profile => {
    // Search filter
    const matchesSearch = searchTerm === "" || 
      profile.company_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      profile.requirement_templates?.display_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      profile.contact_person?.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Status filter
    const matchesStatus = filterStatus === "all" ||
      (filterStatus === "linked" && profile.linked_job_id) ||
      (filterStatus === "draft" && !profile.linked_job_id);
    
    return matchesSearch && matchesStatus;
  });

  const handleDeleteClick = (profileId: string) => {
    setProfileToDelete(profileId);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (profileToDelete) {
      deleteMutation.mutate(profileToDelete);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <FolderOpen className="h-5 w-5 text-primary" />
          Mina kravprofiler
        </h2>
        <p className="text-muted-foreground text-sm mt-1">
          {profiles?.length || 0} sparade kravprofiler
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Sök på företag, kontaktperson eller tjänstetyp..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={filterStatus} onValueChange={(val) => setFilterStatus(val as any)}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Filtrera status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alla profiler</SelectItem>
            <SelectItem value="draft">Endast utkast</SelectItem>
            <SelectItem value="linked">Kopplade till jobb</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Profile List */}
      {filteredProfiles && filteredProfiles.length > 0 ? (
        <div className="space-y-3">
          {filteredProfiles.map((profile) => (
            <Card key={profile.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  {/* Profile info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-medium truncate">
                        {profile.requirement_templates?.display_name.replace(' - Kravprofil', '') || 'Okänd tjänstetyp'}
                      </h3>
                      {profile.linked_job_id ? (
                        <Badge variant="default" className="shrink-0">
                          <Link2 className="h-3 w-3 mr-1" />
                          Kopplad
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="shrink-0">
                          Utkast
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground flex-wrap">
                      <span className="flex items-center gap-1">
                        <Building2 className="h-3.5 w-3.5" />
                        {profile.company_name}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5" />
                        {format(new Date(profile.updated_at), 'd MMM yyyy', { locale: sv })}
                      </span>
                      {profile.contact_person && (
                        <span className="hidden sm:inline">{profile.contact_person}</span>
                      )}
                    </div>
                    {profile.jobs && (
                      <div className="mt-2 text-sm">
                        <span className="text-muted-foreground">Jobb: </span>
                        <span className="font-medium">{profile.jobs.title}</span>
                        <Badge variant="outline" className="ml-2 text-xs">
                          {profile.jobs.status === 'published' ? 'Publicerat' : 
                           profile.jobs.status === 'draft' ? 'Utkast' : profile.jobs.status}
                        </Badge>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onEditProfile(profile)}
                    >
                      <FileEdit className="h-4 w-4 mr-1" />
                      Öppna
                    </Button>
                    {profile.linked_job_id && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(`/admin/jobs/${profile.linked_job_id}/edit`, '_blank')}
                      >
                        <ExternalLink className="h-4 w-4 mr-1" />
                        Visa jobb
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => handleDeleteClick(profile.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="border-dashed">
          <CardContent className="py-16 text-center">
            <FolderOpen className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
            {searchTerm || filterStatus !== "all" ? (
              <>
                <p className="text-muted-foreground">Inga kravprofiler matchar din sökning</p>
                <Button 
                  variant="link" 
                  className="mt-2"
                  onClick={() => {
                    setSearchTerm("");
                    setFilterStatus("all");
                  }}
                >
                  Rensa filter
                </Button>
              </>
            ) : (
              <>
                <p className="text-muted-foreground">Du har inga sparade kravprofiler ännu</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Skapa en ny kravprofil i "Ny kravprofil"-fliken
                </p>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* Delete confirmation dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Ta bort kravprofil?</AlertDialogTitle>
            <AlertDialogDescription>
              Denna åtgärd kan inte ångras. Kravprofilen kommer att tas bort permanent.
              {profileToDelete && profiles?.find(p => p.id === profileToDelete)?.linked_job_id && (
                <span className="block mt-2 text-amber-600">
                  OBS: Profilen är kopplad till ett jobb. Kopplingen kommer att tas bort.
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Avbryt</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                'Ta bort'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
