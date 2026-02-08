

# Plan: Kravprofilmallar per tjänstetyp

## Sammanfattning
Skapa ett system för att hantera **kundkravprofiler** - strukturerade mallar för att samla in rekryteringskrav från kundföretag. Mallarna varierar per tjänstetyp (bilmekaniker, servicetekniker, etc.) och sparas kopplat till jobb.

---

## Problemanalys

Kravprofilen du laddade upp innehåller:

| Sektion | Innehåll |
|---------|----------|
| **Grunduppgifter** | Företag, Roll, Bilmärke, Tillträde, Ort, Lön |
| **Tekniska krav** | Utbildning, Erfarenhet, Fordonsteknik (service, diagnostik, hybrid/el, etc.) |
| **Diagnostikverktyg** | OBD-scanner, märkesverktyg, oscilloskop, affärssystem |
| **Certifikat** | Högvolt, köldmedia, B-körkort |
| **Personliga egenskaper** | Top 5-egenskaper, arbetssätt, kundkontakt |
| **Team & Arbetsmiljö** | Teamstorlek, kultur, arbetstider |
| **Prioriteringar** | Top 3 måste-krav, dealbreakers |

---

## Lösningsdesign

### Arkitektur

```text
┌────────────────────────────────────────────────────────────────┐
│                  ADMIN: Kravprofilmallar                       │
│ /admin/requirement-templates                                   │
├────────────────────────────────────────────────────────────────┤
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────┐  │
│  │ Bilmekaniker     │  │ Servicetekniker  │  │ Plåtslagare  │  │
│  │ ─────────────    │  │ ─────────────    │  │ ──────────   │  │
│  │ • Motordiagnostik│  │ • Serviceintervall│ │ • Svetsning  │  │
│  │ • Växellåda      │  │ • Kundkontakt    │  │ • Karosseri  │  │
│  │ • OBD/Techstream │  │ • Affärssystem   │  │ • Struktur   │  │
│  └──────────────────┘  └──────────────────┘  └──────────────┘  │
└────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌────────────────────────────────────────────────────────────────┐
│                  ADMIN: Skapa Jobb                             │
│ /admin/jobs/new                                                │
├────────────────────────────────────────────────────────────────┤
│  Välj tjänstetyp: [Bilmekaniker ▼]                             │
│                              │                                  │
│  ┌───────────────────────────▼─────────────────────────────┐   │
│  │  KRAVPROFIL (förifyld från mall)                        │   │
│  │                                                          │   │
│  │  Tekniska krav:                                          │   │
│  │  ☑ Motordiagnostik   ☑ OBD-scanner                       │   │
│  │  ☐ Hybrid/Elteknik   ☑ Bromsystem                        │   │
│  │                                                          │   │
│  │  Erfarenhet: [3-5 år ▼]  Bilmärke: [VAG     ]           │   │
│  │                                                          │   │
│  │  Top 3 krav:                                             │   │
│  │  1. [Diagnostik                        ]                 │   │
│  │  2. [Självständig                      ]                 │   │
│  │  3. [Kundkontakt                       ]                 │   │
│  └──────────────────────────────────────────────────────────┘   │
└────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌────────────────────────────────────────────────────────────────┐
│            Sparas som strukturerad JSON i jobs-tabellen        │
│            Används av AI vid kandidat-matchning                │
└────────────────────────────────────────────────────────────────┘
```

---

## Databas

### Ny tabell: `requirement_templates`

| Kolumn | Typ | Beskrivning |
|--------|-----|-------------|
| id | uuid | Primärnyckel |
| role_key | text | Koppling till role_profiles (bilmekaniker, etc.) |
| display_name | text | "Bilmekaniker - Kravprofil" |
| template_data | jsonb | Strukturerad malldata (se nedan) |
| is_active | boolean | Om mallen är aktiv |
| created_at | timestamptz | Skapad |
| updated_at | timestamptz | Uppdaterad |

### JSON-struktur för `template_data`

```json
{
  "sections": [
    {
      "key": "education",
      "title": "Utbildning & Erfarenhet",
      "fields": [
        {
          "key": "min_education",
          "label": "Utbildning (minst krav)",
          "type": "select",
          "options": ["Gymnasial fordonsteknik", "Eftergymnasial", "Annat"]
        },
        {
          "key": "experience_years",
          "label": "Yrkeserfarenhet (antal år)",
          "type": "number"
        },
        {
          "key": "brand_required",
          "label": "Erfarenhet av bilmärke",
          "type": "brand_selector"
        }
      ]
    },
    {
      "key": "technical_skills",
      "title": "Tekniska krav",
      "fields": [
        {
          "key": "service_maintenance",
          "label": "Service & underhåll",
          "type": "checkbox"
        },
        {
          "key": "motor_diagnostics",
          "label": "Motordiagnostik",
          "type": "checkbox_with_level",
          "levels": ["Grund", "Avancerad"]
        },
        {
          "key": "hybrid_ev",
          "label": "Hybrid/Elteknik",
          "type": "checkbox_with_level",
          "levels": ["Grund", "Avancerad", "Högvoltsbehörighet"]
        }
      ]
    },
    {
      "key": "certifications",
      "title": "Certifikat & Behörigheter",
      "fields": [
        {
          "key": "high_voltage",
          "label": "Högvoltsbehörighet",
          "type": "requirement_level"
        },
        {
          "key": "refrigerant",
          "label": "Köldmediabehörighet",
          "type": "requirement_level"
        },
        {
          "key": "drivers_license",
          "label": "B-körkort",
          "type": "requirement_level"
        }
      ]
    },
    {
      "key": "soft_skills",
      "title": "Personliga egenskaper",
      "fields": [
        {
          "key": "top_qualities",
          "label": "Top 5 viktigaste egenskaper",
          "type": "ranked_list",
          "max_items": 5
        },
        {
          "key": "independence",
          "label": "Självständighet",
          "type": "select",
          "options": ["Mycket självständig", "Jobbar självständigt efter riktning", "Behöver nära uppföljning"]
        }
      ]
    },
    {
      "key": "priorities",
      "title": "Prioriteringar",
      "fields": [
        {
          "key": "must_haves",
          "label": "Top 3 absoluta krav",
          "type": "ranked_list",
          "max_items": 3
        },
        {
          "key": "dealbreakers",
          "label": "Dealbreakers",
          "type": "text"
        }
      ]
    }
  ]
}
```

