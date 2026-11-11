---
format: perspective-grid/v1
title: Éthiques et intelligence artificielle
subtitle: Cinq traditions morales face aux mêmes enjeux
lang: fr
version: 1
based_on: null
updated: 2026-11-11
---

Chaque tradition éthique pose une question différente : quelles conséquences ? quels devoirs ? quel caractère ? quelles relations ? quels droits ? Les rangs indiquent ce que chaque approche examine **en premier** face à un système d’IA ; ils simplifient des débats internes à chaque courant.

# Elements

## [biais] Biais et discrimination
Des systèmes entraînés sur des données historiques peuvent reproduire ou amplifier des inégalités (recrutement, crédit, justice, santé).

## [transparence] Transparence et explicabilité
Pouvoir savoir qu’on interagit avec une IA, comprendre comment une décision a été produite et la contester.

## [vie-privee] Vie privée et données personnelles
Collecte massive de données, profilage, surveillance, réutilisation des données pour entraîner des modèles.

## [responsabilite] Responsabilité
Qui répond d’un dommage causé par un système d’IA : concepteur, fournisseur, utilisateur, institution ?

## [emploi] Travail et emploi
Automatisation de tâches, transformation des métiers, travail invisible d’annotation et de modération.

## [environnement] Environnement
Consommation d’énergie et d’eau, matériaux et déchets électroniques liés à l’entraînement et à l’usage des modèles.

## [manipulation] Manipulation et autonomie
Influence sur les opinions et les comportements : recommandation, persuasion personnalisée, contenus générés trompeurs.

## [gouvernance] Gouvernance et régulation
Règles, institutions et procédures qui encadrent la conception et l’usage de l’IA.

# Perspectives

## Utilitarisme {#utilitarisme}
subtitle: Bentham, Mill, Singer
> Une action est juste si elle produit le plus grand bien-être pour le plus grand nombre.

Approche conséquentialiste : on évalue un système d’IA à ses effets prévisibles, en additionnant bénéfices et dommages pour toutes les personnes concernées. Elle se prête aux analyses coûts-bénéfices et aux études d’impact, mais peut accepter qu’une minorité soit sacrifiée si le bilan global est positif.

### [bien-etre] Le bilan bénéfices / risques
state: primary
badges: central
La question première : les gains attendus (santé, productivité, accès au savoir) l’emportent-ils sur les dommages, une fois tous les effets additionnés ?

### [emploi]
state: success
Enjeu majeur, car les effets portent sur un très grand nombre de personnes : gains de productivité d’un côté, pertes d’emploi et précarité de l’autre.

### [environnement]
state: success
Coût collectif à intégrer au bilan, y compris pour les générations futures et, chez Singer, pour les êtres sensibles non humains.

### [biais]
state: warning
badges: undervalued
Les discriminations comptent comme des dommages à additionner. Risque souligné par les critiques : un système « globalement bénéfique » peut nuire durablement à une minorité.

### [manipulation]
Jugée à ses effets : une incitation qui améliore le bien-être (nudge de santé) peut être acceptable, une manipulation qui le dégrade ne l’est pas.

### [gouvernance]
Les règles sont justifiées si elles améliorent les résultats : évaluation des risques, proportionnalité, études d’impact.

### [transparence]
badges: instrumentalized
Valorisée comme moyen : elle aide à détecter les erreurs et à maintenir la confiance, mais n’est pas une exigence en soi.

### [vie-privee]
state: warning
badges: instrumentalized
Négociable : elle peut céder devant un bénéfice collectif important (santé publique, sécurité), ce que contestent les autres approches.

### [responsabilite]
Pensée comme un outil d’incitation : attribuer la responsabilité de façon à prévenir au mieux les dommages futurs.

## Déontologie {#deontologie}
subtitle: Kant, et ses héritiers contemporains
> Certaines actions sont obligatoires ou interdites, quelles qu’en soient les conséquences.

L’éthique du devoir juge l’action selon sa conformité à des principes universels. Chez Kant, toute personne doit être traitée comme une fin et jamais simplement comme un moyen. Appliquée à l’IA, elle fixe des limites qu’aucun bénéfice ne justifie de franchir.

### [dignite] La dignité de la personne
state: primary
badges: central
Ne jamais traiter une personne simplement comme un moyen : un être humain n’est pas une donnée, un score ou une variable d’optimisation.

### [manipulation]
state: danger
badges: rejected
Contourner la raison d’une personne pour orienter ses choix revient à la traiter comme un moyen : c’est interdit, même pour son bien.

### [transparence]
state: success
Condition du consentement éclairé : une personne doit savoir qu’elle interagit avec une IA et sur quelle base on décide à son sujet.

### [vie-privee]
state: success
Exigence liée à l’autonomie et au respect de la personne, qui ne se négocie pas contre un bénéfice collectif.

### [responsabilite]
state: success
Seules des personnes, capables de répondre de leurs actes, peuvent être responsables. Une machine ne peut pas porter la faute.

### [biais]
Traiter chacun selon des règles universalisables : une décision qui dépend de l’origine ou du genre viole l’égalité de respect.

### [gouvernance]
Des règles claires et des interdits fixés à l’avance, plutôt qu’une pesée au cas par cas.

### [emploi]
state: warning
badges: undervalued
Abordé par le respect dû aux travailleurs (ne pas les instrumentaliser), plus que par le volume d’emplois.

