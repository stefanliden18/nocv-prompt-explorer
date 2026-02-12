

# Flytta "Dölj företagsnamn" direkt under Företag-fältet

## Vad som ändras
Switchen "Dölj företagsnamn för kandidater" flyttas till en mer logisk position: **direkt under dropdownen där du väljer företag**. Så behöver du inte scrolla ner för att hitta den.

## Visuellt resultat

Formuläret kommer se ut så här i toppen:

```text
Titel *
[ Servicetekniker till stort bilföretag i Norrort ]

Företag *
[ Europeiska Motor                              v ]

+--------------------------------------------------+
| [toggle] Dölj företagsnamn för kandidater        |
|          Företaget visas inte i annonsen eller    |
|          i mejl till kandidater                   |
+--------------------------------------------------+

Stad *                    Region
[ Stockholm ]             [ Stockholms län ]
```

Den amber-färgade ramen behålls så att switchen är tydlig och lätt att hitta.

## Tekniska ändringar

### src/pages/admin/JobEdit.tsx
- **Ta bort** switchen från rad 531-543 (nuvarande position efter "Kräver körkort")
- **Lägg till** samma switch-block direkt efter Företag-selecten (efter rad 454)

### src/pages/admin/JobForm.tsx
- Samma ändring: flytta switchen från nuvarande position till direkt efter Företag-fältet för konsistens

Ingen funktionell ändring -- bara position i formuläret.
