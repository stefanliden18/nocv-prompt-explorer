
# Plan: Utöka kandidatpresentationsredigeraren ✅ KLAR

## Problem
1. ~~**Förhandsgranskningen visar bara halva presentationen** - Dialog-fönstret är för litet och klipps av~~ ✅
2. ~~**AI-genererad text går inte att redigera** - Sammanfattning, teknisk bedömning, styrkor m.m. är låsta~~ ✅

## Implementerade ändringar

### 1. Förhandsgranskning öppnas nu i ny flik ✅
- Bytte ut `Dialog`-komponenten mot en `window.open()` som öppnar `/presentation/{share_token}` i ny flik
- Full visning av hela presentationen utan scrollproblem

### 2. AI-text är nu redigerbar ✅
Skapade ny komponent `src/components/presentation/AITextEditor.tsx` som hanterar:

| Fält | Beskrivning |
|------|-------------|
| `summary` | Sammanfattande text (textarea) |
| `technical_assessment` | Teknisk bedömning (textarea) |
| `soft_skills_assessment` | Mjuka färdigheter (textarea) |
| `strengths` | Lista med styrkor + citat (dynamiska kort) |
| `concerns` | Lista med utvecklingsområden (dynamisk lista) |

### Ändrade filer

**`src/components/presentation/AITextEditor.tsx`** (NY)
- Collapsible-sektion för att visa/dölja AI-text
- Textareor för sammanfattning, teknisk bedömning, mjuka färdigheter
- Dynamiska kort för styrkor med punkt + citat + ta bort-knapp
- Dynamisk lista för utvecklingsområden med + lägg till

**`src/components/CandidatePresentationEditor.tsx`** (UPPDATERAD)
- Ny prop `assessmentId` för att uppdatera rätt rad i `candidate_assessments`
- Ny prop `shareToken` för att öppna förhandsvisning i ny flik
- Ny prop `onAssessmentUpdate` callback för att synka ändringar till parent
- State för alla AI-fält som initieras från `assessment`-prop
- `handleSave` uppdaterar nu **två tabeller**:
  1. `candidate_presentations` - recruiter_notes, soft_values_notes, skill_scores
  2. `candidate_assessments` - summary, technical_assessment, soft_skills_assessment, strengths, concerns
- "Förhandsgranska"-knappen öppnar nu i ny flik istället för dialog

**`src/components/FinalAssessment.tsx`** (UPPDATERAD)
- Skickar nu `assessmentId={existingAssessment.id}` till editorn
- Skickar nu `shareToken={presentation.share_token}` till editorn

**`src/components/CandidatePresentationView.tsx`** 
- Ingen ändring behövdes - tar redan emot data dynamiskt

---

## Resultat
- ✅ Hela presentationen kan ses i förhandsgranskningen (öppnas i ny flik)
- ✅ All AI-genererad text kan redigeras av rekryteraren
- ✅ Ändringar sparas till både `candidate_presentations` och `candidate_assessments`
