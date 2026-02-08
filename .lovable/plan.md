
# Plan: Kandidatpresentation med Tvåstegs AI-matchning

## ✅ STATUS: IMPLEMENTERAD

Alla fyra faser är slutförda:
- ✅ Fas 1: Databas och grundstruktur
- ✅ Fas 2: Screening-flöde  
- ✅ Fas 3: Slutmatchning-flöde
- ✅ Fas 4: Kundvy

## Sammanfattning
Implementerat rekryteringssystem med **två distinkta matchningssteg**:
1. **Screening-matchning** (efter initial Kiku/Sara-intervju) → Beslut: "Gå vidare eller ej?"
2. **Slutmatchning** (efter fullständig digital intervju) → Genererar kundpresentation

---

## Flödesöversikt

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│                      STEG 1: INITIAL SCREENING                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Kandidat svarar på korta frågor via Kiku/Sara                              │
│                        ↓                                                     │
│  Rekryterare importerar transkript (ApplicationDetail)                      │
│                        ↓                                                     │
│  Väljer yrkesroll (bilmekaniker, servicetekniker, etc.)                     │
│                        ↓                                                     │
│  AI analyserar: "Ska denna kandidat gå vidare till intervju?"               │
│                        ↓                                                     │
│  ┌──────────────────────────────────────────────────────────────────┐       │
│  │  SCREENING-RESULTAT (visas för rekryterare)                      │       │
│  │  • Preliminary match score (0-100%)                              │       │
│  │  • Nyckelstyrkor                                                 │       │
│  │  • Eventuella röda flaggor                                       │       │
│  │  • Rekommendation: "Gå vidare" / "Avvakta" / "Ej lämplig"        │       │
│  └──────────────────────────────────────────────────────────────────┘       │
│                        ↓                                                     │
│  Rekryterare beslutar: Boka djupintervju?                                   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
                                   ↓
                    (Endast utvalda kandidater)
                                   ↓
┌─────────────────────────────────────────────────────────────────────────────┐
│                    STEG 2: FULLSTÄNDIG INTERVJU                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Kandidat genomför djupare digital intervju                                 │
│                        ↓                                                     │
│  Rekryterare importerar FULLSTÄNDIG transkribering                          │
│                        ↓                                                     │
│  AI gör detaljerad matchning mot:                                           │
│    • Yrkesrollens baskrav                                                   │
│    • Platsannonsens specifika krav                                          │
│    • Branschkunskap                                                         │
│                        ↓                                                     │
│  ┌──────────────────────────────────────────────────────────────────┐       │
│  │  SLUTMATCHNING & KANDIDATPRESENTATION                            │       │
│  │  • Övergripande match score (0-100%)                             │       │
│  │  • Detaljerad styrke-analys med citat från intervjun             │       │
│  │  • Teknisk kompetensbedömning                                    │       │
│  │  • Mjuka färdigheter-bedömning                                   │       │
│  │  • Eventuella utvecklingsområden                                 │       │
│  │  • Professionell sammanfattning                                  │       │
│  └──────────────────────────────────────────────────────────────────┘       │
│                        ↓                                                     │
│  Rekryterare granskar och publicerar                                        │
│                        ↓                                                     │
│  Kund får delningslänk och loggar in för att se kandidatprofil              │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Databas - Schema

### Tabell 1: role_profiles
Fördefinierade kravprofiler för de 8 yrkesrollerna.

| Kolumn | Typ | Beskrivning |
|--------|-----|-------------|
| id | uuid | Primärnyckel |
| role_key | text | "bilmekaniker", "servicetekniker", etc. |
| display_name | text | "Bilmekaniker" (för visning) |
| description | text | Kort beskrivning av rollen |
| technical_skills | jsonb | Tekniska kompetenser |
| soft_skills | jsonb | Mjuka färdigheter |
| knowledge_areas | jsonb | Kunskapsområden |
| screening_criteria | jsonb | Kriterier för initial screening |

**Initialdata:** 8 fördefinierade yrkesroller med branschspecifika krav.

---

### Tabell 2: candidate_transcripts
Lagrar transkriberade intervjusvar (stödjer flera per ansökan).

| Kolumn | Typ | Beskrivning |
|--------|-----|-------------|
| id | uuid | Primärnyckel |
| application_id | uuid | FK till applications |
| interview_type | text | "screening" eller "full_interview" |
| transcript_text | text | Full transkribering |
| structured_data | jsonb | Parsade frågor/svar (om möjligt) |
| imported_at | timestamptz | När den importerades |

---

### Tabell 3: candidate_assessments
AI-genererade bedömningar (en per intervjutyp).

| Kolumn | Typ | Beskrivning |
|--------|-----|-------------|
| id | uuid | Primärnyckel |
| application_id | uuid | FK till applications |
| transcript_id | uuid | FK till candidate_transcripts |
| role_profile_id | uuid | FK till role_profiles |
| assessment_type | text | "screening" eller "final" |
| match_score | integer | 0-100 |
| role_match_score | integer | 0-100 (matchning mot yrkesroll) |
| job_match_score | integer | 0-100 (matchning mot annons) |
| recommendation | text | "proceed" / "maybe" / "reject" (endast screening) |
| strengths | jsonb | Kandidatens styrkor |
| concerns | jsonb | Röda flaggor / utvecklingsområden |
| technical_assessment | text | Teknisk bedömning |
| soft_skills_assessment | text | Mjuka färdigheter |
| summary | text | AI-genererad sammanfattning |
| created_at | timestamptz | Skapad |

