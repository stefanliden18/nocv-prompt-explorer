

# Optimera rekryteringstavlan

## Nuläge
Tavlan har redan en multi-select dropdown för att filtrera på jobb, men den kan förbättras avsevärt för att bli mer intuitiv och kraftfull.

## Föreslagna förbättringar

### 1. Snabbknappar för enskilda jobb
Istället för att bara ha en dropdown, visa aktiva jobb som klickbara knappar/chips direkt under rubriken. Ett klick = filtrera på det jobbet. Klicka igen = avmarkera. Mycket snabbare än att öppna en dropdown.

### 2. Gruppera jobb efter status
Visa jobbfiltret uppdelat i tydliga grupper:
- **Aktiva jobb** (publicerade) -- visas som grona chips
- **Vilande jobb** (biblioteket) -- visas som gula chips
- **Utkast** -- visas som grå chips

Varje chip visar jobbets titel + antal kandidater i parentes, t.ex. "Skadetekniker Stockholm (12)".

### 3. Kandidaträknare per stadie och jobb
I kolumnhuvudet visa inte bara totalt antal utan även en uppdelning per jobb (om flera jobb är valda), så man snabbt ser fördelningen.

### 4. Arkivering och bulk-åtgärder (från tidigare plan)
- Checkboxar på kandidatkort för multi-select
- Flytande action bar med: Flytta till stadie, Arkivera, Avmarkera
- Arkiv-toggle för att visa/dölja arkiverade kandidater

### 5. Spara filtervy
Möjlighet att spara en kombination av filter (jobb + betyg + taggar) som en "vy" man snabbt kan växla till. T.ex. "Mina aktiva Stockholms-rekryteringar".

---

## Rekommenderad prioritetsordning

Jag föreslår att vi börjar med det som ger mest omedelbar nytta:

**Steg 1 -- Snabbfilter med jobbchips (denna implementation)**
- Ersätt den nuvarande multi-select-dropdownen med en visuell chip-baserad filtervy
- Gruppera jobb efter status (aktiva/vilande/utkast)
- Visa antal kandidater per jobb på varje chip
- Behåll sök- och övriga filter som de är
- Lägg till en "Alla jobb"-knapp som snabbt rensar filtret

**Steg 2 -- Arkivering och bulk-åtgärder (nästa steg)**

**Steg 3 -- Sparade vyer (framtida)**

---

## Tekniska ändringar (Steg 1)

### src/pages/admin/RecruitmentBoard.tsx
1. **Utöka Job-interfacet** med `status` och `company_name` (hämtas redan via Supabase-join)
2. **Ny fetchJobs**: Hämta `id, title, status, companies(name)` och räkna antal ansökningar per jobb
3. **Ersätt jobb-filter-sektionen** med en chip-baserad vy:
   - Rubrik "Filtrera på jobb"
   - Grupp: "Aktiva" med gröna chips
   - Grupp: "Vilande" med gula chips  
   - Grupp: "Utkast" med grå chips
   - Varje chip: klickbar, visar `titel (antal kandidater)`, togglar på/av
   - "Visa alla"-knapp for att rensa
4. **Behåll befintlig logik** för selectedJobIds -- chips använder samma state
5. **Kandidaträknare**: Uppdatera subtiteln att visa t.ex. "Visar 24 kandidater för 2 jobb"

### Inga databasändringar behövs
All data finns redan -- vi behöver bara hämta `status` och `company name` för jobben.

