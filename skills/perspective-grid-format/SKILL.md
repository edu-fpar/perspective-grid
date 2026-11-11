---
name: perspective-grid-format
description: Turns course content (or the output of perspective-grid-detect) into a Markdown file in the perspective-grid/v1 format read by the "Regards croisés" app — stable shared keys, justified ranks, sparing states and badges, short details faithful to the source — then validates it with the reference parser and fixes every warning. Use when a teacher asks to create, write, generate or convert a perspective grid / comparison grid / "regards croisés" file.
---

# perspective-grid-format

You write **one Markdown file** that follows `docs/FORMAT.md` exactly. That document is the single source
of truth: read it before writing, and never change the syntax. This skill adds the editorial rules.

## 1. Inputs

- Course content (text, notes, PDF extract…) and/or a recommendation from `perspective-grid-detect`.
- Teacher's instructions (number of columns, audience, language) override the defaults below, never the syntax.
- Write the content in the language of the source (or the one requested) and set `lang` accordingly.
  Keys, ids, attribute names, states and badge keys stay in lowercase ASCII.

## 2. Editorial rules

**Perspectives** (3–8): title = the perspective's usual name; `subtitle:` = authors, period or context;
`>` short description = one sentence answering "what matters most for this perspective?";
detailed description = 2–4 sentences of context and nuance.

**Elements and keys**:
- Put every element shared by ≥ 2 perspectives in `# Elements` with a neutral title and a one-sentence
  description that does not take sides.
- Keys: short, stable, lowercase ASCII with hyphens, derived from the notion (`vie-privee`, `erreur`),
  never from a position (`erreur-positive` ✗). The **same notion = the same key** in every column.
- Elements specific to one perspective: write them directly as `### [key] Title` in that column
  (no catalog entry needed).
- Aim for at least 60 % shared cells: comparison is the point.

**Ranks** (order of cells in a column):
- Rank 1 = what the perspective considers most important / examines first.
- Base each rank on the source: explicit statements first, then emphasis. When you infer, keep the
  ranking coarse and say so in the intro or the perspective's detail.
- Put what a perspective leaves aside at the **bottom**, with `state: muted` and a badge (`ignored`,
  `undervalued`), rather than omitting it — absence must be a deliberate choice.
- Omit an element from a column only when the perspective genuinely does not address it; the app then
  shows "absent from this perspective".

**Details** (under each cell): 1–2 sentences, specific to this perspective, faithful to the source.
No invented quotes, dates or references; quote only what the source quotes. No headings `#`–`###`
inside details.

**States and badges — sparingly**:
- Usually one `central` badge per column (its rank-1 cell, often with `state: primary`).
- `success` / `danger` for clear valuing / rejection stated by the source; `warning` for debated or nuanced.
- At most 2–3 coloured cells per column besides `muted` ones.
- Badges qualify the **relation** perspective → element: `rejected`, `ignored`, `undervalued`,
  `contested`, `instrumentalized`… Use custom badges (front matter `badges:`) only if none fits.

**Front matter**: `version: 1`, `based_on: null`, `updated:` today's date (YYYY-MM-DD) for a new file.

**Intro** (text before `# Elements`): 1–3 sentences saying what the ranks mean in this grid and any
simplification made.

## 3. Validate, then fix

Run the reference parser (in the project root):

```bash
node tools/validate.js my-grid.md
```

- Fix **every** warning and run again until it prints `✓`.
- Then rewrite in canonical form: `node tools/validate.js --fix my-grid.md`.
- No Node available? Check by hand against § 5 of `docs/FORMAT.md` (headings, `[key]`, attribute lines
  directly under headings, allowed states, declared badges), or paste the file in the app
  (File › Paste Markdown): the preview lists the same warnings.

## 4. Output

Return the file content in a single ```markdown block (or write it to `examples/<slug>.md` when working
in the repository), followed by a 3–5 line note: sources of the ranks, inferred parts, suggested
discussion questions. To publish: the teacher opens the app, File › Open (or drops the file), or shares
`index.html?src=<url of the .md>`.

## 5. Checklist before answering

- [ ] Front matter complete, `format: perspective-grid/v1`.
- [ ] 3–8 perspectives, each with `{#id}`, subtitle, `>` summary.
- [ ] Shared elements in `# Elements`; same notion = same key everywhere.
- [ ] Ranks justified by the source; muted/ignored elements at the bottom.
- [ ] ≤ 3 coloured cells per column; one `central` per column at most.
- [ ] Details short, faithful, no level 1–3 headings.
- [ ] `node tools/validate.js` prints ✓ (no warnings).

## 6. Complete example (excerpt of `examples/ethiques-ia.md`)

```markdown
---
format: perspective-grid/v1
title: Éthiques et intelligence artificielle
subtitle: Cinq traditions morales face aux mêmes enjeux
lang: fr
version: 1
based_on: null
updated: 2026-11-11
---

Chaque tradition éthique pose une question différente. Les rangs indiquent ce que chaque approche examine **en premier** face à un système d’IA.

# Elements

## [biais] Biais et discrimination
Des systèmes entraînés sur des données historiques peuvent reproduire ou amplifier des inégalités.

## [manipulation] Manipulation et autonomie
Influence sur les opinions et les comportements : recommandation, persuasion personnalisée, contenus trompeurs.

## [vie-privee] Vie privée et données personnelles
Collecte massive de données, profilage, surveillance.

# Perspectives

## Utilitarisme {#utilitarisme}
subtitle: Bentham, Mill, Singer
> Une action est juste si elle produit le plus grand bien-être pour le plus grand nombre.

Approche conséquentialiste : on évalue un système d’IA à ses effets prévisibles.

### [bien-etre] Le bilan bénéfices / risques
state: primary
badges: central
La question première : les gains attendus l’emportent-ils sur les dommages ?

### [biais]
state: warning
badges: undervalued
Les discriminations comptent comme des dommages à additionner, au risque de sacrifier une minorité.

### [vie-privee]
state: warning
badges: instrumentalized
Négociable : elle peut céder devant un bénéfice collectif important.

## Déontologie {#deontologie}
subtitle: Kant, et ses héritiers contemporains
> Certaines actions sont obligatoires ou interdites, quelles qu’en soient les conséquences.

### [dignite] La dignité de la personne
state: primary
badges: central
Ne jamais traiter une personne simplement comme un moyen.

### [manipulation]
state: danger
badges: rejected
Contourner la raison d’une personne revient à la traiter comme un moyen : c’est interdit, même pour son bien.

### [vie-privee]
state: success
Exigence liée à l’autonomie, qui ne se négocie pas contre un bénéfice collectif.

### [biais]
Traiter chacun selon des règles universalisables.
```

The full files `examples/ethiques-ia.md` and `examples/courants-pedagogiques.md` are complete,
validated references.
