#!/usr/bin/env node
/*
 * Genera /calendario-financiero/index.html a partir de /assets/calendario/AAAA-MM.json
 *
 * Actualización mensual (cada día 25, con los datos verificados de Datos Quijote):
 *   1. Copiar el JSON del mes siguiente en assets/calendario/AAAA-MM.json (mismo formato).
 *   2. Ejecutar: node scripts/build-calendario.js AAAA-MM [AAAA-MM-DD de actualización]
 *   3. Actualizar <lastmod> de /calendario-financiero/ en sitemap.xml y hacer commit.
 * Campos: fecha, hora (Madrid, "" si no hay), categoria, titulo, descripcion,
 *         fuente_url, verificado, por_que_importa.
 * Eventos con verificado:false se muestran como "Pendiente de confirmar" y no
 * entran en el schema Event.
 */
'use strict';
var fs = require('fs'), path = require('path');
var ym = process.argv[2];
if (!/^\d{4}-\d{2}$/.test(ym || '')) { console.error('Uso: node scripts/build-calendario.js AAAA-MM [AAAA-MM-DD]'); process.exit(1); }
var updated = process.argv[3] || new Date().toISOString().slice(0, 10);
var root = path.join(__dirname, '..');
var events = JSON.parse(fs.readFileSync(path.join(root, 'assets/calendario', ym + '.json'), 'utf8'));
events.sort(function (a, b) { return (a.fecha + (a.hora || '00:00')).localeCompare(b.fecha + (b.hora || '00:00')); });

