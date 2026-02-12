

# Ändra varumärke från "NOCV" till "NoCV"

## Problem
Varumärket skrivs överallt som "NOCV" (versaler) men ska skrivs som "NoCV" (med liten 'o').

## Omfattning
Sökning visar ~382 relevanta instanser av "NOCV" att ändra (exklusive CSS-variabler som `nocv-dark-blue` etc. som är tekniska identifikatorer och bör behållas).

## Ändringspunkter

### 1. UI-komponenter (visuell text som användaren ser)
- **Navigation.tsx**: Logo text "NOCV" → "NoCV" + två "Tipsa om NOCV" → "Tipsa om NoCV"
- **Footer.tsx**: Logo text "NOCV" → "NoCV" + "NOCV – Rekrytering för framtidens industri" → "NoCV – Rekrytering för framtidens industri"
- **WhyNOCV.tsx**: 
  - Komponentnamn `WhyNOCV` → `WhyNoCV` (för konsekvens)
  - Heading "Varför NOCV?" → "Varför NoCV?"

### 2. Dialog & formulär
- **TipNOCVDialog.tsx**:
  - Komponentnamn `TipNOCVDialog` → `TipNoCV Dialog` (för konsekvens)
  - "Tipsa en vän om NOCV" → "Tipsa en vän om NoCV"
  - "Dela NOCV med någon..." → "Dela NoCV med någon..."
  - "Din vän kommer snart få ett mail om NOCV" → "Din vän kommer snart få ett mail om NoCV"
  - Variable names: `tipNOCVDialogOpen` → `tipNoCVDialogOpen`, `setTipNOCVDialogOpen` → `setTipNoCVDialogOpen`

### 3. Sidor
- **Dashboard.tsx**: "NOCV Admin" → "NoCV Admin"
- **CompaniesEdit.tsx**: "Förklara hur NOCV fungerar..." → "Förklara hur NoCV fungerar..."
- **Contact.tsx**: E-postadress "noreply@nocv.se" lämnas oförändrad (teknisk adress)
- **Index.tsx**: Import-namn `WhyNOCV` → `WhyNoCV`

### 4. Meta-data & SEO (index.html)
- Title: "NOCV - Sök jobb utan CV..." → "NoCV - Sök jobb utan CV..."
- Meta description: "Sök jobb utan CV på NOCV..." → "Sök jobb utan CV på NoCV..."
- Meta author: "NOCV" → "NoCV"
- Open Graph title: "NOCV - Sök jobb utan CV" → "NoCV - Sök jobb utan CV"
- Open Graph site_name: "NOCV" → "NoCV"
- Övriga Open Graph/Twitter meta tags uppdateras enligt samma mönster

### 5. Email-funktioner (backend/edge functions)
- **send-application-email/index.ts**: 
  - "NOCV Team" → "NoCV Team"
  - Signatur "NOCV Recruitment Platform" → "NoCV Recruitment Platform"
- **send-interview-invitation/index.ts**: "NOCV <onboarding@resend.dev>" → "NoCV <onboarding@resend.dev>"
- **send-interview-reminder/index.ts**: "NOCV <onboarding@resend.dev>" → "NoCV <onboarding@resend.dev>"

### 6. Databas & migrations
- **Migration SQL**: Text "Vi som har startat NOCV..." → "Vi som har startat NoCV..."

### 7. Konfiguration
- **public/sitemap.xml** & **generate-sitemap/index.ts**: 
  - URL:er behålls som "nocv.se" (domännamn, inte brand-text)
  - Men kommentarer/labels om relevant: ändra från "NOCV" → "NoCV"

### 8. Tester & dokumentation
- **TESTING_CHECKLIST.md**: "# NOCV System Testing Checklist" → "# NoCV System Testing Checklist"

## Variabler & identifikatorer som INTE ändras
- CSS-variabler: `nocv-dark-blue`, `nocv-orange`, etc. → lämnas oförändrade
- Databasenskolumn/tabell-names: lämnas oförändrade
- Miljö-variabler & API-nycklar: lämnas oförändrade
- Domännamnet "nocv.se" i URL:er: lämnas oförändrade (teknisk domän)

## Implementering
Ändringar görs med `lov-line-replace` på följande filer (i denna ordning för minimalt beroende):
1. index.html (meta-data)
2. src/components/WhyNOCV.tsx (+ döp om komponent)
3. src/components/TipNOCVDialog.tsx (+ döp om komponent)
4. src/components/Navigation.tsx (uppdatera importer + text)
5. src/components/Footer.tsx (uppdatera importer + text)
6. src/pages/Index.tsx (uppdatera importer)
7. src/pages/admin/Dashboard.tsx
8. src/pages/admin/CompaniesEdit.tsx
9. src/pages/Contact.tsx
10. supabase/functions/send-application-email/index.ts
11. supabase/functions/send-interview-invitation/index.ts
12. supabase/functions/send-interview-reminder/index.ts
13. supabase/migrations/*.sql
14. public/sitemap.xml
15. TESTING_CHECKLIST.md

