

# NoCV Kundportal -- Fas 1 (MVP)

## Oversikt

En separat kundportal byggs vid sidan av det befintliga admin-systemet. Kunder (verkstader/foretag) loggar in med magic link och far tillgang till sina kandidater, kan granska profiler och boka intervjuer. Portalen anvander era befintliga farger och typsnitt -- inte de generiska fargerna fran mockupen.

Portalen lever under `/portal/`-routes och har ett eget sidebar-layout, helt separerat fran admin-panelen.

## Databasandringar

### Nya tabeller

**`company_users`** -- Kopplar inloggade anvandare till foretag
| Kolumn | Typ | Beskrivning |
|---|---|---|
| id | uuid PK | |
| user_id | uuid FK (auth.users) | Supabase auth-anvandare |
| company_id | uuid FK (companies) | Befintlig companies-tabell |
| name | text | Kontaktpersonens namn |
| role | text | 'admin' eller 'viewer' (default 'admin') |
| calendar_url | text | Calendly/Cal.com-lank (valfritt) |
| created_at | timestamptz | |

**`positions`** -- Tjanster/roller som rekryteras
| Kolumn | Typ | Beskrivning |
|---|---|---|
| id | uuid PK | |
| company_id | uuid FK (companies) | |
| title | text | T.ex. "Mekaniker -- Toyota Kista" |
| description | text | Rollbeskrivning |
| experience_level | text | 'junior', 'mid', 'senior' |
| status | text | 'active', 'paused', 'filled' (default 'active') |
| created_at | timestamptz | |

**`portal_candidates`** -- Kandidater presenterade till kunder
| Kolumn | Typ | Beskrivning |
|---|---|---|
| id | uuid PK | |
| position_id | uuid FK (positions) | |
| name | text | |
| summary | text | AI-intervjusammanfattning |
| strengths | text[] | Lista med styrkor |
| experience_years | integer | |
| skill_level | text | 'junior', 'mid', 'senior' |
| video_url | text | Valfritt |
| audio_url | text | Valfritt |
| status | text | 'new', 'reviewed', 'interview_booked', 'hired', 'rejected' (default 'new') |
| presented_at | timestamptz | Nar kandidaten presenterades |
| created_at | timestamptz | |

**`portal_interviews`** -- Bokade intervjuer
| Kolumn | Typ | Beskrivning |
|---|---|---|
| id | uuid PK | |
| candidate_id | uuid FK (portal_candidates) | |
| company_user_id | uuid FK (company_users) | Vem som bokade |
| scheduled_at | timestamptz | |
| duration_minutes | integer | Default 30 |
| location_type | text | 'onsite', 'teams', 'phone' |
| location_details | text | Adress eller lank |
| notes | text | |
| status | text | 'scheduled', 'completed', 'cancelled' (default 'scheduled') |
| created_at | timestamptz | |

**`portal_notifications`** -- Notifieringar till kundanvandare
| Kolumn | Typ | Beskrivning |
|---|---|---|
| id | uuid PK | |
| company_user_id | uuid FK (company_users) | |
| type | text | 'new_candidate', 'interview_reminder', 'status_update' |
| title | text | |
| message | text | |
| read | boolean | Default false |
| related_candidate_id | uuid | Valfritt, for direktlank |
| created_at | timestamptz | |

### RLS-policyer

Alla tabeller far Row Level Security. Grundprincipen:

- **company_users**: Anvandare kan se sin egen rad; admins kan se allt
- **positions**: Anvandare ser bara positioner for sitt foretag (via company_users-koppling)
- **portal_candidates**: Anvandare ser bara kandidater kopplade till positioner i sitt foretag
- **portal_interviews**: Anvandare ser bara intervjuer i sitt foretag
- **portal_notifications**: Anvandare ser bara sina egna notifieringar
- **NoCV-admins** (med app_role 'admin') har full tillgang till alla tabeller for att kunna lagga in kandidater och hantera data

En databasfunktion `get_user_company_id(uuid)` skapas som SECURITY DEFINER for att slippa rekursiva RLS-problem.

### Trigger

En trigger pa `portal_candidates` skapar automatiskt en notification i `portal_notifications` nar en ny kandidat laggs till, riktad till alla company_users i det aktuella foretaget.

## Nya filer och routes

### Sidkomponenter (src/pages/portal/)

