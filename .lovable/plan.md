

## Ändra kalenderhändelsens titel till företagsnamn

### Problem
I .ics-filen (kalenderinbjudan) sätts SUMMARY till "Intervju med [rekryterarens namn]" (t.ex. "Intervju med Stefan Liden"). Användaren vill att det ska stå "Intervju med Hedin Bil" (företagsnamnet).

### Losning
Ändra en rad i edge-funktionen `send-portal-interview-invitation`.

### Teknisk detalj
I `supabase/functions/send-portal-interview-invitation/index.ts`, ändra `summary`-parametern i `buildICalEvent`-anropet:

**Fran:**
```
summary: `Intervju med ${bookerName}`,
```

**Till:**
```
summary: `Intervju med ${companyName || bookerName}`,
```

Detta gör att kalenderhändelsen visas som "Intervju med Hedin Bil" istället för "Intervju med Stefan Liden". Om företagsnamn saknas faller det tillbaka på rekryterarens namn.

En fil andras, inga databasandringar.

