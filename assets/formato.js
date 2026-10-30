/* Formato numérico español compartido (es-ES):
   punto para miles y millones (también con 4 cifras: 1.000), coma para decimales,
   espacio de no separación antes de € y sin espacio antes de % (convención de la web).
   Expone window.QF_FMT y prepara Chart.js y los campos numéricos de las calculadoras. */
(function(w){
  'use strict';
  var NBSP='\u00a0', PCT_SEP='';
  var cache={};
  function nf(min,max){
    var k=min+'|'+max;
    if(!cache[k]){
      try{cache[k]=new Intl.NumberFormat('es-ES',{minimumFractionDigits:min,maximumFractionDigits:max,useGrouping:'always'});}
      catch(e){cache[k]=new Intl.NumberFormat('es-ES',{minimumFractionDigits:min,maximumFractionDigits:max});}
    }
    return cache[k];
  }
  /* Garantiza el punto de miles en números de 4 cifras aunque el motor no soporte useGrouping:'always' */
  function grupo(s){
    return String(s).replace(/(^|[^\d.,])(-?)(\d{4,})(?=(,\d+)?(?!\d))/g,function(m,pre,sg,ent){
      return pre+sg+ent.replace(/\B(?=(\d{3})+(?!\d))/g,'.');
    });
  }
  function num(n,dec,minDec){
    n=Number(n); if(!isFinite(n)) return '—';
    if(dec==null) dec=2;
    if(minDec==null) minDec=dec;
    var s=nf(minDec,dec).format(n);
    if(s==='-0'||/^-0(,0+)?$/.test(s)) s=s.slice(1);
    return grupo(s);
  }
  function eur(n,dec,minDec){ var s=num(n,dec==null?2:dec,minDec); return s==='—'?s:s+NBSP+'€'; }
  function pct(n,dec,minDec){ var s=num(n,dec==null?2:dec,minDec); return s==='—'?s:s+PCT_SEP+'%'; }
  /* Lee lo que escribe el usuario: «1.000», «1000,5», «1.234.567,89», «3,5», «3.5», «1 000 €» */
  function parse(v){
    if(typeof v==='number') return v;
    var s=String(v==null?'':v).replace(/[\s\u00a0\u202f€%]/g,'');
    if(s==='') return NaN;
    var neg=/^[-−–]/.test(s); s=s.replace(/^[-−–+]/,'');
    if(s.indexOf(',')>-1){ s=s.replace(/\./g,'').replace(/,/g,'.'); var p=s.split('.'); if(p.length>2) s=p.slice(0,-1).join('')+'.'+p[p.length-1]; }
    else if(/^\d{1,3}(\.\d{3})+$/.test(s)) s=s.replace(/\./g,'');
    else { var q=s.split('.'); if(q.length>2) s=q.slice(0,-1).join('')+'.'+q[q.length-1]; }
    if(!/^\d*\.?\d*$/.test(s)||s==='.'||s==='') return NaN;
    var r=parseFloat(s); return neg?-r:r;
  }
  var api={num:num,eur:eur,pct:pct,parse:parse,grupo:grupo,NBSP:NBSP};
  w.QF_FMT=api;

  /* ── Campos numéricos: aceptan «1.000» o «1000,5» y se muestran con formato español ── */
  var desc=Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value');
  function decs(el){ var st=el.getAttribute('data-qf-step')||''; if(st==='any') return 2; var i=st.indexOf('.'); return i>-1?Math.min(st.length-i-1,4):0; }
  function canon(el,raw){
    var n=parse(raw); if(!isFinite(n)) return raw==null?'':String(raw).trim()===''?'':String(raw);
    return String(n);
  }
  function display(el,n){
    if(!isFinite(n)) return '';
    if(el.getAttribute('data-qf-year')) return String(Math.round(n));
    var d=Math.max(decs(el),(String(n).split('.')[1]||'').length>0?Math.min((String(n).split('.')[1]||'').length,Math.max(decs(el),2)):0);
    return num(n,d,0);
  }
  function enhance(el){
    if(el.__qfNum||el.type!=='number') return;
    el.__qfNum=true;
    var st=el.getAttribute('step'); el.setAttribute('data-qf-step',st||'1');
    var mn=el.getAttribute('min'), mx=el.getAttribute('max');
    if(mn!=null&&mx!=null&&+mn>=1900&&+mx<=2200) el.setAttribute('data-qf-year','1');
    var initial=desc.get.call(el);
    el.type='text'; el.setAttribute('inputmode','decimal'); el.setAttribute('autocomplete','off'); el.classList.add('qf-num');
    if(el.getAttribute('spellcheck')==null) el.setAttribute('spellcheck','false');
    Object.defineProperty(el,'value',{configurable:true,
      get:function(){ var raw=desc.get.call(this); var c=canon(this,raw); return c; },
      set:function(v){ var n=parse(v); desc.set.call(this,(v===''||v==null||!isFinite(n))?(v==null?'':String(v)):(document.activeElement===this?String(v).replace('.',','):display(this,n))); }
    });
    Object.defineProperty(el,'valueAsNumber',{configurable:true,get:function(){return parse(desc.get.call(this));},set:function(n){this.value=n;}});
    if(initial!=='') el.value=initial;
    el.addEventListener('blur',function(){
      var raw=desc.get.call(el), n=parse(raw);
      if(raw.trim()==='') return;
      if(!isFinite(n)){ el.setAttribute('aria-invalid','true'); return; }
      el.removeAttribute('aria-invalid');
      if(mn!=null&&mn!==''&&n<+mn) n=+mn;
      if(mx!=null&&mx!==''&&n>+mx) n=+mx;
      var before=parse(raw);
      desc.set.call(el,display(el,n));
      if(n!==before){ el.dispatchEvent(new Event('input',{bubbles:true})); el.dispatchEvent(new Event('change',{bubbles:true})); }
    });
    el.addEventListener('keydown',function(e){
      if(e.key!=='ArrowUp'&&e.key!=='ArrowDown') return;
      e.preventDefault();
      var step=parseFloat(el.getAttribute('data-qf-step'))||1, n=parse(desc.get.call(el)); if(!isFinite(n)) n=0;
      n=+(n+(e.key==='ArrowUp'?step:-step)).toFixed(6);
      if(mn!=null&&mn!==''&&n<+mn) n=+mn; if(mx!=null&&mx!==''&&n>+mx) n=+mx;
      desc.set.call(el,display(el,n)); el.dispatchEvent(new Event('input',{bubbles:true}));
    });
  }
  function enhanceAll(root){ var l=(root||document).querySelectorAll('input[type=number]'); for(var i=0;i<l.length;i++) enhance(l[i]); }
  api.enhanceAll=enhanceAll;
  function observe(){
    if(!w.MutationObserver||!document.body) return;
    new MutationObserver(function(ms){ for(var i=0;i<ms.length;i++){ var a=ms[i].addedNodes; for(var j=0;j<a.length;j++){ var nd=a[j]; if(nd.nodeType!==1) continue; if(nd.tagName==='INPUT') enhance(nd); else if(nd.querySelector&&nd.querySelector('input[type=number]')) enhanceAll(nd); } } })
      .observe(document.body,{childList:true,subtree:true});
  }

  /* ── Chart.js: separadores españoles en ejes y tooltips por defecto ── */
  function chartSetup(){
    var C=w.Chart; if(!C||C.__qfFmt) return; C.__qfFmt=true;
    try{
      C.defaults.locale='es-ES';
      if(C.Ticks&&C.Ticks.formatters&&C.Ticks.formatters.numeric){
        var orig=C.Ticks.formatters.numeric;
        C.Ticks.formatters.numeric=function(){ return grupo(orig.apply(this,arguments)); };
      }
      var tt=C.defaults.plugins.tooltip.callbacks;
      tt.label=function(ctx){
        var lab=(ctx.dataset&&ctx.dataset.label)||'', p=ctx.parsed, v=null;
        if(typeof p==='number') v=p; else if(p&&typeof p==='object'){ v=(ctx.chart&&ctx.chart.options&&ctx.chart.options.indexAxis==='y')?p.x:p.y; }
        var txt=(typeof v==='number'&&isFinite(v))?num(v,2,0):ctx.formattedValue;
        return (lab?lab+': ':'')+txt;
      };
    }catch(e){}
  }
  api.chartSetup=chartSetup;
  function init(){ chartSetup(); enhanceAll(document); observe(); }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',init); else init();
})(window);
