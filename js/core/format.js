/*!
 * Perspective Grid — Markdown format (perspective-grid/v1): parser, serializer, validator.
 * Pure functions, no DOM: runs in the browser (window.PG.format) and in Node (require).
 * Specification: docs/FORMAT.md
 */
(function (root, factory) {
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else { root.PG = root.PG || {}; root.PG.format = api; }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var FORMAT_ID = 'perspective-grid/v1';
  var STATES = ['default', 'primary', 'success', 'warning', 'danger', 'muted'];
  var BUILTIN_BADGES = {
    central: 'bullseye',
    accepted: 'check2-circle',
    overvalued: 'graph-up-arrow',
    undervalued: 'graph-down-arrow',
    contested: 'patch-question',
    rejected: 'x-octagon',
    ignored: 'eye-slash',
    denied: 'slash-circle',
    instrumentalized: 'tools'
  };
  /** Front-matter keys written in this order; any other scalar key is kept verbatim after them. */
  var META_KEYS = ['format', 'title', 'subtitle', 'lang', 'version', 'based_on', 'updated', 'author', 'source', 'license'];
  var SECTION_ALIASES = {
    elements: /^(elements?|éléments?|catalog(ue)?)$/i,
    perspectives: /^(perspectives?|points? de vue|columns?|colonnes?)$/i
  };
  var CELL_ATTRS = ['state', 'badges'];
  var PERSPECTIVE_ATTRS = ['subtitle'];
  var SPACER_KEY = '-';

  /* ------------------------------------------------------------------ helpers */

  function slugify(s) {
    return String(s || '').toLowerCase()
      .normalize('NFD').replace(/[̀-ͯ]/g, '')
      .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  }

  function humanize(key) {
    var s = String(key || '').replace(/[-_]+/g, ' ').trim();
    return s ? s.charAt(0).toUpperCase() + s.slice(1) : '';
  }

  function trimBlank(lines) {
    var a = 0, b = lines.length;
    while (a < b && !lines[a].trim()) a++;
    while (b > a && !lines[b - 1].trim()) b--;
    return lines.slice(a, b);
  }

  function block(lines) { return trimBlank(lines).map(function (l) { return l.replace(/\s+$/, ''); }).join('\n'); }

  function unquote(v) {
    v = String(v).trim();
    if (v.length >= 2 && ((v[0] === '"' && v[v.length - 1] === '"') || (v[0] === "'" && v[v.length - 1] === "'"))) {
      var inner = v.slice(1, -1);
      return v[0] === '"' ? inner.replace(/\\"/g, '"').replace(/\\\\/g, '\\') : inner.replace(/''/g, "'");
    }
    return v;
  }

  function scalar(raw) {
    var v = String(raw).trim();
    if (v === '' || /^(null|~)$/i.test(v)) return null;
    if (/^-?\d+$/.test(v)) return Number(v);
    return unquote(v);
  }

  function quoteIfNeeded(v) {
    if (v == null) return 'null';
    if (typeof v === 'number') return String(v);
    var s = String(v);
    if (s === '' || /^[\s"'\[\]{}>|*&!%@`#,?-]|:\s|\s#|\s$|:$/.test(s) || /^(null|~|true|false|yes|no|-?\d+(\.\d+)?)$/i.test(s)) {
      return '"' + s.replace(/\\/g, '\\\\').replace(/"/g, '\\"') + '"';
    }
    return s;
  }

  function splitList(v) {
    return String(v || '').split(',').map(function (x) { return x.trim(); }).filter(Boolean);
  }

  function normIcon(icon) { return String(icon || '').trim().replace(/^bi-/, ''); }

  /* -------------------------------------------------------------- the model */

  /**
   * Document model:
   * {
   *   meta: { format, title, subtitle, lang, version, based_on, updated, ... },
   *   extra: [[key, rawValue], ...],               // unknown front-matter keys, kept verbatim
   *   badges: { key: { icon, label } },             // custom badges / overrides from the front matter
   *   intro: 'markdown',                            // text between the front matter and the first section
   *   elements: [{ key, title, detail, auto }],     // catalog; auto = created by the parser, not serialized
   *   perspectives: [{ id, title, subtitle, summary, detail,
   *                    cells: [{ key, title, state, badges: [], detail, spacer }] }]
   * }
   */
  function emptyDoc() {
    return {
      meta: { format: FORMAT_ID, title: '', subtitle: null, lang: 'fr', version: 1, based_on: null, updated: null },
      extra: [], badges: {}, intro: '', elements: [], perspectives: []
    };
  }

  /* ---------------------------------------------------------------- parser */

  function parseFrontMatter(lines, doc, warn) {
    var i = 0;
    while (i < lines.length && !lines[i].trim()) i++;
    if (lines[i] == null || lines[i].trim() !== '---') { warn('no-front-matter', 1, {}); return 0; }
    var start = i + 1, end = -1;
    for (var j = start; j < lines.length; j++) if (lines[j].trim() === '---') { end = j; break; }
    if (end < 0) { warn('unclosed-front-matter', i + 1, {}); return 0; }
    var inBadges = false;
    for (var k = start; k < end; k++) {
      var line = lines[k];
      if (!line.trim() || /^\s*#/.test(line)) continue;
      var indented = /^\s+/.test(line);
      if (indented && inBadges) {
        var bm = /^\s+([\w-]+)\s*:\s*(.*)$/.exec(line);
        if (!bm) { warn('bad-badge-definition', k + 1, { text: line.trim() }); continue; }
        var parts = unquote(bm[2]).split('|');
        var icon = normIcon(parts[0]), label = parts.length > 1 ? parts.slice(1).join('|').trim() : '';
        doc.badges[bm[1]] = { icon: icon || null, label: label || null };
        continue;
      }
      inBadges = false;
      var m = /^([\w-]+)\s*:\s*(.*)$/.exec(line);
      if (!m) { warn('bad-front-matter-line', k + 1, { text: line.trim() }); continue; }
      var key = m[1], raw = m[2];
      if (key === 'badges' && !raw.trim()) { inBadges = true; continue; }
      if (META_KEYS.indexOf(key) >= 0) doc.meta[key] = scalar(raw);
      else doc.extra.push([key, raw.trim()]);
    }
    if (doc.meta.format !== FORMAT_ID) warn('unknown-format', start, { value: doc.meta.format == null ? '' : String(doc.meta.format) });
    if (doc.meta.version == null || typeof doc.meta.version !== 'number') {
      if (doc.meta.version != null) warn('bad-version', start, { value: String(doc.meta.version) });
      doc.meta.version = 1;
    }
    return end + 1;
  }

  /** Splits leading "name: value" attribute lines (known names only) from the rest of a block. */
  function takeAttrs(lines, allowed) {
    var attrs = {}, i = 0;
    while (i < lines.length && !lines[i].trim()) i++;
    for (; i < lines.length; i++) {
      var m = /^([a-z_]+)\s*:\s*(.*)$/i.exec(lines[i]);
      if (!m || allowed.indexOf(m[1].toLowerCase()) < 0) break;
      attrs[m[1].toLowerCase()] = { value: m[2].trim(), line: i };
    }
    return { attrs: attrs, rest: lines.slice(i) };
  }

  function parse(text) {
    var doc = emptyDoc();
    var warnings = [];
    function warn(code, line, params) { warnings.push({ code: code, line: line || null, params: params || {}, message: message(code, params || {}, line) }); }

    var src = String(text == null ? '' : text).replace(/^﻿/, '').replace(/\r\n?/g, '\n');
    var lines = src.split('\n');
    doc.meta.title = null;
    var bodyStart = parseFrontMatter(lines, doc, warn);

    // Group the body into heading-delimited chunks (headings inside fenced code are ignored).
    var chunks = [], cur = { level: 0, text: '', line: bodyStart + 1, body: [] }, fence = null;
    for (var i = bodyStart; i < lines.length; i++) {
      var l = lines[i];
      var f = /^\s*(```+|~~~+)/.exec(l);
      if (f) { if (!fence) fence = f[1][0]; else if (f[1][0] === fence) fence = null; }
      var h = !fence && /^(#{1,3})\s+(.*?)(?:\s+#+)?\s*$/.exec(l);
      if (h) {
        chunks.push(cur);
        cur = { level: h[1].length, text: h[2], line: i + 1, body: [] };
      } else cur.body.push(l);
    }
    chunks.push(cur);

    var section = null, persp = null, elemIndex = {}, ids = {};

    chunks.forEach(function (c) {
      if (c.level === 0) { doc.intro = block(c.body); return; }

      if (c.level === 1) {
        persp = null;
        if (SECTION_ALIASES.elements.test(c.text.trim())) section = 'elements';
        else if (SECTION_ALIASES.perspectives.test(c.text.trim())) section = 'perspectives';
        else {
          section = 'unknown';
          if (!doc.meta.title && !doc.perspectives.length) doc.meta.title = c.text.trim();
          else warn('unknown-section', c.line, { title: c.text.trim() });
        }
        if (section !== 'unknown' && block(c.body)) warn('ignored-text', c.line + 1, {});
        return;
      }

      if (section === 'elements') {
        if (c.level === 3) { warn('ignored-text', c.line, {}); return; }
        var em = /^\[([^\]]*)\]\s*(.*)$/.exec(c.text);
        var key = em ? em[1].trim() : slugify(c.text);
        var title = em ? em[2].trim() : c.text.trim();
        if (!em) warn('element-no-key', c.line, { title: title, key: key });
        if (!key || key === SPACER_KEY) { warn('bad-key', c.line, { key: key }); return; }
        if (elemIndex[key]) { warn('duplicate-element', c.line, { key: key }); return; }
        var el = { key: key, title: title || humanize(key), detail: block(c.body), auto: false };
        if (!title) warn('element-no-title', c.line, { key: key });
        elemIndex[key] = el;
        doc.elements.push(el);
        return;
      }

      if (section === 'perspectives') {
        if (c.level === 2) {
          var pm = /^(.*?)\s*\{#([^}\s]+)\}\s*$/.exec(c.text);
          var ptitle = (pm ? pm[1] : c.text).trim();
          var id = pm ? pm[2].trim() : slugify(ptitle);
          if (!id) id = 'perspective';
          if (ids[id]) { var n = 2; while (ids[id + '-' + n]) n++; warn('duplicate-perspective', c.line, { id: id, next: id + '-' + n }); id = id + '-' + n; }
          ids[id] = true;
          var pa = takeAttrs(c.body, PERSPECTIVE_ATTRS);
          var rest = pa.rest, k = 0, quote = [];
          while (k < rest.length && !rest[k].trim()) k++;
          while (k < rest.length && /^>/.test(rest[k])) { quote.push(rest[k].replace(/^>\s?/, '')); k++; }
          persp = {
            id: id, title: ptitle || humanize(id),
            subtitle: pa.attrs.subtitle ? unquote(pa.attrs.subtitle.value) : null,
            summary: block(quote), detail: block(rest.slice(k)), cells: []
          };
          doc.perspectives.push(persp);
          return;
        }
        // level 3: a cell
        if (!persp) { warn('cell-outside-perspective', c.line, {}); return; }
        var cm = /^\[([^\]]*)\]\s*(.*)$/.exec(c.text);
        var ckey = cm ? cm[1].trim() : slugify(c.text);
        var ctitle = cm ? cm[2].trim() : c.text.trim();
        if (ckey === SPACER_KEY || (cm && ckey === '')) {
          if (block(c.body) || ctitle) warn('spacer-content-ignored', c.line, {});
          persp.cells.push({ key: null, title: null, state: 'default', badges: [], detail: '', spacer: true });
          return;
        }
        if (!cm) warn('cell-no-key', c.line, { title: ctitle, key: ckey });
        if (!ckey) { warn('bad-key', c.line, { key: c.text }); return; }
        var ca = takeAttrs(c.body, CELL_ATTRS);
        var state = 'default';
        if (ca.attrs.state) {
          var sv = ca.attrs.state.value.toLowerCase();
          if (STATES.indexOf(sv) >= 0) state = sv;
          else warn('unknown-state', c.line + 1 + ca.attrs.state.line, { value: ca.attrs.state.value, allowed: STATES.join(', ') });
        }
        var badges = ca.attrs.badges ? splitList(ca.attrs.badges.value) : [];
        badges.forEach(function (b) {
          if (!BUILTIN_BADGES[b] && !doc.badges[b]) warn('unknown-badge', c.line + 1 + ca.attrs.badges.line, { value: b });
        });
        if (persp.cells.some(function (x) { return x.key === ckey; })) warn('duplicate-in-column', c.line, { key: ckey, perspective: persp.title });
        if (!elemIndex[ckey]) {
          if (!ctitle) warn('unknown-key', c.line, { key: ckey });
          var auto = { key: ckey, title: ctitle || humanize(ckey), detail: '', auto: true };
          elemIndex[ckey] = auto;
          doc.elements.push(auto);
        }
        // An auto element takes its title from the first cell: that cell keeps it as its own title.
        persp.cells.push({ key: ckey, title: ctitle || null, state: state, badges: badges, detail: block(ca.rest), spacer: false });
        return;
      }

      // before any known section, or inside an unknown one
      if (block(c.body) || c.level) warn(section ? 'ignored-text' : 'heading-before-section', c.line, { title: c.text });
    });

    if (!doc.meta.title) { warn('no-title', 1, {}); doc.meta.title = 'Untitled'; }
    if (!doc.perspectives.length) warn('no-perspectives', null, {});
    return { doc: doc, warnings: warnings };
  }

  /* ------------------------------------------------------------ serializer */

  function serialize(doc) {
    var out = ['---'];
    var meta = doc.meta || {};
    META_KEYS.forEach(function (k) {
      if (k === 'format') { out.push('format: ' + FORMAT_ID); return; }
      var always = ['title', 'lang', 'version', 'based_on', 'updated'].indexOf(k) >= 0;
      if (meta[k] == null && !always) return;
      if (k === 'subtitle' && !meta[k]) return;
      out.push(k + ': ' + quoteIfNeeded(meta[k] == null ? null : meta[k]));
    });
    (doc.extra || []).forEach(function (kv) { out.push(kv[0] + ': ' + kv[1]); });
    var bk = Object.keys(doc.badges || {});
    if (bk.length) {
      out.push('badges:');
      bk.forEach(function (k) {
        var b = doc.badges[k];
        out.push('  ' + k + ': ' + (b.icon || '') + (b.label ? ' | ' + b.label : ''));
      });
    }
    out.push('---', '');
    if (doc.intro) out.push(doc.intro, '');

    var auto = {}, seen = {};
    var listed = (doc.elements || []).filter(function (e) { if (e.auto) auto[e.key] = e; return !e.auto; });
    if (listed.length) {
      out.push('# Elements', '');
      listed.forEach(function (e) {
        out.push('## [' + e.key + '] ' + (e.title || ''));
        if (e.detail) out.push(e.detail);
        out.push('');
      });
    }

    out.push('# Perspectives', '');
    (doc.perspectives || []).forEach(function (p) {
      out.push('## ' + p.title + ' {#' + p.id + '}');
      if (p.subtitle) out.push('subtitle: ' + p.subtitle);
      if (p.summary) p.summary.split('\n').forEach(function (l) { out.push(l ? '> ' + l : '>'); });
      if (p.detail) { if (p.subtitle || p.summary) out.push(''); out.push(p.detail); }
      out.push('');
      (p.cells || []).forEach(function (c) {
        if (c.spacer) { out.push('### [' + SPACER_KEY + ']', ''); return; }
        // cell.title is the cell's own title (null = use the catalog title). An element absent from the catalog
        // takes its title from its first cell when read back: that first cell always carries it.
        var title = c.title;
        if (!title && auto[c.key] && !seen[c.key]) title = auto[c.key].title;
        seen[c.key] = true;
        out.push('### [' + c.key + ']' + (title ? ' ' + title : ''));
        if (c.state && c.state !== 'default') out.push('state: ' + c.state);
        if (c.badges && c.badges.length) out.push('badges: ' + c.badges.join(', '));
        if (c.detail) out.push(c.detail);
        out.push('');
      });
    });
    while (out.length && out[out.length - 1] === '') out.pop();
    return out.join('\n') + '\n';
  }

  /* --------------------------------------------------------------- queries */

  function element(doc, key) {
    for (var i = 0; i < doc.elements.length; i++) if (doc.elements[i].key === key) return doc.elements[i];
    return null;
  }

  /** Display title of a cell: its own title, else the catalog title. */
  function cellTitle(doc, cell) {
    if (cell.spacer) return '';
    if (cell.title) return cell.title;
    var el = element(doc, cell.key);
    return el ? el.title : humanize(cell.key);
  }

  /** Rank of a cell in its column (1-based, spacers do not count), or 0 for a spacer. */
  function rankOf(perspective, cellIndex) {
    var cells = perspective.cells;
    if (!cells[cellIndex] || cells[cellIndex].spacer) return 0;
    var r = 0;
    for (var i = 0; i <= cellIndex; i++) if (!cells[i].spacer) r++;
    return r;
  }

  /** Rank (1-based) of a key in a perspective, or 0 if absent. */
  function rankOfKey(perspective, key) {
    var r = 0;
    for (var i = 0; i < perspective.cells.length; i++) {
      var c = perspective.cells[i];
      if (c.spacer) continue;
      r++;
      if (c.key === key) return r;
    }
    return 0;
  }

  /** Removes catalog entries created by the parser that no cell uses any more. */
  function prune(doc) {
    var used = {};
    doc.perspectives.forEach(function (p) { p.cells.forEach(function (c) { if (c.key) used[c.key] = true; }); });
    doc.elements = doc.elements.filter(function (e) { return !e.auto || used[e.key]; });
    return doc;
  }

  function stats(doc) {
    var keys = {}, cells = 0;
    doc.perspectives.forEach(function (p) {
      p.cells.forEach(function (c) { if (!c.spacer) { cells++; keys[c.key] = (keys[c.key] || 0) + 1; } });
    });
    var shared = Object.keys(keys).filter(function (k) { return keys[k] > 1; }).length;
    return { perspectives: doc.perspectives.length, cells: cells, elements: Object.keys(keys).length, shared: shared };
  }

  /* ------------------------------------------------------------- messages */

  var MESSAGES = {
    'no-front-matter': 'No front matter (--- … ---) at the top of the file.',
    'unclosed-front-matter': 'The front matter is not closed by a "---" line.',
    'bad-front-matter-line': 'Unreadable front-matter line: "{text}".',
    'bad-badge-definition': 'Unreadable badge definition: "{text}" (expected "key: icon | Label").',
    'unknown-format': 'Unknown format "{value}" (expected ' + FORMAT_ID + ').',
    'bad-version': 'The version "{value}" is not a whole number; 1 is used.',
    'no-title': 'The document has no title.',
    'no-perspectives': 'No perspective found (expected "# Perspectives" then "## Title {#id}").',
    'unknown-section': 'Unknown section "# {title}": its content is ignored.',
    'heading-before-section': 'Heading "{title}" outside "# Elements" / "# Perspectives": ignored.',
    'ignored-text': 'Text outside any element, perspective or cell: ignored.',
    'element-no-key': 'Element "{title}" has no [key]: "{key}" is used.',
    'element-no-title': 'Element [{key}] has no title.',
    'duplicate-element': 'Element [{key}] is defined twice: the second definition is ignored.',
    'bad-key': 'Invalid key "{key}".',
    'duplicate-perspective': 'Perspective id "{id}" is used twice: renamed "{next}".',
    'cell-outside-perspective': 'Cell found before any perspective ("## Title {#id}"): ignored.',
    'cell-no-key': 'Cell "{title}" has no [key]: "{key}" is used.',
    'spacer-content-ignored': 'An empty cell [-] cannot have a title or detail: they are ignored.',
    'unknown-state': 'Unknown state "{value}" (allowed: {allowed}); "default" is used.',
    'unknown-badge': 'Unknown badge "{value}": declare it in the front matter (badges:) to give it an icon and a label.',
    'duplicate-in-column': 'Key [{key}] appears twice in "{perspective}": comparisons use the first one.',
    'unknown-key': 'Key [{key}] is not in the catalog and the cell has no title: an element was created.'
  };

  function message(code, params, line) {
    var s = (MESSAGES[code] || code).replace(/\{(\w+)\}/g, function (m, k) { return params[k] != null ? params[k] : m; });
    return (line ? 'Line ' + line + ': ' : '') + s;
  }

  return {
    FORMAT_ID: FORMAT_ID,
    STATES: STATES,
    BUILTIN_BADGES: BUILTIN_BADGES,
    SPACER_KEY: SPACER_KEY,
    MESSAGES: MESSAGES,
    emptyDoc: emptyDoc,
    parse: parse,
    serialize: serialize,
    element: element,
    cellTitle: cellTitle,
    rankOf: rankOf,
    rankOfKey: rankOfKey,
    prune: prune,
    stats: stats,
    slugify: slugify,
    humanize: humanize
  };
});
