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
  function getInfl(prefix) {
    var chk = document.getElementById(prefix+'-infl-check');
    if (!chk || !chk.checked) return 0;
    return (parseFloat(document.getElementById(prefix+'-infl-val').value) || 0) / 100;
  }

  function valorReal(nominal, inflAnual, anos) {
    if (inflAnual <= 0) return nominal;
    return nominal / Math.pow(1 + inflAnual, anos);
  }

  window.calcHipoteca = function() {
    var precio=parseFloat(document.getElementById('hip-precio').value)||0;
    var entrada=parseFloat(document.getElementById('hip-entrada').value)||0;
    var tipo=parseFloat(document.getElementById('hip-tipo').value)||0;
    var plazo=parseInt(document.getElementById('hip-plazo').value)||30;
    var capital=precio-entrada;
    var rm=tipo/100/12, n=plazo*12;
    var cuota=(rm===0)?capital/n:capital*rm*Math.pow(1+rm,n)/(Math.pow(1+rm,n)-1);
    var totalPagado=cuota*n, totalIntereses=totalPagado-capital;
    document.getElementById('hip-results').innerHTML=
      rr('Capital prestado',fmtEUR(capital))+
      rr('Cuota mensual',fmtEUR(cuota),'g')+
      rr('Total pagado',fmtEUR(totalPagado))+
      rr('Total intereses',fmtEUR(totalIntereses),'o')+
      rr('% sobre capital',fmtPct(totalIntereses/Math.max(capital,1)*100),'o')+
      rr('Entrada',fmtEUR(entrada))+
      rr('Plazo',plazo+' años');
    document.getElementById('hip-chart-wrap').style.display='block';
    document.getElementById('hip-cta').style.display='flex';
    if(window._hipChart) window._hipChart.destroy();
    window._hipChart=new Chart(document.getElementById('hip-chart').getContext('2d'),{type:'doughnut',
      data:{labels:['Capital','Intereses','Entrada'],
        datasets:[{data:[+capital.toFixed(2),+totalIntereses.toFixed(2),+entrada.toFixed(2)],
          backgroundColor:['rgba(125,211,168,.75)','rgba(240,160,112,.75)','rgba(184,200,216,.35)'],
          borderColor:['#7dd3a8','#f0a070','#b8c8d8'],borderWidth:1.5,hoverOffset:6}]},
      options:doughnutOpts(totalPagado+entrada)});
  }

  window.calcCoste = function() {
    var bruto=parseFloat(document.getElementById('ce-bruto').value)||0;
    var ssEmpresa=bruto*0.3048, costeTotal=bruto+ssEmpresa;
    document.getElementById('ce-results').innerHTML=
      rr('Tu salario bruto',fmtEUR(bruto))+
      rr('SS a cargo empresa (30,48%)',fmtEUR(ssEmpresa),'o')+
      rr('Coste total anual',fmtEUR(costeTotal),'g')+
      rr('Coste mensual',fmtEUR(costeTotal/12))+
      rr('Coste por hora (~1.800h)',fmtEUR(costeTotal/1800))+
      rr('Multiplicador sobre tu bruto','x'+fmtNum(costeTotal/Math.max(bruto,1)),'g');
    document.getElementById('ce-chart-wrap').style.display='block';
    document.getElementById('ce-cta').style.display='flex';
    if(window._ceChart) window._ceChart.destroy();
    window._ceChart=new Chart(document.getElementById('ce-chart').getContext('2d'),{type:'doughnut',
      data:{labels:['Salario bruto','SS empresa'],
        datasets:[{data:[+bruto.toFixed(2),+ssEmpresa.toFixed(2)],
          backgroundColor:['rgba(125,211,168,.75)','rgba(240,160,112,.75)'],
          borderColor:['#7dd3a8','#f0a070'],borderWidth:1.5,hoverOffset:6}]},
      options:doughnutOpts(costeTotal)});
  }

  window.calcInflacion = function() {
    var cap=parseFloat(document.getElementById('inf-capital').value)||0;
    var anos=parseInt(document.getElementById('inf-anos').value)||1;
    var tasaEl=document.getElementById('inf-tasa');
    var ipcEl=document.getElementById('inf-ipc');

    // Modo simple (páginas standalone con un único campo "inf-tasa"):
    // solo pérdida de poder adquisitivo, sin comparación con inversión.
    if (tasaEl && !ipcEl) {
      var ipcS = parseFloat(tasaEl.value)||0;
      var poderS = cap/Math.pow(1+ipcS/100,anos);
      document.getElementById('inf-results').innerHTML=
        rr('Cantidad actual',fmtEUR(cap))+
        rr('Poder adquisitivo dentro de '+anos+' años',fmtEUR(poderS),'o')+
        rr('Pérdida de poder adquisitivo',fmtEUR(cap-poderS),'o')+
        rr('Inflación acumulada',fmtPct((Math.pow(1+ipcS/100,anos)-1)*100),'o');
      document.getElementById('inf-chart-wrap').style.display='block';
      document.getElementById('inf-cta').style.display='flex';
      if(window._infChart) window._infChart.destroy();
      var labelsS=[],dataPS=[];
      for(var ys=1;ys<=Math.min(anos,30);ys++){
        labelsS.push('Año '+ys);
        dataPS.push(+(cap/Math.pow(1+ipcS/100,ys)).toFixed(2));
      }
      window._infChart=new Chart(document.getElementById('inf-chart').getContext('2d'),{type:'line',
        data:{labels:labelsS,datasets:[
          {label:'Poder adquisitivo',data:dataPS,borderColor:'#f0a070',backgroundColor:'rgba(240,160,112,.1)',tension:.3,fill:true,pointRadius:2}
        ]},
        options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false}},
          scales:{x:{ticks:{color:'rgba(184,200,216,.7)',maxTicksLimit:10}},y:{ticks:{color:'rgba(184,200,216,.7)',callback:function(v){return fmtEUR(v);}}}}}});
      return;
    }

    // Modo completo (SPA): compara invertir vs mantener en efectivo frente a inflación.
    var ipc=parseFloat(ipcEl?ipcEl.value:0)||0;
    var rent=parseFloat(document.getElementById('inf-rent').value)||0;
    var futuro=cap*Math.pow(1+rent/100,anos);
    var poder=cap/Math.pow(1+ipc/100,anos);
    var sinInv=cap; // kept in cash
    document.getElementById('inf-results').innerHTML=
      rr('Capital inicial',fmtEUR(cap))+
      rr('Valor futuro (invertido)',fmtEUR(futuro),'g')+
      rr('Poder adquisitivo real',fmtEUR(poder),'o')+
      rr('Ganancia real (vs inflación)',fmtEUR(futuro-poder),'g')+
      rr('Pérdida guardando en efectivo',fmtEUR(cap-poder),'o')+
      rr('Inflación acumulada',fmtPct((Math.pow(1+ipc/100,anos)-1)*100),'o');
    document.getElementById('inf-chart-wrap').style.display='block';
    document.getElementById('inf-cta').style.display='flex';
    if(window._infChart) window._infChart.destroy();
    var labels=[],dataF=[],dataP=[],dataC=[];
    for(var y=1;y<=Math.min(anos,30);y++){
      labels.push('Año '+y);
      dataF.push(+(cap*Math.pow(1+rent/100,y)).toFixed(2));
      dataP.push(+(cap/Math.pow(1+ipc/100,y)).toFixed(2));
      dataC.push(+cap.toFixed(2));
    }
    window._infChart=new Chart(document.getElementById('inf-chart').getContext('2d'),{type:'line',
      data:{labels:labels,datasets:[
        {label:'Invertido',data:dataF,borderColor:'#7dd3a8',backgroundColor:'rgba(125,211,168,.1)',tension:.3,fill:true,pointRadius:2},
        {label:'Poder adquisitivo',data:dataP,borderColor:'#f0a070',backgroundColor:'rgba(240,160,112,.1)',tension:.3,fill:true,pointRadius:2},
        {label:'En efectivo',data:dataC,borderColor:'#b8c8d8',backgroundColor:'transparent',borderDash:[4,4],tension:0,pointRadius:0}
      ]},
      options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{position:'bottom',labels:{color:'#6a8aaa',font:{size:11}}}},
        scales:{x:{ticks:{color:'rgba(184,200,216,.7)',maxTicksLimit:10}},y:{ticks:{color:'rgba(184,200,216,.7)',callback:function(v){return fmtEUR(v);}}}}}});
  }

  window.calcJubilacion = function() {
    var actualEl=document.getElementById('jub-actual')||document.getElementById('jub-capital');
    var actual=parseFloat(actualEl?actualEl.value:0)||0;
    var aportEl=document.getElementById('jub-aport')||document.getElementById('jub-ahorro');
    var aport=parseFloat(aportEl?aportEl.value:0)||0;
    var rent=parseFloat(document.getElementById('jub-rent').value)||7;
    var gastos=parseFloat(document.getElementById('jub-gastos').value)||2000;
    var edadEl=document.getElementById('jub-edad');
    var edad=edadEl?(parseInt(edadEl.value)||35):null;
    var retiradaEl=document.getElementById('jub-retirada');
    var tasaRetirada=retiradaEl?(parseFloat(retiradaEl.value)||4)/100:0.04;
    var infl=getInfl('jub');
    // OJO: "jub-gastos" significa cosas distintas según la página.
    // SPA (con jub-edad): gastos MENSUALES en la retirada -> se anualizan (*12).
    // Standalone (sin jub-edad): gastos ANUALES actuales -> ya vienen anualizados.
    var gastosAnuales = edadEl ? gastos*12 : gastos;
    var fire=gastosAnuales/tasaRetirada;
    var rm=rent/100/12, capital=actual, anos=0;
    var labels=[],dataK=[],dataReal=[];
    while(capital<fire && anos<80){
      for(var m=0;m<12;m++) capital=capital*(1+rm)+aport;
      anos++;
      labels.push('Año '+(anos));
      dataK.push(+capital.toFixed(2));
      dataReal.push(+(valorReal(capital, infl, anos).toFixed(2)));
    }
    var edadFire=edad!==null?edad+anos:null;
    var capitalReal=valorReal(capital, infl, anos);
    var fireReal=valorReal(fire, infl, anos);
    var html=rr('Capital FIRE necesario (tasa '+(tasaRetirada*100).toFixed(1).replace('.',',')+'%)',fmtEUR(fire))+
      rr('Capital actual',fmtEUR(actual))+
      rr('Aportación mensual',fmtEUR(aport))+
      rr('Años hasta FIRE',anos<80?anos+' años':'> 80 años (revisa datos)','g');
    if(edadFire!==null) html+=rr('Edad de retirada estimada',edadFire<120?edadFire+' años':'> 80 (revisa datos)','g');
    html+=rr('Capital alcanzado (nominal)',fmtEUR(capital));
    if(infl>0) html+=rr('Capital alcanzado (real)',fmtEUR(capitalReal),'g')+
      rr('Objetivo FIRE (real)',fmtEUR(fireReal));
    document.getElementById('jub-results').innerHTML=html;
    document.getElementById('jub-chart-wrap').style.display='block';
    document.getElementById('jub-cta').style.display='flex';
    if(window._jubChart) window._jubChart.destroy();
    var fireArr=labels.map(function(){return +fire.toFixed(2);});
    var datasets=[
      {label:'Capital acumulado',data:dataK,borderColor:'#7dd3a8',backgroundColor:'rgba(125,211,168,.1)',tension:.3,fill:true,pointRadius:1},
      {label:'Objetivo FIRE',data:fireArr,borderColor:'#f0a070',backgroundColor:'transparent',borderDash:[5,5],tension:0,pointRadius:0}
    ];
    if(infl>0) datasets.push({label:'Capital real (euros hoy)',data:dataReal,borderColor:'#c9a84c',backgroundColor:'transparent',borderDash:[3,3],tension:.3,pointRadius:0,borderWidth:1.5});
    window._jubChart=new Chart(document.getElementById('jub-chart').getContext('2d'),{type:'line',
      data:{labels:labels,datasets:datasets},
      options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{position:'bottom',labels:{color:'#6a8aaa',font:{size:11}}}},
        scales:{x:{ticks:{color:'rgba(184,200,216,.7)',maxTicksLimit:10}},y:{ticks:{color:'rgba(184,200,216,.7)',callback:function(v){return fmtEUR(v);}}}}}});
  }

  window.calcDeposito = function() {
    var cap=parseFloat(document.getElementById('dep-capital').value)||0;
    var tinEl=document.getElementById('dep-tin')||document.getElementById('dep-tipo');
    var tin=parseFloat(tinEl?tinEl.value:0)||0;
    var meses=parseInt(document.getElementById('dep-meses').value)||12;
    var infl=getInfl('dep');
    var anos=meses/12;
    var intBruto=cap*tin/100*meses/12;
    var retencion=intBruto*0.19;
    var intNeto=intBruto-retencion;
    var tae=Math.pow(1+tin/100/12,12)-1;
    var totalNeto=cap+intNeto;
    var totalReal=valorReal(totalNeto, infl, anos);
    var perdidaReal=totalNeto-totalReal;
    // Rentabilidad real = (1+tae_neto)/(1+infl) - 1
    var taeNeto=Math.pow(1+tin/100*(1-0.19)/12,12)-1; // aprox neta
    var taeReal=infl>0?((1+taeNeto)/(1+infl)-1):taeNeto;
    var html=rr('Capital depositado',fmtEUR(cap))+
      rr('TIN anual',fmtPct(tin))+
      rr('Plazo',meses+' meses')+
      rr('Intereses brutos',fmtEUR(intBruto))+
      rr('Retención Hacienda (19%)',fmtEUR(retencion),'o')+
      rr('Intereses netos',fmtEUR(intNeto),'g')+
      rr('Capital total al vencimiento',fmtEUR(totalNeto),'g')+
      rr('TAE equivalente',fmtPct(tae*100));
    if(infl>0){
      html+=rr('Capital total al vencimiento (real)',fmtEUR(totalReal), taeReal>=0?'g':'o')+
        rr('Pérdida de poder adquisitivo',fmtEUR(perdidaReal),'o')+
        rr('Rentabilidad neta (real)',fmtPct(taeReal*100),taeReal>=0?'g':'o');
    }
    document.getElementById('dep-results').innerHTML=html;
    document.getElementById('dep-chart-wrap').style.display='block';
    document.getElementById('dep-cta').style.display='flex';
    if(window._depChart) window._depChart.destroy();
    var doughLabels=['Capital','Intereses netos','Retención Hacienda'];
    var doughData=[+cap.toFixed(2),+intNeto.toFixed(2),+retencion.toFixed(2)];
    if(infl>0){ doughLabels.push('Pérdida inflación'); doughData.push(+perdidaReal.toFixed(2)); }
    window._depChart=new Chart(document.getElementById('dep-chart').getContext('2d'),{type:'doughnut',
      data:{labels:doughLabels,
        datasets:[{data:doughData,
          backgroundColor:['rgba(125,211,168,.75)','rgba(125,180,255,.75)','rgba(240,160,112,.75)','rgba(201,168,76,.5)'],
          borderColor:['#7dd3a8','#7db4ff','#f0a070','#c9a84c'],borderWidth:1.5,hoverOffset:6}]},
      options:doughnutOpts(cap+intBruto)});
  }

  window.calcAlquilervs = function() {
    var precio=parseFloat(document.getElementById('avs-precio').value)||0;
    var entrada=parseFloat(document.getElementById('avs-entrada').value)||0;
    var tipo=parseFloat(document.getElementById('avs-tipo').value)||0;
    var plazo=parseInt(document.getElementById('avs-plazo').value)||25;
    var alqMes=parseFloat(document.getElementById('avs-alquiler').value)||0;
    var revalor=parseFloat(document.getElementById('avs-revalor').value)||0;
    var anos=parseInt(document.getElementById('avs-anos').value)||15;
    var capital=precio-entrada;
    if(capital<=0){document.getElementById('avs-results').innerHTML='<div class="empty-state">La entrada cubre el precio total.</div>';return;}
    var r=tipo/100/12,n=plazo*12;
    var cuota=(r===0)?capital/n:capital*(r*Math.pow(1+r,n))/(Math.pow(1+r,n)-1);
    var mC=Math.min(anos*12,n);
    var gastosComp=precio*0.10;
    var valorPiso=precio*Math.pow(1+revalor/100,anos);
    var labelsA=[],dComp=[],dAlq=[],acC=entrada+gastosComp,acA=0,alqAnual=alqMes*12;
    for(var y=1;y<=anos;y++){acC+=cuota*12+2000;acA+=alqAnual*Math.pow(1.03,y-1);labelsA.push('A\u00f1o '+y);dComp.push(+acC.toFixed(2));dAlq.push(+acA.toFixed(2));}
    document.getElementById('avs-results').innerHTML=
      rr('Cuota hipotecaria mensual',fmtEUR(cuota))+rr('Coste total compra ('+anos+' a\u00f1os)',fmtEUR(acC),'o')+rr('Coste total alquiler ('+anos+' a\u00f1os)',fmtEUR(acA),'o')+rr('Valor estimado piso en '+anos+' a\u00f1os',fmtEUR(valorPiso),'g')+rr('Coste oportunidad entrada (7%/a)',fmtEUR(entrada*(Math.pow(1.07,anos)-1)),'o');
    document.getElementById('avs-chart-wrap').style.display='block';document.getElementById('avs-cta').style.display='flex';
    if(window._avsChart) window._avsChart.destroy();
    window._avsChart=new Chart(document.getElementById('avs-chart').getContext('2d'),{type:'line',data:{labels:labelsA,datasets:[{label:'Coste compra acumulado',data:dComp,borderColor:'#f0a070',backgroundColor:'rgba(240,160,112,.08)',fill:true,tension:.4,pointRadius:1,borderWidth:2},{label:'Coste alquiler acumulado',data:dAlq,borderColor:'#7dd3a8',backgroundColor:'rgba(125,211,168,.08)',fill:true,tension:.4,pointRadius:1,borderWidth:2}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{labels:{color:'rgba(184,200,216,.8)',font:{size:11},boxWidth:12}},tooltip:{callbacks:{label:function(c){return ' '+fmtEUR(c.raw);}}}},scales:{x:{ticks:{color:'rgba(184,200,216,.7)',font:{size:10},maxTicksLimit:8},grid:{color:'rgba(255,255,255,.07)'}},y:{ticks:{color:'rgba(184,200,216,.7)',font:{size:10},callback:function(v){return fmtEUR(v);}},grid:{color:'rgba(255,255,255,.07)'}}}}});
  }

  window.calcAmortizacion = function() {
    var capitalEl=document.getElementById('am-capital')||document.getElementById('am-deuda');
    var capital=parseFloat(capitalEl?capitalEl.value:0)||0;
    var tipo=parseFloat(document.getElementById('am-tipo').value)||0;
    var anosEl=document.getElementById('am-anos')||document.getElementById('am-plazo');
    var anos=parseInt(anosEl?anosEl.value:1)||1;
    var extra=parseFloat(document.getElementById('am-extra').value)||0;
    var obj=document.getElementById('am-tipo-amort').value;
    var r=tipo/100/12,n=anos*12;
    var cuota=(r===0)?capital/n:capital*(r*Math.pow(1+r,n))/(Math.pow(1+r,n)-1);
    var intSin=cuota*n-capital,capN=capital-extra;
    if(capN<0){document.getElementById('am-results').innerHTML='<div class="empty-state">El importe supera el capital pendiente.</div>';return;}
    var intCon,cuotaN=cuota,mM=0;
    if(obj==='plazo'){var nN=(capN>0&&r>0)?Math.log(cuota/(cuota-r*capN))/Math.log(1+r):capN/cuota;mM=n-nN;intCon=cuota*nN-capN;}
    else{cuotaN=(r===0)?capN/n:capN*(r*Math.pow(1+r,n))/(Math.pow(1+r,n)-1);intCon=cuotaN*n-capN;}
    document.getElementById('am-results').innerHTML=
      rr('Capital pendiente',fmtEUR(capital))+rr('Importe amortizado',fmtEUR(extra))+rr('Intereses sin amortizar',fmtEUR(intSin),'o')+rr('Intereses tras amortizar',fmtEUR(intCon),'g')+rr('Ahorro en intereses',fmtEUR(intSin-intCon),'g')+(obj==='plazo'?rr('Tiempo ahorrado',Math.round(mM/12*10)/10+' a\u00f1os ('+Math.round(mM)+' meses)','g'):rr('Nueva cuota mensual',fmtEUR(cuotaN),'g'));
    document.getElementById('am-chart-wrap').style.display='block';document.getElementById('am-cta').style.display='flex';
    if(window._amChart) window._amChart.destroy();
    window._amChart=new Chart(document.getElementById('am-chart').getContext('2d'),{type:'bar',data:{labels:['Sin amortizar','Con amortizaci\u00f3n'],datasets:[{label:'Capital',data:[+capital.toFixed(2),+capN.toFixed(2)],backgroundColor:['rgba(184,200,216,.4)','rgba(184,200,216,.4)'],borderColor:['#b8c8d8','#b8c8d8'],borderWidth:1.5},{label:'Intereses',data:[+intSin.toFixed(2),+intCon.toFixed(2)],backgroundColor:['rgba(240,160,112,.7)','rgba(125,211,168,.75)'],borderColor:['#f0a070','#7dd3a8'],borderWidth:1.5}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{labels:{color:'rgba(184,200,216,.8)',font:{size:11},boxWidth:12}},tooltip:{callbacks:{label:function(c){return ' '+fmtEUR(c.raw);}}}},scales:{x:{stacked:true,ticks:{color:'rgba(184,200,216,.7)'},grid:{display:false}},y:{stacked:true,ticks:{color:'rgba(184,200,216,.7)',callback:function(v){return fmtEUR(v);}},grid:{color:'rgba(255,255,255,.07)'}}}}});
  }

  window.calcAlquiler = function() {
    var precio=parseFloat(document.getElementById('alq-precio').value)||0;
    var pctG=parseFloat(document.getElementById('alq-gastos').value)||0;
    var renta=parseFloat(document.getElementById('alq-renta').value)||0;
    var gA=parseFloat(document.getElementById('alq-gastos-anuales').value)||0;
    var vac=parseFloat(document.getElementById('alq-vacante').value)||0;
    var inv=precio*(1+pctG/100);
    var ingB=renta*12,ingE=renta*(12-vac),benN=ingE-gA;
    var rB=ingB/inv*100,rN=benN/inv*100,ptr=precio/(renta*12);
    document.getElementById('alq-results').innerHTML=
      rr('Inversi\u00f3n total (precio+gastos)',fmtEUR(inv))+rr('Ingresos brutos anuales',fmtEUR(ingB))+rr('Ingresos efectivos (con vacante)',fmtEUR(ingE),'g')+rr('Gastos anuales',fmtEUR(gA),'o')+rr('Beneficio neto anual',fmtEUR(benN),'g')+rr('Rentabilidad bruta',fmtPct(rB))+rr('Rentabilidad neta',fmtPct(rN),'g')+rr('Price-to-Rent ratio',Math.round(ptr*10)/10+'x');
    document.getElementById('alq-chart-wrap').style.display='block';document.getElementById('alq-cta').style.display='flex';
    if(window._alqChart) window._alqChart.destroy();
    window._alqChart=new Chart(document.getElementById('alq-chart').getContext('2d'),{type:'doughnut',data:{labels:['Beneficio neto','Gastos anuales','Vacante'],datasets:[{data:[+Math.max(benN,0).toFixed(2),+gA.toFixed(2),+(renta*vac).toFixed(2)],backgroundColor:['rgba(125,211,168,.75)','rgba(240,160,112,.75)','rgba(184,200,216,.35)'],borderColor:['#7dd3a8','#f0a070','#b8c8d8'],borderWidth:1.5,hoverOffset:6}]},options:{responsive:true,maintainAspectRatio:false,cutout:'65%',plugins:{legend:{position:'bottom',labels:{color:'#6a8aaa',font:{size:11},padding:14,boxWidth:12}},tooltip:{callbacks:{label:function(c){return c.label+': '+fmtEUR(c.raw);}}}}}});
  }

