#!/usr/bin/env node
/*
 * Genera /calendario-financiero/index.html a partir de /assets/calendario/AAAA-MM.json
 * y actualiza /assets/calendario/meses.json (meses disponibles, lo usa la portada).
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
var dir = path.join(root, 'assets/calendario');
var events = JSON.parse(fs.readFileSync(path.join(dir, ym + '.json'), 'utf8'));
events.sort(function (a, b) { return (a.fecha + (a.hora || '00:00')).localeCompare(b.fecha + (b.hora || '00:00')); });

var MESES = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];
var DIAS = ['domingo','lunes','martes','miércoles','jueves','viernes','sábado'];
var y = +ym.slice(0, 4), m = +ym.slice(5, 7), mes = MESES[m - 1];
var Mes = mes.charAt(0).toUpperCase() + mes.slice(1);
var URL = 'https://quijotefinanzas.com/calendario-financiero/';
function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
function slug(s) { return s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-'); }
function p2(n) { return (n < 10 ? '0' : '') + n; }
// Desfase de Madrid: CET +01:00 / CEST +02:00
function lastSunday(yy, mm) { var d = new Date(Date.UTC(yy, mm, 0)); return d.getUTCDate() - d.getUTCDay(); }
function offset(f) {
  var yy = +f.slice(0, 4), mm = +f.slice(5, 7), dd = +f.slice(8, 10);
  if (mm > 3 && mm < 10) return '+02:00';
  if (mm === 3) return dd >= lastSunday(yy, 3) ? '+02:00' : '+01:00';
  if (mm === 10) return dd < lastSunday(yy, 10) ? '+02:00' : '+01:00';
  return '+01:00';
}
function fechaLarga(f) { var d = new Date(f + 'T12:00:00Z'); return DIAS[d.getUTCDay()] + ' ' + d.getUTCDate() + ' de ' + MESES[d.getUTCMonth()]; }

// Categorías: color fijo para las conocidas; las nuevas toman uno de reserva.
var COLORS = { 'ipc': '#c0392b', 'bce': '#2563a8', 'euribor': '#7c4dbe', 'fiscalidad': '#b7791f', 'resultados': '#2d8a5e' };
var SPARE = ['#0e7c86', '#a8437a', '#5b6b7c'];
var cats = []; events.forEach(function (e) { if (cats.indexOf(e.categoria) < 0) cats.push(e.categoria); });
var colorOf = {}, spare = 0;
cats.forEach(function (c) { colorOf[c] = COLORS[slug(c)] || SPARE[spare++ % SPARE.length]; });

var byDay = {};
events.forEach(function (e) { (byDay[e.fecha] = byDay[e.fecha] || []).push(e); });

// Rejilla del mes (semanas de lunes a domingo)
var daysIn = new Date(Date.UTC(y, m, 0)).getUTCDate();
var lead = (new Date(Date.UTC(y, m - 1, 1)).getUTCDay() + 6) % 7;
var grid = '';
for (var i = 0; i < lead; i++) grid += '<div class="cg-cell cg-empty" aria-hidden="true"></div>';
for (var d = 1; d <= daysIn; d++) {
  var f = ym + '-' + p2(d), evs = byDay[f] || [];
  var dow = (lead + d - 1) % 7;
  var cls = 'cg-cell' + (dow > 4 ? ' cg-we' : '');
  if (!evs.length) { grid += '<div class="' + cls + '" data-date="' + f + '"><span class="cg-num">' + d + '</span></div>'; continue; }
  var label = fechaLarga(f) + ': ' + evs.length + (evs.length === 1 ? ' evento' : ' eventos');
  grid += '<a class="' + cls + ' cg-has" href="#d-' + f + '" data-date="' + f + '" aria-label="' + esc(label) + '"><span class="cg-num">' + d + '</span>' +
    '<span class="cg-items">' + evs.map(function (e) {
      return '<span class="cg-ev" data-cat="' + slug(e.categoria) + '" style="--c:' + colorOf[e.categoria] + '"><span class="cg-txt">' + esc(e.titulo.split(':')[0]) + '</span></span>';
    }).join('') + '</span></a>';
}
var trail = (7 - (lead + daysIn) % 7) % 7;
for (i = 0; i < trail; i++) grid += '<div class="cg-cell cg-empty" aria-hidden="true"></div>';

// Lista cronológica por día (también sin JavaScript)
var list = Object.keys(byDay).sort().map(function (f) {
  return '<section class="cl-day" id="d-' + f + '" data-date="' + f + '"><h3>' + esc(fechaLarga(f).replace(/^./, function (c) { return c.toUpperCase(); })) + '</h3><ul>' +
    byDay[f].map(function (e) {
      return '<li class="cl-ev" data-cat="' + slug(e.categoria) + '" style="--c:' + colorOf[e.categoria] + '">' +
        '<div class="cl-meta"><span class="cl-cat">' + esc(e.categoria) + '</span>' +
        '<time datetime="' + e.fecha + (e.hora ? 'T' + e.hora + offset(e.fecha) : '') + '">' + (e.hora ? esc(e.hora) + ' h' : 'Todo el día') + '</time>' +
        (e.verificado ? '' : '<span class="cl-pending">Pendiente de confirmar</span>') + '</div>' +
        '<p class="cl-title">' + esc(e.titulo) + '</p>' +
        '<p class="cl-why">' + esc(e.por_que_importa) + '</p>' +
        '<a class="cl-src" href="' + esc(e.fuente_url) + '" target="_blank" rel="noopener noreferrer">Fuente oficial</a></li>';
    }).join('') + '</ul></section>';
}).join('\n');

var legend = '<button type="button" class="cf" data-f="all" aria-pressed="true">Todo</button>' + cats.map(function (c) {
  return '<button type="button" class="cf" data-f="' + slug(c) + '" aria-pressed="false" style="--c:' + colorOf[c] + '"><i></i>' + esc(c) + '</button>';
}).join('');

var title = 'Calendario financiero ' + mes + ' ' + y + ': IPC, BCE, Euríbor y fechas fiscales';
var desc = 'Fechas clave de ' + mes + ' de ' + y + ' en España: IPC, BCE, Euríbor, plazos de Hacienda y resultados de empresas, con hora de Madrid y fuente oficial.';

var graph = events.filter(function (e) { return e.verificado; }).map(function (e) {
  return { '@type': 'Event', name: e.titulo,
    startDate: e.fecha + (e.hora ? 'T' + e.hora + ':00' + offset(e.fecha) : ''),
    eventAttendanceMode: 'https://schema.org/OnlineEventAttendanceMode', eventStatus: 'https://schema.org/EventScheduled',
    location: { '@type': 'VirtualLocation', url: e.fuente_url },
    description: e.descripcion + ' ' + e.por_que_importa };
});
graph.push({ '@type': 'WebPage', name: title, url: URL, description: desc, inLanguage: 'es-ES', dateModified: updated,
  isPartOf: { '@type': 'WebSite', name: 'Don Quijote de las Finanzas', url: 'https://quijotefinanzas.com/' } });
graph.push({ '@type': 'BreadcrumbList', itemListElement: [
  { '@type': 'ListItem', position: 1, name: 'Inicio', item: 'https://quijotefinanzas.com/' },
  { '@type': 'ListItem', position: 2, name: 'Calendario financiero', item: URL }] });
var jsonld = JSON.stringify({ '@context': 'https://schema.org', '@graph': graph }).replace(/</g, '\\u003c');
var upd = new Date(updated + 'T12:00:00Z'); var updTxt = upd.getUTCDate() + ' de ' + MESES[upd.getUTCMonth()] + ' de ' + upd.getUTCFullYear();

var tpl = fs.readFileSync(path.join(__dirname, 'calendario-template.html'), 'utf8');
var rep = { TITLE: esc(title), DESC: esc(desc), MES: mes, MES_CAP: Mes, ANIO: String(y), YM: ym, JSONLD: jsonld, LEGEND: legend,
  GRID: grid, LIST: list, UPDATED_ISO: updated, UPDATED: updTxt, N: String(events.length) };
var out = tpl.replace(/\{\{([A-Z_]+)\}\}/g, function (all, k) { return k in rep ? rep[k] : all; });
fs.writeFileSync(path.join(root, 'calendario-financiero/index.html'), out);

var meses = fs.readdirSync(dir).filter(function (n) { return /^\d{4}-\d{2}\.json$/.test(n); }).map(function (n) { return n.slice(0, 7); }).sort();
fs.writeFileSync(path.join(dir, 'meses.json'), JSON.stringify(meses) + '\n');
console.log('OK: calendario-financiero/index.html (' + events.length + ' eventos, ' + (graph.length - 2) + ' en schema Event); meses.json: ' + meses.join(', '));
