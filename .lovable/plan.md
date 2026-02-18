

# Uppdatera avsandaradresser till nocv.se

## Oversikt

Din doman ar verifierad i Resend (DKIM, SPF, MX — alla grona). Nu behoever vi uppdatera de fyra backend-funktioner som fortfarande anvaender testadressen `onboarding@resend.dev` till `noreply@nocv.se`.

## Vad som aendras

Fyra filer behoever uppdateras — samma aendring i alla: byta `from`-adressen.

| Funktion | Nuvarande avsandare | Ny avsandare |
|----------|---------------------|--------------|
| send-interview-cancellation | `NoCV <onboarding@resend.dev>` | `NoCV <noreply@nocv.se>` |
| send-interview-reminder | `NoCV <onboarding@resend.dev>` | `NoCV <noreply@nocv.se>` |
| send-interview-invitation | `NoCV <onboarding@resend.dev>` | `NoCV <noreply@nocv.se>` |
| send-user-invitation | `NoCV <onboarding@resend.dev>` | `NoCV <noreply@nocv.se>` |

## Funktioner som redan ar klara

Dessa anvaender redan ratt adress och behoever inte aendras:

- send-contact-email (`noreply@nocv.se`)
- send-job-tip (`noreply@nocv.se`)
- send-getkiku-invitation (`noreply@nocv.se`)
- send-application-email (`noreply@nocv.se`)
- send-nocv-tip (`noreply@nocv.se`)

## Resultat

Efter uppdateringen kan alla e-postutskick (intervjuinbjudningar, paeminnelser, avbokningar, anvaendarinbjudningar) skickas till vilken mottagare som helst — inte bara testadresser.

## Tekniska detaljer

Aendringen aer enkel — en rad per fil. Exempelvis:

```
// Fore:
from: "NoCV <onboarding@resend.dev>"

// Efter:
from: "NoCV <noreply@nocv.se>"
```

Funktionerna distribueras automatiskt efter aendringen.

