import { AdminLayout } from '@/components/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function AdminJobs() {
  const navigate = useNavigate();

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Jobb</h1>
            <p className="text-muted-foreground">Hantera jobbannonser</p>
          </div>
          <Button onClick={() => navigate('/admin/jobs/new')}>
            <Plus className="h-4 w-4 mr-2" />
            Nytt jobb
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Alla jobb</CardTitle>
            <CardDescription>
              Lista över alla jobbannonser i systemet
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Inga jobb ännu. Klicka på "Nytt jobb" för att skapa din första jobbannons.
            </p>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}