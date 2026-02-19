

## Utoka intervjuforslag till 3 alternativ + kopia till admin

### Nuvarande status

Ert system ar redan korrekt uppsatt vad galler:
- Kayvan ser BARA kandidater kopplade till Europeiska Motors positioner (RLS skyddar detta)
- Michael (admin) ar den enda som kan lagga till kandidater
- Matchningsprofiler kopplas av admin och visas for kunden

Tva saker behover andras:

### 1. Utoka fran 2 till 3 tidsforslag

Idag kan portalanvandaren (Kayvan) skicka 2 tidsalternativ till kandidaten. Ni vill ha 3.

**Databasandring:**
- Lagg till kolumnen `option_3_at` (timestamp with time zone, nullable) i tabellen `portal_interview_proposals`

**Frontend (`src/pages/portal/PortalBooking.tsx`):**
- Lagg till ett tredje datum/tid-falt (Alternativ 3)
- Uppdatera bekraftelsevyn att visa alla tre alternativ
- Uppdatera texten fran "2 alternativa tider" till "3 alternativa tider"

**Edge function (`supabase/functions/send-interview-proposal/index.ts`):**
- Lagg till formatering av option_3 i mejlmallen
- Visa tredje alternativet i kandidatmejlet

**Svarsida (`src/pages/InterviewRespond.tsx`):**
- Visa tre alternativ istallet for tva

### 2. Skicka kopia till admin vid tidsforslag

**Edge function (`supabase/functions/send-interview-proposal/index.ts`):**
- Slå upp alla admin-anvandare fran `user_roles` + `profiles` (for att hitta Michaels e-post)
- Alternativt: hamta admin-mejl fran auth.users via service role
- Skicka en kopia av forslaget till admin med rubriken "Kopia: Intervjuforslag — [Kandidatnamn]"
- Mejlet visar samma tider och detaljer sa admin har full insyn

### 3. Uppsattning av Europeiska Motor (datainmatning, EJ kodandring)

For att Kayvan ska kunna anvanda portalen behover foljande laggas in:
- Kayvans konto maste kopplas till Europeiska Motor i `company_users`
- Positioner (servicetekniker, skadetekniker, diagnostekniker) maste skapas under Europeiska Motor i `positions`
- Michael laggar sedan in kandidater mot dessa positioner via admin-panelen

Detta gor ni via er befintliga admin-panel (bjud in Kayvan via kundportalens inbjudningsfunktion och skapa positionerna dar).

### Teknisk plan

**Migration: Ny kolumn**
```sql
ALTER TABLE portal_interview_proposals 
ADD COLUMN option_3_at timestamptz;
```

**Fil 1: `src/pages/portal/PortalBooking.tsx`**
- Lagg till `date3` och `time3` i form-state
- Lagg till tredje tidsfalt i UI:t
- Skicka `option_3_at` vid insert
- Uppdatera valideringslogik och bekraftelsevy

**Fil 2: `supabase/functions/send-interview-proposal/index.ts`**
- Formatera och visa tredje alternativet i mejlmallen
- Hamta admin-mejladresser via `user_roles` + `auth.admin.getUserById`
- Skicka kopia-mejl till alla admins

**Fil 3: `src/pages/InterviewRespond.tsx`**
- Visa tredje alternativet om det finns

**Fil 4: `supabase/functions/confirm-interview-proposal/index.ts`**
- Hantera `chosen_option: 3` korrekt

### Sakerhet

Inga forandringar i RLS-policyer behovs. Befintliga policyer skyddar redan ratt:
- Portalanvandare kan bara se/skapa proposals for sitt eget foretags kandidater
- Bara admin kan lagga till kandidater
- Kandidater isoleras per foretag via positions-tabellen

