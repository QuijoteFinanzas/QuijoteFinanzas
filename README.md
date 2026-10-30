# Don Quijote de las Finanzas · quijotefinanzas.com

Web de educación financiera práctica para España: calculadoras gratuitas, comparativa de cuentas y depósitos (QuijoCuentas), glosario, recursos y plantilla QuijoExcel.

La web es **HTML estático** servido con **GitHub Pages** (dominio en `CNAME`). No hay paso de compilación, dependencias ni framework: lo que hay en la rama `main` es lo que se publica.

## Estructura

| Ruta | Qué es |
|---|---|
| `index.html` | Portada y aplicación principal. Contiene todas las secciones (QuijoCuentas, QuijoLista, glosario…) y los modales de las calculadoras (`div.calc-overlay#modal-<id>`). |
| `calculadora-*/index.html`, `comparador-ofertas-trabajo/` | Las 17 páginas SEO de calculadora (URLs canónicas). Cada una incrusta la calculadora en un iframe `/?embedCalc=<id>` servido por `index.html`. |
| `calculadoras/` | Índice de todas las calculadoras. |
| `mejores-cuentas-remuneradas.html`, `mejores-depositos/` | Landings de QuijoCuentas. |
| `calculadora-*.html` (en la raíz) | Versiones antiguas de algunas calculadoras. Se mantienen para no romper enlaces externos, pero los enlaces internos apuntan a las URLs `/calculadora-*/`. |
| `calculadoras.js` | Motor de cálculo compartido de las páginas antiguas. |
| `assets/quijocuentas-data.js` | **Fuente única** de los datos de QuijoCuentas (portada y landings). |
| `assets/quijobot.js`, `assets/quijobot-data.json`, `quijobot-data.json` | Asistente QuijoBot. |
| `assets/*.png`, `assets/teca/` | Imágenes del glosario y de QuijoTeca. |
| `sobre-el-proyecto.html`, `aviso-legal.html`, `privacidad.html`, `cookies.html` | Páginas institucionales y legales. |
| `gracias-*.html` | Páginas de confirmación de formularios (newsletter y QuijoExcel). |
| `404.html` | Página de error que GitHub Pages sirve para rutas inexistentes. |
| `sitemap.xml`, `robots.txt` | SEO. El sitemap solo lista URLs canónicas. |
| `votos-worker.txt`, `votos-schema.sql`, `README_votaciones.md` | Worker de Cloudflare para las votaciones (se despliega aparte; ver su README). |

### Modo embed

Las páginas `calculadora-*/` cargan `index.html?embedCalc=<id>`. En ese modo un script del `<head>` añade la clase `qf-embed-root` (que oculta todo salvo el modal) y cambia la meta `robots` a `noindex,follow`. Como `index.html` es compartido por la portada y los iframes, no puede llevar un `noindex` estático y GitHub Pages no permite cabeceras `X-Robots-Tag`; el `canonical` estático de la portada evita además duplicados.

## Probar en local

Hace falta un servidor estático (abrir los archivos con `file://` rompe los iframes y las rutas absolutas):

```bash
python3 -m http.server 8000
# y abrir http://localhost:8000/
```

Antes de publicar conviene revisar al menos la portada y alguna calculadora en móvil y escritorio, en tema claro y oscuro, y comprobar que la consola no muestra errores.

## Actualizar QuijoCuentas

1. Edita solo `assets/quijocuentas-data.js`; la portada y las landings leen de ahí.
2. Actualiza la fecha de la cabecera del archivo (`Actualizacion: DD/MM/AAAA`) y las fechas visibles de «Actualizado».
3. Cada producto debe comprobarse en la **web oficial de la entidad** el mismo día. Si una cifra no se puede verificar, el producto se deja comentado con el motivo.
4. Usa `expiresOn` (AAAA-MM-DD, último día válido) en las promociones con fecha de fin: desde el día siguiente se ocultan solas.
5. Actualiza `lastmod` en `sitemap.xml` para las páginas afectadas.

## Criterios editoriales

- **Fuentes oficiales**: cifras fiscales y bancarias tomadas de BOE, AEAT, Seguridad Social, Banco de España o la web oficial de cada entidad, con fecha de revisión visible.
- **No se publican cifras sin confirmar**.
- **Sin recomendaciones personalizadas**: la web es educativa e informativa; los resultados de las calculadoras son estimaciones y cada calculadora explica sus supuestos y límites.
- **Anonimato del autor**: el proyecto se firma como «Don Quijote de las Finanzas». No se incluyen datos personales del autor en la web, el código ni el historial (los commits usan la dirección `noreply` de GitHub).

## Convenciones

- Cambios pequeños y revertibles, un commit por tema y mensajes en español.
- Codificación UTF-8, finales de línea LF (ver `.editorconfig`).
- Accesibilidad: cada campo de formulario con su `<label for>` o `aria-label`, contraste AA en ambos temas y foco visible.

## Licencia

© 2026 Don Quijote de las Finanzas. Todos los derechos reservados. Consulta [LICENSE](LICENSE). El repositorio es público, pero no se concede permiso para copiar, modificar ni redistribuir su contenido.
