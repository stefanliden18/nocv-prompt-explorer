

# Plan: Fixa kvarvarande företagsnamn och aktivera flaggan

## Problem
Funktionen "Dölj företagsnamn för kandidater" är redan implementerad i koden, men det finns **ett ställe som missades** och flaggan är inte aktiverad för det aktuella jobbet.

### 1. Flaggan är inte aktiverad
Jobbet "Servicetekniker till stort bilföretag i Norrort" har `hide_company_in_emails = false` i databasen. Du behöver:
1. Gå till **Admin > Jobb > Redigera** det aktuella jobbet
2. Aktivera switchen **"Dölj företagsnamn för kandidater"**
3. Spara

### 2. En plats i koden saknar villkoret
I "Boka tid för intervju"-rutan på jobbsidan står det fortfarande:
> "Boka en AI-intervju med **Europeiska Motor** genom att fylla i dina uppgifter nedan."

Denna text tar inte hänsyn till flaggan. Det behöver fixas.

## Teknisk ändring

| Fil | Rad | Ändring |
|-----|-----|---------|
| `src/pages/JobDetail.tsx` | 672 | Ändra `{job.companies?.name \|\| 'företaget'}` till `{hideCompany ? 'oss' : (job.companies?.name \|\| 'företaget')}` |
| `src/pages/DemoJobDetail.tsx` | Motsvarande rad | Samma ändring |

Texten blir: "Boka en AI-intervju med **oss** genom att fylla i dina uppgifter nedan." när flaggan är aktiv.

## Sammanfattning
- En kodfix (2 rader)
- Du aktiverar sedan flaggan i admin för det aktuella jobbet
