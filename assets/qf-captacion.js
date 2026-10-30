/* QuijoteFinanzas · Captación de suscriptores (ES5, sin dependencias)
 * - CTA de QuijoExcel tras cada resultado de calculadora (también en iframes embedCalc)
 * - Bloque «Avísame si cambia algún tipo» en QuijoCuentas
 * - Aviso lateral discreto (escritorio) / barra inferior (móvil)
 * Formularios de Kit reutilizados: 9947329 (QuijoExcel) y 9947108 (newsletter).
 */
(function(){
  'use strict';
  // ID del formulario «Alertas QuijoCuentas» en Kit. Vacío = se usa la newsletter general (9947108).
  var QF_KIT_ALERTAS_FORM_ID = '';
  var NEWSLETTER_FORM_ID = '9947108';
  var EXCEL_FORM_ID = '9947329';
  var KEY_SUB = 'qf_subscribed';
  var KEY_NUDGE = 'qf_nudge_dismissed_at';
  var NUDGE_DAYS = 30;
  var MIN_DELAY_MS = 10000;

  var doc = document, win = window;
  var params; try { params = new URLSearchParams(location.search); } catch(e) { params = null; }
  var isEmbed = !!(params && params.get('embedCalc'));
  var hasModal = function(){ return typeof win.openExcelModal === 'function' && !!doc.getElementById('excel-modal-overlay'); };

  function track(name, p){
    p = p || {};
    try {
      if (typeof win.qfTrack === 'function') { win.qfTrack(name, p); return; }
      // Páginas sin qfTrack: gtag respeta el consentimiento por defecto (analytics_storage denied).
      if (typeof win.gtag === 'function') win.gtag('event', name, p);
    } catch(e) {}
  }
  function lsGet(k){ try { return localStorage.getItem(k); } catch(e) { return null; } }
  function lsSet(k, v){ try { localStorage.setItem(k, v); } catch(e) {} }
  function isSubscribed(){ return !!lsGet(KEY_SUB); }
  function markSubscribed(source){ lsSet(KEY_SUB, JSON.stringify({source: source || 'site', ts: Date.now()})); }
  function el(tag, attrs, html){
    var n = doc.createElement(tag);
    for (var k in attrs) if (attrs.hasOwnProperty(k)) n.setAttribute(k, attrs[k]);
    if (html != null) n.innerHTML = html;
    return n;
  }
  var excelUrl = function(src){ return '/?qfopen=quijoexcel&src=' + encodeURIComponent(src) + '#recursos'; };

  function openExcel(src){
    if (hasModal()) { win.openExcelModal(src); return; }
    // Fuera del SPA (iframe o páginas sueltas) se abre la home con el modal.
    try { (win.top || win).location.href = excelUrl(src); } catch(e) { location.href = excelUrl(src); }
  }

  /* ── Estilos ───────────────────────────────────────────────────── */
  var css = ''
  + '.qf-cap-cta{display:flex;gap:14px;align-items:center;justify-content:space-between;flex-wrap:wrap;margin:16px 0 4px;padding:14px 16px;border:1px solid var(--border,#dfe6ee);border-left:3px solid var(--gold,#c9a84c);border-radius:10px;background:rgba(201,168,76,.06);font-size:13.5px;line-height:1.5}'
  + '.qf-cap-cta p{margin:0;flex:1 1 260px;color:inherit}.qf-cap-cta strong{display:block;margin-bottom:2px}'
  + '.qf-cap-btn{display:inline-block;padding:9px 14px;border-radius:8px;border:1px solid var(--gold,#c9a84c);background:var(--gold,#c9a84c);color:#0f2035;font:inherit;font-weight:650;font-size:13px;text-decoration:none;cursor:pointer;white-space:nowrap}'
  + '.qf-cap-btn:focus-visible,.qf-cap-x:focus-visible{outline:2px solid #0f2035;outline-offset:2px}'
  + '.qf-cap-alerts{margin:22px 0;padding:18px 20px;border:1px solid var(--border,#dfe6ee);border-radius:12px;background:var(--card,transparent)}'
  + '.qf-cap-alerts h3{margin:0 0 4px;font-size:17px}.qf-cap-alerts p{margin:0 0 12px;font-size:13.5px;opacity:.85}'
  + '.qf-cap-alerts form{display:flex;gap:8px;flex-wrap:wrap}.qf-cap-alerts label{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0)}'
  + '.qf-cap-alerts input[type=email]{flex:1 1 220px;padding:10px 12px;border:1px solid var(--border,#dfe6ee);border-radius:8px;font:inherit;font-size:14px}'
  + '.qf-cap-note{font-size:11.5px!important;margin:8px 0 0!important;opacity:.7}'
  + '.qf-nudge{position:fixed;z-index:9000;right:20px;bottom:100px;width:320px;max-width:calc(100vw - 40px);padding:16px 18px;border:1px solid var(--border,#dfe6ee);border-radius:12px;background:var(--card,#fff);color:var(--text,#22384e);box-shadow:0 10px 30px rgba(15,32,53,.18);font-size:13.5px;line-height:1.5;transform:translateY(16px);opacity:0;transition:transform .25s ease,opacity .25s ease}'
  + '/* Deja libre el botón de QuijoBot (abajo a la derecha). */'
  + '.qf-nudge.show{transform:none;opacity:1}.qf-nudge h2{margin:0 26px 4px 0;font-size:15px}.qf-nudge p{margin:0 0 12px}'
  + '.qf-cap-x{position:absolute;top:6px;right:6px;width:32px;height:32px;border:0;background:transparent;color:inherit;font-size:20px;line-height:1;cursor:pointer;border-radius:6px}'
  + '.qf-nudge.bar{left:10px;right:94px;bottom:14px;width:auto;max-width:none;border-radius:10px;padding:8px 40px 8px 12px;display:flex;align-items:center;gap:10px;box-shadow:0 -4px 14px rgba(15,32,53,.12)}'
  + '.qf-nudge.bar h2{display:none}.qf-nudge.bar p{margin:0;flex:1;font-size:13px}.qf-nudge.bar .qf-cap-btn{padding:8px 12px}.qf-nudge.bar .qf-cap-x{top:50%;margin-top:-16px}'
  + '@media (prefers-reduced-motion:reduce){.qf-nudge{transition:none;transform:none}}'
  + '@media print{.qf-nudge,.qf-cap-cta{display:none!important}}';
  function injectCss(){ if (doc.getElementById('qf-captacion-css')) return; var s = el('style', {id:'qf-captacion-css'}); s.textContent = css; (doc.head || doc.documentElement).appendChild(s); }

  /* ── 1. CTA tras el resultado de cada calculadora ──────────────── */
  function calcIdOf(panel){
    var ov = panel.closest ? panel.closest('.calc-overlay') : null;
    if (ov && ov.id) return ov.id.replace('modal-', '');
    return (panel.id || 'calc').replace('-results', '');
  }
  function hasResult(panel){
    return panel.children.length > 0 && !panel.querySelector('.empty-state') && panel.textContent.replace(/\s/g, '').length > 0;
  }
  var seenCalc = {};
  function ensureCalcCta(panel){
    var id = calcIdOf(panel), src = 'calc-' + id;
    var next = panel.nextElementSibling;
    var existing = (next && next.classList && next.classList.contains('qf-cap-cta')) ? next : null;
    if (!hasResult(panel)) { if (existing) existing.style.display = 'none'; return; }
    if (existing) { existing.style.display = ''; return; }
    var cta = el('div', {'class':'qf-cap-cta', 'data-qf-placement':src},
      '<p><strong>¿Quieres seguir estos números mes a mes?</strong>QuijoExcel es la plantilla gratuita de presupuesto, ahorro e inversiones. Te la envío por email.</p>'
      + '<a class="qf-cap-btn" href="' + excelUrl(src) + '" target="_top" data-qf-excel="' + src + '">Recibir QuijoExcel</a>');
    panel.parentNode.insertBefore(cta, panel.nextSibling);
    if (!seenCalc[src]) { seenCalc[src] = 1; track('capture_impression', {placement: src, offer: 'quijoexcel', embed: isEmbed}); }
  }
  function initCalcCtas(){
    var panels = doc.querySelectorAll('.results-panel');
    if (!panels.length || !win.MutationObserver) return;
    var mo = new MutationObserver(function(muts){
      for (var i = 0; i < muts.length; i++) {
        var t = muts[i].target;
        while (t && t.nodeType === 1 && !(t.classList && t.classList.contains('results-panel'))) t = t.parentNode;
        if (t && t.nodeType === 1) ensureCalcCta(t);
      }
    });
    for (var i = 0; i < panels.length; i++) mo.observe(panels[i], {childList: true, subtree: true, characterData: true});
  }

  /* ── 2. Bloque de alertas en QuijoCuentas ──────────────────────── */
  function initAlerts(){
    var host = doc.getElementById('cuentas-content');
    if (!host || doc.getElementById('qf-alertas')) return;
    var fallback = !QF_KIT_ALERTAS_FORM_ID;
    var formId = fallback ? NEWSLETTER_FORM_ID : QF_KIT_ALERTAS_FORM_ID;
    var box = el('div', {'class':'qf-cap-alerts', id:'qf-alertas', 'data-qf-placement':'quijocuentas-alertas'},
      '<h3>Avísame si cambia algún tipo</h3>'
      + '<p>' + (fallback
          ? 'Apúntate a la newsletter y recibirás avisos de cambios en QuijoCuentas: subidas o bajadas de remuneración, promociones que terminan y entidades nuevas.'
          : 'Te escribo cuando cambie la remuneración de una cuenta o depósito de QuijoCuentas, termine una promoción o entre una entidad nueva.') + '</p>'
      + '<form action="https://app.kit.com/forms/' + formId + '/subscriptions" method="post" target="qf-alertas-frame">'
      + '<label for="qf-alertas-email">Correo electrónico</label>'
      + '<input id="qf-alertas-email" type="email" name="email_address" placeholder="tu@email.com" required autocomplete="email">'
      + '<button class="qf-cap-btn" type="submit">Avísame</button></form>'
      + '<iframe name="qf-alertas-frame" title="Envío de suscripción a avisos" style="display:none"></iframe>'
      + '<p class="qf-cap-note" role="status" aria-live="polite">Gratis. Confirmas por email y puedes darte de baja cuando quieras.</p>');
    host.parentNode.insertBefore(box, host.nextSibling);
    var form = box.querySelector('form'), note = box.querySelector('.qf-cap-note');
    form.addEventListener('submit', function(){
      markSubscribed('quijocuentas-alertas');
      try { lsSet('qf_newsletter_source', JSON.stringify({source:'quijocuentas-alertas', ts:Date.now()})); } catch(e) {}
      track('capture_submit', {placement:'quijocuentas-alertas', offer: fallback ? 'newsletter' : 'alertas', form_id: formId});
      setTimeout(function(){ form.style.display = 'none'; note.innerHTML = '<strong>Ya casi está.</strong> Revisa tu correo y pulsa «Confirmar suscripción».'; }, 250);
    });
    if (win.IntersectionObserver) {
      var io = new IntersectionObserver(function(es){ if (es[0].isIntersecting) { io.disconnect(); track('capture_impression', {placement:'quijocuentas-alertas', offer: fallback ? 'newsletter' : 'alertas'}); } });
      io.observe(box);
    }
  }

  /* ── 3. Aviso lateral (escritorio) / barra inferior (móvil) ────── */
  function nudgeAllowed(){
    if (isEmbed || isSubscribed()) return false;
    var last = parseInt(lsGet(KEY_NUDGE) || '0', 10);
    if (last && Date.now() - last < NUDGE_DAYS * 864e5) return false;
    if (/gracias-/.test(location.pathname)) return false;
    return true;
  }
  function initNudge(){
    if (!nudgeAllowed()) return;
    var start = Date.now(), shown = false, nudge = null, prevFocus = null;
    var mobile = win.matchMedia && win.matchMedia('(max-width: 720px), (pointer: coarse)').matches;
    function close(reason){
      if (!nudge) return;
      lsSet(KEY_NUDGE, String(Date.now()));
      track('capture_dismiss', {placement: mobile ? 'nudge-bar' : 'nudge-slidein', reason: reason});
      nudge.parentNode && nudge.parentNode.removeChild(nudge); nudge = null;
      doc.removeEventListener('keydown', onKey);
      if (prevFocus && prevFocus.focus) try { prevFocus.focus(); } catch(e) {}
    }
    function onKey(e){ if (e.key === 'Escape' || e.keyCode === 27) close('esc'); }
    function show(trigger){
      if (shown || !nudgeAllowed() || Date.now() - start < MIN_DELAY_MS) return;
      var ov = doc.getElementById('excel-modal-overlay');
      if (ov && ov.classList.contains('open')) return;
      // No competir con el aviso de QuijoBot: se reintenta en el siguiente disparador.
      if (doc.querySelector('.qjb-nudge.is-visible') || doc.querySelector('.qjb-panel.is-open, #qjb-root.is-open')) return;
      shown = true;
      var placement = mobile ? 'nudge-bar' : 'nudge-slidein';
      nudge = el('aside', {'class':'qf-nudge' + (mobile ? ' bar' : ''), role:'complementary', 'aria-labelledby':'qf-nudge-title', 'data-qf-placement':placement},
        '<h2 id="qf-nudge-title">QuijoExcel, gratis</h2>'
        + '<p>' + (mobile ? 'QuijoExcel gratis por email.' : 'La plantilla que uso para el presupuesto, el ahorro y las inversiones. Te la envío por email.') + '</p>'
        + '<a class="qf-cap-btn" href="' + excelUrl(placement) + '" data-qf-excel="' + placement + '">Recibirla</a>'
        + '<button type="button" class="qf-cap-x" aria-label="Cerrar aviso">&times;</button>');
      if (mobile) nudge.setAttribute('aria-label', 'QuijoExcel, gratis');
      doc.body.appendChild(nudge);
      nudge.querySelector('.qf-cap-x').addEventListener('click', function(){ close('button'); });
      doc.addEventListener('keydown', onKey);
      nudge.querySelector('a').addEventListener('click', function(){ lsSet(KEY_NUDGE, String(Date.now())); });
      // Sin mover el foco: no interrumpe la lectura. Es alcanzable con Tab al final del documento.
      prevFocus = null;
      if (win.requestAnimationFrame) win.requestAnimationFrame(function(){ if (nudge) nudge.classList.add('show'); }); else nudge.classList.add('show');
      track('capture_impression', {placement: placement, offer:'quijoexcel', trigger: trigger});
    }
    function onScroll(){
      var de = doc.documentElement, denom = de.scrollHeight - win.innerHeight;
      if (denom > 200 && (win.pageYOffset || de.scrollTop) / denom >= 0.6) show('scroll60');
    }
    win.addEventListener('scroll', onScroll, {passive: true});
    if (!mobile) doc.addEventListener('mouseout', function(e){ if (!e.relatedTarget && e.clientY <= 0) show('exit'); });
  }

  /* ── Clics, envíos y ?qfopen=quijoexcel ────────────────────────── */
  function initGlobal(){
    doc.addEventListener('click', function(e){
      var a = e.target.closest && e.target.closest('[data-qf-excel]');
      if (!a) return;
      var src = a.getAttribute('data-qf-excel');
      track('capture_click', {placement: src, offer:'quijoexcel', embed: isEmbed});
      if (hasModal() && !isEmbed) { e.preventDefault(); win.openExcelModal(src); }
      // En iframe o páginas sueltas el enlace (target=_top) abre la home con el modal.
    });
    ['excel-kit-form', 'newsletter-form'].forEach(function(id){
      var f = doc.getElementById(id);
      if (f) f.addEventListener('submit', function(){ if (f.checkValidity && !f.checkValidity()) return; markSubscribed(id); });
    });
    if (params && params.get('qfopen') === 'quijoexcel' && hasModal()) {
      var src = (params.get('src') || 'link').replace(/[^a-z0-9_\-]/gi, '').slice(0, 40);
      setTimeout(function(){ win.openExcelModal(src); }, 300);
      try { history.replaceState(null, '', location.pathname + location.hash); } catch(e) {}
    }
  }

  win.qfCaptacion = {openExcel: openExcel, alertasFormId: QF_KIT_ALERTAS_FORM_ID};
  function init(){ injectCss(); initGlobal(); initCalcCtas(); initAlerts(); initNudge(); }
  if (doc.readyState === 'loading') doc.addEventListener('DOMContentLoaded', init); else init();
})();
