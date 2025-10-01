import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Index from "./pages/Index";
import Jobs from "./pages/Jobs";
import JobDetail from "./pages/JobDetail";
import Candidates from "./pages/Candidates";
import Companies from "./pages/Companies";
import Contact from "./pages/Contact";
import Auth from "./pages/Auth";
import AdminDashboard from "./pages/admin/Dashboard";
import AdminJobs from "./pages/admin/Jobs";
import JobImport from "./pages/admin/JobImport";
import AdminApplications from "./pages/admin/Applications";
import ApplicationDetail from "./pages/admin/ApplicationDetail";
import AdminCompanies from "./pages/admin/Companies";
import AdminUsers from "./pages/admin/Users";
import JobForm from "./pages/admin/JobForm";
import JobEdit from "./pages/admin/JobEdit";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <BrowserRouter>
      <AuthProvider>
        <Toaster />
        <Sonner />
        <Routes>
            <Route path="/" element={<Index />} />
          <Route path="/jobs" element={<Jobs />} />
          <Route path="/jobb/:slug" element={<JobDetail />} />
          <Route path="/jobs/:id" element={<JobDetail />} />
            <Route path="/candidates" element={<Candidates />} />
            <Route path="/companies" element={<Companies />} />
            <Route path="/contact" element={<Contact />} />
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
              path="/admin/jobs/new" 
              element={
                <ProtectedRoute requireAdmin>
                  <JobForm />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin/jobs/import" 
              element={
                <ProtectedRoute requireAdmin>
                  <JobImport />
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
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  </QueryClientProvider>
);

export default App;
