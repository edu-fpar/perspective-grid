/*!
 * Interface translations (fr default, en). All UI strings live here.
 * Add a language: PG.i18n.add('es', { ... }, 'Español'). Missing keys fall back to French.
 * DOM: data-i18n (text), data-i18n-html, data-i18n-title, data-i18n-aria (aria-label), data-i18n-placeholder.
 */
(function (PG) {
  'use strict';

  var dict = {};
  var NAMES = {};

  function add(lang, obj, name) {
    dict[lang] = dict[lang] || {};
    Object.keys(obj).forEach(function (k) { dict[lang][k] = obj[k]; });
    if (name) NAMES[lang] = name;
  }

  function lang() {
    var saved = PG.store.get('lang', null);
    if (saved && dict[saved]) return saved;
    var nav = (navigator.language || 'fr').slice(0, 2).toLowerCase();
    return dict[nav] ? nav : 'fr';
  }

  function t(key, vars) {
    var l = lang();
    var s = dict[l] && dict[l][key];
    if (s == null) s = dict.fr[key];
    if (s == null) return key;
    return vars ? String(s).replace(/\{(\w+)\}/g, function (m, k) { return vars[k] != null ? vars[k] : m; }) : s;
  }

  function apply(root) {
    root = root || document;
    document.documentElement.lang = lang();
    root.querySelectorAll('[data-i18n]').forEach(function (e) { e.textContent = t(e.getAttribute('data-i18n')); });
    root.querySelectorAll('[data-i18n-html]').forEach(function (e) { e.innerHTML = t(e.getAttribute('data-i18n-html')); });
    root.querySelectorAll('[data-i18n-title]').forEach(function (e) { e.title = t(e.getAttribute('data-i18n-title')); });
    root.querySelectorAll('[data-i18n-aria]').forEach(function (e) { e.setAttribute('aria-label', t(e.getAttribute('data-i18n-aria'))); });
    root.querySelectorAll('[data-i18n-placeholder]').forEach(function (e) { e.placeholder = t(e.getAttribute('data-i18n-placeholder')); });
  }

  PG.i18n = { add: add, t: t, lang: lang, apply: apply, names: NAMES, setLang: function (l) { PG.store.set('lang', l); } };

  /* =================================================================== FR */
  add('fr', {
    'c.ok': 'OK', 'c.cancel': 'Annuler', 'c.close': 'Fermer', 'c.save': 'Enregistrer', 'c.dateLocale': 'fr-FR',

    'a.brand': 'Regards croisés', 'a.skip': 'Aller à la grille', 'a.mainNav': 'Barre principale',
    'a.examples': 'Exemples', 'a.file': 'Fichier', 'a.load': 'Charger une grille',
    'a.openFile': 'Ouvrir un fichier .md…', 'a.pasteText': 'Coller du Markdown…', 'a.openUrl': 'Ouvrir depuis une adresse…',
    'a.export': 'Exporter en Markdown…', 'a.share': 'Lien de partage…', 'a.source': 'Voir / modifier le Markdown',
    'a.snapshot': 'Créer une version', 'a.history': 'Historique des versions',
    'a.edit': 'Éditer', 'a.editTitle': 'Mode édition : déplacer, ajouter, modifier (touche E)',
    'a.settings': 'Réglages d’affichage', 'a.theme': 'Thème', 'a.themeAuto': 'Auto', 'a.themeLight': 'Jour', 'a.themeDark': 'Nuit',
    'a.display': 'Affichage', 'a.prefPatterns': 'Motifs renforcés (hachures par état)', 'a.prefLinks': 'Lignes de liaison entre colonnes', 'a.prefRanks': 'Numéros de rang',
    'a.language': 'Langue de l’interface', 'a.formatDoc': 'Documentation', 'a.withAi': 'Créer une grille avec une IA…',
    'a.about': 'À propos', 'a.warnTitle': 'Avertissements de lecture', 'a.warnIntro': 'Le fichier a été chargé, mais certains passages ont été interprétés ou ignorés :',
    'a.warnClear': 'Compris', 'a.saved': 'Enregistré', 'a.editing': 'Modification…', 'a.storageFull': 'Stockage local plein : exportez votre grille',
    'a.new': 'Nouvelle grille', 'a.newTitle': 'Nouvelle grille', 'a.newColumn': 'Point de vue {n}',
    'a.confirmNew': 'Créer une grille vide ? La grille actuelle sera conservée dans l’historique.',
    'a.alreadyOpen': 'Cet exemple est déjà ouvert.', 'a.exampleLoaded': 'Exemple chargé : {title}', 'a.linkLoaded': 'Grille ouverte depuis le lien : {title}',
    'a.nothingToUndo': 'Rien à annuler.', 'a.undone': 'Modification annulée', 'a.redone': 'Modification rétablie',
    'a.editOn': 'Mode édition activé', 'a.editOff': 'Mode consultation', 'a.compactOn': 'Vue comparaison : seules les colonnes sélectionnées sont affichées',
    'a.compactOff': 'Toutes les colonnes sont affichées', 'a.selCleared': 'Sélection effacée',

    't.aria': 'Comparaison', 't.selNone': 'Sélectionnez au moins 2 points de vue pour comparer', 't.selOne': 'Sélectionnez un 2ᵉ point de vue',
    't.selNoneShort': 'Choisissez 2 colonnes', 't.selOneShort': 'Encore 1 colonne', 't.selN': '{n} points de vue comparés : touchez un élément',
    't.all': 'Tout', 't.clear': 'Effacer', 't.compact': 'Comparer', 't.compactTitle': 'Afficher seulement les colonnes sélectionnées, en vue compacte',

    'g.aria': 'Grille des points de vue', 'g.cellsAria': 'Éléments classés par {title}', 'g.compare': 'Comparer', 'g.selected': 'Sélectionnée',
    'g.selectHint': 'Sélectionner cette colonne pour la comparer', 'g.selectAria': 'Comparer « {title} »',
    'g.moveLeft': 'Déplacer « {title} » vers la gauche', 'g.moveRight': 'Déplacer « {title} » vers la droite',
    'g.moveLeftShort': 'Déplacer à gauche', 'g.moveRightShort': 'Déplacer à droite', 'g.dragCol': 'Glisser pour déplacer la colonne',
    'g.colMenu': 'Actions sur « {title} »', 'g.colMenuShort': 'Actions sur la colonne', 'g.selectForCompare': 'Sélectionner pour comparer', 'g.unselect': 'Retirer de la comparaison',
    'g.moreDetail': 'En savoir plus', 'g.lessDetail': 'Réduire',
    'g.rankSr': 'Rang {n}', 'g.stateSr': 'état : {state}', 'g.badgesSr': 'badges : {list}',
    'g.stateBtn': 'État : {state} — changer (1 à 6)', 'g.stateBtnAria': 'État de « {title} » : {state}. Changer l’état ou les badges',
    'g.stateHeader': 'État', 'g.cellMenuAria': 'État et badges de la cellule', 'g.defaultDesc': 'Description générale de l’élément',
    'g.reference': 'Référence · rang {n}', 'g.rankGap': 'rang {from} → rang {to}', 'g.sameRank': 'même rang ({n})',
    'g.absent': '{title} est absent de ce point de vue',
    'g.srCompare': '{title} : {list}.', 'g.srRank': 'rang {n} pour {col}', 'g.srAbsent': 'absent de {col}',
    'g.srSame': 'même rang', 'g.srLower': '{n} rang(s) plus bas', 'g.srHigher': '{n} rang(s) plus haut',
    'g.srSelected': '{title} sélectionné. {n} colonne(s) sélectionnée(s).', 'g.srUnselected': '{title} retiré. {n} colonne(s) sélectionnée(s).',
    'g.srStateSet': '{title} : état {state}', 'g.srColMoved': '{title} déplacé en position {n} sur {total}',
    'g.empty': 'Cette grille ne contient encore aucun point de vue.', 'g.emptyEdit': 'Ajouter des points de vue',

    'state.default': 'Sans état', 'state.primary': 'Mis en avant', 'state.success': 'Valorisé', 'state.warning': 'Nuancé, discuté',
    'state.danger': 'Rejeté, opposé', 'state.muted': 'Secondaire, écarté',

    'badge.central': 'central', 'badge.accepted': 'accepté', 'badge.overvalued': 'surévalué', 'badge.undervalued': 'sous-évalué',
    'badge.contested': 'contesté', 'badge.rejected': 'rejeté', 'badge.ignored': 'ignoré', 'badge.denied': 'nié', 'badge.instrumentalized': 'instrumentalisé',
    'b.header': 'Badges', 'b.drawer': 'Badges', 'b.drawerTitle': 'Tiroir de badges', 'b.badgeAria': 'Badge : {label}',
    'b.helpMouse': 'Glissez un badge sur une cellule, ou cliquez sur un badge puis sur les cellules à annoter.',
    'b.helpTouch': 'Touchez un badge, puis touchez les cellules à annoter. Vous pouvez aussi passer par le bouton d’état d’une cellule.',
    'b.customHelp': 'D’autres badges peuvent être déclarés dans l’en-tête du fichier (badges:).',
    'b.armed': 'Touchez les cellules pour ajouter ou retirer {badge}', 'b.disarm': 'Terminer', 'b.already': 'Ce badge est déjà sur la cellule.',
    'b.srArmed': 'Badge {label} prêt : touchez les cellules à annoter', 'b.srAdded': 'Badge {label} ajouté à {title}', 'b.srRemoved': 'Badge {label} retiré de {title}',

    'e.mode': 'Mode édition', 'e.barAria': 'Outils d’édition', 'e.hint': 'Double-clic sur un texte pour le modifier · poignée pour déplacer · + pour ajouter',
    'e.done': 'Terminer', 'e.undo': 'Annuler', 'e.redo': 'Rétablir', 'e.undoTitle': 'Annuler (Ctrl+Z)', 'e.redoTitle': 'Rétablir (Ctrl+Y)',
    'e.docProps': 'Titre et présentation', 'e.addColumn': 'Ajouter un point de vue', 'e.editColumn': 'Modifier le point de vue', 'e.newColumn': 'Nouveau point de vue',
    'e.addCell': 'Ajouter un élément', 'e.addCellAt': 'Ajouter un élément en position {n}', 'e.addSpacer': 'Ajouter une case vide (alignement)',
    'e.editCell': 'Modifier', 'e.editCellAria': 'Modifier « {title} »', 'e.deleteCell': 'Supprimer', 'e.moveUp': 'Monter', 'e.moveDown': 'Descendre',
    'e.duplicateColumn': 'Dupliquer la colonne', 'e.deleteColumn': 'Supprimer la colonne', 'e.copyOf': '{title} (copie)',
    'e.drag': 'Glisser pour déplacer (ou Alt+↑/↓)', 'e.spacer': 'Case vide', 'e.spacerMenu': 'Actions sur la case vide',
    'e.inlineAria': 'Modifier le texte (Entrée pour valider, Échap pour annuler)', 'e.saved': 'Modification enregistrée',
    'e.newCellIn': 'Nouvel élément dans « {title} » (position {n})', 'e.editCellIn': 'Élément de « {title} »',
    'e.title': 'Titre', 'e.titlePh': 'ex. Le rôle de l’erreur', 'e.titleHelp': 'Laisser vide pour utiliser le titre commun : « {title} ».',
    'e.key': 'Clé (identifiant commun)', 'e.keyAuto': 'Générée à partir du titre. Choisissez une clé existante pour relier cet élément aux autres colonnes.',
    'e.keyNew': 'Nouvel élément : il pourra être réutilisé dans d’autres colonnes.', 'e.keyCatalog': 'Élément du catalogue.',
    'e.keyShared': 'Même élément que dans : {list}.', 'e.keyDup': 'Cette clé est déjà utilisée dans cette colonne.', 'e.alreadyInColumn': 'déjà dans cette colonne',
    'e.badKey': 'Clé invalide.', 'e.needTitle': 'Indiquez un titre.', 'e.state': 'État', 'e.detail': 'Détail pour ce point de vue', 'e.detailPh': 'Ce que cet élément signifie pour ce point de vue…',
    'e.mdHelp': 'Markdown accepté : **gras**, *italique*, listes, liens.', 'e.catalog': 'Élément commun (partagé par toutes les colonnes)',
    'e.catalogHelp': 'Ce titre et cette description s’appliquent partout où l’élément n’a pas de texte propre.',
    'e.catalogTitle': 'Titre commun', 'e.catalogDetail': 'Description générale', 'e.add': 'Ajouter', 'e.cellAdded': 'Élément ajouté', 'e.columnAdded': 'Point de vue ajouté',
    'e.colTitle': 'Titre', 'e.colId': 'Identifiant', 'e.auto': 'automatique', 'e.colSubtitle': 'Sous-titre', 'e.colSubtitlePh': 'ex. auteurs, époque',
    'e.colSummary': 'Description courte (en-tête)', 'e.colDetail': 'Description détaillée (dépliable)',
    'e.docTitle': 'Titre de la grille', 'e.docSubtitle': 'Sous-titre', 'e.docLang': 'Langue', 'e.docIntro': 'Présentation (bouton « À propos »)',
    'e.docAuthor': 'Auteur·e', 'e.docSource': 'Source', 'e.docVersion': 'Version {v} · basée sur : {based} · mise à jour : {updated}',
    'e.confirmDeleteCell': 'Supprimer « {title} » de « {col} » ?', 'e.confirmDeleteColumn': 'Supprimer le point de vue « {title} » et ses {n} cellules ?',
    'e.cellDeleted': '« {title} » supprimé.', 'e.columnDeleted': '« {title} » supprimé.',
    'e.srMoved': '{title} : rang {n} sur {total}',

    'k.title': 'Raccourcis clavier', 'k.enter': 'Entrée / Espace', 'k.esc': 'Échap', 'k.nav': 'Se déplacer entre les cellules (même élément dans la colonne voisine)', 'k.toggle': 'Déplier le détail et comparer',
    'k.states': 'Changer l’état de la cellule', 'k.menu': 'Menu état et badges', 'k.escape': 'Arrêter la comparaison, fermer un menu',
    'k.moveCol': 'Déplacer la colonne', 'k.edit': 'Activer / quitter le mode édition', 'k.moveCell': 'Monter / descendre la cellule (mode édition)',
    'k.editCell': 'Modifier la cellule (mode édition)', 'k.del': 'Suppr', 'k.deleteCell': 'Supprimer la cellule (mode édition)', 'k.undo': 'Annuler / rétablir',
    'k.snapshot': 'Créer une version', 'k.help': 'Afficher cette aide', 'k.note': 'États : 1 sans état · 2 mis en avant · 3 valorisé · 4 nuancé · 5 rejeté · 6 secondaire.',

    'h.title': 'Historique des versions', 'h.intro': 'Versions enregistrées dans ce navigateur. Une sauvegarde automatique est faite avant chaque remplacement de la grille.',
    'h.empty': 'Aucune version pour le moment.', 'h.emptyHint': 'Fichier › Créer une version, ou Ctrl+S.', 'h.auto': 'Sauvegarde automatique',
    'h.stats': '{p} colonnes · {c} cellules', 'h.identical': 'Identique à la grille ouverte', 'h.diff': '{add} / {del} lignes par rapport à la grille ouverte',
    'h.restore': 'Restaurer', 'h.rename': 'Renommer', 'h.download': 'Télécharger', 'h.delete': 'Supprimer',
    'h.confirmRestore': 'Restaurer « {label} » ? La grille actuelle sera d’abord sauvegardée.', 'h.restored': 'Version restaurée.',
    'h.renamePrompt': 'Nouveau nom de la version :', 'h.confirmDelete': 'Supprimer définitivement la version « {label} » ?',
    'h.snapTitle': 'Créer une version', 'h.snapPrompt': 'Nom de cette version :', 'h.snapDefault': 'Version du {date}', 'h.saved': 'Version « {label} » enregistrée.',
    'h.full': 'Stockage local plein : supprimez des versions ou exportez la grille.', 'h.unnamed': 'Version sans nom',
    'h.beforeRestore': 'Avant restauration de « {label} »', 'h.beforeImport': 'Avant import de {name}', 'h.beforeExample': 'Avant l’exemple « {title} »',
    'h.beforeNew': 'Avant nouvelle grille', 'h.beforeLink': 'Avant ouverture d’un lien', 'h.exported': 'Export v{v}',

    'i.title': 'Charger une grille', 'i.tab.file': 'Fichier', 'i.tab.paste': 'Coller', 'i.tab.url': 'Adresse',
    'i.drop': 'Glissez-déposez un fichier <strong>.md</strong> ici ou <u>parcourez</u>', 'i.dropRelease': 'Déposez le fichier pour le prévisualiser',
    'i.pasteLabel': 'Markdown à importer', 'i.pastePh': 'Collez ici le Markdown d’une grille (format perspective-grid/v1)…',
    'i.urlLabel': 'Adresse d’un fichier .md en ligne', 'i.urlHelp': 'Le site doit autoriser la lecture depuis une autre page (CORS), comme GitHub (lien « Raw »).',
    'i.fetch': 'Charger', 'i.loading': 'Chargement…', 'i.apply': 'Remplacer la grille actuelle', 'i.applySource': 'Appliquer les modifications',
    'i.stats': '{p} points de vue · {c} cellules · {e} éléments, dont {sh} présents dans plusieurs colonnes.',
    'i.warnings': '{n} avertissement(s) de lecture', 'i.noWarning': 'Fichier lu sans avertissement.', 'i.line': 'Ligne {n} :',
    'i.miniAria': 'Aperçu de la grille', 'i.nothing': 'Aucun point de vue trouvé : vérifiez le format (« # Perspectives » puis « ## Titre {#id} »).',
    'i.badFile': 'Ce fichier n’est pas un fichier texte ou Markdown (.md).', 'i.pasted': 'texte collé',
    'i.loaded': 'Grille chargée : {title}', 'i.sourceApplied': 'Markdown appliqué.',
    'i.errTitle': 'Impossible d’ouvrir cette grille', 'i.errShowing': 'Votre dernière grille est affichée à la place.',
    'i.errFetch': 'Le fichier n’a pas pu être chargé ({detail}).', 'i.errCors': 'Le site qui héberge ce fichier refuse peut-être qu’on le lise depuis une autre page (CORS).',
    'i.errFile': 'Cette page doit être ouverte depuis un serveur web (http://…) pour charger un fichier en ligne.',
    'i.errLink': 'Ce lien est incomplet ou abîmé. Demandez à la personne qui l’a partagé de le copier à nouveau.',
    'i.errUnsupported': 'Ce navigateur ne sait pas lire ce lien compressé. Essayez une version récente de Chrome, Edge, Firefox ou Safari.',
    'i.errExample': 'Exemple inconnu : « {id} ».',

    'x.title': 'Exporter en Markdown', 'x.intro': 'Le fichier exporté est une nouvelle version : l’original n’est jamais écrasé.',
    'x.version': 'Version', 'x.basedOn': 'Basée sur', 'x.updated': 'Date', 'x.file': 'Nom du fichier',
    'x.adopt': 'Continuer à travailler sur cette nouvelle version (et l’ajouter à l’historique)', 'x.preview': 'Aperçu du Markdown',
    'x.copy': 'Copier', 'x.download': 'Télécharger', 'x.copied': 'Markdown copié dans le presse-papiers.', 'x.copyFailed': 'La copie a échoué : sélectionnez le texte et copiez-le.',
    'x.done': '{file} téléchargé.',

    's.title': 'Partager la grille', 's.withSelection': 'Ouvrir le lien avec les {n} colonnes sélectionnées (et la vue actuelle)',
    's.noSelection': 'Sélectionnez au moins 2 colonnes pour ouvrir le lien directement en comparaison',
    's.embedTitle': 'Lien autonome', 's.embedIntro': 'La grille entière est compressée dans le lien : rien n’est envoyé à un serveur. Idéal pour un QR code ou un message, tant que la grille reste courte.',
    's.srcTitle': 'Lien vers un fichier en ligne', 's.srcIntro': 'Déposez le fichier .md sur un site public (GitHub, ENT, serveur de l’établissement) et collez son adresse : le lien affichera toujours la dernière version du fichier.',
    's.srcLabel': 'Adresse du fichier .md', 's.copy': 'Copier le lien', 's.open': 'Ouvrir', 's.copied': 'Lien copié.',
    's.length': 'Longueur : {n} caractères.', 's.long': 'Lien très long : certaines messageries le couperont. Préférez un lien vers un fichier en ligne.',
    's.unsupported': 'Ce navigateur ne sait pas compresser les liens.',

    'w.no-front-matter': 'Pas d’en-tête (--- … ---) en haut du fichier.', 'w.unclosed-front-matter': 'L’en-tête n’est pas fermé par une ligne « --- ».',
    'w.bad-front-matter-line': 'Ligne d’en-tête illisible : « {text} ».', 'w.bad-badge-definition': 'Définition de badge illisible : « {text} » (attendu « clé: icône | Libellé »).',
    'w.unknown-format': 'Format « {value} » inconnu (attendu : perspective-grid/v1).', 'w.bad-version': 'La version « {value} » n’est pas un nombre entier : 1 est utilisé.',
    'w.no-title': 'La grille n’a pas de titre.', 'w.no-perspectives': 'Aucun point de vue trouvé (« # Perspectives » puis « ## Titre {#id} »).',
    'w.unknown-section': 'Section inconnue « # {title} » : son contenu est ignoré.', 'w.heading-before-section': 'Titre « {title} » hors des sections « # Elements » / « # Perspectives » : ignoré.',
    'w.ignored-text': 'Texte en dehors de tout élément, point de vue ou cellule : ignoré.', 'w.element-no-key': 'L’élément « {title} » n’a pas de [clé] : « {key} » est utilisée.',
    'w.element-no-title': 'L’élément [{key}] n’a pas de titre.', 'w.duplicate-element': 'L’élément [{key}] est défini deux fois : la seconde définition est ignorée.',
    'w.bad-key': 'Clé invalide « {key} ».', 'w.duplicate-perspective': 'L’identifiant « {id} » est utilisé deux fois : renommé « {next} ».',
    'w.cell-outside-perspective': 'Cellule placée avant tout point de vue : ignorée.', 'w.cell-no-key': 'La cellule « {title} » n’a pas de [clé] : « {key} » est utilisée.',
    'w.spacer-content-ignored': 'Une case vide [-] ne peut pas avoir de titre ni de détail : ils sont ignorés.',
    'w.unknown-state': 'État « {value} » inconnu (possibles : {allowed}) : « default » est utilisé.',
    'w.unknown-badge': 'Badge « {value} » inconnu : déclarez-le dans l’en-tête (badges:) pour lui donner une icône et un libellé.',
    'w.duplicate-in-column': 'La clé [{key}] apparaît deux fois dans « {perspective} » : la comparaison utilise la première.',
    'w.unknown-key': 'La clé [{key}] n’est pas dans le catalogue et la cellule n’a pas de titre : un élément a été créé.',
    'w.unknown-columns': 'Largeur de colonnes « {value} » inconnue (possibles : {allowed}) : la largeur normale est utilisée.',
    'e.docColumns': 'Largeur des colonnes', 'e.docColumnsHelp': 'Étroites : pour des cartes très courtes (un mot, un nom).',
    'e.cols.narrow': 'Étroites', 'e.cols.normal': 'Normales', 'e.cols.wide': 'Larges'
  }, 'Français');

  /* =================================================================== EN */
  add('en', {
    'c.ok': 'OK', 'c.cancel': 'Cancel', 'c.close': 'Close', 'c.save': 'Save', 'c.dateLocale': 'en-GB',

    'a.brand': 'Perspective Grid', 'a.skip': 'Skip to the grid', 'a.mainNav': 'Main bar',
    'a.examples': 'Examples', 'a.file': 'File', 'a.load': 'Load a grid',
    'a.openFile': 'Open a .md file…', 'a.pasteText': 'Paste Markdown…', 'a.openUrl': 'Open from an address…',
    'a.export': 'Export as Markdown…', 'a.share': 'Share link…', 'a.source': 'View / edit the Markdown',
    'a.snapshot': 'Save a version', 'a.history': 'Version history',
    'a.edit': 'Edit', 'a.editTitle': 'Edit mode: move, add, modify (E key)',
    'a.settings': 'Display settings', 'a.theme': 'Theme', 'a.themeAuto': 'Auto', 'a.themeLight': 'Light', 'a.themeDark': 'Dark',
    'a.display': 'Display', 'a.prefPatterns': 'Reinforced patterns (hatching per state)', 'a.prefLinks': 'Link lines between columns', 'a.prefRanks': 'Rank numbers',
    'a.language': 'Interface language', 'a.formatDoc': 'Documentation', 'a.withAi': 'Build a grid with an AI…',
    'a.about': 'About', 'a.warnTitle': 'Reading warnings', 'a.warnIntro': 'The file was loaded, but some passages were interpreted or ignored:',
    'a.warnClear': 'Got it', 'a.saved': 'Saved', 'a.editing': 'Editing…', 'a.storageFull': 'Local storage full: export your grid',
    'a.new': 'New grid', 'a.newTitle': 'New grid', 'a.newColumn': 'Perspective {n}',
    'a.confirmNew': 'Create an empty grid? The current grid will be kept in the history.',
    'a.alreadyOpen': 'This example is already open.', 'a.exampleLoaded': 'Example loaded: {title}', 'a.linkLoaded': 'Grid opened from the link: {title}',
    'a.nothingToUndo': 'Nothing to undo.', 'a.undone': 'Change undone', 'a.redone': 'Change redone',
    'a.editOn': 'Edit mode on', 'a.editOff': 'View mode', 'a.compactOn': 'Comparison view: only the selected columns are shown',
    'a.compactOff': 'All columns are shown', 'a.selCleared': 'Selection cleared',

    't.aria': 'Comparison', 't.selNone': 'Select at least 2 perspectives to compare', 't.selOne': 'Select a 2nd perspective',
    't.selNoneShort': 'Pick 2 columns', 't.selOneShort': '1 more column', 't.selN': '{n} perspectives compared: tap an element',
    't.all': 'All', 't.clear': 'Clear', 't.compact': 'Compare', 't.compactTitle': 'Show only the selected columns, in a compact view',

    'g.aria': 'Perspective grid', 'g.cellsAria': 'Elements ranked by {title}', 'g.compare': 'Compare', 'g.selected': 'Selected',
    'g.selectHint': 'Select this column to compare it', 'g.selectAria': 'Compare “{title}”',
    'g.moveLeft': 'Move “{title}” left', 'g.moveRight': 'Move “{title}” right',
    'g.moveLeftShort': 'Move left', 'g.moveRightShort': 'Move right', 'g.dragCol': 'Drag to move the column',
    'g.colMenu': 'Actions on “{title}”', 'g.colMenuShort': 'Column actions', 'g.selectForCompare': 'Select to compare', 'g.unselect': 'Remove from comparison',
    'g.moreDetail': 'Read more', 'g.lessDetail': 'Show less',
    'g.rankSr': 'Rank {n}', 'g.stateSr': 'state: {state}', 'g.badgesSr': 'badges: {list}',
    'g.stateBtn': 'State: {state} — change (1 to 6)', 'g.stateBtnAria': 'State of “{title}”: {state}. Change the state or badges',
    'g.stateHeader': 'State', 'g.cellMenuAria': 'Cell state and badges', 'g.defaultDesc': 'General description of the element',
    'g.reference': 'Reference · rank {n}', 'g.rankGap': 'rank {from} → rank {to}', 'g.sameRank': 'same rank ({n})',
    'g.absent': '{title} is absent from this perspective',
    'g.srCompare': '{title}: {list}.', 'g.srRank': 'rank {n} for {col}', 'g.srAbsent': 'absent from {col}',
    'g.srSame': 'same rank', 'g.srLower': '{n} rank(s) lower', 'g.srHigher': '{n} rank(s) higher',
    'g.srSelected': '{title} selected. {n} column(s) selected.', 'g.srUnselected': '{title} removed. {n} column(s) selected.',
    'g.srStateSet': '{title}: state {state}', 'g.srColMoved': '{title} moved to position {n} of {total}',
    'g.empty': 'This grid has no perspective yet.', 'g.emptyEdit': 'Add perspectives',

    'state.default': 'No state', 'state.primary': 'Highlighted', 'state.success': 'Valued', 'state.warning': 'Nuanced, debated',
    'state.danger': 'Rejected, opposed', 'state.muted': 'Secondary, set aside',

    'badge.central': 'central', 'badge.accepted': 'accepted', 'badge.overvalued': 'overvalued', 'badge.undervalued': 'undervalued',
    'badge.contested': 'contested', 'badge.rejected': 'rejected', 'badge.ignored': 'ignored', 'badge.denied': 'denied', 'badge.instrumentalized': 'instrumentalized',
    'b.header': 'Badges', 'b.drawer': 'Badges', 'b.drawerTitle': 'Badge drawer', 'b.badgeAria': 'Badge: {label}',
    'b.helpMouse': 'Drag a badge onto a cell, or click a badge then the cells to annotate.',
    'b.helpTouch': 'Tap a badge, then tap the cells to annotate. You can also use a cell’s state button.',
    'b.customHelp': 'More badges can be declared in the file header (badges:).',
    'b.armed': 'Tap cells to add or remove {badge}', 'b.disarm': 'Done', 'b.already': 'This badge is already on the cell.',
    'b.srArmed': 'Badge {label} ready: tap the cells to annotate', 'b.srAdded': 'Badge {label} added to {title}', 'b.srRemoved': 'Badge {label} removed from {title}',

    'e.mode': 'Edit mode', 'e.barAria': 'Editing tools', 'e.hint': 'Double-click a text to edit it · handle to move · + to add',
    'e.done': 'Done', 'e.undo': 'Undo', 'e.redo': 'Redo', 'e.undoTitle': 'Undo (Ctrl+Z)', 'e.redoTitle': 'Redo (Ctrl+Y)',
    'e.docProps': 'Title and introduction', 'e.addColumn': 'Add a perspective', 'e.editColumn': 'Edit the perspective', 'e.newColumn': 'New perspective',
    'e.addCell': 'Add an element', 'e.addCellAt': 'Add an element at position {n}', 'e.addSpacer': 'Add an empty slot (alignment)',
    'e.editCell': 'Edit', 'e.editCellAria': 'Edit “{title}”', 'e.deleteCell': 'Delete', 'e.moveUp': 'Move up', 'e.moveDown': 'Move down',
    'e.duplicateColumn': 'Duplicate the column', 'e.deleteColumn': 'Delete the column', 'e.copyOf': '{title} (copy)',
    'e.drag': 'Drag to move (or Alt+↑/↓)', 'e.spacer': 'Empty slot', 'e.spacerMenu': 'Empty slot actions',
    'e.inlineAria': 'Edit the text (Enter to confirm, Escape to cancel)', 'e.saved': 'Change saved',
    'e.newCellIn': 'New element in “{title}” (position {n})', 'e.editCellIn': 'Element of “{title}”',
    'e.title': 'Title', 'e.titlePh': 'e.g. The role of error', 'e.titleHelp': 'Leave empty to use the shared title: “{title}”.',
    'e.key': 'Key (shared identifier)', 'e.keyAuto': 'Generated from the title. Pick an existing key to link this element to other columns.',
    'e.keyNew': 'New element: it can be reused in other columns.', 'e.keyCatalog': 'Catalog element.',
    'e.keyShared': 'Same element as in: {list}.', 'e.keyDup': 'This key is already used in this column.', 'e.alreadyInColumn': 'already in this column',
    'e.badKey': 'Invalid key.', 'e.needTitle': 'Enter a title.', 'e.state': 'State', 'e.detail': 'Detail for this perspective', 'e.detailPh': 'What this element means for this perspective…',
    'e.mdHelp': 'Markdown accepted: **bold**, *italic*, lists, links.', 'e.catalog': 'Shared element (common to all columns)',
    'e.catalogHelp': 'This title and description apply wherever the element has no text of its own.',
    'e.catalogTitle': 'Shared title', 'e.catalogDetail': 'General description', 'e.add': 'Add', 'e.cellAdded': 'Element added', 'e.columnAdded': 'Perspective added',
    'e.colTitle': 'Title', 'e.colId': 'Identifier', 'e.auto': 'automatic', 'e.colSubtitle': 'Subtitle', 'e.colSubtitlePh': 'e.g. authors, period',
    'e.colSummary': 'Short description (header)', 'e.colDetail': 'Detailed description (collapsible)',
    'e.docTitle': 'Grid title', 'e.docSubtitle': 'Subtitle', 'e.docLang': 'Language', 'e.docIntro': 'Introduction (“About” button)',
    'e.docAuthor': 'Author', 'e.docSource': 'Source', 'e.docVersion': 'Version {v} · based on: {based} · updated: {updated}',
    'e.confirmDeleteCell': 'Delete “{title}” from “{col}”?', 'e.confirmDeleteColumn': 'Delete the perspective “{title}” and its {n} cells?',
    'e.cellDeleted': '“{title}” deleted.', 'e.columnDeleted': '“{title}” deleted.',
    'e.srMoved': '{title}: rank {n} of {total}',

    'k.title': 'Keyboard shortcuts', 'k.enter': 'Enter / Space', 'k.esc': 'Esc', 'k.nav': 'Move between cells (same element in the next column)', 'k.toggle': 'Expand the detail and compare',
    'k.states': 'Change the cell state', 'k.menu': 'State and badges menu', 'k.escape': 'Stop comparing, close a menu',
    'k.moveCol': 'Move the column', 'k.edit': 'Enter / leave edit mode', 'k.moveCell': 'Move the cell up / down (edit mode)',
    'k.editCell': 'Edit the cell (edit mode)', 'k.del': 'Del', 'k.deleteCell': 'Delete the cell (edit mode)', 'k.undo': 'Undo / redo',
    'k.snapshot': 'Save a version', 'k.help': 'Show this help', 'k.note': 'States: 1 none · 2 highlighted · 3 valued · 4 nuanced · 5 rejected · 6 secondary.',

    'h.title': 'Version history', 'h.intro': 'Versions saved in this browser. An automatic backup is made before the grid is replaced.',
    'h.empty': 'No version yet.', 'h.emptyHint': 'File › Save a version, or Ctrl+S.', 'h.auto': 'Automatic backup',
    'h.stats': '{p} columns · {c} cells', 'h.identical': 'Same as the open grid', 'h.diff': '{add} / {del} lines compared with the open grid',
    'h.restore': 'Restore', 'h.rename': 'Rename', 'h.download': 'Download', 'h.delete': 'Delete',
    'h.confirmRestore': 'Restore “{label}”? The current grid will be backed up first.', 'h.restored': 'Version restored.',
    'h.renamePrompt': 'New name for the version:', 'h.confirmDelete': 'Permanently delete the version “{label}”?',
    'h.snapTitle': 'Save a version', 'h.snapPrompt': 'Name of this version:', 'h.snapDefault': 'Version of {date}', 'h.saved': 'Version “{label}” saved.',
    'h.full': 'Local storage full: delete versions or export the grid.', 'h.unnamed': 'Unnamed version',
    'h.beforeRestore': 'Before restoring “{label}”', 'h.beforeImport': 'Before importing {name}', 'h.beforeExample': 'Before the example “{title}”',
    'h.beforeNew': 'Before new grid', 'h.beforeLink': 'Before opening a link', 'h.exported': 'Export v{v}',

    'i.title': 'Load a grid', 'i.tab.file': 'File', 'i.tab.paste': 'Paste', 'i.tab.url': 'Address',
    'i.drop': 'Drag and drop a <strong>.md</strong> file here or <u>browse</u>', 'i.dropRelease': 'Drop the file to preview it',
    'i.pasteLabel': 'Markdown to import', 'i.pastePh': 'Paste the Markdown of a grid here (perspective-grid/v1 format)…',
    'i.urlLabel': 'Address of an online .md file', 'i.urlHelp': 'The site must allow other pages to read it (CORS), like GitHub (“Raw” link).',
    'i.fetch': 'Load', 'i.loading': 'Loading…', 'i.apply': 'Replace the current grid', 'i.applySource': 'Apply changes',
    'i.stats': '{p} perspectives · {c} cells · {e} elements, {sh} of them in several columns.',
    'i.warnings': '{n} reading warning(s)', 'i.noWarning': 'File read without warnings.', 'i.line': 'Line {n}:',
    'i.miniAria': 'Grid preview', 'i.nothing': 'No perspective found: check the format (“# Perspectives” then “## Title {#id}”).',
    'i.badFile': 'This file is not a text or Markdown file (.md).', 'i.pasted': 'pasted text',
    'i.loaded': 'Grid loaded: {title}', 'i.sourceApplied': 'Markdown applied.',
    'i.errTitle': 'This grid cannot be opened', 'i.errShowing': 'Your last grid is shown instead.',
    'i.errFetch': 'The file could not be loaded ({detail}).', 'i.errCors': 'The site hosting this file may not allow other pages to read it (CORS).',
    'i.errFile': 'This page must be opened from a web server (http://…) to load an online file.',
    'i.errLink': 'This link is incomplete or damaged. Ask the person who shared it to copy it again.',
    'i.errUnsupported': 'This browser cannot read this compressed link. Try a recent version of Chrome, Edge, Firefox or Safari.',
    'i.errExample': 'Unknown example: “{id}”.',

    'x.title': 'Export as Markdown', 'x.intro': 'The exported file is a new version: the original is never overwritten.',
    'x.version': 'Version', 'x.basedOn': 'Based on', 'x.updated': 'Date', 'x.file': 'File name',
    'x.adopt': 'Keep working on this new version (and add it to the history)', 'x.preview': 'Markdown preview',
    'x.copy': 'Copy', 'x.download': 'Download', 'x.copied': 'Markdown copied to the clipboard.', 'x.copyFailed': 'Copy failed: select the text and copy it.',
    'x.done': '{file} downloaded.',

    's.title': 'Share the grid', 's.withSelection': 'Open the link with the {n} selected columns (and the current view)',
    's.noSelection': 'Select at least 2 columns to open the link directly in comparison',
    's.embedTitle': 'Self-contained link', 's.embedIntro': 'The whole grid is compressed into the link: nothing is sent to a server. Ideal for a QR code or a message, as long as the grid stays short.',
    's.srcTitle': 'Link to an online file', 's.srcIntro': 'Put the .md file on a public site (GitHub, LMS, school server) and paste its address: the link will always show the latest version of the file.',
    's.srcLabel': 'Address of the .md file', 's.copy': 'Copy the link', 's.open': 'Open', 's.copied': 'Link copied.',
    's.length': 'Length: {n} characters.', 's.long': 'Very long link: some messaging apps will cut it. Prefer a link to an online file.',
    's.unsupported': 'This browser cannot compress links.',
    'e.docColumns': 'Column width', 'e.docColumnsHelp': 'Narrow: for very short cards (a word, a name).',
    'e.cols.narrow': 'Narrow', 'e.cols.normal': 'Normal', 'e.cols.wide': 'Wide'
  }, 'English');
})(window.PG);

