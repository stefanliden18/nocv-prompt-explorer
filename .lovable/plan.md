

# Omdesign av Om oss-sidan med redigerbart innehall

## Oversikt

Om oss-sidan byggs om till en visuellt engagerande layout med hero, pull-quote, bild, siffror, varderingskort och CTA. Alla textsektioner hamtas fran databasen (`page_content`-tabellen) sa att de kan redigeras via admin-panelen. Nya sektioner laggs till i databasen, och AboutEdit-sidan uppgraderas med en editor per sektion.

## Databasandringar

Nya rader laggs till i `page_content`-tabellen (page_key = `about`). Befintlig hero-rad behalles. Nya sektioner:

| section_key | title | display_order | Standardinnehall |
|---|---|---|---|
| `hero` (finns redan) | Om NOCV | 1 | Befintlig text |
| `pull_quote` | Pull-quote | 2 | "Du kan vara den basta mekanikern i branschen men ha varldens trakigaste CV." |
| `body_1` | Stycke 1 | 3 | Forsta stycket fran befintlig text |
| `body_2` | Stycke 2 | 4 | Andra stycket |
| `body_3` | Stycke 3 | 5 | Tredje stycket |

Siffror, varderingar och CTA ar statiska (inte CMS-styrda) eftersom de ar strukturerade med ikoner/knappar och inte enbart text.

## Andringar i detalj

### 1. `src/pages/About.tsx` -- Total omskrivning

**Hero-sektion**: Mork bakgrund (`bg-gradient-hero`), stor vit rubrik "Vi tror inte pa CV:n. Vi tror pa manniskor." -- hamtas fran CMS (`hero`-sektionen), med statisk fallback.

**Stycke 1**: Max 680px bredd, centrerat. Innehall fran CMS (`body_1`).

**Pull-quote**: Orange text, stor storlek, centrerat. Innehall fran CMS (`pull_quote`).

**Stycke 2**: Max 680px. Innehall fran CMS (`body_2`).

**Bild**: Befintlig `about-hero-industrial-team.jpg`, full bredd med rundade horn.

**Stycke 3**: Max 680px. Innehall fran CMS (`body_3`).

**Siffror**: Statisk sektion med tre kolumner (30+ ar, 100%, 0 dokument).

**Varderingar**: Statisk sektion med tre kort (Heart, Award, Smartphone-ikoner).

**CTA**: Statisk sektion med tva knappar till `/jobs` och `/companies`.

Admin-knappen "Redigera sida" behalles for inloggade admins.

### 2. `src/pages/admin/AboutEdit.tsx` -- Uppgradering med flera sektioner

Bygger ut editorn fran en enda RichTextEditor till en editor per CMS-sektion:
- **Hero-rubrik** (hero)
- **Stycke 1** (body_1)
- **Pull-quote** (pull_quote) -- enkel textarea eller rik editor
- **Stycke 2** (body_2)
- **Stycke 3** (body_3)

Varje sektion far sin egen RichTextEditor med tydlig rubrik. En gemensam "Spara"-knapp sparar alla sektioner pa en gang. Forhandsvisning visar hela sidan i hogerspalten.

### 3. Databasinsattning

Nya rader lags in i `page_content` med INSERT for de sektioner som inte redan finns (`pull_quote`, `body_1`, `body_2`, `body_3`). Befintlig `hero`-rad behalles oforandrad.

## Teknisk sammanfattning

| Fil | Andring |
|---|---|
| `page_content` (databas) | INSERT 4 nya rader: `pull_quote`, `body_1`, `body_2`, `body_3` med page_key `about` |
| `src/pages/About.tsx` | Total omskrivning: hero med mork bakgrund, uppdelad CMS-text, pull-quote, bild, siffror, varderingar, CTA. Alla textsektioner hamtas fran databasen. |
| `src/pages/admin/AboutEdit.tsx` | Uppgradering: en RichTextEditor per sektion (hero, body_1, pull_quote, body_2, body_3). Gemensam spara-knapp. |

Inga nya routes eller nya filer behovs. Befintlig RLS-policy pa `page_content` tillater redan publikt lasande och admin-redigering.

