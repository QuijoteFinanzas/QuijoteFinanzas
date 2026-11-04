/* Desplegables accesibles del menú principal: clic, teclado (Enter/Espacio/flechas/Esc), cierre al pulsar fuera. */
(function(){
  function init(){
    var nav=document.getElementById('main-nav'); if(!nav) return;
    var tops=[].slice.call(nav.querySelectorAll('.qf-menu-group>.qf-menu-top'));
    var burger=document.querySelector('.qf-menu-burger');
    function close(except){tops.forEach(function(b){if(b!==except)b.setAttribute('aria-expanded','false')})}
    function links(b){return [].slice.call(b.nextElementSibling.querySelectorAll('.qf-menu-link'))}
    tops.forEach(function(b){
      b.addEventListener('click',function(e){e.stopPropagation();var o=b.getAttribute('aria-expanded')==='true';close(b);b.setAttribute('aria-expanded',o?'false':'true')});
      b.addEventListener('keydown',function(e){if(e.key==='ArrowDown'){e.preventDefault();close(b);b.setAttribute('aria-expanded','true');links(b)[0].focus()}});
      b.nextElementSibling.addEventListener('keydown',function(e){var l=links(b),i=l.indexOf(document.activeElement);
        if(e.key==='ArrowDown'){e.preventDefault();l[(i+1)%l.length].focus()}
        else if(e.key==='ArrowUp'){e.preventDefault();l[(i-1+l.length)%l.length].focus()}
        else if(e.key==='Escape'){b.setAttribute('aria-expanded','false');b.focus()}});
    });
    nav.addEventListener('focusout',function(e){if(!nav.contains(e.relatedTarget)&&!matchMedia('(max-width:699px)').matches)close()});
    document.addEventListener('click',function(e){if(!nav.contains(e.target)&&e.target!==burger)close()});
    document.addEventListener('keydown',function(e){if(e.key==='Escape'){close();if(burger&&nav.classList.contains('open')){nav.classList.remove('open');burger.setAttribute('aria-expanded','false');burger.focus()}}});
    // Al elegir una sección, cerrar desplegables y menú móvil; marcar grupo activo en la home.
    nav.addEventListener('click',function(e){var t=e.target.closest('.qf-menu-link,.qf-menu-top[data-section]');if(!t)return;close();
      if(burger){nav.classList.remove('open');burger.setAttribute('aria-expanded','false')}
      if(t.hasAttribute('data-section')){nav.querySelectorAll('.qf-menu-top').forEach(function(x){x.classList.remove('active')});var g=t.closest('.qf-menu-group');(g?g.querySelector('.qf-menu-top'):t).classList.add('active')}});
    if(burger) burger.addEventListener('click',function(){var o=nav.classList.toggle('open');burger.setAttribute('aria-expanded',o?'true':'false')});
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();

/* Keyboard access for calculator cards and modal focus. Embedded calculators stay unchanged. */
(function(){
  function initCalculatorAccess(){
    if(document.documentElement.classList.contains('qf-embed-root'))return;
    var returnTo=new WeakMap();
    document.querySelectorAll('.calc-item.clickable[data-calc]').forEach(function(card){
      var label=card.querySelector('.live');if(!label||label.tagName==='BUTTON')return;
      var button=document.createElement('button');button.type='button';button.className=label.className;
      button.innerHTML=label.innerHTML;button.setAttribute('aria-label','Abrir '+(card.querySelector('.calc-name')||card).textContent.trim());
      button.style.cssText='border:0;background:none;font-family:inherit;cursor:pointer;padding:0';
      label.replaceWith(button);button.addEventListener('click',function(e){e.stopPropagation();var modal=document.getElementById('modal-'+card.dataset.calc);if(modal)returnTo.set(modal,button);window.openCalc(card.dataset.calc)});
      card.addEventListener('click',function(e){if(e.target.closest('a'))return;var modal=document.getElementById('modal-'+card.dataset.calc);if(modal)returnTo.set(modal,button)},true);
    });
    document.querySelectorAll('.calc-overlay').forEach(function(overlay){
      var dialog=overlay.querySelector('.calc-modal'),title=overlay.querySelector('h2');if(!dialog)return;
      dialog.setAttribute('role','dialog');dialog.setAttribute('aria-modal','true');dialog.tabIndex=-1;
      if(title){if(!title.id)title.id=overlay.id+'-title';dialog.setAttribute('aria-labelledby',title.id)}
      var opened=false;
      new MutationObserver(function(){
        var now=overlay.classList.contains('open');if(now===opened)return;opened=now;
        if(now){if(!returnTo.has(overlay)&&document.activeElement!==document.body)returnTo.set(overlay,document.activeElement);var close=dialog.querySelector('.calc-close');(close||dialog).focus({preventScroll:true})}
        else{var back=returnTo.get(overlay);if(back&&back.isConnected)back.focus({preventScroll:true});returnTo.delete(overlay)}
      }).observe(overlay,{attributes:true,attributeFilter:['class']});
      overlay.addEventListener('keydown',function(e){
        if(e.key!=='Tab'||!overlay.classList.contains('open'))return;
        var nested=document.activeElement.closest('[role="dialog"]');if(nested&&nested!==dialog)return;
        var items=[].slice.call(dialog.querySelectorAll('a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex="0"]')).filter(function(x){return x.getClientRects().length&&getComputedStyle(x).visibility!=='hidden'});
        var first=items[0],last=items[items.length-1];if(!first){e.preventDefault();dialog.focus();return}
        if(e.shiftKey&&(document.activeElement===first||document.activeElement===dialog)){e.preventDefault();last.focus()}
        else if(!e.shiftKey&&(document.activeElement===last||document.activeElement===dialog)){e.preventDefault();first.focus()}
      });
    });
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',initCalculatorAccess);else initCalculatorAccess();
})();
