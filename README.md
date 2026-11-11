# Regards croisés (`perspective-grid`)

Outil pédagogique qui montre **comment plusieurs points de vue hiérarchisent différemment un même ensemble
d’éléments** : courants, théories, acteurs, époques, cultures… Chaque point de vue est une colonne ; ses
éléments sont classés du plus au moins important ; on compare les rangs, les absences et les positions
(central, rejeté, ignoré…).

Application web statique, 100 % côté navigateur, sans étape de build : même pile que `micro-learning-app`
(Bootstrap 5.3, Bootstrap Icons, marked, JavaScript sans framework, `localStorage`).

**▶ Essayer :** https://edu-fpar.github.io/perspective-grid/ &nbsp;·&nbsp; [Format de fichier](docs/FORMAT.md) &nbsp;·&nbsp; [Skills pour les IA](#skills-ia)

![Trois courants comparés : « La place de l’enseignant » est au rang 2, 3 et 5 selon le courant ; les autres éléments restent estompés (dévoilement progressif)](regards-croises-fr.png)

## Démarrer

**En ligne** : ouvrez le lien ci-dessus. Exemples directs :
[courants pédagogiques](https://edu-fpar.github.io/perspective-grid/?ex=courants-pedagogiques) ·
[éthiques et IA](https://edu-fpar.github.io/perspective-grid/?ex=ethiques-ia) ·
[éthiques et IA, à partir de zéro, élément par élément](https://edu-fpar.github.io/perspective-grid/?ex=ethiques-ia&stage=zero&spot=1&order=element).

**En local, avec Firefox** : ouvrez les outils de développement et ajoutez le dossier du projet : Firefox
sert alors les fichiers comme un serveur web. Rien à installer.

**En local, solution de secours** : n’importe quel serveur web statique, par exemple Python :

```bash
python -m http.server 8771 --bind 127.0.0.1
```

Puis ouvrir <http://127.0.0.1:8771/>. L’application fonctionne aussi depuis UwAmp/Apache ou tout hébergement
statique. Ouverte directement depuis le disque (`file://`), tout marche sauf le chargement d’un fichier en
ligne (`?src=`).

**Publier votre propre copie** : faites un fork du dépôt et activez GitHub Pages (branche `main`, dossier racine).

## Utilisation

| Je veux… | Comment |
|---|---|
| Comparer deux points de vue | Cocher « Comparer » sur 2 en-têtes (ou toucher l’en-tête), puis toucher un élément : rangs, écarts ↑↓, absences, lignes de liaison. |
| Comparer sur téléphone | Sélectionner 2 colonnes puis **Comparer** : vue compacte côte à côte. |
| Annoter en direct | Bouton d’état sur la cellule (6 états + badges) ou touches **1–6**. Tiroir **Badges** : glisser un badge sur une cellule, ou toucher un badge puis les cellules. |
| Déplacer une colonne | Flèches ← → de l’en-tête, poignée ✥ (glisser-déposer), ou **Alt+←/→**. |
| Modifier la grille | **Éditer** (touche E) : double-clic sur un texte, poignée pour réordonner (appui long sur mobile, **Alt+↑/↓** au clavier), **+** entre deux cellules, crayon pour le formulaire complet. |
| Charger un fichier | Fichier › Ouvrir, glisser un `.md` sur la page, ou coller du Markdown (Ctrl+V) : aperçu + avertissements avant remplacement. |
| Exporter | Fichier › Exporter : nouvelle version (`version` +1, `based_on`, `updated`), nouveau nom de fichier, l’original n’est jamais écrasé. |
| Revenir en arrière | Ctrl+Z dans la session ; Fichier › Historique pour les versions enregistrées (sauvegarde automatique avant chaque remplacement). |
| Partager | Fichier › Lien de partage : lien autonome (`#z=`, grille compressée dans l’URL) ou lien vers un fichier en ligne (`?src=`). |

### Présenter sans surcharger (menu **Présenter**)

| Mode | Effet |
|---|---|
| **À la une** | Une seule colonne active, les autres sont grisées (un clic sur une colonne grisée la met à la une). Dans la colonne, l’élément ouvert ressort et les autres s’estompent. |
| **Dévoilement progressif** | Les éléments restent flous et sans couleur d’état tant qu’on ne les a pas touchés. |
| **À partir de zéro** | Seuls le premier en-tête et la forme des cartes sont visibles ; on dévoile au clic ou avec **Suivant**. |

Le bouton **Suivant** suit l’ordre choisi : colonne par colonne, rang par rang (tous les n° 1, puis les n° 2…) ou élément par élément (un même élément apparaît dans toutes les colonnes à la fois ; « À la une » met alors cette « ligne » en valeur).
Télécommande de présentation : **Page suivante / Page précédente** (ou N / P). **Aperçu** affiche discrètement l’étape suivante ; la **fenêtre présentateur** (à mettre sur l’écran de l’ordinateur pendant que la grille est projetée) montre le déroulé complet, l’étape suivante avec ses notes (détails, états, badges) et pilote la projection. Ces modes ne modifient jamais le fichier.

### Paramètres d’URL

| Paramètre | Effet |
|---|---|
| `?src=https://…/grille.md` | Charge un fichier en ligne (même site, ou site autorisant CORS : GitHub « Raw »…). |
| `#z=…` | Grille complète compressée dans le lien (généré par l’application). |
| `?ex=courants-pedagogiques` / `?ex=ethiques-ia` | Ouvre un exemple. |
| `&cols=id1,id2` | Présélectionne des colonnes pour la comparaison. |
| `&compact=1` | Ouvre directement la vue comparaison compacte. |
| `&spot=1` | Ouvre en mode « À la une ». |
| `&stage=veil` / `&stage=zero` | Ouvre en dévoilement progressif / à partir de zéro. |
| `&order=column` / `rank` / `element` | Ordre du bouton « Suivant ». |

## Format de fichier

Spécification complète (en anglais, source unique de vérité pour l’application et les skills) :
[`docs/FORMAT.md`](docs/FORMAT.md).

```markdown
---
format: perspective-grid/v1
title: Les courants pédagogiques
lang: fr
version: 1
based_on: null
updated: 2026-11-11
---

# Elements

## [erreur] Le rôle de l’erreur
Description par défaut.

# Perspectives

## Béhaviorisme {#behaviorisme}
subtitle: Skinner, Watson
> Description courte.

### [renforcement] Le renforcement
state: primary
badges: central
Détail propre à ce point de vue.

### [erreur]
state: danger
badges: rejected
```

## Skills (IA)

| Skill | Rôle |
|---|---|
| [`skills/perspective-grid-detect`](skills/perspective-grid-detect/SKILL.md) | Repère dans un cours les passages où une grille est pertinente, et dit quand elle ne l’est pas. |
| [`skills/perspective-grid-format`](skills/perspective-grid-format/SKILL.md) | Produit un fichier conforme à `docs/FORMAT.md`, puis le valide avec le parseur. |

Pour les utiliser avec Claude Code, copier les deux dossiers dans `.claude/skills/` (projet) ou
`~/.claude/skills/` (utilisateur).

## Développement

```bash
npm test                      # tests du format (aller-retour Markdown ↔ modèle), Node 18+
node tools/validate.js f.md   # valider un fichier (--fix : réécrire en forme canonique)
node tools/build-samples.js   # régénérer js/core/samples.js après modification de examples/*.md
```

```
index.html            application (consultation + édition)
css/app.css           styles (mobile-first, thèmes jour/nuit, états accessibles)
js/core/format.js     parseur, sérialiseur, validateur (navigateur + Node)
js/core/pg.js         utilitaires, stockage sûr, liens compressés, Markdown nettoyé
js/core/i18n.js       tous les libellés de l’interface (fr, en)
js/core/samples.js    exemples intégrés (généré)
js/app/grid.js        rendu, comparaison, navigation clavier, colonnes
js/app/edit.js        mode édition, formulaires, glisser-déposer des cellules
js/app/io.js          import / aperçu, export versionné, partage, historique
js/app/stage.js       modes de présentation, fenêtre présentateur
js/app/app.js         état, sauvegarde auto, barre d’outils, réglages, badges
examples/             grilles d’exemple (.md)
docs/FORMAT.md        spécification du format
skills/               skills detect et format
tests/                tests node:test
tools/                validate.js, build-samples.js
```
