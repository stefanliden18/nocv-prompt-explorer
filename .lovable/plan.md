
## Bredda e-postfältet pa kandidatprofilen

### Problem
Nar man redigerar e-postadressen pa en portalkandidat ar input-faltet for smalt for att visa hela adressen.

### Losning
Gora input-faltet bredare genom att lagga till en `min-w` och `w-full` pa Input-komponenten i `PortalCandidateProfile.tsx`, samt se till att containern tillater att faltet expanderar.

### Teknisk detalj
I filen `src/pages/portal/PortalCandidateProfile.tsx` rad 188-200:
- Andra container-div fran `flex items-center gap-1` till `flex items-center gap-1 w-full`
- Lagga till `min-w-[250px] flex-1` pa Input-komponenten sa att den tar upp tillgangligt utrymme och har en minsta bredd pa 250px

Ingen databas- eller backend-andring behovs.
