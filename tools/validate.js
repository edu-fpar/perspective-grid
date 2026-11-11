#!/usr/bin/env node
/* Validates perspective-grid/v1 Markdown files.
 *   node tools/validate.js file.md [more.md]      prints warnings, exit code 1 if any
 *   node tools/validate.js --fix file.md          also rewrites the file in canonical form
 *   node tools/validate.js --json file.md         machine-readable output
 *   cat file.md | node tools/validate.js -        reads stdin */
'use strict';
const fs = require('fs');
const F = require('../js/core/format.js');

const args = process.argv.slice(2);
const fix = args.includes('--fix');
const json = args.includes('--json');
const files = args.filter((a) => a !== '--fix' && a !== '--json');
if (!files.length) { console.error('Usage: node tools/validate.js [--fix] [--json] <file.md|-> ...'); process.exit(2); }

let failed = false;
const report = [];
for (const file of files) {
  const md = file === '-' ? fs.readFileSync(0, 'utf8') : fs.readFileSync(file, 'utf8');
  const { doc, warnings } = F.parse(md);
  const canonical = F.serialize(doc);
  const s = F.stats(doc);
  if (warnings.length) failed = true;
  report.push({ file, ok: !warnings.length, canonical: canonical === md.replace(/\r\n?/g, '\n'), stats: s, warnings: warnings.map((w) => ({ code: w.code, line: w.line, message: w.message })) });
  if (fix && file !== '-') fs.writeFileSync(file, canonical);
  if (!json) {
    console.log((warnings.length ? '✗ ' : '✓ ') + file + ' — ' + s.perspectives + ' perspectives, ' + s.cells + ' cells, ' +
      s.elements + ' elements (' + s.shared + ' shared by several perspectives)' + (canonical === md ? '' : fix ? ' — rewritten in canonical form' : ' — not in canonical form (use --fix)'));
    warnings.forEach((w) => console.log('    ' + w.message));
  }
}
if (json) console.log(JSON.stringify(report, null, 2));
process.exit(failed ? 1 : 0);
