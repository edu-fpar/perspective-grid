/*!
 * Import (file, drag and drop, paste, URL) with preview and parser warnings; Markdown export with
 * versioning; share links (#z= compressed, ?src= hosted file); local version history.
 * Same patterns as MicroLearn Studio (versions.js, share.js, view.js).
 */
(function (PG) {
  'use strict';

  var F = PG.format, U = PG.util, esc = U.escapeHtml, ui = PG.ui;
  function T(k, v) { return PG.i18n.t(k, v); }
  function S() { return PG.app.state; }

  /* ---------------------------------------------------------------- versions */

  var VKEY = 'versions', VMAX = 40;
  function vlist() { return PG.store.get(VKEY, []) || []; }
  function lineDiff(a, b) {
    var count = {};
    String(a).split('\n').forEach(function (l) { count[l] = (count[l] || 0) + 1; });
    var added = 0;
    String(b).split('\n').forEach(function (l) { if (count[l]) count[l]--; else added++; });
    var removed = 0;
    Object.keys(count).forEach(function (k) { removed += count[k]; });
    return { added: added, removed: removed };
  }
  PG.versions = {
    list: vlist,
    save: function (md, label, extra) {
      var all = vlist();
      if (extra && extra.auto && all[0] && all[0].md === md) return all[0]; // nothing new
      var parsed = F.parse(md).doc, st = F.stats(parsed);
      var v = { id: U.uid('v'), label: label || T('h.unnamed'), date: new Date().toISOString(), title: parsed.meta.title, version: parsed.meta.version,
        perspectives: st.perspectives, cells: st.cells, auto: !!(extra && extra.auto), md: md };
      all.unshift(v);
      while (all.length > VMAX) {
        var idx = -1;
        for (var i = all.length - 1; i >= 0; i--) if (all[i].auto) { idx = i; break; }
        all.splice(idx === -1 ? all.length - 1 : idx, 1);
      }
      return PG.store.set(VKEY, all) ? v : null;
    },
    rename: function (id, label) { var all = vlist(); all.forEach(function (v) { if (v.id === id) v.label = label; }); PG.store.set(VKEY, all); },
    remove: function (id) { PG.store.set(VKEY, vlist().filter(function (v) { return v.id !== id; })); },
    diff: lineDiff
  };

  /** Saves the current grid as an automatic version before it is replaced (if it is not already saved). */
  function backup(label) {
    var md = S().md;
    if (!md || !md.trim()) return;
    if ((PG.samples || []).some(function (s) { return s.markdown === md; })) return; // untouched example
    PG.versions.save(md, label, { auto: true });
    renderHistoryCount();
  }

  function renderHistoryCount() { var c = document.getElementById('history-count'); if (c) c.textContent = vlist().length; }

  function renderHistory() {
    var list = vlist(), box = document.getElementById('history-list');
    renderHistoryCount();
    if (!list.length) {
      box.innerHTML = '<div class="text-center text-body-secondary py-5"><i class="bi bi-inbox fs-1 d-block" aria-hidden="true"></i>' + esc(T('h.empty')) + '<br><small>' + esc(T('h.emptyHint')) + '</small></div>';
      return;
    }
    box.innerHTML = '';
    list.forEach(function (v) {
      var same = v.md === S().md, d = lineDiff(v.md, S().md);
      var card = document.createElement('div');
      card.className = 'pg-version' + (same ? ' current' : '');
      card.innerHTML = '<div class="fw-semibold">' + (v.auto ? '<i class="bi bi-robot text-body-secondary" title="' + esc(T('h.auto')) + '" aria-label="' + esc(T('h.auto')) + '"></i> ' : '') + esc(v.label) + '</div>' +
        '<div class="meta">' + esc(ui.formatDate(v.date)) + ' · ' + esc(v.title || '') + ' · v' + esc(v.version) + '</div>' +
        '<div class="meta">' + esc(T('h.stats', { p: v.perspectives, c: v.cells })) + ' · ' + (same ? '<span class="badge text-bg-primary">' + esc(T('h.identical')) + '</span>'
          : T('h.diff', { add: '<span class="diff-add">+' + d.added + '</span>', del: '<span class="diff-del">−' + d.removed + '</span>' })) + '</div>' +
        '<div class="d-flex gap-1 mt-2 flex-wrap">' +
        '<button class="btn btn-sm btn-outline-primary" data-a="restore"' + (same ? ' disabled' : '') + '><i class="bi bi-arrow-counterclockwise" aria-hidden="true"></i> ' + esc(T('h.restore')) + '</button>' +
        '<button class="btn btn-sm btn-outline-secondary" data-a="rename" title="' + esc(T('h.rename')) + '" aria-label="' + esc(T('h.rename')) + '"><i class="bi bi-pencil" aria-hidden="true"></i></button>' +
        '<button class="btn btn-sm btn-outline-secondary" data-a="download" title="' + esc(T('h.download')) + '" aria-label="' + esc(T('h.download')) + '"><i class="bi bi-download" aria-hidden="true"></i></button>' +
        '<button class="btn btn-sm btn-outline-danger ms-auto" data-a="delete" title="' + esc(T('h.delete')) + '" aria-label="' + esc(T('h.delete')) + '"><i class="bi bi-trash" aria-hidden="true"></i></button></div>';
      card.addEventListener('click', function (e) {
        var b = e.target.closest('[data-a]');
        if (!b) return;
        var a = b.getAttribute('data-a');
        if (a === 'restore') {
          ui.confirm(T('h.confirmRestore', { label: v.label }), { ok: T('h.restore') }).then(function (ok) {
            if (!ok) return;
            backup(T('h.beforeRestore', { label: v.label }));
            PG.app.load(v.md, { keepSelection: false });
            renderHistory();
            ui.toast(esc(T('h.restored')), 'success');
          });
        } else if (a === 'rename') {
          ui.prompt(T('h.renamePrompt'), v.label, { ok: T('h.rename') }).then(function (nl) { if (nl && nl.trim()) { PG.versions.rename(v.id, nl.trim()); renderHistory(); } });
        } else if (a === 'download') {
          ui.downloadText(v.md, (F.slugify(v.title) || 'grille') + '-' + F.slugify(v.label) + '.md');
        } else if (a === 'delete') {
          ui.confirm(T('h.confirmDelete', { label: v.label }), { ok: T('h.delete'), danger: true }).then(function (ok) { if (ok) { PG.versions.remove(v.id); renderHistory(); } });
        }
      });
      box.appendChild(card);
    });
  }

  function snapshot() {
    var def = T('h.snapDefault', { date: new Date().toLocaleString(T('c.dateLocale'), { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) });
    ui.prompt(T('h.snapPrompt'), def, { ok: T('c.save'), title: T('h.snapTitle') }).then(function (label) {
      if (label == null) return;
      var v = PG.versions.save(S().md, label.trim() || def);
      if (v) ui.toast('<i class="bi bi-camera" aria-hidden="true"></i> ' + esc(T('h.saved', { label: v.label })), 'success');
      else ui.toast(esc(T('h.full')), 'danger');
      renderHistoryCount();
    });
  }

  /* ------------------------------------------------------------------ import */

  function fetchText(url) {
    if (location.protocol === 'file:') return Promise.reject(friendly(T('i.errFile')));
    return fetch(url, { cache: 'no-cache' }).then(function (r) {
      if (!r.ok) throw friendly(T('i.errFetch', { detail: 'HTTP ' + r.status }));
      return r.text();
    }, function (e) {
      var err = friendly(T('i.errFetch', { detail: e.message }));
      try { if (new URL(url, location.href).origin !== location.origin) err.hint = T('i.errCors'); } catch (x) { /* ignore */ }
      throw err;
    });
  }
  function friendly(msg) { var e = new Error(msg); e.friendly = true; return e; }

  function warningText(w) {
    // French messages come from the translation file; other languages use the parser's English message
    if (PG.i18n.lang() !== 'fr') return w.message;
    var key = 'w.' + w.code;
    var s = T(key, w.params);
    if (s === key) s = w.message.replace(/^Line \d+: /, '');
    return (w.line ? T('i.line', { n: w.line }) + ' ' : '') + s;
  }

  /**
   * Import dialog: file / paste / URL, live preview, warnings, then "Replace".
   * opts: { tab: 'file'|'paste'|'url', text, name, title }
   */
  function openImport(opts) {
    opts = opts || {};
    var html = '<div class="modal-content">' +
      '<div class="modal-header"><h2 class="modal-title h5"><i class="bi ' + (opts.source ? 'bi-markdown' : 'bi-box-arrow-in-down') + '" aria-hidden="true"></i> ' + esc(opts.title || T('i.title')) + '</h2>' +
      '<button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="' + esc(T('c.close')) + '"></button></div>' +
      '<div class="modal-body">' +
      '<ul class="nav nav-tabs mb-3" role="tablist">' +
      ['file', 'paste', 'url'].map(function (t) {
        var icons = { file: 'bi-folder2-open', paste: 'bi-clipboard', url: 'bi-link-45deg' };
        return '<li class="nav-item" role="presentation"><button type="button" class="nav-link' + ((opts.tab || 'file') === t ? ' active' : '') + '" data-tab="' + t + '" role="tab" aria-selected="' + ((opts.tab || 'file') === t) + '"><i class="bi ' + icons[t] + '" aria-hidden="true"></i> ' + esc(T('i.tab.' + t)) + '</button></li>';
      }).join('') + '</ul>' +
      '<div data-pane="file"><button type="button" class="pg-drop w-100" data-act="browse"><i class="bi bi-cloud-arrow-up" aria-hidden="true"></i> <span>' + T('i.drop') + '</span></button>' +
      '<div class="form-text" data-filename></div></div>' +
      '<div data-pane="paste" hidden><label class="visually-hidden" for="imp-text">' + esc(T('i.pasteLabel')) + '</label>' +
      '<textarea class="form-control font-monospace small pg-source" id="imp-text" rows="12" spellcheck="false" placeholder="' + esc(T('i.pastePh')) + '"></textarea></div>' +
      '<div data-pane="url" hidden><label class="form-label fw-semibold" for="imp-url">' + esc(T('i.urlLabel')) + '</label>' +
      '<div class="input-group"><input class="form-control" id="imp-url" type="url" placeholder="https://…/grille.md" spellcheck="false">' +
      '<button class="btn btn-outline-primary" type="button" data-act="fetch"><i class="bi bi-cloud-download" aria-hidden="true"></i> ' + esc(T('i.fetch')) + '</button></div>' +
      '<div class="form-text">' + esc(T('i.urlHelp')) + '</div></div>' +
      '<div class="pg-preview mt-3" aria-live="polite"></div>' +
      '</div>' +
      '<div class="modal-footer"><button type="button" class="btn btn-light" data-bs-dismiss="modal">' + esc(T('c.cancel')) + '</button>' +
      '<button type="button" class="btn btn-accent" data-act="apply" disabled><i class="bi bi-check2-circle" aria-hidden="true"></i> ' + esc(opts.source ? T('i.applySource') : T('i.apply')) + '</button></div></div>';
    var m = ui.modal(html, { size: 'modal-xl', onShown: function (box) { var f = box.querySelector(opts.tab === 'paste' ? '#imp-text' : opts.tab === 'url' ? '#imp-url' : '[data-act="browse"]'); if (f) f.focus(); } });
    var box = m.el, $ = function (s) { return box.querySelector(s); };
    var current = null; // { text, name }

    function tab(t) {
      box.querySelectorAll('[data-tab]').forEach(function (b) { var on = b.getAttribute('data-tab') === t; b.classList.toggle('active', on); b.setAttribute('aria-selected', on); });
      box.querySelectorAll('[data-pane]').forEach(function (p) { p.hidden = p.getAttribute('data-pane') !== t; });
    }
    box.querySelectorAll('[data-tab]').forEach(function (b) { b.addEventListener('click', function () { tab(b.getAttribute('data-tab')); }); });

    function preview(text, name) {
      current = text && text.trim() ? { text: text, name: name } : null;
      var pv = $('.pg-preview'), apply = $('[data-act="apply"]');
      if (!current) { pv.innerHTML = ''; apply.disabled = true; return; }
      var res = F.parse(text), d = res.doc, s = F.stats(d);
      var ok = d.perspectives.length > 0;
      apply.disabled = !ok;
      pv.innerHTML = '<div class="d-flex flex-wrap align-items-baseline gap-2 mb-2"><strong class="fs-6">' + esc(d.meta.title) + '</strong>' +
        (d.meta.subtitle ? '<span class="text-body-secondary small">' + esc(d.meta.subtitle) + '</span>' : '') +
        '<span class="badge text-bg-light border">v' + esc(d.meta.version) + '</span>' + (name ? '<span class="small text-body-secondary"><i class="bi bi-file-earmark-text" aria-hidden="true"></i> ' + esc(name) + '</span>' : '') + '</div>' +
        '<p class="small mb-2">' + esc(T('i.stats', { p: s.perspectives, c: s.cells, e: s.elements, sh: s.shared })) + '</p>' +
        (res.warnings.length ? '<details class="pg-warnings mb-2"' + (res.warnings.length <= 6 ? ' open' : '') + '><summary><i class="bi bi-exclamation-triangle" aria-hidden="true"></i> ' + esc(T('i.warnings', { n: res.warnings.length })) + '</summary><ul class="small mb-0">' +
          res.warnings.map(function (w) { return '<li>' + esc(warningText(w)) + '</li>'; }).join('') + '</ul></details>'
          : '<p class="small text-success-emphasis mb-2"><i class="bi bi-check-circle" aria-hidden="true"></i> ' + esc(T('i.noWarning')) + '</p>') +
        (ok ? '<div class="pg-mini-wrap" aria-label="' + esc(T('i.miniAria')) + '">' + PG.grid.miniature(d) + '</div>' : '<div class="alert alert-danger small mb-0">' + esc(T('i.nothing')) + '</div>');
    }

    // file
    $('[data-act="browse"]').addEventListener('click', function () {
      ui.readFile('.md,.markdown,.txt,text/markdown').then(function (f) { $('[data-filename]').textContent = f.name; $('#imp-text').value = f.text; preview(f.text, f.name); });
    });
    var drop = $('.pg-drop');
    box.addEventListener('dragover', function (e) { if (hasFiles(e)) { e.preventDefault(); drop.classList.add('is-over'); } });
    box.addEventListener('dragleave', function (e) { if (!box.contains(e.relatedTarget)) drop.classList.remove('is-over'); });
    box.addEventListener('drop', function (e) {
      if (!hasFiles(e)) return;
      e.preventDefault(); e.stopPropagation(); drop.classList.remove('is-over');
      var file = e.dataTransfer.files[0];
      if (!file) return;
      if (!ui.isTextFile(file)) { ui.toast(esc(T('i.badFile')), 'danger'); return; }
      tab('file');
      ui.readBlob(file).then(function (f) { $('[data-filename]').textContent = f.name; $('#imp-text').value = f.text; preview(f.text, f.name); });
    });
    // paste
    $('#imp-text').addEventListener('input', U.debounce(function () { preview($('#imp-text').value, null); }, 250));
    // url
    function doFetch() {
      var url = $('#imp-url').value.trim();
      if (!url) { $('#imp-url').focus(); return; }
      $('.pg-preview').innerHTML = '<div class="spinner-border spinner-border-sm" role="status"></div> ' + esc(T('i.loading'));
      fetchText(url).then(function (text) { $('#imp-text').value = text; preview(text, url); current.url = url; }, function (err) {
        $('.pg-preview').innerHTML = '<div class="alert alert-danger small mb-0">' + esc(err.message) + (err.hint ? '<br>' + esc(err.hint) : '') + '</div>';
      });
    }
    $('[data-act="fetch"]').addEventListener('click', doFetch);
    $('#imp-url').addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); doFetch(); } });

    $('[data-act="apply"]').addEventListener('click', function () {
      if (!current) return;
      var c = current;
      backup(T('h.beforeImport', { name: c.name || T('i.pasted') }));
      m.hide();
      PG.app.load(c.text, { keepSelection: !!opts.source });
      ui.toast('<i class="bi bi-check-circle" aria-hidden="true"></i> ' + esc(T(opts.source ? 'i.sourceApplied' : 'i.loaded', { title: S().doc.meta.title })), 'success');
    });

    if (opts.text != null) { tab(opts.tab || 'paste'); $('#imp-text').value = opts.text; preview(opts.text, opts.name || null); if (opts.name) $('[data-filename]').textContent = opts.name; }
    else tab(opts.tab || 'file');
    return m;
  }

  function hasFiles(e) { return e.dataTransfer && [].indexOf.call(e.dataTransfer.types || [], 'Files') >= 0; }

  /** Drop a .md anywhere on the page, or paste Markdown outside a field: opens the import preview. */
  function initGlobalImport() {
    var overlay = document.getElementById('drop-overlay'), depth = 0;
    window.addEventListener('dragenter', function (e) { if (!hasFiles(e) || document.querySelector('.modal.show')) return; e.preventDefault(); depth++; overlay.hidden = false; });
    window.addEventListener('dragover', function (e) { if (hasFiles(e)) e.preventDefault(); });
    window.addEventListener('dragleave', function (e) { if (!hasFiles(e)) return; depth = Math.max(0, depth - 1); if (!depth) overlay.hidden = true; });
    window.addEventListener('drop', function (e) {
      if (!hasFiles(e)) return;
      e.preventDefault(); depth = 0; overlay.hidden = true;
      if (document.querySelector('.modal.show')) return;
      var file = e.dataTransfer.files[0];
      if (!file) return;
      if (!ui.isTextFile(file)) { ui.toast(esc(T('i.badFile')), 'danger'); return; }
      ui.readBlob(file).then(function (f) { openImport({ tab: 'file', text: f.text, name: f.name }); });
    });
    document.addEventListener('paste', function (e) {
      var t = e.target;
      if (t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName)) || document.querySelector('.modal.show')) return;
      var text = e.clipboardData && e.clipboardData.getData('text/plain');
      if (!text || !/(^|\n)#{1,3}\s|perspective-grid\//.test(text)) return;
      e.preventDefault();
      openImport({ tab: 'paste', text: text });
    });
  }

  /* ------------------------------------------------------------------ export */

  function exportDialog() {
    var d = S().doc;
    var base = d.meta.version || 1;
    var next = base + 1;
    var slug = F.slugify(d.meta.title) || 'grille';
    var basedOn = d.meta.title + ' v' + base;
    var html = '<form class="modal-content" novalidate>' +
      '<div class="modal-header"><h2 class="modal-title h5"><i class="bi bi-filetype-md" aria-hidden="true"></i> ' + esc(T('x.title')) + '</h2>' +
      '<button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="' + esc(T('c.close')) + '"></button></div>' +
      '<div class="modal-body">' +
      '<p class="small text-body-secondary">' + esc(T('x.intro')) + '</p>' +
      '<div class="row g-3">' +
      '<div class="col-4 col-sm-3"><label class="form-label fw-semibold" for="x-version">' + esc(T('x.version')) + '</label><input class="form-control" id="x-version" type="number" min="1" step="1" value="' + next + '"></div>' +
      '<div class="col-8 col-sm-5"><label class="form-label fw-semibold" for="x-based">' + esc(T('x.basedOn')) + '</label><input class="form-control" id="x-based" maxlength="200" value="' + esc(basedOn) + '"></div>' +
      '<div class="col-sm-4"><label class="form-label fw-semibold" for="x-updated">' + esc(T('x.updated')) + '</label><input class="form-control" id="x-updated" type="date" value="' + U.today() + '"></div>' +
      '<div class="col-12"><label class="form-label fw-semibold" for="x-file">' + esc(T('x.file')) + '</label><input class="form-control font-monospace" id="x-file" maxlength="120" value="' + esc(slug + '-v' + next + '.md') + '"></div>' +
      '<div class="col-12"><div class="form-check"><input class="form-check-input" type="checkbox" id="x-adopt" checked><label class="form-check-label" for="x-adopt">' + esc(T('x.adopt')) + '</label></div></div>' +
      '<div class="col-12"><details><summary class="small">' + esc(T('x.preview')) + '</summary><textarea class="form-control font-monospace small mt-2 pg-source" rows="10" readonly id="x-md" aria-label="Markdown"></textarea></details></div>' +
      '</div></div>' +
      '<div class="modal-footer flex-wrap"><button type="button" class="btn btn-light" data-bs-dismiss="modal">' + esc(T('c.cancel')) + '</button>' +
      '<button type="button" class="btn btn-outline-primary" data-act="copy"><i class="bi bi-clipboard" aria-hidden="true"></i> ' + esc(T('x.copy')) + '</button>' +
      '<button type="submit" class="btn btn-accent"><i class="bi bi-download" aria-hidden="true"></i> ' + esc(T('x.download')) + '</button></div></form>';
    var m = ui.modal(html, { size: 'modal-lg' });
    var box = m.el, $ = function (s) { return box.querySelector(s); };
    function build() {
      var copy = U.clone(d);
      copy.meta.version = Math.max(1, parseInt($('#x-version').value, 10) || next);
      copy.meta.based_on = $('#x-based').value.trim() || null;
      copy.meta.updated = $('#x-updated').value || U.today();
      return copy;
    }
    function refresh() { $('#x-md').value = F.serialize(build()); }
    ['#x-version', '#x-based', '#x-updated'].forEach(function (s) { $(s).addEventListener('input', refresh); });
    $('#x-version').addEventListener('input', function () { $('#x-file').value = slug + '-v' + (parseInt($('#x-version').value, 10) || next) + '.md'; });
    refresh();
    function adopt(copy) {
      if (!$('#x-adopt').checked) return;
      S().doc.meta = copy.meta;
      PG.app.commit();
      PG.versions.save(S().md, T('h.exported', { v: copy.meta.version }));
      renderHistoryCount();
    }
    $('[data-act="copy"]').addEventListener('click', function () {
      var copy = build();
      ui.copy(F.serialize(copy)).then(function (ok) {
        ui.toast(esc(T(ok ? 'x.copied' : 'x.copyFailed')), ok ? 'success' : 'danger');
        if (ok) { adopt(copy); m.hide(); }
      });
    });
    $('form').addEventListener('submit', function (e) {
      e.preventDefault();
      var copy = build();
      var name = $('#x-file').value.trim() || (slug + '-v' + copy.meta.version + '.md');
      if (!/\.(md|markdown)$/i.test(name)) name += '.md';
      ui.downloadText(F.serialize(copy), name);
      adopt(copy);
      m.hide();
      ui.toast('<i class="bi bi-download" aria-hidden="true"></i> ' + esc(T('x.done', { file: name })), 'success');
    });
  }

  /* ------------------------------------------------------------------- share */

  function shareDialog() {
    var st = S();
    var html = '<div class="modal-content">' +
      '<div class="modal-header"><h2 class="modal-title h5"><i class="bi bi-share" aria-hidden="true"></i> ' + esc(T('s.title')) + '</h2>' +
      '<button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="' + esc(T('c.close')) + '"></button></div>' +
      '<div class="modal-body">' +
      '<div class="form-check mb-3"><input class="form-check-input" type="checkbox" id="s-sel"' + (st.selected.length >= 2 ? ' checked' : ' disabled') + '>' +
      '<label class="form-check-label" for="s-sel">' + esc(st.selected.length >= 2 ? T('s.withSelection', { n: st.selected.length }) : T('s.noSelection')) + '</label></div>' +
      '<div class="form-check mb-3"><input class="form-check-input" type="checkbox" id="s-stage"' + (PG.stage.params() ? ' checked' : ' disabled') + '>' +
      '<label class="form-check-label" for="s-stage">' + esc(PG.stage.params() ? T('s.withStage') : T('s.noStage')) + '</label></div>' +
      '<h3 class="h6 fw-bold"><i class="bi bi-link-45deg" aria-hidden="true"></i> ' + esc(T('s.embedTitle')) + '</h3>' +
      '<p class="small text-body-secondary mb-2">' + esc(T('s.embedIntro')) + '</p>' +
      '<textarea class="form-control font-monospace small" rows="3" readonly id="s-z" aria-label="' + esc(T('s.embedTitle')) + '"></textarea>' +
      '<div class="form-text" id="s-zlen"></div>' +
      '<div class="d-flex gap-2 mt-2 mb-4"><button type="button" class="btn btn-sm btn-accent" data-copy="s-z"><i class="bi bi-clipboard" aria-hidden="true"></i> ' + esc(T('s.copy')) + '</button>' +
      '<a class="btn btn-sm btn-light border" id="s-zopen" target="_blank" rel="noopener"><i class="bi bi-box-arrow-up-right" aria-hidden="true"></i> ' + esc(T('s.open')) + '</a></div>' +
      '<h3 class="h6 fw-bold"><i class="bi bi-cloud" aria-hidden="true"></i> ' + esc(T('s.srcTitle')) + '</h3>' +
      '<p class="small text-body-secondary mb-2">' + esc(T('s.srcIntro')) + '</p>' +
      '<input class="form-control mb-2" id="s-srcin" type="url" placeholder="https://…/grille.md" value="' + esc(st.sourceUrl || '') + '" aria-label="' + esc(T('s.srcLabel')) + '">' +
      '<textarea class="form-control font-monospace small" rows="2" readonly id="s-src" aria-label="' + esc(T('s.srcTitle')) + '"></textarea>' +
      '<div class="d-flex gap-2 mt-2"><button type="button" class="btn btn-sm btn-outline-primary" data-copy="s-src"><i class="bi bi-clipboard" aria-hidden="true"></i> ' + esc(T('s.copy')) + '</button></div>' +
      '</div><div class="modal-footer"><button type="button" class="btn btn-light" data-bs-dismiss="modal">' + esc(T('c.close')) + '</button></div></div>';
    var m = ui.modal(html, { size: 'modal-lg' });
    var box = m.el, $ = function (s) { return box.querySelector(s); };
    function params() {
      var q = '';
      if ($('#s-sel').checked) q += 'cols=' + encodeURIComponent(st.selected.join(',')) + (st.compact ? '&compact=1' : '');
      if ($('#s-stage').checked && PG.stage.params()) q += (q ? '&' : '') + PG.stage.params();
      return q;
    }
    function refresh() {
      var extra = params();
      var srcUrl = $('#s-srcin').value.trim();
      $('#s-src').value = srcUrl ? PG.share.baseUrl() + '?src=' + encodeURIComponent(srcUrl) + (extra ? '&' + extra : '') : '';
      if (!PG.share.supported()) { $('#s-z').value = T('s.unsupported'); return; }
      PG.share.encode(st.md).then(function (z) {
        var url = PG.share.baseUrl() + (extra ? '?' + extra : '') + '#z=' + z;
        $('#s-z').value = url;
        $('#s-zopen').href = url;
        $('#s-zlen').innerHTML = esc(T('s.length', { n: url.length.toLocaleString() })) + (url.length > 8000 ? ' <span class="text-warning-emphasis"><i class="bi bi-exclamation-triangle" aria-hidden="true"></i> ' + esc(T('s.long')) + '</span>' : '');
      });
    }
    $('#s-sel').addEventListener('change', refresh);
    $('#s-stage').addEventListener('change', refresh);
    $('#s-srcin').addEventListener('input', refresh);
    box.querySelectorAll('[data-copy]').forEach(function (b) {
      b.addEventListener('click', function () {
        var v = $('#' + b.getAttribute('data-copy')).value;
        if (!v) { $('#s-srcin').focus(); return; }
        ui.copy(v).then(function (ok) { ui.toast(esc(T(ok ? 's.copied' : 'x.copyFailed')), ok ? 'success' : 'danger'); });
      });
    });
    refresh();
  }

  /* ---------------------------------------------------------- start from URL
   *   ?src=<url of a .md>       hosted file (same site, or a site that allows CORS)
   *   #z=<…>                    whole grid compressed in the link
   *   ?md=<text>                raw Markdown (very short grids)
   *   ?ex=<example id>          bundled example
   *   &cols=a,b&compact=1       preselect columns (and compact comparison mode)
   */
  function fromUrl() {
    var q = new URLSearchParams(location.search), h = new URLSearchParams(location.hash.replace(/^#/, ''));
    var z = h.get('z'), raw = h.get('md') || q.get('md'), src = q.get('src') || q.get('url'), ex = q.get('ex');
    var view = { cols: (q.get('cols') || '').split(',').filter(Boolean), compact: q.get('compact') === '1' };
    if (z) {
      if (!PG.share.supported()) return Promise.reject(friendly(T('i.errUnsupported')));
      return PG.share.decode(z).then(function (md) { return { md: md, label: T('h.beforeLink'), view: view }; }, function () { throw friendly(T('i.errLink')); });
    }
    if (raw) return Promise.resolve({ md: raw, label: T('h.beforeLink'), view: view });
    if (src) return fetchText(src).then(function (md) { return { md: md, label: T('h.beforeLink'), view: view, url: src }; });
    if (ex) {
      var s = (PG.samples || []).filter(function (x) { return x.id === ex; })[0];
      return s ? Promise.resolve({ md: s.markdown, view: view }) : Promise.reject(friendly(T('i.errExample', { id: ex })));
    }
    return Promise.resolve(view.cols.length ? { view: view } : null);
  }

  PG.io = {
    backup: backup,
    renderHistory: renderHistory,
    renderHistoryCount: renderHistoryCount,
    snapshot: snapshot,
    openImport: openImport,
    initGlobalImport: initGlobalImport,
    exportDialog: exportDialog,
    shareDialog: shareDialog,
    fromUrl: fromUrl,
    warningText: warningText
  };
})(window.PG);
