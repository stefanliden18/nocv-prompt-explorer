

# Lagg till radera-knapp pa kandidatkort

## Problem
Det finns ingen mojlighet att ta bort enskilda kandidater direkt fran rekryteringstavlan. Bulk-atgarderna (flytta, arkivera, radera) ar dolda bakom "Markera"-knappen och kraver flera steg.

## Losning

### 1. Soptunne-ikon pa varje KanbanCard (synlig vid hover)

Lagg till en liten soptunne-ikon i ovre hogra hornet pa varje kandidatkort. Ikonen visas bara nar man hovrar over kortet (desktopvy) eller alltid pa mobil.

Vid klick visas en liten popover/meny med tva val:
- **Arkivera** -- flyttar kandidaten till arkivet (satter `archived_at`)
- **Radera permanent** -- tar bort kandidaten fran databasen (med bekraftelse)

### 2. Andringar per fil

**`src/components/KanbanCard.tsx`**
- Ny prop: `onArchive?: (id: string) => void`
- Ny prop: `onDelete?: (id: string) => void`
- Lagg till en `DropdownMenu` med Trash2-ikon i ovre hogra hornet
- Menyn innehaller "Arkivera" och "Radera permanent"
- "Radera permanent" anvander en `AlertDialog` for bekraftelse
- Ikonen visas via CSS `group-hover` (dolj normalt, visa vid hover)

**`src/components/KanbanColumn.tsx`**
- Propaga `onArchive` och `onDelete` till varje KanbanCard

**`src/components/KanbanBoard.tsx`**
- Propaga `onArchiveApplication` och `onDeleteApplication` fran RecruitmentBoard till KanbanColumn

**`src/pages/admin/RecruitmentBoard.tsx`**
- Skapa `handleArchiveApplication(id: string)` -- arkiverar en enskild kandidat
- Skapa `handleDeleteApplication(id: string)` -- raderar en enskild kandidat permanent
- Skicka dessa som props till KanbanBoard

### 3. Visuellt resultat

```text
+-----------------------------------+
| Stefan Liden              [bin]   |  <-- bin syns vid hover
| *****  (5/5)                      |
| 15 okt, 09:00                     |
| Saljare - Growio                  |
+-----------------------------------+

Klick pa [bin] oppnar:
+-------------------+
| Arkivera          |
| Radera permanent  |
+-------------------+
```

### Sammanfattning

| Fil | Andring |
|-----|---------|
| `KanbanCard.tsx` | DropdownMenu med arkivera/radera-alternativ, synlig vid hover |
| `KanbanColumn.tsx` | Propaga `onArchive` och `onDelete` |
| `KanbanBoard.tsx` | Propaga `onArchiveApplication` och `onDeleteApplication` |
| `RecruitmentBoard.tsx` | Nya handlers for enskild arkivering och radering |

Inga databasandringar behovs -- `archived_at`-kolumnen finns redan och permanent radering anvander `.delete()`.
