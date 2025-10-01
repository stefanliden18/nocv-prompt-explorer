import { AdminLayout } from '@/components/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

export default function AdminCompanies() {
  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Företag</h1>
            <p className="text-muted-foreground">Hantera företag</p>
          </div>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Nytt företag
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Alla företag</CardTitle>
            <CardDescription>
              Lista över alla företag i systemet
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Inga företag ännu. Klicka på "Nytt företag" för att lägga till ett företag.
            </p>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}