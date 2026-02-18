
## Uppdatera intervjumailets ämnesrad

### Problem
Ämnesraden i intervjumailet visar bara "Inbjudan till intervju -- [datum] kl [tid]". Kunden vill att det ska stå företagsnamnet (t.ex. "Hedin Bil") i ämnesraden istället.

### Losning
Uppdatera edge-funktionen `send-portal-interview-invitation` att:

1. Hämta företagsnamnet genom att följa relationskedjan: `portal_interviews` -> `company_users` -> `companies`
2. Ändra ämnesraden från:
   - `Inbjudan till intervju — 5 juni 2025 kl 14:00`
   - till: `Inbjudan till intervju — Hedin Bil`
3. Uppdatera e-postmallens rubrik (h1) från "Inbjudan till intervju" till "Inbjudan till intervju" (behålla som är, den är redan bra)

### Teknisk detalj

I `supabase/functions/send-portal-interview-invitation/index.ts`:

- Utöka select-frågan på rad 41-42 till att även joina `companies`-tabellen via `company_users`:
  ```
  .select("*, portal_candidates(name, email), company_users(name, companies(name))")
  ```
- Extrahera företagsnamnet:
  ```
  const companyName = interview.company_users?.companies?.name || "";
  ```
- Ändra ämnesraden (rad 98) till:
  ```
  subject: `Inbjudan till intervju — ${companyName}`
  ```
- Skicka med `companyName` till e-postmallen och visa det i mailet så kandidaten vet vilket företag som bjuder in.

Inga databasändringar behövs.
