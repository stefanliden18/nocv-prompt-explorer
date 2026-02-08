import { useState } from "react";
import { AdminLayout } from "@/components/AdminLayout";
import { CustomerInterviewForm } from "@/components/CustomerInterviewForm";
import { SavedProfilesList } from "@/components/SavedProfilesList";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ClipboardList, FolderOpen } from "lucide-react";

interface EditProfileData {
  id: string;
  template_id: string;
  company_name: string;
  contact_person: string | null;
  desired_start_date: string | null;
  salary_range: string | null;
  profile_data: any;
  section_notes: any;
  linked_job_id: string | null;
}

const RequirementTemplates = () => {
  const [activeTab, setActiveTab] = useState<string>("new");
  const [editProfile, setEditProfile] = useState<EditProfileData | null>(null);

  const handleEditProfile = (profile: EditProfileData) => {
    setEditProfile(profile);
    setActiveTab("new");
  };

  const handleClearEdit = () => {
    setEditProfile(null);
  };

  return (
    <AdminLayout>
      <div className="container py-8 max-w-5xl">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="new" className="flex items-center gap-2">
              <ClipboardList className="h-4 w-4" />
              Ny kravprofil
            </TabsTrigger>
            <TabsTrigger value="library" className="flex items-center gap-2">
              <FolderOpen className="h-4 w-4" />
              Mina kravprofiler
            </TabsTrigger>
          </TabsList>

          <TabsContent value="new" className="mt-6">
            <CustomerInterviewForm 
              editProfile={editProfile} 
              onClearEdit={handleClearEdit}
            />
          </TabsContent>

          <TabsContent value="library" className="mt-6">
            <SavedProfilesList onEditProfile={handleEditProfile} />
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
};

export default RequirementTemplates;
