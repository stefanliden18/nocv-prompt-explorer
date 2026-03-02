

## Problem

Edge-funktionen `invite-user` kraschar vid uppstart med felet:

> `Uncaught SyntaxError: Identifier 'profileError' has already been declared`

Variabeln `profileError` deklareras med `const` tva ganger i samma scope (rad 85 och 134), vilket ar ogiltigt i JavaScript/TypeScript.

## Plan

**Fil: `supabase/functions/invite-user/index.ts`**

Byt namn pa den andra `profileError`-deklarationen (rad 134) till `profileUpdateError` och uppdatera referenserna pa rad 139-141 till samma namn. En enkel rename som fixar boot-felet.

