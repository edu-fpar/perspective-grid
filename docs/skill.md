# Skill Regards croisés : créer une grille de perspectives à partir d'un cours

> **Tu es une IA et on t'a donné l'adresse de cette page ?** Elle contient tes instructions.
> Lis-la en entier. Ensuite, à partir du contenu fourni par l'enseignant·e :
> 1. dis si une grille « Regards croisés » est pertinente (et, sinon, pourquoi) ;
> 2. si oui, produis **un seul fichier Markdown** qui respecte exactement la syntaxe ci-dessous.
> Ce fichier sera ouvert dans l'application *Regards croisés* (https://edu-fpar.github.io/perspective-grid/).

---

## 1. Ce que fait l'outil

Une grille Regards croisés montre **comment plusieurs points de vue hiérarchisent différemment un même
ensemble d'éléments**. Chaque point de vue (courant, théorie, acteur, époque, culture, personne…) est une
**colonne**. Dans chaque colonne, les éléments sont **classés du plus important (rang 1) au moins important**
pour ce point de vue. L'apprenant compare : ce qui est commun, ce qui change de rang, ce qui est absent,
rejeté ou ignoré.

---

## 2. Ta mission

### Étape A : décider si la grille est pertinente

La grille est utile quand **toutes** ces conditions sont réunies :

1. **Plusieurs points de vue** distincts (3 à 8).
2. **Un ensemble commun d'éléments** (5 à 15) que chaque point de vue aborde : notions, valeurs, critères,
   enjeux, priorités, acteurs, pratiques.
3. **Des hiérarchies différentes** : les points de vue ne disent pas seulement des choses différentes, ils
   donnent **plus ou moins d'importance** aux mêmes éléments.
4. **Un gain pédagogique** : voir les rangs côte à côte révèle un socle commun, un angle mort, un renversement.

**Ne propose pas de grille** (et propose un meilleur format) quand le contenu est :

| Situation | Meilleur format |
|---|---|
| Une opposition binaire (pour / contre, deux camps) | Tableau à deux colonnes, débat |
| Une chronologie, l'histoire d'une idée | Frise chronologique |
| Un processus, une procédure | Étapes numérotées, schéma |
| Des points de vue sans éléments communs | Fiches séparées |
| Des éléments qu'on ne peut pas classer (description, taxonomie) | Carte mentale, glossaire |
| Une seule bonne réponse | Explication + quiz |
| Trop de points de vue (> 8) ou d'éléments (> 20) | Plusieurs grilles plus petites |

Si le classement n'est pas dans la source et qu'il faudrait l'inventer, dis-le.

### Étape B : produire le fichier

1. Choisis les points de vue (colonnes) et les éléments communs. **Même notion = même clé** partout.
2. Classe les éléments de chaque colonne d'après la source : rang 1 = ce que ce point de vue juge le plus
   important ou examine en premier.
3. Mets en bas de colonne ce qu'un point de vue laisse de côté, avec `state: muted` et un badge
   (`ignored`, `undervalued`), plutôt que de l'omettre. N'omets un élément que si le point de vue ne
   l'aborde vraiment pas : l'application affichera alors « absent de ce point de vue ».
4. Écris des détails courts (1 à 2 phrases) et **fidèles à la source**. N'invente ni citation, ni date, ni référence.
5. Utilise les états et badges **avec parcimonie** (§ 5).
6. Vérifie la liste de contrôle (§ 8), puis rends ta réponse au format du § 9.

Rédige dans la langue de la source (ou celle demandée) et indique-la dans `lang`. Les clés, les
identifiants, les noms d'attributs, d'états et de badges restent en minuscules sans accents.

---

## 3. Structure du fichier

