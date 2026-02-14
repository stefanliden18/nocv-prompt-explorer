

# Arkiv/Papperskorg for rekryteringstavlan

## Oversikt

Lagg till en arkivfunktion pa rekryteringstavlan dar rekryterare kan:
- Markera en eller flera kandidater med checkboxar
- Arkivera markerade kandidater (flytta till "papperskorgen")
- Visa/dolj arkiverade kandidater med en toggle
- Aterstalla arkiverade kandidater tillbaka till tavlan
- Permanent radera kandidater fran arkivet (valfritt)

## Teknisk losning

### 1. Databasandring -- Lagg till `archived_at` pa `applications`

Lagg till en ny kolumn `archived_at` (timestamp, nullable) pa `applications`-tabellen. Nar vardet ar satt ar kandidaten arkiverad. Detta gor det enkelt att filtrera bort arkiverade kandidater fran tavlan och visa dem separat.

```text
applications
  + archived_at  timestamp with time zone  NULL
```

Ingen ny tabell behovs -- en enkel kolumn racker.

### 2. RecruitmentBoard.tsx -- Ny state och logik

**Ny state:**
- `selectedIds: Set<string>` -- markerade kandidater
- `showArchived: boolean` -- visa arkiverade kandidater
- `selectionMode: boolean` -- om markeringslaget ar aktivt

**Ny funktioner:**
- `handleArchiveSelected()` -- satt `archived_at = now()` pa alla markerade
- `handleRestoreSelected()` -- satt `archived_at = null` pa alla markerade
- `handleDeleteSelected()` -- permanent radering med bekraftelsedialog

**Filtrering:**
- I normallagt: filtrera bort kandidater dar `archived_at` ar satt
- I arkivlaget: visa BARA kandidater dar `archived_at` ar satt

**UI-tillagg i headern:**
- En "Markera"-knapp som aktiverar markeringslaget
- Nar markeringslaget ar aktivt: visa antal markerade + knappar for "Arkivera" och "Avmarkera alla"
- En "Arkiv"-knapp/toggle som vaxlar till arkivvyn

### 3. KanbanCard.tsx -- Lagg till checkbox

- Ny prop `selectionMode: boolean` och `selected: boolean` och `onToggleSelect`
- Nar `selectionMode` ar aktivt: visa en checkbox langst till vanster pa kortet
- Klick pa kortet i markeringslaget togglar markering istallet for att navigera

### 4. KanbanBoard.tsx och KanbanColumn.tsx -- Propaga nya props

Skicka igenom `selectionMode`, `selectedIds` och `onToggleSelect` genom komponenterna.

### 5. Arkivvy -- Separat lista under tavlan

Nar "Visa arkiv" ar aktivt visas en tabell/lista med arkiverade kandidater med:
- Kandidatnamn, jobb, foretag, datum arkiverad
- Checkbox for att markera
- Knapp for att aterstalla (flytta tillbaka till tavlan)
- Knapp for permanent radering (med bekraftelsedialog)

## Visuellt resultat

```text
+--------------------------------------------------------------------+
| Rekryteringstavla                                                  |
|                                                                    |
| [Markera]  [Arkiv (3)]  [Hantera stadier]                         |
|                                                                    |
| -- Markeringslage aktivt: --                                       |
| [v] 2 markerade   [Arkivera]  [Avmarkera]                         |
+--------------------------------------------------------------------+
|  [Ny ansokan]     [Granskning]     [Intervju]                      |
|  +------------+   +------------+   +------------+                  |
|  | [x] Anna   |   | [ ] Erik   |   | [ ] Lisa   |                 |
|  | [x] Johan  |   | [ ] Sara   |   |            |                 |
|  +------------+   +------------+   +------------+                  |
+--------------------------------------------------------------------+

-- Arkivvyn (nar "Arkiv" ar aktivt): --
+--------------------------------------------------------------------+
| Arkiv (3 kandidater)                    [Tillbaka till tavlan]      |
+--------------------------------------------------------------------+
| [x] Maria Svensson  | Skadetekniker - Bilia  | Arkiverad 14 feb   |
| [ ] Per Nilsson      | Lackerare - AutoLack   | Arkiverad 12 feb   |
| [ ] Kim Larsson      | Bilmekaniker - MekAB   | Arkiverad 10 feb   |
+--------------------------------------------------------------------+
| [Aterstall markerade]   [Radera permanent]                         |
+--------------------------------------------------------------------+
```

## Andringar sammanfattat

| Fil | Andring |
|-----|---------|
| Migration | Lagg till `archived_at` kolumn pa `applications` |
| `RecruitmentBoard.tsx` | Markeringslage, arkivera/aterstall-logik, arkivvy-toggle |
| `KanbanBoard.tsx` | Propaga selection-props |
| `KanbanColumn.tsx` | Propaga selection-props |
| `KanbanCard.tsx` | Checkbox i markeringslage |

