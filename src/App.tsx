import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import { ProfileNameDialog } from "./components/ProfileNameDialog";
import Index from "./pages/Index";
import Jobs from "./pages/Jobs";
import JobDetail from "./pages/JobDetail";
import Demo from "./pages/Demo";
import DemoJobDetail from "./pages/DemoJobDetail";
import Candidates from "./pages/Candidates";
import Companies from "./pages/Companies";
import Contact from "./pages/Contact";
import Auth from "./pages/Auth";
import AdminDashboard from "./pages/admin/Dashboard";
import AdminJobs from "./pages/admin/Jobs";
import AdminDemoJobs from "./pages/admin/DemoJobs";

import AdminApplications from "./pages/admin/Applications";
import ApplicationDetail from "./pages/admin/ApplicationDetail";
import CompareApplications from "./pages/admin/CompareApplications";
import AdminCompanies from "./pages/admin/Companies";
import AdminUsers from "./pages/admin/Users";
import ActivityLogs from "./pages/admin/ActivityLogs";
import JobForm from "./pages/admin/JobForm";
import JobEdit from "./pages/admin/JobEdit";
import JobPreview from "./pages/admin/JobPreview";
import RecruitmentBoard from "./pages/admin/RecruitmentBoard";
import JobLibrary from "./pages/admin/JobLibrary";
import NotFound from "./pages/NotFound";
import About from "./pages/About";
import AboutEdit from "./pages/admin/AboutEdit";
import ContactEdit from "./pages/admin/ContactEdit";
import CompaniesEdit from "./pages/admin/CompaniesEdit";
import GDPRPolicyEdit from "./pages/admin/GDPRPolicyEdit";
import RequirementTemplates from "./pages/admin/RequirementTemplates";
import CandidatePresentation from "./pages/CandidatePresentation";
import HowItWorks from "./pages/HowItWorks";
import InterviewRespond from "./pages/InterviewRespond";
import MetaPixel from "./components/MetaPixel";
import PortalProtectedRoute from "./components/portal/PortalProtectedRoute";
import PortalDashboard from "./pages/portal/PortalDashboard";
import PortalPositions from "./pages/portal/PortalPositions";
import PortalCandidateList from "./pages/portal/PortalCandidateList";
import PortalCandidateProfile from "./pages/portal/PortalCandidateProfile";
import PortalBooking from "./pages/portal/PortalBooking";
import PortalInterviews from "./pages/portal/PortalInterviews";
import PortalSettings from "./pages/portal/PortalSettings";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <BrowserRouter>
        <AuthProvider>
          <Toaster />
        <Sonner />
        <MetaPixel />
        <ProfileNameDialog />
        <Routes>
            <Route path="/" element={<Index />} />
          <Route path="/jobs" element={<Jobs />} />
          <Route path="/jobb/:slug" element={<JobDetail />} />
          <Route path="/jobs/:id" element={<JobDetail />} />
          <Route path="/demo" element={<Demo />} />
          <Route path="/demo/:slug" element={<DemoJobDetail />} />
            <Route path="/candidates" element={<Candidates />} />
            <Route path="/companies" element={<Companies />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/om-oss" element={<About />} />
            <Route path="/sa-funkar-det" element={<HowItWorks />} />
            <Route path="/auth" element={<Auth />} />
            <Route 
              path="/admin" 
              element={
                <ProtectedRoute requireAdmin>
                  <AdminDashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin/jobs" 
              element={
                <ProtectedRoute requireAdmin>
                  <AdminJobs />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin/demo-jobs" 
              element={
                <ProtectedRoute requireAdmin>
                  <AdminDemoJobs />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin/jobs/new" 
              element={
                <ProtectedRoute requireAdmin>
                  <JobForm />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin/jobs/:id/edit" 
              element={
                <ProtectedRoute requireAdmin>
                  <JobEdit />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin/jobs/:id/preview" 
              element={
                <ProtectedRoute requireAdmin>
                  <JobPreview />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin/applications" 
              element={
                <ProtectedRoute requireAdmin>
                  <AdminApplications />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin/applications/:id" 
              element={
                <ProtectedRoute requireAdmin>
                  <ApplicationDetail />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin/applications/compare" 
              element={
                <ProtectedRoute requireAdmin>
                  <CompareApplications />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin/recruitment-board" 
              element={
                <ProtectedRoute requireAdmin>
                  <RecruitmentBoard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin/job-library" 
              element={
                <ProtectedRoute requireAdmin>
                  <JobLibrary />
                </ProtectedRoute>
              } 
            />
            <Route
              path="/admin/companies"
              element={
                <ProtectedRoute requireAdmin>
                  <AdminCompanies />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin/users" 
              element={
                <ProtectedRoute requireAdmin>
                  <AdminUsers />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin/activity" 
              element={
                <ProtectedRoute requireAdmin>
                  <ActivityLogs />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin/about/edit" 
              element={
                <ProtectedRoute requireAdmin>
                  <AboutEdit />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin/contact/edit" 
              element={
                <ProtectedRoute requireAdmin>
                  <ContactEdit />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin/companies/edit" 
              element={
                <ProtectedRoute requireAdmin>
                  <CompaniesEdit />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin/gdpr-policy" 
              element={
                <ProtectedRoute requireAdmin>
                  <GDPRPolicyEdit />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin/requirement-templates" 
              element={
                <ProtectedRoute requireAdmin>
                  <RequirementTemplates />
                </ProtectedRoute>
              } 
            />
            {/* Portal routes */}
            <Route path="/portal" element={<PortalProtectedRoute><PortalDashboard /></PortalProtectedRoute>} />
            <Route path="/portal/positions" element={<PortalProtectedRoute><PortalPositions /></PortalProtectedRoute>} />
            <Route path="/portal/positions/:id/candidates" element={<PortalProtectedRoute><PortalCandidateList /></PortalProtectedRoute>} />
            <Route path="/portal/candidates/:id" element={<PortalProtectedRoute><PortalCandidateProfile /></PortalProtectedRoute>} />
            <Route path="/portal/candidates/:id/book" element={<PortalProtectedRoute><PortalBooking /></PortalProtectedRoute>} />
            <Route path="/portal/interviews" element={<PortalProtectedRoute><PortalInterviews /></PortalProtectedRoute>} />
            <Route path="/portal/settings" element={<PortalProtectedRoute><PortalSettings /></PortalProtectedRoute>} />
            {/* Public candidate presentation route */}
            <Route path="/presentation/:token" element={<CandidatePresentation />} />
            {/* Public interview response page */}
            <Route path="/interview-respond/:token" element={<InterviewRespond />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  </QueryClientProvider>
);

export default App;
