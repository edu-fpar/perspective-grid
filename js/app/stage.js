/*!
 * Presentation modes, to limit cognitive load:
 *  - spotlight ("À la une"): one active column, the others are greyed out; inside it, the open cell stands out;
 *  - progressive reveal ("veil"): cells are faded until clicked;
 *  - from scratch ("zero"): only the first header and the empty card shapes are visible;
 * plus a step sequence (column by column, rank by rank, element by element), a presenter bar
 * (PageDown/PageUp work with presentation clickers) and a presenter window synced with BroadcastChannel.
 * Nothing here changes the document: reveal state lives in memory only.
 */
(function (PG) {
  'use strict';

  var F = PG.format, esc = PG.util.escapeHtml;
  function T(k, v) { return PG.i18n.t(k, v); }
  function S() { return PG.app.state; }
  function ST() { return PG.app.state.stage; }
  var $ = function (id) { return document.getElementById(id); };
  var SEP = '\u0001';

  function hid(pid) { return 'h' + SEP + pid; }
  function cid(pid, key) { return 'c' + SEP + pid + SEP + key; }

  function defaults() {
    return { spot: false, reveal: 'off', order: 'column', focus: null, revealed: {}, history: [], peek: false, fresh: {} };
  }

  /** Is any presentation effect visible? (edit mode suspends them) */
  function on() { var st = ST(); return !S().editing && (st.spot || st.reveal !== 'off'); }
  function revealOn() { return !S().editing && ST().reveal !== 'off'; }

  function cellView(pid, key) {
    if (!revealOn()) return 'shown';
    if (ST().revealed[cid(pid, key)]) return 'shown';
    return ST().reveal === 'zero' ? 'masked' : 'veiled';
  }
  function headView(pid) {
    if (!revealOn() || ST().reveal !== 'zero') return 'shown';
    return ST().revealed[hid(pid)] ? 'shown' : 'masked';
  }
  function columnFullyShown(p) {
    if (!revealOn()) return true;
    return headView(p.id) === 'shown' && p.cells.every(function (c) { return c.spacer || cellView(p.id, c.key) === 'shown'; });
  }

  /* ---------------------------------------------------------------- steps */

  function realCells(p) { return p.cells.filter(function (c) { return !c.spacer; }); }

  /** Pure: the reveal sequence for a document and stage settings. Each step = { ids, label, pid? }. */
  function buildSteps(doc, st) {
    var ps = doc.perspectives, steps = [], zero = st.reveal === 'zero';
    if (st.reveal === 'off') {
      // spotlight only: one step per column
      return ps.map(function (p) { return { ids: [], label: T('st.colStep', { col: p.title }), pid: p.id, focusOnly: true }; });
    }
    if (st.order === 'column') {
      ps.forEach(function (p) {
        if (zero) steps.push({ ids: [hid(p.id)], label: T('st.headStep', { col: p.title }), pid: p.id });
        realCells(p).forEach(function (c, i) {
          steps.push({ ids: [cid(p.id, c.key)], label: T('st.cellStep', { col: p.title, n: i + 1, title: F.cellTitle(doc, c) }), pid: p.id });
        });
      });
    } else {
      if (zero && ps.length) steps.push({ ids: ps.map(function (p) { return hid(p.id); }), label: T('st.headersStep') });
      if (st.order === 'rank') {
        var max = Math.max.apply(null, [0].concat(ps.map(function (p) { return realCells(p).length; })));
        for (var r = 0; r < max; r++) {
          var ids = [];
          ps.forEach(function (p) { var c = realCells(p)[r]; if (c) ids.push(cid(p.id, c.key)); });
          steps.push({ ids: ids, label: T('st.rankStep', { n: r + 1 }) });
        }
      } else { // element by element, in catalog order
        doc.elements.forEach(function (e) {
          var ids = ps.filter(function (p) { return p.cells.some(function (c) { return c.key === e.key; }); }).map(function (p) { return cid(p.id, e.key); });
          if (ids.length) steps.push({ ids: ids, label: T('st.elementStep', { title: e.title, n: ids.length }) });
        });
      }
    }
    return steps;
  }
  function steps() { return buildSteps(S().doc, ST()); }

  function nextIndex(list, revealed) {
    for (var i = 0; i < list.length; i++) {
      if (list[i].focusOnly) continue;
      if (list[i].ids.some(function (id) { return !revealed[id]; })) return i;
    }
    return -1;
  }
  function progress() {
    var list = steps(), all = {}, n = 0;
    list.forEach(function (s) { s.ids.forEach(function (id) { all[id] = true; }); });
    var keys = Object.keys(all);
    keys.forEach(function (id) { if (ST().revealed[id]) n++; });
    return { done: n, total: keys.length, steps: list, next: nextIndex(list, ST().revealed) };
  }

  /* --------------------------------------------------------------- actions */

  function reveal(ids, opts) {
    opts = opts || {};
    var st = ST(), added = [];
    ids.forEach(function (id) { if (!st.revealed[id]) { st.revealed[id] = true; added.push(id); } });
    if (!added.length) return false;
    st.history.push(added);
    st.fresh = {};
    added.forEach(function (id) { st.fresh[id] = true; });
    if (opts.pid && st.spot) st.focus = opts.pid;
    refresh();
    scrollTo(added);
    return true;
  }

  function scrollTo(ids) {
    var last = ids[ids.length - 1];
    if (!last) return;
    var parts = last.split(SEP), sel;
    if (parts[0] === 'h') sel = '#grid .pg-col[data-pid="' + cssEsc(parts[1]) + '"] .pg-head';
    else sel = '#grid .pg-col[data-pid="' + cssEsc(parts[1]) + '"] .pg-cell[data-key="' + cssEsc(parts[2]) + '"]';
    var el = document.querySelector(sel);
    if (el) el.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: PG.util.reducedMotion() ? 'auto' : 'smooth' });
  }
  function cssEsc(s) { return window.CSS && CSS.escape ? CSS.escape(s) : String(s).replace(/["\\]/g, '\\$&'); }

  function next() {
    var st = ST(), list = steps();
    if (!revealOn()) { moveFocus(1); return; }
    var i = nextIndex(list, st.revealed);
    if (i < 0) { PG.ui.toast(esc(T('st.allDone')), 'secondary'); return; }
    var s = list[i];
    reveal(s.ids, { pid: s.pid });
    PG.ui.announce(T('st.srRevealed', { label: s.label }));
  }
  function prev() {
    var st = ST();
    if (!revealOn()) { moveFocus(-1); return; }
    var last = st.history.pop();
    if (!last) return;
    last.forEach(function (id) { delete st.revealed[id]; });
    st.fresh = {};
    refresh();
    PG.ui.announce(T('st.srHidden'));
  }
  function goto(index) {
    var st = ST(), list = steps();
    st.revealed = {}; st.history = []; st.fresh = {};
    for (var i = 0; i <= index && i < list.length; i++) {
      var added = list[i].ids.filter(function (id) { return !st.revealed[id]; });
      added.forEach(function (id) { st.revealed[id] = true; });
      if (added.length) st.history.push(added);
      if (i === index) { added.forEach(function (id) { st.fresh[id] = true; }); if (list[i].pid && st.spot) st.focus = list[i].pid; }
    }
    if (!revealOn() && list[index]) st.focus = list[index].pid;
    refresh();
  }
  function revealAll() {
    var st = ST(), all = [];
    steps().forEach(function (s) { s.ids.forEach(function (id) { if (!st.revealed[id]) all.push(id); }); });
    if (all.length) { all.forEach(function (id) { st.revealed[id] = true; }); st.history.push(all); }
    st.fresh = {};
    refresh();
  }
  function reset() {
    var st = ST();
    st.revealed = {}; st.history = []; st.fresh = {};
    var ps = S().doc.perspectives;
    if (st.spot) st.focus = ps[0] ? ps[0].id : null;
    // from scratch: the first header is visible from the start
    if (st.reveal === 'zero' && ps[0]) { st.revealed[hid(ps[0].id)] = true; }
    S().src = null;
    S().expanded = {};
    refresh();
  }

  function moveFocus(dir) {
    var ps = S().doc.perspectives.filter(function (p) { return !document.querySelector('#grid .pg-col[data-pid="' + cssEsc(p.id) + '"][hidden]'); });
    if (!ps.length) return;
    var ids = ps.map(function (p) { return p.id; });
    var i = ids.indexOf(ST().focus);
    var j = i < 0 ? 0 : Math.max(0, Math.min(ids.length - 1, i + dir));
    setFocus(ids[j], true);
  }
  function setFocus(pid, scroll) {
    var st = ST();
    if (st.focus === pid) return;
    st.focus = pid;
    applyClasses();
    renderBar();
    broadcast();
    var p = S().doc.perspectives.filter(function (x) { return x.id === pid; })[0];
    if (p) PG.ui.announce(T('st.srFocus', { col: p.title }));
    if (scroll) {
      var col = document.querySelector('#grid .pg-col[data-pid="' + cssEsc(pid) + '"]');
      if (col) col.scrollIntoView({ inline: 'center', block: 'nearest', behavior: PG.util.reducedMotion() ? 'auto' : 'smooth' });
    }
  }

  function setSettings(patch) {
    var st = ST(), wasReveal = st.reveal, wasOrder = st.order;
    Object.keys(patch).forEach(function (k) { st[k] = patch[k]; });
    if (st.spot && !st.focus && S().doc.perspectives[0]) st.focus = S().doc.perspectives[0].id;
    if (st.reveal !== wasReveal || (st.order !== wasOrder && st.reveal !== 'off')) { reset(); return; }
    refresh();
  }
  function exit() { setSettings({ spot: false, reveal: 'off' }); }

  function refresh() { PG.app.render(); }

  /* ------------------------------------------------------ grid integration */

  /** Called by the grid after each render: column classes, bar, presenter sync. */
  function afterRender() {
    applyClasses();
    renderBar();
    broadcast();
    var st = ST();
    if (Object.keys(st.fresh).length) setTimeout(function () { st.fresh = {}; }, 0);
  }

  function applyClasses() {
    var st = ST(), active = on(), b = document.body;
    b.classList.toggle('pg-stage-spot', active && st.spot);
    b.classList.toggle('pg-stage-veil', revealOn() && st.reveal === 'veil');
    b.classList.toggle('pg-stage-zero', revealOn() && st.reveal === 'zero');
    // rank / element orders reveal across columns: the spotlight then follows the last step (a "row")
    var rowSpot = active && st.spot && revealOn() && st.order !== 'column';
    b.classList.toggle('pg-stage-spot', active && st.spot && !rowSpot);
    b.classList.toggle('pg-stage-row', rowSpot);
    document.querySelectorAll('#grid .pg-spot-row').forEach(function (x) { x.classList.remove('pg-spot-row'); });
    if (rowSpot) {
      (st.history[st.history.length - 1] || []).forEach(function (id) {
        var parts = id.split(SEP);
        if (parts[0] !== 'c') return;
        var el = document.querySelector('#grid .pg-col[data-pid="' + cssEsc(parts[1]) + '"] .pg-cell[data-key="' + cssEsc(parts[2]) + '"]');
        if (el) el.classList.add('pg-spot-row');
      });
    }
    var keep = {};
    if (st.focus) keep[st.focus] = true;
    if (S().selected.length >= 2) S().selected.forEach(function (id) { keep[id] = true; });
    document.querySelectorAll('#grid .pg-col[data-pid]').forEach(function (col) {
      var pid = col.getAttribute('data-pid');
      var dim = active && st.spot && !rowSpot && !keep[pid];
      col.classList.toggle('pg-dim', dim);
      col.classList.toggle('is-focus', active && st.spot && !rowSpot && pid === st.focus);
    });
  }

  /** Click on a cell that is not shown: reveal it (and its header). Returns true when consumed. */
  function onCellClick(li) {
    var pid = li.getAttribute('data-pid'), key = li.getAttribute('data-key');
    var st = ST();
    if (on() && st.spot && st.focus !== pid) setFocus(pid, false);
    if (!key || cellView(pid, key) === 'shown') return false;
    var ids = [cid(pid, key)];
    if (headView(pid) !== 'shown') ids.unshift(hid(pid));
    reveal(ids, { pid: pid });
    var c = S().doc.perspectives.filter(function (p) { return p.id === pid; })[0].cells.filter(function (x) { return x.key === key; })[0];
    PG.ui.announce(T('st.srRevealed', { label: F.cellTitle(S().doc, c) }));
    return true;
  }
  /** Click on a header: reveal it if masked, or put it in the spotlight. Returns true when consumed. */
  function onHeadClick(pid) {
    if (!on()) return false;
    if (headView(pid) !== 'shown') { reveal([hid(pid)], { pid: pid }); return true; }
    if (ST().spot) { setFocus(pid, true); return true; }
    return false;
  }

  /** Placeholder markup for a cell that is veiled (blurred) or masked (empty shape). */
  function cellPlaceholder(doc, p, c, ci, rank, view) {
    var title = F.cellTitle(doc, c);
    return '<li class="pg-cell pg-hidden-cell ' + (view === 'veiled' ? 'pg-veiled' : 'pg-masked') + '" data-pid="' + esc(p.id) + '" data-idx="' + ci + '" data-key="' + esc(c.key) + '" data-rank="' + rank + '">' +
      '<div class="pg-cell-row"><span class="pg-rank" aria-hidden="true">' + rank + '</span>' +
      '<button type="button" class="pg-cell-toggle" data-act="toggle" tabindex="-1" aria-label="' + esc(T(view === 'veiled' ? 'st.veiledSr' : 'st.maskedSr', { n: rank })) + '">' +
      (view === 'veiled' ? '<span class="pg-cell-title pg-blur" aria-hidden="true">' + esc(title) + '</span>'
        : '<span class="pg-ph" aria-hidden="true" style="width:' + (45 + (title.length * 7) % 45) + '%"></span>') +
      '</button></div></li>';
  }
  function headPlaceholder(p, pi, headingId) {
    return '<header class="pg-head pg-head-masked" data-pid="' + esc(p.id) + '">' +
      '<button type="button" class="pg-head-reveal" data-act="reveal-head">' +
      '<span class="visually-hidden" id="' + headingId + '">' + esc(T('st.maskedHeadSr', { n: pi + 1 })) + '</span>' +
      '<span class="pg-ph pg-ph-lg" aria-hidden="true"></span><span class="pg-ph" aria-hidden="true" style="width:55%"></span>' +
      '<span class="pg-ph" aria-hidden="true" style="width:85%"></span><span class="pg-ph" aria-hidden="true" style="width:70%"></span></button></header>';
  }
  function freshClass(id) { return ST().fresh[id] ? ' pg-revealed' : ''; }

  /* -------------------------------------------------------------- the bar */

  function renderBar() {
    var bar = $('stage-bar');
    if (!bar) return;
    var st = ST(), active = on();
    bar.hidden = !active;
    var btn = $('act-stage');
    if (btn) { btn.classList.toggle('active', active); btn.setAttribute('aria-pressed', active ? 'true' : 'false'); }
    syncMenu();
    if (!active) return;
    var pr = progress();
    var label = $('st-progress'), peek = $('st-peek-text');
    if (revealOn()) {
      label.textContent = T('st.progress', { done: pr.done, total: pr.total });
      $('st-next').disabled = pr.next < 0;
      $('st-prev').disabled = !st.history.length;
      peek.textContent = pr.next < 0 ? T('st.allDone') : T('st.nextIs', { label: pr.steps[pr.next].label });
    } else {
      var ps = S().doc.perspectives, i = ps.map(function (p) { return p.id; }).indexOf(st.focus);
      label.textContent = i >= 0 ? T('st.focusProgress', { col: ps[i].title, n: i + 1, total: ps.length }) : '';
      $('st-next').disabled = i >= ps.length - 1;
      $('st-prev').disabled = i <= 0;
      peek.textContent = ps[i + 1] ? T('st.nextIs', { label: ps[i + 1].title }) : '';
    }
    $('st-next-label').textContent = revealOn() ? T('st.next') : T('st.nextCol');
    $('st-all').hidden = $('st-reset').hidden = !revealOn();
    $('st-peek').setAttribute('aria-pressed', st.peek ? 'true' : 'false');
    $('st-peek').classList.toggle('active', st.peek);
    peek.hidden = !st.peek;
  }

  function syncMenu() {
    var st = ST();
    var sp = $('stg-spot'); if (sp) sp.checked = st.spot;
    document.querySelectorAll('input[name="stg-reveal"]').forEach(function (r) { r.checked = r.value === st.reveal; });
    document.querySelectorAll('input[name="stg-order"]').forEach(function (r) { r.checked = r.value === st.order; r.disabled = st.reveal === 'off'; });
  }

  function initBar() {
    $('stg-spot').addEventListener('change', function () { setSettings({ spot: this.checked }); });
    document.querySelectorAll('input[name="stg-reveal"]').forEach(function (r) { r.addEventListener('change', function () { setSettings({ reveal: r.value }); }); });
    document.querySelectorAll('input[name="stg-order"]').forEach(function (r) { r.addEventListener('change', function () { setSettings({ order: r.value }); }); });
    $('stg-presenter').addEventListener('click', openPresenter);
    $('st-presenter').addEventListener('click', openPresenter);
    $('st-next').addEventListener('click', next);
    $('st-prev').addEventListener('click', prev);
    $('st-all').addEventListener('click', revealAll);
    $('st-reset').addEventListener('click', reset);
    $('st-exit').addEventListener('click', exit);
    $('st-peek').addEventListener('click', function () { ST().peek = !ST().peek; renderBar(); });

    // presentation clickers send PageDown / PageUp; arrows work when the focus is not in the grid
    document.addEventListener('keydown', function (e) {
      if (!on() || e.ctrlKey || e.metaKey || e.altKey) return;
      var t = e.target;
      if (t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName)) || document.querySelector('.modal.show') || PG.ui.menu.isOpen()) return;
      var outsideGrid = !(t && t.closest && t.closest('#grid'));
      if (e.key === 'PageDown' || e.key === 'n' || e.key === 'N' || (outsideGrid && (e.key === 'ArrowRight' || e.key === 'ArrowDown'))) { e.preventDefault(); next(); }
      else if (e.key === 'PageUp' || e.key === 'p' || e.key === 'P' || (outsideGrid && (e.key === 'ArrowLeft' || e.key === 'ArrowUp'))) { e.preventDefault(); prev(); }
    });
    initChannel();
  }

  /* ------------------------------------------------------- presenter window */

  var channel = null, presenterWin = null;
  function initChannel() {
    if (typeof BroadcastChannel !== 'function') return;
    channel = new BroadcastChannel('pg-stage');
    channel.onmessage = function (e) {
      var m = e.data || {};
      if (m.type === 'hello') broadcast(true);
      else if (m.type === 'cmd') {
        if (m.cmd === 'next') next();
        else if (m.cmd === 'prev') prev();
        else if (m.cmd === 'all') revealAll();
        else if (m.cmd === 'reset') reset();
        else if (m.cmd === 'goto') goto(m.index);
        else if (m.cmd === 'settings') setSettings(m.patch);
      }
    };
  }
  var lastSent = '';
  function broadcast(force) {
    if (!channel) return;
    var st = ST();
    var msg = { type: 'state', md: S().md, editing: S().editing,
      stage: { spot: st.spot, reveal: st.reveal, order: st.order, focus: st.focus, revealed: Object.keys(st.revealed), history: st.history.length } };
    var key = JSON.stringify(msg);
    if (!force && key === lastSent) return;
    lastSent = key;
    channel.postMessage(msg);
  }
  function openPresenter() {
    if (!channel) { PG.ui.toast(esc(T('st.noChannel')), 'danger'); return; }
    if (!on()) setSettings({ reveal: 'zero', spot: true });
    presenterWin = window.open(PG.share.baseUrl() + '?presenter=1', 'pg-presenter', 'width=560,height=820');
    if (!presenterWin) PG.ui.toast(esc(T('st.popupBlocked')), 'warning');
  }

  /** Presenter window: full content, step plan, notes, remote controls. */
  function startPresenter() {
    document.body.classList.add('pg-presenter-mode');
    var root = $('presenter');
    root.hidden = false;
    var doc = null, st = defaults(), stepsList = [];
    if (typeof BroadcastChannel !== 'function') { root.innerHTML = '<p class="p-4">' + esc(T('st.noChannel')) + '</p>'; return; }
    var ch = new BroadcastChannel('pg-stage');
    function cmd(c, extra) { ch.postMessage(Object.assign({ type: 'cmd', cmd: c }, extra || {})); }
    ch.onmessage = function (e) {
      var m = e.data || {};
      if (m.type !== 'state') return;
      doc = F.parse(m.md).doc;
      st = Object.assign(defaults(), m.stage, { revealed: {} });
      m.stage.revealed.forEach(function (id) { st.revealed[id] = true; });
      st.editing = m.editing;
      draw();
    };
    root.innerHTML = '<div class="pg-pres-wait"><div class="spinner-border text-secondary" role="status"></div><p>' + esc(T('st.waiting')) + '</p></div>';
    ch.postMessage({ type: 'hello' });
    setTimeout(function () { if (!doc) root.querySelector('.pg-pres-wait p').textContent = T('st.noMain'); }, 2500);

    function notes(ids) {
      return ids.map(function (id) {
        var parts = id.split(SEP), p = doc.perspectives.filter(function (x) { return x.id === parts[1]; })[0];
        if (!p) return '';
        if (parts[0] === 'h') return '<div class="pg-note"><div class="pg-note-head"><i class="bi bi-layout-three-columns" aria-hidden="true"></i> <strong>' + esc(p.title) + '</strong>' +
          (p.subtitle ? ' <em>' + esc(p.subtitle) + '</em>' : '') + '</div>' + (p.summary ? '<div class="pg-prose small">' + PG.md(p.summary) + '</div>' : '') + '</div>';
        var c = p.cells.filter(function (x) { return x.key === parts[2]; })[0];
        if (!c) return '';
        var el = F.element(doc, c.key);
        var badges = (c.badges || []).map(function (b) { var bi = PG.grid.badgeInfo(doc, b); return '<span class="pg-badge"><i class="bi ' + esc(bi.icon) + '" aria-hidden="true"></i> ' + esc(bi.label) + '</span>'; }).join(' ');
        return '<div class="pg-note s-' + c.state + '"><div class="pg-note-head"><span class="pg-rank">' + F.rankOfKey(p, c.key) + '</span> <strong>' + esc(F.cellTitle(doc, c)) + '</strong> <span class="text-body-secondary small">· ' + esc(p.title) + '</span>' +
          (c.state !== 'default' ? ' <span class="badge text-bg-light border"><i class="bi ' + PG.grid.STATE_ICONS[c.state] + ' pg-ico-' + c.state + '" aria-hidden="true"></i> ' + esc(T('state.' + c.state)) + '</span>' : '') + '</div>' +
          (badges ? '<div class="my-1">' + badges + '</div>' : '') +
          '<div class="pg-prose small">' + PG.md(c.detail || (el && el.detail) || '') + '</div></div>';
      }).join('');
    }

    function draw() {
      document.title = T('st.presenterTitle') + ' — ' + doc.meta.title;
      var revealMode = st.reveal !== 'off' && !st.editing;
      stepsList = buildSteps(doc, st);
      var nx = revealMode ? nextIndex(stepsList, st.revealed) : -1;
      var focusIdx = doc.perspectives.map(function (p) { return p.id; }).indexOf(st.focus);
      var all = {}, done = 0;
      stepsList.forEach(function (s) { s.ids.forEach(function (id) { all[id] = true; }); });
      Object.keys(all).forEach(function (id) { if (st.revealed[id]) done++; });
      var current = revealMode ? (nx < 0 ? stepsList.length - 1 : nx - 1) : focusIdx;
      var upcoming = revealMode ? nx : focusIdx + 1;
      root.innerHTML =
        '<header class="pg-pres-head"><div><div class="small text-body-secondary">' + esc(T('st.presenterTitle')) + '</div><h1 class="h5 mb-0">' + esc(doc.meta.title) + '</h1></div>' +
        '<span class="pg-pres-count">' + esc(revealMode ? T('st.progress', { done: done, total: Object.keys(all).length }) : (focusIdx >= 0 ? T('st.focusProgress', { col: doc.perspectives[focusIdx].title, n: focusIdx + 1, total: doc.perspectives.length }) : '')) + '</span></header>' +
        (st.editing ? '<div class="alert alert-warning small m-3">' + esc(T('st.editingNote')) + '</div>' : '') +
        (!st.spot && st.reveal === 'off' ? '<div class="alert alert-info small m-3">' + esc(T('st.offNote')) + '</div>' : '') +
        '<div class="pg-pres-ctrl">' +
        '<button type="button" class="btn btn-light border btn-lg" data-c="prev"><i class="bi bi-chevron-left" aria-hidden="true"></i><span class="visually-hidden">' + esc(T('st.prev')) + '</span></button>' +
        '<button type="button" class="btn btn-accent btn-lg flex-grow-1" data-c="next"' + (revealMode && nx < 0 ? ' disabled' : '') + '>' + esc(revealMode ? T('st.next') : T('st.nextCol')) + ' <i class="bi bi-chevron-right" aria-hidden="true"></i></button></div>' +
        (revealMode ? '<div class="pg-pres-ctrl pt-0"><button type="button" class="btn btn-sm btn-outline-secondary" data-c="reset"><i class="bi bi-skip-start" aria-hidden="true"></i> ' + esc(T('st.reset')) + '</button>' +
          '<button type="button" class="btn btn-sm btn-outline-secondary" data-c="all"><i class="bi bi-eye" aria-hidden="true"></i> ' + esc(T('st.all')) + '</button></div>' : '') +
        '<section class="pg-pres-sec"><h2 class="h6">' + esc(T('st.upNext')) + '</h2>' +
        (upcoming >= 0 && stepsList[upcoming] ? '<p class="fw-semibold mb-2">' + esc(stepsList[upcoming].label) + '</p>' + (revealMode ? notes(stepsList[upcoming].ids) : '') : '<p class="text-body-secondary">' + esc(T('st.allDone')) + '</p>') + '</section>' +
        (current >= 0 && stepsList[current] && revealMode ? '<section class="pg-pres-sec"><h2 class="h6">' + esc(T('st.justShown')) + '</h2><p class="mb-2">' + esc(stepsList[current].label) + '</p>' + notes(stepsList[current].ids) + '</section>' : '') +
        '<section class="pg-pres-sec"><h2 class="h6">' + esc(T('st.plan')) + '</h2><ol class="pg-pres-plan">' +
        stepsList.map(function (s, i) {
          var shown = revealMode ? s.ids.every(function (id) { return st.revealed[id]; }) : i <= focusIdx;
          var isNext = i === upcoming;
          return '<li class="' + (shown ? 'is-done' : '') + (isNext ? ' is-next' : '') + '"><button type="button" data-goto="' + i + '">' +
            '<i class="bi ' + (shown ? 'bi-check-circle-fill' : isNext ? 'bi-play-fill' : 'bi-circle') + '" aria-hidden="true"></i> ' + esc(s.label) + '</button></li>';
        }).join('') + '</ol></section>' +
        '<section class="pg-pres-sec"><h2 class="h6">' + esc(T('st.overview')) + '</h2><div class="pg-mini-wrap">' + presenterMini() + '</div></section>';
      root.querySelectorAll('[data-c]').forEach(function (b) { b.addEventListener('click', function () { cmd(b.getAttribute('data-c')); }); });
      root.querySelectorAll('[data-goto]').forEach(function (b) { b.addEventListener('click', function () { cmd('goto', { index: +b.getAttribute('data-goto') }); }); });
    }

    function presenterMini() {
      return '<div class="pg-mini">' + doc.perspectives.map(function (p) {
        var r = 0;
        var hShown = st.reveal !== 'zero' || st.revealed[hid(p.id)];
        return '<div class="pg-mini-col' + (st.spot && st.focus === p.id ? ' is-focus' : '') + '"><div class="pg-mini-head' + (hShown ? '' : ' is-hidden') + '">' + esc(p.title) + '</div>' +
          p.cells.map(function (c) {
            if (c.spacer) return '<div class="pg-mini-cell pg-mini-spacer"></div>';
            r++;
            var shown = st.reveal === 'off' || st.revealed[cid(p.id, c.key)];
            return '<div class="pg-mini-cell s-' + c.state + (shown ? '' : ' is-hidden') + '"><span class="pg-mini-rank">' + r + '</span>' + esc(F.cellTitle(doc, c)) + '</div>';
          }).join('') + '</div>';
      }).join('') + '</div>';
    }

    document.addEventListener('keydown', function (e) {
      if (e.key === 'PageDown' || e.key === 'ArrowRight' || e.key === 'ArrowDown' || e.key === ' ') { if (e.target.tagName !== 'BUTTON' || e.key !== ' ') { e.preventDefault(); cmd('next'); } }
      else if (e.key === 'PageUp' || e.key === 'ArrowLeft' || e.key === 'ArrowUp') { e.preventDefault(); cmd('prev'); }
    });
  }

  /** Settings from the URL: &spot=1 &stage=veil|zero &order=column|rank|element */
  function fromParams(q) {
    var patch = {};
    if (q.get('spot') === '1') patch.spot = true;
    if (/^(veil|zero)$/.test(q.get('stage') || '')) patch.reveal = q.get('stage');
    if (/^(column|rank|element)$/.test(q.get('order') || '')) patch.order = q.get('order');
    if (Object.keys(patch).length) setSettings(patch);
  }
  function params() {
    var st = ST(), out = [];
    if (st.spot) out.push('spot=1');
    if (st.reveal !== 'off') out.push('stage=' + st.reveal, 'order=' + st.order);
    return out.join('&');
  }

  PG.stage = {
    defaults: defaults,
    on: on,
    revealOn: revealOn,
    cellView: cellView,
    headView: headView,
    columnFullyShown: columnFullyShown,
    cellPlaceholder: cellPlaceholder,
    headPlaceholder: headPlaceholder,
    freshClass: function (pid, key) { return freshClass(key == null ? hid(pid) : cid(pid, key)); },
    afterRender: afterRender,
    onCellClick: onCellClick,
    onHeadClick: onHeadClick,
    initBar: initBar,
    startPresenter: startPresenter,
    reset: reset,
    next: next,
    prev: prev,
    fromParams: fromParams,
    params: params,
    buildSteps: buildSteps
  };
})(window.PG);
