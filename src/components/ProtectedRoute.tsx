import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
}

export default function ProtectedRoute({ children, requireAdmin = false }: ProtectedRouteProps) {
  const { user, isAdmin, loading } = useAuth();

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

  if (requireAdmin && !isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="max-w-md w-full text-center space-y-6">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold text-destructive">Åtkomst nekad</h1>
            <p className="text-muted-foreground">
              Du har inte behörighet att komma åt admin-panelen.
            </p>
          </div>
          <div className="flex flex-col gap-3">
            <Button asChild>
              <a href="/">Tillbaka till startsidan</a>
            </Button>
            <Button variant="outline" asChild>
              <a href="/auth">Logga in med annat konto</a>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}