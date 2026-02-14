

# Fix: Arkivera/Radera-menyn pa kandidatkort gar inte att klicka

## Identifierade fel

### Fel 1 -- Drag-listeners blockerar klick (HUVUDPROBLEMET)
I `KanbanCard.tsx` rad 83-84 sprids dnd-kit:s `{...attributes}` och `{...listeners}` pa hela `<Card>`-elementet. Nar dnd-kit fangar `onPointerDown` pa hela kortet sa "ater" det alla klick-event innan de nar DropdownMenu-triggern (tre-punkt-ikonen). Menyn renderas korrekt och syns vid hover -- men gar inte att klicka pa.

### Fel 2 -- Overlappande knappar pa mobil
Bade atgardsmenyn (rad 88: `absolute top-1 right-1`) och mobil-flytta-knappen (rad 138: `absolute top-1 right-1`) har exakt samma position, sa de overlappar varandra pa mobil.

## Atgard

### src/components/KanbanCard.tsx

**En enda andring:**

1. **Ta bort** `{...attributes}` och `{...listeners}` fran `<Card>` (rad 83-84)
2. **Flytta** dem till `<div>` som omsluter GripVertical-ikonen (rad 188)

Fore (rad 75-84):
```
<Card
  ref={setNodeRef}
  style={style}
  className={...}
  onClick={handleClick}
  {...attributes}    <-- PROBLEMET
  {...listeners}     <-- PROBLEMET
>
```

Efter:
```
<Card
  ref={setNodeRef}
  style={style}
  className={...}
  onClick={handleClick}
>
```

Och pa rad 188, lagg till listeners pa drag-handtaget:
```
<div
  className="cursor-grab active:cursor-grabbing mt-1 text-muted-foreground hidden md:block"
  {...attributes}
  {...listeners}
>
  <GripVertical ... />
</div>
```

### Resultat
- Drag kan bara initieras fran GripVertical-handtaget
- DropdownMenu (Arkivera / Radera permanent) gar att klicka pa
- Checkbox i markeringslage fungerar utan att trigga drag
- Inga andra filer behover andras -- alla props och handlers ar redan korrekt kopplade

### Sammanfattning

| Fil | Andring |
|-----|---------|
| `KanbanCard.tsx` | Flytta `{...attributes} {...listeners}` fran Card till GripVertical-wrappern (2 rader) |

