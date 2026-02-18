
# Komplett intervjubokningsflöde i kundportalen

## Problem idag
- Kandidater i portalen har ingen e-postadress lagrad
- Ingen e-post skickas vid bokning
- Ingen kalenderintegration (iCal) finns
- Ingen spårning av om kandidaten bekraftat

## Plan

### 1. Lagg till e-post pa portal_candidates
Ny databaskolumn `email` (text, nullable) pa tabellen `portal_candidates`.

### 2. Skicka bokningsmail vid intervjubokning
Nar en intervju bokas i `PortalBooking.tsx`, anropa en edge function som skickar ett snyggt mail till kandidaten med:
- Datum och tid
- Plats/moteeslank
- Eventuella anteckningar
- En iCal-bilaga (.ics-fil) som kandidaten kan lagga till i sin kalender

### 3. Skapa edge function: send-portal-interview-invitation
En ny backend-funktion som:
- Tar emot `portalInterviewId`
- Hamtar kandidat- och intervjudata fran databasen
- Genererar en iCal-fil (.ics) som e-postbilaga
- Skickar mailet via Resend (avsandare: noreply@nocv.se)

### 4. Uppdatera PortalBooking.tsx
Efter lyckad bokning, anropa edge-funktionen for att skicka mailet. Visa tydlig feedback om att mail skickats (eller ej, om e-post saknas).

### 5. Visa bekraftelsestatus (enkel version)
Lagg till en kolumn `email_sent` (boolean) pa `portal_interviews` sa att det syns i intervjulistan om mail gatt ut. Kalenderbekraftelse fran kandidaten kan **inte** sparas automatiskt utan en extern tjanst (Google/Outlook API), men iCal-bilagan gor det enkelt for kandidaten att lagga in motet.

---

## Tekniska detaljer

### Databasandringar
```sql
ALTER TABLE portal_candidates ADD COLUMN email text;
ALTER TABLE portal_interviews ADD COLUMN email_sent boolean DEFAULT false;
```

### Ny edge function: send-portal-interview-invitation
- Hamtar intervju + kandidatdata via service role
- Bygger iCal (.ics) innehall som textbilaga
- Skickar via Resend med HTML-mall liknande befintliga intervjumail
- Returnerar success/failure

### Filandringar
- `supabase/functions/send-portal-interview-invitation/index.ts` (ny)
- `src/pages/portal/PortalBooking.tsx` (anropa edge function efter bokning)
- `src/pages/portal/PortalCandidateProfile.tsx` (visa e-post om den finns)

### Begrensningar
- Kalenderbekraftelse (RSVP-tracking) kraver integration med Google Calendar API eller Microsoft Graph — ligger utanfor scope. iCal-bilagan ar den pragmatiska losningen.
