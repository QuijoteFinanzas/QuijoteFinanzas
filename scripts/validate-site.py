#!/usr/bin/env python3
"""Validacion estatica de quijotefinanzas.com.

Pensado para ejecutarse localmente y en GitHub Actions sin dependencias externas.
- ERROR => exit 1 y bloquea el check del PR.
- WARNING => informa, pero no bloquea.
"""
from __future__ import annotations

import json
import re
import sys
from collections import Counter
from datetime import date
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urlsplit, unquote
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parents[1]
DOMAIN = "quijotefinanzas.com"
ERRORS: list[str] = []
WARNINGS: list[str] = []


def err(msg: str) -> None:
    ERRORS.append(msg)


def warn(msg: str) -> None:
    WARNINGS.append(msg)


def rel(path: Path) -> str:
    return path.relative_to(ROOT).as_posix()


class RefParser(HTMLParser):
    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self.refs: list[tuple[str, str]] = []
        self.in_jsonld = False
        self.jsonld_parts: list[str] = []
        self.jsonld_blocks: list[str] = []
        self.noindex = False

    def handle_starttag(self, tag: str, attrs):
        a = {k.lower(): (v or "") for k, v in attrs}
        if tag == "a" and a.get("href"):
            self.refs.append(("href", a["href"]))
        elif tag in {"img", "script", "iframe", "source", "video", "audio"} and a.get("src"):
            self.refs.append(("src", a["src"]))
        elif tag == "link" and a.get("href"):
            self.refs.append(("href", a["href"]))
        if tag == "meta" and a.get("name", "").lower() == "robots" and "noindex" in a.get("content", "").lower():
            self.noindex = True
        if tag == "script" and a.get("type", "").lower() == "application/ld+json":
            self.in_jsonld = True
            self.jsonld_parts = []

    def handle_endtag(self, tag: str):
        if tag == "script" and self.in_jsonld:
            self.jsonld_blocks.append("".join(self.jsonld_parts).strip())
            self.in_jsonld = False
            self.jsonld_parts = []

    def handle_data(self, data: str):
        if self.in_jsonld:
            self.jsonld_parts.append(data)


def target_for_ref(current: Path, raw: str) -> Path | None:
    raw = raw.strip()
    if not raw or raw.startswith(("#", "mailto:", "tel:", "javascript:", "data:")):
        return None
    if "{{" in raw or "}}" in raw:
        return None
    parts = urlsplit(raw)
    if parts.scheme in {"http", "https"}:
        host = (parts.hostname or "").lower()
        if host not in {DOMAIN, "www." + DOMAIN}:
            return None
        path = parts.path or "/"
    elif parts.scheme or parts.netloc:
        return None
    else:
        path = parts.path
    if not path:
        return None
    path = unquote(path)
    if path.startswith("/"):
        candidate = ROOT / path.lstrip("/")
    else:
        candidate = current.parent / path
    # Normaliza rutas web de directorio.
    if path.endswith("/"):
        candidate = candidate / "index.html"
    elif candidate.is_dir():
        candidate = candidate / "index.html"
    # /?foo => raíz.
    if path == "/":
        candidate = ROOT / "index.html"
    return candidate.resolve()


def check_html() -> dict[Path, RefParser]:
    parsed: dict[Path, RefParser] = {}
    for path in sorted(ROOT.rglob("*.html")):
        # Las plantillas contienen placeholders deliberados.
        if "scripts" in path.parts:
            continue
        try:
            text = path.read_text(encoding="utf-8")
        except UnicodeDecodeError:
            err(f"HTML no UTF-8: {rel(path)}")
            continue
        parser = RefParser()
        try:
            parser.feed(text)
        except Exception as exc:
            err(f"HTML no parseable {rel(path)}: {exc}")
            continue
        parsed[path] = parser
        for block in parser.jsonld_blocks:
            if not block:
                err(f"JSON-LD vacío: {rel(path)}")
                continue
            try:
                json.loads(block)
            except json.JSONDecodeError as exc:
                err(f"JSON-LD inválido en {rel(path)}: línea {exc.lineno}, col {exc.colno}: {exc.msg}")
        for kind, raw in parser.refs:
            target = target_for_ref(path, raw)
            if target is None:
                continue
            # Seguridad: solo validar rutas que resuelven dentro del repo.
            try:
                target.relative_to(ROOT.resolve())
            except ValueError:
                continue
            if not target.exists():
                err(f"Referencia interna rota en {rel(path)} ({kind}={raw!r}) -> {target.relative_to(ROOT).as_posix()}")
    return parsed


