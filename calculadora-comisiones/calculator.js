
(function(){
'use strict';
const ids=['initial','monthly','years','gross','fee'];
const $=id=>document.getElementById(id);
const euro=x=>new Intl.NumberFormat('es-ES',{style:'currency',currency:'EUR',maximumFractionDigits:0}).format(x);
const pct=x=>new Intl.NumberFormat('es-ES',{maximumFractionDigits:2}).format(x)+'%';
function future(initial,monthly,years,annual){const factor=Math.pow(1+annual/100,1/12);let v=initial;for(let i=0;i<years*12;i++)v=v*factor+monthly;return v;}
window.comisionesFuture=future;
const chartColors=['var(--chart-0)','var(--chart-1)','var(--chart-2)','var(--chart-3)','var(--chart-4)'];
function renderEvolution(initial,monthly,years,gross,fee,fees){
const root=$('evolution-chart'),legend=$('evolution-legend'),range=$('evolution-year');
const series=fees.map((f,i)=>({fee:f,color:f===fee?'var(--chart-selected)':chartColors[i%chartColors.length],values:Array.from({length:years+1},(_,y)=>future(initial,monthly,y,gross-f))}));
const W=window.matchMedia('(max-width:760px)').matches?420:720,H=340,L=62,R=18,T=25,B=40,maxValue=Math.max(1,...series.flatMap(s=>s.values)),unit=Math.pow(10,Math.floor(Math.log10(maxValue))),top=Math.ceil(maxValue/unit*2)/2*unit;
const x=y=>L+y/years*(W-L-R),y=v=>H-B-v/top*(H-T-B);
const node=(tag,attrs,text)=>{const n=document.createElementNS('http://www.w3.org/2000/svg',tag);Object.entries(attrs||{}).forEach(([k,v])=>n.setAttribute(k,v));if(text!==undefined)n.textContent=text;return n;};
root.replaceChildren();const svg=node('svg',{viewBox:`0 0 ${W} ${H}`,role:'img','aria-label':'Evolución del capital por comisión anual. Consulta los importes con el selector de año.'});
for(let i=0;i<=4;i++){const v=top*i/4;svg.append(node('line',{x1:L,y1:y(v),x2:W-R,y2:y(v),class:'chart-grid'}),node('text',{x:L-8,y:y(v)+4,'text-anchor':'end'},new Intl.NumberFormat('es-ES',{notation:'compact',maximumFractionDigits:1}).format(v)));}
svg.append(node('text',{x:L,y:14},'Capital (€)'));
const ticks=[...new Set([0,Math.round(years/3),Math.round(years*2/3),years])];ticks.forEach(t=>svg.append(node('text',{x:x(t),y:H-17,'text-anchor':'middle'},String(t))));svg.append(node('text',{x:W-R,y:H-1,'text-anchor':'end'},'Años'));
series.forEach(s=>svg.append(node('polyline',{points:s.values.map((v,i)=>`${x(i)},${y(v)}`).join(' '),fill:'none',stroke:s.color,'stroke-width':s.fee===fee?4:2.5,'stroke-linecap':'round','stroke-linejoin':'round'})));
const cursor=node('line',{y1:T,y2:H-B,class:'chart-cursor'}),dots=node('g');svg.append(cursor,dots);root.append(svg);
range.max=years;range.value=Math.min(Number(range.value),years);legend.replaceChildren();
series.forEach(s=>{const item=document.createElement('div');item.className='evolution-key'+(s.fee===fee?' selected':'');const mark=document.createElement('i');mark.style.background=s.color;const label=document.createElement('span');label.textContent=pct(s.fee)+(s.fee===fee?' · elegida':'');const amount=document.createElement('strong');item.append(mark,label,amount);legend.append(item);s.amount=amount;});
function selectYear(year){year=Math.max(0,Math.min(years,Math.round(year)));range.value=year;$('evolution-year-label').textContent='Año '+year;cursor.setAttribute('x1',x(year));cursor.setAttribute('x2',x(year));dots.replaceChildren();series.forEach(s=>{s.amount.textContent=euro(s.values[year]);dots.append(node('circle',{cx:x(year),cy:y(s.values[year]),r:s.fee===fee?5:3.5,fill:s.color}));});}
range.oninput=()=>selectYear(Number(range.value));
function pointYear(event){const rect=svg.getBoundingClientRect();return ((event.clientX-rect.left)/rect.width*W-L)/(W-L-R)*years;}
svg.addEventListener('pointermove',e=>{if(e.pointerType==='mouse')selectYear(pointYear(e));});svg.addEventListener('pointerdown',e=>selectYear(pointYear(e)));
$('evolution-final').onclick=()=>selectYear(years);selectYear(Number(range.value));
}

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
fees.forEach((f,index)=>{const v=future(initial,monthly,years,gross-f);const row=document.createElement('div');row.className='bar-row'+(f===fee?' selected':'');
const label=document.createElement('span');label.textContent=pct(f);const track=document.createElement('div');track.className='track';const fill=document.createElement('div');fill.className='fill';fill.style.background=f===fee?'var(--chart-selected)':chartColors[index%chartColors.length];fill.style.width=(without>0?v/without*100:0)+'%';track.append(fill);const value=document.createElement('b');value.textContent=euro(v);row.append(label,track,value);$('bars').append(row);
const tr=document.createElement('tr');[pct(f)+(f===fee?' · elegida':''),euro(v),euro(without-v)].forEach(t=>{let td=document.createElement('td');td.textContent=t;tr.append(td)});$('table').append(tr);
});
renderEvolution(initial,monthly,years,gross,fee,fees);
}
let chartResizeTimer;window.addEventListener('resize',()=>{clearTimeout(chartResizeTimer);chartResizeTimer=setTimeout(update,120)});
$('form').addEventListener('submit',e=>e.preventDefault());ids.forEach(id=>$(id).addEventListener('input',update));$('reset').addEventListener('click',()=>{[10000,200,30,7,1].forEach((v,i)=>$(ids[i]).value=v);update()});$('theme').addEventListener('click',()=>{document.documentElement.dataset.theme=document.documentElement.dataset.theme==='dark'?'light':'dark'});update();
})();
