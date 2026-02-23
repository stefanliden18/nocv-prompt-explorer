

# SEO-plan for nocv.se

## Nuvarande problem (varfor ni knappt syns pa Google)

### 1. Statisk sitemap saknar de flesta sidor och alla jobb
Den statiska filen `public/sitemap.xml` listar bara 5 sidor. Det finns en backend-funktion (`generate-sitemap`) som dynamiskt genererar en sitemap med alla publicerade jobb, men den anvands inte. Google har alltsa ingen aning om era enskilda jobbsidor (`/jobb/servicetekniker-goteborg` etc).

**Saknade sidor i sitemap:**
- `/om-oss`
- `/sa-funkar-det`
- `/candidates` (borde vara `/for-jobbsokare` for svenska URL:er)
- Alla individuella jobbsidor (`/jobb/[slug]`)

### 2. Flera sidor saknar meta-taggar helt
Foljande sidor har **ingen** Helmet-komponent och saknar darmed title, description och Open Graph-taggar:
- **Kandidatsidan** (`/candidates`) -- ingen Helmet
- **Foretagssidan** (`/companies`) -- ingen Helmet
- **Kontaktsidan** (`/contact`) -- ingen Helmet

### 3. Ingen OG-bild pa nagon sida
Ingen enda sida har `og:image`. Nar nagon delar en lank pa LinkedIn, Facebook eller Slack visas ingen bild, vilket ger lagre klickfrekvens.

### 4. Strukturerad data (Schema.org) saknas pa de flesta sidor
- Bara `JobDetail` har `JobPosting`-schema (bra!)
- Startsidan saknar `Organization`-schema
- FAQ-sektionerna pa `/candidates` och `/sa-funkar-det` saknar `FAQPage`-schema (ger mojlighet till "rich snippets" i Google)

### 5. URL-struktur ar blandad engelska/svenska
- `/jobs` och `/candidates` ar engelska
- `/jobb/[slug]` och `/om-oss` ar svenska
- `/contact` ar engelska, `/sa-funkar-det` ar svenska

### 6. Footern visar fel artal
`(c) 2024 NoCV` borde vara dynamiskt.

---

## Atgardsplan

### Fas 1: Kritiska fixar (storst effekt)

**A. Aktivera dynamisk sitemap**
- Uppdatera `robots.txt` sa att Sitemap pekar pa backend-funktionens URL istallet for den statiska filen
- Uppdatera backend-funktionen `generate-sitemap` att inkludera ALLA publika sidor: `/`, `/jobs`, `/candidates`, `/companies`, `/contact`, `/om-oss`, `/sa-funkar-det`
- Alla publicerade jobbsidor (`/jobb/[slug]`) inkluderas redan

**B. Lagg till Helmet pa alla publika sidor**
For varje sida som saknar det, lagg till:
- `<title>` med unik, beskrivande titel
- `<meta name="description">` med unik beskrivning (max 155 tecken)
- `<meta property="og:title">`, `og:description`, `og:url`, `og:type`
- `<link rel="canonical">` med korrekt URL

Foreslagna titlar:
| Sida | Title |
|------|-------|
| `/` | NoCV -- Sok jobb utan CV, Hitta personal baserat pa kompetens |
| `/candidates` | For jobbsokare -- Sok jobb utan CV pa 10 minuter, NoCV |
| `/companies` | For foretag -- Hitta ratt kandidat utan CV-genomgang, NoCV |
| `/contact` | Kontakta NoCV -- Boka demo eller stall en fraga |
| `/om-oss` | Om NoCV -- Var historia och varderingar |
| `/sa-funkar-det` | Sa funkar det -- AI-intervju pa 10 minuter, NoCV |

**C. Lagg till OG-bild**
- Skapa en standard OG-bild (1200x630px) som anvands pa alla sidor som inte har en egen
- Lagg till `<meta property="og:image">` pa varje sida

### Fas 2: Strukturerad data for rich snippets

**D. Organization-schema pa startsidan**
```text
{
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "NoCV",
  "url": "https://nocv.se",
  "description": "Rekrytering utan CV...",
  "contactPoint": { ... }
}
```

**E. FAQPage-schema pa Kandidatsidan och Sa funkar det**
Google kan visa FAQ-svar direkt i sokresultaten. Bada sidorna har redan FAQ-innehall -- det behover bara wrappas i korrekt JSON-LD.

**F. WebSite-schema med SearchAction**
Gor det mojligt for Google att visa en sokruta direkt i sokresultaten for nocv.se.

### Fas 3: Smafix

**G. Uppdatera footer-aret dynamiskt**
Byt `(c) 2024` till `(c) {new Date().getFullYear()}`.

**H. Lagg till `lang="sv"` i HTML**
Finns redan i `index.html` -- bra!

---

## Teknisk sammanfattning

| Fil | Andringar |
|-----|-----------|
| `robots.txt` | Uppdatera Sitemap-URL till edge function |
| `supabase/functions/generate-sitemap/index.ts` | Lagg till saknade statiska sidor |
| `src/pages/Index.tsx` | Lagg till Helmet med meta + Organization JSON-LD |
| `src/pages/Candidates.tsx` | Lagg till Helmet + FAQPage JSON-LD |
| `src/pages/Companies.tsx` | Lagg till Helmet |
| `src/pages/Contact.tsx` | Lagg till Helmet |
| `src/pages/HowItWorks.tsx` | Lagg till FAQPage JSON-LD (Helmet finns redan) |
| `src/components/Footer.tsx` | Dynamiskt artal |

Totalt ca 8 filer att uppdatera. Inga nya databastabeller behövs.