def sitemap_target(url: str) -> Path | None:
    p = urlsplit(url)
    if (p.hostname or "").lower() not in {DOMAIN, "www." + DOMAIN}:
        return None
    webpath = unquote(p.path or "/")
    if webpath == "/":
        return ROOT / "index.html"
    candidate = ROOT / webpath.lstrip("/")
    if webpath.endswith("/"):
        candidate /= "index.html"
    return candidate


def check_sitemap(parsed_html: dict[Path, RefParser]) -> None:
    sm = ROOT / "sitemap.xml"
    if not sm.exists():
        err("Falta sitemap.xml")
        return
    try:
        tree = ET.parse(sm)
    except ET.ParseError as exc:
        err(f"sitemap.xml inválido: {exc}")
        return
    ns = {"sm": "http://www.sitemaps.org/schemas/sitemap/0.9"}
    seen: set[str] = set()
    for loc in tree.findall(".//sm:loc", ns):
        url = (loc.text or "").strip()
        if not url:
            err("<loc> vacío en sitemap.xml")
            continue
        if url in seen:
            err(f"URL duplicada en sitemap: {url}")
        seen.add(url)
        target = sitemap_target(url)
        if target is None:
            warn(f"Sitemap contiene dominio externo: {url}")
            continue
        if not target.exists():
            err(f"Sitemap apunta a una ruta inexistente: {url} -> {rel(target)}")
            continue
        parser = parsed_html.get(target.resolve()) or parsed_html.get(target)
        if parser and parser.noindex:
            err(f"Sitemap incluye una página noindex: {url}")


def isin_valid(isin: str) -> bool:
    if not re.fullmatch(r"[A-Z]{2}[A-Z0-9]{9}[0-9]", isin):
        return False
    expanded = "".join(str(ord(c) - 55) if c.isalpha() else c for c in isin)
    digits = [int(c) for c in expanded]
    total = 0
    parity = len(digits) % 2
    for i, d in enumerate(digits):
        x = d * 2 if i % 2 == parity else d
        total += x // 10 + x % 10
    return total % 10 == 0


def quijolista_block(text: str) -> str:
    m = re.search(r"var\s+quijolistaItems\s*=\s*\[(.*?)\n\s*\];", text, re.S)
    if not m:
        err("No se ha encontrado quijolistaItems en index.html")
        return ""
    return m.group(1)


