#!/usr/bin/env python3
"""Genera /glosario/ y /glosario/<slug>/ a partir de scripts/glosario_data.py.
Los términos sin página se leen del QuijoGlosario de index.html.
Uso: python3 scripts/build-glosario.py"""
import json, os, re, html, unicodedata, sys
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(ROOT, 'scripts'))
from glosario_data import TERMS
BASE = 'https://quijotefinanzas.com'
UPDATED = '2026-10-30'
E = lambda t: html.escape(t, quote=True)
BY = {t['slug']: t for t in TERMS}
H1 = {'tae':'la TAE (Tasa Anual Equivalente)','tin':'el TIN (Tipo de Interés Nominal)','euribor':'el Euríbor','interes-compuesto':'el interés compuesto','fondo-indexado':'un fondo indexado','etf':'un ETF (fondo cotizado)','irpf':'el IRPF','inflacion':'la inflación','fondo-garantia-depositos':'el Fondo de Garantía de Depósitos (FGD)','deposito-plazo-fijo':'un depósito a plazo fijo'}
# alias de títulos de la portada -> slug con página
HOME_ALIAS = {'TAE (Tasa Anual Equivalente)':'tae','TIN (Tasa Interés Nominal)':'tin','Euribor':'euribor','Interés compuesto':'interes-compuesto','Fondo indexado':'fondo-indexado','ETF':'etf','Inflación':'inflacion'}

def norm(s):
    return ''.join(c for c in unicodedata.normalize('NFD', s) if unicodedata.category(c) != 'Mn').upper()

HEAD = open(os.path.join(ROOT, 'scripts', 'glosario-shell-head.html'), encoding='utf8').read()
TOP = open(os.path.join(ROOT, 'scripts', 'glosario-shell-top.html'), encoding='utf8').read()
FOOT = open(os.path.join(ROOT, 'scripts', 'glosario-shell-foot.html'), encoding='utf8').read()

def page(title, desc, url, ld, body, source):
    h = HEAD.replace('{{TITLE}}', E(title)).replace('{{DESC}}', E(desc)).replace('{{URL}}', url)
    return (h + '<script type="application/ld+json">' + json.dumps(ld, ensure_ascii=False).replace('</', '<\\/') + '</script>\n</head>\n<body>\n'
            + TOP + '\n<main>\n' + body + '\n</main>\n' + FOOT.replace('{{SOURCE}}', source))

CTA = '''<section class="cta" aria-labelledby="cta-t"><h2 id="cta-t">Aprende un concepto nuevo cada semana</h2><p>Suscríbete a la newsletter: explicaciones claras, novedades de cuentas y calculadoras. Sin spam.</p>
<form class="nl" id="newsletter-form" action="https://app.kit.com/forms/9947108/subscriptions" method="post" target="newsletter-submit-frame"><input type="email" name="email_address" placeholder="tu@email.com" required autocomplete="email" aria-label="Correo electrónico"><button type="submit">Suscribirme</button><span class="nl-msg" id="nl-msg" role="status" aria-live="polite"></span></form>
<iframe name="newsletter-submit-frame" title="Envío de suscripción" style="display:none"></iframe></section>'''

def crumbs(items):
    return {"@type":"BreadcrumbList","itemListElement":[{"@type":"ListItem","position":i+1,"name":n,"item":BASE+u} for i,(n,u) in enumerate(items)]}

