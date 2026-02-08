

# Plan: Lägg till fritextfält under varje frågekategori

## Problemet

Idag kan du fylla i formulärets strukturerade fält (checkboxar, select, etc) men det finns inget sätt att skriva en fritextnotering för varje kategori när kunden har specifika önskemål eller krav som inte passar in i mallstrukturen.

## Lösning

Lägg till ett **Textarea-fält i botten av varje sektion** som sparas tillsammans med kravprofilen.

---

## Tekniska ändringar

### 1. Uppdatera datatypen `RequirementProfile`

Lägg till ett nytt fält `section_notes` som lagrar fritextnoteringar per sektion:

```typescript
export interface RequirementProfile {
  template_id: string;
  role_key: string;
  values: {
    [sectionKey: string]: RequirementProfileValue;
  };
  section_notes?: {  // NYT FÄLT
    [sectionKey: string]: string;
  };
}
```

### 2. Uppdatera `CustomerInterviewForm.tsx`

**Lägg till state för noteringar:**
- Ny state: `sectionNotes` för att lagra fritextnoteringar per sektion
- Uppdatera useEffect som laddar från localStorage för att också ladda `section_notes`
- Uppdatera useEffect som initierar template för att också initiera `section_notes`

**Uppdatera rendering:**
- I sektion-loopen, efter alla fält, lägg till en `Textarea` före `</CardContent>`
- Placeholder: "Noteringar för denna kategori..."
- Koppla till `sectionNotes[section.key]` och uppdateringsfunktion

**Uppdatera save/copy-logik:**
- `handleSaveDraft`: Inkludera `section_notes` i den sparade profilen
- `handleCopyToJob`: Inkludera `section_notes` när profilen kopieras till jobbet

### 3. Resultat

Användaren kan nu:
- Se ett tomt Textarea-fält längst ned i varje sektion
- Skriva fritextnoteringar för den kategorin
- Noteringar sparas tillsammans med övriga svar i localStorage
- Noteringar följer med när profilen kopieras till ett nytt jobb
- Noteringar visas vid utskrift

---

## Filer som ändras

| Fil | Ändring |
|-----|---------|
| `src/types/requirementTemplate.ts` | Lägg till `section_notes` i `RequirementProfile` |
| `src/components/CustomerInterviewForm.tsx` | Lägg till state, rendering och lagring av `section_notes` |

