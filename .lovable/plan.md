
# Kandidatpresentation 2.0 - Modern visuell design med redigerbar text

## Sammanfattning
Omdesigna kandidatpresentationen till en modern, visuell upplevelse som kombinerar:
- **Interaktiva diagram** (radar/spider chart för kompetenser, radiella progress-indikatorer för matchning)
- **Redigerbara textfält** för manuella observationer om mjuka värden och personlighet
- **Modern layout** med NOCV-färger, whitespace och professionell typografi

---

## Designkoncept

### Visuell struktur (uppifrån och ner)

```text
+----------------------------------------------------------+
|  HEADER: Kandidatnamn + Roll + Jobb                      |
+----------------------------------------------------------+
|                                                          |
|  [===]  [===]  [===]   Tre radiella score-indikatorer   |
|  82%    78%    85%     med animerad fyllnad             |
|  Total  Roll   Jobb                                      |
|                                                          |
+----------------------------------------------------------+
|  SAMMANFATTNING (AI-genererad text i elegant quote-box) |
+----------------------------------------------------------+
|                        |                                 |
|   KOMPETENSRADAR       |   MANUELL TEXT                 |
|   (Spider chart med    |   "Personliga observationer"   |
|   6-8 tekniska         |   Redigerbar textarea för      |
|   kompetenser)         |   rekryterarens noteringar     |
|                        |                                 |
+----------------------------------------------------------+
|                        |                                 |
|   MJUKA FÄRDIGHETER    |   INTERVJUINTRYCK              |
|   (Horisontella        |   "Vad vi såg i intervjun"     |
|   progress-bars med    |   Redigerbar textarea för      |
|   färgkodning)         |   mjuka värden och kultur      |
|                        |                                 |
+----------------------------------------------------------+
|  STYRKOR (Quote cards med citat från intervjun)         |
+----------------------------------------------------------+
|  UTVECKLINGSOMRÅDEN (Ikon-lista med gula accenter)      |
+----------------------------------------------------------+
|  Footer: NOCV-branding                                   |
+----------------------------------------------------------+
```

### Färgpalett
- **Primär**: NOCV Dark Blue (#1e3a5f) - rubriker, diagram-linjer
- **Accent**: NOCV Orange (#f97316) - knappar, highlight, score över 70%
- **Success**: Grön (#10b981) - styrkor, höga poäng
- **Warning**: Gul (#f59e0b) - utvecklingsområden
- **Neutral**: Ljusgrå bakgrunder, vit whitespace

---

## Teknisk implementation

### Nya databasfält
Lägga till kolumner i `candidate_presentations` för manuell text:

```sql
ALTER TABLE candidate_presentations ADD COLUMN IF NOT EXISTS
  recruiter_notes TEXT DEFAULT '';
  
ALTER TABLE candidate_presentations ADD COLUMN IF NOT EXISTS
  soft_values_notes TEXT DEFAULT '';
  
ALTER TABLE candidate_presentations ADD COLUMN IF NOT EXISTS
  skill_scores JSONB DEFAULT '{}';
```

- **recruiter_notes**: Fritt textfält för personliga observationer
- **soft_values_notes**: Text om mjuka värden från intervjun
- **skill_scores**: JSON-objekt med kompetens-scores för diagram (t.ex. `{"motordiagnostik": 85, "kundkommunikation": 70}`)

### Komponentstruktur

**Ny React-komponent** (`src/components/CandidatePresentationEditor.tsx`):
- Visas i admin-vyn efter att slutmatchning genererats
- Låter rekryteraren redigera manuella textfält
- Preview-knapp för att se hur presentationen ser ut
- Spara-knapp som uppdaterar `candidate_presentations`

**Uppdaterad publik sida** (`src/pages/CandidatePresentation.tsx`):
- Renderar React-komponenter istället för raw HTML
- Använder Recharts för radar- och progress-diagram
- Responsiv design för både desktop och mobil

### Diagram-implementation (Recharts)

**Radar Chart för tekniska kompetenser**:
```typescript
// Data från role_profiles.technical_skills + skill_scores
const radarData = [
  { skill: 'Motordiagnostik', score: 85, fullMark: 100 },
  { skill: 'Växellåda', score: 70, fullMark: 100 },
  // ...
];
```

**Radial Progress för matchningspoäng**:
```typescript
// Cirkulära progress-indikatorer med procent i mitten
<RadialBarChart data={[{ value: 82, fill: '#10b981' }]} />
```

**Horisontella bars för mjuka färdigheter**:
```typescript
// Färgkodade progress-bars
<Progress value={75} className="bg-orange-500" />
```

### Edge-funktion uppdatering
Uppdatera `generate-final-assessment/index.ts`:
1. Generera initiala `skill_scores` baserat på AI-analys
2. Spara JSON-struktur istället för HTML
3. Behåll HTML-generering som fallback för bakåtkompatibilitet

### Redigeringsflöde

1. **Generera slutmatchning** - AI skapar assessment + initiala skill_scores
2. **Redigeringsläge** - Rekryterare ser preview med textfält
3. **Fyll i manuell text**:
   - "Personliga observationer" (recruiter_notes)
   - "Mjuka värden från intervjun" (soft_values_notes)
   - Justera skill_scores via sliders (optional)
4. **Spara och förhandsgranska**
5. **Publicera** - Låser presentationen för kund

---

## Filer som skapas/ändras

### Nya filer
1. `src/components/CandidatePresentationEditor.tsx` - Redigeringskomponent
2. `src/components/CandidatePresentationView.tsx` - Visuell presentation med diagram

### Modifierade filer
1. `src/pages/CandidatePresentation.tsx` - Använd React-komponenter istället för raw HTML
2. `src/components/FinalAssessment.tsx` - Lägg till redigeringsknapp och preview
3. `supabase/functions/generate-final-assessment/index.ts` - Generera skill_scores JSON
4. Databasmigration för nya kolumner

---

## Fördelar med denna approach

- **Modern och visuell**: Diagram kommunicerar kompetens snabbare än text
- **Personlig touch**: Rekryteraren kan lägga till egen text om kandidatens personlighet
- **Flexibel**: Kombination av AI-genererat och manuellt innehåll
- **Responsiv**: Fungerar på både desktop och mobil
- **Utskriftsvänlig**: CSS print-styles för PDF-export
