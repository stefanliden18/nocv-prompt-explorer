

# Visa kandidatens kontaktuppgifter i den delade presentationen

## Vad som gors

Lagt till telefonnummer och e-postadress i den publika kandidatpresentationen sa att kunden direkt kan kontakta kandidaten for att boka en intervju.

## Andringar

### 1. src/pages/CandidatePresentation.tsx
- Lagg till `email` och `phone` i select-fragan fran `applications`
- Skicka med `candidateEmail` och `candidatePhone` till `PresentationData`

### 2. src/components/CandidatePresentationView.tsx
- Lagg till `candidateEmail?: string` och `candidatePhone?: string` i `PresentationData`-interfacet
- Lagg till ett nytt kontaktkort ("Kontaktuppgifter") i presentationen, placerat nara toppen (under score-cirklarna)
- Kortet visar:
  - E-postadress som klickbar mailto-lank
  - Telefonnummer som klickbar tel-lank
  - Tydlig rubrik "Kontakta kandidaten for intervju"
  - Anvander Mail- och Phone-ikoner fran lucide-react

### Visuellt resultat

```text
+-------------------------------------------+
| Kontaktuppgifter                          |
|                                           |
|  Mail  kandidat@email.com                 |
|  Tel   070-123 45 67                      |
|                                           |
+-------------------------------------------+
```

### Ingen databasandring behovs
Fälten `email` och `phone` finns redan i `applications`-tabellen och ar tillgangliga via den befintliga RLS-policyn for publicerade presentationer.

