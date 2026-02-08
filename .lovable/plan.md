
# Plan: Uppdatera e-posttexter för NOCV-tips

## Sammanfattning
Uppdaterar e-posttexterna i `send-nocv-tip` edge function för både jobbsökare och arbetsgivare med de slutgiltiga texterna.

---

## Ändringar för Jobbsökare

### E-postämne
`${senderName} tipsar: Slipp CV:t - testa dina kunskaper!`

### Rubrik
"Slipp CV:t - sök jobb genom kunskapsfrågor"

### Beskrivning
"Sök jobb genom att svara på kunskapsfrågor under 5-10 minuter. Testa om du når över 50% rätt! :)"

### Fördelar
| Ikon | Text |
|------|------|
| ✅ | **Inga dokument** - Glöm CV och personligt brev |
| ✅ | **Kunskapsfrågor** - Visa vad du kan på 5-10 min |
| ✅ | **Testa dig själv** - Nå över 50% och sök jobbet |
| ✅ | **Fokus på kunskap** - Inte på papper |

---

## Ändringar för Arbetsgivare

### E-postämne
`${senderName} tipsar: Rekrytera snabbare utan dokument`

### Rubrik
"Rekrytera snabbare - helt utan dokument"

### Beskrivning
"NOCV eliminerar CV-granskning och fokuserar på det som spelar roll: rätt kompetens för jobbet."

### Fördelar (uppdaterad enligt önskemål)
| Ikon | Text |
|------|------|
| ✅ | **Inga CV att granska** - Spara upp till 50% av tiden på varje rekrytering |
| ✅ | **Kunskapsbaserade frågor** - Mäter verklig kompetens |
| ✅ | **Hög träffsäkerhet** - Rätt kandidater redan från start |
| ✅ | **Snabbare till anställning** - Ingen dokumenthantering |

---

## Teknisk ändring

| Fil | Ändring |
|-----|---------|
| `supabase/functions/send-nocv-tip/index.ts` | Uppdatera `getEmailContent` för jobseeker och recruiter |

Edge function deployas automatiskt efter ändring.
