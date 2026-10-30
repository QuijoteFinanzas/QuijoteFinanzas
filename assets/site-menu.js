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
