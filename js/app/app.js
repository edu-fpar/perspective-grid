/*!
 * Regards croisés (perspective-grid) — application state, autosave, toolbar, settings, theme,
 * examples, badge drawer, keyboard shortcuts and start-up.
 */
(function (PG) {
  'use strict';

  var F = PG.format, U = PG.util, esc = U.escapeHtml, ui = PG.ui;
  function T(k, v) { return PG.i18n.t(k, v); }
  var $ = function (id) { return document.getElementById(id); };

  var state = {
    doc: F.emptyDoc(),
    md: '',
    warnings: [],
    selected: [],       // perspective ids selected for comparison (document order)
    src: null,          // { pid, key } comparison source
    expanded: {},       // open accordions
    focus: null,        // { pid, idx } active cell (roving tabindex)
    editing: false,
    compact: false,
    armed: null,        // badge applied by tapping cells
    sourceUrl: null,    // ?src= the grid was loaded from
    prefs: Object.assign({ patterns: false, links: true, ranks: true }, PG.store.get('prefs', {})),
    stage: PG.stage.defaults()   // presentation modes (spotlight, progressive reveal), see stage.js
  };
  var undoStack = [], redoStack = [];

  /* ------------------------------------------------------------ persistence */

  var saveDraft = U.debounce(function () {
    var ok = PG.store.set('draft', state.md);
    savedStatus(ok ? 'saved' : 'full');
  }, 500);

  function savedStatus(kind) {
    var el = $('saved');
    if (!el) return;
    if (kind === 'saved') el.innerHTML = '<i class="bi bi-cloud-check" aria-hidden="true"></i><span class="pg-hide-sm"> ' + esc(T('a.saved')) + '</span>';
    else if (kind === 'full') el.innerHTML = '<span class="text-danger-emphasis"><i class="bi bi-exclamation-octagon" aria-hidden="true"></i><span class="pg-hide-sm"> ' + esc(T('a.storageFull')) + '</span></span>';
    else el.innerHTML = '<i class="bi bi-pencil" aria-hidden="true"></i><span class="pg-hide-sm"> ' + esc(T('a.editing')) + '</span>';
    el.title = el.textContent.trim();
  }

  /** Call after any change of state.doc: serializes, saves locally (debounced), re-renders. */
  function commit(opts) {
    opts = opts || {};
    var md = F.serialize(state.doc);
    if (md === state.md && !opts.force) { render(); return; }
    if (!opts.noUndo && state.md) { undoStack.push(state.md); if (undoStack.length > 60) undoStack.shift(); redoStack = []; }
    state.md = md;
    savedStatus('editing');
    saveDraft();
    render();
  }

  /** Replaces the whole document (import, example, version, link). */
  function load(md, opts) {
    opts = opts || {};
    var res = F.parse(md);
    if (state.md) { undoStack.push(state.md); redoStack = []; }
    state.doc = res.doc;
    state.warnings = res.warnings;
    state.md = F.serialize(res.doc);
    state.expanded = {};
    state.src = null;
    state.focus = null;
    var ids = res.doc.perspectives.map(function (p) { return p.id; });
    state.selected = (opts.keepSelection ? state.selected : (opts.cols || [])).filter(function (id) { return ids.indexOf(id) >= 0; });
    state.compact = !!opts.compact && state.selected.length >= 2;
    state.sourceUrl = opts.url || null;
    if (opts.persist !== false) { PG.store.set('draft', state.md); savedStatus('saved'); }
    renderDocHead();
    render();
    if (state.stage.spot || state.stage.reveal !== 'off') PG.stage.reset();
    var sc = $('scroller');
    if (sc) { sc.scrollLeft = 0; sc.scrollTop = 0; }
  }

  function undo() {
    if (!undoStack.length) { ui.toast(esc(T('a.nothingToUndo')), 'secondary'); return; }
    redoStack.push(state.md);
    restoreMd(undoStack.pop());
    ui.announce(T('a.undone'));
  }
  function redo() {
    if (!redoStack.length) return;
    undoStack.push(state.md);
    restoreMd(redoStack.pop());
    ui.announce(T('a.redone'));
  }
  function restoreMd(md) {
    state.doc = F.parse(md).doc;
    state.md = md;
    var ids = state.doc.perspectives.map(function (p) { return p.id; });
    state.selected = state.selected.filter(function (id) { return ids.indexOf(id) >= 0; });
    saveDraft();
    renderDocHead();
    render();
  }

  /* --------------------------------------------------------------- render */

  function render() {
    renderDocHead();
    PG.grid.render();
  }

  function renderDocHead() {
    var d = state.doc;
    // display hint from the file: narrow / normal / wide columns
    document.body.setAttribute('data-columns', d.meta.columns || 'normal');
    var t = $('doc-title'), s = $('doc-subtitle');
    t.textContent = d.meta.title || '';
    s.textContent = d.meta.subtitle || '';
    s.hidden = !d.meta.subtitle && !state.editing;
    document.title = (d.meta.title ? d.meta.title + ' — ' : '') + T('a.brand');
    var intro = $('doc-intro-btn');
    intro.hidden = !d.intro;
    $('doc-intro').innerHTML = d.intro && !$('doc-intro').hidden ? PG.md(d.intro) : $('doc-intro').innerHTML;
    if (!d.intro) $('doc-intro').hidden = true;
    var w = $('warn-btn');
    w.hidden = !state.warnings.length;
    $('warn-count').textContent = state.warnings.length;
  }

  function updateToolbar() {
    var n = state.selected.length;
    var info = $('sel-info');
    info.innerHTML = n >= 2
      ? '<i class="bi bi-intersect" aria-hidden="true"></i> ' + esc(T('t.selN', { n: n }))
      : '<i class="bi bi-hand-index" aria-hidden="true"></i> <span class="pg-hide-xs">' + esc(n === 1 ? T('t.selOne') : T('t.selNone')) + '</span><span class="pg-show-xs">' + esc(n === 1 ? T('t.selOneShort') : T('t.selNoneShort')) + '</span>';
    var cmp = $('act-compact');
    cmp.disabled = n < 2;
    cmp.setAttribute('aria-pressed', state.compact ? 'true' : 'false');
    cmp.classList.toggle('active', state.compact);
    $('act-clear').hidden = !n;
    $('act-all').hidden = n === state.doc.perspectives.length || !state.doc.perspectives.length;
    document.body.classList.toggle('pg-compact', state.compact && n >= 2);
    document.body.classList.toggle('pg-editing', state.editing);
    document.body.classList.toggle('pg-patterns', !!state.prefs.patterns);
    document.body.classList.toggle('pg-no-ranks', !state.prefs.ranks);
    var eb = $('act-edit');
    eb.setAttribute('aria-pressed', state.editing ? 'true' : 'false');
    eb.classList.toggle('active', state.editing);
    $('edit-bar').hidden = !state.editing;
    $('act-undo').disabled = !undoStack.length;
    $('act-redo').disabled = !redoStack.length;
    var armed = $('armed-bar');
    armed.hidden = !state.armed;
    if (state.armed) {
      var bi = PG.grid.badgeInfo(state.doc, state.armed);
      $('armed-label').innerHTML = T('b.armed', { badge: '<strong><i class="bi ' + esc(bi.icon) + '" aria-hidden="true"></i> ' + esc(bi.label) + '</strong>' });
    }
  }

  function setEditing(on) {
    state.editing = !!on;
    state.armed = null;
    PG.store.set('editing', state.editing);
    render();
    ui.announce(T(state.editing ? 'a.editOn' : 'a.editOff'));
  }

  /* ---------------------------------------------------------------- theme */

  function applyTheme() {
    var pref = PG.store.get('theme', 'auto');
    var dark = pref === 'dark' || (pref === 'auto' && window.matchMedia && matchMedia('(prefers-color-scheme: dark)').matches);
    document.documentElement.setAttribute('data-bs-theme', dark ? 'dark' : 'light');
    document.querySelectorAll('input[name="theme"]').forEach(function (r) { r.checked = r.value === pref; });
    var ic = $('theme-icon');
    if (ic) ic.className = 'bi ' + (pref === 'auto' ? 'bi-circle-half' : dark ? 'bi-moon-stars' : 'bi-sun');
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.content = dark ? '#14132a' : '#1c1a36';
  }

  /* -------------------------------------------------------------- examples */

  function renderExamples() {
    var menu = $('examples-menu');
    menu.innerHTML = (PG.samples || []).map(function (s) {
      return '<li><button class="dropdown-item" type="button" data-example="' + esc(s.id) + '"><i class="bi bi-journal-text me-2" aria-hidden="true"></i>' + esc(s.title) + '</button></li>';
    }).join('') + '<li><hr class="dropdown-divider"></li><li><button class="dropdown-item" type="button" id="act-new"><i class="bi bi-file-earmark-plus me-2" aria-hidden="true"></i>' + esc(T('a.new')) + '</button></li>';
    menu.querySelectorAll('[data-example]').forEach(function (b) {
      b.addEventListener('click', function () {
        var s = PG.samples.filter(function (x) { return x.id === b.getAttribute('data-example'); })[0];
        if (!s) return;
        if (state.md === s.markdown) { ui.toast(esc(T('a.alreadyOpen')), 'secondary'); return; }
        PG.io.backup(T('h.beforeExample', { title: s.title }));
        load(s.markdown);
        ui.toast('<i class="bi bi-journal-text" aria-hidden="true"></i> ' + esc(T('a.exampleLoaded', { title: s.title })), 'primary');
      });
    });
    $('act-new').addEventListener('click', function () {
      ui.confirm(T('a.confirmNew'), { ok: T('a.new') }).then(function (ok) {
        if (!ok) return;
        PG.io.backup(T('h.beforeNew'));
        load(newDoc());
        setEditing(true);
      });
    });
  }

  function newDoc() {
    var d = F.emptyDoc();
    d.meta.title = T('a.newTitle');
    d.meta.lang = PG.i18n.lang();
    d.meta.updated = U.today();
    d.perspectives = [1, 2].map(function (n) {
      return { id: 'point-de-vue-' + n, title: T('a.newColumn', { n: n }), subtitle: null, summary: '', detail: '', cells: [] };
    });
    return F.serialize(d);
  }

  /* ---------------------------------------------------------- badge drawer */

  function renderDrawer() {
    var box = $('badge-list');
    var touch = window.matchMedia && matchMedia('(pointer: coarse)').matches;
    $('drawer-help').textContent = T(touch ? 'b.helpTouch' : 'b.helpMouse');
    box.innerHTML = PG.grid.badgeKeys(state.doc).map(function (k) {
      var bi = PG.grid.badgeInfo(state.doc, k);
      return '<button type="button" class="pg-chip' + (state.armed === k ? ' active' : '') + '" draggable="true" data-badge="' + esc(k) + '" aria-pressed="' + (state.armed === k) + '">' +
        '<i class="bi ' + esc(bi.icon) + '" aria-hidden="true"></i> ' + esc(bi.label) + '</button>';
    }).join('');
  }

  function initDrawer() {
    var box = $('badge-list');
    $('badges').addEventListener('show.bs.offcanvas', renderDrawer);
    box.addEventListener('dragstart', function (e) {
      var b = e.target.closest('[data-badge]');
      if (!b) return;
      e.dataTransfer.effectAllowed = 'copy';
      e.dataTransfer.setData('text/x-pg-badge', b.getAttribute('data-badge'));
      e.dataTransfer.setData('text/plain', b.textContent.trim());
    });
    box.addEventListener('click', function (e) {
      var b = e.target.closest('[data-badge]');
      if (!b) return;
      var k = b.getAttribute('data-badge');
      state.armed = state.armed === k ? null : k;
      renderDrawer();
      updateToolbar();
      if (state.armed) {
        var oc = bootstrap.Offcanvas.getInstance($('badges'));
        if (oc && window.innerWidth < 992) oc.hide();
        ui.announce(T('b.srArmed', { label: PG.grid.badgeInfo(state.doc, k).label }));
      }
    });
    $('act-disarm').addEventListener('click', function () { state.armed = null; updateToolbar(); renderDrawer(); });
  }

  /* --------------------------------------------------------- shortcuts help */

  function shortcuts() {
    var rows = [
      ['↑ ↓ ← →', T('k.nav')], [T('k.enter'), T('k.toggle')], ['1 … 6', T('k.states')], ['M', T('k.menu')], [T('k.esc'), T('k.escape')],
      ['Alt + ← →', T('k.moveCol')], ['E', T('k.edit')], ['Alt + ↑ ↓', T('k.moveCell')], ['F2', T('k.editCell')], [T('k.del'), T('k.deleteCell')],
      ['Ctrl + Z / Ctrl + Y', T('k.undo')], [T('k.pages'), T('k.stage')], ['Ctrl + S', T('k.snapshot')], ['?', T('k.help')]
    ];
    ui.modal('<div class="modal-content"><div class="modal-header"><h2 class="modal-title h5"><i class="bi bi-keyboard" aria-hidden="true"></i> ' + esc(T('k.title')) + '</h2>' +
      '<button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="' + esc(T('c.close')) + '"></button></div><div class="modal-body">' +
      '<table class="table table-sm align-middle mb-2"><tbody>' + rows.map(function (r) { return '<tr><th scope="row" class="text-nowrap"><kbd>' + esc(r[0]) + '</kbd></th><td>' + esc(r[1]) + '</td></tr>'; }).join('') +
      '</tbody></table><p class="small text-body-secondary mb-0">' + esc(T('k.note')) + '</p></div></div>');
  }

  function warningsDialog() {
    ui.modal('<div class="modal-content"><div class="modal-header"><h2 class="modal-title h5"><i class="bi bi-exclamation-triangle" aria-hidden="true"></i> ' + esc(T('a.warnTitle')) + '</h2>' +
      '<button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="' + esc(T('c.close')) + '"></button></div><div class="modal-body">' +
      '<p class="small">' + esc(T('a.warnIntro')) + '</p><ul class="small">' + state.warnings.map(function (w) { return '<li>' + esc(PG.io.warningText(w)) + '</li>'; }).join('') + '</ul></div>' +
      '<div class="modal-footer"><button type="button" class="btn btn-light" data-bs-dismiss="modal">' + esc(T('c.close')) + '</button>' +
      '<button type="button" class="btn btn-accent" data-act="fixed"><i class="bi bi-check2" aria-hidden="true"></i> ' + esc(T('a.warnClear')) + '</button></div></div>', {
      onShown: function (box) { box.querySelector('[data-act="fixed"]').onclick = function () { state.warnings = []; renderDocHead(); bootstrap.Modal.getInstance(box).hide(); }; }
    });
  }

  /* ------------------------------------------------------------------ init */

  function bind() {
    $('act-edit').addEventListener('click', function () { setEditing(!state.editing); });
    $('act-done').addEventListener('click', function () { setEditing(false); });
    $('act-compact').addEventListener('click', function () {
      state.compact = !state.compact;
      render();
      ui.announce(T(state.compact ? 'a.compactOn' : 'a.compactOff'));
    });
    $('act-clear').addEventListener('click', function () { state.selected = []; state.compact = false; state.src = null; render(); ui.announce(T('a.selCleared')); });
    $('act-all').addEventListener('click', function () { state.selected = state.doc.perspectives.map(function (p) { return p.id; }); render(); ui.announce(T('g.srSelected', { title: '', n: state.selected.length })); });
    $('act-import').addEventListener('click', function () { PG.io.openImport({ tab: 'file' }); });
    $('act-paste').addEventListener('click', function () { PG.io.openImport({ tab: 'paste' }); });
    $('act-url').addEventListener('click', function () { PG.io.openImport({ tab: 'url' }); });
    $('act-source').addEventListener('click', function () { PG.io.openImport({ tab: 'paste', text: state.md, title: T('a.source'), source: true }); });
    $('act-export').addEventListener('click', PG.io.exportDialog);
    $('act-share').addEventListener('click', PG.io.shareDialog);
    $('act-snapshot').addEventListener('click', PG.io.snapshot);
    $('act-doc').addEventListener('click', PG.edit.editDoc);
    $('act-add-col').addEventListener('click', PG.edit.addColumn);
    $('act-undo').addEventListener('click', undo);
    $('act-redo').addEventListener('click', redo);
    $('act-keys').addEventListener('click', shortcuts);
    var lg = PG.i18n.lang() === 'fr' ? 'fr' : 'en';
    $('link-docs').href = 'docs/index.html?lang=' + lg;
    $('link-ai').href = 'docs/index.html?lang=' + lg + '#' + (lg === 'fr' ? 'fr-ia' : 'en-ai');
    $('warn-btn').addEventListener('click', warningsDialog);
    $('history').addEventListener('show.bs.offcanvas', PG.io.renderHistory);
    $('doc-intro-btn').addEventListener('click', function () {
      var box = $('doc-intro'), open = box.hidden;
      if (open) box.innerHTML = PG.md(state.doc.intro);
      box.hidden = !open;
      this.setAttribute('aria-expanded', open);
    });
    $('doc-title').addEventListener('dblclick', function () { if (state.editing) PG.edit.inline(this); });
    $('doc-subtitle').addEventListener('dblclick', function () { if (state.editing) PG.edit.inline(this); });

    // settings
    document.querySelectorAll('input[name="theme"]').forEach(function (r) {
      r.addEventListener('change', function () { PG.store.set('theme', r.value); applyTheme(); setTimeout(PG.grid.drawLinks, 50); });
    });
    if (window.matchMedia) matchMedia('(prefers-color-scheme: dark)').addEventListener('change', applyTheme);
    ['patterns', 'links', 'ranks'].forEach(function (k) {
      var cb = $('pref-' + k);
      cb.checked = !!state.prefs[k];
      cb.addEventListener('change', function () { state.prefs[k] = cb.checked; PG.store.set('prefs', state.prefs); updateToolbar(); PG.grid.drawLinks(); });
    });
    document.querySelectorAll('[data-lang]').forEach(function (b) {
      b.classList.toggle('active', b.getAttribute('data-lang') === PG.i18n.lang());
      b.addEventListener('click', function () { PG.i18n.setLang(b.getAttribute('data-lang')); location.reload(); });
    });

    // undo button inside toasts
    document.addEventListener('click', function (e) { if (e.target.closest('[data-undo]')) { undo(); var t = e.target.closest('.toast'); if (t) bootstrap.Toast.getOrCreateInstance(t).hide(); } });

    // global shortcuts
    document.addEventListener('keydown', function (e) {
      var t = e.target;
      var typing = t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName));
      var mod = e.ctrlKey || e.metaKey;
      if (mod && e.key.toLowerCase() === 's') { e.preventDefault(); PG.io.snapshot(); return; }
      if (typing || document.querySelector('.modal.show')) return;
      if (mod && !e.shiftKey && e.key.toLowerCase() === 'z') { e.preventDefault(); undo(); return; }
      if (mod && (e.key.toLowerCase() === 'y' || (e.shiftKey && e.key.toLowerCase() === 'z'))) { e.preventDefault(); redo(); return; }
      if (mod || e.altKey) return;
      if (e.key === '?') { e.preventDefault(); shortcuts(); }
      else if (e.key === 'e' || e.key === 'E') { e.preventDefault(); setEditing(!state.editing); }
      else if (e.key === 'Escape') {
        if (state.armed) { state.armed = null; updateToolbar(); }
        else if (state.src) PG.grid.setSource(null);
        else if (state.compact) { state.compact = false; render(); }
      }
    });
  }

  function start() {
    PG.i18n.apply(document);
    applyTheme();
    var query = new URLSearchParams(location.search);
    if (query.get('presenter')) { PG.stage.startPresenter(); return; }
    bind();
    PG.stage.initBar();
    renderExamples();
    initDrawer();
    PG.grid.init();
    PG.edit.init();
    PG.io.initGlobalImport();
    PG.io.renderHistoryCount();
    state.editing = !!PG.store.get('editing', false) && window.innerWidth >= 768;

    var draft = PG.store.get('draft', null);
    PG.io.fromUrl().then(function (res) {
      if (res && res.md) {
        if (draft && draft !== res.md) { state.md = draft; PG.io.backup(res.label || T('h.beforeLink')); }
        state.md = '';
        load(res.md, { cols: res.view.cols, compact: res.view.compact, url: res.url });
        if (res.label) ui.toast('<i class="bi bi-link-45deg" aria-hidden="true"></i> ' + esc(T('a.linkLoaded', { title: state.doc.meta.title })), 'primary');
      } else {
        load(draft || (PG.samples && PG.samples[0] ? PG.samples[0].markdown : newDoc()), res && res.view ? { cols: res.view.cols, compact: res.view.compact, persist: !!draft } : { persist: !!draft });
        if (!draft) PG.store.set('draft', state.md);
        savedStatus('saved');
      }
      undoStack = [];
      PG.stage.fromParams(query);
      updateToolbar();
    }).catch(function (err) {
      load(draft || PG.samples[0].markdown);
      undoStack = [];
      ui.modal('<div class="modal-content"><div class="modal-header"><h2 class="modal-title h5 text-danger-emphasis"><i class="bi bi-exclamation-triangle" aria-hidden="true"></i> ' + esc(T('i.errTitle')) + '</h2>' +
        '<button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="' + esc(T('c.close')) + '"></button></div><div class="modal-body"><p>' + esc(err.message) + '</p>' +
        (err.hint ? '<p class="small text-body-secondary">' + esc(err.hint) + '</p>' : '') + '<p class="small mb-0">' + esc(T('i.errShowing')) + '</p></div></div>');
    });
  }

  PG.app = {
    state: state,
    commit: commit,
    load: load,
    render: render,
    updateToolbar: updateToolbar,
    setEditing: setEditing,
    undo: undo
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})(window.PG);