def term_page(t):
    url = f'{BASE}/glosario/{t["slug"]}/'
    faq = ''.join(f'<details class="faq"><summary>{E(q)}</summary><p>{E(a)}</p></details>' for q,a in t['faq'])
    how = ''.join(f'<li>{E(x)}</li>' for x in t['how'])
    ex = ''.join(f'<p>{E(x)}</p>' for x in t['example'])
    calcs = ''.join(f'<a href="{u}">{E(n)}</a>' for u,n in t['calcs'])
    rel = ''.join(f'<a href="/glosario/{s}/">{E(BY[s]["name"])}</a>' for s in t['related'])
    src = ''
    if t['sources']:
        src = '<p class="notice">Fuentes oficiales: ' + ' · '.join(f'<a href="{u}" target="_blank" rel="noopener noreferrer">{E(n)}</a>' for n,u in t['sources']) + '.</p>'
    body = f'''<nav class="crumbs" aria-label="Migas de pan"><a href="/">Inicio</a> › <a href="/glosario/">Glosario</a> › {E(t["name"])}</nav>
<div class="section-kicker">QuijoGlosario</div>
<h1>Qué es {E(H1[t["slug"]])}</h1>
<p class="lead def">{E(t["definition"])}</p>
<div class="divider"></div>
<article class="term">
<h2>Cómo funciona</h2><ul>{how}</ul>
<section class="example" aria-labelledby="ej-t"><h2 id="ej-t">Ejemplo ilustrativo</h2>{ex}<p class="ex-note">Cifras inventadas para explicar el concepto; no son una oferta ni una previsión.</p></section>
<h2>Calcúlalo con tus números</h2><div class="related">{calcs}</div>
<h2>Preguntas frecuentes</h2>{faq}
<h2>Términos relacionados</h2><div class="related">{rel}<a href="/glosario/">Ver glosario completo</a></div>
{src}
<p class="notice">Contenido educativo y general. No es asesoramiento financiero ni fiscal personalizado. Revisado el <time datetime="{UPDATED}">30 de octubre de 2026</time>.</p>
</article>
{CTA}'''
    ld = {"@context":"https://schema.org","@graph":[
        {"@type":"DefinedTerm","@id":url+'#term',"name":t['full'],"description":t['definition'],"url":url,
         "inDefinedTermSet":{"@type":"DefinedTermSet","@id":BASE+'/glosario/#set',"name":"QuijoGlosario","url":BASE+'/glosario/'}},
        {"@type":"FAQPage","mainEntity":[{"@type":"Question","name":q,"acceptedAnswer":{"@type":"Answer","text":a}} for q,a in t['faq']]},
        crumbs([("Inicio","/"),("Glosario","/glosario/"),(t['name'],f'/glosario/{t["slug"]}/')])]}
    return page(t['title'], t['desc'], url, ld, body, 'glosario_'+t['slug'].replace('-','_'))

def index_page():
    s = open(os.path.join(ROOT,'index.html'),encoding='utf8').read()
    home = re.findall(r'\{ badge:"QuijoGlosario", title:"([^"]+)", desc:"([^"]+)"', s)
    entries = {}
    for t in TERMS: entries[t['slug']] = (t['full'], t['definition'].split('. ')[0].rstrip('.')+'.', f'/glosario/{t["slug"]}/')
    for title, desc in home:
        if title in HOME_ALIAS: continue
        entries['h:'+title] = (title, desc, None)
    items = sorted(entries.values(), key=lambda e: norm(e[0]))
    letters = {}
    for e in items: letters.setdefault(norm(e[0])[0], []).append(e)
    nav = ''.join(f'<a href="#l-{l}">{l}</a>' for l in letters)
    blocks = ''
    for l, es in letters.items():
        li = ''
        for n,d,u in es:
            name = f'<a href="{u}">{E(n)}</a>' if u else E(n)
            li += f'<li class="g-item{" has-page" if u else ""}"><h3>{name}</h3><p>{E(d)}</p></li>'
        blocks += f'<section class="g-letter" id="l-{l}" aria-labelledby="h-{l}"><h2 id="h-{l}">{l}</h2><ul>{li}</ul></section>'
    url = BASE + '/glosario/'
    body = f'''<nav class="crumbs" aria-label="Migas de pan"><a href="/">Inicio</a> › Glosario</nav>
<div class="section-kicker">QuijoGlosario</div>
<h1>Glosario de finanzas personales</h1>
<p class="lead">{len(items)} términos de ahorro, inversión, hipotecas e impuestos explicados de forma sencilla. Los términos con enlace tienen página propia con ejemplo y preguntas frecuentes.</p>
<div class="divider"></div>
<nav class="az" aria-label="Índice alfabético">{nav}</nav>
{blocks}
<p class="notice">Contenido educativo y general. No es asesoramiento financiero ni fiscal personalizado.</p>
{CTA}'''
    ld = {"@context":"https://schema.org","@graph":[
        {"@type":"DefinedTermSet","@id":url+'#set',"name":"QuijoGlosario","url":url,"description":"Glosario de finanzas personales de Don Quijote de las Finanzas.",
         "hasDefinedTerm":[{"@type":"DefinedTerm","name":n,"description":d,**({"url":BASE+u} if u else {})} for n,d,u in items]},
        crumbs([("Inicio","/"),("Glosario","/glosario/")])]}
    return page('Glosario de finanzas personales: términos clave',
                'Glosario de finanzas personales en español: TAE, TIN, Euríbor, IRPF, fondos indexados, ETF, inflación y más, explicados con ejemplos sencillos.',
                url, ld, body, 'glosario_indice')

os.makedirs(os.path.join(ROOT,'glosario'), exist_ok=True)
open(os.path.join(ROOT,'glosario','index.html'),'w',encoding='utf8').write(index_page())
for t in TERMS:
    assert len(t['title']) < 60, t['title']; assert len(t['desc']) < 155, (t['slug'], len(t['desc']))
    d = os.path.join(ROOT,'glosario',t['slug']); os.makedirs(d, exist_ok=True)
    open(os.path.join(d,'index.html'),'w',encoding='utf8').write(term_page(t))
print('ok', len(TERMS))
