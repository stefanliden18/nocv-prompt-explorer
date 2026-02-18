import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { usePortalAuth } from '@/hooks/usePortalAuth';
import { Skeleton } from '@/components/ui/skeleton';

export default function PortalProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const { isPortalUser, loading: portalLoading } = usePortalAuth();

  if (authLoading || portalLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="space-y-4 w-64">
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (!isPortalUser) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-muted">
        <div className="bg-card p-8 rounded-lg shadow-card max-w-md text-center">
          <h2 className="text-xl font-heading font-bold text-foreground mb-2">Ingen kundportal kopplad</h2>
          <p className="text-muted-foreground">
            Ditt konto är inte kopplat till något företag. Kontakta NoCV för att få åtkomst.
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
