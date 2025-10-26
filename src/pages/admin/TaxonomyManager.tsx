import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { RefreshCw, Database, CheckCircle, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function TaxonomyManager() {
  const { toast } = useToast();
  const [isResetting, setIsResetting] = useState(false);
  const [lastResult, setLastResult] = useState<any>(null);
  const [taxonomyStats, setTaxonomyStats] = useState<any>(null);
  const [isLoadingStats, setIsLoadingStats] = useState(false);

  const loadTaxonomyStats = async () => {
    setIsLoadingStats(true);
    try {
      const { data, error } = await supabase
        .from('af_taxonomy')
        .select('type')
        .eq('version', 16);

      if (error) throw error;

      // Count by type
      const stats = data.reduce((acc: any, item: any) => {
        acc[item.type] = (acc[item.type] || 0) + 1;
        return acc;
      }, {});

      setTaxonomyStats(stats);
    } catch (error: any) {
      console.error('Error loading stats:', error);
      toast({
        title: "Fel vid laddning av statistik",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoadingStats(false);
    }
  };

  const handleResetTaxonomy = async () => {
    if (!confirm('Är du säker på att du vill återställa all taxonomi-data? Detta kommer radera all befintlig data och ladda ny.')) {
      return;
    }

    setIsResetting(true);
    setLastResult(null);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/reset-af-taxonomy`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Okänt fel');
      }

      setLastResult(result);
      
      toast({
        title: "✅ Taxonomi återställd!",
        description: `${result.totalInserted} items importerade`,
      });

      // Reload stats
      await loadTaxonomyStats();
    } catch (error: any) {
      console.error('Error resetting taxonomy:', error);
      toast({
        title: "Fel vid återställning",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Taxonomi-hantering</h1>
        <p className="text-muted-foreground">
          Hantera Arbetsförmedlingens taxonomi-data (yrken, kommuner, anställningstyper, etc.)
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Reset Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <RefreshCw className="h-5 w-5" />
              Återställ Taxonomi-data
            </CardTitle>
            <CardDescription>
              Radera all befintlig data och ladda ny från AF's API (med fallback)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Detta kommer att radera all befintlig taxonomi-data och ersätta den med ny data.
                Operationen tar ca 5-10 sekunder.
              </AlertDescription>
            </Alert>

            <Button
              onClick={handleResetTaxonomy}
              disabled={isResetting}
              className="w-full"
              size="lg"
            >
              {isResetting ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Återställer...
                </>
              ) : (
                <>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Återställ Taxonomi-data
                </>
              )}
            </Button>

            {lastResult && (
              <Alert className="bg-green-50 border-green-200">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  <div className="font-semibold mb-2">✅ Framgång!</div>
                  <div className="text-sm space-y-1">
                    <div>Totalt inserterade: {lastResult.totalInserted}</div>
                    <div className="grid grid-cols-2 gap-1 mt-2">
                      {Object.entries(lastResult.summary).map(([type, count]) => (
                        <div key={type} className="text-xs">
                          • {type}: {count as number}
                        </div>
                      ))}
                    </div>
                  </div>
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Stats Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Nuvarande Status
            </CardTitle>
            <CardDescription>
              Antal poster per taxonomi-typ (version 16)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              onClick={loadTaxonomyStats}
              disabled={isLoadingStats}
              variant="outline"
              className="w-full"
            >
              {isLoadingStats ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Laddar...
                </>
              ) : (
                <>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Uppdatera Statistik
                </>
              )}
            </Button>

            {taxonomyStats && (
              <div className="space-y-2">
                <div className="text-sm font-semibold mb-3">Taxonomi-data:</div>
                {Object.entries(taxonomyStats).map(([type, count]) => (
                  <div key={type} className="flex justify-between items-center p-2 bg-muted rounded">
                    <span className="text-sm font-medium">{type}</span>
                    <span className="text-sm font-bold">{String(count)} st</span>
                  </div>
                ))}
                 <div className="flex justify-between items-center p-2 bg-primary/10 rounded mt-3">
                   <span className="text-sm font-bold">Totalt</span>
                   <span className="text-sm font-bold">
                     {String(Object.values(taxonomyStats).reduce((a: number, b: unknown) => a + Number(b), 0))} st
                   </span>
                 </div>
              </div>
            )}

            {!taxonomyStats && !isLoadingStats && (
              <Alert>
                <AlertDescription>
                  Klicka på "Uppdatera Statistik" för att se nuvarande data
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Info Card */}
      <Card>
        <CardHeader>
          <CardTitle>Om Taxonomi-data</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>
            Taxonomi-data kommer från Arbetsförmedlingens API och innehåller standardiserad information som:
          </p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li><strong>occupation-name</strong>: Yrkesbenämningar (ca 50 vanligaste)</li>
            <li><strong>municipality</strong>: Alla svenska kommuner (290 st)</li>
            <li><strong>employment-type</strong>: Anställningstyper (7 st)</li>
            <li><strong>duration</strong>: Varaktighet för anställning (4 st)</li>
            <li><strong>worktime-extent</strong>: Arbetstidsomfattning (2 st)</li>
          </ul>
          <p className="mt-3">
            <strong>Fallback-data:</strong> Om AF's API inte svarar används lokal fallback-data som garanterar att systemet alltid har uppdaterad information.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
