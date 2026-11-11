/* Round-trip and tolerance tests for the perspective-grid/v1 format. Run: node --test tests/ */
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const F = require('../js/core/format.js');

const EXAMPLES = path.join(__dirname, '..', 'examples');
const examples = fs.readdirSync(EXAMPLES).filter((f) => f.endsWith('.md'));

for (const file of examples) {
  test(`example ${file}: parses without warnings`, () => {
    const { warnings } = F.parse(fs.readFileSync(path.join(EXAMPLES, file), 'utf8'));
    assert.deepEqual(warnings.map((w) => w.message), []);
  });
  test(`example ${file}: Markdown → model → Markdown is identical`, () => {
    const md = fs.readFileSync(path.join(EXAMPLES, file), 'utf8').replace(/\r\n?/g, '\n');
    assert.equal(F.serialize(F.parse(md).doc), md);
  });
  test(`example ${file}: model → Markdown → model is identical`, () => {
    const doc = F.parse(fs.readFileSync(path.join(EXAMPLES, file), 'utf8')).doc;
    assert.deepEqual(F.parse(F.serialize(doc)).doc, doc);
  });
}

const SPEC = `---
format: perspective-grid/v1
title: Les courants pédagogiques
subtitle: Ce que chaque courant place au centre
lang: fr
version: 1
based_on: null
updated: 2026-11-11
---

# Elements

## [erreur] Le rôle de l'erreur
Description par défaut de l'élément.

## [enseignant] La place de l'enseignant
...

# Perspectives

## Béhaviorisme {#behaviorisme}
subtitle: Skinner, Watson
> Description courte affichée dans l'en-tête de colonne.

Description détaillée (dépliable).

### [renforcement] Le renforcement
state: success
badges: central
Détail spécifique à ce point de vue (Markdown autorisé).

### [erreur]
state: danger
badges: rejected
L'erreur est à éviter : elle risque d'être renforcée.

### [representations] Les représentations de l'apprenant
state: muted
badges: ignored
`;

test('the example of the brief is read as expected', () => {
  const { doc, warnings } = F.parse(SPEC);
  assert.equal(warnings.length, 0);
  assert.equal(doc.meta.title, 'Les courants pédagogiques');
  assert.equal(doc.meta.version, 1);
  assert.equal(doc.meta.based_on, null);
  assert.equal(doc.meta.updated, '2026-11-11');
  const p = doc.perspectives[0];
  assert.equal(p.id, 'behaviorisme');
  assert.equal(p.subtitle, 'Skinner, Watson');
  assert.equal(p.summary, "Description courte affichée dans l'en-tête de colonne.");
  assert.equal(p.detail, 'Description détaillée (dépliable).');
  assert.equal(p.cells.length, 3);
  assert.deepEqual(p.cells[0], { key: 'renforcement', title: 'Le renforcement', state: 'success', badges: ['central'], detail: 'Détail spécifique à ce point de vue (Markdown autorisé).', spacer: false });
  assert.equal(p.cells[1].title, null);
  assert.equal(F.cellTitle(doc, p.cells[1]), "Le rôle de l'erreur");
  assert.equal(F.element(doc, 'representations').auto, true);
  assert.equal(F.serialize(doc), SPEC);
});

test('tolerant parsing produces readable warnings instead of failing', () => {
  const md = [
    '# Perspectives', '',
    '### [orphan] Before any perspective', '',
    '## Sans identifiant', '',
    '### Cellule sans clé', 'state: purple', 'badges: central, strange', 'Texte.', '',
    '### [mystere]', '',
    '### [-] ignored title', '',
    '## Sans identifiant', '',
    '### [mystere]', '### [mystere]'
  ].join('\n');
  const { doc, warnings } = F.parse(md);
  const codes = warnings.map((w) => w.code);
  for (const c of ['no-front-matter', 'cell-outside-perspective', 'cell-no-key', 'unknown-state', 'unknown-badge', 'unknown-key', 'spacer-content-ignored', 'duplicate-perspective', 'duplicate-in-column', 'no-title']) {
    assert.ok(codes.includes(c), 'missing warning ' + c + ' in ' + codes.join(','));
  }
  assert.ok(warnings.every((w) => typeof w.message === 'string' && w.message.length > 10));
  assert.equal(doc.perspectives.length, 2);
  assert.equal(doc.perspectives[0].id, 'sans-identifiant');
  assert.equal(doc.perspectives[1].id, 'sans-identifiant-2');
  const c = doc.perspectives[0].cells[0];
  assert.equal(c.key, 'cellule-sans-cle');
  assert.equal(c.state, 'default');
  assert.deepEqual(c.badges, ['central', 'strange']);
  assert.equal(doc.perspectives[0].cells[2].spacer, true);
  // after one pass, the output is stable
  const once = F.serialize(doc);
  assert.equal(F.serialize(F.parse(once).doc), once);
});

