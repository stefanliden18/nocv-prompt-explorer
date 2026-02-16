

# Fix: "Oppna forhandsvisning" fungerar inte for utkast

## Problemet

Knappen "Oppna forhandsvisning" oppnar `/presentation/:token` i en ny flik. Men sidan (`CandidatePresentation.tsx`) filtrerar pa `status = 'published'` (rad 95), sa utkast ("draft") hittas aldrig. Dessutom kraver RLS-policyn for publik atkomst att `status = 'published'`.

Resultatet: admin klickar pa knappen, en ny flik oppnas, men presentationen visas inte eftersom den annu ar ett utkast.

## Losning

Ge inloggade admins mojlighet att forhandsgranska utkast genom att ta bort `status`-filtret i fragan nar anvandaren ar inloggad som admin, och behalla det for publika besokare.

### Andring i src/pages/CandidatePresentation.tsx

Uppdatera `fetchPresentation`-funktionen sa att:

1. Importera `useAuth` fran AuthContext
2. Om anvandaren ar admin: fraga utan `.eq('status', 'published')` -- detta fungerar tack vare den befintliga RLS-policyn "Admins can view all presentations"
3. Om anvandaren inte ar admin (publik besokare): behall filtret `.eq('status', 'published')` som forut
4. Visa en tydlig banner langst upp pa sidan nar presentationen ar ett utkast, sa att admin vet att det ar en forhandsvisning

### Tekniska detaljer

**Fil: src/pages/CandidatePresentation.tsx**

Steg 1 -- Importera `useAuth`:
```tsx
import { useAuth } from "@/contexts/AuthContext";
```

Steg 2 -- Anvand `useAuth` i komponenten:
```tsx
const { isAdmin } = useAuth();
```

Steg 3 -- Uppdatera fragan (rad 60-96):
```tsx
let query = supabase
  .from('candidate_presentations')
  .select(`...`) // samma select som idag
  .eq('share_token', token);

// Bara filtrera pa published for icke-admins
if (!isAdmin) {
  query = query.eq('status', 'published');
}

const { data, error: fetchError } = await query.maybeSingle();
```

Steg 4 -- Lagg till utkast-banner i renderingen:
```tsx
{data?.status === 'draft' && isAdmin && (
  <div className="bg-warning text-warning-foreground px-4 py-2 text-center text-sm font-medium">
    Forhandsvisning -- denna presentation ar annu inte publicerad
  </div>
)}
```

### Sammanfattning

| Fil | Andring |
|-----|---------|
| `CandidatePresentation.tsx` | Ta bort `status = published`-filter for admins, lagg till utkast-banner |

En fil, en enkel andring. Inga databas- eller backend-andringar behovs -- den befintliga RLS-policyn for admins tillater redan lasning av alla presentationer.
