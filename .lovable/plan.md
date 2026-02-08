
# Plan: Jobbbibliotek för avpublicerade jobb

## Översikt

Du vill kunna "avpublicera" jobb så de försvinner från hemsidan men sparas i ett bibliotek för framtida återanvändning. Detta skiljer sig från arkivering som är mer permanent.

Lösningen: Använd en ny status **`inactive`** (vilande) som gör att:
- Jobbet försvinner från hemsidan
- Jobbet sparas i ett "Jobbbibliotek" 
- Du kan enkelt publicera det igen när det blir aktuellt

## Ändringar

### 1. Ny jobbstatus: `inactive` (vilande)

Lägger till en ny status i databasen som representerar vilande/pausade jobb:

- `draft` = Utkast (aldrig publicerat)
- `published` = Publicerat (visas på hemsidan)
- `inactive` = Vilande (tidigare publicerat, nu pausat - kan återaktiveras)
- `archived` = Arkiverad (permanent stängt - för gamla jobb)
- `demo` = Demo-jobb

### 2. Ny sida: Jobbbibliotek

Skapar en ny sida `/admin/job-library` som visar:
- Alla **vilande** (`inactive`) jobb
- Möjlighet att snabbt publicera igen
- Möjlighet att redigera innan publicering
- Möjlighet att arkivera permanent

```text
┌─────────────────────────────────────────────────────────────────┐
│  JOBBBIBLIOTEK                                                  │
├─────────────────────────────────────────────────────────────────┤
│  ┌───────────────────────────────────────────────────────────┐  │
│  │ Svetsare - AutoExpert AB              Vilande sedan 8 feb │  │
│  │ Stockholm                     [Publicera] [Redigera] [🗑] │  │
│  └───────────────────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │ Bilmekaniker - CarService              Vilande sedan 2 jan│  │
│  │ Göteborg                      [Publicera] [Redigera] [🗑] │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

### 3. Uppdatera JobEdit.tsx

Ändra "Avpublicera"-knappen till att sätta status `inactive` istället för `draft`:
- Byt etikett till "Pausa/Lägg i bibliotek"
- Sätt status till `inactive`
- Jobbet hamnar i jobbbiblioteket

### 4. Uppdatera Jobs.tsx

Lägg till filter/flikar för att visa:
- Alla jobb
- Aktiva (publicerade + utkast)
- Vilande (bibliotek)
- Arkiverade

### 5. Sidofältet (AdminSidebar)

Lägg till ny menypost:
- "Jobbbibliotek" med ikon (t.ex. `Archive` eller `FolderOpen`)

---

## Tekniska ändringar

### Databasändring

Lägg till `inactive` som giltig status i `job_status` enum:

```sql
ALTER TYPE job_status ADD VALUE 'inactive';
```

### Nya filer

| Fil | Beskrivning |
|-----|-------------|
| `src/pages/admin/JobLibrary.tsx` | Ny sida för jobbbiblioteket |

### Filer som uppdateras

| Fil | Ändring |
|-----|---------|
| `src/pages/admin/JobEdit.tsx` | Ändra "Avpublicera" → "Lägg i bibliotek" (status `inactive`) |
| `src/pages/admin/Jobs.tsx` | Lägg till flikar/filter för olika statusar |
| `src/components/AdminSidebar.tsx` | Lägg till menypost för Jobbbibliotek |
| `src/App.tsx` | Lägg till route för `/admin/job-library` |

---

## Arbetsflöde efter ändring

```text
UTKAST ──────────────────────────────────────────────────────────┐
   │                                                              │
   │ [Publicera]                                                  │
   ▼                                                              │
PUBLICERAD (visas på hemsidan)                                    │
   │                                                              │
   │ [Lägg i bibliotek]                                           │
   ▼                                                              │
VILANDE (jobbbibliotek) ◄─────────────────────────────────────────┘
   │                  │
   │ [Publicera]      │ [Arkivera]
   ▼                  ▼
PUBLICERAD       ARKIVERAD (permanent stängd)
```

---

## Statusförklaring i UI

| Status | Badge | Var visas |
|--------|-------|-----------|
| `draft` | Utkast | Jobb-listan |
| `published` | Publicerad | Jobb-listan + hemsidan |
| `inactive` | Vilande | Jobbbiblioteket |
| `archived` | Arkiverad | Arkiverade jobb |
| `demo` | Demo | Demo-jobb sidan |
