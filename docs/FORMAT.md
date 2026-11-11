# perspective-grid/v1 — Markdown format specification

This document is the **single source of truth** for the file format read by the *Regards croisés* app
(`index.html`) and produced by the `perspective-grid-format` skill. The reference implementation is
`js/core/format.js` (parser, serializer, validator); its behaviour is covered by `tests/format.test.js`.

A file describes **how several perspectives rank the same set of elements**: currents of thought, actors,
theories, periods, cultures… Each perspective is a column; each column is an ordered list of cells; a cell is
the occurrence of an element in that perspective. Cells that share a **key** are "the same element" seen
from different perspectives, which is what the app compares.

---

## 1. Concepts

| Concept | What it is | Identified by |
|---|---|---|
| **Document** | Front matter + optional intro + catalog + perspectives | — |
| **Element** | Something that can be ranked (a notion, an issue, a value…). Has a default title and description (the *catalog*). | `key` |
| **Perspective** | A column: title, subtitle (authors, period…), short summary, detailed description. | `id` |
| **Cell** | An element inside a perspective. Its position in the column **is its rank**. It may override the title, add a detail specific to this perspective, carry a **state** and **badges**. | perspective + `key` |
| **Spacer** | An empty cell used to align "floors" visually. It has no rank. | `[-]` |

Rules:
- The **rank** of a cell is its 1-based position among the non-spacer cells of its column. Rank 1 = most important for that perspective.
- A key may appear in one column only (an element specific to that perspective).
- A key should appear **at most once per column** (otherwise comparisons use the first occurrence).
- Keys are stable identifiers: lowercase ASCII, digits and hyphens are recommended (`vie-privee`, `role-erreur`). Any text without `]` is accepted.

---

## 2. File layout

```markdown
---
format: perspective-grid/v1
title: Les courants pédagogiques
subtitle: Ce que chaque courant place au centre
lang: fr
version: 1
based_on: null
updated: 2026-11-11
---

Optional introduction (Markdown), shown under the title.

# Elements

## [erreur] Le rôle de l'erreur
Default description of the element (Markdown).

## [enseignant] La place de l'enseignant

# Perspectives

## Béhaviorisme {#behaviorisme}
subtitle: Skinner, Watson
> Short description shown in the column header.

Detailed description (collapsible, Markdown).

### [renforcement] Le renforcement
state: success
badges: central
Detail specific to this perspective (Markdown).

### [erreur]
state: danger
badges: rejected
L'erreur est à éviter : elle risque d'être renforcée.

### [-]

### [representations] Les représentations de l'apprenant
state: muted
badges: ignored
```

### 2.1 Front matter

YAML-like block between two `---` lines, one `key: value` per line. Values may be quoted (`"…"` or `'…'`);
quote them when they contain `: ` or ` #`, or start with a special character.

| Key | Required | Meaning |
|---|---|---|
| `format` | yes | Always `perspective-grid/v1`. |
| `title` | yes | Title of the grid. |
| `subtitle` | no | One-line subtitle. |
| `lang` | yes | Content language (`fr`, `en`…). |
| `version` | yes | Whole number, incremented by the app on each export. |
| `based_on` | yes | `null`, or the version this file derives from (e.g. `"Les courants pédagogiques v1"`). |
| `updated` | yes | Date of the last export, `YYYY-MM-DD` (or `null`). |
| `author`, `source`, `license` | no | Free text. |
| `badges` | no | Custom badges (see § 4.2). |

Any other `key: value` line is **kept verbatim** (written back after the known keys) but not used by the app.

### 2.2 Intro

Markdown between the front matter and the first `#` heading. Optional.

### 2.3 `# Elements` (the catalog)

Optional section. Each element is a level-2 heading `## [key] Title`, followed by its default description.
Aliases accepted when reading: `Éléments`, `Catalog`, `Catalogue`.

### 2.4 `# Perspectives`

Required section. Aliases accepted when reading: `Points de vue`, `Columns`, `Colonnes`.

**Perspective** — level-2 heading `## Title {#id}`, then in this order (all optional):
1. attribute line `subtitle: …`;
2. a blockquote (`> …`, one or more consecutive lines): the **short description**;
3. any other Markdown: the **detailed description**.

**Cell** — level-3 heading `### [key] Title`, then:
1. attribute lines, directly under the heading: `state: …` and `badges: a, b`;
2. any other Markdown: the cell's **detail** for this perspective.

The title is optional when the key is in the catalog (the catalog title is shown). When written, it
**overrides** the catalog title for this perspective only.

**Spacer** — `### [-]` with nothing after it.

### 2.5 Markdown inside details

Details are CommonMark (lists, emphasis, links, images, code). Do **not** use level 1–3 headings inside a
detail: they start a new section, perspective or cell. Use `####` or deeper, or bold text. Raw HTML is
sanitised by the app (no scripts, no event handlers).

