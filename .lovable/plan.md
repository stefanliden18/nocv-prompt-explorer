

# Lägg till motiverande texter i bokningsflödet

## Översikt

Två textändringar i bokningsflödet för att få kandidater att känna sig trygga och våga genomföra intervjun.

## Ändring 1: Motiverande text ovanför namnfältet

Visas i formuläret, precis ovanför "Namn *":

> Du som hör på en motor om något är fel -- det här är din chans. Vi har byggt en intervju som testar hur du tänker, inte hur du skriver. Inga CV, inga ansökningsbrev, inga konstigheter. Fyll i nedan så skickar vi en länk. Tar ungefär 10 minuter och du gör det när du vill -- i soffan, på lunchen eller i verkstaden (vi skvallrar inte). Det är bara att köra igång när det passar dig :)

## Ändring 2: Ny bekräftelsetext efter bokning

Ersätter nuvarande bekräftelsemeddelande med:

**Rubrik:** "Snyggt!"

**Text:**
> Du har tagit första steget. Om en minut landar ett mail i din inbox med en länk till din intervju. Den tar drygt 10 minuter och handlar om dina motorkunskaper -- inga kuggfrågor, bara riktiga grejer du kan. Ingen ser dig, ingen dömer dig. Du svarar i din egen takt. Lycka till!
>
> Hittar du inget mail? Kolla skräpposten -- ibland hamnar det där.

## Filer som ändras

| Fil | Ändring |
|-----|---------|
| `src/pages/JobDetail.tsx` | Motiverande text ovanför namnfältet + ny bekräftelsetext med skräppost-tips |
| `src/pages/DemoJobDetail.tsx` | Samma ändringar i demo-versionen |

## Tekniska detaljer

Motiverande texten läggs in som ett `<p>`-element med klassen `text-sm text-muted-foreground leading-relaxed` direkt efter `<form>`-taggen och före det första formulärfältet.

Bekräftelsetexten uppdateras i det befintliga "success"-blocket. Rubriken ändras till "Snyggt!" och beskrivningen byts ut. Skräppost-tipset visas som en separat rad med kursiv stil.

Inga backend-ändringar behövs.

