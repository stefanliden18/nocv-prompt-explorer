

# Uppdatera "Boka intervju"-flödet med tydligare kommunikation

## Vad ändras

Tre saker uppdateras i sidebar-kortet på både `JobDetail.tsx` och `DemoJobDetail.tsx`:

### 1. Byt rubrik och knapptext

- **Rubrik**: "Boka tid för intervju" -> "Boka intervju"
- **CTA-knapp** (innan formuläret visas): "Boka tid för intervju" -> "Boka intervju"
- **Submit-knapp** (i formuläret): "Boka tid för intervju" -> "Boka intervju"

### 2. Lägg till info-ruta efter submit-knappen

Under submit-knappen i formuläret läggs en liten informationstext till som förbereder användaren:

```text
+------------------------------------------+
|  [mail-ikon] En intervjulänk skickas      |
|  till din e-post. Kontrollera din         |
|  skräppost om du inte fått mailet         |
|  inom några minuter.                      |
+------------------------------------------+
```

Denna visas som en diskret `text-muted-foreground text-xs`-text med en mail-ikon, placerad direkt under "Boka intervju"-knappen men före "Avbryt".

### 3. Förbättra bekräftelsemeddelandet

Efter lyckad bokning uppdateras texten:

- **Före**: "Vi har skickat en bekräftelse till din e-post. Du kommer snart få information om när din AI-intervju äger rum."
- **Efter**: "Vi har skickat en intervjulänk till din e-post. Om du inte hittar mailet inom några minuter, kontrollera din skräppost."

## Tekniska detaljer

### Filer som ändras

| Fil | Ändringar |
|-----|-----------|
| `src/pages/JobDetail.tsx` | Byt rubrik (rad 670), CTA-text (rad 687), submit-text (rad 810), bekräftelsetext (rad 694-696), lägg till info-text under submit |
| `src/pages/DemoJobDetail.tsx` | Samma ändringar (rad 565, 582, 703, 590-592) |

### Ny info-ruta (kod)

Läggs till mellan submit-knappen och avbryt-knappen:

```tsx
<p className="text-xs text-muted-foreground text-center flex items-center justify-center gap-1">
  <Mail className="w-3 h-3" />
  En intervjulänk skickas till din e-post. Kolla skräpposten om mailet dröjer.
</p>
```

`Mail`-ikonen importeras redan inte -- den behöver läggas till i lucide-react-importen.

Inga databas- eller backend-ändringar behövs.
