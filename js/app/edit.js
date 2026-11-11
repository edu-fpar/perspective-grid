/*!
 * Edit mode: inline editing (double-click), cell / column / document forms, add & delete,
 * cell reordering (pointer drag with long press on touch, Alt+↑/↓ on the keyboard).
 */
(function (PG) {
  'use strict';

  var F = PG.format, esc = PG.util.escapeHtml;
  function T(k, v) { return PG.i18n.t(k, v); }
  function S() { return PG.app.state; }
  function doc() { return PG.app.state.doc; }
  function persp(pid) { return doc().perspectives.filter(function (p) { return p.id === pid; })[0]; }
  function commit(opts) { PG.app.commit(opts); }

  function uniqueKey(base, taken) {
    base = F.slugify(base) || 'element';
    var k = base, n = 2;
    while (taken(k)) k = base + '-' + n++;
    return k;
  }
  function keyUsed(k) { return !!F.element(doc(), k); }
  function idUsed(id) { return !!persp(id); }

  /* ------------------------------------------------------------ inline edit */

  function inline(el) {
    if (el.isContentEditable) return;
    var field = el.getAttribute('data-edit');
    var col = el.closest('.pg-col'), li = el.closest('.pg-cell');
    var p = col && persp(col.getAttribute('data-pid'));
    var c = li && p ? p.cells[+li.getAttribute('data-idx')] : null;
    var original;
    if (field === 'p-title') original = p.title;
    else if (field === 'p-subtitle') original = p.subtitle || '';
    else if (field === 'p-summary') original = p.summary || '';
    else if (field === 'c-title') original = F.cellTitle(doc(), c);
    else if (field === 'd-title') original = doc().meta.title || '';
    else if (field === 'd-subtitle') original = doc().meta.subtitle || '';
    else return;
    el.textContent = original;
    el.contentEditable = 'plaintext-only';
    if (el.contentEditable !== 'plaintext-only') el.contentEditable = 'true';
    el.classList.add('pg-inline-editing');
    el.setAttribute('role', 'textbox');
    el.setAttribute('aria-label', T('e.inlineAria'));
    var btn = el.closest('button');
    if (btn) btn.setAttribute('data-inline', '1');
    el.focus();
    var range = document.createRange();
    range.selectNodeContents(el);
    var sel = window.getSelection(); sel.removeAllRanges(); sel.addRange(range);
    var done = false;
    function finish(save) {
      if (done) return;
      done = true;
      el.removeEventListener('keydown', onKey, true);
      el.removeEventListener('blur', onBlur);
      el.contentEditable = 'false';
      var v = el.textContent.replace(/\s+/g, ' ').trim();
      if (!save || v === original) { PG.app.render(); return; }
      if (field === 'p-title') { if (!v) { PG.app.render(); return; } p.title = v; }
      else if (field === 'p-subtitle') p.subtitle = v || null;
      else if (field === 'p-summary') p.summary = v;
      else if (field === 'c-title') {
        var el0 = F.element(doc(), c.key);
        c.title = (el0 && el0.title === v) || !v ? null : v;
      }
      else if (field === 'd-title') { if (!v) { PG.app.render(); return; } doc().meta.title = v; }
      else if (field === 'd-subtitle') doc().meta.subtitle = v || null;
      if (li) { S().focus = { pid: p.id, idx: +li.getAttribute('data-idx') }; S().refocus = true; }
      commit();
      PG.ui.announce(T('e.saved'));
    }
    function onKey(e) {
      e.stopPropagation();
      if (e.key === 'Enter') { e.preventDefault(); finish(true); }
      else if (e.key === 'Escape') { e.preventDefault(); finish(false); }
      else if (e.key === ' ' && btn) { /* do not toggle the accordion */ }
    }
    function onBlur() { finish(true); }
    el.addEventListener('keydown', onKey, true);
    el.addEventListener('blur', onBlur);
    // a click inside the editable title must not toggle the cell
    el.addEventListener('click', function (e) { if (el.isContentEditable) e.stopPropagation(); });
    if (btn) btn.addEventListener('keyup', function (e) { if (el.isContentEditable && e.key === ' ') e.preventDefault(); });
  }

  /* -------------------------------------------------------------- cell form */

  function stateOptions(cur) {
    return F.STATES.map(function (s) { return '<option value="' + s + '"' + (s === cur ? ' selected' : '') + '>' + esc(T('state.' + s)) + '</option>'; }).join('');
  }
  function badgeChecks(cur) {
    var d = doc();
    var keys = PG.grid.badgeKeys(d);
    cur.forEach(function (b) { if (keys.indexOf(b) < 0) keys.push(b); });
    return keys.map(function (b) {
      var bi = PG.grid.badgeInfo(d, b), id = 'fb-' + b.replace(/[^\w-]/g, '_');
      return '<input type="checkbox" class="btn-check" id="' + id + '" value="' + esc(b) + '"' + (cur.indexOf(b) >= 0 ? ' checked' : '') + ' autocomplete="off">' +
        '<label class="btn btn-sm btn-outline-secondary pg-badge-check" for="' + id + '"><i class="bi ' + esc(bi.icon) + '" aria-hidden="true"></i> ' + esc(bi.label) + '</label>';
    }).join('');
  }

  /** Opens the cell form. at = insertion index (new cell) or null (edit cells[idx]). */
  function cellForm(pid, idx, isNew) {
    var p = persp(pid);
    if (!p) return;
    var c = isNew ? { key: '', title: null, state: 'default', badges: [], detail: '', spacer: false } : p.cells[idx];
    if (!c || c.spacer) return;
    var el = c.key ? F.element(doc(), c.key) : null;
    var keys = doc().elements.map(function (e) {
      var inCol = p.cells.some(function (x, i) { return x.key === e.key && (isNew || i !== idx); });
      return '<option value="' + esc(e.key) + '">' + esc(e.title) + (inCol ? ' — ' + esc(T('e.alreadyInColumn')) : '') + '</option>';
    }).join('');
    var html = '<form class="modal-content" novalidate>' +
      '<div class="modal-header"><h2 class="modal-title h5"><i class="bi ' + (isNew ? 'bi-plus-square' : 'bi-pencil-square') + '" aria-hidden="true"></i> ' +
      esc(isNew ? T('e.newCellIn', { title: p.title, n: idx + 1 }) : T('e.editCellIn', { title: p.title })) + '</h2>' +
      '<button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="' + esc(T('c.close')) + '"></button></div>' +
      '<div class="modal-body">' +
      '<div class="row g-3">' +
      '<div class="col-sm-7"><label class="form-label fw-semibold" for="f-title">' + esc(T('e.title')) + '</label>' +
      '<input class="form-control" id="f-title" maxlength="160" value="' + esc(c.title || (isNew ? '' : '')) + '" placeholder="' + esc(el ? el.title : T('e.titlePh')) + '">' +
      '<div class="form-text" id="f-title-help"></div></div>' +
      '<div class="col-sm-5"><label class="form-label fw-semibold" for="f-key">' + esc(T('e.key')) + '</label>' +
      '<input class="form-control font-monospace" id="f-key" list="f-keys" maxlength="60" autocomplete="off" spellcheck="false" value="' + esc(c.key) + '" aria-describedby="f-key-help">' +
      '<datalist id="f-keys">' + keys + '</datalist>' +
      '<div class="form-text" id="f-key-help"></div></div>' +
      '<div class="col-sm-5"><label class="form-label fw-semibold" for="f-state">' + esc(T('e.state')) + '</label>' +
      '<select class="form-select" id="f-state">' + stateOptions(c.state) + '</select></div>' +
      '<div class="col-12"><fieldset><legend class="form-label fw-semibold fs-6">' + esc(T('b.header')) + '</legend><div class="d-flex flex-wrap gap-1" id="f-badges">' + badgeChecks(c.badges) + '</div></fieldset></div>' +
      '<div class="col-12"><label class="form-label fw-semibold" for="f-detail">' + esc(T('e.detail')) + '</label>' +
      '<textarea class="form-control" id="f-detail" rows="4" placeholder="' + esc(T('e.detailPh')) + '">' + esc(c.detail) + '</textarea>' +
      '<div class="form-text">' + esc(T('e.mdHelp')) + '</div></div>' +
      '<div class="col-12"><details class="pg-catalog-box" id="f-cat"><summary>' + esc(T('e.catalog')) + '</summary>' +
      '<p class="small text-body-secondary mt-2">' + esc(T('e.catalogHelp')) + '</p>' +
      '<label class="form-label" for="f-ctitle">' + esc(T('e.catalogTitle')) + '</label><input class="form-control mb-2" id="f-ctitle" maxlength="160">' +
      '<label class="form-label" for="f-cdetail">' + esc(T('e.catalogDetail')) + '</label><textarea class="form-control" id="f-cdetail" rows="3"></textarea>' +
      '</details></div>' +
      '</div><div class="alert alert-danger mt-3 mb-0 py-2 small" id="f-err" role="alert" hidden></div></div>' +
      '<div class="modal-footer">' +
      (isNew ? '' : '<button type="button" class="btn btn-outline-danger me-auto" data-act="delete"><i class="bi bi-trash" aria-hidden="true"></i> ' + esc(T('e.deleteCell')) + '</button>') +
      '<button type="button" class="btn btn-light" data-bs-dismiss="modal">' + esc(T('c.cancel')) + '</button>' +
      '<button type="submit" class="btn btn-accent"><i class="bi bi-check-lg" aria-hidden="true"></i> ' + esc(isNew ? T('e.add') : T('c.save')) + '</button></div></form>';

    var m = PG.ui.modal(html, { size: 'modal-lg', onShown: function (box) { box.querySelector(isNew ? '#f-title' : '#f-title').focus(); } });
    var box = m.el;
    var $ = function (s) { return box.querySelector(s); };
    var keyTouched = !isNew;

    function currentKey() { return $('#f-key').value.trim(); }
    function refresh() {
      var k = currentKey() || (isNew ? F.slugify($('#f-title').value) : '');
      var e = k ? F.element(doc(), k) : null;
      var dup = k && p.cells.some(function (x, i) { return x.key === k && (isNew || i !== idx); });
      var help = $('#f-key-help');
      if (!k) help.textContent = T('e.keyAuto');
      else if (dup) help.innerHTML = '<span class="text-danger">' + esc(T('e.keyDup')) + '</span>';
      else if (e) {
        var cols = doc().perspectives.filter(function (pp) { return pp !== p && pp.cells.some(function (x) { return x.key === k; }); }).map(function (pp) { return pp.title; });
        help.innerHTML = '<i class="bi bi-link-45deg" aria-hidden="true"></i> ' + esc(cols.length ? T('e.keyShared', { list: cols.join(', ') }) : T('e.keyCatalog'));
      } else help.textContent = T('e.keyNew');
      $('#f-title').placeholder = e ? e.title : T('e.titlePh');
      $('#f-title-help').textContent = e ? T('e.titleHelp', { title: e.title }) : '';
      $('#f-cat').hidden = !e;
      if (e && $('#f-ctitle').dataset.key !== k) {
        $('#f-ctitle').dataset.key = k;
        $('#f-ctitle').value = e.title;
        $('#f-cdetail').value = e.detail || '';
      }
    }
    $('#f-key').addEventListener('input', function () { keyTouched = !!currentKey(); refresh(); });
    $('#f-title').addEventListener('input', function () {
      if (isNew && !keyTouched) { $('#f-key').value = ''; }
      refresh();
    });
    refresh();

    if (!isNew) $('[data-act="delete"]').addEventListener('click', function () { m.hide(); deleteCell(pid, idx); });

    $('form').addEventListener('submit', function (ev) {
      ev.preventDefault();
      var err = $('#f-err');
      var title = $('#f-title').value.replace(/\s+/g, ' ').trim();
      var k = currentKey();
      if (!k) {
        if (!title) { err.hidden = false; err.textContent = T('e.needTitle'); $('#f-title').focus(); return; }
        k = uniqueKey(title, keyUsed);
      }
      if (/[\]\n]/.test(k) || k === F.SPACER_KEY) { err.hidden = false; err.textContent = T('e.badKey'); $('#f-key').focus(); return; }
      if (p.cells.some(function (x, i) { return x.key === k && (isNew || i !== idx); })) { err.hidden = false; err.textContent = T('e.keyDup'); $('#f-key').focus(); return; }
      var e = F.element(doc(), k);
      if (!e) {
        // new element: the title goes to the catalog, so that other columns can reuse it
        e = { key: k, title: title || F.humanize(k), detail: '', auto: false };
        doc().elements.push(e);
        title = '';
      } else if (!$('#f-cat').hidden) {
        var ct = $('#f-ctitle').value.trim(), cd = $('#f-cdetail').value.replace(/\s+$/, '');
        if ((ct && ct !== e.title) || cd !== (e.detail || '')) { e.title = ct || e.title; e.detail = cd; e.auto = false; }
      }
      var cell = isNew ? c : p.cells[idx];
      cell.key = k;
      cell.title = title && title !== e.title ? title : null;
      // an element created by the parser takes its title from its first cell: keep that title on the cell
      if (e.auto && !cell.title && title) cell.title = title;
      cell.state = $('#f-state').value;
      cell.badges = [].slice.call(box.querySelectorAll('#f-badges input:checked')).map(function (x) { return x.value; });
      cell.detail = $('#f-detail').value.replace(/\s+$/, '');
      if (isNew) p.cells.splice(idx, 0, cell);
      S().focus = { pid: pid, idx: idx };
      S().refocus = true;
      m.hide();
      F.prune(doc());
      commit();
      PG.ui.toast('<i class="bi bi-check-circle" aria-hidden="true"></i> ' + esc(isNew ? T('e.cellAdded') : T('e.saved')), 'success');
    });
  }

  /* ------------------------------------------------------------ column form */

  function columnForm(pid) {
    var isNew = !pid;
    var p = isNew ? { id: '', title: '', subtitle: null, summary: '', detail: '', cells: [] } : persp(pid);
    if (!p) return;
    var html = '<form class="modal-content" novalidate>' +
      '<div class="modal-header"><h2 class="modal-title h5"><i class="bi bi-layout-three-columns" aria-hidden="true"></i> ' + esc(isNew ? T('e.newColumn') : T('e.editColumn')) + '</h2>' +
      '<button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="' + esc(T('c.close')) + '"></button></div>' +
      '<div class="modal-body"><div class="row g-3">' +
      '<div class="col-sm-8"><label class="form-label fw-semibold" for="c-title">' + esc(T('e.colTitle')) + '</label><input class="form-control" id="c-title" required maxlength="120" value="' + esc(p.title) + '"></div>' +
      '<div class="col-sm-4"><label class="form-label fw-semibold" for="c-id">' + esc(T('e.colId')) + '</label><input class="form-control font-monospace" id="c-id" maxlength="60" spellcheck="false" value="' + esc(p.id) + '" placeholder="' + esc(T('e.auto')) + '"></div>' +
      '<div class="col-12"><label class="form-label fw-semibold" for="c-sub">' + esc(T('e.colSubtitle')) + '</label><input class="form-control" id="c-sub" maxlength="160" value="' + esc(p.subtitle || '') + '" placeholder="' + esc(T('e.colSubtitlePh')) + '"></div>' +
      '<div class="col-12"><label class="form-label fw-semibold" for="c-sum">' + esc(T('e.colSummary')) + '</label><textarea class="form-control" id="c-sum" rows="2" maxlength="400">' + esc(p.summary || '') + '</textarea></div>' +
      '<div class="col-12"><label class="form-label fw-semibold" for="c-detail">' + esc(T('e.colDetail')) + '</label><textarea class="form-control" id="c-detail" rows="5">' + esc(p.detail || '') + '</textarea><div class="form-text">' + esc(T('e.mdHelp')) + '</div></div>' +
      '</div><div class="alert alert-danger mt-3 mb-0 py-2 small" id="c-err" role="alert" hidden></div></div>' +
      '<div class="modal-footer">' +
      (isNew ? '' : '<button type="button" class="btn btn-outline-danger me-auto" data-act="delete"><i class="bi bi-trash" aria-hidden="true"></i> ' + esc(T('e.deleteColumn')) + '</button>') +
      '<button type="button" class="btn btn-light" data-bs-dismiss="modal">' + esc(T('c.cancel')) + '</button>' +
      '<button type="submit" class="btn btn-accent"><i class="bi bi-check-lg" aria-hidden="true"></i> ' + esc(isNew ? T('e.add') : T('c.save')) + '</button></div></form>';
    var m = PG.ui.modal(html, { size: 'modal-lg', onShown: function (box) { box.querySelector('#c-title').focus(); } });
    var box = m.el, $ = function (s) { return box.querySelector(s); };
    if (!isNew) $('[data-act="delete"]').addEventListener('click', function () { m.hide(); deleteColumn(pid); });
    $('form').addEventListener('submit', function (ev) {
      ev.preventDefault();
      var title = $('#c-title').value.trim();
      if (!title) { $('#c-err').hidden = false; $('#c-err').textContent = T('e.needTitle'); $('#c-title').focus(); return; }
      var id = F.slugify($('#c-id').value) || '';
      if (!id || (id !== p.id && idUsed(id))) id = uniqueKey(id || title, function (k) { return k !== p.id && idUsed(k); });
      var oldId = p.id;
      p.title = title;
      p.id = id;
      p.subtitle = $('#c-sub').value.trim() || null;
      p.summary = $('#c-sum').value.replace(/\s+$/, '').replace(/\n{2,}/g, '\n');
      p.detail = $('#c-detail').value.replace(/\s+$/, '');
      if (isNew) doc().perspectives.push(p);
      else if (oldId !== id) {
        var st = S(), i = st.selected.indexOf(oldId);
        if (i >= 0) st.selected[i] = id;
        if (st.src && st.src.pid === oldId) st.src.pid = id;
      }
      m.hide();
      commit();
      if (isNew) setTimeout(function () {
        var col = document.querySelector('#grid .pg-col[data-pid="' + (window.CSS ? CSS.escape(id) : id) + '"]');
        if (col) { col.scrollIntoView({ inline: 'end', block: 'nearest' }); var b = col.querySelector('[data-act="cell-add"]'); if (b) b.focus(); }
      }, 50);
      PG.ui.toast('<i class="bi bi-check-circle" aria-hidden="true"></i> ' + esc(isNew ? T('e.columnAdded') : T('e.saved')), 'success');
    });
  }

  /* -------------------------------------------------------- document form */

  function docForm() {
    var d = doc();
    var html = '<form class="modal-content" novalidate>' +
      '<div class="modal-header"><h2 class="modal-title h5"><i class="bi bi-card-heading" aria-hidden="true"></i> ' + esc(T('e.docProps')) + '</h2>' +
      '<button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="' + esc(T('c.close')) + '"></button></div>' +
      '<div class="modal-body"><div class="row g-3">' +
      '<div class="col-sm-9"><label class="form-label fw-semibold" for="d-title">' + esc(T('e.docTitle')) + '</label><input class="form-control" id="d-title" required maxlength="160" value="' + esc(d.meta.title || '') + '"></div>' +
      '<div class="col-sm-3"><label class="form-label fw-semibold" for="d-lang">' + esc(T('e.docLang')) + '</label><input class="form-control" id="d-lang" maxlength="10" value="' + esc(d.meta.lang || '') + '"></div>' +
      '<div class="col-12"><label class="form-label fw-semibold" for="d-sub">' + esc(T('e.docSubtitle')) + '</label><input class="form-control" id="d-sub" maxlength="200" value="' + esc(d.meta.subtitle || '') + '"></div>' +
      '<div class="col-12"><label class="form-label fw-semibold" for="d-intro">' + esc(T('e.docIntro')) + '</label><textarea class="form-control" id="d-intro" rows="4">' + esc(d.intro || '') + '</textarea><div class="form-text">' + esc(T('e.mdHelp')) + '</div></div>' +
      '<div class="col-sm-6"><label class="form-label fw-semibold" for="d-author">' + esc(T('e.docAuthor')) + '</label><input class="form-control" id="d-author" maxlength="160" value="' + esc(d.meta.author || '') + '"></div>' +
      '<div class="col-sm-6"><label class="form-label fw-semibold" for="d-source">' + esc(T('e.docSource')) + '</label><input class="form-control" id="d-source" maxlength="300" value="' + esc(d.meta.source || '') + '"></div>' +
      '<div class="col-12 small text-body-secondary">' + esc(T('e.docVersion', { v: d.meta.version, based: d.meta.based_on || '—', updated: d.meta.updated || '—' })) + '</div>' +
      '</div></div><div class="modal-footer"><button type="button" class="btn btn-light" data-bs-dismiss="modal">' + esc(T('c.cancel')) + '</button>' +
      '<button type="submit" class="btn btn-accent"><i class="bi bi-check-lg" aria-hidden="true"></i> ' + esc(T('c.save')) + '</button></div></form>';
    var m = PG.ui.modal(html, { size: 'modal-lg', onShown: function (box) { box.querySelector('#d-title').focus(); } });
    var box = m.el, $ = function (s) { return box.querySelector(s); };
    $('form').addEventListener('submit', function (ev) {
      ev.preventDefault();
      if (!$('#d-title').value.trim()) { $('#d-title').focus(); return; }
      d.meta.title = $('#d-title').value.trim();
      d.meta.subtitle = $('#d-sub').value.trim() || null;
      d.meta.lang = $('#d-lang').value.trim() || 'fr';
      d.meta.author = $('#d-author').value.trim() || null;
      d.meta.source = $('#d-source').value.trim() || null;
      d.intro = $('#d-intro').value.replace(/\s+$/, '');
      m.hide();
      commit();
    });
  }

  /* ----------------------------------------------------------- operations */

  function moveCell(pid, idx, dir) {
    var p = persp(pid), j = idx + dir;
    if (!p || j < 0 || j >= p.cells.length) return;
    var c = p.cells.splice(idx, 1)[0];
    p.cells.splice(j, 0, c);
    S().focus = { pid: pid, idx: c.spacer ? idx : j };
    S().refocus = true;
    commit();
    if (!c.spacer) PG.ui.announce(T('e.srMoved', { title: F.cellTitle(doc(), c), n: F.rankOf(p, j), total: p.cells.filter(function (x) { return !x.spacer; }).length }));
  }

  function deleteCell(pid, idx) {
    var p = persp(pid), c = p && p.cells[idx];
    if (!c) return;
    var label = c.spacer ? T('e.spacer') : F.cellTitle(doc(), c);
    PG.ui.confirm(T('e.confirmDeleteCell', { title: label, col: p.title }), { ok: T('e.deleteCell'), danger: true }).then(function (ok) {
      if (!ok) return;
      p.cells.splice(idx, 1);
      F.prune(doc());
      S().focus = { pid: pid, idx: Math.max(0, idx - 1) };
      S().refocus = true;
      commit();
      PG.ui.toast('<i class="bi bi-trash" aria-hidden="true"></i> ' + esc(T('e.cellDeleted', { title: label })) + ' <button type="button" class="btn btn-sm btn-light ms-2" data-undo>' + esc(T('e.undo')) + '</button>', 'dark');
    });
  }

  function deleteColumn(pid) {
    var p = persp(pid);
    if (!p) return;
    PG.ui.confirm(T('e.confirmDeleteColumn', { title: p.title, n: p.cells.length }), { ok: T('e.deleteColumn'), danger: true }).then(function (ok) {
      if (!ok) return;
      doc().perspectives = doc().perspectives.filter(function (x) { return x !== p; });
      S().selected = S().selected.filter(function (x) { return x !== pid; });
      if (S().src && S().src.pid === pid) S().src = null;
      F.prune(doc());
      commit();
      PG.ui.toast('<i class="bi bi-trash" aria-hidden="true"></i> ' + esc(T('e.columnDeleted', { title: p.title })) + ' <button type="button" class="btn btn-sm btn-light ms-2" data-undo>' + esc(T('e.undo')) + '</button>', 'dark');
    });
  }

  function duplicateColumn(pid) {
    var p = persp(pid);
    if (!p) return;
    var copy = PG.util.clone(p);
    copy.title = T('e.copyOf', { title: p.title });
    copy.id = uniqueKey(p.id + '-copie', idUsed);
    var i = doc().perspectives.indexOf(p);
    doc().perspectives.splice(i + 1, 0, copy);
    commit();
  }

  function addSpacer(pid, at) {
    var p = persp(pid);
    if (!p) return;
    p.cells.splice(at, 0, { key: null, title: null, state: 'default', badges: [], detail: '', spacer: true });
    commit();
  }

  /* --------------------------------------------- pointer drag (reorder cells) */

  var drag = null;
  function initDrag() {
    var grid = document.getElementById('grid');
    var pressTimer = null, pressStart = null;

    grid.addEventListener('pointerdown', function (e) {
      if (!S().editing || e.button > 0) return;
      var li = e.target.closest('.pg-cell');
      if (!li || li.querySelector('.pg-inline-editing')) return;
      var grip = e.target.closest('[data-act="grip"]');
      if (grip) { e.preventDefault(); start(li, e); return; }
      // long press anywhere on the cell (touch)
      if (e.pointerType === 'touch' && !e.target.closest('button:not([data-act="toggle"]),a,input,textarea')) {
        pressStart = { x: e.clientX, y: e.clientY };
        pressTimer = setTimeout(function () { pressTimer = null; if (navigator.vibrate) navigator.vibrate(15); start(li, e); }, 450);
      }
    });
    grid.addEventListener('pointermove', function (e) {
      if (pressTimer && pressStart && Math.hypot(e.clientX - pressStart.x, e.clientY - pressStart.y) > 8) { clearTimeout(pressTimer); pressTimer = null; }
    });
    ['pointerup', 'pointercancel'].forEach(function (t) { grid.addEventListener(t, function () { if (pressTimer) { clearTimeout(pressTimer); pressTimer = null; } }); });
    // block native scrolling while dragging on touch
    grid.addEventListener('touchmove', function (e) { if (drag) e.preventDefault(); }, { passive: false });
    grid.addEventListener('contextmenu', function (e) { if (drag || (S().editing && e.target.closest('[data-act="grip"]'))) e.preventDefault(); });
  }

  function start(li, e) {
    var ol = li.parentElement;
    var r = li.getBoundingClientRect();
    var ghost = li.cloneNode(true);
    ghost.classList.add('pg-ghost');
    ghost.style.width = r.width + 'px';
    ghost.style.left = r.left + 'px';
    ghost.style.top = r.top + 'px';
    ghost.removeAttribute('id');
    ghost.querySelectorAll('[id]').forEach(function (x) { x.removeAttribute('id'); });
    document.body.appendChild(ghost);
    li.classList.add('pg-dragging');
    document.body.classList.add('pg-drag-active');
    drag = { li: li, ol: ol, ghost: ghost, dy: e.clientY - r.top, from: [].slice.call(ol.querySelectorAll('.pg-cell')).indexOf(li), scroller: document.getElementById('scroller') };
    document.addEventListener('pointermove', move);
    document.addEventListener('pointerup', end);
    document.addEventListener('pointercancel', cancel);
    document.addEventListener('keydown', escKey, true);
  }

  function move(e) {
    if (!drag) return;
    e.preventDefault();
    drag.ghost.style.top = (e.clientY - drag.dy) + 'px';
    var cells = [].slice.call(drag.ol.querySelectorAll('.pg-cell')).filter(function (x) { return x !== drag.li; });
    var before = null;
    for (var i = 0; i < cells.length; i++) {
      var r = cells[i].getBoundingClientRect();
      if (e.clientY < r.top + r.height / 2) { before = cells[i]; break; }
    }
    var addLast = drag.ol.querySelector('.pg-add-last');
    drag.ol.insertBefore(drag.li, before || addLast || null);
    // auto-scroll near the edges of the grid
    var s = drag.scroller.getBoundingClientRect();
    if (e.clientY < s.top + 40) drag.scroller.scrollTop -= 12;
    else if (e.clientY > s.bottom - 40) drag.scroller.scrollTop += 12;
  }

  function cleanup() {
    document.removeEventListener('pointermove', move);
    document.removeEventListener('pointerup', end);
    document.removeEventListener('pointercancel', cancel);
    document.removeEventListener('keydown', escKey, true);
    drag.ghost.remove();
    drag.li.classList.remove('pg-dragging');
    document.body.classList.remove('pg-drag-active');
  }
  function escKey(e) { if (e.key === 'Escape') { e.preventDefault(); cancel(); } }
  function cancel() { if (!drag) return; cleanup(); drag = null; PG.app.render(); }
  function end() {
    if (!drag) return;
    var d = drag;
    cleanup();
    drag = null;
    var to = [].slice.call(d.ol.querySelectorAll('.pg-cell')).indexOf(d.li);
    if (to === d.from || to < 0) { PG.app.render(); return; }
    var pid = d.li.getAttribute('data-pid');
    var p = persp(pid);
    var c = p.cells.splice(d.from, 1)[0];
    p.cells.splice(to, 0, c);
    S().focus = { pid: pid, idx: to };
    S().refocus = true;
    commit();
    if (!c.spacer) PG.ui.announce(T('e.srMoved', { title: F.cellTitle(doc(), c), n: F.rankOf(p, to), total: p.cells.filter(function (x) { return !x.spacer; }).length }));
  }

  PG.edit = {
    init: initDrag,
    inline: inline,
    editCell: function (pid, idx) { cellForm(pid, idx, false); },
    addCell: function (pid, at) { cellForm(pid, at, true); },
    addSpacer: addSpacer,
    moveCell: moveCell,
    deleteCell: deleteCell,
    editColumn: function (pid) { columnForm(pid); },
    addColumn: function () { columnForm(null); },
    deleteColumn: deleteColumn,
    duplicateColumn: duplicateColumn,
    editDoc: docForm
  };
})(window.PG);
