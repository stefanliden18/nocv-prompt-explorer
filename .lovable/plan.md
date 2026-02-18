
# Landningssida /sa-funkar-det — i NoCV:s grafiska profil

## Designprinciper

Sidan anvander exakt samma designsystem som ovriga sajten:

- **Farger**: `bg-nocv-dark-blue` (hero/morka sektioner), `bg-background` (ljusa sektioner), `bg-muted/30` (subtila sektioner)
- **Typsnitt**: `font-heading` for rubriker, `font-body` for brodtext
- **Knappar**: `variant="cta-primary"` (orange gradient) och `variant="cta-secondary"` — samma som pa startsidan
- **Kort**: `bg-white border-border shadow-card` — samma stil som pa /candidates
- **Gradient**: `bg-gradient-hero` for hero-sektionen (samma morkbla gradient som startsidan)
- **Text pa mork bakgrund**: `text-white`, `text-white/80`, `text-white/60` — precis som Footer och Hero
- **Ikoner**: Lucide-ikoner med `text-primary` / `text-secondary` — samma som pa /candidates

## Sidans uppbyggnad

### 1. Minimal header (landningssida — ingen fullstandig meny)
- Vit bakgrund med `border-b border-border shadow-sm` (samma stil som Navigation)
- NoCV-logotyp (vanster): `text-2xl font-bold font-heading text-primary` — exakt som i Navigation
- CTA-knapp (hoger): `variant="cta-primary"` — "Testa nu"
- Ingen ovrig navigation — fokuserad landningssida

### 2. Hero-sektion
- `bg-gradient-hero text-white` — samma gradient som pa startsidan
- Rubrik: "Sok jobb som att snacka med en kollega" i `font-heading font-bold`
- Undertext med `opacity-90` som pa Hero-komponenten
- CTA-knapp: `variant="cta-primary" size="xl"` — "Testa nu"

### 3. Sa funkar det — 4 steg (2x2 grid)
- Ljus bakgrund: `bg-background`
- Kort med `bg-white border-border hover:shadow-card` — samma som pa /candidates
- Numrerade steg med `bg-primary text-primary-foreground` (morkbla cirkel)
- Ikoner i `text-primary` / `text-secondary` vaxelvis
- Responsivt: 2 kolumner pa desktop, 1 pa mobil

### 4. Trust-bar
- `bg-muted/30` bakgrund — samma subtila nyans som "Success Stories" pa /candidates
- Fyra badges i rad med Lucide-ikoner
- Text i `text-foreground`, ikoner i `text-primary`

### 5. CTA-sektion
- `bg-background` med `cta-primary`-knapp
- Undertext i `text-muted-foreground`

### 6. Testimonial/citat
- `bg-gradient-hero text-white` — mork sektion for kontrast
- Citat med `text-white/90`, namn/titel med `text-nocv-orange`

### 7. FAQ — Accordion
- `bg-background` med befintlig Accordion-komponent
- Samma border-stil som ovriga sajten

### 8. Avslutande CTA
- `bg-muted/30` bakgrund
- `cta-primary`-knapp till /jobs

### 9. Footer
- Befintlig Footer-komponent — identisk med ovriga sajten

---

## Uppdatering av /candidates

Lagg till en ny "Sa funkar det"-sektion mellan hero och benefits:
- Samma 4 steg i kompakt 4-kolumnsformat
- `cta-primary`-knapp: "Testa nu — se lediga jobb"
- Anvaander samma kort-stil som ovriga sektionen

---

## Filer som skapas/andras

| Fil | Andring |
|-----|---------|
| `src/pages/HowItWorks.tsx` | **Ny fil** — landningssida med alla sektioner ovan |
| `src/App.tsx` | Lagg till route `/sa-funkar-det` |
| `src/pages/Candidates.tsx` | Lagg till "Sa funkar det"-sektion |

Ingen databasandring kravs. Helt statisk sida med befintliga UI-komponenter och designtokens.
