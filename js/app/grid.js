/*!
 * Grid rendering and consultation interactions: columns, cells (accordions), states, badges,
 * multi-column comparison (rank gaps, absences, SVG links), keyboard navigation, column moves.
 */
(function (PG) {
  'use strict';

  var F = PG.format, esc = PG.util.escapeHtml;
  function T(k, v) { return PG.i18n.t(k, v); }
  function app() { return PG.app; }
  function S() { return PG.app.state; }

  var STATE_ICONS = {
    default: 'bi-circle', primary: 'bi-star-fill', success: 'bi-check-circle-fill',
    warning: 'bi-exclamation-triangle-fill', danger: 'bi-x-circle-fill', muted: 'bi-dash-circle'
  };

  /* --------------------------------------------------------------- badges */

  function badgeKeys(doc) {
    var keys = Object.keys(F.BUILTIN_BADGES);
    Object.keys(doc.badges || {}).forEach(function (k) { if (keys.indexOf(k) < 0) keys.push(k); });
    return keys;
  }
  function badgeInfo(doc, key) {
    var custom = (doc.badges || {})[key] || {};
    var icon = custom.icon || F.BUILTIN_BADGES[key] || 'tag';
    var label = custom.label || (F.BUILTIN_BADGES[key] ? T('badge.' + key) : F.humanize(key));
    return { key: key, icon: 'bi-' + String(icon).replace(/^bi-/, ''), label: label, known: !!(custom.icon || custom.label || F.BUILTIN_BADGES[key]) };
  }

  /* --------------------------------------------------------------- render */

  function cid(pid, key) { return pid + '\u0001' + key; }
  function domId(s) { return 'pg-' + String(s).replace(/[^\w-]/g, '_'); }

  function render() {
    var st = S(), doc = st.doc, grid = document.getElementById('grid');
    var editing = st.editing;
    var html = '';
    var multi = st.selected.length;
    doc.perspectives.forEach(function (p, pi) {
      var sel = st.selected.indexOf(p.id) >= 0;
      var hid = domId('h-' + p.id);
      var expandedHead = !!st.expanded['head\u0001' + p.id];
      html += '<section class="pg-col' + (sel ? ' is-selected' : '') + '" data-pid="' + esc(p.id) + '" aria-labelledby="' + hid + '"' +
        (st.compact && multi >= 2 && !sel ? ' hidden' : '') + '>';
      if (PG.stage.headView(p.id) !== 'shown') html += PG.stage.headPlaceholder(p, pi, hid);
      else html +=
        '<header class="pg-head' + PG.stage.freshClass(p.id) + '" data-pid="' + esc(p.id) + '">' +
        '<div class="pg-head-bar">' +
        '<label class="pg-select" title="' + esc(T('g.selectHint')) + '">' +
        '<input type="checkbox" class="form-check-input" data-act="select"' + (sel ? ' checked' : '') + ' aria-label="' + esc(T('g.selectAria', { title: p.title })) + '">' +
        '<span class="pg-select-txt">' + esc(sel ? T('g.selected') : T('g.compare')) + '</span></label>' +
        '<span class="pg-head-tools">' +
        '<button type="button" class="pg-icon-btn pg-move" data-act="col-left" ' + (pi === 0 ? 'disabled ' : '') + 'aria-label="' + esc(T('g.moveLeft', { title: p.title })) + '" title="' + esc(T('g.moveLeftShort')) + '"><i class="bi bi-arrow-left" aria-hidden="true"></i></button>' +
        '<button type="button" class="pg-icon-btn pg-move" data-act="col-right" ' + (pi === doc.perspectives.length - 1 ? 'disabled ' : '') + 'aria-label="' + esc(T('g.moveRight', { title: p.title })) + '" title="' + esc(T('g.moveRightShort')) + '"><i class="bi bi-arrow-right" aria-hidden="true"></i></button>' +
        '<span class="pg-icon-btn pg-col-grip" draggable="true" data-act="col-grip" title="' + esc(T('g.dragCol')) + '" aria-hidden="true"><i class="bi bi-arrows-move"></i></span>' +
        '<button type="button" class="pg-icon-btn" data-act="col-menu" aria-haspopup="menu" aria-expanded="false" aria-label="' + esc(T('g.colMenu', { title: p.title })) + '"><i class="bi bi-three-dots-vertical" aria-hidden="true"></i></button>' +
        '</span></div>' +
        '<h2 class="pg-head-title" id="' + hid + '" data-edit="p-title">' + esc(p.title) + '</h2>' +
        (p.subtitle || editing ? '<div class="pg-head-sub" data-edit="p-subtitle">' + esc(p.subtitle || '') + '</div>' : '') +
        (p.summary || editing ? '<div class="pg-head-sum" data-edit="p-summary">' + PG.mdInline(p.summary) + '</div>' : '') +
        (p.detail ? '<button type="button" class="pg-more" data-act="head-more" aria-expanded="' + expandedHead + '" aria-controls="' + domId('hd-' + p.id) + '">' +
          '<i class="bi bi-chevron-down" aria-hidden="true"></i> ' + esc(expandedHead ? T('g.lessDetail') : T('g.moreDetail')) + '</button>' +
          '<div class="pg-head-detail pg-prose" id="' + domId('hd-' + p.id) + '"' + (expandedHead ? '' : ' hidden') + '>' + (expandedHead ? PG.md(p.detail) : '') + '</div>' : '') +
        (editing ? '<button type="button" class="btn btn-sm btn-outline-secondary pg-head-edit" data-act="col-edit"><i class="bi bi-pencil" aria-hidden="true"></i> ' + esc(T('e.editColumn')) + '</button>' : '') +
        '</header>';
      html += '<div class="pg-absent" hidden></div>' +
        '<ol class="pg-cells" aria-label="' + esc(T('g.cellsAria', { title: p.title })) + '">';
      var rank = 0;
      p.cells.forEach(function (c, ci) {
        if (editing) html += addSlot(pi, ci);
        if (c.spacer) {
          html += '<li class="pg-cell pg-spacer" data-pid="' + esc(p.id) + '" data-idx="' + ci + '" aria-hidden="' + (editing ? 'false' : 'true') + '">' +
            (editing ? '<span class="pg-grip" data-act="grip" title="' + esc(T('e.drag')) + '"><i class="bi bi-grip-vertical" aria-hidden="true"></i></span>' +
              '<span class="pg-spacer-label">' + esc(T('e.spacer')) + '</span>' +
              '<button type="button" class="pg-icon-btn" data-act="cell-menu" aria-haspopup="menu" aria-expanded="false" aria-label="' + esc(T('e.spacerMenu')) + '"><i class="bi bi-three-dots" aria-hidden="true"></i></button>' : '') +
            '</li>';
          return;
        }
        rank++;
        var view = PG.stage.cellView(p.id, c.key);
        html += view === 'shown' ? cellHtml(doc, p, c, ci, rank, editing) : PG.stage.cellPlaceholder(doc, p, c, ci, rank, view);
      });
      if (editing) html += addSlot(pi, p.cells.length, true);
      html += '</ol></section>';
    });
    if (editing) {
      html += '<div class="pg-col pg-col-add"><button type="button" class="pg-add-col" data-act="col-add"><i class="bi bi-plus-lg" aria-hidden="true"></i><span>' + esc(T('e.addColumn')) + '</span></button></div>';
    }
    if (!doc.perspectives.length && !editing) {
      html = '<div class="pg-empty"><i class="bi bi-layout-three-columns" aria-hidden="true"></i><p>' + esc(T('g.empty')) + '</p>' +
        '<button type="button" class="btn btn-accent" data-act="empty-edit"><i class="bi bi-pencil" aria-hidden="true"></i> ' + esc(T('g.emptyEdit')) + '</button></div>';
    }
    var ae = document.activeElement;
    var hadFocus = !!(ae && ae !== grid && grid.contains(ae) && ae.closest('.pg-cell'));
    grid.innerHTML = html + '<svg class="pg-links" aria-hidden="true" focusable="false"></svg>';
    document.body.classList.toggle('pg-has-selection', st.selected.length >= 2);
    restoreFocus(hadFocus);
    applyCompare();
    PG.app.updateToolbar();
    PG.stage.afterRender();
  }

  function addSlot(pi, ci, last) {
    return '<li class="pg-add' + (last ? ' pg-add-last' : '') + '" aria-hidden="false"><button type="button" class="pg-add-btn" data-act="cell-add" data-pi="' + pi + '" data-at="' + ci + '" aria-label="' +
      esc(T('e.addCellAt', { n: ci + 1 })) + '" title="' + esc(T('e.addCell')) + '"><i class="bi bi-plus" aria-hidden="true"></i>' + (last ? '<span>' + esc(T('e.addCell')) + '</span>' : '') + '</button></li>';
  }

  function cellHtml(doc, p, c, ci, rank, editing) {
    var st = S();
    var title = F.cellTitle(doc, c);
    var open = !!st.expanded[cid(p.id, c.key)];
    var el = F.element(doc, c.key);
    var hasDetail = !!(c.detail || (el && el.detail));
    var did = domId('d-' + p.id + '-' + ci);
    var stateLabel = T('state.' + c.state);
    var badges = (c.badges || []).map(function (b) {
      var bi = badgeInfo(doc, b);
      return '<button type="button" class="pg-badge" data-act="badge" data-badge="' + esc(b) + '" title="' + esc(bi.label) + '" aria-label="' + esc(T('b.badgeAria', { label: bi.label })) + '">' +
        '<i class="bi ' + esc(bi.icon) + '" aria-hidden="true"></i><span class="pg-badge-lbl">' + esc(bi.label) + '</span></button>';
    }).join('');
    return '<li class="pg-cell s-' + c.state + (open ? ' is-open' : '') + PG.stage.freshClass(p.id, c.key) + '" data-pid="' + esc(p.id) + '" data-idx="' + ci + '" data-key="' + esc(c.key) + '" data-rank="' + rank + '">' +
      '<div class="pg-cell-row">' +
      (editing ? '<span class="pg-grip" data-act="grip" title="' + esc(T('e.drag')) + '"><i class="bi bi-grip-vertical" aria-hidden="true"></i></span>' : '') +
      '<span class="pg-rank" aria-hidden="true">' + rank + '</span>' +
      '<button type="button" class="pg-cell-toggle" data-act="toggle" tabindex="-1" aria-expanded="' + open + '"' + (hasDetail ? ' aria-controls="' + did + '"' : '') + '>' +
      '<span class="visually-hidden">' + esc(T('g.rankSr', { n: rank })) + ', </span>' +
      '<span class="pg-cell-title" data-edit="c-title">' + esc(title) + '</span>' +
      (c.state !== 'default' ? '<span class="visually-hidden">, ' + esc(T('g.stateSr', { state: stateLabel })) + '</span>' : '') +
      ((c.badges || []).length ? '<span class="visually-hidden">, ' + esc(T('g.badgesSr', { list: c.badges.map(function (b) { return badgeInfo(doc, b).label; }).join(', ') })) + '</span>' : '') +
      '</button>' +
      '<button type="button" class="pg-state-btn" data-act="cell-menu" tabindex="-1" aria-haspopup="menu" aria-expanded="false" title="' + esc(T('g.stateBtn', { state: stateLabel })) + '" aria-label="' + esc(T('g.stateBtnAria', { title: title, state: stateLabel })) + '">' +
      '<i class="bi ' + STATE_ICONS[c.state] + '" aria-hidden="true"></i></button>' +
      '</div>' +
      '<div class="pg-cmp" hidden></div>' +
      (hasDetail ? '<div class="pg-cell-detail pg-prose" id="' + did + '"' + (open ? '' : ' hidden') + '>' + (open ? detailHtml(doc, c, el) : '') + '</div>' : '') +
      (badges ? '<div class="pg-cell-foot">' + badges + '</div>' : '') +
      (editing ? '<button type="button" class="pg-icon-btn pg-cell-edit" data-act="cell-edit" tabindex="-1" aria-label="' + esc(T('e.editCellAria', { title: title })) + '" title="' + esc(T('e.editCell')) + '"><i class="bi bi-pencil" aria-hidden="true"></i></button>' : '') +
      '</li>';
  }

  function detailHtml(doc, c, el) {
    var own = c.detail ? PG.md(c.detail) : '';
    var def = el && el.detail ? PG.md(el.detail) : '';
    if (own && def) return own + '<details class="pg-default"><summary>' + esc(T('g.defaultDesc')) + '</summary>' + def + '</details>';
    if (own) return own;
    return '<div class="pg-default-only">' + def + '</div>';
  }

  /* ----------------------------------------------------------- focus / nav */

  function cellEls() { return [].slice.call(document.querySelectorAll('#grid .pg-col:not([hidden]) .pg-cell:not(.pg-spacer)')); }
  function cellEl(pid, idx) { return document.querySelector('#grid .pg-cell[data-pid="' + cssEsc(pid) + '"][data-idx="' + idx + '"]'); }
  function cssEsc(s) { return window.CSS && CSS.escape ? CSS.escape(s) : String(s).replace(/["\\]/g, '\\$&'); }
  function ref(li) { return { pid: li.getAttribute('data-pid'), idx: +li.getAttribute('data-idx') }; }
  function model(li) {
    var r = ref(li), doc = S().doc;
    var p = doc.perspectives.filter(function (x) { return x.id === r.pid; })[0];
    return p ? { p: p, c: p.cells[r.idx], idx: r.idx } : null;
  }

  /** Roving tabindex: one cell (its toggle, state and edit buttons) is in the Tab order. */
  function setActive(li, focus) {
    if (!li) return;
    document.querySelectorAll('#grid .pg-cell.is-active').forEach(function (x) {
      x.classList.remove('is-active');
      x.querySelectorAll('[data-act="toggle"],[data-act="cell-menu"],[data-act="cell-edit"]').forEach(function (b) { b.tabIndex = -1; });
    });
    li.classList.add('is-active');
    li.querySelectorAll('[data-act="toggle"],[data-act="cell-menu"],[data-act="cell-edit"]').forEach(function (b) { b.tabIndex = 0; });
    S().focus = ref(li);
    if (focus) {
      var t = li.querySelector('[data-act="toggle"]');
      if (t) t.focus({ preventScroll: true });
      li.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: PG.util.reducedMotion() ? 'auto' : 'smooth' });
    }
  }
  function restoreFocus(hadFocus) {
    var st = S(), f = st.focus, li = f && cellEl(f.pid, f.idx);
    if (!li || li.classList.contains('pg-spacer')) li = cellEls()[0];
    if (li) setActive(li, !!(st.refocus || hadFocus));
    st.refocus = false;
  }

  function neighbour(li, dir) {
    var col = li.closest('.pg-col');
    var cells = [].slice.call(col.querySelectorAll('.pg-cell:not(.pg-spacer)'));
    var i = cells.indexOf(li);
    if (dir === 'up') return cells[i - 1];
    if (dir === 'down') return cells[i + 1];
    if (dir === 'home') return cells[0];
    if (dir === 'end') return cells[cells.length - 1];
    var cols = [].slice.call(document.querySelectorAll('#grid .pg-col[data-pid]:not([hidden])'));
    var ci = cols.indexOf(col), step = dir === 'left' ? -1 : 1;
    for (var k = ci + step; k >= 0 && k < cols.length; k += step) {
      var cc = [].slice.call(cols[k].querySelectorAll('.pg-cell:not(.pg-spacer)'));
      if (!cc.length) continue;
      // prefer the same element in the neighbouring column, else the same rank
      var key = li.getAttribute('data-key');
      var same = cc.filter(function (x) { return x.getAttribute('data-key') === key; })[0];
      return same || cc[Math.min(i, cc.length - 1)];
    }
    return null;
  }

  /* -------------------------------------------------------------- toggling */

  function toggleCell(li, force) {
    var m = model(li);
    if (!m || m.c.spacer) return;
    var k = cid(m.p.id, m.c.key);
    var open = force != null ? force : !S().expanded[k];
    if (open) S().expanded[k] = true; else delete S().expanded[k];
    li.classList.toggle('is-open', open);
    var btn = li.querySelector('[data-act="toggle"]');
    btn.setAttribute('aria-expanded', open);
    var d = li.querySelector('.pg-cell-detail');
    if (d) {
      if (open && !d.innerHTML) d.innerHTML = detailHtml(S().doc, m.c, F.element(S().doc, m.c.key));
      d.hidden = !open;
    }
    // comparison follows the last opened cell
    if (open) setSource(m.p.id, m.c.key);
    else if (S().src && S().src.pid === m.p.id && S().src.key === m.c.key) setSource(null);
    else drawLinksSoon();
  }

  function toggleHead(btn) {
    var pid = btn.closest('.pg-head').getAttribute('data-pid');
    var k = 'head\u0001' + pid, open = !S().expanded[k];
    if (open) S().expanded[k] = true; else delete S().expanded[k];
    var p = S().doc.perspectives.filter(function (x) { return x.id === pid; })[0];
    var d = btn.nextElementSibling;
    if (open && !d.innerHTML) d.innerHTML = PG.md(p.detail);
    d.hidden = !open;
    btn.setAttribute('aria-expanded', open);
    btn.innerHTML = '<i class="bi bi-chevron-down" aria-hidden="true"></i> ' + esc(open ? T('g.lessDetail') : T('g.moreDetail'));
    drawLinksSoon();
  }

  /* ------------------------------------------------------------ comparison */

  function group() {
    var st = S();
    if (st.selected.length < 2) return [];
    var ids = st.selected.slice();
    if (st.src && ids.indexOf(st.src.pid) < 0) ids.push(st.src.pid);
    return st.doc.perspectives.filter(function (p) { return ids.indexOf(p.id) >= 0; });
  }

  function setSource(pid, key) {
    S().src = pid ? { pid: pid, key: key } : null;
    applyCompare(true);
  }

  function applyCompare(announce) {
    var st = S(), doc = st.doc, grid = document.getElementById('grid');
    grid.querySelectorAll('.pg-cell.is-src, .pg-cell.is-match').forEach(function (x) { x.classList.remove('is-src', 'is-match'); });
    grid.querySelectorAll('.pg-cmp').forEach(function (x) { x.hidden = true; x.innerHTML = ''; });
    grid.querySelectorAll('.pg-absent').forEach(function (x) { x.hidden = true; x.innerHTML = ''; });
    grid.querySelectorAll('.pg-col.is-in-group').forEach(function (x) { x.classList.remove('is-in-group'); });
    grid.classList.remove('is-comparing');
    var g = group();
    if (!st.src || g.length < 2) { drawLinks(); return; }
    var srcP = doc.perspectives.filter(function (p) { return p.id === st.src.pid; })[0];
    if (!srcP) { st.src = null; drawLinks(); return; }
    var key = st.src.key, r0 = F.rankOfKey(srcP, key);
    if (!r0) { st.src = null; drawLinks(); return; }
    var title = F.cellTitle(doc, srcP.cells.filter(function (c) { return c.key === key; })[0]);
    grid.classList.add('is-comparing');
    var parts = [];
    g.forEach(function (p) {
      var col = grid.querySelector('.pg-col[data-pid="' + cssEsc(p.id) + '"]');
      if (!col) return;
      col.classList.add('is-in-group');
      var r = F.rankOfKey(p, key);
      if (r && PG.stage.cellView(p.id, key) !== 'shown') return;
      if (!r && !PG.stage.columnFullyShown(p)) return;
      if (!r) {
        var ab = col.querySelector('.pg-absent');
        ab.hidden = false;
        ab.innerHTML = '<i class="bi bi-dash-circle-dotted" aria-hidden="true"></i> <span>' + T('g.absent', { title: '<strong>' + esc(title) + '</strong>' }) + '</span>';
        parts.push(T('g.srAbsent', { col: p.title }));
        return;
      }
      var li = col.querySelector('.pg-cell[data-key="' + cssEsc(key) + '"]');
      var box = li.querySelector('.pg-cmp');
      box.hidden = false;
      if (p.id === srcP.id) {
        li.classList.add('is-src');
        box.innerHTML = '<i class="bi bi-crosshair" aria-hidden="true"></i> ' + esc(T('g.reference', { n: r }));
      } else {
        li.classList.add('is-match');
        var d = r - r0;
        var arrow = d > 0 ? 'bi-arrow-down' : d < 0 ? 'bi-arrow-up' : 'bi-arrow-right';
        var txt = d === 0 ? T('g.sameRank', { n: r }) : T('g.rankGap', { from: r0, to: r });
        var sr = d === 0 ? T('g.srSame') : d > 0 ? T('g.srLower', { n: d }) : T('g.srHigher', { n: -d });
        box.innerHTML = '<i class="bi ' + arrow + '" aria-hidden="true"></i> ' + esc(txt) + '<span class="visually-hidden"> (' + esc(sr) + ')</span>';
        box.setAttribute('data-dir', d > 0 ? 'down' : d < 0 ? 'up' : 'same');
      }
      parts.push(T('g.srRank', { col: p.title, n: r }));
    });
    drawLinks();
    if (announce) PG.ui.announce(T('g.srCompare', { title: title, list: parts.join(' ; ') }));
  }

  /* ----------------------------------------------------------- SVG links */

  var linksRaf = 0;
  function drawLinksSoon() { cancelAnimationFrame(linksRaf); linksRaf = requestAnimationFrame(function () { setTimeout(drawLinks, PG.util.reducedMotion() ? 0 : 60); }); }
  function drawLinks() {
    var grid = document.getElementById('grid');
    var svg = grid && grid.querySelector('.pg-links');
    if (!svg) return;
    svg.innerHTML = '';
    if (!S().prefs.links || !grid.classList.contains('is-comparing')) return;
    var cells = [].slice.call(grid.querySelectorAll('.pg-cell.is-src, .pg-cell.is-match'));
    if (cells.length < 2) return;
    var g = grid.getBoundingClientRect();
    svg.setAttribute('width', grid.scrollWidth);
    svg.setAttribute('height', grid.scrollHeight);
    cells.sort(function (a, b) { return a.getBoundingClientRect().left - b.getBoundingClientRect().left; });
    var out = '';
    for (var i = 0; i < cells.length - 1; i++) {
      var a = cells[i].getBoundingClientRect(), b = cells[i + 1].getBoundingClientRect();
      var x1 = a.right - g.left, y1 = a.top + Math.min(a.height / 2, 22) - g.top;
      var x2 = b.left - g.left, y2 = b.top + Math.min(b.height / 2, 22) - g.top;
      var dx = Math.max(24, (x2 - x1) / 2);
      out += '<path d="M' + x1 + ' ' + y1 + ' C' + (x1 + dx) + ' ' + y1 + ' ' + (x2 - dx) + ' ' + y2 + ' ' + x2 + ' ' + y2 + '"/>' +
        '<circle cx="' + x1 + '" cy="' + y1 + '" r="4"/><circle cx="' + x2 + '" cy="' + y2 + '" r="4"/>';
    }
    svg.innerHTML = out;
  }

  /* --------------------------------------------------------------- menus */

  function cellMenu(li, btn) {
    var m = model(li);
    if (!m) return;
    var st = S(), doc = st.doc, items = [];
    if (!m.c.spacer) {
      items.push({ header: T('g.stateHeader') });
      F.STATES.forEach(function (s, i) {
        items.push({ role: 'menuitemradio', checked: m.c.state === s, icon: STATE_ICONS[s], iconCls: 'pg-ico-' + s, label: T('state.' + s), hint: String(i + 1),
          onSelect: function () { setState(li, s); } });
      });
      items.push({ divider: true }, { header: T('b.header') });
      badgeKeys(doc).forEach(function (b) {
        var bi = badgeInfo(doc, b);
        items.push({ role: 'menuitemcheckbox', checked: m.c.badges.indexOf(b) >= 0, icon: bi.icon, label: bi.label, keepOpen: true,
          onSelect: function () { toggleBadge(m.p.id, m.idx, b); } });
      });
      (m.c.badges || []).forEach(function (b) {
        if (badgeKeys(doc).indexOf(b) < 0) items.push({ role: 'menuitemcheckbox', checked: true, icon: 'bi-tag', label: b, keepOpen: true, onSelect: function () { toggleBadge(m.p.id, m.idx, b); } });
      });
    }
    if (st.editing) {
      items.push({ divider: true });
      if (!m.c.spacer) items.push({ icon: 'bi-pencil', label: T('e.editCell'), hint: 'F2', onSelect: function () { PG.edit.editCell(m.p.id, m.idx); } });
      items.push({ icon: 'bi-arrow-up', label: T('e.moveUp'), hint: 'Alt+↑', disabled: m.idx === 0, onSelect: function () { PG.edit.moveCell(m.p.id, m.idx, -1); } });
      items.push({ icon: 'bi-arrow-down', label: T('e.moveDown'), hint: 'Alt+↓', disabled: m.idx === m.p.cells.length - 1, onSelect: function () { PG.edit.moveCell(m.p.id, m.idx, 1); } });
      items.push({ icon: 'bi-trash', label: T('e.deleteCell'), danger: true, hint: T('k.del'), onSelect: function () { PG.edit.deleteCell(m.p.id, m.idx); } });
    }
    PG.ui.menu.open(btn, items, { label: T('g.cellMenuAria'), onClose: function () { if (st.menuDirty) { st.menuDirty = false; app().commit(); } } });
  }

  function colMenu(btn) {
    var pid = btn.closest('.pg-col').getAttribute('data-pid');
    var st = S(), doc = st.doc;
    var pi = doc.perspectives.map(function (p) { return p.id; }).indexOf(pid);
    var sel = st.selected.indexOf(pid) >= 0;
    var items = [
      { icon: sel ? 'bi-check2-square' : 'bi-square', label: sel ? T('g.unselect') : T('g.selectForCompare'), onSelect: function () { toggleSelect(pid); } },
      { icon: 'bi-arrow-left', label: T('g.moveLeftShort'), hint: 'Alt+←', disabled: pi === 0, onSelect: function () { moveColumn(pid, -1); } },
      { icon: 'bi-arrow-right', label: T('g.moveRightShort'), hint: 'Alt+→', disabled: pi === doc.perspectives.length - 1, onSelect: function () { moveColumn(pid, 1); } }
    ];
    if (st.editing) {
      items.push({ divider: true },
        { icon: 'bi-pencil', label: T('e.editColumn'), onSelect: function () { PG.edit.editColumn(pid); } },
        { icon: 'bi-plus-square', label: T('e.addCell'), onSelect: function () { PG.edit.addCell(pid, doc.perspectives[pi].cells.length); } },
        { icon: 'bi-distribute-vertical', label: T('e.addSpacer'), onSelect: function () { PG.edit.addSpacer(pid, doc.perspectives[pi].cells.length); } },
        { icon: 'bi-files', label: T('e.duplicateColumn'), onSelect: function () { PG.edit.duplicateColumn(pid); } },
        { icon: 'bi-trash', label: T('e.deleteColumn'), danger: true, onSelect: function () { PG.edit.deleteColumn(pid); } });
    }
    PG.ui.menu.open(btn, items, { label: T('g.colMenuShort') });
  }

  /* ------------------------------------------------------------- actions */

  function setState(li, s) {
    var m = model(li);
    if (!m || m.c.spacer || m.c.state === s) return;
    m.c.state = s;
    S().focus = ref(li);
    S().refocus = true;
    app().commit();
    PG.ui.announce(T('g.srStateSet', { title: F.cellTitle(S().doc, m.c), state: T('state.' + s) }));
  }

  function toggleBadge(pid, idx, b, forceOn) {
    var p = S().doc.perspectives.filter(function (x) { return x.id === pid; })[0];
    var c = p && p.cells[idx];
    if (!c || c.spacer) return false;
    var i = c.badges.indexOf(b);
    if (i >= 0 && forceOn) return false;
    if (i >= 0) c.badges.splice(i, 1); else c.badges.push(b);
    var label = badgeInfo(S().doc, b).label;
    PG.ui.announce(T(i >= 0 ? 'b.srRemoved' : 'b.srAdded', { label: label, title: F.cellTitle(S().doc, c) }));
    if (PG.ui.menu.isOpen()) S().menuDirty = true; else app().commit();
    return true;
  }

  function toggleSelect(pid) {
    var st = S(), i = st.selected.indexOf(pid);
    if (i >= 0) st.selected.splice(i, 1); else st.selected.push(pid);
    // keep document order
    var order = st.doc.perspectives.map(function (p) { return p.id; });
    st.selected.sort(function (a, b) { return order.indexOf(a) - order.indexOf(b); });
    if (st.selected.length < 2) st.compact = false;
    var p = st.doc.perspectives.filter(function (x) { return x.id === pid; })[0];
    PG.ui.announce(T(i >= 0 ? 'g.srUnselected' : 'g.srSelected', { title: p ? p.title : pid, n: st.selected.length }));
    render();
  }

  function moveColumn(pid, dir, toIndex, keepCellFocus) {
    var ps = S().doc.perspectives;
    var i = ps.map(function (p) { return p.id; }).indexOf(pid);
    var j = toIndex != null ? toIndex : i + dir;
    if (i < 0 || j < 0 || j >= ps.length || i === j) return;
    var p = ps.splice(i, 1)[0];
    ps.splice(j, 0, p);
    app().commit();
    PG.ui.announce(T('g.srColMoved', { title: p.title, n: j + 1, total: ps.length }));
    var col = document.querySelector('#grid .pg-col[data-pid="' + cssEsc(pid) + '"]');
    if (col) {
      col.scrollIntoView({ inline: 'nearest', block: 'nearest', behavior: PG.util.reducedMotion() ? 'auto' : 'smooth' });
      if (toIndex == null && !keepCellFocus) {
        var b = col.querySelector('[data-act="' + (dir < 0 ? 'col-left' : 'col-right') + '"]');
        if (b && !b.disabled) b.focus(); else { b = col.querySelector('[data-act="col-menu"]'); if (b) b.focus(); }
      }
      col.classList.add('pg-flash');
      setTimeout(function () { col.classList.remove('pg-flash'); }, 700);
    }
  }

  /* -------------------------------------------------------------- events */

  function init() {
    var grid = document.getElementById('grid');

    grid.addEventListener('click', function (e) {
      var st = S();
      var actEl = e.target.closest('[data-act]');
      var act = actEl && actEl.getAttribute('data-act');
      var li = e.target.closest('.pg-cell');
      if (act === 'select') { toggleSelect(actEl.closest('.pg-col').getAttribute('data-pid')); return; }
      if (act === 'col-left' || act === 'col-right') { moveColumn(actEl.closest('.pg-col').getAttribute('data-pid'), act === 'col-left' ? -1 : 1); return; }
      if (act === 'col-menu') { colMenu(actEl); return; }
      if (act === 'reveal-head') { PG.stage.onHeadClick(actEl.closest('.pg-head').getAttribute('data-pid')); return; }
      if (act === 'head-more') { toggleHead(actEl); return; }
      if (act === 'col-edit') { PG.edit.editColumn(actEl.closest('.pg-col').getAttribute('data-pid')); return; }
      if (act === 'col-add') { PG.edit.addColumn(); return; }
      if (act === 'empty-edit') { app().setEditing(true); return; }
      if (act === 'cell-add') { var pid = st.doc.perspectives[+actEl.getAttribute('data-pi')].id; PG.edit.addCell(pid, +actEl.getAttribute('data-at')); return; }
      if (act === 'cell-edit') { var r = ref(li); PG.edit.editCell(r.pid, r.idx); return; }
      if (act === 'badge') {
        actEl.classList.toggle('show-label');
        if (!st.armed) return;
      }
      if (act === 'cell-menu' && li) { setActive(li); cellMenu(li, actEl); return; }
      if (act === 'grip') return;
      // a tap on a column header (outside its controls) selects it
      var head = e.target.closest('.pg-head');
      if (head && !e.target.closest('a,button,input,label,.pg-head-detail') && !st.editing && !window.getSelection().toString()) {
        if (PG.stage.onHeadClick(head.getAttribute('data-pid'))) return;
        toggleSelect(head.getAttribute('data-pid'));
        return;
      }
      if (li && !li.classList.contains('pg-spacer')) {
        if (e.target.closest('.pg-cell-detail a')) return;
        if (st.armed) { var rr = ref(li); if (toggleBadge(rr.pid, rr.idx, st.armed, false) !== false) li.classList.add('pg-flash'); return; }
        if (e.target.closest('.pg-cell-detail') && !act) return;
        if (!st.editing && PG.stage.onCellClick(li)) return;
        setActive(li);
        toggleCell(li);
      }
    });

    grid.addEventListener('dblclick', function (e) {
      if (!S().editing) return;
      var t = e.target.closest('[data-edit]');
      if (t) { e.preventDefault(); PG.edit.inline(t); }
    });

    grid.addEventListener('focusin', function (e) {
      var li = e.target.closest('.pg-cell');
      if (li && !li.classList.contains('pg-spacer') && !li.classList.contains('is-active')) setActive(li);
    });

    grid.addEventListener('keydown', function (e) {
      if (e.target.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName)) return;
      var li = e.target.closest('.pg-cell');
      var st = S();
      // Alt+←/→: move the column (from a header control or a cell)
      if (e.altKey && (e.key === 'ArrowLeft' || e.key === 'ArrowRight')) {
        var col = e.target.closest('.pg-col[data-pid]');
        if (col) { e.preventDefault(); if (li) st.refocus = true; moveColumn(col.getAttribute('data-pid'), e.key === 'ArrowLeft' ? -1 : 1, null, !!li); }
        return;
      }
      if (!li || li.classList.contains('pg-spacer')) return;
      var r = ref(li);
      if (e.altKey && (e.key === 'ArrowUp' || e.key === 'ArrowDown')) {
        if (st.editing) { e.preventDefault(); PG.edit.moveCell(r.pid, r.idx, e.key === 'ArrowUp' ? -1 : 1); }
        return;
      }
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      var dirs = { ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right', Home: 'home', End: 'end' };
      if (dirs[e.key]) {
        var n = neighbour(li, dirs[e.key]);
        if (n) { e.preventDefault(); setActive(n, true); }
        return;
      }
      if (li.classList.contains('pg-hidden-cell') && (/^[1-6]$/.test(e.key) || e.key === 'm')) return;
      if (/^[1-6]$/.test(e.key)) { e.preventDefault(); setState(li, F.STATES[+e.key - 1]); return; }
      if (e.key === 'Escape' && st.src) { setSource(null); return; }
      if (e.key === 'm' || e.key === 'ContextMenu' || (e.shiftKey && e.key === 'F10')) {
        e.preventDefault();
        var b = li.querySelector('[data-act="cell-menu"]');
        cellMenu(li, b);
        return;
      }
      if (st.editing && e.key === 'F2') { e.preventDefault(); PG.edit.editCell(r.pid, r.idx); return; }
      if (st.editing && e.key === 'Delete') { e.preventDefault(); PG.edit.deleteCell(r.pid, r.idx); }
    });

    // Column drag and drop (desktop): drag the grip of a header onto another column.
    var dragPid = null;
    grid.addEventListener('dragstart', function (e) {
      var grip = e.target.closest && e.target.closest('[data-act="col-grip"]');
      if (!grip) return;
      dragPid = grip.closest('.pg-col').getAttribute('data-pid');
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/x-pg-column', dragPid);
      var col = grip.closest('.pg-col');
      try { e.dataTransfer.setDragImage(col.querySelector('.pg-head'), 30, 20); } catch (err) { /* ignore */ }
      setTimeout(function () { col.classList.add('pg-col-dragging'); }, 0);
    });
    grid.addEventListener('dragover', function (e) {
      var types = [].slice.call(e.dataTransfer.types || []);
      if (types.indexOf('text/x-pg-column') >= 0 && dragPid) {
        var col = e.target.closest('.pg-col[data-pid]');
        grid.querySelectorAll('.pg-drop-before,.pg-drop-after').forEach(function (x) { x.classList.remove('pg-drop-before', 'pg-drop-after'); });
        if (!col || col.getAttribute('data-pid') === dragPid) return;
        e.preventDefault();
        var r = col.getBoundingClientRect();
        col.classList.add(e.clientX < r.left + r.width / 2 ? 'pg-drop-before' : 'pg-drop-after');
      } else if (types.indexOf('text/x-pg-badge') >= 0) {
        var li = e.target.closest('.pg-cell:not(.pg-spacer)');
        grid.querySelectorAll('.pg-badge-target').forEach(function (x) { if (x !== li) x.classList.remove('pg-badge-target'); });
        if (!li) return;
        e.preventDefault();
        e.dataTransfer.dropEffect = 'copy';
        li.classList.add('pg-badge-target');
      }
    });
    grid.addEventListener('dragleave', function (e) {
      if (!grid.contains(e.relatedTarget)) grid.querySelectorAll('.pg-badge-target,.pg-drop-before,.pg-drop-after').forEach(function (x) { x.classList.remove('pg-badge-target', 'pg-drop-before', 'pg-drop-after'); });
    });
    grid.addEventListener('drop', function (e) {
      var types = [].slice.call(e.dataTransfer.types || []);
      if (types.indexOf('text/x-pg-column') >= 0 && dragPid) {
        e.preventDefault();
        var col = e.target.closest('.pg-col[data-pid]');
        var after = col && col.classList.contains('pg-drop-after');
        grid.querySelectorAll('.pg-drop-before,.pg-drop-after').forEach(function (x) { x.classList.remove('pg-drop-before', 'pg-drop-after'); });
        if (!col) return;
        var ids = S().doc.perspectives.map(function (p) { return p.id; });
        var from = ids.indexOf(dragPid), to = ids.indexOf(col.getAttribute('data-pid')) + (after ? 1 : 0);
        if (to > from) to--;
        moveColumn(dragPid, 0, to);
      } else if (types.indexOf('text/x-pg-badge') >= 0) {
        e.preventDefault();
        var li = e.target.closest('.pg-cell:not(.pg-spacer)');
        grid.querySelectorAll('.pg-badge-target').forEach(function (x) { x.classList.remove('pg-badge-target'); });
        if (!li) return;
        var b = e.dataTransfer.getData('text/x-pg-badge'), r = ref(li);
        if (!toggleBadge(r.pid, r.idx, b, true)) PG.ui.toast(esc(T('b.already')), 'secondary');
      }
    });
    grid.addEventListener('dragend', function () {
      dragPid = null;
      grid.querySelectorAll('.pg-col-dragging,.pg-drop-before,.pg-drop-after').forEach(function (x) { x.classList.remove('pg-col-dragging', 'pg-drop-before', 'pg-drop-after'); });
    });

    if (window.ResizeObserver) new ResizeObserver(drawLinksSoon).observe(grid);
    window.addEventListener('resize', drawLinksSoon);
  }

  PG.grid = {
    STATE_ICONS: STATE_ICONS,
    init: init,
    render: render,
    applyCompare: applyCompare,
    setSource: setSource,
    toggleSelect: toggleSelect,
    moveColumn: moveColumn,
    badgeKeys: badgeKeys,
    badgeInfo: badgeInfo,
    toggleBadge: toggleBadge,
    drawLinks: drawLinksSoon,
    cellEl: cellEl,
    setActive: setActive,
    model: model,
    /** Static, non-interactive miniature of a document (import preview). */
    miniature: function (doc) {
      return '<div class="pg-mini">' + doc.perspectives.map(function (p) {
        var r = 0;
        return '<div class="pg-mini-col"><div class="pg-mini-head">' + esc(p.title) + '</div>' +
          p.cells.map(function (c) {
            if (c.spacer) return '<div class="pg-mini-cell pg-mini-spacer"></div>';
            r++;
            return '<div class="pg-mini-cell s-' + c.state + '"><span class="pg-mini-rank">' + r + '</span>' + esc(F.cellTitle(doc, c)) + '</div>';
          }).join('') + '</div>';
      }).join('') + '</div>';
    }
  };
})(window.PG);
