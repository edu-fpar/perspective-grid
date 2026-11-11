/*!
 * Perspective Grid — shared namespace: utilities, safe storage, share links, safe Markdown rendering.
 * 100 % client-side, no network dependency (same conventions as MicroLearn's mls.js).
 */
(function (global) {
  'use strict';

  var PG = global.PG || {};
  PG.version = '1.0.0';

  PG.util = {
    escapeHtml: function (s) {
      return String(s == null ? '' : s)
        .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
    },
    debounce: function (fn, ms) {
      var t;
      return function () {
        var args = arguments, self = this;
        clearTimeout(t);
        t = setTimeout(function () { fn.apply(self, args); }, ms);
      };
    },
    uid: function (prefix) {
      return (prefix || 'id') + '-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
    },
    clone: function (o) { return JSON.parse(JSON.stringify(o)); },
    today: function () {
      var d = new Date();
      return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
    },
    reducedMotion: function () {
      return !!(global.matchMedia && global.matchMedia('(prefers-reduced-motion: reduce)').matches);
    }
  };

  /** localStorage access that never throws (private browsing, file://, quota). */
  PG.store = {
    get: function (key, fallback) {
      try {
        var v = global.localStorage.getItem('pg.' + key);
        return v == null ? fallback : JSON.parse(v);
      } catch (e) { return fallback; }
    },
    set: function (key, value) {
      try { global.localStorage.setItem('pg.' + key, JSON.stringify(value)); return true; } catch (e) { return false; }
    },
    remove: function (key) {
      try { global.localStorage.removeItem('pg.' + key); } catch (e) { /* ignore */ }
    }
  };

  /* ------------------------------------------------------------------ share links
   * The Markdown is compressed (deflate-raw) then base64url-encoded into the URL fragment (#z=…),
   * which is never sent to the server. Same scheme as MicroLearn's share.js. */
  function supported() { return typeof CompressionStream === 'function' && typeof DecompressionStream === 'function'; }
  function toB64url(bytes) {
    var s = '';
    for (var i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
    return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }
  function fromB64url(str) {
    var b = String(str).replace(/-/g, '+').replace(/_/g, '/').replace(/\s/g, '');
    while (b.length % 4) b += '=';
    var bin = atob(b), out = new Uint8Array(bin.length);
    for (var i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
    return out;
  }
  function pipe(bytes, stream) {
    var piped = new Blob([bytes]).stream().pipeThrough(stream);
    return new Response(piped).arrayBuffer().then(function (buf) { return new Uint8Array(buf); });
  }
  PG.share = {
    supported: supported,
    encode: function (md) {
      if (!supported()) return Promise.reject(new Error('compression unsupported'));
      return pipe(new TextEncoder().encode(md), new CompressionStream('deflate-raw')).then(toB64url);
    },
    decode: function (str) {
      if (!supported()) return Promise.reject(new Error('compression unsupported'));
      return pipe(fromB64url(str), new DecompressionStream('deflate-raw')).then(function (b) { return new TextDecoder().decode(b); });
    },
    /** Absolute URL of the app page, without query or fragment. */
    baseUrl: function () { return location.href.replace(/[?#].*$/, ''); }
  };

  /* ------------------------------------------------------------- safe Markdown
   * Content can come from any link: the HTML produced by marked is sanitised (no scripts,
   * no event handlers, no javascript: URLs). Parsing happens in an inert <template>. */
  var BAD_TAGS = /^(script|style|iframe|frame|frameset|object|embed|applet|base|meta|link|form|input|button|textarea|select|noscript|template|svg|math)$/i;
  var URL_ATTRS = /^(href|src|xlink:href|action|formaction|poster|background|data|srcset)$/i;
  function unsafeUrl(v) { return /^\s*(javascript|vbscript|data:(?!image\/(png|jpe?g|gif|webp);))/i.test(String(v).replace(/[\u0000- ]+/g, '')); }
  function sanitize(html) {
    var tpl = document.createElement('template');
    tpl.innerHTML = html;
    [].slice.call(tpl.content.querySelectorAll('*')).forEach(function (el) {
      if (BAD_TAGS.test(el.localName)) { el.remove(); return; }
      [].slice.call(el.attributes).forEach(function (a) {
        var n = a.name.toLowerCase();
        if (n.indexOf('on') === 0 || n === 'style' || n === 'srcdoc' || (URL_ATTRS.test(n) && unsafeUrl(a.value))) el.removeAttribute(a.name);
      });
      if (el.localName === 'a') { el.setAttribute('target', '_blank'); el.setAttribute('rel', 'noopener noreferrer'); }
    });
    return tpl.innerHTML;
  }
  PG.md = function (text) {
    if (!text) return '';
    try { return sanitize(global.marked.parse(String(text), { gfm: true, breaks: false })); } catch (e) { return PG.util.escapeHtml(text); }
  };
  PG.mdInline = function (text) {
    if (!text) return '';
    try { return sanitize(global.marked.parseInline(String(text))); } catch (e) { return PG.util.escapeHtml(text); }
  };
  PG.sanitize = sanitize;

  global.PG = PG;
})(window);
