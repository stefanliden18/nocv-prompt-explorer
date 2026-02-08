# Plan: Koppla kravprofil till jobb + AI-genererad platsannons

**Status: ✅ Implementerad**

## Översikt

CustomerInterviewForm har nu två tydliga vägar efter att kravprofilen är ifylld:

1. **Koppla till befintligt jobb** - Välj från dropdown och spara kravprofilen direkt till jobbet
2. **Skapa nytt jobb med AI-genererad annons** - AI läser kravprofilen och genererar ett förslag till platsannons som du manuellt kan redigera före publicering

## Implementerade filer

| Fil | Ändring |
|-----|---------|
| `supabase/functions/generate-job-ad/index.ts` | **NY** - Edge function för AI-generering med Lovable AI |
| `supabase/config.toml` | Lagt till generate-job-ad function |
| `src/components/CustomerInterviewForm.tsx` | Jobbkopplings-UI med RadioGroup för val av metod |
| `src/pages/admin/JobForm.tsx` | Läser AI-genererad data från sessionStorage + visar banner |

## Användarflöde

### Flöde 1: Koppla till befintligt jobb
1. Fyll i kravprofilen
2. Välj "Koppla till befintligt jobb" i sektionen längst ner
3. Välj jobb från dropdown
4. Klicka "Koppla kravprofil"
5. Jobbet uppdateras med kravprofilen

### Flöde 2: Skapa nytt jobb med AI
1. Fyll i kravprofilen
2. Välj "Skapa nytt jobb med AI-hjälp"
3. Klicka "Generera annons"
4. AI analyserar profilen och genererar titel, beskrivning, krav, kategori och anställningsform
5. Navigering till JobForm med förfylld data
6. Granska, redigera vid behov, spara
