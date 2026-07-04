/* ═══════════════════════════════════════════════════════════════════════
   QuijoteFinanzas — Motor de cálculo compartido
   Fuente única de verdad para todas las calculadoras (SPA + páginas SEO).
   Corregido: mínimo personal por CCAA, deducción SMI 2026, reducción
   art. 20 actualizada, SS con tope de base máxima.
   Última actualización: alineado con index.html (sesión de auditoría fiscal)
   ═══════════════════════════════════════════════════════════════════════ */

// ── FORMATO ─────────────────────────────────────────────────────────────
var fmtEUR = function(n){ return new Intl.NumberFormat('es-ES',{style:'currency',currency:'EUR',minimumFractionDigits:2,maximumFractionDigits:2}).format(n); };
var fmtNum = function(n){ return new Intl.NumberFormat('es-ES',{minimumFractionDigits:2,maximumFractionDigits:2}).format(n); };
var fmtPct = function(n){ return new Intl.NumberFormat('es-ES',{minimumFractionDigits:2,maximumFractionDigits:2}).format(n)+'%'; };
function rr(label,value,cls){ return '<div class="result-row"><span class="result-label">'+label+'</span><span class="result-value'+(cls?' '+cls:'')+'">'+value+'</span></div>'; }

var icChart=null, salChart=null, hipChart=null, ceChart=null;
function doughnutOpts(bruto) {
  return {responsive:true,maintainAspectRatio:false,cutout:'65%',
    plugins:{legend:{position:'bottom',labels:{color:'#6a8aaa',font:{size:11},padding:14,boxWidth:12}},
    tooltip:{callbacks:{label:function(c){return c.label+': '+fmtEUR(c.raw)+' ('+fmtPct(c.raw/Math.max(bruto,1)*100)+')';}}}}};
}

// ── ESCALAS IRPF ESTATAL + AUTONÓMICA (separadas para aplicar mínimo por CCAA) ──
function calcIRPFTramosEstatal(b){
  b = Math.max(0,+b||0);
  var t=0;
  if(b<=12450)  t=b*0.095;
  else if(b<=20200) t=1182.75+(b-12450)*0.12;
  else if(b<=35200) t=2112.75+(b-20200)*0.15;
  else if(b<=60000) t=4362.75+(b-35200)*0.185;
  else if(b<=300000) t=8950.75+(b-60000)*0.225;
  else              t=62950.75+(b-300000)*0.245;
  return t;
}
function calcIRPFTramosAuto(b, ccaa){
  b = Math.max(0,+b||0);
  var r={
    andalucia:    [[12450,.09],[20200,.12],[35200,.15],[60000,.185],[300000,.225],[Infinity,.245]],
    aragon:       [[12450,.10],[20200,.1225],[35200,.1575],[60000,.20],[300000,.235],[Infinity,.255]],
    asturias:     [[12450,.10],[20200,.125],[35200,.17],[60000,.21],[90000,.235],[175000,.245],[300000,.26],[Infinity,.27]],
    baleares:     [[12450,.09],[20200,.1175],[35200,.155],[60000,.195],[100000,.23],[200000,.245],[Infinity,.26]],
    canarias:     [[12450,.09],[20200,.1175],[35200,.155],[60000,.195],[90000,.215],[Infinity,.245]],
    cantabria:    [[12450,.10],[20200,.1275],[35200,.17],[60000,.21],[90000,.235],[Infinity,.255]],
    clm:          [[12450,.09],[20200,.12],[35200,.155],[60000,.185],[Infinity,.225]],
    cyl:          [[12450,.09],[20200,.12],[35200,.155],[60000,.185],[Infinity,.225]],
    cataluna:     [[12450,.1050],[20200,.1250],[35200,.1650],[60000,.2050],[90000,.2250],[175000,.2550],[300000,.2650],[Infinity,.2750]],
    extremadura:  [[12450,.10],[20200,.125],[35200,.175],[60000,.215],[Infinity,.255]],
    galicia:      [[12450,.095],[20200,.1175],[35200,.155],[60000,.195],[Infinity,.225]],
    madrid:       [[12450,.09],[20200,.1175],[35200,.155],[60000,.185],[Infinity,.21]],
    murcia:       [[12450,.095],[20200,.12],[35200,.155],[60000,.195],[Infinity,.225]],
    rioja:        [[12450,.09],[20200,.12],[35200,.155],[60000,.185],[Infinity,.225]],
    valencia:     [[12450,.10],[20200,.13],[35200,.18],[60000,.215],[150000,.235],[Infinity,.255]]
  };
  var tramos = r[ccaa] || r['madrid'];
  var t=0, prev=0;
  for(var i=0;i<tramos.length;i++){
    var lim=tramos[i][0], tipo=tramos[i][1];
    if(b<=lim){ t+=( b-prev)*tipo; break; }
    t+=(lim-prev)*tipo; prev=lim;
  }
  return t;
}
function calcIRPFTramos(bl, ccaa) {
  return calcIRPFTramosEstatal(bl) + calcIRPFTramosAuto(bl, ccaa);
}

