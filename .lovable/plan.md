
# Fix: Förhandsvisning av utkast fungerar inte (timing-problem)

## Problemet

Koden vi lade till (`if (!isAdmin)`) är korrekt i sig, men det finns ett timing-problem:

1. Presentationssidan oppnas i en **ny flik**
2. I den nya fliken startar `isAdmin` som `false` (standardvardet)
3. `useEffect` kör `fetchPresentation()` direkt (beror bara på `token`)
4. Frågan körs med `isAdmin = false`, vilket lägger till `.eq('status', 'published')`
5. John Walkers presentation har `status = 'draft'` -- den hittas inte
6. Erst **efter** att frågan redan körts hinner auth-kontexten ladda och sätta `isAdmin = true`

Resultatet: admin ser "Presentationen hittades inte" trots att de är inloggade.

## Lösningen

Vänta tills auth har laddats klart innan frågan körs. AuthContext exponerar redan `loading` -- vi använder den.

### Ändring i src/pages/CandidatePresentation.tsx

**Steg 1** -- Hämta `loading` från auth-kontexten (utöver `isAdmin`):

```tsx
const { isAdmin, loading: authLoading } = useAuth();
```

**Steg 2** -- Lägg till `isAdmin` och `authLoading` i useEffect-beroendena och vänta tills auth är klar:

```tsx
useEffect(() => {
  if (authLoading) return; // Vänta tills auth är klar
  fetchPresentation();
}, [token, isAdmin, authLoading]);
```

**Steg 3** -- Visa laddningsskelett även medan auth laddar (uppdatera loading-checken):

```tsx
if (loading || authLoading) {
  return (
    <div className="min-h-screen bg-muted/30 p-4">
      ...skeleton...
    </div>
  );
}
```

### Varfor detta löser problemet

- `authLoading` startar som `true` medan sessionen hämtas
- `useEffect` väntar tills `authLoading` blir `false`
- Vid den tidpunkten har `isAdmin` rätt värde (`true` för admin)
- Frågan körs utan `.eq('status', 'published')` och John Walkers utkast hittas

### Sammanfattning

| Fil | Ändring |
|-----|---------|
| `CandidatePresentation.tsx` | Lägg till `authLoading` check innan frågan körs, uppdatera useEffect-beroenden |

En fil, tre små ändringar. Ingen databas- eller backend-ändring behövs.
