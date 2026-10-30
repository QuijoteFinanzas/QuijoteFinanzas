#!/usr/bin/env python3
"""Genera el menú principal (una sola fuente) y lo inserta en todas las páginas.
Uso: python3 scripts/build-nav.py   (ejecutar también tras build-glosario.py / build-calendario.js)"""
import os,re
ROOT=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
# (clave, texto, sección de la home o None, url fuera de la home)
GROUPS=[
 ('herramientas','Herramientas',[('calculadoras','Calculadoras','calculadoras','/#calculadoras'),('quijocartera','QuijoCartera','quijocartera','/#quijocartera'),('quijoexcel','QuijoExcel',None,'/?qfopen=quijoexcel&amp;src=menu#recursos')]),
 ('comparativas','Comparativas',[('cuentas','QuijoCuentas','cuentas','/#cuentas'),('quijolista','QuijoLista','quijolista','/#quijolista')]),
 ('aprende','Aprende',[('glosario','QuijoGlosario',None,'/glosario/'),('teca','QuijoTeca','teca','/#teca'),('calendario','Calendario financiero',None,'/calendario-financiero/')]),
 ('recursos','Recursos',[('recursos','Recursos y descargas','recursos','/#recursos'),('colaboraciones','Colaboraciones',None,'/colaboraciones/'),('referidos','Referidos','referidos','/#referidos')]),
]
def item(k,t,sec,url,home,cur):
    ac=' aria-current="page"' if k==cur else ''
    if home and sec: return f'<button class="nav-btn qf-menu-link" type="button" role="menuitem" data-section="{sec}">{t}</button>'
    if home and k=='quijoexcel': return f'<button class="nav-btn qf-menu-link" type="button" role="menuitem" onclick="openExcelModal(\'menu\')">{t}</button>'
    return f'<a class="nav-btn qf-menu-link" role="menuitem" href="{url}"{ac}>{t}</a>'
def nav(home=False,cur=None):
    o=['<div class="site-nav-viewport">','      <button class="qf-menu-burger" type="button" aria-expanded="false" aria-controls="main-nav">Menú</button>','      <nav id="main-nav" class="qf-menu" aria-label="Navegación principal">','        <ul class="qf-menu-list">']
    sobre=('<button class="nav-btn qf-menu-top active" type="button" data-section="sobre">Sobre el proyecto</button>' if home else '<a class="nav-btn qf-menu-top" href="/#sobre">Sobre el proyecto</a>')
    for g,t,items in GROUPS:
        act=' active' if any(i[0]==cur for i in items) else ''
        o.append(f'          <li class="qf-menu-group"><button class="nav-btn qf-menu-top{act}" type="button" aria-expanded="false" aria-controls="qf-sub-{g}">{t}</button>')
        o.append(f'            <ul class="qf-menu-sub" id="qf-sub-{g}" role="menu">'+''.join('<li>'+item(*i,home,cur)+'</li>' for i in items)+'</ul></li>')
    o.append('          <li>'+sobre+'</li>')
    o+=['        </ul>','      </nav>','    </div>']
    return '\n'.join(o)
PAGES={'index.html':(True,None),'calendario-financiero/index.html':(False,'calendario'),'scripts/calendario-template.html':(False,'calendario'),'colaboraciones/index.html':(False,'colaboraciones'),'scripts/glosario-shell-top.html':(False,'glosario')}
for d in os.listdir(os.path.join(ROOT,'glosario')):
    if os.path.exists(os.path.join(ROOT,'glosario',d,'index.html')): PAGES[f'glosario/{d}/index.html']=(False,'glosario')
PAGES['glosario/index.html']=(False,'glosario')
RX=re.compile(r'<div class="site-nav-viewport">.*?</nav>\s*</div>',re.S)
ASSETS='<link rel="stylesheet" href="/assets/site-menu.css?v=20261030"><script src="/assets/site-menu.js?v=20261030" defer></script>'
for f,(home,cur) in PAGES.items():
    p=os.path.join(ROOT,f); s=open(p,encoding='utf8').read()
    s,n=RX.subn(lambda m:nav(home,cur),s,count=1); assert n==1,f
    if 'site-menu.css' not in s:
        if '</head>' in s: s=s.replace('</head>',ASSETS+'\n</head>',1)
        elif not f.endswith('shell-top.html'): s=ASSETS+'\n'+s
    open(p,'w',encoding='utf8').write(s)
print('nav OK en',len(PAGES),'archivos')
