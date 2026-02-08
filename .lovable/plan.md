
# Plan: Sammanslagen annons + Publicera riktiga jobb ✅ IMPLEMENTERAT

## Översikt

Vi slår ihop beskrivning och krav till **ett enda textfält** i hela systemet. AI:n genererar en komplett platsannons, och du skapar jobbet som **utkast** som sedan kan publiceras på riktigt.

## Ändringar ✅

### 1. Edge function: Generera sammanslagen annons ✅

Uppdaterat `supabase/functions/generate-job-ad/index.ts`:

- AI-prompten genererar nu EN sammanslagen annons-HTML (`ad_html`) 
- Returnerar `ad_html` istället för separata `description_html` och `requirements_html`
- Behåller title, category, employment_type som tidigare

### 2. Formulär: Ett fält för annonstext ✅

**JobForm.tsx och JobEdit.tsx:**

- Tagit bort "Krav"-fältet från formuläret
- Bytt etikett till "Annonstext" 
- Uppdaterat förifyllningslogik för att läsa `ad_html` (med fallback för legacy-fält)
- Sparar endast till `description_md` i databasen

### 3. Jobbvisning: Sammanslagen visning ✅

**JobDetail.tsx, DemoJobDetail.tsx, JobPreview.tsx:**

- Tagit bort separat "Krav"-sektion
- Visar `description_md` + eventuell legacy `requirements_md` som "Om tjänsten"
- Bakåtkompatibilitet med befintliga jobb

### 4. CustomerInterviewForm: Exkluderar demo-jobb ✅

- Filtrar bort `demo` från jobbdropdown (bara `draft`, `published` visas)
- AI skapar jobb som **utkast** (inte demo)

### 5. "Publicera"-knapp i JobForm ✅

- Lagt till knapp: "✅ Publicera på hemsidan" som sätter status `published`
- Ny knappordning: [Spara som utkast] [✅ Publicera på hemsidan] [🎬 Spara som demo-jobb] [Avbryt]

---

## Filer som ändrats

| Fil | Ändring |
|-----|---------|
| `supabase/functions/generate-job-ad/index.ts` | ✅ Genererar `ad_html` |
| `src/pages/admin/JobForm.tsx` | ✅ Ett fält, Publicera-knapp |
| `src/pages/admin/JobEdit.tsx` | ✅ Ett fält, sammanslagen visning |
| `src/pages/JobDetail.tsx` | ✅ Visar sammanslagen annons |
| `src/pages/DemoJobDetail.tsx` | ✅ Visar sammanslagen annons |
| `src/pages/admin/JobPreview.tsx` | ✅ Visar sammanslagen annons |
| `src/components/CustomerInterviewForm.tsx` | ✅ Exkluderar demo-jobb |

---

## Dataflöde efter ändring

```text
Kravprofil fylls i
        ↓
AI genererar sammanslagen annons (ad_html)
        ↓
JobForm visar ETT textfält med hela annonsen
        ↓
Användaren redigerar
        ↓
Sparas som "utkast" eller "publicerat" (inte demo)
        ↓
Jobbet visas på hemsidan (om publicerat)
```
