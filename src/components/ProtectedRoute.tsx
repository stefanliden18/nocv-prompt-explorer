import { Navigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
}

export default function ProtectedRoute({ children, requireAdmin = false }: ProtectedRouteProps) {
  const { user, role, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // Kolla om användaren har rätt roll för admin-området
  const hasAdminAccess = role === 'admin' || role === 'recruiter';

  if (requireAdmin && !hasAdminAccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="max-w-md w-full text-center space-y-6">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold text-destructive">Åtkomst nekad</h1>
            <p className="text-muted-foreground">
              Du har inte behörighet att komma åt admin-panelen. Endast administratörer och rekryterare har tillgång.
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              Din roll: <span className="font-semibold">{role}</span>
            </p>
          </div>
          <div className="flex flex-col gap-3">
            <Button asChild>
              <Link to="/">Tillbaka till startsidan</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/auth">Logga in med annat konto</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}