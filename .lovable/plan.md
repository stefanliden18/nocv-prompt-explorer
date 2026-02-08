
# Plan: Kravprofilbibliotek med databassparning

## Översikt

Just nu sparas kravprofiler endast i webbläsarens minne (localStorage), vilket innebär att:
- Data försvinner om du rensar webbläsaren
- Du kan inte se sparade profiler från andra enheter
- Det finns inget bibliotek att bläddra i

Vi skapar ett **kravprofilbibliotek** där du kan:
- Spara kravprofiler permanent i databasen
- Se alla sparade profiler i en lista
- Öppna och återanvända profiler
- Redigera befintliga profiler
- Ta bort profiler du inte längre behöver

---

## Nya funktioner

### 1. Biblioteksvy med flikar

Sidan `/admin/requirement-templates` får två flikar:
- **Ny kravprofil** - Formuläret som finns idag (CustomerInterviewForm)
- **Mina kravprofiler** - Lista över alla sparade profiler

### 2. Sparade kravprofiler i listan visar

- Företagsnamn (från kundinformation)
- Tjänstetyp (t.ex. "Bilmekaniker")
- Skapad datum
- Status (utkast / kopplad till jobb)
- Knappar: Öppna, Koppla till jobb, Ta bort

### 3. Arbetsflöde

```text
┌─────────────────────────────────────────────────────────────────┐
│  KRAVPROFILER                                                   │
├─────────────────────────────────────────────────────────────────┤
│  [Ny kravprofil] [Mina kravprofiler]                            │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│  Mina kravprofiler                                              │
├─────────────────────────────────────────────────────────────────┤
│  ┌───────────────────────────────────────────────────────────┐  │
│  │ Mekaniker - AutoExpert AB              2025-02-08         │  │
│  │ Status: Utkast                    [Öppna] [Koppla] [✕]    │  │
│  └───────────────────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │ Diagnostekniker - CarService AB        2025-02-05         │  │
│  │ Status: Kopplad till jobb         [Öppna] [Visa jobb] [✕] │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Tekniska ändringar

### 1. Ny databastabell: `saved_requirement_profiles`

Skapar en ny tabell för att lagra kravprofiler:

```sql
CREATE TABLE saved_requirement_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by UUID NOT NULL REFERENCES auth.users(id),
  template_id UUID NOT NULL REFERENCES requirement_templates(id),
  
  -- Kundinformation
  company_name TEXT NOT NULL,
  contact_person TEXT,
  desired_start_date TEXT,
  salary_range TEXT,
  
  -- Kravprofildata (JSON)
  profile_data JSONB NOT NULL,
  section_notes JSONB,
  
  -- Status
  linked_job_id UUID REFERENCES jobs(id),
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

### 2. RLS-policies för säkerhet

- Admins kan se alla kravprofiler
- Rekryterare kan se och hantera sina egna kravprofiler
- Endast skaparen eller admin kan ta bort

### 3. Uppdatera CustomerInterviewForm

- Lägg till `profileId` state för att hålla reda på om vi redigerar en befintlig profil
- Ändra "Spara utkast" till att spara i databasen istället för localStorage
- Lägg till "Spara som ny" knapp när man redigerar befintlig profil
- Behåll localStorage som temporär backup (vid oavsiktlig stängning)

### 4. Ny komponent: SavedProfilesList

Skapar en ny komponent som visar listan över sparade profiler med:
- Sökfunktion
- Sortering efter datum/företag
- Filtrering (utkast/kopplade)
- Åtgärdsknappar

### 5. Uppdatera RequirementTemplates-sidan

Lägg till flikar (Tabs) för att växla mellan "Ny profil" och "Bibliotek".

---

## Filer som skapas/ändras

| Fil | Ändring |
|-----|---------|
| **Databas** | Ny tabell `saved_requirement_profiles` med RLS |
| `src/components/SavedProfilesList.tsx` | **NY** - Listkomponent för biblioteket |
| `src/pages/admin/RequirementTemplates.tsx` | Lägg till flikar och routing |
| `src/components/CustomerInterviewForm.tsx` | Spara till databas, ladda befintlig profil |
| `src/types/requirementTemplate.ts` | Lägg till `SavedRequirementProfile` interface |

---

## Databasschema

```text
saved_requirement_profiles
├── id (uuid, PK)
├── created_by (uuid, FK → auth.users)
├── template_id (uuid, FK → requirement_templates)
├── company_name (text)
├── contact_person (text)
├── desired_start_date (text)
├── salary_range (text)
├── profile_data (jsonb)
├── section_notes (jsonb)
├── linked_job_id (uuid, FK → jobs, nullable)
├── created_at (timestamptz)
└── updated_at (timestamptz)
```

---

## Säkerhet

- RLS-policies säkerställer att endast behöriga användare kan se/redigera profiler
- Skaparen kan alltid hantera sina egna profiler
- Admins har full åtkomst
- Koppling till `created_by` säkerställer att varje profil har en ägare
