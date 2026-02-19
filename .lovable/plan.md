
## Skicka bekräftelsemejl till bokaren vid intervjubokning

### Vad som andras
Edge-funktionen `send-portal-interview-invitation` utökas så att den, förutom att skicka kallelse till kandidaten, även skickar ett bekräftelsemejl med kalenderinbjudan (.ics) till den portalanvändare som bokade intervjun.

### Detaljer

**Kalenderhändelsens titel för bokaren:** "Intervju med [Kandidatnamn]" (t.ex. "Intervju med Anna Svensson")

**Bokarens e-post:** Hämtas via `company_users.user_id` genom `supabase.auth.admin.getUserById()` (service role), eftersom e-postadressen finns i auth-systemet men inte i `company_users`-tabellen.

**Mejlet till bokaren** innehåller:
- Ämnesrad: "Bekräftelse: Intervju med [Kandidatnamn] — [Datum]"
- Sammanfattning av bokningsdetaljer (datum, tid, längd, plats)
- Bifogad .ics-fil med titeln "Intervju med [Kandidatnamn]"

### Teknisk plan

**Fil:** `supabase/functions/send-portal-interview-invitation/index.ts`

1. **Hämta bokarens e-post** -- Efter att intervjudata hämtats, anropa `supabaseAdmin.auth.admin.getUserById(interview.company_users.user_id)` för att få bokarens e-postadress. Detta kräver att `user_id` inkluderas i select-frågan (ändra till `company_users(name, user_id, companies(name))`).

2. **Skapa en separat .ics-fil för bokaren** med `summary: "Intervju med [kandidatnamn]"`.

3. **Skapa en bekräftelse-e-postmall** riktad till bokaren (t.ex. "Hej [Bokarnamn], din intervju med [Kandidatnamn] är bekräftad...").

4. **Skicka mejlet** via Resend till bokarens e-postadress, med .ics-filen bifogad.

5. **Felhantering** -- Om bokarens mejl misslyckas loggas felet men det påverkar inte kandidatens mejl (kandidatens mejl skickas först, bokarens mejl är ett separat anrop).

### Vad som inte andras
- Kandidatens mejl och .ics-fil är oförändrade
- Ingen databasändring behövs
- Bokningsflödet i portalen (PortalBooking.tsx) behöver inte ändras
