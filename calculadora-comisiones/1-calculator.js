
(function(){
'use strict';
const ids=['initial','monthly','years','gross','fee'];
const $=id=>document.getElementById(id);
const euro=x=>new Intl.NumberFormat('es-ES',{style:'currency',currency:'EUR',maximumFractionDigits:0}).format(x);
const pct=x=>new Intl.NumberFormat('es-ES',{maximumFractionDigits:2}).format(x)+'%';
function future(initial,monthly,years,annual){const factor=Math.pow(1+annual/100,1/12);let v=initial;for(let i=0;i<years*12;i++)v=v*factor+monthly;return v;}
window.comisionesFuture=future;
function update(){
const vals=ids.map(id=>Number($(id).value));
if(ids.some((id,i)=>$(id).value.trim()===''||!Number.isFinite(vals[i])||!$(id).checkValidity())){$('error').textContent='Revisa los campos: importes no negativos, plazo entero de 1 a 60 años, rentabilidad de −50% a 30% y comisión de 0% a 10%.';$('results').hidden=true;$('table').replaceChildren();return;}
$('error').textContent='';$('results').hidden=false;
const [initial,monthly,years,gross,fee]=vals;
const without=future(initial,monthly,years,gross), withFee=future(initial,monthly,years,gross-fee),drag=without-withFee;
$('without').textContent=euro(without);$('with').textContent=euro(withFee);$('with-label').textContent='Con una comisión del '+pct(fee);$('drag').textContent=euro(drag);
$('reduction').textContent=without>0?'Un '+pct(drag/without*100)+' menos que el capital final del escenario sin comisiones.':'Sin capital ni aportaciones, ambos escenarios terminan en 0 €.';
$('contributed').textContent='Total aportado: '+euro(initial+monthly*years*12)+'. Horizonte: '+years+' años.';
const fees=[...new Set([0,.2,.5,1,2,fee])].sort((a,b)=>a-b);
$('bars').replaceChildren();$('table').replaceChildren();
fees.forEach(f=>{const v=future(initial,monthly,years,gross-f);const row=document.createElement('div');row.className='bar-row'+(f===fee?' selected':'');
const label=document.createElement('span');label.textContent=pct(f);const track=document.createElement('div');track.className='track';const fill=document.createElement('div');fill.className='fill';fill.style.width=(without>0?v/without*100:0)+'%';track.append(fill);const value=document.createElement('b');value.textContent=euro(v);row.append(label,track,value);$('bars').append(row);
const tr=document.createElement('tr');[pct(f)+(f===fee?' · elegida':''),euro(v),euro(without-v)].forEach(t=>{let td=document.createElement('td');td.textContent=t;tr.append(td)});$('table').append(tr);
});
}
$('form').addEventListener('submit',e=>e.preventDefault());ids.forEach(id=>$(id).addEventListener('input',update));$('reset').addEventListener('click',()=>{[10000,200,30,7,1].forEach((v,i)=>$(ids[i]).value=v);update()});$('theme').addEventListener('click',()=>{document.documentElement.dataset.theme=document.documentElement.dataset.theme==='dark'?'light':'dark'});update();
})();