// ── SEGURIDAD SOCIAL 2026 (con tope de base máxima + solidaridad) ─────────
function calcEmployeeSS2026(bruto){
  bruto = Math.max(0,+bruto||0);
  var maxBaseMensual = 5101.20, annualMaxBase = maxBaseMensual*12;
  var cotBase = Math.min(bruto, annualMaxBase);
  var generalRate = 0.047 + 0.0155 + 0.001 + 0.0015; // CC+desempleo+formación+MEI = 6,50%
  var total = cotBase * generalRate;
  var annualTramo1 = (5611.32 - maxBaseMensual) * 12;
  var annualTramo2 = (7651.80 - 5611.32) * 12;
  var exceso = Math.max(0, bruto - annualMaxBase);
  if (exceso > 0) {
    var t1 = Math.min(exceso, annualTramo1);
    total += t1 * 0.0019;
    var restante = exceso - t1;
    if (restante > 0) {
      var t2 = Math.min(restante, annualTramo2);
      total += t2 * 0.0021;
      var restante2 = restante - t2;
      if (restante2 > 0) total += restante2 * 0.0024;
    }
  }
  return total;
}

// ── REDUCCIÓN ART. 20 LIRPF (valores 2025/2026, RDL 4/2024) ───────────────
function calcRendTrabajoReduction(r){
  r = Math.max(0,+r||0);
  if (r<=14852) return 7302;
  if (r<=17673.52) return Math.max(0, 7302 - 1.75*(r-14852));
  if (r<19747.5) return Math.max(0, 2364.34 - 1.14*(r-17673.52));
  return 0;
}

// ── MÍNIMO PERSONAL/FAMILIAR POR CCAA (solo para cuota autonómica) ────────
function getAutonomicMinimo(ccaa){
  var m = { andalucia:5790, asturias:6105, canarias:5606, galicia:5789, madrid:5956.65, valencia:6105 };
  return m[ccaa] || 5550;
}

// ── DEDUCCIÓN ESTATAL RENTAS BAJAS / SMI 2026 (DA 61ª LIRPF) ──────────────
function calcDeduccionSMI(bruto){
  var MAX=590.89, U1=17094, U2=20048.45;
  if (bruto<=U1) return MAX;
  if (bruto>=U2) return 0;
  return MAX * (U2-bruto)/(U2-U1);
}

// ── SALARIO BRUTO → NETO (empleado, con mínimo por CCAA y deducción SMI) ──
function calcSalaryTax2026(bruto, ccaa, minExtra, pp){
  bruto = Math.max(0,+bruto||0); minExtra = Math.max(0,+minExtra||0); pp = Math.max(0,+pp||0);
  var ss = calcEmployeeSS2026(bruto);
  var rendNeto = Math.max(0, bruto - ss - 2000);
  var red = Math.min(rendNeto, calcRendTrabajoReduction(rendNeto));
  var bl = Math.max(0, rendNeto - red - pp);
  var minEstatal = 5550 + minExtra;
  var minAuto = getAutonomicMinimo(ccaa) + minExtra;
  var blMinEstatal = Math.min(bl, minEstatal);
  var blMinAuto = Math.min(bl, minAuto);
  var cuotaEstatal = calcIRPFTramosEstatal(bl) - calcIRPFTramosEstatal(blMinEstatal);
  var cuotaAuto = calcIRPFTramosAuto(bl, ccaa) - calcIRPFTramosAuto(blMinAuto, ccaa);
  var cuotaBruta = Math.max(0, cuotaEstatal + cuotaAuto);
  var deduccionSMI = calcDeduccionSMI(bruto);
  var irpf = Math.max(0, cuotaBruta - deduccionSMI);
  return {
    bruto: bruto, ss: ss, rendimientoNetoTrabajo: rendNeto, reduccionTrabajo: red,
    baseLiquidableGeneral: bl, minimoPersonalFamiliar: minEstatal, minimoAutonomico: minAuto,
    deduccionSMI: deduccionSMI, irpf: irpf, neto: bruto - ss - irpf,
    tipoEfectivo: bruto>0 ? (irpf/bruto*100) : 0
  };
}

