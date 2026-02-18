

# Inbjudningsflode for kundportal-anvandare

## Oversikt
Bygga ett admin-granssnitt dar NoCV-admins kan bjuda in kundportal-anvandare. Flödet: admin valjer foretag, anger e-post och namn, skickar inbjudan. Systemet skapar auth-anvandare, `company_users`-koppling och skickar portalspecifikt valkomstmail.

## Komponenter som skapas/andras

### 1. Ny komponent: `PortalUserInviteDialog`
En dialog med:
- Dropdown for att valja foretag (hamtas fran `companies`-tabellen)
- Inputfalt for e-post och namn
- Knapp "Skicka inbjudan"

Placeras pa admin Users-sidan (`/admin/users`) med en extra knapp "Bjud in portalanvandare" bredvid den befintliga "Ny anvandare"-knappen.

### 2. Ny edge function: `invite-portal-user`
Hanterar hela flödet server-side:
1. Validerar att anroparen ar admin (via `getClaims`)
2. Skapar auth-anvandare via `supabase.auth.admin.inviteUserByEmail`
3. Skapar `company_users`-rad som kopplar anvandaren till valt foretag (med namn och roll "viewer")
4. Anropar `send-portal-invitation` for att skicka valkomstmail

### 3. Ny edge function: `send-portal-invitation`
Skickar portal-specifikt valkomstmail via Resend med:
- Foretagsnamn
- Lanken pekar till `/auth` (samma inloggningssida)
- Portal-specifik design och text som forklarar att de kan se kandidater och boka intervjuer

### 4. Andring i `src/pages/admin/Users.tsx`
- Lagg till knappen "Bjud in portalanvandare"
- Importera och rendera `PortalUserInviteDialog`

## Tekniska detaljer

### Edge function: `invite-portal-user`
```text
supabase/functions/invite-portal-user/index.ts

Input: { email, name, companyId }
1. Validera admin via getClaims()
2. Skapa Supabase admin-klient med service role
3. Kolla om anvandare redan finns (listUsers)
   - Om ja: skapa company_users-koppling om den saknas
   - Om nej: inviteUserByEmail, sen skapa company_users
4. Anropa send-portal-invitation med email, name, foretagsnamn, inviteLink
5. Returnera resultat
```

### Edge function: `send-portal-invitation`
```text
supabase/functions/send-portal-invitation/index.ts

Input: { email, name, companyName, inviteLink }
Skicka e-post via Resend fran "NoCV <noreply@nocv.se>"
Innehall: Valkommen till kundportalen, du kan se kandidater for [foretagsnamn]
```

### Config (supabase/config.toml)
```text
[functions.invite-portal-user]
verify_jwt = false

[functions.send-portal-invitation]
verify_jwt = false
```

### Flode

```text
Admin klickar "Bjud in portalanvandare"
  -> Valjer foretag, anger e-post + namn
  -> Frontend anropar invite-portal-user
  -> Edge function:
     1. Verifierar admin
     2. Skapar/hittar auth-anvandare
     3. Skapar company_users-rad
     4. Skickar valkomstmail
  -> Kunden far mail med lank till /auth
  -> Kunden loggar in -> AuthContext ser company_users -> redirect till /portal
```

Inga databasmigrationer behovs -- `company_users`-tabellen finns redan med ratt kolumner (`user_id`, `company_id`, `name`, `role`).

