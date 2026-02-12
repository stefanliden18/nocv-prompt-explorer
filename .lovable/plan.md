

# Plan: Gör "Dölj företagsnamn"-switchen synlig och framträdande

## Problem
Switchen "Dölj företagsnamn för kandidater" finns i koden och i DOM:en, men syns inte visuellt på sidan. Troligen beror det på att den smälter in mellan andra fält utan tillräcklig visuell markering.

## Losning
Flytta switchen till en mer framträdande position (direkt efter "Kräver körkort") och ge den en visuellt distinkt stil med en färgad bakgrund och ram, så att den är omöjlig att missa.

## Teknisk ändring

### src/pages/admin/JobEdit.tsx
1. **Flytta** switchen från sin nuvarande position (rad 556-568, mellan GetKiku och Publiceringsdatum)
2. **Placera** den direkt efter "Kräver körkort"-switchen (rad 530)
3. **Styla** den med en framträdande bakgrund och ram:

```
<div className="flex items-center space-x-2 p-3 rounded-lg border border-amber-200 bg-amber-50">
  <Switch ... />
  <div>
    <Label>Dölj företagsnamn för kandidater</Label>
    <p className="text-xs text-muted-foreground">
      Företaget visas inte i annonsen eller i mejl till kandidater
    </p>
  </div>
</div>
```

### src/pages/admin/JobForm.tsx
Samma visuella styling appliceras på switchen i "Nytt jobb"-formuläret för konsistens.

## Sammanfattning
- Switchen placeras direkt efter "Kräver körkort" -- ett ställe du redan ser och känner igen
- Den får en gul/amber bakgrund och ram som gör den omöjlig att missa
- Ingen funktionell ändring, bara position och utseende

