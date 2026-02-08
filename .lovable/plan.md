
# Plan: Koppla kravprofil till jobb + AI-genererad platsannons

## Översikt

Utöka CustomerInterviewForm med två tydliga vägar efter att kravprofilen är ifylld:

1. **Koppla till befintligt jobb** - Välj från dropdown och spara kravprofilen direkt till jobbet
2. **Skapa nytt jobb med AI-genererad annons** - AI läser kravprofilen och genererar ett förslag till platsannons som du manuellt kan redigera före publicering

## Så här kommer det att fungera

### Användargränssnitt

Efter att kravprofilen är ifylld visas en ny sektion:

```text
┌─────────────────────────────────────────────────────────────────┐
│  Koppla kravprofil till jobb                                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ○ Koppla till befintligt jobb                                  │
│     ┌─────────────────────────────────────────────────────┐    │
│     │ Mekaniker - TestFöretag AB (Stockholm)          ▼   │    │
│     └─────────────────────────────────────────────────────┘    │
│     [Koppla kravprofil]                                         │
│                                                                 │
│  ○ Skapa nytt jobb med AI-hjälp                                 │
│     AI genererar ett förslag till platsannons baserat på        │
│     kravprofilen. Du kan sedan redigera innan publicering.      │
│     [Generera annons →]                                         │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Flöde: Koppla till befintligt jobb

1. Användaren väljer jobb i dropdown
2. Klickar "Koppla kravprofil"
3. Systemet uppdaterar jobbets `requirement_profile`-fält
4. Toast-bekräftelse med länk till jobbet

### Flöde: Skapa nytt jobb med AI

1. Användaren klickar "Generera annons"
2. AI-anrop startar (laddningsindikator visas)
3. AI analyserar kravprofilen och genererar:
   - Jobbtitel
   - Beskrivning (HTML)
   - Kravlista (HTML)
   - Förslag på kategori och anställningsform
4. Navigering till JobForm med förfylld data
5. Användaren granskar, redigerar vid behov, sparar

---

## Tekniska ändringar

### 1. Ny edge function: `generate-job-ad`

Skapar en ny edge function som tar emot kravprofilen och genererar en platsannons.

**Fil:** `supabase/functions/generate-job-ad/index.ts`

**Input:**
```typescript
{
  requirement_profile: RequirementProfile,
  customer_info: {
    companyName: string,
    contactPerson: string,
    desiredStartDate: string,
    salaryRange: string
  },
  role_display_name: string
}
```

**AI-prompt:**
- Instruerar AI:n att skriva en professionell, engagerande platsannons
- Använder kravprofilens sektioner för att extrahera tekniska krav
- Skapar en säljande beskrivning utan att avslöja kundens identitet

**Output (via tool calling):**
```typescript
{
  title: string,           // T.ex. "Bilmekaniker"
  description_html: string,// Engagerande beskrivning i HTML
  requirements_html: string,// Kravlista i HTML
  category: string,        // T.ex. "Fordon"
  employment_type: string  // T.ex. "Heltid, Tillsvidare"
}
```

### 2. Uppdatera CustomerInterviewForm

**Fil:** `src/components/CustomerInterviewForm.tsx`

**Lägg till:**
- Query för att hämta befintliga jobb
- State: `selectedJobId`, `linkMode`, `isGenerating`
- Funktion `handleLinkToJob()` - uppdaterar jobbets kravprofil
- Funktion `handleGenerateAd()` - anropar edge function och navigerar
- Ny UI-sektion med RadioGroup för val av metod

### 3. Uppdatera JobForm för AI-genererad data

**Fil:** `src/pages/admin/JobForm.tsx`

**Lägg till:**
- Läs `prefill-job-ad`-data från sessionStorage
- Fyll i title, descriptionHtml, requirementsHtml, category, employmentType
- Visa banner om annonsen är AI-genererad

### 4. Uppdatera config.toml

**Fil:** `supabase/config.toml`

Lägg till den nya funktionen.

---

## Detaljerad implementation

### Edge function: generate-job-ad

```typescript
// Systemets AI-prompt (förenklad)
const systemPrompt = `Du är en erfaren rekryteringsskribent.

UPPGIFT: Skriv en professionell platsannons baserat på kravprofilen.

ROLL: ${roleDisplayName}
KUND: ${customerInfo.companyName} (visa EJ i annonsen)
ÖNSKAT TILLTRÄDE: ${customerInfo.desiredStartDate}
LÖN: ${customerInfo.salaryRange}

KRAVPROFIL:
${JSON.stringify(requirementProfile.values, null, 2)}

NOTERINGAR:
${JSON.stringify(requirementProfile.section_notes, null, 2)}

Skriv:
1. En säljande beskrivning (2-3 stycken) som lockar rätt kandidater
2. En tydlig kravlista baserad på profilen
3. Föreslå kategori och anställningsform

Använd HTML-formatering (<p>, <ul>, <li>, <strong>).
Skriv på svenska. Var professionell men engagerande.`;
```

### UI-komponent för jobbkoppling

```tsx
<Card className="print:hidden">
  <CardHeader>
    <CardTitle className="flex items-center gap-2">
      <Link2 className="h-5 w-5" />
      Koppla kravprofil till jobb
    </CardTitle>
  </CardHeader>
  <CardContent className="space-y-4">
    <RadioGroup value={linkMode} onValueChange={setLinkMode}>
      {/* Alternativ 1: Befintligt jobb */}
      <div className="flex items-start space-x-3 p-4 border rounded-lg">
        <RadioGroupItem value="existing" />
        <div className="flex-1 space-y-3">
          <Label>Koppla till befintligt jobb</Label>
          {linkMode === 'existing' && (
            <>
              <Select value={selectedJobId} onValueChange={setSelectedJobId}>
                {jobs?.map(job => (
                  <SelectItem value={job.id}>
                    {job.title} - {job.companies?.name} ({job.city})
                  </SelectItem>
                ))}
              </Select>
              <Button onClick={handleLinkToJob}>
                Koppla kravprofil
              </Button>
            </>
          )}
        </div>
      </div>
      
      {/* Alternativ 2: Nytt jobb med AI */}
      <div className="flex items-start space-x-3 p-4 border rounded-lg">
        <RadioGroupItem value="new" />
        <div className="flex-1 space-y-3">
          <Label>Skapa nytt jobb med AI-hjälp</Label>
          <p className="text-sm text-muted-foreground">
            AI genererar ett förslag till platsannons
          </p>
          {linkMode === 'new' && (
            <Button onClick={handleGenerateAd} disabled={isGenerating}>
              {isGenerating ? 'Genererar...' : 'Generera annons →'}
            </Button>
          )}
        </div>
      </div>
    </RadioGroup>
  </CardContent>
</Card>
```

---

## Filer som skapas/ändras

| Fil | Ändring |
|-----|---------|
| `supabase/functions/generate-job-ad/index.ts` | **NY** - Edge function för AI-generering av platsannons |
| `supabase/config.toml` | Lägg till generate-job-ad function |
| `src/components/CustomerInterviewForm.tsx` | Lägg till jobbkopplings-UI och AI-generering |
| `src/pages/admin/JobForm.tsx` | Läs AI-genererad data från sessionStorage |

---

## Säkerhet

- Edge function kräver autentisering (Authorization header)
- Använder Lovable AI som redan är konfigurerat (LOVABLE_API_KEY)
- RLS-policies för jobs-tabellen säkerställer att endast behöriga kan uppdatera

## Modell

Använder `google/gemini-3-flash-preview` för snabb och kostnadseffektiv generering.
