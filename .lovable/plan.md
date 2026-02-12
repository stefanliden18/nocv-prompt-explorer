

# Fix: Ansökningar blockeras av säkerhetspolicy

## Orsak
Den senaste säkerhetsmigreringen (för att åtgärda skanningsvarningar) tog bort policyn "Anyone can insert applications" från tabellen `applications`. Det var dock den enda PERMISSIVE INSERT-policyn. Kvar finns bara "Anonymous can insert applications" som är RESTRICTIVE -- och utan minst en permissive policy nekas alla insättningar.

Resultatet: **ingen kan skicka en ansökan**, varken anonyma eller inloggade användare.

## Lösning
Skapa en ny PERMISSIVE INSERT-policy på `applications`-tabellen som tillåter alla (anonyma och inloggade) att skicka ansökningar. Detta är korrekt beteende -- vem som helst ska kunna söka jobb.

## Teknisk ändring

### Databasmigration (SQL)
```sql
-- Restore permissive INSERT policy for applications
-- Anyone (anonymous or authenticated) should be able to apply for jobs
CREATE POLICY "Anyone can insert applications"
  ON public.applications
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);
```

Denna policy ersätter den som togs bort av misstag i föregående migration. Ingen kodändring behövs -- felet ligger enbart i databasens säkerhetsinställningar.

## Verifiering
Efter migreringen: gå till jobbannonsen "Skadetekniker i Norrort" och testa att skicka en ansökan igen.
