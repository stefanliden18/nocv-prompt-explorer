
# Fix: Räknarna i statusfiltret matchar inte visade ansökningar

## Problemet

Statusfiltrets räknare (t.ex. "Nya (27)") räknar **alla** ansökningar, inklusive demo-ansökningar som är dolda. Tabellen filtrerar korrekt bort demo-ansökningar, men räknarna gör det inte. Därför ser man "Nya (27)" men "Visar 0 av 34 ansökningar".

## Lösningen

Skapa en mellanliggande lista `visibleApplications` som respekterar demo-filtret, och använd den för räknarna.

### Ändring i src/pages/admin/Applications.tsx

**Steg 1** -- Lägg till `visibleApplications` (efter rad 92, före `filteredApplications`):

```tsx
const visibleApplications = applications.filter(app => {
  if (!showDemoApplications && app.is_demo) return false;
  return true;
});
```

**Steg 2** -- Uppdatera `applicationCounts` (rad 222-228) att använda `visibleApplications` istället för `applications`:

```tsx
applicationCounts={{
  total: visibleApplications.length,
  new: visibleApplications.filter(a => a.status === 'new').length,
  viewed: visibleApplications.filter(a => a.status === 'viewed').length,
  booked: visibleApplications.filter(a => a.status === 'booked').length,
  rejected: visibleApplications.filter(a => a.status === 'rejected').length,
}}
```

### Resultat

- När demo är dolt och alla ansökningar är demo: räknarna visar "Nya (0)" istället för "Nya (27)"
- När demo visas: räknarna visar korrekta siffror inklusive demo
- En fil, två små ändringar
