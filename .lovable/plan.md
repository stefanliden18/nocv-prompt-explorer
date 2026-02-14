

# Visa Kiku-intervjusvar + ta bort "Importera jobb"

## Vad som gors

### 1. Ta bort "Importera jobb"
Funktionen tas bort fran sidomenyn, routern och filen raderas.

### 2. Ny komponent: KikuTranscriptViewer
En snygg, strukturerad visning av kandidatens intervjusvar placeras pa ansokningssidan (ApplicationDetail), mellan kontaktinformation och AI-bedomning.

Komponenten:
- Hamtar alla transkiberingar fran `candidate_transcripts` for aktuell ansokan
- Parsar texten till fragor och svar (stodjer bade "Fraga:/Svar:"-format och "Kiku:/Namn:"-dialogformat)
- Visar varje transkribering i ett Accordion-kort med intervjutyp och datum
- Varje fraga/svar-par visas strukturerat med tydlig visuell separation:
  - Fragan i en markerad ruta med frageikon
  - Svaret under med indrag och annan bakgrund
- Om parsning inte lyckas (fritext utan tydligt format) visas texten som den ar med radbrytningar

### Visuellt resultat
```text
+------------------------------------------+
| Intervjusvar fran Kiku                   |
| 2 intervjuer importerade                 |
+------------------------------------------+
| v Screening - 14 feb 2026               |
|   +--------------------------------------+
|   | ? Berätta om din erfarenhet inom...  |
|   +--------------------------------------+
|   | Jag har arbetat som bilmekaniker i   |
|   | 7 år. Jag är väl bekant med...       |
|   +--------------------------------------+
|                                          |
|   +--------------------------------------+
|   | ? Kan du grunda, lacka och polera?   |
|   +--------------------------------------+
|   | Ja, jag har god erfarenhet av...     |
|   +--------------------------------------+
|                                          |
| > Djupintervju - 15 feb 2026            |
+------------------------------------------+
```

## Tekniska andringar

### Filer som tas bort
- `src/pages/admin/JobImport.tsx`

### Filer som andras

**src/App.tsx**
- Ta bort import av `JobImport` och routen `/admin/jobs/import`

**src/components/AdminSidebar.tsx**
- Ta bort menyvalet "Importera jobb" fran `menuItems`

**Ny fil: src/components/KikuTranscriptViewer.tsx**
- Props: `applicationId: string`
- Hamtar `candidate_transcripts` fran databasen
- Parsningslogik som hanterar flera format:
  - "Fraga: ... Svar: ..." (prefix-format)
  - "Kiku: ... Namn: ..." (dialogformat med kanda namn)
  - Fallback: visa ratan som whitespace-preserverad text
- Anvander Accordion fran Radix for kollapsbar vy
- Varje Q&A-par far en latt bakgrund for fragan och vit/transparent for svaret
- Visar intervjutyp som Badge (Screening = bla, Djupintervju = lila)
- Visar importdatum

**src/pages/admin/ApplicationDetail.tsx**
- Importera och placera `KikuTranscriptViewer` mellan kontaktkortet och `CandidateAssessment`
- Komponenten renderas bara om det finns transkiberingar (den hanterar tomanvisning internt)

### Inga databasandringar behovs
All data finns redan i `candidate_transcripts` med ratt RLS-policies.

