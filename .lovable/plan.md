

# Installera Meta Pixel

## Oversikt

Vi installerar Meta Pixel med ID `506887683107389` pa hela hemsidan. Pixeln spaarar sidvisningar automatiskt och vi laegger till haendelsespaaring for viktiga handlingar.

## Filer som skapas/aendras

| Fil | Aendring |
|-----|---------|
| `src/components/MetaPixel.tsx` | Ny komponent som laddar pixelskriptet och spaarar sidvisningar vid navigation |
| `src/lib/metaPixel.ts` | Hjaelpfunktioner for att skicka haendelser (Lead, Contact, ViewContent) |
| `src/App.tsx` | Importera och rendera MetaPixel-komponenten |
| `src/pages/JobDetail.tsx` | Laegga till ViewContent-haendelse vid jobbvisning |
| `src/pages/Contact.tsx` | Laegga till Lead-haendelse vid inskickat kontaktformular |

## Tekniska detaljer

### MetaPixel.tsx
- Injicerar Meta Pixel-baskoden i `<head>` via `useEffect`
- Initierar pixeln med ID `506887683107389`
- Lyssnar pa route-forandringar via `useLocation` fran react-router-dom och skickar `PageView` vid varje navigering
- Inkluderar `<noscript>`-fallback via en dold bild

### metaPixel.ts
```typescript
// Deklarera fbq pa window-objektet
declare global {
  interface Window { fbq: any; }
}

export const trackMetaEvent = (eventName: string, params?: Record<string, any>) => {
  if (window.fbq) {
    window.fbq('track', eventName, params);
  }
};
```

### Haendelser som spaaras
- **PageView** - automatiskt vid varje sidnavigering
- **ViewContent** - naar naagon tittar pa en jobbannons
- **Lead** - naar naagon skickar kontaktformularet