/* ------------------------------------------------ presentation modes (stage.js) */
(function (PG) {
  'use strict';
  PG.i18n.add('fr', {
    'k.pages': 'Page suiv. / préc.', 'k.stage': 'Présentation : dévoiler la suite / revenir', 'st.menu': 'Présenter', 'st.menuTitle': 'Modes de présentation : à la une, dévoilement progressif',
    'st.spot': 'À la une', 'st.spotHelp': 'Une seule colonne active, les autres sont grisées ; dans la colonne, l’élément ouvert ressort.',
    'st.reveal': 'Dévoilement', 'st.revealOff': 'Tout visible',
    'st.revealVeil': 'Progressif', 'st.revealVeilHelp': 'Les éléments restent estompés jusqu’à ce qu’on les touche.',
    'st.revealZero': 'À partir de zéro', 'st.revealZeroHelp': 'Seuls le 1er en-tête et la forme des cartes sont visibles.',
    'st.order': 'Ordre du bouton « Suivant »', 'st.orderColumn': 'Colonne par colonne', 'st.orderRank': 'Rang par rang (tous les n° 1, puis les n° 2…)',
    'st.orderElement': 'Élément par élément (un élément dans toutes les colonnes)',
    'st.presenter': 'Fenêtre présentateur', 'st.keysHelp': 'Télécommande : Page suivante / Page précédente (ou N / P).',
    'st.barAria': 'Commandes de présentation', 'st.prev': 'Précédent', 'st.prevTitle': 'Revenir en arrière (Page précédente)',
    'st.next': 'Suivant', 'st.nextCol': 'Colonne suivante', 'st.nextTitle': 'Dévoiler la suite (Page suivante)',
    'st.peek': 'Aperçu', 'st.peekTitle': 'Afficher discrètement ce qui vient ensuite (pour le présentateur)',
    'st.reset': 'Recommencer', 'st.all': 'Tout dévoiler', 'st.exit': 'Quitter la présentation',
    'st.progress': '{done} / {total} dévoilés', 'st.focusProgress': '{col} · {n} / {total}',
    'st.nextIs': 'Ensuite : {label}', 'st.allDone': 'Tout est dévoilé.',
    'st.colStep': 'Point de vue : {col}', 'st.headStep': 'En-tête : {col}', 'st.cellStep': '{col} · rang {n} · {title}',
    'st.headersStep': 'Les en-têtes de tous les points de vue', 'st.rankStep': 'Rang {n} dans chaque point de vue',
    'st.elementStep': 'Élément : {title} ({n} point(s) de vue)',
    'st.veiledSr': 'Élément estompé, rang {n} : activer pour le dévoiler', 'st.maskedSr': 'Élément masqué, rang {n} : activer pour le dévoiler',
    'st.maskedHeadSr': 'Point de vue masqué n° {n} : activer pour le dévoiler',
    'st.srRevealed': 'Dévoilé : {label}', 'st.srHidden': 'Dernier dévoilement annulé', 'st.srFocus': 'À la une : {col}',
    'st.noChannel': 'Ce navigateur ne permet pas de synchroniser une fenêtre présentateur.',
    'st.popupBlocked': 'La fenêtre présentateur a été bloquée : autorisez les fenêtres surgissantes pour ce site.',
    'st.presenterTitle': 'Vue présentateur', 'st.waiting': 'Connexion à la fenêtre de présentation…',
    'st.noMain': 'Aucune fenêtre de présentation trouvée : ouvrez la grille dans un autre onglet de ce navigateur, puis activez un mode de présentation.',
    'st.upNext': 'À dévoiler ensuite', 'st.justShown': 'Vient d’être dévoilé', 'st.plan': 'Déroulé', 'st.overview': 'Vue d’ensemble (grisé = encore masqué)',
    'st.editingNote': 'La fenêtre principale est en mode édition : les effets de présentation sont suspendus.',
    'st.offNote': 'Aucun mode de présentation actif dans la fenêtre principale (menu Présenter).',
    's.withStage': 'Ouvrir le lien dans le mode de présentation actuel', 's.noStage': 'Aucun mode de présentation actif'
  });
  PG.i18n.add('en', {
    'k.pages': 'Page Down / Up', 'k.stage': 'Presentation: reveal next / go back', 'st.menu': 'Present', 'st.menuTitle': 'Presentation modes: spotlight, progressive reveal',
    'st.spot': 'Spotlight', 'st.spotHelp': 'A single active column, the others are greyed out; inside it, the open element stands out.',
    'st.reveal': 'Reveal', 'st.revealOff': 'Everything visible',
    'st.revealVeil': 'Progressive', 'st.revealVeilHelp': 'Elements stay faded until they are tapped.',
    'st.revealZero': 'From scratch', 'st.revealZeroHelp': 'Only the first header and the card shapes are visible.',
    'st.order': 'Order of the “Next” button', 'st.orderColumn': 'Column by column', 'st.orderRank': 'Rank by rank (all #1, then all #2…)',
    'st.orderElement': 'Element by element (one element in every column)',
    'st.presenter': 'Presenter window', 'st.keysHelp': 'Clicker: Page Down / Page Up (or N / P).',
    'st.barAria': 'Presentation controls', 'st.prev': 'Back', 'st.prevTitle': 'Go back (Page Up)',
    'st.next': 'Next', 'st.nextCol': 'Next column', 'st.nextTitle': 'Reveal what comes next (Page Down)',
    'st.peek': 'Peek', 'st.peekTitle': 'Discreetly show what comes next (for the presenter)',
    'st.reset': 'Start again', 'st.all': 'Reveal all', 'st.exit': 'Leave the presentation',
    'st.progress': '{done} / {total} revealed', 'st.focusProgress': '{col} · {n} / {total}',
    'st.nextIs': 'Next: {label}', 'st.allDone': 'Everything is revealed.',
    'st.colStep': 'Perspective: {col}', 'st.headStep': 'Header: {col}', 'st.cellStep': '{col} · rank {n} · {title}',
    'st.headersStep': 'The headers of all perspectives', 'st.rankStep': 'Rank {n} in each perspective',
    'st.elementStep': 'Element: {title} ({n} perspective(s))',
    'st.veiledSr': 'Faded element, rank {n}: activate to reveal it', 'st.maskedSr': 'Hidden element, rank {n}: activate to reveal it',
    'st.maskedHeadSr': 'Hidden perspective #{n}: activate to reveal it',
    'st.srRevealed': 'Revealed: {label}', 'st.srHidden': 'Last reveal undone', 'st.srFocus': 'Spotlight: {col}',
    'st.noChannel': 'This browser cannot sync a presenter window.',
    'st.popupBlocked': 'The presenter window was blocked: allow pop-ups for this site.',
    'st.presenterTitle': 'Presenter view', 'st.waiting': 'Connecting to the presentation window…',
    'st.noMain': 'No presentation window found: open the grid in another tab of this browser, then turn on a presentation mode.',
    'st.upNext': 'Up next', 'st.justShown': 'Just revealed', 'st.plan': 'Run sheet', 'st.overview': 'Overview (greyed = still hidden)',
    'st.editingNote': 'The main window is in edit mode: presentation effects are suspended.',
    'st.offNote': 'No presentation mode is active in the main window (Present menu).',
    's.withStage': 'Open the link in the current presentation mode', 's.noStage': 'No presentation mode active'
  });
})(window.PG);
