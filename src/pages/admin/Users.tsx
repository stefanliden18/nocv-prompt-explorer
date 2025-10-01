import { AdminLayout } from '@/components/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { Badge } from '@/components/ui/badge';

export default function AdminUsers() {
  const { user, isAdmin } = useAuth();

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Användare</h1>
          <p className="text-muted-foreground">Hantera användare och profiler</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Min profil</CardTitle>
            <CardDescription>
              Din användarinformation
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium">E-post</label>
              <p className="text-sm text-muted-foreground">{user?.email}</p>
            </div>
            <div>
              <label className="text-sm font-medium">Roll</label>
              <div className="mt-1">
                {isAdmin ? (
                  <Badge variant="default">Admin</Badge>
                ) : (
                  <Badge variant="secondary">Rekryterare</Badge>
                )}
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">Användar-ID</label>
              <p className="text-xs text-muted-foreground font-mono">{user?.id}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Alla användare</CardTitle>
            <CardDescription>
              Lista över alla användare i systemet
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Användarhantering kommer snart
            </p>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}