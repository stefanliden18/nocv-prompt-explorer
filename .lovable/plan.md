

## Problem

Det finns **tre problem** som måste lösas:

### 1. invite-user och change-user-role kraschar — felaktig admin-verifiering
Båda edge-funktionerna använder en anon-klient (utan användarkontext) för att läsa `profiles.role`. RLS-policyn på `profiles` tillåter bara `auth.uid() = id`, men anon-klienten saknar användarkontext — så frågan returnerar alltid tomt. Resultatet: alla anrop returnerar 403 "User is not admin", oavsett om användaren faktiskt är admin.

**Lösning**: Använd service-role-klienten (som redan skapas i båda funktionerna) för admin-verifieringen istället för anon-klienten. Samma mönster som `delete-user` redan använder framgångsrikt.

### 2. Saknad `recruiter`-roll i `app_role`-enum
`profiles.role` använder `profile_role` (admin, recruiter, user), men `user_roles.role` använder `app_role` (admin, user — saknar recruiter). Triggern `sync_profile_role` försöker synka profil-rollen till `user_roles`, men kraschar tyst när rollen är "recruiter" eftersom den inte finns i `app_role`-enumet.

**Lösning**: Lägg till `recruiter` i `app_role`-enumet via en databasmigrering. Uppdatera `has_role`-funktionen om nödvändigt.

### 3. Duplicerad variabel `profileError` i `change-user-role`
Rad 42 och 79 i `change-user-role/index.ts` deklarerar båda `const profileError`. Samma typ av bugg som redan fixats i `invite-user`.

**Lösning**: Byt namn på den andra deklarationen till `currentProfileError`.

---

## Implementationsplan

### Steg 1: Databasmigrering — lägg till `recruiter` i `app_role`
```sql
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'recruiter';
```

### Steg 2: Fixa `invite-user/index.ts`
- Flytta admin-kontrollen (rad 47-60) till efter att `supabaseAdmin` (service-role-klienten) skapats.
- Använd `supabaseAdmin` istället för `supabaseClient` för att läsa `profiles.role`.
- Ta bort den duplicerade `profileError`-deklarationen på rad 87 (byt namn).

### Steg 3: Fixa `change-user-role/index.ts`
- Flytta admin-kontrollen att använda service-role-klienten istället för anon-klienten.
- Byt namn på duplicerad `profileError` (rad 79) till `currentProfileError`.

### Steg 4: Deploy alla tre edge-funktioner
- invite-user
- change-user-role

Inga frontend-ändringar behövs. Kundportal-inbjudan (invite-portal-user) fungerar redan med separat knapp och dialog.

