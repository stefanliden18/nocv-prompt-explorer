
## Fixa inbjudningslänkar till kundportalen

### Problemet
Inbjudningsmejlet och Supabase Auth-redirecten pekar till `awtxvhstozhprjujlsne.lovableproject.com/auth`, en intern adress som visar "Project not found". Er riktiga publicerade app finns pa `nocv-prompt-explorer.lovable.app`.

### Losning
Uppdatera `invite-portal-user`-funktionen sa att den anvander den korrekta publicerade URL:en istallet for att bygga en URL fran Supabase-projektets ID.

### Teknisk plan

**Fil: `supabase/functions/invite-portal-user/index.ts`**

Andra tva rader:

- **Rad 97** (auth redirect):
  ```
  // FORE:
  const redirectUrl = `${supabaseUrl.replace(".supabase.co", ".lovableproject.com")}/auth`;
  // EFTER:
  const redirectUrl = "https://nocv-prompt-explorer.lovable.app/auth";
  ```

- **Rad 144** (mejllank):
  ```
  // FORE:
  const inviteLink = `${supabaseUrl.replace(".supabase.co", ".lovableproject.com")}/auth`;
  // EFTER:
  const inviteLink = "https://nocv-prompt-explorer.lovable.app/auth";
  ```

### Alternativ: Anvanda en environment-variabel

For att gora URL:en konfigurerbar utan kodandring kan vi istallet lagga till en secret `APP_URL` med vardet `https://nocv-prompt-explorer.lovable.app` och referera till den i koden:

```typescript
const appUrl = Deno.env.get("APP_URL") || "https://nocv-prompt-explorer.lovable.app";
const redirectUrl = `${appUrl}/auth`;
const inviteLink = `${appUrl}/auth`;
```

### Nar detta ar fixat
Michael behover fa en ny inbjudan (eller logga in direkt pa `nocv-prompt-explorer.lovable.app/auth`) for att komma in i portalen.

### Andra funktioner med samma problem
Foljande edge functions anvander samma felaktiga URL-konstruktion och bor atgardas samtidigt:

- `invite-user/index.ts` (om den har samma monster)
- Eventuella andra funktioner som bygger redirect-URL:er fran `SUPABASE_URL`
