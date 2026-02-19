
## Visa och redigera namn i admin-användartabellen

### Vad som andras

En ny kolumn "Namn" laggs till i användartabellen pa admin-sidan. Administratorer kan redigera for- och efternamn pa vilken anvandare som helst via en ny menyval i atgardsmenyn (tre-pricks-menyn).

### Hur det kommer se ut

Tabellen far en ny kolumn "Namn" mellan E-post och Roll. Om namn saknas visas texten i gratt ("Ej angivet"). I atgardsmenyn (...) laggs ett nytt alternativ "Andra namn" till.

### Teknisk plan

**Fil 1: `supabase/functions/get-users/index.ts`**
- Uppdatera select-queryn att inkludera `first_name` och `last_name` fran profiles-tabellen
- Dessa skickas med i svaret till frontend

**Fil 2: `src/pages/admin/Users.tsx`**
- Utoka `UserData`-interfacet med `first_name` och `last_name`
- Lagg till kolumnen "Namn" i tabellen
- Lagg till state och hantering for en ny "AdminEditNameDialog"
- Lagg till menyval "Andra namn" i dropdown-menyn

**Fil 3: `src/components/AdminEditNameDialog.tsx` (ny fil)**
- En dialog med tva inputfalt: Fornamn och Efternamn
- Sparar via Supabase direkt till profiles-tabellen (med service role via edge function, eftersom admin behover uppdatera andra anvandares profiler)

**Fil 4: `supabase/functions/admin-update-profile/index.ts` (ny edge function)**
- Tar emot `userId`, `firstName`, `lastName`
- Verifierar att anroparen ar admin
- Uppdaterar profiles-tabellen med service role key

### Sakerhet
- Edge functionen kontrollerar att anroparen har admin-roll innan nagon uppdatering gors
- Vanliga anvandare kan bara andra sitt eget namn via den befintliga ProfileNameDialog
