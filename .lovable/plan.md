

# Bulk-atgarder for markerade kandidater pa rekryteringstavlan

## Oversikt

Utoka det befintliga markeringslaget sa att nar kandidater ar markerade visas en atgardsfalt med tre alternativ:
1. **Arkivera** -- flytta till arkivet (redan implementerat)
2. **Radera permanent** -- ta bort fran databasen med bekraftelsedialog
3. **Flytta till stadie** -- valj ett stadie fran en dropdown och flytta alla markerade dit

## Andringar

### src/pages/admin/RecruitmentBoard.tsx

Uppdatera atgardsfalet som visas nar kandidater ar markerade (runt rad 280-295). Lagg till:

- **Radera-knapp** med bekraftelsedialog (AlertDialog) som permanent raderar markerade kandidater
- **Flytta till stadie-dropdown** (Select-komponent) som listar alla tillgangliga stadier och bulk-flyttar markerade kandidater till valt stadie
- Ny funktion `handleBulkMoveToStage(stageId)` som uppdaterar `pipeline_stage_id` for alla markerade kandidater

Det befintliga atgardsfalet (Card med "X markerade" + Arkivera-knapp) byggs ut till:

```text
+----------------------------------------------------------------------+
| 3 markerade  [Flytta till... v]  [Arkivera]  [Radera]  [Avmarkera]  |
+----------------------------------------------------------------------+
```

**Flytta till...** ar en Select-dropdown med alla stadier (med fargprickar).
**Radera** oppnar en bekraftelsedialog innan permanent radering sker.

### Tekniska detaljer

- `handleBulkMoveToStage(stageId: string)`: Gor en `supabase.from('applications').update({ pipeline_stage_id: stageId }).in('id', ids)` och uppdaterar state optimistiskt
- `handleDeleteSelected()`: Finns redan men laggs nu till i atgardsfalet med en AlertDialog-wrapper
- Inga databasandringar behovs -- `archived_at` och `pipeline_stage_id` finns redan
- Importera `Select, SelectContent, SelectItem, SelectTrigger, SelectValue` fran `@/components/ui/select`

### Sammanfattning

| Fil | Andring |
|-----|---------|
| `RecruitmentBoard.tsx` | Utoka atgardsfalt med Flytta-dropdown, Radera-knapp med bekraftelse, och ny `handleBulkMoveToStage`-funktion |

