

## Problem

Bloggsidans (`BlogPost.tsx`) prose-innehall har for stora mellanrum mellan stycken och rubriker jamfort med Om oss-sidan. Skillnaderna:

| | Blogg (nu) | Om oss (mal) |
|---|---|---|
| Max-bredd | `max-w-3xl` (768px) | `max-w-[800px]` |
| Prose-klasser | `prose prose-lg` | `prose prose-lg` + `[&>p]:mb-6 text-left` |
| Bakgrund | `bg-background` | `bg-background` (samma) |

Tailwind `prose-lg` har standard `line-height: 1.78` och stora marginaler pa `<h2>`, `<h3>` och `<p>`. Om oss-sidan overrider paragrafmarginaler med `[&>p]:mb-6`.

## Plan

**Fil: `src/pages/BlogPost.tsx`**

1. Andra `max-w-3xl` till `max-w-[800px]` for att matcha Om oss
2. Uppdatera prose-klassen pa innehalls-div:en fran:
   ```
   prose prose-lg max-w-none dark:prose-invert
   ```
   till:
   ```
   prose prose-lg max-w-none dark:prose-invert text-left [&>p]:mb-6 [&>h2]:mt-10 [&>h2]:mb-4 [&>h3]:mt-8 [&>h3]:mb-3
   ```
   Detta ger:
   - `[&>p]:mb-6` -- samma styckemellanrum som Om oss
   - `[&>h2]:mt-10 [&>h2]:mb-4` -- tightare rubrikmarginaler
   - `[&>h3]:mt-8 [&>h3]:mb-3` -- tightare underrubrikmarginaler
   - `text-left` -- vansterstallning som Om oss

**Fil: `src/index.css`**

3. Lagg till tightare line-height for blogg-prose sa att radavstandet matchar Om oss:
   ```css
   .prose p {
     line-height: 1.6;
   }
   ```

Inga databasandringar kravs. Tva filer andras.

