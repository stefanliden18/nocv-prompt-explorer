

# Fix: Förhandsgranska-knappen pekar fel

## Problem
Knappen "Förhandsgranska" i jobbredigeraren navigerar till `/jobs/${slug}` -- den publika jobbsidan. Den sidan visar bara publicerade jobb, sa utkast och vilande jobb hittas inte och man hamnar pa "Lediga jobb"-sidan istallet.

Det finns redan en dedikerad forhandsgranskningssida pa `/admin/jobs/:id/preview` (med `PreviewHeader`, gul banner, etc.) som kan visa jobb oavsett status. Men den anvands inte.

## Losning
Andra `handlePreview` i `JobEdit.tsx` sa den navigerar till den befintliga preview-sidan istallet.

## Teknisk andring

### src/pages/admin/JobEdit.tsx (rad 280-284)
Fran:
```js
const handlePreview = () => {
  if (id) {
    window.open(`/jobs/${slug}`, '_blank');
  }
};
```

Till:
```js
const handlePreview = () => {
  if (id) {
    window.open(`/admin/jobs/${id}/preview`, '_blank');
  }
};
```

Det ar en enradsandring. Preview-sidan (`JobPreview.tsx`) hamtar jobbet direkt via ID utan statusfilter, sa den fungerar for utkast, vilande och publicerade jobb.
