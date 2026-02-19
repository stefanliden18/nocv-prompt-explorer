

## Fix: Inbjudan av portalanvandare misslyckas

### Problem

Tva buggar i `invite-portal-user`-funktionen:

1. **Felaktig autentiseringsmetod**: Funktionen anropar `supabaseClient.auth.getClaims(token)` som inte finns i Supabase JS-klienten. Detta bor vara `supabaseClient.auth.getUser(token)` (samma monster som `invite-user` anvander).

2. **Variabel utanfor scope**: `appUrl` deklareras inne i ett `else`-block (rad 97) men anvands utanfor det blocket (rad 145). Nar Michael redan finns som anvandare (han bjods in tidigare) hoppar koden over `else`-blocket, och `appUrl` ar odefinierad — vilket orsakar ett kraschfel.

### Losning

**Fil: `supabase/functions/invite-portal-user/index.ts`**

- Byt `auth.getClaims(token)` till `auth.getUser(token)` och hamta `userId` fran `user.id` istallet for `claims.sub`
- Flytta `appUrl`-deklarationen utanfor if/else-blocket sa att den ar tillganglig for bade redirect och mejllank
- Uppdatera CORS-headers till den fullstandiga listan for att undvika framtida problem

### Tekniska detaljer

```text
FORE (rad 35-45):
  const token = authHeader.replace("Bearer ", "");
  const { data: claimsData, error: claimsError } = await supabaseClient.auth.getClaims(token);
  if (claimsError || !claimsData?.claims) { ... }
  const userId = claimsData.claims.sub;

EFTER:
  const token = authHeader.replace("Bearer ", "");
  const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);
  if (userError || !user) { ... }
  const userId = user.id;
```

```text
FORE (rad 97, inuti else-block):
  const appUrl = Deno.env.get("APP_URL") || "https://nocv-prompt-explorer.lovable.app";

EFTER (flyttas till fore if/else, ca rad 89):
  const appUrl = Deno.env.get("APP_URL") || "https://nocv-prompt-explorer.lovable.app";
```

### Efter fix

Nar funktionen ar uppdaterad och deployad kan du bjuda in Michael Matton Jernberg igen. Eftersom han redan finns som anvandare kommer funktionen att hoppa over kontoskapande och bara skapa foretagskopplingen + skicka mejl.

