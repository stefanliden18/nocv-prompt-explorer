

## Tidsförslag och bekräftelse av intervju

### Översikt
Bygg ett system där portalanvändaren kan skicka 2 alternativa tidsförslag till kandidaten. Kandidaten får ett mejl med en länk till en publik sida där hen väljer en tid. Vald tid blir den bokade intervjun, och portalanvändaren kan se status (väntar / accepterad / nekad) i portalen.

### Nya koncept
- **Intervjuförslag (interview proposal):** Ersätter/kompletterar dagens direktbokning. Innehåller 2 tidsalternativ.
- **Bekräftelsesida:** En publik webbsida (ingen inloggning krävs) där kandidaten väljer tid.
- **Status-spårning:** Portalanvändaren ser om kandidaten har svarat.

### Flöde

1. Portalanvändaren klickar "Boka intervju" och väljer 2 alternativa datum/tider
2. Systemet skapar ett förslag med status "pending" och en unik token
3. Kandidaten får ett mejl med en länk till /interview-respond/[token]
4. Kandidaten ser de 2 alternativen och klickar pa det som passar
5. Systemet skapar den riktiga intervjubokningen, skickar bekräftelse till bada parter (med .ics)
6. Portalanvändaren ser status uppdateras i intervjulistan

### Teknisk plan

#### 1. Ny databastabell: `portal_interview_proposals`

| Kolumn | Typ | Beskrivning |
|--------|-----|-------------|
| id | uuid | PK |
| candidate_id | uuid | FK till portal_candidates |
| company_user_id | uuid | FK till company_users |
| status | text | "pending" / "accepted" / "declined" |
| respond_token | text | Unik token för publik länk |
| option_1_at | timestamptz | Tidsförslag 1 |
| option_2_at | timestamptz | Tidsförslag 2 |
| chosen_option | integer | 1 eller 2 (null tills kandidaten svarat) |
| duration_minutes | integer | Standard 30 |
| location_type | text | onsite/teams/phone |
| location_details | text | Adress/länk |
| notes | text | Anteckningar |
| created_at | timestamptz | |
| responded_at | timestamptz | När kandidaten svarade |

**RLS-policyer:** Samma mönster som portal_interviews — admin full access, company_users kan skapa/visa/uppdatera sina egna. Publik SELECT via respond_token för bekräftelsesidan.

#### 2. Uppdatera bokningsflödet (PortalBooking.tsx)

- Steg 1: Lägg till möjlighet att fylla i **2 datum/tider** istället för 1
- Alternativ: Behåll möjligheten att direktboka (1 tid) OCH erbjuda "Skicka tidsförslag" (2 tider)
- Steg 2 (bekräfta): Visa bada alternativen
- Steg 3 (klart): Visa att förslaget skickats och att man väntar pa svar

#### 3. Ny publik sida: `/interview-respond/:token`

- Ingen inloggning krävs
- Hämtar förslaget via respond_token
- Visar företagsnamn, de 2 tidsalternativen, plats etc.
- Kandidaten klickar pa en av tiderna
- Vid val:
  - Uppdaterar proposal (status = "accepted", chosen_option = 1/2)
  - Skapar en riktig `portal_interviews`-rad med vald tid
  - Uppdaterar kandidatstatus till "interview_booked"
  - Anropar edge function för att skicka bekräftelsemejl + .ics till bada parter

#### 4. Ny edge function: `send-interview-proposal`

- Skickar mejl till kandidaten med de 2 alternativen
- Inkluderar en knapp/länk till bekräftelsesidan
- Inget .ics i detta steg (det skickas först när kandidaten valt tid)

#### 5. Ny edge function: `confirm-interview-proposal`

- Anropas från bekräftelsesidan (publik, autentiseras via token)
- Skapar intervjubokningen
- Skickar bekräftelsemejl + .ics till bada kandidat och bokare (återanvänder befintlig logik)

#### 6. Uppdatera PortalInterviews.tsx

- Visa en ny sektion "Väntande förslag" med status (pending/accepted)
- Visa vilken tid kandidaten valde
- Länk till kandidatprofilen

#### 7. Uppdatera PortalStatusBadge och PortalCandidateCard

- Ny status "proposal_sent" visas som t.ex. "Förslag skickat" (gul badge)

### Vad som INTE ändras
- Befintlig direktbokning (1 tid) kan finnas kvar som alternativ
- Befintliga edge functions för intervjubekräftelse behålls och återanvänds
- Databasstrukturen för portal_interviews är oförändrad

### Sammanfattning av filer som ändras/skapas

| Fil | Åtgärd |
|-----|--------|
| Databasmigration | Ny tabell + RLS |
| src/pages/portal/PortalBooking.tsx | Utöka med 2-tidsval |
| src/pages/portal/PortalInterviews.tsx | Visa väntande förslag |
| src/pages/InterviewRespond.tsx | **Ny** — publik bekräftelsesida |
| src/App.tsx | Ny route |
| supabase/functions/send-interview-proposal/index.ts | **Ny** — mejl med förslag |
| supabase/functions/confirm-interview-proposal/index.ts | **Ny** — bekräfta + skapa bokning |
| src/components/portal/PortalStatusBadge.tsx | Ny status |

