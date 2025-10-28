import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { RefreshCw, Database, CheckCircle, AlertCircle, Search } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function TaxonomyManager() {
  const { toast } = useToast();
  const [isResetting, setIsResetting] = useState(false);
  const [lastResult, setLastResult] = useState<any>(null);
  const [taxonomyStats, setTaxonomyStats] = useState<any>(null);
  const [isLoadingStats, setIsLoadingStats] = useState(false);
  const [isDiagnosing, setIsDiagnosing] = useState(false);
  const [diagnosisResult, setDiagnosisResult] = useState<any>(null);
  const [isTestingPartner, setIsTestingPartner] = useState(false);
  const [partnerTestResult, setPartnerTestResult] = useState<any>(null);

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

  const handleDiagnose = async () => {
    setIsDiagnosing(true);
    setDiagnosisResult(null);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/diagnose-af-taxonomy`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Okänt fel');
      }

      setDiagnosisResult(result);
      
      toast({
        title: "🔍 Diagnos klar!",
        description: `${result.summary.successfulTests}/${result.summary.totalTests} tester lyckades`,
      });
    } catch (error: any) {
      console.error('Error diagnosing taxonomy:', error);
      toast({
        title: "Fel vid diagnos",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsDiagnosing(false);
    }
  };

  const handleTestPartnerAPI = async () => {
    setIsTestingPartner(true);
    setPartnerTestResult(null);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/test-af-partner-concepts`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Okänt fel');
      }

      setPartnerTestResult(result);
      
      toast({
        title: result.success ? "✅ Test lyckades!" : "❌ Test misslyckades",
        description: result.conclusion,
        variant: result.success ? "default" : "destructive",
      });
    } catch (error: any) {
      console.error('Error testing partner API:', error);
      toast({
        title: "Fel vid test av Partner API",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsTestingPartner(false);
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

      {/* Partner API Test Card - PRIORITERAD */}
      <Card className="mb-6 border-2 border-primary">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-primary">
            <AlertCircle className="h-5 w-5" />
            STEG 4: Testa Partner API med AF:s Dokumentations-concept_id:n
          </CardTitle>
          <CardDescription>
            Testar publikation till AF Partner API med EXAKTA concept_id:n från AF:s egen dokumentation (Direct_Transferred_Job_Posting-4.pdf, sida 88-102).
            Om detta test misslyckas betyder det att AF:s dokumentation inte matchar deras Partner API.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert className="bg-blue-50 border-blue-200">
            <AlertDescription className="text-blue-800">
              <div className="font-semibold mb-2">🧪 Vad testas?</div>
              <div className="text-sm space-y-1">
                <div>• <strong>occupation</strong>: XMbW_XR6_Zeh (från AF doc exempel)</div>
                <div>• <strong>employmentType</strong>: PFZr_Syz_cUq (från AF doc exempel)</div>
                <div>• <strong>duration</strong>: a7uU_j21_mkL (från AF doc exempel)</div>
                <div>• <strong>municipality</strong>: jNrY_Gve_R9n (vår concept_id för Vallentuna)</div>
              </div>
            </AlertDescription>
          </Alert>

          <Button
            onClick={handleTestPartnerAPI}
            disabled={isTestingPartner}
            className="w-full"
            size="lg"
          >
            {isTestingPartner ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Testar Partner API...
              </>
            ) : (
              <>
                <AlertCircle className="mr-2 h-4 w-4" />
                Kör Partner API Test
              </>
            )}
          </Button>

          {partnerTestResult && (
            <div className="space-y-3">
              <Alert className={partnerTestResult.success ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"}>
                <AlertDescription className={partnerTestResult.success ? "text-green-800" : "text-red-800"}>
                  <div className="font-semibold mb-2">
                    {partnerTestResult.conclusion}
                  </div>
                  <div className="text-sm space-y-1 mt-3">
                    <div><strong>Status:</strong> {partnerTestResult.status}</div>
                    {partnerTestResult.afAdId && (
                      <div><strong>AF Ad ID:</strong> {partnerTestResult.afAdId}</div>
                    )}
                  </div>
                </AlertDescription>
              </Alert>

              {partnerTestResult.fieldErrors && (
                <div className="space-y-2">
                  <div className="text-sm font-semibold text-red-600">Fältfel från AF Partner API:</div>
                  {partnerTestResult.fieldErrors.map((err: any, idx: number) => (
                    <div key={idx} className="p-3 border border-red-200 rounded-lg bg-red-50">
                      <div className="text-xs space-y-1">
                        <div><strong>Fält:</strong> <code className="font-mono">{err.field}</code></div>
                        <div><strong>Meddelande:</strong> {err.message}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <details className="text-xs">
                <summary className="cursor-pointer font-semibold mb-2">Visa full testdata</summary>
                <pre className="bg-muted p-3 rounded overflow-auto max-h-96">
                  {JSON.stringify(partnerTestResult, null, 2)}
                </pre>
              </details>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Diagnose Card */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Diagnostisera AF API
          </CardTitle>
          <CardDescription>
            Kolla exakt vad AF Taxonomy API returnerar och om legacy-ams-taxonomy-id finns
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button
            onClick={handleDiagnose}
            disabled={isDiagnosing}
            variant="outline"
            className="w-full"
          >
            {isDiagnosing ? (
              <>
                <Search className="mr-2 h-4 w-4 animate-spin" />
                Diagnostiserar...
              </>
            ) : (
              <>
                <Search className="mr-2 h-4 w-4" />
                Kör Diagnos
              </>
            )}
          </Button>

          {diagnosisResult && (
            <div className="space-y-3">
              <Alert className={diagnosisResult.summary.testsWithLegacyId > 0 ? "bg-green-50 border-green-200" : "bg-yellow-50 border-yellow-200"}>
                <AlertDescription className={diagnosisResult.summary.testsWithLegacyId > 0 ? "text-green-800" : "text-yellow-800"}>
                  <div className="font-semibold mb-2">
                    {diagnosisResult.summary.conclusion}
                  </div>
                  <div className="text-sm space-y-1">
                    <div>Lyckade tester: {diagnosisResult.summary.successfulTests}/{diagnosisResult.summary.totalTests}</div>
                    <div>Med legacy-ams-taxonomy-id: {diagnosisResult.summary.testsWithLegacyId}/{diagnosisResult.summary.successfulTests}</div>
                  </div>
                </AlertDescription>
              </Alert>

              <div className="space-y-2 max-h-96 overflow-y-auto">
                {diagnosisResult.tests.map((test: any, idx: number) => (
                  <div key={idx} className="p-3 border rounded-lg bg-card">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-sm">{test.test}</span>
                      {test.success ? (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      ) : (
                        <AlertCircle className="h-4 w-4 text-red-600" />
                      )}
                    </div>
                    {test.success && (
                      <div className="text-xs space-y-1 text-muted-foreground">
                        <div>Legacy ID: {test.hasLegacyId ? (
                          <span className="text-green-600 font-mono">{test.legacyIdValue || 'null'}</span>
                        ) : (
                          <span className="text-red-600">❌ Saknas</span>
                        )}</div>
                        <div>Fält: {test.fields.join(', ')}</div>
                      </div>
                    )}
                    {test.error && (
                      <div className="text-xs text-red-600 mt-1">
                        Error: {test.error}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

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
