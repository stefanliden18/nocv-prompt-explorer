

# Fix: Synliggör åtgärdsknappar och fixa kortets dropdown-meny

## Problem 1: Knapparna syns inte

Knapparna "Markera", "Arkiv" och "Hantera stadier" finns i koden men hamnar utanför synligt område. De placeras med `justify-between` i samma rad som titeln, men trycks bort till höger och döljs.

### Lösning

Flytta knapparna till en **egen rad under titeln** istället för att ha dem bredvid. Detta garanterar att de alltid syns oavsett skärmbredd.

Före:
```text
+------------------------------------------------------+
| Rekryteringstavla          [Markera] [Arkiv] [Stadier]| <-- knappar osynliga
| Visar 7 kandidater                                    |
+------------------------------------------------------+
```

Efter:
```text
+------------------------------------------------------+
| Rekryteringstavla                                     |
| Visar 7 kandidater                                    |
|                                                       |
| [Markera]  [Arkiv (0)]  [Hantera stadier]             | <-- alltid synliga
+------------------------------------------------------+
```

### Teknisk ändring i RecruitmentBoard.tsx (rad 459)

Ändra layouten från en `sm:flex-row justify-between` till en vertikal layout med knapparna på egen rad:

```tsx
// Före:
<div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
  <div>...</div>
  <div className="flex flex-wrap gap-2 w-full sm:w-auto">...</div>
</div>

// Efter:
<div className="space-y-4">
  <div>
    <h1>Rekryteringstavla</h1>
    <p>Visar X kandidater</p>
  </div>
  <div className="flex flex-wrap gap-2">
    <Button>Markera</Button>
    <Button>Arkiv</Button>
    <Button>Hantera stadier</Button>
  </div>
</div>
```

---

## Problem 2: Kortets dropdown-meny fungerar inte

Hela kortet har `onClick={handleClick}` som navigerar till detaljsidan. Nar man klickar pa tre-punkt-menyn (MoreVertical) fangas klicket av Card-elementet och man navigeras bort istallet for att menyn oppnas.

### Lösning

Flytta `onClick={handleClick}` fran `<Card>` till den inre content-diven (som visar namn, rating, taggar). Da lever dropdown-menyn, checkboxen och drag-handtaget utanfor klickzonen.

### Teknisk ändring i KanbanCard.tsx

```tsx
// Före:
<Card ref={setNodeRef} style={style} className="..." onClick={handleClick}>
  <div className="absolute ..."> {/* dropdown meny */} </div>
  <div className="flex ..."> {/* content */} </div>
</Card>

// Efter:
<Card ref={setNodeRef} style={style} className="...">
  <div className="absolute ..."> {/* dropdown meny -- klickbar nu */} </div>
  <div className="flex ..." onClick={handleClick}> {/* bara content navigerar */} </div>
</Card>
```

---

## Sammanfattning

| Fil | Ändring | Löser |
|-----|---------|-------|
| `RecruitmentBoard.tsx` | Flytta knappar till egen rad under titeln | Knappar alltid synliga |
| `KanbanCard.tsx` | Flytta onClick fran Card till content-div | Dropdown-meny fungerar |

Inga andra filer eller databasändringar behövs.

