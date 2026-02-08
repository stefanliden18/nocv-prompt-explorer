import { AdminLayout } from "@/components/AdminLayout";
import { CustomerInterviewForm } from "@/components/CustomerInterviewForm";

const RequirementTemplates = () => {
  return (
    <AdminLayout>
      <div className="container py-8 max-w-5xl">
        <CustomerInterviewForm />
      </div>
    </AdminLayout>
  );
};

export default RequirementTemplates;
