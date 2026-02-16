

# Ändra stil på skräppost-texten

## Vad vi gör

Ändrar texten "En intervjulänk skickas till din e-post. Kolla skräpposten om mailet dröjer." till större storlek, fet och kursiv stil.

## Filer som ändras

| Fil | Ändring |
|-----|---------|
| `src/pages/JobDetail.tsx` | Ändra className från `text-xs ... italic` till `text-sm ... font-bold italic` |
| `src/pages/DemoJobDetail.tsx` | Samma ändring |

## Tekniska detaljer

Ändrar klassen från:
```
text-xs text-muted-foreground italic text-center flex items-center justify-center gap-1
```
till:
```
text-sm text-muted-foreground font-bold italic text-center flex items-center justify-center gap-1
```

`text-xs` blir `text-sm` (större) och `font-bold` läggs till (fet). `italic` finns redan kvar.

