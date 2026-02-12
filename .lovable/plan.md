

# Fix: Visa länken synligt vid "Kopiera länk"

## Problem
Knappen "Kopiera länk" forsaker kopiera URL:en till urklipp via `navigator.clipboard.writeText()`, men det fungerar inte alltid (t.ex. i vissa webbläsare, HTTP-miljöer eller iframes). Användaren ser bara ett meddelande "Länk kopierad!" utan att faktiskt ha fått länken.

## Lösning
Visa länken synligt i toasten/meddelandet så att användaren alltid kan se och manuellt kopiera den, oavsett om clipboard-API:et fungerar eller inte. Dessutom hanterar vi fallet där clipboard misslyckas genom en try/catch.

## Tekniska ändringar

### 1. src/pages/JobDetail.tsx
- Wrappa `navigator.clipboard.writeText()` i en try/catch
- Vid lyckad kopiering: visa toast med "Länk kopierad!" + länken som description
- Vid misslyckad kopiering: visa toast med länken synlig så användaren kan kopiera manuellt
- Uppdatera toast-description till att inkludera den faktiska URL:en

### 2. src/pages/DemoJobDetail.tsx
- Samma fix som ovan for konsistens

### Kodändring (JobDetail.tsx, rad 554-561)
Från:
```js
navigator.clipboard.writeText(`https://nocv.se/jobb/${job.slug}`);
setLinkCopied(true);
setTimeout(() => setLinkCopied(false), 2000);
toast({ title: "Länk kopierad!", description: "Jobblänken har kopierats till urklipp." });
```

Till:
```js
const jobUrl = `https://nocv.se/jobb/${job.slug}`;
try {
  await navigator.clipboard.writeText(jobUrl);
  setLinkCopied(true);
  setTimeout(() => setLinkCopied(false), 2000);
  toast({ title: "Länk kopierad!", description: jobUrl });
} catch {
  setLinkCopied(true);
  setTimeout(() => setLinkCopied(false), 2000);
  toast({ title: "Kopiera länken nedan:", description: jobUrl });
}
```

Knappens onClick görs till en async-funktion för att stödja await på clipboard.