var MESES = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];
var DIAS = ['domingo','lunes','martes','miércoles','jueves','viernes','sábado'];
var y = +ym.slice(0, 4), m = +ym.slice(5, 7), mes = MESES[m - 1];
var URL = 'https://quijotefinanzas.com/calendario-financiero/';
function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
function slug(s) { return s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-'); }
// Desfase de Madrid: CET +01:00 / CEST +02:00 (último domingo de marzo a último domingo de octubre)
function lastSunday(yy, mm) { var d = new Date(Date.UTC(yy, mm, 0)); return d.getUTCDate() - d.getUTCDay(); }
function offset(f) {
  var yy = +f.slice(0, 4), mm = +f.slice(5, 7), dd = +f.slice(8, 10);
  if (mm > 3 && mm < 10) return '+02:00';
  if (mm === 3) return dd >= lastSunday(yy, 3) ? '+02:00' : '+01:00';
  if (mm === 10) return dd < lastSunday(yy, 10) ? '+02:00' : '+01:00';
  return '+01:00';
}
function fechaLarga(f) { var d = new Date(f + 'T12:00:00Z'); return DIAS[d.getUTCDay()] + ' ' + d.getUTCDate() + ' de ' + MESES[d.getUTCMonth()]; }
function semana(f) { var dd = +f.slice(8, 10); var first = new Date(Date.UTC(y, m - 1, 1)).getUTCDay(); var off = (first + 6) % 7; return Math.floor((dd - 1 + off) / 7) + 1; }

var cats = []; events.forEach(function (e) { if (cats.indexOf(e.categoria) < 0) cats.push(e.categoria); });

// Lista estática agrupada por semana
var html = '', curW = 0;
events.forEach(function (e) {
  var w = semana(e.fecha);
  if (w !== curW) { if (curW) html += '</ol></section>\n'; curW = w; html += '<section class="cal-week" aria-labelledby="sem-' + w + '"><h2 id="sem-' + w + '">Semana ' + w + '</h2><ol class="cal-list">\n'; }
  html += '<li class="cal-ev" data-cat="' + esc(slug(e.categoria)) + '">' +
    '<div class="cal-when"><time datetime="' + e.fecha + (e.hora ? 'T' + e.hora + offset(e.fecha) : '') + '">' + esc(fechaLarga(e.fecha)) + '</time>' +
    '<span class="cal-hour">' + (e.hora ? esc(e.hora) + ' h (Madrid)' : 'Todo el día') + '</span></div>' +
    '<div class="cal-body"><div class="cal-tags"><span class="cal-cat">' + esc(e.categoria) + '</span>' + (e.verificado ? '' : '<span class="cal-pending">Pendiente de confirmar</span>') + '</div>' +
    '<h3>' + esc(e.titulo) + '</h3><p>' + esc(e.descripcion) + '</p>' +
    '<p class="cal-why"><strong>Por qué importa:</strong> ' + esc(e.por_que_importa) + '</p>' +
    '<a class="cal-src" href="' + esc(e.fuente_url) + '" target="_blank" rel="noopener noreferrer">Fuente oficial</a></div></li>\n';
});
if (curW) html += '</ol></section>\n';

var filters = '<button type="button" class="cal-f" data-f="all" aria-pressed="true">Todos</button>' +
  cats.map(function (c) { return '<button type="button" class="cal-f" data-f="' + esc(slug(c)) + '" aria-pressed="false">' + esc(c) + '</button>'; }).join('');

var title = 'Calendario financiero ' + mes + ' ' + y + ': IPC, BCE, Euríbor y fechas fiscales';
var desc = 'Fechas clave de ' + mes + ' de ' + y + ' en España: IPC del INE, reuniones del BCE, Euríbor oficial, plazos de la Agencia Tributaria y resultados empresariales, con hora de Madrid y fuente oficial.';

var graph = events.filter(function (e) { return e.verificado; }).map(function (e) {
  var o = { '@type': 'Event', name: e.titulo,
    startDate: e.fecha + (e.hora ? 'T' + e.hora + ':00' + offset(e.fecha) : ''),
    eventAttendanceMode: 'https://schema.org/OnlineEventAttendanceMode', eventStatus: 'https://schema.org/EventScheduled',
    location: { '@type': 'VirtualLocation', url: e.fuente_url },
    description: e.descripcion + ' ' + e.por_que_importa };
  return o;
});
graph.push({ '@type': 'WebPage', name: title, url: URL, description: desc, inLanguage: 'es-ES', dateModified: updated,
  isPartOf: { '@type': 'WebSite', name: 'Don Quijote de las Finanzas', url: 'https://quijotefinanzas.com/' } });
graph.push({ '@type': 'BreadcrumbList', itemListElement: [
  { '@type': 'ListItem', position: 1, name: 'Inicio', item: 'https://quijotefinanzas.com/' },
  { '@type': 'ListItem', position: 2, name: 'Calendario financiero', item: URL }] });
var jsonld = JSON.stringify({ '@context': 'https://schema.org', '@graph': graph }).replace(/</g, '\\u003c');
var upd = new Date(updated + 'T12:00:00Z'); var updTxt = upd.getUTCDate() + ' de ' + MESES[upd.getUTCMonth()] + ' de ' + upd.getUTCFullYear();

var tpl = fs.readFileSync(path.join(__dirname, 'calendario-template.html'), 'utf8');
var out = tpl.replace(/\{\{TITLE\}\}/g, esc(title)).replace(/\{\{DESC\}\}/g, esc(desc))
  .replace(/\{\{MES\}\}/g, mes).replace(/\{\{ANIO\}\}/g, String(y))
  .replace('{{JSONLD}}', function () { return jsonld; }).replace('{{FILTERS}}', function () { return filters; })
  .replace('{{EVENTS}}', function () { return html; }).replace(/\{\{UPDATED_ISO\}\}/g, updated).replace(/\{\{UPDATED\}\}/g, updTxt)
  .replace(/\{\{N\}\}/g, String(events.length));
fs.writeFileSync(path.join(root, 'calendario-financiero/index.html'), out);
console.log('OK: calendario-financiero/index.html (' + events.length + ' eventos, ' + (graph.length - 2) + ' en schema Event)');
