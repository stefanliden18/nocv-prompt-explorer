
# Plan: Fixa React-bugg i RequirementProfileForm

## Problemet

Komponenten `RequirementProfileForm` har en synkroniseringsbugg mellan `selectedTemplateId` state och `value.template_id` prop som orsakar:

1. **Förfyllda profiler skrivs över** - När en profil skickas in via props så initieras den om till tomma värden
2. **Potentiell render-loop** - `useEffect` triggar `onChange` som uppdaterar `value` som triggar `useEffect` igen
3. **Accordion kollapsar** - `openSections` initieras inte korrekt för förfyllda profiler

## Lösning

Synkronisera `selectedTemplateId` med inkommande `value.template_id` genom att:

1. **Lägga till en separat useEffect** som synkroniserar `selectedTemplateId` när `value` ändras utifrån
2. **Förbättra villkoret** i initierings-useEffect för att inte köras när profilen redan är korrekt ifylld
3. **Initiera `openSections`** även för förfyllda profiler

---

## Tekniska ändringar

### Fil: `src/components/RequirementProfileForm.tsx`

**Ändring 1: Lägg till synkroniserings-useEffect (efter rad 37)**

Ny useEffect som körs när `value` prop ändras:

```typescript
// Synkronisera selectedTemplateId med inkommande value
useEffect(() => {
  if (value?.template_id && value.template_id !== selectedTemplateId) {
    setSelectedTemplateId(value.template_id);
  }
}, [value?.template_id]);
```

**Ändring 2: Initiera openSections för förfyllda profiler**

Lägg till useEffect som öppnar sektioner när template laddas:

```typescript
// Initiera openSections när template finns och sektioner är tomma
useEffect(() => {
  if (selectedTemplate && openSections.length === 0) {
    setOpenSections(selectedTemplate.template_data.sections.map(s => s.key));
  }
}, [selectedTemplate, openSections.length]);
```

**Ändring 3: Förbättra villkoret i initierings-useEffect (rad 60-81)**

Ändra villkoret så att profilen INTE ominitieras om det redan finns ifyllda värden:

```typescript
useEffect(() => {
  // Endast initiera om vi har en template OCH profilen är tom/ny
  // Skippa om value redan har värden (t.ex. från sessionStorage)
  if (selectedTemplate && selectedTemplateId) {
    const isNewProfile = !value || value.template_id !== selectedTemplateId;
    const hasExistingValues = value && Object.keys(value.values || {}).length > 0;
    
    if (isNewProfile && !hasExistingValues) {
      // ... behåll existerande initierings-logik
    }
  }
}, [selectedTemplateId, selectedTemplate]);
```

---

## Resultat

Efter denna fix:
- Förfyllda profiler från "Kopiera till jobb" behålls intakta
- Accordion expanderas korrekt för alla profiler
- Ingen render-loop eller React-fel
- Manuellt val av template fungerar som tidigare

## Filer som ändras

| Fil | Ändring |
|-----|---------|
| `src/components/RequirementProfileForm.tsx` | Lägg till synkroniserings-useEffects och förbättra villkor |
