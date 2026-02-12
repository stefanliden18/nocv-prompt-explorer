# NoCV System Testing Checklist

## Syfte
Denna checklista verifierar att hela rekryteringsflödet fungerar från början till slut.

---

## ✅ 1. Skapa företag (Admin)

**Steg:**
1. Logga in som admin på `/auth`
2. Navigera till `/admin/companies`
3. Klicka "Nytt företag"
4. Fyll i:
   - Företagsnamn (obligatoriskt)
   - Webbplats (valfritt)
   - Logo URL (valfritt)
5. Klicka "Spara"

**Förväntat resultat:**
- ✓ Företag skapas i databasen
- ✓ Toast-meddelande: "Företag skapat"
- ✓ Företaget syns i företagslistan
- ✓ Backend-händelse loggas: `job_created` (nej, fel - inget event för företag)

**Aktuell status:** ⚠️ Ingen backend-loggning för företag (kan läggas till vid behov)

---

## ✅ 2. Skapa jobb som Draft (Admin)

**Steg:**
1. Navigera till `/admin/jobs`
2. Klicka "Nytt jobb"
3. Fyll i formuläret:
   - Titel (obligatoriskt)
   - Företag (välj från dropdown, obligatoriskt)
   - Kategori (välj från dropdown)
   - Anställningstyp (välj från dropdown)
   - Stad
   - Region
   - Språk
   - Beskrivning (Markdown)
   - Krav (Markdown)
   - Körkort (checkbox)
   - Status: Lämna som "Utkast"
4. Klicka "Skapa jobb"

**Förväntat resultat:**
- ✓ Jobb skapas med status "draft"
- ✓ Slug genereras automatiskt från titel
- ✓ Toast: "Jobb skapat"
- ✓ Redirect till `/admin/jobs`
- ✓ Backend-händelse: `job_created` loggas i `activity_logs`
- ✓ Jobb syns i admin-jobblistan med badge "Utkast"

**Viktigt:**
- Jobb ska INTE synas på publika sidor ännu

---

## ✅ 3. Publicera jobb (Admin)

**Steg:**
1. I `/admin/jobs`, klicka "Redigera" på utkastet
2. Ändra status till "Publicerad"
3. Klicka "Spara ändringar"

**Förväntat resultat:**
- ✓ Jobb-status ändras till "published"
- ✓ Toast: "Jobb uppdaterat"
- ✓ Backend-händelse: `job_published` loggas
- ✓ Badge i admin-listan ändras till "Publicerad"

---

## ✅ 4. Jobb syns på publika listan

**Steg:**
1. Navigera till `/jobs` (offentlig sida)
2. Kontrollera att det publicerade jobbet syns

**Förväntat resultat:**
- ✓ Jobbet visas på listan
- ✓ Visar: titel, företagsnamn, stad, kategori, anställningstyp
- ✓ Företagslogo visas (om tillgänglig)
- ✓ "Ansök nu"-knapp är synlig

**Viktigt:**
- Endast jobb med `status = 'published'` ska synas
- Om `publish_at` är satt i framtiden ska jobbet INTE synas än

---

## ✅ 5. Filtrera jobb

**Steg:**
1. På `/jobs`, använd filtren:
   - Sökfält (fritextsökning i titel)
   - Kategori-dropdown
   - Anställningstyp-dropdown
   - Stad-dropdown
2. Kombinera flera filter

**Förväntat resultat:**
- ✓ Listan uppdateras dynamiskt
- ✓ Endast matchande jobb visas
- ✓ Inga jobb: visa "Inga jobb hittades"
- ✓ Frontend analytics: `filter_jobs` och `search_jobs` triggas (om implementerat)

---

## ✅ 6. Öppna jobbdetalj

**Steg:**
1. Klicka på ett jobb i listan
2. Kontrollera URL: `/jobb/{slug}` eller `/jobs/{id}`

**Förväntat resultat:**
- ✓ Jobbsidan laddas
- ✓ Visar all jobbinformation:
  - Titel, företag, stad, region
  - Kategori, anställningstyp, språk
  - Beskrivning (renderad Markdown)
  - Krav (renderad Markdown)
  - Körkort (om krävs)
- ✓ SEO meta-tags genereras dynamiskt
- ✓ JSON-LD structured data (JobPosting) finns i `<head>`
- ✓ Frontend analytics: `view_job` triggas
- ✓ "Ansök nu"-knapp synlig i sidebar

---

## ✅ 7. Skicka ansökan

**Steg:**
1. På jobbdetaljsidan, klicka "Ansök nu"
2. Fyll i formuläret:
   - Namn (obligatoriskt)
   - E-post (obligatoriskt, valideras)
   - Telefon (obligatoriskt)
   - CV-länk (valfritt, URL-validering)
   - Meddelande (valfritt, max 1000 tecken)
   - **Honeypot-fält "website" ska lämnas tomt (dolt)**
3. Klicka "Skicka ansökan"

**Förväntat resultat:**
- ✓ Validering körs (både frontend och backend)
- ✓ Bot-skydd: Om honeypot-fält är ifyllt → avvisas tyst
- ✓ Rate limiting: Max 5 ansökningar/timme per IP och e-post
- ✓ Data saneras med DOMPurify innan lagring
- ✓ Ansökan sparas i `applications` med status "new"
- ✓ Backend-händelse: `application_submitted` loggas
- ✓ Edge function `send-application-email` anropas
- ✓ Toast: "Ansökan skickad!"
- ✓ Frontend analytics: `submit_application` (success: true) triggas
- ✓ Formulär stängs/återställs

