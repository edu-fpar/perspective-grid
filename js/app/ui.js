/*!
 * Shared UI helpers: toasts, in-page dialogs, file reading/downloading, popup menus, live announcements.
 * (confirm()/prompt() natives are often blocked in embedded browsers, as in MicroLearn's ui.js.)
 */
(function (PG) {
  'use strict';

  var esc = PG.util.escapeHtml;
  function T(k, v) { return PG.i18n.t(k, v); }

  PG.ui = {
    toast: function (msg, variant) {
      var box = document.getElementById('toasts');
      if (!box) return;
      var t = document.createElement('div');
      t.className = 'toast align-items-center border-0 text-bg-' + (variant || 'dark');
      t.setAttribute('role', 'status');
      t.innerHTML = '<div class="d-flex"><div class="toast-body">' + msg + '</div>' +
        '<button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="' + esc(T('c.close')) + '"></button></div>';
      box.appendChild(t);
      var bt = new bootstrap.Toast(t, { delay: 3200 });
      t.addEventListener('hidden.bs.toast', function () { t.remove(); });
      bt.show();
    },

    /** Polite screen-reader announcement. */
    announce: function (msg) {
      var live = document.getElementById('live');
      if (!live) return;
      live.textContent = '';
      setTimeout(function () { live.textContent = msg; }, 30);
    },

    confirm: function (message, opts) { return PG.ui.dialog(message, opts).then(function (r) { return r !== null; }); },
    prompt: function (message, value, opts) { opts = opts || {}; opts.input = value == null ? '' : String(value); return PG.ui.dialog(message, opts); },
    dialog: function (message, opts) {
      opts = opts || {};
      return new Promise(function (resolve) {
        var el = document.createElement('div');
        el.className = 'modal fade';
        el.tabIndex = -1;
        el.innerHTML = '<div class="modal-dialog modal-dialog-centered"><form class="modal-content" aria-label="' + esc(opts.title || message) + '">' +
          '<div class="modal-body"><p class="mb-0" style="white-space:pre-line"></p>' +
          (opts.input != null ? '<input class="form-control mt-3" maxlength="160">' : '') + '</div>' +
          '<div class="modal-footer"><button type="button" class="btn btn-light" data-bs-dismiss="modal">' + esc(opts.cancel || T('c.cancel')) + '</button>' +
          '<button type="submit" class="btn ' + (opts.danger ? 'btn-danger' : 'btn-accent') + '">' + esc(opts.ok || T('c.ok')) + '</button></div>' +
          '</form></div>';
        el.querySelector('p').textContent = message;
        var input = el.querySelector('input');
        if (input) input.value = opts.input;
        document.body.appendChild(el);
        var result = null;
        var modal = new bootstrap.Modal(el);
        el.querySelector('form').addEventListener('submit', function (e) { e.preventDefault(); result = input ? input.value : true; modal.hide(); });
        el.addEventListener('shown.bs.modal', function () { if (input) { input.focus(); input.select(); } else el.querySelector('[type=submit]').focus(); });
        el.addEventListener('hidden.bs.modal', function () { modal.dispose(); el.remove(); resolve(result); });
        modal.show();
      });
    },

    readFile: function (accept) {
      return new Promise(function (resolve) {
        var inp = document.createElement('input');
        inp.type = 'file';
        inp.accept = accept;
        inp.onchange = function () {
          var f = inp.files[0];
          if (!f) return;
          PG.ui.readBlob(f).then(resolve);
        };
        inp.click();
      });
    },
    readBlob: function (file) {
      return new Promise(function (resolve) {
        var r = new FileReader();
        r.onload = function () { resolve({ name: file.name, text: String(r.result).replace(/^﻿/, '').replace(/\r\n?/g, '\n') }); };
        r.readAsText(file, 'utf-8');
      });
    },
    isTextFile: function (file) { return /\.(md|markdown|txt)$/i.test(file.name) || /^text\//.test(file.type || ''); },

    downloadText: function (text, filename, type) {
      var a = document.createElement('a');
      a.href = URL.createObjectURL(new Blob([text], { type: type || 'text/markdown;charset=utf-8' }));
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
    },

    copy: function (text) {
      return new Promise(function (resolve) {
        function fallback() {
          var ta = document.createElement('textarea');
          ta.value = text; ta.setAttribute('readonly', ''); ta.style.position = 'fixed'; ta.style.opacity = '0';
          document.body.appendChild(ta); ta.select();
          var ok = false;
          try { ok = document.execCommand('copy'); } catch (e) { ok = false; }
          ta.remove(); resolve(ok);
        }
        if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(function () { resolve(true); }, fallback);
        else fallback();
      });
    },

    formatDate: function (iso) {
      try {
        return new Date(iso).toLocaleString(T('c.dateLocale'), { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
      } catch (e) { return iso; }
    },

    /** Builds and shows a Bootstrap modal from HTML; removed from the DOM when hidden. */
    modal: function (html, opts) {
      opts = opts || {};
      var el = document.createElement('div');
      el.className = 'modal fade';
      el.tabIndex = -1;
      el.innerHTML = '<div class="modal-dialog modal-dialog-centered modal-dialog-scrollable ' + (opts.size || '') + '">' + html + '</div>';
      document.body.appendChild(el);
      var m = new bootstrap.Modal(el, { backdrop: opts.static ? 'static' : true });
      el.addEventListener('hidden.bs.modal', function () { m.dispose(); el.remove(); if (opts.onHidden) opts.onHidden(); });
      if (opts.onShown) el.addEventListener('shown.bs.modal', function () { opts.onShown(el); });
      m.show();
      return { el: el, modal: m, hide: function () { m.hide(); } };
    }
  };

  /* ------------------------------------------------------------------ popup menu
   * One shared menu element, positioned next to its button (lighter than one Bootstrap dropdown per cell).
   * items: [{ header } | { divider } | { label, icon, hint, checked, role, disabled, danger, onSelect }]
   */
  var menuEl = null, menuAnchor = null, menuOnClose = null;
  function closeMenu(focusBack) {
    if (!menuEl) return;
    menuEl.remove();
    menuEl = null;
    document.removeEventListener('pointerdown', outside, true);
    window.removeEventListener('resize', resizeClose);
    if (menuAnchor) { menuAnchor.setAttribute('aria-expanded', 'false'); if (focusBack !== false) menuAnchor.focus({ preventScroll: true }); }
    menuAnchor = null;
    if (menuOnClose) { var f = menuOnClose; menuOnClose = null; f(); }
  }
  function outside(e) { if (menuEl && !menuEl.contains(e.target) && e.target !== menuAnchor && !(menuAnchor && menuAnchor.contains(e.target))) closeMenu(false); }
  function resizeClose() { closeMenu(false); }

  PG.ui.menu = {
    isOpen: function () { return !!menuEl; },
    close: closeMenu,
    open: function (anchor, items, opts) {
      opts = opts || {};
      var same = menuAnchor === anchor;
      closeMenu(false);
      if (same && !opts.force) return;
      menuAnchor = anchor;
      menuOnClose = opts.onClose || null;
      var el = document.createElement('div');
      el.className = 'pg-menu shadow';
      el.setAttribute('role', 'menu');
      if (opts.label) el.setAttribute('aria-label', opts.label);
      items.forEach(function (it) {
        if (it.divider) { var d = document.createElement('div'); d.className = 'pg-menu-divider'; d.setAttribute('role', 'separator'); el.appendChild(d); return; }
        if (it.header) { var h = document.createElement('div'); h.className = 'pg-menu-header'; h.setAttribute('role', 'presentation'); h.textContent = it.header; el.appendChild(h); return; }
        var b = document.createElement('button');
        b.type = 'button';
        b.className = 'pg-menu-item' + (it.danger ? ' text-danger' : '') + (it.cls ? ' ' + it.cls : '');
        b.setAttribute('role', it.role || 'menuitem');
        if (it.role === 'menuitemradio' || it.role === 'menuitemcheckbox') b.setAttribute('aria-checked', it.checked ? 'true' : 'false');
        if (it.disabled) b.disabled = true;
        b.tabIndex = -1;
        b.innerHTML = (it.role === 'menuitemradio' || it.role === 'menuitemcheckbox'
          ? '<i class="bi ' + (it.checked ? (it.role === 'menuitemradio' ? 'bi-record-circle-fill' : 'bi-check-square-fill') : (it.role === 'menuitemradio' ? 'bi-circle' : 'bi-square')) + ' pg-menu-check" aria-hidden="true"></i>' : '') +
          (it.icon ? '<i class="bi ' + esc(it.icon) + ' pg-menu-icon ' + (it.iconCls || '') + '" aria-hidden="true"></i>' : '') +
          '<span class="pg-menu-label">' + esc(it.label) + '</span>' +
          (it.hint ? '<kbd class="pg-menu-hint" aria-hidden="true">' + esc(it.hint) + '</kbd>' : '');
        b.addEventListener('click', function () {
          var keep = it.keepOpen;
          if (!keep) closeMenu(true);
          if (it.onSelect) it.onSelect();
          if (keep) {
            it.checked = !it.checked;
            b.setAttribute('aria-checked', it.checked ? 'true' : 'false');
            var ic = b.querySelector('.pg-menu-check');
            if (ic) ic.className = 'bi ' + (it.checked ? 'bi-check-square-fill' : 'bi-square') + ' pg-menu-check';
          }
        });
        el.appendChild(b);
      });
      el.addEventListener('keydown', function (e) {
        var btns = [].slice.call(el.querySelectorAll('.pg-menu-item:not(:disabled)'));
        var i = btns.indexOf(document.activeElement);
        if (e.key === 'ArrowDown') { e.preventDefault(); btns[(i + 1) % btns.length].focus(); }
        else if (e.key === 'ArrowUp') { e.preventDefault(); btns[(i - 1 + btns.length) % btns.length].focus(); }
        else if (e.key === 'Home') { e.preventDefault(); btns[0].focus(); }
        else if (e.key === 'End') { e.preventDefault(); btns[btns.length - 1].focus(); }
        else if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); closeMenu(true); }
        else if (e.key === 'Tab') { closeMenu(true); }
        else if (opts.onKey) opts.onKey(e);
      });
      document.body.appendChild(el);
      menuEl = el;
      anchor.setAttribute('aria-expanded', 'true');
      // position
      var r = anchor.getBoundingClientRect(), mw = el.offsetWidth, mh = el.offsetHeight;
      var vw = document.documentElement.clientWidth, vh = window.innerHeight;
      var left = Math.min(Math.max(8, r.right - mw), vw - mw - 8);
      var top = r.bottom + 4;
      if (top + mh > vh - 8) top = Math.max(8, r.top - mh - 4);
      if (top + mh > vh - 8) { top = 8; el.style.maxHeight = (vh - 16) + 'px'; }
      el.style.left = left + 'px';
      el.style.top = top + 'px';
      setTimeout(function () {
        document.addEventListener('pointerdown', outside, true);
        window.addEventListener('resize', resizeClose);
      }, 0);
      var first = el.querySelector('.pg-menu-item[aria-checked="true"]:not(:disabled)') || el.querySelector('.pg-menu-item:not(:disabled)');
      if (first) first.focus({ preventScroll: true });
    }
  };
})(window.PG);
