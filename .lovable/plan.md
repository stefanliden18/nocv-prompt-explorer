

# Strukturera Kiku-intervjusvar med numrerade frågor

## Problem
Transkriberingarna fran Kiku har inget "Fraga:/Svar:"-format. Istallet ar det ratt text dar fragor slutar med fragetecken (?) och svaren foljer direkt pa nasta rad. Den nuvarande parsern hittar inget monster och visar darfor ratt oformaterad text.

## Losning
Uppdatera parsningslogiken i `KikuTranscriptViewer.tsx` sa att den:

1. **Ny parsningsmetod**: Dela texten pa rader som slutar med `?` -- dessa ar fragor. Allt mellan tva fragor ar svaret pa den forsta fragan.
2. **Numrerade fragor**: Visa varje fraga med nummer (1, 2, 3...) i fet stil
3. **Tydlig visuell separation**: Fragan i markerad ruta med numrering, svaret under med indrag

## Visuellt resultat

```text
+---------------------------------------------------+
| Intervjusvar fran Kiku              1 intervju     |
+---------------------------------------------------+
| v Screening - 14 feb. 2026                        |
|                                                   |
|  +-----------------------------------------------+
|  | 1. Har du praktisk erfarenhet som             |
|  |    skadetekniker pa verkstad?                  |
|  +-----------------------------------------------+
|  | Jobbat pa Bilia Toyota kungens kurva i lite    |
|  | mer an ett ar och nagra manader pa Biljouren   |
|  | i Akersberga...                                |
|  +-----------------------------------------------+
|                                                   |
|  +-----------------------------------------------+
|  | 2. Kan du grunda, lacka och polera med bra     |
|  |    finish?                                     |
|  +-----------------------------------------------+
|  | grunda kan jag men lacka har jag inte sa       |
|  | mycket erfarenhet ifran...                     |
|  +-----------------------------------------------+
|                                                   |
|  ... osv                                          |
+---------------------------------------------------+
```

## Tekniska andringar

### src/components/KikuTranscriptViewer.tsx

**Ny parsningslogik** -- lagg till en tredje metod i `parseTranscript()` som:
- Delar texten rad for rad
- Identifierar rader som slutar med `?` (eventuellt med `(required)` efter) som fragor
- Samlar alla rader mellan tva fragor som svaret pa den foregaende fragan
- Returnerar numrerade Q&A-par

**Uppdaterad rendering**:
- Fragenumret visas som `1.`, `2.`, `3.` etc. i fet stil framfor fragan
- Fragan visas i fet stil i den markerade rutan
- Svaret visas med normal stil under

Befintlig parsningslogik ("Fraga:/Svar:" och "Kiku:/Namn:") behalls som forsta och andra prioritet -- den nya "fragetecken-parsern" laggs till som tredje alternativ innan fallback till ratt text.

### Inga andra filer andras
Andringen ar isolerad till parsnings- och renderingslogiken i `KikuTranscriptViewer.tsx`.

