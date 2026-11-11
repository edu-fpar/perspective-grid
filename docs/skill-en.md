# Perspective Grid skill: build a perspective grid from course content

> **You are an AI and you were given the address of this page?** It contains your instructions.
> Read it in full. Then, from the content provided by the teacher:
> 1. say whether a perspective grid is relevant (and, if not, why);
> 2. if it is, produce **a single Markdown file** that follows exactly the syntax below.
> The file will be opened in the *Regards croisés / Perspective Grid* app (https://edu-fpar.github.io/perspective-grid/).

---

## 1. What the tool does

A perspective grid shows **how several perspectives rank the same set of elements differently**. Each
perspective (school of thought, theory, stakeholder, period, culture, person…) is a **column**. In each
column, elements are **ranked from most important (rank 1) to least important** for that perspective.
Learners compare: what is shared, what changes rank, what is absent, rejected or ignored.

---

## 2. Your task

### Step A: decide whether a grid is relevant

A grid helps when **all** of these hold:

1. **Several distinct perspectives** (3 to 8).
2. **A shared set of elements** (5 to 15) that each perspective addresses: notions, values, criteria,
   issues, priorities, actors, practices.
3. **Different hierarchies**: the perspectives do not just say different things, they give **more or less
   weight** to the same elements.
4. **A teaching payoff**: seeing the ranks side by side reveals a common core, a blind spot, a reversal.

**Do not propose a grid** (suggest a better format instead) when the content is:

| Situation | Better format |
|---|---|
| A binary opposition (pros / cons, two camps) | Two-column table, debate |
| A chronology, the history of an idea | Timeline |
| A process, a procedure | Numbered steps, diagram |
| Perspectives with no shared elements | Separate cards |
| Elements that cannot be ranked (description, taxonomy) | Concept map, glossary |
| A single right answer | Explanation + quiz |
| Too many perspectives (> 8) or elements (> 20) | Several smaller grids |

If the source does not support a ranking and you would have to invent one, say so.

### Step B: produce the file

1. Choose the perspectives (columns) and the shared elements. **Same notion = same key** everywhere.
2. Rank each column's elements from the source: rank 1 = what this perspective considers most important
   or examines first.
3. Put what a perspective leaves aside at the bottom of its column, with `state: muted` and a badge
   (`ignored`, `undervalued`), rather than omitting it. Omit an element only when the perspective really
   does not address it: the app will then show "absent from this perspective".
4. Write short details (1–2 sentences) **faithful to the source**. Never invent quotes, dates or references.
5. Use states and badges **sparingly** (§ 5).
6. Go through the checklist (§ 8), then answer in the format of § 9.

Write in the language of the source (or the one requested) and set it in `lang`. Keys, ids, attribute,
state and badge names stay in lowercase ASCII.

---

## 3. File structure

```markdown
---
format: perspective-grid/v1
title: Grid title
subtitle: Optional subtitle
lang: en
version: 1
based_on: null
updated: 2026-11-11
---

Optional introduction (1–3 sentences): what the ranks mean in this grid.

# Elements

## [element-key] Shared title of the element
A neutral one-sentence description, valid for every perspective.

# Perspectives

## Perspective title {#identifier}
subtitle: Authors, period or context
> One sentence: what matters most for this perspective.

Detailed description (2–4 sentences), collapsible in the app.

### [element-key]
state: primary
badges: central
What this element means for this perspective (1–2 sentences).

### [own-key] Element specific to this perspective
Detail.
```

Syntax rules:

- **Front matter** between two `---` lines: `format`, `title`, `lang`, `version`, `based_on`, `updated`
  are required. Quote a value that contains `: ` or ` #`.
- `# Elements`: the **catalog** of shared elements. Each element: `## [key] Title`, then its (optional)
  description.
- `# Perspectives`: the columns, in display order.
  - Column: `## Title {#identifier}`, then in this order (all optional): the `subtitle:` line, a `>` quote
    (short description), the rest (detailed description).
  - Cell: `### [key]`; **the order of cells is the rank**. The title after the key is optional when the key
    is in the catalog; when written, it replaces the shared title for this column only.
  - Directly under the cell heading: the `state:` and `badges:` lines (optional), then the detail.
- A key appears **at most once per column**. An element specific to one column is written directly
  `### [key] Title`, with no catalog entry.
- **Empty slot** (visual alignment): `### [-]`. It does not count in ranks.
- In details: simple Markdown (bold, italic, lists, links). **Never `#`, `##` or `###` headings** inside a detail.
- Keys and ids: lowercase letters, digits and hyphens (`privacy`, `role-of-error`). A key names a **notion**,
  never a position (`error` ✓, `positive-error` ✗).

Display option: add `columns: narrow` to the front matter when cards hold a single word or name (narrow
columns, two per phone screen).

---

## 4. Ranking

- Rank 1 = the element most important to this perspective, or the one it examines first.
- Base every rank on the source: explicit statements first, then emphasis. When you must infer, keep the
  ranking coarse and say so in the introduction or in the column's description.
- Aim for at least 60 % of cells shared by several columns: comparison is the whole point.
- Usually 5 to 12 cells per column.

---

## 5. States and badges

**States** (`state:`): a visual annotation of the cell. Use sparingly: at most 2–3 coloured cells per
column, besides `muted` ones.

| State | Suggested meaning |
|---|---|
| `default` | No annotation (omit the line). |
| `primary` | Highlighted: key idea of the perspective (often rank 1). |
| `success` | Valued, favourable. |
| `warning` | Nuanced, debated. |
| `danger` | Rejected, opposed. |
| `muted` | Secondary, set aside (struck through and faded). |

**Badges** (`badges: a, b`): qualify the **relation** of the perspective to the element.

| Badge | Displayed label |
|---|---|
| `central` | central (usually once per column) |
| `accepted` | accepted |
| `overvalued` | overvalued |
| `undervalued` | undervalued |
| `contested` | contested |
| `rejected` | rejected |
| `ignored` | ignored |
| `denied` | denied |
| `instrumentalized` | instrumentalized |

Custom badges: declare them in the front matter, one per indented line, `key: icon | Label` (a Bootstrap
Icons name, e.g. `bank`, `bicycle`, `umbrella`, `globe-americas`):

```yaml
badges:
  culture: bank | culture
  sport: bicycle | sport
```

---

## 6. Complete (simple) example

```markdown
---
format: perspective-grid/v1
title: The end-of-year trip
subtitle: Three friends, one destination to choose
lang: en
version: 1
based_on: null
updated: 2026-11-11
columns: narrow
badges:
  exotic: globe-americas | exotic
  culture: bank | culture
  relax: umbrella | relax
  sport: bicycle | sport
---

Each column is one person's ranking, from their favourite destination (rank 1) to the least wanted. Badges say what attracts them.

# Elements

## [greece] Greece

## [iceland] Iceland

## [italy] Italy

## [japan] Japan

## [thailand] Thailand

# Perspectives

## Lea {#lea}
subtitle: Museums, ruins and good food

### [italy]
state: primary
badges: culture

### [japan]
badges: culture, exotic

### [greece]
badges: culture, relax

## Karim {#karim}
subtitle: Hiking and wide open spaces

### [iceland]
state: primary
badges: sport

### [japan]
badges: exotic

### [greece]
badges: relax

## Sofia {#sofia}
subtitle: Sun, beach and doing nothing

### [thailand]
state: primary
badges: relax, exotic

### [greece]
badges: relax

### [italy]
badges: culture

### [iceland]
state: danger
badges: rejected
```

Complete examples with details (learning theories, ethics and AI, in French):
https://github.com/edu-fpar/perspective-grid/tree/main/examples

---

## 7. Excerpt of a course grid (with details)

```markdown
## Behaviourism {#behaviourism}
subtitle: Watson, Thorndike, Skinner
> Learning means changing an observable behaviour through reinforcement.

Behaviourism studies links between stimulus and response without speculating about what happens "in the head".

### [reinforcement] Reinforcement
state: primary
badges: central
A response followed by a pleasant consequence is more likely to happen again.

### [error]
state: danger
badges: rejected
Errors must be avoided: a wrong answer may be reinforced.

### [peers]
state: muted
badges: ignored
No theoretical role: learning is seen as individual.
```

---

## 8. Checklist

- [ ] Complete front matter, `format: perspective-grid/v1`.
- [ ] 3 to 8 columns, each with `{#identifier}`; `subtitle:` and `>` when the source allows.
- [ ] Shared elements in `# Elements`; same notion = same key in every column.
- [ ] Each key at most once per column.
- [ ] Ranks justified by the source; set-aside elements at the bottom, `muted`.
- [ ] At most 2–3 coloured cells per column; `central` at most once per column.
- [ ] Short, faithful details, no `#` to `###` headings.
- [ ] Custom badges declared in the front matter.

---

## 9. Your answer

1. **Recommendation** (3–6 lines): relevant or not, the perspectives and elements chosen, what the grid
   reveals, which parts of the ranking were inferred rather than read in the source.
2. **The file**, in a single ` ```markdown ` code block, with nothing else in it.
3. **For the teacher** (2–4 lines): how to open it (copy the block, then in the app *File › Paste
   Markdown*, or save it as `.md` and drop it on the page) and 2 or 3 discussion questions for the class.

If a grid is not relevant: explain why in two sentences, suggest the better format, and do not produce a
file (unless the teacher insists).

The teacher's instructions (number of columns, audience, language, tone) override the recommendations of
this page. Never change the **syntax**.

Full format specification:
https://github.com/edu-fpar/perspective-grid/blob/main/docs/FORMAT.md