| Fil | Route | Beskrivning |
|---|---|---|
| `PortalDashboard.tsx` | `/portal` | Valkomstsida med 3 sammanfattningskort, senaste kandidater, kommande intervjuer |
| `PortalPositions.tsx` | `/portal/positions` | Lista aktiva tjanster med kandidatraking |
| `PortalCandidateList.tsx` | `/portal/positions/:id/candidates` | Kandidatlista per position med filter (Alla/Nya/Granskade/Bokade) |
| `PortalCandidateProfile.tsx` | `/portal/candidates/:id` | Detaljprofil med AI-sammanfattning, styrkor, tidslinje, boka-knapp |
| `PortalBooking.tsx` | `/portal/candidates/:id/book` | 3-stegs bokningsflode (valj tid, bekrafta detaljer, bekraftelse) |
| `PortalInterviews.tsx` | `/portal/interviews` | Oversikt av alla intervjuer med avboka/boka om |
| `PortalSettings.tsx` | `/portal/settings` | Foretags- och kalenderinstallningar |

### Layoutkomponenter (src/components/portal/)

| Fil | Beskrivning |
|---|---|
| `PortalLayout.tsx` | Wrapper med sidebar + huvudinnehall |
| `PortalSidebar.tsx` | Dark sidebar med NoCV-branding, navigation (Dashboard, Tjanster, Intervjuer, Installningar), anvandarprofil |
| `PortalStatCard.tsx` | Sammanfattningskort (antal, ikon, farg) |
| `PortalCandidateCard.tsx` | Kandidatkort med badges och knappar |
| `PortalStatusBadge.tsx` | Statusbadge-komponent med ratt farger |
| `PortalProtectedRoute.tsx` | Skyddar portal-routes -- kravet ar att anvandaren ar inloggad OCH har en rad i company_users |

### Hooks (src/hooks/)

| Fil | Beskrivning |
|---|---|
| `usePortalAuth.ts` | Hook som hamtar company_user-data for den inloggade anvandaren och exponerar company_id, company_name, user_role |
| `usePortalCandidates.ts` | Hook for att hamta/filtrera kandidater per position |
| `usePortalInterviews.ts` | Hook for att hamta intervjuer |

### Routing

Nya routes laggs till i `App.tsx` under `/portal/*`, skyddade av `PortalProtectedRoute` som kontrollerar att anvandaren har en company_users-rad.

## Designprinciper

- Sidebaren anvander `bg-nocv-dark-blue` (inte generisk slate-900)
- CTA-knappar anvander `bg-nocv-orange` med `hover:bg-nocv-orange-hover`
- Statuskort och badges foljer mockupens monster men med era befintliga designtokens
- Typsnitt: era befintliga `font-heading` och `font-body`
- Responsivt: sidebar kollapsar pa mobil till hamburger-meny

## Inloggningsflode

Befintlig Auth-sida (`/auth`) anvands. Nar en anvandare loggar in kontrolleras om de har en rad i `company_users`:
- Om ja: omdirigeras till `/portal`
- Om nej men har admin/recruiter-roll: omdirigeras till `/admin` (befintligt beteende)
- Om nej och vanlig user: visas ett "Ingen kundportal kopplad"-meddelande

## MVP-scope (detta bygge)

1. Databastabeller med RLS
2. Portal-layout med sidebar
3. Dashboard med sammanfattningskort
4. Positionslista
5. Kandidatlista per position med filter
6. Kandidatprofil med AI-sammanfattning och styrkor
7. Enkelt bokningsflode (3 steg: valj tid, bekrafta, klart)
8. Intervjuoversikt
9. Grundlaggande installningssida

Det som INTE ingar i MVP: e-postnotifikationer vid ny kandidat, kalenderintegration (Google Calendar), video/ljudspelare, kandidatjamforelse, statistik/rapporter, admin-panel for kundhantering.

## Teknisk sammanfattning

| Andring | Detalj |
|---|---|
| Databas | 5 nya tabeller + RLS-policyer + helper-funktion + trigger |
| Nya filer | ~15 nya filer (7 sidor, 6 komponenter, 3 hooks) |
| App.tsx | 7 nya routes under `/portal/*` |
| AuthContext.tsx | Utoka med company_user-kontroll vid inloggning |
| ProtectedRoute | Ny `PortalProtectedRoute` for kundrutter |