```markdown
---
format: perspective-grid/v1
title: Titre de la grille
subtitle: Sous-titre facultatif
lang: fr
version: 1
based_on: null
updated: 2026-11-11
---

Introduction facultative (1 à 3 phrases) : ce que signifient les rangs dans cette grille.

# Elements

## [cle-element] Titre commun de l'élément
Description neutre en une phrase, valable pour tous les points de vue.

# Perspectives

## Titre du point de vue {#identifiant}
subtitle: Auteurs, époque ou contexte
> Une phrase : ce qui compte le plus pour ce point de vue.

Description détaillée (2 à 4 phrases), dépliable dans l'application.

### [cle-element]
state: primary
badges: central
Ce que cet élément signifie pour ce point de vue (1 à 2 phrases).

### [cle-propre] Élément propre à ce point de vue
Détail.
```

Règles de syntaxe :

- **En-tête** entre deux lignes `---` : `format`, `title`, `lang`, `version`, `based_on`, `updated` sont
  obligatoires. Mets des guillemets si une valeur contient `: ` ou ` #`.
- `# Elements` : le **catalogue** des éléments partagés. Chaque élément : `## [clé] Titre`, puis sa
  description (facultative).
- `# Perspectives` : les colonnes, dans l'ordre d'affichage.
  - Colonne : `## Titre {#identifiant}`, puis dans cet ordre (tout est facultatif) : la ligne `subtitle:`,
    une citation `>` (description courte), le reste (description détaillée).
  - Cellule : `### [clé]` ; l'**ordre des cellules est le rang**. Le titre après la clé est facultatif si
    la clé est dans le catalogue ; s'il est écrit, il remplace le titre commun pour cette colonne seulement.
  - Juste sous le titre de la cellule : les lignes `state:` et `badges:` (facultatives), puis le détail.
- Une clé n'apparaît **qu'une fois par colonne**. Un élément propre à une colonne s'écrit directement
  `### [clé] Titre`, sans entrée dans le catalogue.
- **Case vide** (pour aligner visuellement) : `### [-]`. Elle ne compte pas dans les rangs.
- Dans les détails : Markdown simple (gras, italique, listes, liens). **Jamais de titres `#`, `##` ou `###`**
  dans un détail.
- Clés et identifiants : minuscules, chiffres et tirets (`vie-privee`, `role-erreur`). Une clé désigne une
  **notion**, jamais une position (`erreur` ✓, `erreur-positive` ✗).

Option d'affichage : ajoute `columns: narrow` dans l'en-tête quand les cartes ne contiennent qu'un mot ou un
nom (colonnes étroites, deux par écran de téléphone).

---

## 4. Le classement

- Rang 1 = l'élément le plus important pour ce point de vue, ou celui qu'il examine en premier.
- Appuie chaque rang sur la source : affirmations explicites d'abord, puis insistance. Quand tu dois
  déduire, garde un classement grossier et signale-le dans l'introduction ou la description de la colonne.
- Vise au moins 60 % de cellules partagées par plusieurs colonnes : la comparaison est tout l'intérêt.
- 5 à 12 cellules par colonne, en général.

---

## 5. États et badges

**États** (`state:`) : une annotation visuelle de la cellule. À utiliser avec parcimonie : au plus 2 ou 3
cellules colorées par colonne, en plus des `muted`.

| État | Sens conseillé |
|---|---|
| `default` | Pas d'annotation (ne pas écrire la ligne). |
| `primary` | Mis en avant : idée-clé du point de vue (souvent le rang 1). |
| `success` | Valorisé, favorable. |
| `warning` | Nuancé, discuté. |
| `danger` | Rejeté, opposé. |
| `muted` | Secondaire, écarté (barré et estompé). |

**Badges** (`badges: a, b`) : qualifient la **relation** du point de vue à l'élément.

| Badge | Libellé affiché |
|---|---|
| `central` | central (en général une seule fois par colonne) |
| `accepted` | accepté |
| `overvalued` | surévalué |
| `undervalued` | sous-évalué |
| `contested` | contesté |
| `rejected` | rejeté |
| `ignored` | ignoré |
| `denied` | nié |
| `instrumentalized` | instrumentalisé |

Badges personnalisés : déclare-les dans l'en-tête, un par ligne indentée, `clé: icône | Libellé` (icône
Bootstrap Icons, par exemple `bank`, `bicycle`, `umbrella`, `globe-americas`) :

```yaml
badges:
  culture: bank | culture
  sport: bicycle | sport
```