def check_quijolista() -> None:
    idx = ROOT / "index.html"
    text = idx.read_text(encoding="utf-8")
    block = quijolista_block(text)
    if not block:
        return
    objects = re.findall(r"\{[^\n]*\}", block)
    if not objects:
        err("QuijoLista no contiene fichas")
        return
    isins: list[str] = []
    missing_cost = []
    for obj in objects:
        name_m = re.search(r'nombre:"([^"]+)"', obj)
        name = name_m.group(1) if name_m else "(sin nombre)"
        isin_m = re.search(r'isin:"([^"]+)"', obj)
        if isin_m:
            isin = isin_m.group(1)
            if re.fullmatch(r"[A-Z]{2}[A-Z0-9]{10}", isin):
                isins.append(isin)
                if not isin_valid(isin):
                    err(f"ISIN con checksum/formato inválido en QuijoLista: {isin} ({name})")
        tipo_m = re.search(r'tipo:"([^"]+)"', obj)
        tipo = tipo_m.group(1) if tipo_m else ""
        if tipo in {"Fondo", "ETF", "ETC"} and isin_m and re.fullmatch(r"[A-Z]{2}[A-Z0-9]{10}", isin_m.group(1)):
            if 'coste:null' in obj or 'costeFuente:null' in obj:
                missing_cost.append(f"{name} [{isin_m.group(1)}]")
        if "Pendiente de verificar" in obj or "pendiente de verificar" in obj:
            warn(f"QuijoLista contiene un pendiente explícito: {name}")
    dup = [x for x, n in Counter(isins).items() if n > 1]
    for isin in dup:
        err(f"ISIN duplicado en QuijoLista: {isin}")
    for item in missing_cost:
        warn(f"QuijoLista sin coste/fuente confirmado: {item}")


def check_quijocuentas() -> None:
    path = ROOT / "assets" / "quijocuentas-data.js"
    if not path.exists():
        err("Falta assets/quijocuentas-data.js")
        return
    text = path.read_text(encoding="utf-8")
    m = re.search(r"window\.QF_CUENTAS_DATA\s*=\s*\[(.*?)\n\];", text, re.S)
    if not m:
        err("No se encuentra QF_CUENTAS_DATA")
        return
    block = m.group(1)
    objects = re.findall(r"\{[^\n]*\}", block)
    ids: list[str] = []
    for obj in objects:
        label_m = re.search(r'banco:"([^"]+)"', obj)
        label = label_m.group(1) if label_m else "oferta"
        id_m = re.search(r'promoId:"([^"]+)"', obj)
        if id_m:
            ids.append(id_m.group(1))
        exp_m = re.search(r'expiresOn:"([^"]+)"', obj)
        if exp_m:
            exp = exp_m.group(1)
            try:
                date.fromisoformat(exp)
            except ValueError:
                err(f"expiresOn inválido en QuijoCuentas: {label}: {exp}")
        else:
            # Solo avisa cuando el texto parece indicar de forma clara un fin de contratación.
            if re.search(r"(?:hasta|fin de oferta|altas?)[^\"}]{0,60}\b\d{1,2}/\d{1,2}/20\d{2}\b", obj, re.I):
                warn(f"QuijoCuentas parece tener fecha fin pero no expiresOn: {label}")
    for pid, n in Counter(ids).items():
        if n > 1:
            err(f"promoId duplicado en QuijoCuentas: {pid}")


def check_calendar_removed() -> None:
    forbidden = ("build-calendario", "assets/calendario/", "/calendario-financiero/")
    for path in ROOT.rglob("*"):
        if not path.is_file() or path.suffix.lower() not in {".html", ".js", ".py", ".json", ".xml"}:
            continue
        if path.resolve() == Path(__file__).resolve() or rel(path) == "calendario-financiero/index.html":
            continue
        try:
            text = path.read_text(encoding="utf-8")
        except UnicodeDecodeError:
            continue
        for token in forbidden:
            if token in text:
                err(f"Referencia residual al calendario ({token}) en {rel(path)}")


def main() -> int:
    parsed = check_html()
    check_sitemap(parsed)
    check_quijolista()
    check_quijocuentas()
    check_calendar_removed()

    print("\n=== Validación QuijoteFinanzas ===")
    if WARNINGS:
        print(f"\nWARNINGS ({len(WARNINGS)}):")
        for x in WARNINGS:
            print(f"  - {x}")
    if ERRORS:
        print(f"\nERRORES ({len(ERRORS)}):")
        for x in ERRORS:
            print(f"  - {x}")
        print("\nRESULTADO: FAIL")
        return 1
    print(f"\nERRORES: 0 | WARNINGS: {len(WARNINGS)}")
    print("RESULTADO: OK")
    return 0


if __name__ == "__main__":
    sys.exit(main())
