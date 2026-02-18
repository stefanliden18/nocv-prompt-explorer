

# Informationsbubbla på "Lediga jobb"-sidan

## Vad

En flytande informationsknapp (cirkulär ikon, t.ex. ett fragetecken eller en "HelpCircle"-ikon) som sitter i hero-sektionen pa Jobs-sidan, nara rubriken eller under filtren. Nar man hovrar over den visas en kort forklaring i en popover/tooltip, och nar man klickar oppnas en storre popover med de 4 stegen + en lank till `/sa-funkar-det`.

## Hur det ska kannas

Avslappnat, varmt och riktat till hantverkare. Texten ska vara i samma ton som landningssidan — "fikarums-snack", inte "foretags-info".

## Beteende

- **Hover**: En kort text visas, t.ex. "Hur funkar det att soka jobb har? Klicka sa berattan vi!"
- **Klick**: En popover oppnas med:
  1. Rubrik: "Sa enkelt ar det"
  2. De 4 stegen i kompakt lista (ikon + rubrik + en rad beskrivning)
  3. Trust-rad: "10 min | Inget CV | Funkar pa mobilen"
  4. Knapp: "Las mer" som lankar till `/sa-funkar-det`

## Design

- Ikonen: `HelpCircle` fran Lucide, stilad i `text-white` med `bg-primary/80` (morkbla med lite transparens) — floatande i hero-sektionen
- Hover-effekt: Skalning + skuggning (`hover:scale-110 hover:shadow-lg`)
- Popover: `bg-white` med `border-border shadow-card` — samma kort-stil som resten av sajten
- Stegen i popovern har sma numrerade cirklar i `bg-primary text-white`
- Responsivt: Pa mobil ar popovern fullbredd

## Placering

Bredvid resultat-raknaren ("Visar X-Y av Z jobb"), eller som en flytande knapp i nedre hogra hornet av hero-sektionen. Den ska synas men inte vara i vagen.

## Tekniskt

### Fil som andras

| Fil | Andring |
|-----|---------|
| `src/pages/Jobs.tsx` | Lagg till en `Popover`-komponent med `HelpCircle`-ikon och informationsinnehall |

### Komponenter som anvands
- Befintlig `Popover` / `PopoverTrigger` / `PopoverContent` fran `@radix-ui/react-popover`
- `HelpCircle` ikon fran `lucide-react`
- `Button` med `variant="cta-primary"` for "Las mer"-lanken
- `Link` fran `react-router-dom` for navigering till `/sa-funkar-det`

### Exempelstruktur i koden

```text
+------------------------------------------+
|  Hero-sektion (befintlig)                |
|                                          |
|  "Visar 1-12 av 24 jobb"  [?]           |
|                                  |       |
|                          Popover visas:  |
|                          +-----------+   |
|                          | Sa enkelt |   |
|                          | ar det    |   |
|                          |           |   |
|                          | 1. Valj.. |   |
|                          | 2. Svara. |   |
|                          | 3. Vi...  |   |
|                          | 4. Match. |   |
|                          |           |   |
|                          | [Las mer] |   |
|                          +-----------+   |
+------------------------------------------+
```

Ingen databasandring kravs. Helt statisk tillagg med befintliga UI-komponenter.
