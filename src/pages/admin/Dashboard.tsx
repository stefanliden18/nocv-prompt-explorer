import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';

export default function AdminDashboard() {
  const { user, signOut } = useAuth();

  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Admin Dashboard</h1>
          <p className="text-muted-foreground">Välkommen, {user?.email}</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle>Användare</CardTitle>
              <CardDescription>Hantera systemanvändare</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Se och hantera alla användare i systemet
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Jobblistor</CardTitle>
              <CardDescription>Hantera jobblistor</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Skapa och redigera jobblistor
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Inställningar</CardTitle>
              <CardDescription>Systeminställningar</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Konfigurera systemet
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="mt-8">
          <Button onClick={signOut} variant="outline">
            Logga ut
          </Button>
        </div>
      </main>
      <Footer />
    </div>
  );
}