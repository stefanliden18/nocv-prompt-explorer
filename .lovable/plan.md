
# Gör skräppost-texten kursiv

## Vad vi gör

Lägger till `italic` i CSS-klassen på raden "En intervjulänk skickas till din e-post. Kolla skräpposten om mailet dröjer." i bokningsformuläret. Storleken (text-xs) behålls som den är.

## Filer som ändras

| Fil | Rad | Ändring |
|-----|-----|---------|
| `src/pages/JobDetail.tsx` | ~819 | Lägg till `italic` i className |
| `src/pages/DemoJobDetail.tsx` | ~712 | Samma ändring |

## Tekniska detaljer

Ändrar klassen från:
```
text-xs text-muted-foreground text-center flex items-center justify-center gap-1
```
till:
```
text-xs text-muted-foreground italic text-center flex items-center justify-center gap-1
```

En enda CSS-klass tillagd per fil, inget annat ändras.
