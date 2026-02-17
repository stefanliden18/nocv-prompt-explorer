

# Ta bort obehörig användare och stäng registrering

## Bakgrund

Inloggningssidan (`/auth`) har en offentlig "Registrera"-flik som tillater vem som helst att skapa ett konto. Det ar sa "gino_bmw@hotmail.com" kom in. Vi behover atgarda detta pa tva satt.

## Steg 1: Ta bort Gino

Ginos konto har hittats i databasen:
- E-post: gino_bmw@hotmail.com
- ID: `76cca22b-4fe3-4284-8c97-c7f843c22ab6`
- Roll: user

Vi skapar en edge function (`delete-user`) som:
- Verifierar att anroparen ar admin
- Tar bort anvandaren fran `auth.users` (som kaskaderar till `profiles` och `user_roles`)

Alternativt kan vi ta bort anvandaren direkt via en databasmigration.

## Steg 2: Ta bort registreringsfliken

Filen `src/pages/Auth.tsx` har en "Registrera"-flik (rad 78, 138-169) som tillater offentlig registrering. Vi tar bort den helt sa att:
- Bara "Logga in" och "Magic Link" visas
- Ingen kan langre skapa konton sjalv
- Nya anvandare kan bara skapas via admin-panelen ("Ny anvandare"-knappen)

## Steg 3: Lagg till "Ta bort"-alternativ i admin-panelen

Vi lagger till ett "Ta bort anvandare"-alternativ i atgardsmenyn (dropdown) pa anvandarsidan, sa att administratorer kan ta bort anvandare i framtiden.

## Filer som andras

| Fil | Andring |
|-----|---------|
| `src/pages/Auth.tsx` | Ta bort "Registrera"-fliken helt, behall bara inloggning |
| `supabase/functions/delete-user/index.ts` | Ny edge function for att ta bort anvandare (admin-skyddad) |
| `src/pages/admin/Users.tsx` | Lagg till "Ta bort"-alternativ i dropdown-menyn |

## Tekniska detaljer

### Auth.tsx
- Ta bort `Tabs`, `TabsList`, `TabsTrigger` och `TabsContent value="signup"` 
- Behall inloggningsformularet och Magic Link-formularet utan flikar
- Ta bort `signUp`-importen fran `useAuth`

### delete-user edge function
```typescript
// Verifierar admin-roll via token
// Anropar supabaseAdmin.auth.admin.deleteUser(userId)
// Returnerar success/error
```

### Users.tsx
- Lagg till en `DropdownMenuItem` for "Ta bort anvandare" med bekraftelsedialog
- Forhindra borttagning av sista adminen
