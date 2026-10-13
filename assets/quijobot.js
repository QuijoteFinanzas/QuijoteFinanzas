(function(){
  'use strict';

  var ENDPOINT='https://quijobot-quijotefinanzas.donquijotedelasfinanzas.workers.dev/';
  var LOGO='/logo.png';
  var mounted=false;
  var busy=false;

  function track(name,params){
    try{
      if(typeof window.qfTrack==='function') window.qfTrack(name,params||{});
      else if(typeof window.gtag==='function') window.gtag('event',name,params||{});
    }catch(e){}
  }

  function addStyles(){
    if(document.getElementById('qjb-styles')) return;
    var style=document.createElement('style');
    style.id='qjb-styles';
    style.textContent=`
#qjb-root{position:fixed;right:18px;bottom:18px;z-index:9998;font-family:'DM Sans',system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#0f2035}
.qjb-launch-wrap{position:relative;display:flex;align-items:flex-end;justify-content:flex-end}
.qjb-launch{width:66px;height:66px;border:0;background:transparent;padding:0;border-radius:50%;cursor:pointer;display:grid;place-items:center;position:relative;filter:drop-shadow(0 8px 16px rgba(15,32,53,.20));transition:transform .2s ease,filter .2s ease}
.qjb-launch img{display:block;width:66px;height:66px;border-radius:50%;object-fit:cover}
.qjb-launch:hover{transform:translateY(-2px) rotate(-2deg);filter:drop-shadow(0 12px 20px rgba(15,32,53,.25))}
.qjb-launch:active{transform:translateY(0) scale(.98)}
.qjb-launch:focus-visible,.qjb-close:focus-visible,.qjb-send:focus-visible,.qjb-chip:focus-visible,.qjb-link:focus-visible,.qjb-input:focus-visible,.qjb-nudge-close:focus-visible{outline:2px solid #c9a84c;outline-offset:3px}
.qjb-status{position:absolute;right:2px;bottom:3px;width:14px;height:14px;border-radius:50%;background:#fff;border:2px solid #fff;box-shadow:0 1px 5px rgba(15,32,53,.18)}
.qjb-status::after{content:'';display:block;width:100%;height:100%;border-radius:50%;background:#c9a84c}
.qjb-tooltip{position:absolute;right:76px;bottom:18px;background:#0f2035;color:#fff;border-radius:9px;padding:7px 10px;font-size:11px;font-weight:700;white-space:nowrap;box-shadow:0 8px 24px rgba(15,32,53,.18);opacity:0;transform:translateX(5px);pointer-events:none;transition:opacity .16s ease,transform .16s ease}
.qjb-tooltip::after{content:'';position:absolute;right:-5px;top:50%;width:10px;height:10px;background:#0f2035;transform:translateY(-50%) rotate(45deg);border-radius:1px}
.qjb-launch:hover + .qjb-tooltip,.qjb-launch:focus-visible + .qjb-tooltip{opacity:1;transform:translateX(0)}
.qjb-nudge{position:absolute;right:77px;bottom:3px;width:240px;background:#fff;color:#24374c;border:1px solid #dfe6ee;border-radius:14px 14px 4px 14px;padding:12px 34px 12px 13px;box-shadow:0 16px 38px rgba(15,32,53,.18);font-size:12px;line-height:1.45;opacity:0;transform:translateY(8px) scale(.98);pointer-events:none;transition:opacity .2s ease,transform .2s ease}
.qjb-nudge.is-visible{opacity:1;transform:translateY(0) scale(1);pointer-events:auto}
.qjb-nudge strong{display:block;color:#0f2035;font-size:12px;margin-bottom:2px}
.qjb-nudge-close{position:absolute;top:6px;right:7px;width:24px;height:24px;border:0;background:transparent;border-radius:50%;color:#7c8d9d;font-size:17px;line-height:1;cursor:pointer;display:grid;place-items:center}
.qjb-nudge-close:hover{background:#f3f6f8;color:#0f2035}
.qjb-panel{position:absolute;right:0;bottom:78px;width:min(380px,calc(100vw - 28px));height:min(550px,calc(100vh - 115px));display:none;grid-template-rows:auto 1fr auto;background:#fff;border:1px solid #dfe6ee;border-radius:18px;box-shadow:0 22px 55px rgba(15,32,53,.20);overflow:hidden}
.qjb-panel.is-open{display:grid}
.qjb-head{display:flex;align-items:center;gap:11px;padding:14px 15px;border-bottom:1px solid #e7ecf2;background:#fff}
.qjb-mark{width:42px;height:42px;border-radius:50%;overflow:hidden;flex:0 0 auto;filter:drop-shadow(0 3px 7px rgba(15,32,53,.12))}
.qjb-mark img{display:block;width:100%;height:100%;object-fit:cover}
.qjb-head-copy{min-width:0;flex:1}
.qjb-title{font-family:'Playfair Display',Georgia,serif;font-size:18px;font-weight:700;line-height:1.1;color:#0f2035;margin:0}
.qjb-subtitle{font-size:10px;color:#6d7f91;margin-top:3px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.qjb-close{border:0;background:transparent;color:#6d7f91;width:32px;height:32px;border-radius:50%;font-size:20px;cursor:pointer;display:grid;place-items:center}
.qjb-close:hover{background:#f4f6f9;color:#0f2035}
.qjb-feed{overflow:auto;padding:16px;background:#fbfcfd;scroll-behavior:smooth}
.qjb-msg{max-width:92%;margin:0 0 11px;font-size:13px;line-height:1.55;white-space:pre-wrap;overflow-wrap:anywhere}
.qjb-msg.bot{background:#fff;border:1px solid #e4e9ef;border-radius:12px 12px 12px 3px;padding:11px 12px;color:#24374c;box-shadow:0 1px 2px rgba(15,32,53,.03)}
.qjb-msg.user{margin-left:auto;background:#0f2035;color:#fff;border-radius:12px 12px 3px 12px;padding:10px 12px}
.qjb-links{display:grid;gap:7px;margin:8px 0 13px}
.qjb-link{display:flex;align-items:center;justify-content:space-between;gap:10px;text-decoration:none;background:#fff;border:1px solid #dfe6ee;color:#0f2035;border-radius:10px;padding:9px 11px;font-size:12px;font-weight:700;transition:border-color .15s ease,transform .15s ease}
.qjb-link:hover{border-color:#c9a84c;transform:translateY(-1px)}
.qjb-link span:last-child{color:#c9a84c;font-size:14px}
.qjb-chips{display:flex;flex-wrap:wrap;gap:7px;margin-top:10px}
.qjb-chip{border:1px solid #dfe6ee;background:#fff;color:#1a3358;border-radius:999px;padding:7px 10px;font:600 10px/1.2 'DM Sans',sans-serif;cursor:pointer}
.qjb-chip:hover{border-color:#c9a84c;background:#fffdf7}
.qjb-thinking{display:inline-flex;align-items:center;gap:4px;padding:8px 11px!important}
.qjb-dot{width:5px;height:5px;border-radius:50%;background:#718397;animation:qjbPulse 1s infinite ease-in-out}
.qjb-dot:nth-child(2){animation-delay:.15s}.qjb-dot:nth-child(3){animation-delay:.3s}
@keyframes qjbPulse{0%,80%,100%{opacity:.25;transform:translateY(0)}40%{opacity:1;transform:translateY(-2px)}}
.qjb-foot{padding:10px 12px 11px;border-top:1px solid #e7ecf2;background:#fff}
.qjb-form{display:grid;grid-template-columns:1fr auto;gap:7px;align-items:end}
.qjb-input{width:100%;min-height:40px;max-height:96px;resize:none;border:1px solid #d7e0e9;border-radius:10px;padding:10px 11px;color:#0f2035;background:#fff;font:400 12px/1.45 'DM Sans',sans-serif;outline:none;box-sizing:border-box}
.qjb-input:focus{border-color:#9babba;box-shadow:0 0 0 2px rgba(15,32,53,.06)}
.qjb-send{height:40px;min-width:42px;border:0;border-radius:10px;background:#0f2035;color:#fff;cursor:pointer;font-size:17px;font-weight:700;display:grid;place-items:center}
.qjb-send:hover{background:#1a3358}.qjb-send:disabled{opacity:.45;cursor:not-allowed}
.qjb-note{font-size:9px;line-height:1.35;color:#8393a3;margin:7px 2px 0;text-align:center}
html[data-theme="dark"] .qjb-panel{background:#132030;border-color:#33485e;box-shadow:0 22px 55px rgba(0,0,0,.42)}
html[data-theme="dark"] .qjb-head,html[data-theme="dark"] .qjb-foot{background:#182638;border-color:#30465a}
html[data-theme="dark"] .qjb-title{color:#f2f6fa}
html[data-theme="dark"] .qjb-subtitle,html[data-theme="dark"] .qjb-close{color:#a8b8c7}
html[data-theme="dark"] .qjb-close:hover{background:#223449;color:#fff}
html[data-theme="dark"] .qjb-feed{background:#101a26}
html[data-theme="dark"] .qjb-msg.bot{background:#182638;border-color:#30465a;color:#dce7f0}
html[data-theme="dark"] .qjb-link,html[data-theme="dark"] .qjb-chip{background:#182638;border-color:#33485e;color:#e9f0f7}
html[data-theme="dark"] .qjb-link:hover,html[data-theme="dark"] .qjb-chip:hover{border-color:#c9a84c;background:#1c2b3e}
html[data-theme="dark"] .qjb-input{background:#101a26;border-color:#3a5065;color:#eef4f8}
html[data-theme="dark"] .qjb-note{color:#8fa2b4}
html[data-theme="dark"] .qjb-nudge{background:#182638;border-color:#33485e;color:#dce7f0}
html[data-theme="dark"] .qjb-nudge strong{color:#f2f6fa}
html[data-theme="dark"] .qjb-nudge-close{color:#9eb0c0}
html[data-theme="dark"] .qjb-nudge-close:hover{background:#223449;color:#fff}
@media(max-width:640px){
  #qjb-root{right:12px;bottom:12px}
  .qjb-launch,.qjb-launch img{width:56px;height:56px}
  .qjb-status{width:12px;height:12px;right:1px;bottom:2px}
  .qjb-tooltip{display:none}
  .qjb-nudge{right:64px;bottom:0;width:min(220px,calc(100vw - 96px));font-size:11px}
  .qjb-panel{position:fixed;right:10px;left:10px;bottom:78px;width:auto;height:min(560px,calc(100vh - 98px));border-radius:15px}
}
@media(prefers-reduced-motion:reduce){.qjb-launch,.qjb-link,.qjb-tooltip,.qjb-nudge{transition:none}.qjb-feed{scroll-behavior:auto}.qjb-dot{animation:none}}
`;
    document.head.appendChild(style);
  }

  function el(tag,className,text){
    var node=document.createElement(tag);
    if(className) node.className=className;
    if(text!==undefined) node.textContent=text;
    return node;
  }

  function img(src,className,alt){
    var node=document.createElement('img');
    node.src=src; node.alt=alt||''; node.decoding='async';
    if(className) node.className=className;
    return node;
  }

  function build(){
    if(mounted||document.getElementById('qjb-root')) return;
    mounted=true;
    addStyles();

    var root=el('div'); root.id='qjb-root';
    var launchWrap=el('div','qjb-launch-wrap');
    var launch=el('button','qjb-launch'); launch.type='button'; launch.setAttribute('aria-expanded','false'); launch.setAttribute('aria-controls','qjb-panel'); launch.setAttribute('aria-label','Pregúntale a Quijote');
    launch.appendChild(img(LOGO,'',''));
    launch.appendChild(el('span','qjb-status'));
    var tooltip=el('div','qjb-tooltip','Pregúntale a Quijote'); tooltip.setAttribute('aria-hidden','true');

    var nudge=el('div','qjb-nudge');
    nudge.setAttribute('role','status');
    nudge.appendChild(el('strong','','¿No sabes por dónde empezar?'));
    nudge.appendChild(document.createTextNode('Pregúntame y te llevo a la calculadora o sección adecuada.'));
    var nudgeClose=el('button','qjb-nudge-close','×'); nudgeClose.type='button'; nudgeClose.setAttribute('aria-label','Cerrar sugerencia de QuijoBot'); nudge.appendChild(nudgeClose);

    var panel=el('section','qjb-panel'); panel.id='qjb-panel'; panel.setAttribute('role','dialog'); panel.setAttribute('aria-label','QuijoBot, asistente de navegación');
    var head=el('div','qjb-head');
    var mark=el('div','qjb-mark'); mark.appendChild(img(LOGO,'',''));
    head.appendChild(mark);
    var headCopy=el('div','qjb-head-copy'); headCopy.appendChild(el('h2','qjb-title','QuijoBot')); headCopy.appendChild(el('div','qjb-subtitle','Tu escudero para encontrar herramientas y contenido'));
    head.appendChild(headCopy);
    var close=el('button','qjb-close','×'); close.type='button'; close.setAttribute('aria-label','Cerrar QuijoBot'); head.appendChild(close);

    var feed=el('div','qjb-feed'); feed.setAttribute('aria-live','polite');
    var greeting=el('div','qjb-msg bot','👋 Soy QuijoBot. Cuéntame qué quieres calcular, comparar o entender y te llevo al sitio adecuado.'); feed.appendChild(greeting);
    var chips=el('div','qjb-chips');
    [
      ['Calcular mi salario neto','¿Dónde puedo calcular mi salario neto?'],
      ['Comparar cuentas','¿Dónde puedo comparar cuentas remuneradas?'],
      ['Ver calculadoras','¿Qué calculadoras tenéis?']
    ].forEach(function(item){
      var chip=el('button','qjb-chip',item[0]); chip.type='button'; chip.dataset.query=item[1]; chips.appendChild(chip);
    });
    feed.appendChild(chips);

    var foot=el('div','qjb-foot');
    var form=el('form','qjb-form');
    var input=el('textarea','qjb-input'); input.rows=1; input.maxLength=500; input.placeholder='¿Qué quieres encontrar?'; input.setAttribute('aria-label','Pregunta para QuijoBot');
    var send=el('button','qjb-send','↑'); send.type='submit'; send.setAttribute('aria-label','Enviar pregunta');
    form.appendChild(input); form.appendChild(send); foot.appendChild(form);
    foot.appendChild(el('div','qjb-note','Te orienta dentro de QuijoteFinanzas. No compartas datos personales o sensibles.'));

    panel.appendChild(head); panel.appendChild(feed); panel.appendChild(foot);
    launchWrap.appendChild(nudge); launchWrap.appendChild(launch); launchWrap.appendChild(tooltip);
    root.appendChild(panel); root.appendChild(launchWrap); document.body.appendChild(root);

    var nudgeTimer=null;
    function dismissNudge(permanent){
      nudge.classList.remove('is-visible');
      if(nudgeTimer){clearTimeout(nudgeTimer);nudgeTimer=null;}
      if(permanent){try{localStorage.setItem('qjb_nudge_seen_v1','1');}catch(e){}}
    }
    function maybeShowNudge(){
      var seen=false;
      try{seen=localStorage.getItem('qjb_nudge_seen_v1')==='1';}catch(e){}
      if(seen) return;
      nudgeTimer=setTimeout(function(){
        if(!panel.classList.contains('is-open')) nudge.classList.add('is-visible');
      },3500);
    }
    maybeShowNudge();

    function open(){
      dismissNudge(true);
      panel.classList.add('is-open');
      launch.setAttribute('aria-expanded','true');
      launch.setAttribute('aria-label','Cerrar QuijoBot');
      track('quijobot_open',{source_component:'floating_mascot'});
      setTimeout(function(){input.focus();},30);
    }
    function shut(){
      panel.classList.remove('is-open');
      launch.setAttribute('aria-expanded','false');
      launch.setAttribute('aria-label','Pregúntale a Quijote');
      launch.focus();
    }
    launch.addEventListener('click',function(){panel.classList.contains('is-open')?shut():open();});
    close.addEventListener('click',shut);
    nudgeClose.addEventListener('click',function(e){e.stopPropagation();dismissNudge(true);});
    nudge.addEventListener('click',function(e){if(e.target!==nudgeClose) open();});
    document.addEventListener('keydown',function(e){if(e.key==='Escape'&&panel.classList.contains('is-open')) shut();});

    function scrollBottom(){ feed.scrollTop=feed.scrollHeight; }
    function addMessage(kind,text){ var m=el('div','qjb-msg '+kind,text); feed.appendChild(m); scrollBottom(); return m; }
    function addThinking(){ var m=el('div','qjb-msg bot qjb-thinking'); for(var i=0;i<3;i++) m.appendChild(el('span','qjb-dot')); feed.appendChild(m); scrollBottom(); return m; }
    function addLinks(links){
      if(!Array.isArray(links)||!links.length) return;
      var wrap=el('div','qjb-links');
      var sectionIds=['sobre','calculadoras','cuentas','quijolista','quijocartera','recursos','teca','glosario','referidos'];
      links.slice(0,3).forEach(function(item){
        if(!item||typeof item.url!=='string') return;
        var a=el('a','qjb-link'); a.href=item.url; a.appendChild(el('span','',item.title||'Abrir recurso')); a.appendChild(el('span','','→'));
        a.addEventListener('click',function(e){
          track('quijobot_result_click',{source_component:'floating_mascot',destination:item.url});
          try{
            var target=new URL(item.url,window.location.origin);
            var onHome=(window.location.pathname==='/'||window.location.pathname==='/index.html');
            var targetHome=(target.origin===window.location.origin&&(target.pathname==='/'||target.pathname==='/index.html'));
            var secId=(target.hash||'').replace(/^#/,'');
            if(onHome&&targetHome&&sectionIds.indexOf(secId)!==-1&&typeof window.goTo==='function'){
              e.preventDefault();
              shut();
              window.goTo(secId);
            }
          }catch(err){}
        });
        wrap.appendChild(a);
      });
      feed.appendChild(wrap); scrollBottom();
    }

    async function ask(raw){
      var query=String(raw||'').trim();
      if(!query||busy) return;
      busy=true; send.disabled=true; input.disabled=true;
      addMessage('user',query); input.value='';
      var thinking=addThinking();
      track('quijobot_query',{source_component:'floating_mascot'});
      var controller=new AbortController(); var timer=setTimeout(function(){controller.abort();},20000);
      try{
        var response=await fetch(ENDPOINT,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({query:query}),signal:controller.signal});
        var data=await response.json().catch(function(){return null;});
        if(thinking.parentNode) thinking.parentNode.removeChild(thinking);
        if(!response.ok||!data||data.ok!==true){ throw new Error(data&&data.error?data.error:'Respuesta no válida'); }
        addMessage('bot',data.answer||'No he encontrado una respuesta clara. Prueba a reformular la pregunta.');
        addLinks(data.links||[]);
        track('quijobot_answer',{source_component:'floating_mascot',response_source:data.source||'unknown',link_count:Array.isArray(data.links)?data.links.length:0});
      }catch(err){
        if(thinking.parentNode) thinking.parentNode.removeChild(thinking);
        var msg=(err&&err.name==='AbortError')?'Está tardando más de lo esperado. Inténtalo de nuevo en unos segundos.':'No he podido consultar QuijoBot ahora mismo. Inténtalo de nuevo en unos segundos.';
        addMessage('bot',msg); track('quijobot_error',{source_component:'floating_mascot',error_type:(err&&err.name)||'request'});
      }finally{
        clearTimeout(timer); busy=false; send.disabled=false; input.disabled=false; input.focus();
      }
    }

    form.addEventListener('submit',function(e){e.preventDefault();ask(input.value);});
    input.addEventListener('keydown',function(e){if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();ask(input.value);}});
    chips.addEventListener('click',function(e){var b=e.target.closest&&e.target.closest('.qjb-chip'); if(b) ask(b.dataset.query||b.textContent);});
  }

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',build,{once:true}); else build();
})();