---

### Tabell 4: candidate_presentations
Publicerbara kundpresentationer (endast från slutmatchning).

| Kolumn | Typ | Beskrivning |
|--------|-----|-------------|
| id | uuid | Primärnyckel |
| application_id | uuid | FK till applications (UNIQUE) |
| final_assessment_id | uuid | FK till candidate_assessments |
| presentation_html | text | Renderad HTML-presentation |
| status | text | "draft" / "published" |
| share_token | text | Unik delningslänk |
| published_at | timestamptz | Publicerad tidpunkt |

---

## Backend Functions

### 1. generate-screening-assessment
Genererar initial screening-bedömning.

**Input:**
- application_id
- transcript_text (från Kiku/Sara screening)
- role_key (vald yrkesroll)

**Output:**
- Preliminary match score
- Nyckelstyrkor
- Eventuella röda flaggor
- Rekommendation: "proceed" / "maybe" / "reject"
- Kort sammanfattning

**AI-prompt fokus:** Snabb bedömning för att avgöra om kandidaten ska gå vidare.

---

### 2. generate-final-assessment
Genererar fullständig slutmatchning och kandidatpresentation.

**Input:**
- application_id
- transcript_text (från djupintervju)
- role_key
- job_id (för att hämta annonsens specifika krav)

**Output:**
- Detaljerad match score (roll + jobb)
- Styrkor med citat från intervjun
- Teknisk kompetensbedömning
- Mjuka färdigheter-bedömning
- Utvecklingsområden
- Professionell sammanfattning
- Renderad HTML-presentation

**AI-prompt fokus:** Djupanalys med konkreta exempel och professionellt presentationsformat.

---

## Frontend - Komponenter

### ApplicationDetail.tsx - Ny sektion
Lägg till ett nytt kort "Kandidatbedömning" med två flikar:

**Flik 1: Screening**
- Importera screening-transkript
- Välj yrkesroll (dropdown med 8 roller)
- Knapp: "Generera screening"
- Visa resultat: Match-score, styrkor, röda flaggor, rekommendation
- Knapp: "Boka djupintervju" (om godkänd)

**Flik 2: Slutmatchning**
- Importera fullständig transkribering
- Knapp: "Generera slutmatchning"
- Visa detaljerat resultat
- Förhandsgranska kundpresentation
- Knapp: "Publicera för kund"

---

### CandidatePresentationCustomerView
Publik sida för kunder (via delningslänk).

**Innehåll:**
- Kandidatens namn och roll
- Match-score visuellt
- Styrkor (utan känslig info)
- Teknisk och mjuk bedömning
- Professionell sammanfattning
- Responsiv design för utskrift

**Route:** `/presentation/:token` (ingen inloggning krävs, skyddad med token)

---

## Routes

| Route | Beskrivning |
|-------|-------------|
| `/admin/applications/:id` | Befintlig sida, utökas med bedömnings-sektion |
| `/presentation/:token` | Publik kundvy |

---

## De 8 Yrkesrollprofilerna

| Roll | Nyckelkompetenser |
|------|-------------------|
| **Bilmekaniker** | Diagnostik, motor/växellåda, bilmärken (VAG, Volvo, etc.), verkstadsrutiner |
| **Servicetekniker** | Serviceintervall, kundkontakt, felsökning, bokningssystem |
| **Plåtslagare** | Karossarbete, svetsning, MIG/MAG, dörrbyte, panel-justering |
| **Lackerare** | Färgblandning, sprayteknik, vattenbaserade lacker, ytbehandling |
| **Rekondare** | Detaljrengöring, polering, interiörvård, ceramic coating |
| **Däckskiftare** | Däckbyte, balansering, TPMS-sensorer, säsongslagring |
| **Kundmottagare** | Kundkommunikation, offerthantering, bokning, problemlösning |
| **Fordonstekniker** | Avancerad diagnostik, elektronik, hybrid/elbil, ADAS-system |

---

## Implementeringsordning

### Fas 1: Databas och grundstruktur
1. Skapa tabeller: `role_profiles`, `candidate_transcripts`, `candidate_assessments`, `candidate_presentations`
2. Sätta RLS-policies
3. Seeda de 8 yrkesrollprofilerna

### Fas 2: Screening-flöde
4. Skapa `generate-screening-assessment` edge function
5. Lägg till screening-import i ApplicationDetail
6. Visa screening-resultat

### Fas 3: Slutmatchning-flöde
7. Skapa `generate-final-assessment` edge function
8. Lägg till slutmatchning-import
9. Generera kandidatpresentation

### Fas 4: Kundvy
10. Skapa publik presentationssida
11. Implementera delningslänk

---

## Säkerhet

- **role_profiles:** Alla autenticerade kan läsa, endast admins kan redigera
- **candidate_transcripts:** Admins + job creators kan läsa/skriva
- **candidate_assessments:** Admins + job creators kan läsa/skriva
- **candidate_presentations:** Admins kan läsa/skriva, kundvy via unik token
- **Kundvy:** Skyddad med 64-teckens random token, ingen auth krävs
- **Känslig data:** Kundvyn visar INTE email, telefon eller fullständigt namn

---

## Tekniska val

- **AI-modell:** Lovable AI (google/gemini-3-flash-preview) - ingen API-nyckel krävs
- **Tool calling:** Strukturerad output för konsekvent dataformat
- **HTML-generering:** Tailwind-baserad, professionell layout
- **Share-token:** crypto.randomUUID() eller 64-teckens hex

