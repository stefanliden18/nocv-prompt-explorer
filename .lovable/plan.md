

# Duplicera jobb via dropdown i "Nytt jobb"-formuläret

## Hur det fungerar
Overst i formuläret for att skapa nytt jobb laggs en sektion till: "Duplicera fran befintligt jobb". Dar kan du:

1. Valja filter: **Aktiva** (publicerade) eller **Vilande** (i biblioteket)
2. Soka och valja ett jobb fran en dropdown-lista
3. Alla falt fylls i automatiskt -- du andrar det som behover andras (t.ex. stad, region)
4. Sparar som vanligt

## Anvandargranssnitt

Langst upp i "Nytt jobb"-sidan visas ett kort med:
- En rubrik: "Duplicera fran befintligt jobb"
- Tva knappar/flikar for att filtrera: "Aktiva jobb" / "Vilande jobb"
- En sokbar dropdown (anvander befintliga `SearchableSelect`-komponenten) som listar jobben
- Nar du valjer ett jobb laddas all data in i formularet
- En info-banner visas: "Duplicerat fran [jobbtitel] -- granska och andra det som behover andras"

## Tekniska andringar

### src/pages/admin/JobForm.tsx
1. **Ny state**: `duplicateFilter` ('published' | 'inactive'), `availableJobs`, `selectedDuplicateId`, `isDuplicated`
2. **Ny useEffect**: Hamtar jobb fran Supabase baserat pa vald filter (`status = 'published'` eller `status = 'inactive'`), inklusive company-namn
3. **Ny funktion `handleDuplicateSelect`**: Nar ett jobb valjs, hamtas fullstandig jobbdata och alla formularfalt fylls i (titel, foretag, stad, region, kategori, anstallningsform, beskrivning, korkort, sprak, kravprofil, dolj foretagsnamn). Slug och status atersstalls
4. **Ny UI-sektion** overst i formularet (ovanfor titel-faltet) med:
   - Kort med rubrik "Duplicera fran befintligt jobb"
   - Filter-knappar (Aktiva / Vilande)
   - Sokbar dropdown med jobb (visar titel + stad + foretagsnamn)
   - Info-banner nar ett jobb ar duplicerat

### Ingen ny fil behovs
Allt byggs direkt i `JobForm.tsx` med befintliga komponenter (`SearchableSelect`, `Card`, `Badge`, `Alert`).

### Vad som kopieras
- Titel, kategori, anstallningsform, foretag
- Stad, region
- Annonstext (description)
- Korkort, sprak, dolj foretagsnamn
- Kravprofil

### Vad som INTE kopieras
- Slug (genereras automatiskt fran ny titel)
- Status (alltid utkast)
- Publiceringsdatum
- Ansokningar
- GetKiku-lank (kan skilja per ort)