### Uppdatering av `jobs`-tabellen

Lägg till ny kolumn:

| Kolumn | Typ | Beskrivning |
|--------|-----|-------------|
| requirement_profile | jsonb | Ifylld kravprofil (från mall) |

---

## Frontend-komponenter

### 1. RequirementTemplateManager (Admin)

**Route:** `/admin/requirement-templates`

- Lista alla mallar per yrkesroll
- Skapa/redigera mallar via formulär
- Aktivera/inaktivera mallar

### 2. RequirementProfileForm (I JobForm)

**Integreras i:** `/admin/jobs/new` och `/admin/jobs/:id/edit`

- Dropdown för att välja tjänstetyp
- Renderar dynamiskt formulär baserat på mallens `template_data`
- Fälttyper:
  - `checkbox` - Enkel kryssruta
  - `checkbox_with_level` - Kryssruta + nivåväljare
  - `select` - Dropdown
  - `number` - Numeriskt fält
  - `text` - Fritext
  - `ranked_list` - Rangordnad lista (drag-and-drop)
  - `requirement_level` - Krävs/Meriterande/Ej relevant
  - `brand_selector` - Bilmärkesväljare med fritext

### 3. RequirementProfileDisplay (I ApplicationDetail)

**Visar ifylld kravprofil för:** AI-matchning och rekryterarens referens.

---

## AI-integration

Uppdatera edge functions för att använda strukturerad kravprofil:

### `generate-screening-assessment`
- Läs `jobs.requirement_profile` istället för/utöver `requirements_md`
- Matcha kandidatens svar mot specifika checkboxar (motordiagnostik, certifikat, etc.)

### `generate-final-assessment`
- Använd kravprofilen för detaljerad matchningsanalys
- Generera presentation som visar hur kandidaten matchar varje kravkategori

---

## De 8 mallarna (basinnehåll)

| Roll | Specifika sektioner |
|------|---------------------|
| **Bilmekaniker** | Motordiagnostik, växellåda, el/hybrid, OBD-verktyg, märkeserfarenhet |
| **Servicetekniker** | Serviceintervall, kundkontakt, affärssystem, bokningssystem |
| **Plåtslagare** | Svetsning (MIG/MAG), karosseri, strukturmätning, kvalitetskrav |
| **Lackerare** | Färgblandning, sprayteknik, vattenbaserade lacker, miljökrav |
| **Rekondare** | Detaljrengöring, polering, ceramic coating, interiörvård |
| **Däckskiftare** | Däckmontage, balansering, TPMS, säsongslagring |
| **Kundmottagare** | Kommunikation, offert, bokning, problemlösning, affärssystem |
| **Fordonstekniker** | Avancerad diagnostik, ADAS, elbil, programmering, märkesverktyg |

---

## Implementeringsordning

### Fas 1: Databas
1. Skapa `requirement_templates`-tabellen
2. Lägg till `requirement_profile`-kolumn i `jobs`
3. Seeda 8 basmallar

### Fas 2: Admin-gränssnitt för mallar
4. Skapa `/admin/requirement-templates` sida
5. Implementera mallredigerare

### Fas 3: Integration i jobbformulär
6. Skapa `RequirementProfileForm`-komponent
7. Integrera i `JobForm.tsx` och `JobEdit.tsx`

### Fas 4: AI-uppdatering
8. Uppdatera screening-assessment att läsa strukturerad profil
9. Uppdatera final-assessment

---

## Tekniska detaljer

### RLS-policies för `requirement_templates`
- **SELECT:** Alla autenticerade användare
- **INSERT/UPDATE/DELETE:** Endast admins

### Typning
```typescript
interface RequirementTemplate {
  id: string;
  role_key: string;
  display_name: string;
  template_data: TemplateData;
  is_active: boolean;
}

interface TemplateData {
  sections: TemplateSection[];
}

interface TemplateSection {
  key: string;
  title: string;
  fields: TemplateField[];
}

interface TemplateField {
  key: string;
  label: string;
  type: 'checkbox' | 'checkbox_with_level' | 'select' | 'number' | 'text' | 'ranked_list' | 'requirement_level' | 'brand_selector';
  options?: string[];
  levels?: string[];
  max_items?: number;
}
```

---

## Fördelar med denna lösning

1. **Flexibilitet:** Varje yrkesroll har sin egen mall som kan anpassas
2. **Strukturerad data:** JSON-format möjliggör precisare AI-matchning
3. **Återanvändbarhet:** Mallar sparas och kan användas för flera jobb
4. **Enkel redigering:** Admin kan uppdatera mallar utan kodjusteringar
5. **Sömlös integration:** Kravprofilen används automatiskt i AI-bedömning