---

## 6. Exemple complet (simple)

```markdown
---
format: perspective-grid/v1
title: Le voyage de fin d’année
subtitle: Quatre amis, une seule destination à choisir
lang: fr
version: 1
based_on: null
updated: 2026-11-11
columns: narrow
badges:
  exotisme: globe-americas | exotisme
  culture: bank | culture
  relax: umbrella | relax
  sport: bicycle | sport
---

Chaque colonne est le classement d’une personne, de sa destination préférée (rang 1) à la moins désirée. Les badges disent ce qui l’attire.

# Elements

## [grece] Grèce

## [islande] Islande

## [italie] Italie

## [japon] Japon

## [thailande] Thaïlande

# Perspectives

## Léa {#lea}
subtitle: Musées, ruines et bonne cuisine

### [italie]
state: primary
badges: culture

### [japon]
badges: culture, exotisme

### [grece]
badges: culture, relax

## Karim {#karim}
subtitle: Randonnée et grands espaces

### [islande]
state: primary
badges: sport

### [japon]
badges: exotisme

### [grece]
badges: relax

## Sofia {#sofia}
subtitle: Soleil, plage et farniente

### [thailande]
state: primary
badges: relax, exotisme

### [grece]
badges: relax

### [italie]
badges: culture

### [islande]
state: danger
badges: rejected
```

Exemples complets avec détails (courants pédagogiques, éthiques et IA) :
https://github.com/edu-fpar/perspective-grid/tree/main/examples

---

## 7. Extrait d'une grille de cours (avec détails)

```markdown
## Béhaviorisme {#behaviorisme}
subtitle: Watson, Thorndike, Skinner
> Apprendre, c’est modifier un comportement observable grâce à des renforcements.

Le béhaviorisme étudie les liens entre stimulus et réponse sans spéculer sur ce qui se passe « dans la tête ».

### [renforcement] Le renforcement
state: primary
badges: central
Une réponse suivie d’une conséquence agréable a plus de chances de se reproduire.

### [erreur]
state: danger
badges: rejected
L’erreur est à éviter : une réponse fausse risque d’être renforcée.

### [pairs]
state: muted
badges: ignored
Sans rôle théorique : l’apprentissage est conçu comme individuel.
```

---

## 8. Liste de contrôle

- [ ] En-tête complet, `format: perspective-grid/v1`.
- [ ] 3 à 8 colonnes, chacune avec `{#identifiant}` ; `subtitle:` et `>` quand la source le permet.
- [ ] Éléments partagés dans `# Elements` ; même notion = même clé dans toutes les colonnes.
- [ ] Une clé au plus une fois par colonne.
- [ ] Rangs justifiés par la source ; éléments écartés en bas, en `muted`.
- [ ] Au plus 2 ou 3 cellules colorées par colonne ; `central` au plus une fois par colonne.
- [ ] Détails courts et fidèles, sans titres `#` à `###`.
- [ ] Badges personnalisés déclarés dans l'en-tête.

---

## 9. Format de ta réponse

1. **Recommandation** (3 à 6 lignes) : grille pertinente ou non, points de vue et éléments retenus, ce
   que la grille fait voir, parties du classement déduites plutôt que lues dans la source.
2. **Le fichier**, dans un seul bloc de code ` ```markdown `, sans rien d'autre dedans.
3. **Pour l'enseignant·e** (2 à 4 lignes) : comment l'ouvrir (copier le bloc, puis dans l'application
   *Fichier › Coller du Markdown*, ou l'enregistrer en `.md` et le glisser sur la page) et 2 ou 3 questions
   de discussion pour la classe.

Si la grille n'est pas pertinente : explique pourquoi en deux phrases, propose le meilleur format, et ne
produis pas de fichier (sauf si l'enseignant·e insiste).

Si l'enseignant·e donne des consignes (nombre de colonnes, public, langue, ton), elles passent avant les
recommandations de cette page. Ne change jamais la **syntaxe**.

Spécification complète du format (en anglais) :
https://github.com/edu-fpar/perspective-grid/blob/main/docs/FORMAT.md
