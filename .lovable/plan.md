

## Uppdatera standardmallen for intervjuinbjudan

### Vad som andras
Standardtexten som fylls i automatiskt nar man klickar "Boka tid for intervju" byts ut till den mer personliga tonen du beskrev. Dessutom visas ratt namn (Stefan eller Miche) langst ner baserat pa vem som ar inloggad.

### Ny standardtext

```
Hej [Kandidatnamn]!

Vi har kollat igenom din ansokan till [Jobbtitel]-rollen och gillar vad vi ser. Nu vill vi garna ta ett snack med dig pa video sa vi kan lara kanna dig lite battre.

Inget stelt – vi kommer snacka om:

- Vad du har gjort och vad du kan
- Vad du letar efter i nasta jobb
- Hur det ser ut pa verkstaden och i teamet

Rakna med ca 30 minuter.

Later det bra? Svara sa bokar vi in en tid som funkar for dig.

Hors!

[Namn], NoCV
```

### Hur namnet bestams

Inloggad anvandare har en e-postadress. Funktionen kollar:
- Om e-posten ar `stefan@nocv.se` → "Stefan"
- Om e-posten ar `michael@nocv.se` → "Miche"
- Annars → fornamnet fran e-postadressen (som fallback)

### Teknisk plan

**Fil 1: `src/utils/interviewTemplates.ts`**
- Uppdatera `getInterviewMessageTemplate` sa den tar emot ett extra parameter `signerName: string`
- Byt ut mallens text till den nya, mer avslappnade tonen
- Anvand `signerName` langst ner i meddelandet

**Fil 2: `src/components/InterviewBookingDialog.tsx`**
- Importera `useAuth` fran AuthContext
- Hamta inloggad anvandares e-post via `user.email`
- Bestam signerName: `stefan@nocv.se` → "Stefan", `michael@nocv.se` → "Miche", annars fornamnet
- Skicka med `signerName` till `getInterviewMessageTemplate`

### Vad som INTE andras
- E-postmallarna (HTML) for det faktiska mejlet som skickas
- Portalens bokningsflode (PortalBooking.tsx)
- Edge functions

