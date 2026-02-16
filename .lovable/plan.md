

# Fix: Sparade ändringar visas inte i presentationsförhandsgranskningen

## Problemet

Nar du redigerar texter (sammanfattning, styrkor, utvecklingsomraden etc.) och klickar "Spara", sa sparas andringarna till databasen men den grona forhandsgranskningen pa samma sida uppdateras INTE. Det beror pa att:

1. Editorn sparar till databasen -- det fungerar
2. Men editorn meddelar aldrig foraldern om vad som andrats
3. Den grona forhandsgranskningen visar fortfarande den gamla datan fran nar sidan laddades

## Losning

Tva andringar i `FinalAssessment.tsx`:

### 1. Skicka med `onAssessmentUpdate` till editorn

Editorn har redan stod for en `onAssessmentUpdate`-callback men den skickas aldrig med fran `FinalAssessment`. Vi lagger till den och nar den anropas uppdaterar vi `existingAssessment`-statet via en ny callback upp till `CandidateAssessment`.

### 2. Lagg till en `onAssessmentUpdate`-prop pa `FinalAssessment` och hantera den i `CandidateAssessment`

`CandidateAssessment` behover en funktion som uppdaterar sitt `finalAssessment`-state nar editorn sparar.

## Tekniska detaljer

### Fil 1: `src/components/CandidateAssessment.tsx`

- Lagg till en `handleAssessmentUpdate`-funktion som mergar in uppdateringar i `finalAssessment`-statet:

```tsx
const handleAssessmentUpdate = (updates: Partial<FinalResult>) => {
  setFinalAssessment(prev => prev ? { ...prev, ...updates } : prev);
};
```

- Skicka med `onAssessmentUpdate={handleAssessmentUpdate}` till `FinalAssessment`

### Fil 2: `src/components/FinalAssessment.tsx`

- Lagg till `onAssessmentUpdate` i props-interfacet:

```tsx
onAssessmentUpdate?: (updates: Partial<FinalResult>) => void;
```

- Destrukturera den i komponenten
- Skicka vidare till `CandidatePresentationEditor`:

```tsx
<CandidatePresentationEditor
  ...
  onAssessmentUpdate={(updates) => {
    // Uppdatera foraldern sa den grona forhandsgranskningen visar ratt data
    onAssessmentUpdate?.({
      summary: updates.summary ?? existingAssessment.summary,
      technical_assessment: updates.technical_assessment ?? existingAssessment.technical_assessment,
      soft_skills_assessment: updates.soft_skills_assessment ?? existingAssessment.soft_skills_assessment,
      strengths: updates.strengths ?? existingAssessment.strengths,
      concerns: updates.concerns ?? existingAssessment.concerns,
    });
  }}
/>
```

### Sammanfattning

| Fil | Andring |
|-----|---------|
| `CandidateAssessment.tsx` | Ny `handleAssessmentUpdate`-funktion, skicka som prop till FinalAssessment |
| `FinalAssessment.tsx` | Ny prop `onAssessmentUpdate`, skicka vidare till CandidatePresentationEditor |

Tva filer, sma andringar. Resultatet: nar du trycker "Spara" uppdateras bade databasen och den grona forhandsgranskningen direkt.
