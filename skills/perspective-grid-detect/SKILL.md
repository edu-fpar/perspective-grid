---
name: perspective-grid-detect
description: Reads course content and finds the passages where a "perspective grid" (Regards croisés) is pedagogically useful — several perspectives (currents, theories, actors, periods, cultures) that rank the same set of elements differently. Produces an argued recommendation (candidate perspectives, shared elements, teaching value) and says clearly when the tool is NOT suitable. Use when a teacher asks whether, where or how a course could use a perspective grid / comparison grid / "regards croisés", or before running perspective-grid-format.
---

# perspective-grid-detect

You analyse teaching material and decide **whether and where** a perspective grid helps learners.
The tool, its data model and its constraints are defined in `docs/FORMAT.md` (single source of truth):
read it first if you have not.

A perspective grid shows, side by side, **how several perspectives rank the same elements**. Each
perspective is a column; each column orders the same elements from most to least important *for that
perspective*; learners compare ranks, absences and stances (central, rejected, ignored…).

## 1. What makes a good candidate

Look for passages where **all** of these hold:

1. **Several perspectives (3 to 8)** that are presented as distinct: schools of thought, theories,
   disciplines, stakeholders, historical periods, countries or cultures, professional roles, authors.
2. **A shared set of elements (5 to 15)** that each perspective addresses: notions, values, criteria,
   issues, priorities, actors, practices.
3. **Different hierarchies**: the perspectives do not just "say different things", they give the same
   elements **different weight** — one puts X first, another ignores it, a third rejects it.
4. **A teaching payoff**: seeing the ranks side by side reveals something the linear text hides
   (a common core, a blind spot, a reversal, a historical shift, a hidden assumption).

Strong signals in the text: "contrairement à…", "pour X, l'essentiel est…", "Y accorde peu de place à…",
"au cœur de…", "relégué", "rejette", "privilégie", comparison tables, "approaches to…", "according to…".

## 2. When the tool is NOT suitable — say so

Recommend **against** the grid (and suggest a better format) when:

| Situation | Why it fails | Better format |
|---|---|---|
| Binary opposition (pros / cons, two camps) | Two columns with mirror-image ranks teach little | Two-column table, debate |
| Chronology, history of an idea | Order is time, not importance | Timeline |
| Linear process or procedure | Steps are not ranked by perspectives | Flowchart, numbered steps |
| Perspectives with no shared elements | Nothing to compare: every key appears once | Separate cards |
| Elements that cannot be ranked (pure description, taxonomy) | Rank would be arbitrary | Concept map, glossary |
| A single authoritative answer | "Perspectives" are just errors | Explanation + quiz |
| Too fine-grained (> 8 perspectives or > 20 elements) | Unreadable on a phone | Split into several grids |

Also flag **risks**: ranking may oversimplify a nuanced author; the source may not support a ranking
(then the grid would invent one); sensitive topics (cultures, religions) need careful, sourced wording.

## 3. Method

1. Read the whole content. List every place where several perspectives are compared.
2. For each place, list the candidate perspectives and the elements they share. Count shared elements
   (present in ≥ 2 perspectives): **fewer than 4 shared elements → weak candidate**.
3. Check that the **source supports a ranking**: explicit priorities, "central", "secondary", "ignored",
   or at least clear emphasis. Note where you would have to infer.
4. Score each candidate (high / medium / low) and keep the best 1–3.
5. For the best candidate, sketch the grid: perspectives (with subtitle: authors or period), keys,
   and a draft ranking for 2 perspectives to show the contrast.

## 4. Output

Answer in the teacher's language (French by default for French content). Use this structure:

```markdown
## Recommandation : <oui / oui avec réserves / non>

### Passage(s) pertinent(s)
- <section or quote> — <why it fits, in one sentence>

### Grille proposée : <title>
- **Points de vue** (n) : <Perspective 1> (<authors/period>), …
- **Éléments communs** (n) : `key-1` <title>, `key-2` <title>, …
- **Éléments propres** : <perspective> → `key` <title>
- **Ce que la grille fait voir** : <the insight: common core, reversals, blind spots>
- **Exemple de contraste** : `key` est rang 1 pour A, rang 6 pour B, absent de C.

### Points de vigilance
- <where the ranking is inferred, oversimplification risks, sources to check>

### Passages où l'outil n'est pas adapté
- <section> — <reason> → <better format>
```

Keep it short (one screen). If nothing fits, say "non", explain why in two sentences, and propose the
better format. Never force a grid.

Next step: the `perspective-grid-format` skill turns the recommendation into a valid file.

## 5. Complete example

**Input (excerpt):** a course chapter presenting behaviourism, cognitivism, constructivism,
socio-constructivism and connectivism, discussing for each the role of error, the teacher, motivation,
memory, peer interaction, assessment, prior conceptions, autonomy and digital tools; followed by a
section on the history of programmed instruction (1950–1970) and a "how to write a learning objective"
procedure.

**Output:**

```markdown
## Recommandation : oui

### Passage(s) pertinent(s)
- § 2 « Cinq courants » — cinq courants abordent explicitement les mêmes neuf notions et leur donnent un poids très différent.

### Grille proposée : Les courants pédagogiques
- **Points de vue** (5) : Béhaviorisme (Watson, Skinner), Cognitivisme (Gagné, Sweller), Constructivisme (Piaget), Socio-constructivisme (Vygotski, Bruner), Connectivisme (Siemens, Downes)
- **Éléments communs** (9) : `erreur`, `enseignant`, `motivation`, `memorisation`, `pairs`, `evaluation`, `representations`, `autonomie`, `numerique`
- **Éléments propres** : Béhaviorisme → `renforcement` ; Cognitivisme → `traitement` ; Constructivisme → `conflit-cognitif` ; Socio-constructivisme → `zpd` ; Connectivisme → `reseau`
- **Ce que la grille fait voir** : l'erreur passe de « à éviter » à « outil pour apprendre » ; les pairs, ignorés au départ, deviennent centraux avec Vygotski.
- **Exemple de contraste** : `pairs` est rang 9 (ignoré) en béhaviorisme, rang 1 (central) en socio-constructivisme.

### Points de vigilance
- Le connectivisme est présenté plus brièvement : son classement est en partie inféré ; le signaler dans l'introduction.

### Passages où l'outil n'est pas adapté
- § 3 « Histoire de l'enseignement programmé » — chronologie → frise chronologique.
- § 4 « Rédiger un objectif » — procédure linéaire → étapes numérotées.
```

The resulting file is `examples/courants-pedagogiques.md`.
