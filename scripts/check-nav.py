#!/usr/bin/env python3
"""Comprueba que el menú principal tiene el mismo orden en todas las páginas."""
import re,sys,glob
ORDER=['Sobre el proyecto','Calculadoras','QuijoCuentas','QuijoLista','QuijoCartera','Recursos','Calendario','Colaboraciones','QuijoTeca','QuijoGlosario','Referidos']
bad=0
for f in sorted(set(glob.glob('**/*.html',recursive=True))):
    s=open(f,encoding='utf8').read()
    m=re.search(r'<nav id="main-nav".*?</nav>',s,re.S)
    if not m: continue
    got=[re.sub('<[^>]+>','',x).strip() for x in re.findall(r'class="nav-btn[^"]*"[^>]*>(.*?)</(?:a|button)>',m.group(0),re.S)]
    if got!=ORDER: bad+=1; print('ORDEN DISTINTO:',f,got)
print('OK' if not bad else f'{bad} páginas con orden distinto'); sys.exit(1 if bad else 0)
