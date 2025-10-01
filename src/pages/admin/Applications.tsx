import { AdminLayout } from '@/components/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function AdminApplications() {
  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Ansökningar</h1>
          <p className="text-muted-foreground">Hantera alla ansökningar</p>
        </div>

        <Tabs defaultValue="new" className="w-full">
          <TabsList>
            <TabsTrigger value="new">Nya</TabsTrigger>
            <TabsTrigger value="viewed">Granskade</TabsTrigger>
            <TabsTrigger value="booked">Bokade</TabsTrigger>
            <TabsTrigger value="rejected">Avvisade</TabsTrigger>
          </TabsList>

          <TabsContent value="new" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Nya ansökningar</CardTitle>
                <CardDescription>
                  Ansökningar som ännu inte granskats
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Inga nya ansökningar
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="viewed" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Granskade ansökningar</CardTitle>
                <CardDescription>
                  Ansökningar som har granskats
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Inga granskade ansökningar
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="booked" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Bokade ansökningar</CardTitle>
                <CardDescription>
                  Ansökningar som har bokats för intervju
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Inga bokade ansökningar
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="rejected" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Avvisade ansökningar</CardTitle>
                <CardDescription>
                  Ansökningar som har avvisats
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Inga avvisade ansökningar
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}