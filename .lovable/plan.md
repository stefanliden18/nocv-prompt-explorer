
# Plan: Utöka kandidatpresentationsredigeraren

## Problem
1. **Förhandsgranskningen visar bara halva presentationen** - Dialog-fönstret är för litet och klipps av
2. **AI-genererad text går inte att redigera** - Sammanfattning, teknisk bedömning, styrkor m.m. är låsta

## Lösning

### 1. Förbättra förhandsgranskning
Ändra så att förhandsgranskningen öppnas i ett större fönster eller i ett nytt fönster/flik så att hela presentationen kan ses.

**Alternativ A**: Öppna i ny flik (rekommenderas för full vy)
**Alternativ B**: Fullskärms-dialog med bättre scroll

### 2. Gör AI-text redigerbar
Utöka `CandidatePresentationEditor` med redigeringsfält för all AI-genererad text:

| Fält | Beskrivning |
|------|-------------|
| `summary` | Sammanfattande text |
| `technical_assessment` | Teknisk bedömning |
| `soft_skills_assessment` | Mjuka färdigheter |
| `strengths` | Lista med styrkor + citat |
| `concerns` | Lista med utvecklingsområden |

### Ändringar per fil

**`CandidatePresentationEditor.tsx`**
- Lägg till state för AI-fälten: `summary`, `technicalAssessment`, `softSkillsAssessment`, `strengths`, `concerns`
- Initiera med värden från `assessment`-prop
- Lägg till editeringsfält:
  - Textarea för sammanfattning
  - Textarea för teknisk bedömning
  - Textarea för mjuka färdigheter
  - Redigerbart kort för varje styrka (punkt + citat)
  - Redigerbar lista för utvecklingsområden
- Utöka `handleSave` för att uppdatera `candidate_assessments`-tabellen
- Ändra förhandsgranskning till att öppna i ny flik istället för dialog

**`FinalAssessment.tsx`**
- Skicka `assessmentId` till editorn så den kan uppdatera rätt rad
- Lägg till `onAssessmentUpdate` callback för att uppdatera lokal state efter redigering

**`CandidatePresentationView.tsx`**
- Ingen ändring behövs - tar redan emot data dynamiskt

---

## Teknisk detalj

### Databasuppdatering
Editorn behöver uppdatera **två tabeller**:
1. `candidate_presentations` - recruiter_notes, soft_values_notes, skill_scores
2. `candidate_assessments` - summary, technical_assessment, soft_skills_assessment, strengths, concerns

### UI-struktur (ny redigeringssektion)

```text
┌──────────────────────────────────────────────────────┐
│ Redigera presentation                    [Spara] [👁] │
├──────────────────────────────────────────────────────┤
│ ▼ AI-genererade texter (klickbart för att expandera) │
│   ┌──────────────────┐  ┌──────────────────┐        │
│   │ Sammanfattning   │  │ Teknisk bedömning│        │
│   │ [textarea]       │  │ [textarea]       │        │
│   └──────────────────┘  └──────────────────┘        │
│   ┌──────────────────────────────────────────┐      │
│   │ Styrkor                                   │      │
│   │ ┌──────────────────────────────────────┐ │      │
│   │ │ Punkt: [input]                       │ │      │
│   │ │ Citat: [input]              [Ta bort]│ │      │
│   │ └──────────────────────────────────────┘ │      │
│   │ [+ Lägg till styrka]                     │      │
│   └──────────────────────────────────────────┘      │
│   ┌──────────────────────────────────────────┐      │
│   │ Utvecklingsområden                        │      │
│   │ • [input]                      [Ta bort] │      │
│   │ • [input]                      [Ta bort] │      │
│   │ [+ Lägg till]                            │      │
│   └──────────────────────────────────────────┘      │
├──────────────────────────────────────────────────────┤
│ ▼ Rekryterarens tillägg (redan implementerat)       │
│   Personliga observationer | Intervjuintryck        │
│   Kompetenspoäng                                    │
└──────────────────────────────────────────────────────┘
```
