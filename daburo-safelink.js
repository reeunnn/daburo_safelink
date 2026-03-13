/*!
 * DABURO SAFELINK CONVERTER v2.0
 * Domain-based auto safelink — mirip sistem ouo.io
 *
 * CARA PAKAI:
 * 1. Taruh config di bawah ini SEBELUM tag </body>
 * 2. Isi safelinkBase dengan URL safelink kamu
 * 3. Isi domains[] dengan domain yang mau di-safelink
 * 4. Load script ini setelahnya
 *
 * CONTOH:
 *   <script>
 *     var daburo_safelink = 'https://daburosafelink.blogspot.com/';
 *     var domains = ['gdrive.com', 'mega.nz', 'mediafire.com'];
 *   </script>
 *   <script src="daburo-safelink.js"></script>
 */

(function () {
  'use strict';

  /* ─── Ambil config dari variable global ─── */
  var SAFELINK_BASE = (typeof daburo_safelink !== 'undefined')
    ? daburo_safelink
    : 'https://daburosafelink.blogspot.com/';

  var DOMAINS = (typeof domains !== 'undefined' && Array.isArray(domains))
    ? domains.map(function (d) { return d.toLowerCase().replace(/^www\./, ''); })
    : [];

  var LINK_SELECTOR = (typeof daburo_selector !== 'undefined')
    ? daburo_selector
    : 'a'; /* default semua <a>, atau bisa diset ke 'a.dl-btn' */

  var OPEN_NEW_TAB = (typeof daburo_newtab !== 'undefined') ? daburo_newtab : true;

  /* ─── Helpers ─── */
  function b64enc(str) {
    try { return btoa(unescape(encodeURIComponent(str))); }
    catch (e) { return btoa(str); }
  }

  function getHostname(url) {
    try {
      return new URL(url).hostname.toLowerCase().replace(/^www\./, '');
    } catch (e) {
      /* fallback untuk browser lama */
      var m = url.match(/^https?:\/\/([^/?#]+)/i);
      return m ? m[1].toLowerCase().replace(/^www\./, '') : '';
    }
  }

  function isDomainListed(href) {
    if (!DOMAINS.length) return false; /* kalau kosong, tidak convert apapun */
    var host = getHostname(href);
    if (!host) return false;
    for (var i = 0; i < DOMAINS.length; i++) {
      /* support wildcard prefix, misal: *.mediafire.com */
      var d = DOMAINS[i];
      if (d === host || host === d || host.endsWith('.' + d)) return true;
    }
    return false;
  }

  function getPostTitle() {
    var selectors = [
      'h1.post-title', 'h1.entry-title',
      'h2.post-title', 'h2.entry-title',
      '.post-title', '.entry-title'
    ];
    for (var i = 0; i < selectors.length; i++) {
      var el = document.querySelector(selectors[i]);
      if (el) return (el.textContent || '').trim();
    }
    return document.title.split('|')[0].split('–')[0].trim();
  }

  function getServerName(anchor) {
    var table = anchor.closest('table');
    if (!table) return '';
    var block = table.closest('.dl-block') || table.parentElement;
    if (!block) return '';
    var allNames = block.querySelectorAll('.dl-server-name');
    var result = '';
    allNames.forEach(function (el) {
      if (el.compareDocumentPosition(table) & Node.DOCUMENT_POSITION_FOLLOWING) {
        result = (el.textContent || '').trim();
      }
    });
    if (!result && allNames.length) result = (allNames[0].textContent || '').trim();
    return result;
  }

  /* ─── Main convert ─── */
  function convert() {
    var links = document.querySelectorAll(LINK_SELECTOR);
    if (!links.length) return;

    var postTitle = getPostTitle();

    links.forEach(function (a) {
      var href = a.getAttribute('href');
      if (!href || href === '#') return;
      if (href.indexOf(SAFELINK_BASE) === 0) return; /* sudah safelink */
      if (a.dataset.slDone) return; /* sudah diproses */
      if (!isDomainListed(href)) return; /* domain tidak ada di daftar */

      a.dataset.slDone = '1';

      /* Resolusi dari .res di row yang sama */
      var res = '';
      var row = a.closest('tr');
      if (row) {
        var resEl = row.querySelector('.res');
        if (resEl) res = (resEl.textContent || '').trim();
      }

      /* Ukuran file dari kolom ke-2 */
      var size = '';
      if (row) {
        var cells = row.querySelectorAll('td');
        if (cells[1]) {
          var s = (cells[1].textContent || '').trim();
          if (s && s !== '—') size = s;
        }
      }

      /* Title: "Judul Post [Resolusi]" */
      var title = postTitle;
      if (title && res) title = title + ' [' + res + ']';

      /* Host/server name */
      var host = getServerName(a);
      if (!host) host = getHostname(href); /* fallback ke nama domain */

      /* Build safelink URL */
      var params = new URLSearchParams();
      params.set('url', b64enc(href));
      if (title) params.set('title', title);
      if (host)  params.set('host', host);
      if (size)  params.set('size', size);

      a.href   = SAFELINK_BASE + '?' + params.toString();
      a.target = OPEN_NEW_TAB ? '_blank' : '_self';
      a.rel    = 'nofollow noopener noreferrer';
    });
  }

  /* ─── Run ─── */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', convert);
  } else {
    convert();
  }
  window.addEventListener('load', convert); /* safety net untuk konten dinamis */

})();
