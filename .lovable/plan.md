

# Uppgraderad informationsbubbla -- storre, animerad och synlig pa jobbsidan

## Oversikt

Gora informationsbubblan (JobsInfoBubble) betydligt storre, ge den en pulserande animation sa den sticker ut, och aven lagga till den i hogerspalten pa jobbdetaljsidan (JobDetail).

## Andringar

### 1. Uppgradera JobsInfoBubble-komponenten (`src/components/JobsInfoBubble.tsx`)

**Storlek**: Oka fran `w-9 h-9` till `w-14 h-14` med storre ikon (`w-7 h-7`).

**Animation**: Lagg till en pulserande glod-effekt med en `animate-pulse` ring runt bubblan som drar ogat dit. Effekten ar subtil men tydlig -- en yttre ring som pulserar i `bg-primary/30`.

**Hover**: Skala upp till `hover:scale-115` med mjuk shadow.

### 2. Lagga till bubblan i JobDetail-sidans hogerkolumn (`src/pages/JobDetail.tsx`)

Placera en ny sektion under det befintliga "Boka intervju"-kortet i hogerspalten (line ~672). Det blir ett eget kort med:

- Rubriken "Hur funkar det?"
- De 4 stegen i kompakt lista
- Trust-bar (10 min, Inget CV, Mobil, Tryggt)
- "Las mer"-knapp till `/sa-funkar-det`

Alternativt: Ateranvand `JobsInfoBubble` som en standalone-komponent placerad under "Boka intervju"-kortet, fast i en utfallbar variant som ar oppnad som standard pa desktop.

**Vald losning**: Skapa en ny komponent `JobsHowItWorks` som visar informationen direkt synligt (inte bakom en klick) i ett eget kort. Detta ar mer effektivt for konvertering -- kandidaten ser processen utan att behova klicka.

### 3. Ny komponent: `src/components/JobsHowItWorks.tsx`

Ett kort som visar:
- Rubrik: "Sa har enkelt soker du" (avslappnad ton)
- 4 steg med numrerade cirklar och korta beskrivningar
- Trust-badges: 10 min | Inget CV | Mobil | Tryggt
- CTA-knapp: "Las mer om hur det funkar" som lankar till `/sa-funkar-det`

Designad med `bg-white border-border`, samma kort-stil som ovriga sajten. Sticky tillsammans med "Boka intervju"-kortet.

## Teknisk sammanfattning

| Fil | Andring |
|-----|---------|
| `src/components/JobsInfoBubble.tsx` | Storre bubbla (w-14 h-14), pulserande animation med yttre ring |
| `src/components/JobsHowItWorks.tsx` | **Ny fil** -- "Sa funkar det"-kort for jobbdetaljsidans hogerkolumn |
| `src/pages/JobDetail.tsx` | Importera och lagga till `JobsHowItWorks` under "Boka intervju"-kortet i hogerspalten |

Ingen databasandring kravs.