test('custom badges, extra front-matter keys and intro survive a round trip', () => {
  const md = [
    '---', 'format: perspective-grid/v1', 'title: "Titre : avec deux-points"', 'lang: en', 'version: 3',
    'based_on: "demo v2"', 'updated: 2026-11-11', 'audience: lycée', 'badges:', '  pivot: bi-arrow-repeat | Pivotal', '  central: star | Core', '---', '',
    'Intro **text**.', '', '# Perspectives', '', '## A {#a}', '', '### [x] X', 'badges: pivot', '', '### [-]', '', '### [y] Y', '```', '## not a heading', '```'
  ].join('\n');
  const { doc, warnings } = F.parse(md);
  assert.deepEqual(warnings, []);
  assert.equal(doc.meta.title, 'Titre : avec deux-points');
  assert.equal(doc.meta.version, 3);
  assert.deepEqual(doc.extra, [['audience', 'lycée']]);
  assert.deepEqual(doc.badges.pivot, { icon: 'arrow-repeat', label: 'Pivotal' });
  assert.equal(doc.intro, 'Intro **text**.');
  assert.equal(doc.perspectives[0].cells[2].detail, '```\n## not a heading\n```');
  assert.equal(F.rankOfKey(doc.perspectives[0], 'y'), 2);
  assert.equal(F.rankOf(doc.perspectives[0], 1), 0);
  const out = F.serialize(doc);
  assert.deepEqual(F.parse(out).doc, doc);
  assert.equal(F.serialize(F.parse(out).doc), out);
});

test('French section names and CRLF line endings are accepted', () => {
  const md = '---\r\nformat: perspective-grid/v1\r\ntitle: T\r\n---\r\n# Éléments\r\n## [a] A\r\n# Points de vue\r\n## P {#p}\r\n### [a]\r\n';
  const { doc, warnings } = F.parse(md);
  assert.deepEqual(warnings, []);
  assert.equal(F.cellTitle(doc, doc.perspectives[0].cells[0]), 'A');
});

test('stats and prune', () => {
  const { doc } = F.parse(SPEC);
  assert.deepEqual(F.stats(doc), { perspectives: 1, cells: 3, elements: 3, shared: 0 });
  doc.perspectives[0].cells.splice(2, 1);
  F.prune(doc);
  assert.equal(F.element(doc, 'representations'), null);
  assert.ok(F.element(doc, 'enseignant'), 'catalog entries are kept even if unused');
});

test('an element absent from the catalog keeps its title when columns are reordered', () => {
  const md = '---\nformat: perspective-grid/v1\ntitle: T\n---\n\n# Perspectives\n\n## A {#a}\n\n### [x] Shared title\n\n## B {#b}\n\n### [x]\n';
  const { doc } = F.parse(md);
  doc.perspectives.reverse();
  const back = F.parse(F.serialize(doc));
  assert.deepEqual(back.warnings, []);
  assert.equal(F.cellTitle(back.doc, back.doc.perspectives[0].cells[0]), 'Shared title');
  assert.equal(F.cellTitle(back.doc, back.doc.perspectives[1].cells[0]), 'Shared title');
});

test('the optional columns width is read, validated and written back', () => {
  const base = '---\nformat: perspective-grid/v1\ntitle: T\ncolumns: narrow\n---\n\n# Perspectives\n\n## A {#a}\n';
  const { doc, warnings } = F.parse(base);
  assert.deepEqual(warnings, []);
  assert.equal(doc.meta.columns, 'narrow');
  assert.match(F.serialize(doc), /\ncolumns: narrow\n/);
  const bad = F.parse(base.replace('narrow', 'tiny'));
  assert.equal(bad.warnings[0].code, 'unknown-columns');
  assert.equal(bad.doc.meta.columns, null);
  assert.doesNotMatch(F.serialize(F.parse('---\nformat: perspective-grid/v1\ntitle: T\n---\n').doc), /columns:/);
});
