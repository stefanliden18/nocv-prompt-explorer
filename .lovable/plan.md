

# Omskrivning av Företagssidan

## Oversikt

Hela innehallet pa `/companies`-sidan byts ut med ny, skarpt och branschriktad copy. Dessutom laggs en helt ny sektion till med siffror/socialt bevis. Allt gors i en fil: `src/pages/Companies.tsx`.

## Andringar i detalj

### 1. Hero-sektion
- **Rubrik**: "Sluta leta i CV-hogar. Traffa ratt kandidat direkt."
- **Undertext**: "Vi intervjuar mekaniker, skadetekniker och fordonstekniker at er med AI -- innan ni ens behover lyfta luren. Ni far kandidater som redan visat att de kan jobbet."
- **CTA**: "Boka en demo" (behalles som orange `cta-primary`)

### 2. Fordelar-sektion
- **Rubrik**: "Varfor verkstader valjer NoCV"
- **Undertext**: "Traditionell rekrytering tar veckor och ger en hog med CV:n som inte sager ett dugg om hur bra nagon ar pa att felsoka en motor. Vi gor det annorlunda."
- **Kort 1** (ikon: `Eye` eller `Search`): "Ni ser kompetens, inte CV" -- ny beskrivning
- **Kort 2** (ikon: `UserPlus` eller `Users`): "Kandidater ni annars aldrig hittar" -- ny beskrivning
- **Kort 3** (ikon: `Zap` eller `Clock`): "Fran annons till kandidat pa dagar, inte veckor" -- ny beskrivning

### 3. Sa fungerar det-sektion
- **Rubrik**: "Sa enkelt ar det"
- **Undertext**: "Fyra steg fran att ni behover personal till att ni traffar ratt person."
- Alla fyra steg byts ut med ny copy enligt specifikationen

### 4. Ny sektion: Siffror / socialt bevis
Placeras mellan "Sa fungerar det" och CTA-sektionen. Tre kolumner med stora siffror:
- **3--4 dgr** -- "Genomsnittlig tid till forsta kandidatpresentation"
- **93%** -- "Av foretag som testat NoCV rekryterar igen med oss"
- **Dygnet runt** -- "Var AI intervjuar medan ni fokuserar pa verkstaden"

Rubrik ovanfor: "Det har har vi levererat"

### 5. CTA-sektion
- **Rubrik**: "Testa med er nasta rekrytering"
- **Undertext**: "Boka en demo sa visar vi hur det fungerar -- 15 minuter, inga forpliktelser. Har ni ett akut behov kan vi ha kandidater redo inom en vecka."
- **Knapptext**: "Boka demo -- 15 min"
- **Under knappen**: "Eller ring oss direkt: 08-123 45 67" (platshallare -- ni byter till ert riktiga nummer)

## Teknisk sammanfattning

| Fil | Andring |
|-----|---------|
| `src/pages/Companies.tsx` | Byt all statisk copy i hero, fordelar, steg och CTA. Lagg till ny siffror-sektion. Uppdatera ikoner i benefits-arrayen. |

Inga nya filer, inga databasandringar. Sidans CMS-fallback (database content) behalles -- den nya texten ar fallback-varden som visas om inget CMS-innehall finns.

