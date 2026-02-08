
# Plan: Sammanslagen annons + Publicera riktiga jobb

## Översikt

Vi slår ihop beskrivning och krav till **ett enda textfält** i hela systemet. AI:n genererar en komplett platsannons, och du skapar jobbet som **utkast** som sedan kan publiceras på riktigt.

## Ändringar

### 1. Edge function: Generera sammanslagen annons

Uppdatera `supabase/functions/generate-job-ad/index.ts`:

- Ändra AI-prompten så att den genererar EN sammanslagen annons-HTML istället för separata `description_html` och `requirements_html`
- Returnera `ad_html` (hela annonsen) istället för två separata fält
- Behåll title, category, employment_type som tidigare

### 2. Formulär: Ta bort separata fält

**JobForm.tsx och JobEdit.tsx:**

- Ta bort "Krav"-fältet från formuläret
- Byt etikett från "Beskrivning" till "Annonstext" 
- Uppdatera förifyllningslogik för att läsa `ad_html` istället för `description_html` + `requirements_html`
- Ta bort `requirementsHtml` state och spara bara till `description_md` i databasen

### 3. Jobbvisning: Visa bara ett fält

**JobDetail.tsx, DemoJobDetail.tsx, JobPreview.tsx:**

- Ta bort separat "Krav"-sektion
- Visa bara `description_md` som "Om tjänsten"
- Befintliga jobb med data i `requirements_md` fortsätter fungera (bakåtkompatibelt)

### 4. CustomerInterviewForm: Exkludera demo-jobb

- Filtrera bort `demo` från jobbdropdown så bara riktiga jobb (draft, published) visas
- AI skapar jobbet som **utkast** (inte demo)

### 5. Lägg till "Publicera"-knapp i JobForm

- Lägg till en ny knapp: "Publicera på hemsidan" som sätter status `published`
- Byt ordning så "Spara som utkast" kommer först, sedan "Publicera", sedan "Demo"

---

## Filer som ändras

| Fil | Ändring |
|-----|---------|
| `supabase/functions/generate-job-ad/index.ts` | Generera `ad_html` (sammanslagen annons) istället för separata fält |
| `src/pages/admin/JobForm.tsx` | Ta bort krav-fält, läs `ad_html`, lägg till "Publicera"-knapp |
| `src/pages/admin/JobEdit.tsx` | Ta bort krav-fält, visa bara ett redigerings-fält |
| `src/pages/JobDetail.tsx` | Ta bort separat "Krav"-sektion |
| `src/pages/DemoJobDetail.tsx` | Ta bort separat "Krav"-sektion |
| `src/pages/admin/JobPreview.tsx` | Ta bort separat "Krav"-sektion |
| `src/components/CustomerInterviewForm.tsx` | Filtrera bort demo-jobb från dropdown |

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

---

## Bakåtkompatibilitet

- Befintliga jobb med data i `requirements_md` kommer fortfarande fungera
- Vid visning: Om `requirements_md` finns så visas den i "Om tjänsten"-sektionen (vi slår ihop vid läsning i frontend)
- Nya jobb får bara `description_md` fyllt

---

## Tekniska detaljer

### AI-prompt ändring

Istället för att be om två separata fält ber vi om:

```javascript
ad_html: {
  type: "string",
  description: "Komplett platsannons i HTML-format. Inkluderar beskrivning av tjänsten följt av kravsektion. Använd <h3>, <p>, <ul>, <li> för struktur."
}
```

### JobForm knappordning

```text
[Spara som utkast] [✅ Publicera på hemsidan] [🎬 Spara som demo-jobb] [Avbryt]
```

### Dropdown-filter

```javascript
.in('status', ['draft', 'published'])  // Exkludera 'demo'
```
