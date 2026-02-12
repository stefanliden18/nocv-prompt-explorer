
# Plan: Dölj företagsnamn i annons och e-post

## Sammanfattning
Lagger till en inställning per jobb som styr om företagsnamnet ska visas eller döljas -- bade i den publika jobbannonsen och i kandidatmejl. Nar flaggan ar aktiv doljs foretags- namnet och logotypen overallt dar kandidaten ser det.

## Steg 1: Databasandring

Lagg till en ny kolumn i `jobs`-tabellen:

```sql
ALTER TABLE public.jobs 
ADD COLUMN hide_company_in_emails boolean NOT NULL DEFAULT false;
```

Kolumnnamnet behalles som `hide_company_in_emails` for att vara konsekvent med tidigare diskussion, men funktionaliteten utvidgas till att aven omfatta annonssidan.

## Steg 2: Admin - Switch i JobEdit och JobForm

Lagg till en Switch-komponent i bade `JobEdit.tsx` (bredvid GetKiku-faltet) och `JobForm.tsx`:

- Label: **"Dolj foretagsnamn for kandidater"**
- Beskrivning: "Foretaget visas inte i annonsen eller i mejl till kandidater"
- State: `hideCompanyInEmails` (ny state-variabel)
- Sparas till `hide_company_in_emails` i databasen

## Steg 3: Jobbannonsen (publika sidor)

### JobDetail.tsx
Nar `hide_company_in_emails` ar `true`:
- **Dolj** foretags-logotypen (rad 455-463)
- **Dolj** foretagsnamnet i headern (rad 484-489)
- **Dolj** foretagsnamnet i SEO-titel och beskrivning (rad 372-375) - ersatt med "NOCV" eller bara jobbtiteln
- **Dolj** foretagsnamnet i structured data (rad 386-390)

### DemoJobDetail.tsx
Samma andringar som JobDetail - dolj logotyp och foretagsnamn.

### Jobs.tsx (jobblistan)
Dolj logotypen i jobbkortet nar flaggan ar aktiv (rad 376-383). Foretagsnamnet visas inte som text har redan, sa ingen ytterligare andring behovs.

## Steg 4: Kandidatmejl

### send-application-email (bekraftelsemejl)
- Hamta `hide_company_in_emails` fran jobb-datan (redan inkluderad i queryn)
- Nar `true`: ersatt foretagsnamnet med "arbetsgivaren" i mejlet
- Gor CTA-knappen mer synlig (starkare farg)

### send-getkiku-invitation (AI-intervjuinbjudan)
- Hamta `hide_company_in_emails` fran jobb-datan
- Nar `true`: ersatt foretagsnamnet med "arbetsgivaren" i amnesrad och brodel
- Forbattra knappens synlighet

## Tekniska andringar

| Fil | Andring |
|-----|---------|
| Migration (SQL) | Lagg till `hide_company_in_emails` boolean i `jobs` |
| `src/pages/admin/JobForm.tsx` | Switch + state + spara till DB |
| `src/pages/admin/JobEdit.tsx` | Switch + state + ladda/spara |
| `src/pages/JobDetail.tsx` | Villkorlig visning av foretagsnamn och logotyp |
| `src/pages/DemoJobDetail.tsx` | Samma villkorliga visning |
| `src/pages/Jobs.tsx` | Dolj logotyp i jobbkort nar flaggan ar aktiv |
| `supabase/functions/send-application-email/index.ts` | Villkorlig visning + battre knapp |
| `supabase/functions/send-getkiku-invitation/index.ts` | Villkorlig visning + battre knapp |

## Anvandardflode

1. Rekryteraren skapar/redigerar ett jobb i admin
2. Aktiverar "Dolj foretagsnamn for kandidater"
3. Sparar jobbet
4. Pa annonssidan: foretagsnamn och logotyp visas inte
5. I bekraftelsemejl: "arbetsgivaren" visas istallet for foretagsnamn
6. I Getkiku-inbjudan: samma sak