---

## 3. States

The state is a visual annotation of the cell (colour **plus** an icon, a border style and a screen-reader
label, never colour alone). It is typically set live by a trainer during a session.

| `state` | Icon | Border | Suggested meaning |
|---|---|---|---|
| `default` | — | thin | No annotation (omit the line). |
| `primary` | star | thick | Highlighted, key idea of this perspective. |
| `success` | check | solid | Valued, favourable. |
| `warning` | triangle | dashed | Nuanced, debated, to watch. |
| `danger` | cross | double | Opposed, rejected, problematic. |
| `muted` | dash | dotted, strikethrough, faded | Secondary, set aside, absent from the reasoning. |

Use states sparingly: a column where every cell is coloured highlights nothing.

---

## 4. Badges

A badge qualifies **the relation between the perspective and the element**. It is shown as icon + word
in the cell footer. A cell can have several badges: `badges: undervalued, contested`.

### 4.1 Built-in badges

| Key | Label (fr) | Label (en) | Icon (Bootstrap Icons) |
|---|---|---|---|
| `central` | central | central | `bullseye` |
| `accepted` | accepté | accepted | `check2-circle` |
| `overvalued` | surévalué | overvalued | `graph-up-arrow` |
| `undervalued` | sous-évalué | undervalued | `graph-down-arrow` |
| `contested` | contesté | contested | `patch-question` |
| `rejected` | rejeté | rejected | `x-octagon` |
| `ignored` | ignoré | ignored | `eye-slash` |
| `denied` | nié | denied | `slash-circle` |
| `instrumentalized` | instrumentalisé | instrumentalized | `tools` |

### 4.2 Custom badges

Declare them in the front matter, one per indented line: `key: icon | Label`. The icon is a
[Bootstrap Icons](https://icons.getbootstrap.com/) name, with or without the `bi-` prefix. The same syntax
can override the icon or label of a built-in badge.

```yaml
badges:
  pivot: arrow-repeat | pivot
  central: star-fill | cœur du modèle
```

---

## 5. Parser behaviour (tolerance)

The parser never fails: it builds the best possible model and returns **warnings** (code, line, message).

| Situation | Result | Warning code |
|---|---|---|
| No front matter / unknown `format` | defaults are used | `no-front-matter`, `unknown-format` |
| `## Title` without `{#id}` | id = slug of the title | — |
| Same perspective id twice | renamed `id-2` | `duplicate-perspective` |
| `### Title` without `[key]` | key = slug of the title | `cell-no-key` |
| `### [key]` not in the catalog, with a title | element created from that title | — |
| `### [key]` not in the catalog, without a title | element created, title = humanised key | `unknown-key` |
| Unknown `state` | `default` | `unknown-state` |
| Unknown badge | kept, shown with a generic icon | `unknown-badge` |
| Same key twice in a column | kept; comparisons use the first | `duplicate-in-column` |
| Cell before any perspective, text outside sections | ignored | `cell-outside-perspective`, `ignored-text` |

Elements created by the parser (not listed in `# Elements`) are **not** written back to the catalog by the
serializer, so a file round-trips unchanged.

---

## 6. Canonical form and round trip

The serializer always writes the same layout: front-matter keys in the order of § 2.1, one blank line
between blocks, `# Elements` only if the catalog has explicit entries, attributes directly under the
heading, detail directly after the attributes. Guarantees (tested):

- for a file in canonical form: `serialize(parse(md)) === md`;
- for any model: `parse(serialize(doc)).doc` deep-equals `doc`;
- for any file: one pass makes it canonical (`serialize(parse(serialize(parse(md))))` is stable).

Validate a file from the command line:

```bash
node tools/validate.js my-grid.md          # warnings, exit code 1 if any
node tools/validate.js --fix my-grid.md    # rewrite in canonical form
```

---

## 7. Versioning

On export, the app writes a **new file** (it never overwrites the original):
`version` = previous version + 1, `based_on` = `"<title> v<previous version>"`, `updated` = today's date.
The file name ends with `-v<version>.md`.

---

## 8. Authoring guidelines (for people and AIs)

- 3 to 8 perspectives, 5 to 15 cells per column. Beyond 8 × 20, the grid becomes hard to read.
- Prefer **shared keys**: the interest of the tool is to see the same element at different ranks.
- One sentence or two per detail, faithful to the source; put nuance in the perspective's detailed description.
- Rank = importance **within that perspective**, not a judgement of value. Explain the ranking logic in the intro.
- States and badges: at most 2–3 per column. `central` usually appears once per column.
- Use `muted` + `ignored`/`undervalued` at the bottom of a column to show what a perspective leaves aside.