// ── CUOTA IRPF SOBRE UNA BASE (autónomos: rendimiento de actividad) ───────
function calcCuotaIRPFBase(baseGeneral, ccaa){
  baseGeneral = Math.max(0, baseGeneral);
  var minAplEstatal = Math.min(baseGeneral, 5550);
  var minAplAuto = Math.min(baseGeneral, getAutonomicMinimo(ccaa));
  var cuotaEstatal = calcIRPFTramosEstatal(baseGeneral) - calcIRPFTramosEstatal(minAplEstatal);
  var cuotaAuto = calcIRPFTramosAuto(baseGeneral, ccaa) - calcIRPFTramosAuto(minAplAuto, ccaa);
  return Math.max(0, cuotaEstatal + cuotaAuto);
}


// ── CALCULADORA: INTERÉS COMPUESTO ────────────────────────────────────────
window.calcInteres = function() {
  var C=parseFloat(document.getElementById('ic-capital').value)||0;
  var A=parseFloat(document.getElementById('ic-aportacion').value)||0;
  var r=parseFloat(document.getElementById('ic-rent').value)||0;
  var n=parseInt(document.getElementById('ic-anos').value)||1;
  var rm=r/100/12, capital=C, totalAportado=C, labels=[], dataC=[], dataA=[];
  for(var y=1;y<=n;y++){
    for(var m=0;m<12;m++){ capital=capital*(1+rm)+A; totalAportado+=A; }
    labels.push('Año '+y); dataC.push(+capital.toFixed(2)); dataA.push(+totalAportado.toFixed(2));
  }
  var ti=C+A*12*n, ben=capital-ti;
  document.getElementById('ic-results').innerHTML=
    rr('Capital final',fmtEUR(capital),'g')+rr('Total aportado',fmtEUR(ti))+
    rr('Intereses generados',fmtEUR(ben),'g')+rr('Multiplicador','x'+fmtNum(capital/Math.max(ti,1)))+
    rr('% son intereses',fmtPct(ben/capital*100),'g');
  document.getElementById('ic-chart-wrap').style.display='block';
  document.getElementById('ic-cta').style.display='flex';
  if(icChart) icChart.destroy();
  icChart=new Chart(document.getElementById('ic-chart').getContext('2d'),{type:'line',
    data:{labels:labels,datasets:[
      {label:'Capital total',data:dataC,borderColor:'#7dd3a8',backgroundColor:'rgba(125,211,168,.12)',fill:true,tension:.4,pointRadius:1,borderWidth:2},
      {label:'Lo aportado',data:dataA,borderColor:'#b8c8d8',backgroundColor:'transparent',fill:false,tension:.4,pointRadius:1,borderWidth:1.5,borderDash:[5,5]}
    ]},
    options:{responsive:true,maintainAspectRatio:false,
      plugins:{legend:{labels:{color:'#6a8aaa',font:{size:11},boxWidth:12}},tooltip:{callbacks:{label:function(c){return ' '+fmtEUR(c.raw);}}}},
      scales:{x:{ticks:{color:'#6a8aaa',font:{size:10},maxTicksLimit:8},grid:{color:'rgba(255,255,255,.03)'}},
              y:{ticks:{color:'#6a8aaa',font:{size:10},callback:function(v){return fmtEUR(v);}},grid:{color:'rgba(255,255,255,.03)'}}}
    }});
};

// ── CALCULADORA: SALARIO BRUTO NECESARIO (neto → bruto) ───────────────────
window.calcSalario = function() {
  var netoObj = parseFloat(document.getElementById('sal-neto').value)||0;
  var ccaa = document.getElementById('sal-ccaa').value;
  var minExtra = parseFloat(document.getElementById('sal-sit').value)||0;
  var pagas = parseInt(document.getElementById('sal-pagas').value)||14;

  function calcularTodo(bruto) {
    var r = calcSalaryTax2026(bruto, ccaa, minExtra, 0);
    return r;
  }
  function netoFromBruto(bruto) { return calcularTodo(bruto).neto; }

  var lo=netoObj, hi=netoObj*3, bruto=netoObj*1.5;
  for(var i=0;i<60;i++){
    var mid=(lo+hi)/2;
    if(netoFromBruto(mid)<netoObj) lo=mid; else hi=mid;
  }
  bruto=(lo+hi)/2;
  var r = calcularTodo(bruto);
  var ss = r.ss, irpf = r.irpf, netoReal = r.neto;
  var pct=irpf/Math.max(bruto,1)*100;

  var html = rr('Neto objetivo',fmtEUR(netoObj))+
    rr('Salario bruto necesario',fmtEUR(bruto),'g')+
    rr('Seguridad Social',fmtEUR(ss),'o')+
    rr('IRPF estimado',fmtEUR(irpf),'o');
  if (r.deduccionSMI > 0) html += rr('Deducción rentas bajas (SMI 2026)',fmtEUR(r.deduccionSMI),'g');
  html += rr('Tipo efectivo IRPF',fmtPct(pct),'o')+
    rr('Neto real resultante',fmtEUR(netoReal),'g')+
    rr('Neto por paga ('+pagas+')',fmtEUR(netoReal/pagas),'g');

  document.getElementById('sal-results').innerHTML = html;
  document.getElementById('sal-chart-wrap').style.display='block';
  document.getElementById('sal-cta').style.display='flex';
  if(window._salChart) window._salChart.destroy();
  window._salChart=new Chart(document.getElementById('sal-chart').getContext('2d'),{type:'doughnut',
    data:{labels:['Neto','IRPF','Seguridad Social'],
      datasets:[{data:[+netoReal.toFixed(2),+irpf.toFixed(2),+ss.toFixed(2)],
        backgroundColor:['rgba(125,211,168,.75)','rgba(240,160,112,.75)','rgba(184,200,216,.35)'],
        borderColor:['#7dd3a8','#f0a070','#b8c8d8'],borderWidth:1.5,hoverOffset:6}]},
    options:doughnutOpts(bruto)});
};