### [environnement]
state: muted
badges: undervalued
Chez Kant, les devoirs concernent d’abord les personnes ; les devoirs envers la nature sont indirects. Des auteurs contemporains élargissent ce cadre.

## Éthique de la vertu {#vertu}
subtitle: Aristote, MacIntyre, Vallor
> Agir bien, c’est agir comme le ferait une personne de bon caractère.

L’éthique de la vertu ne demande pas d’abord « quelle règle ? » ou « quel résultat ? », mais « qui devenons-nous ? ». Shannon Vallor propose des vertus « technomorales » (honnêteté, maîtrise de soi, humilité, justice, courage, empathie, sagesse pratique) pour vivre bien avec les technologies.

### [caractere] Les vertus et le caractère
state: primary
badges: central
Ce que l’usage de l’IA fait de nous : développe-t-il la sagesse pratique, la maîtrise de soi, l’honnêteté, ou les affaiblit-il ?

### [responsabilite]
state: success
La responsabilité est une disposition à cultiver chez les concepteurs comme chez les utilisateurs, pas seulement une règle d’attribution des fautes.

### [manipulation]
state: danger
badges: rejected
Les dispositifs qui captent l’attention et exploitent les faiblesses érodent la maîtrise de soi et la capacité de juger par soi-même.

### [transparence]
Prolongement de l’honnêteté : ne pas tromper, ne pas laisser croire qu’une machine comprend ou ressent.

### [emploi]
Le travail est un lieu où l’on exerce et développe ses compétences et ses vertus : déléguer à la machine peut entraîner une perte de savoir-faire, y compris moral.

### [biais]
La justice est une vertu : être attentif aux torts que l’on cause, même sans intention.

### [environnement]
La tempérance et la modération invitent à questionner les usages superflus.

### [vie-privee]
Respect et discrétion sont des qualités attendues de celui qui détient des informations sur autrui.

### [gouvernance]
state: warning
badges: undervalued
Centrée sur les personnes plus que sur les institutions, même si Aristote lie l’éthique à la politique et à l’éducation.

## Éthique du care {#care}
subtitle: Gilligan, Tronto
> Agir bien, c’est prendre soin des relations et des personnes vulnérables.

Née des travaux de Carol Gilligan (1982), l’éthique du care part des relations concrètes plutôt que de principes abstraits. Joan Tronto décrit le care comme tout ce que nous faisons pour maintenir et réparer notre monde. Face à l’IA, elle demande : qui est rendu vulnérable, et qui prend soin ?

### [vulnerabilite] L’attention aux personnes vulnérables
state: primary
badges: central
Partir des situations concrètes et des personnes les plus exposées : malades, personnes âgées, enfants, personnes précaires.

### [biais]
state: success
Les exclusions touchent d’abord les moins visibles : il faut écouter les personnes concernées pour les repérer.

### [emploi]
state: success
Rend visible le travail invisible (annotation, modération) et interroge l’automatisation des métiers du soin.

### [vie-privee]
La confidentialité protège la relation de confiance entre soignant et soigné, aidant et aidé.

### [manipulation]
state: danger
badges: rejected
Exploiter la solitude ou la dépendance affective (compagnons artificiels, par exemple) trahit la relation de soin.

### [environnement]
Prendre soin de « notre monde » inclut l’environnement (Tronto).

### [responsabilite]
Être responsable, c’est d’abord se sentir concerné et répondre aux besoins d’autrui, avant toute question de faute.

### [gouvernance]
Associer les personnes concernées aux décisions qui les touchent.

### [transparence]
state: warning
badges: contested
Utile, mais une information générale ne remplace pas l’attention au contexte et l’écoute des besoins particuliers.

## Droits humains {#droits-humains}
subtitle: DUDH (1948), Recommandation de l’UNESCO (2021)
> Toute utilisation de l’IA doit respecter des droits universels, opposables et protégés par le droit.

Cette approche s’appuie sur des textes juridiques : Déclaration universelle des droits de l’homme, conventions internationales, puis des textes propres à l’IA (Recommandation de l’UNESCO sur l’éthique de l’IA en 2021, règlement européen sur l’IA et convention-cadre du Conseil de l’Europe en 2024).

### [dignite]
state: primary
badges: central
« Tous les êtres humains naissent libres et égaux en dignité et en droits » (DUDH, art. 1) : le fondement de tous les autres droits.

### [biais]
state: primary
Le droit à la non-discrimination (DUDH, art. 2 et 7) s’applique pleinement aux décisions automatisées.

### [vie-privee]
state: success
Droit protégé (DUDH, art. 12) et encadré en Europe par le RGPD.

### [gouvernance]
state: success
Cœur de l’approche : des règles contraignantes, des autorités de contrôle et des sanctions (règlement européen sur l’IA, convention-cadre du Conseil de l’Europe).

### [transparence]
Condition pour exercer ses droits : être informé, comprendre une décision, pouvoir la contester.

### [responsabilite]
Droit à un recours effectif (DUDH, art. 8) : une personne lésée doit pouvoir identifier un responsable et obtenir réparation.

### [manipulation]
state: danger
badges: rejected
Atteinte à la liberté de pensée et d’opinion (DUDH, art. 18 et 19). Le règlement européen interdit certaines pratiques manipulatrices.

### [emploi]
Droit au travail et à des conditions justes (DUDH, art. 23), à protéger face à l’automatisation.

### [environnement]
state: warning
Droit plus récent : l’Assemblée générale des Nations unies a reconnu en 2022 le droit à un environnement propre, sain et durable.