**Vid fel:**
- Rate limit: "För många ansökningar. Försök igen om en timme."
- Validering: Specifikt felmeddelande visas

---

## ✅ 8. Mail går ut

**Förväntat resultat:**

### Till kandidaten:
- ✓ E-post skickas till kandidatens adress
- ✓ Ämne: "Tack för din ansökan till [Jobbtitel]"
- ✓ Innehåll:
  - Bekräftelse på mottagen ansökan
  - Sammanfattning av ansökan (namn, jobb, företag)
  - Information om nästa steg (AI-intervju)
  - "Vi hör av oss inom kort"

### Till admin/rekryterare:
- ✓ E-post skickas till admins e-post (konfigurerad i edge function)
- ✓ Ämne: "Ny ansökan: [Kandidatnamn] - [Jobbtitel]"
- ✓ Innehåll:
  - Jobbtitel och företag
  - Kandidatinfo (namn, e-post, telefon)
  - CV-länk (om tillgänglig)
  - Meddelande (om finns)
  - **Direktlänk till ansökan i admin:** `/admin/applications/{id}`

**Kontrollera:**
- Kolla Resend-loggar: https://resend.com/emails
- Edge function logs: `/admin/activity` eller backend logs

**Vanliga fel:**
- RESEND_API_KEY saknas eller ogiltig
- E-postdomän inte verifierad i Resend
- Edge function-fel (kolla logs)

---

## ✅ 9. Admin ser ansökan

**Steg:**
1. Logga in som admin
2. Navigera till `/admin/applications`
3. Hitta den nya ansökan

**Förväntat resultat:**
- ✓ Ansökan visas i listan
- ✓ Badge visar status: "Ny"
- ✓ Visar: kandidatnamn, jobb, företag, datum
- ✓ Klicka för att öppna detaljer: `/admin/applications/{id}`

**Detaljvy:**
- ✓ All kandidatinfo visas
- ✓ CV-länk klickbar (om finns)
- ✓ Meddelande visas (om finns)
- ✓ Status-dropdown finns
- ✓ Anteckningsområde (om implementerat)

---

## ✅ 10. Admin byter status

**Steg:**
1. I ansökningsdetaljvyn, ändra status via dropdown:
   - Ny → Under granskning
   - Under granskning → Intervju bokad
   - Intervju bokad → Antagen / Avslagen
2. Klicka "Spara ändringar"

**Förväntat resultat:**
- ✓ Status uppdateras i databasen
- ✓ Toast: "Status uppdaterad"
- ✓ Backend-händelse: `application_status_changed` loggas
- ✓ Metadata innehåller både `old_status` och `status`
- ✓ Badge i listan uppdateras

**Kontrollera händelseloggen:**
- Gå till `/admin/activity`
- Verifiera att event loggades med rätt metadata

---

## 📊 Verifiera Analytics och Loggar

**Backend-händelser (activity_logs):**
1. `/admin/activity` → Backend-fliken
2. Kontrollera att följande events finns:
   - ✓ `job_created`
   - ✓ `job_published`
   - ✓ `application_submitted`
   - ✓ `application_status_changed`

**Frontend analytics:**
1. `/admin/activity` → Frontend Analytics-fliken
2. Kontrollera events:
   - ✓ `view_job`
   - ✓ `click_apply`
   - ✓ `submit_application`

**Alternativt:** Öppna browser console och kör:
```javascript
console.log(localStorage.getItem('analytics_events'))
```

---

## 🔒 Säkerhetskontroller

### RLS Policies
- ✓ `jobs`: Endast publicerade jobb publikt synliga
- ✓ `applications`: Endast admins kan läsa
- ✓ `activity_logs`: Endast admins kan läsa
- ✓ `companies`: Publikt läsbara
- ✓ `profiles`: Användare ser endast egen profil

### Input Validation
- ✓ Formulär: Zod-validering på frontend
- ✓ Edge function: Validering + sanitering
- ✓ Bot-skydd: Honeypot-fält
- ✓ Rate limiting: 5 ansökningar/timme

### Data Sanitization
- ✓ DOMPurify används för användarinput
- ✓ Markdown renderas säkert via `react-markdown`

---

## 🐛 Vanliga Problem

| Problem | Orsak | Lösning |
|---------|-------|---------|
| Mail går inte ut | RESEND_API_KEY saknas | Konfigurera i Supabase Secrets |
| Jobb syns inte publikt | Status är inte "published" | Publicera jobbet i admin |
| Ansökan sparas ej | RLS policy blockerar | Kontrollera att "Anyone can insert" policy finns |
| Filter fungerar inte | State-problem | Hårduppdatera sidan (Ctrl+Shift+R) |
| Analytics syns inte | localStorage blockerad | Kolla browser privacy-inställningar |
| Händelseloggar tomma | Triggers inte aktiva | Kör migrations på nytt |

---

## ✅ Sammanfattning

När ALLA punkter ovan är gröna kan systemet anses fungerande och redo för produktion.

**Nästa steg:**
- [ ] Testa med riktiga användare
- [ ] Övervaka edge function logs
- [ ] Konfigurera custom domän
- [ ] Sätt upp backup-rutiner
- [ ] Implementera notifikationer vid nya ansökningar (webhook/e-post)