// ── CALCULADORA: PLAN DE PENSIONES (empleado / autónomo) ──────────────────
window.ppUpdateFields = function(){
  var tipo = document.getElementById('pp-tipo').value;
  var brutoLabel = document.getElementById('pp-bruto-label');
  var aportInput = document.getElementById('pp-aport');
  var aportHelp = document.getElementById('pp-aport-help');
  if (tipo === 'autonomo') {
    brutoLabel.innerHTML = 'Rendimiento neto anual de la actividad (&euro;)';
    aportInput.max = 5750;
    aportHelp.innerHTML = 'Límite individual: 1.500€/año. Hasta 5.750€ con Plan de Empleo Simplificado (PPES, máx. 4.250€ adicionales). Nunca supera el 30% de tu rendimiento neto.';
  } else {
    brutoLabel.innerHTML = 'Salario bruto anual (&euro;)';
    aportInput.max = 10000;
    aportHelp.innerHTML = 'Límite individual: 1.500€/año. Hasta 10.000€ solo si 8.500€ proceden de aportaciones de tu empresa.';
  }
};

window.calcPension = function() {
  var tipo = document.getElementById('pp-tipo').value;
  var bruto=parseFloat(document.getElementById('pp-bruto').value)||0;
  var aportInput=parseFloat(document.getElementById('pp-aport').value)||0;
  var ccaa=document.getElementById('pp-ccaa').value;
  var ns, nc, ahorro, coste, aport;

  if (tipo === 'autonomo') {
    var limiteNormativo = Math.min(5750, bruto*0.30);
    aport = Math.min(aportInput, limiteNormativo);
    var cuotaSin = calcCuotaIRPFBase(bruto, ccaa);
    var cuotaCon = calcCuotaIRPFBase(bruto-aport, ccaa);
    ahorro = cuotaSin - cuotaCon;
    ns = bruto - cuotaSin;
    nc = ns + ahorro;
    coste = aport - ahorro;
  } else {
    aport = Math.min(aportInput, 10000);
    var cn = function(b,ppAport){ return calcSalaryTax2026(b, ccaa, 0, ppAport).neto; };
    ns=cn(bruto,0);
    nc=cn(bruto,aport);
    ahorro=nc-ns;
    coste=aport-ahorro;
  }

  document.getElementById('pp-results').innerHTML=
    rr('Aportación anual al plan',fmtEUR(aport))+rr('Neto sin plan de pensiones',fmtEUR(ns))+rr('Neto con plan de pensiones',fmtEUR(nc),'g')+rr('Ahorro fiscal anual',fmtEUR(ahorro),'g')+rr('Coste real de la aportación',fmtEUR(coste),'g')+rr('Ahorro por cada 100€ aportados',fmtEUR(ahorro/Math.max(aport,1)*100),'g');
  document.getElementById('pp-chart-wrap').style.display='block';document.getElementById('pp-cta').style.display='flex';
  if(window._ppChart) window._ppChart.destroy();
  window._ppChart=new Chart(document.getElementById('pp-chart').getContext('2d'),{type:'bar',data:{labels:['Sin plan','Con plan'],datasets:[{label:'Neto anual',data:[+ns.toFixed(2),+nc.toFixed(2)],backgroundColor:['rgba(184,200,216,.5)','rgba(125,211,168,.75)'],borderColor:['#b8c8d8','#7dd3a8'],borderWidth:1.5}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false},tooltip:{callbacks:{label:function(c){return ' '+fmtEUR(c.raw);}}}},scales:{x:{ticks:{color:'#6a8aaa'},grid:{display:false}},y:{ticks:{color:'#6a8aaa',callback:function(v){return fmtEUR(v);}},grid:{color:'rgba(255,255,255,.03)'}}}}});
};
