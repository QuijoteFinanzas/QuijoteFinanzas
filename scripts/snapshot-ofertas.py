#!/usr/bin/env python3
"""Foto mensual de ofertas QuijoCuentas -> assets/quijocuentas-historico.js

Uso (proceso mensual, tras revisar assets/quijocuentas-data.js):
    python3 scripts/snapshot-ofertas.py

Que hace:
  1. Lee la fecha de revision (window.QF_CUENTAS_UPDATED, dd/mm/aaaa) y las fichas
     confirmadas de assets/quijocuentas-data.js.
  2. Crea o actualiza la entrada del mes correspondiente en el historico
     (assets/quijocuentas-historico.js), sin tocar meses anteriores.
  3. Imprime un resumen para validar: fichas incluidas, altas, bajas y cambios
     de TAE respecto al mes anterior. ESE resumen hay que revisarlo antes de
     publicar: es la validacion mensual del historico.

No inventa datos: solo copia lo que este confirmado en el fichero de datos.
Sin fecha de revision valida o sin fichas, no escribe nada.
"""
from __future__ import annotations

import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / "assets" / "quijocuentas-data.js"
HIST = ROOT / "assets" / "quijocuentas-historico.js"

HEADER = (
    "/* Historico mensual de ofertas QuijoCuentas. Una entrada por mes, generada con\n"
    "   scripts/snapshot-ofertas.py a partir de las fichas confirmadas de quijocuentas-data.js.\n"
    "   Solo acumula hacia adelante: no contiene datos anteriores al primer snapshot.\n"
    "   Ultima escritura: {stamp}. */\n"
)


def load_data() -> tuple[str, list[dict]]:
    text = DATA.read_text(encoding="utf8")
    m = re.search(r'window\.QF_CUENTAS_UPDATED\s*=\s*"(\d{2}/\d{2}/\d{4})"', text)
    if not m:
        sys.exit("ERROR: no encuentro QF_CUENTAS_UPDATED en el fichero de datos")
    start = text.index("window.QF_CUENTAS_DATA = [")
    start = text.index("[", start)
    end = text.index("\n];", start) + 2
    items = json.loads(text[start:end])
    return m.group(1), items


def load_hist() -> dict:
    if not HIST.exists():
        return {"meses": []}
    text = HIST.read_text(encoding="utf8")
    start = text.index("{")
    end = text.rindex("}") + 1
    return json.loads(text[start:end])


def main() -> None:
    fecha, items = load_data()
    dia, mes, ano = fecha.split("/")
    clave = f"{ano}-{mes}"

    productos: dict[str, dict] = {}
    sin_id = 0
    for it in items:
        if it.get("status") != "confirmado":
            continue
        pid = it.get("productId")
        if not pid:
            sin_id += 1
            continue
        entry = {
            "banco": it.get("banco", ""),
            "tab": it.get("tab", ""),
            "tae": it.get("tae"),
            "verifiedAt": it.get("verifiedAt"),
        }
        for opt in ("tin", "displayRate", "limite", "duracion"):
            if it.get(opt) is not None:
                entry[opt] = it[opt]
        productos[pid] = entry

    if not productos:
        sys.exit("ERROR: ninguna ficha confirmada con productId; no escribo nada")

    hist = load_hist()
    meses = [m for m in hist["meses"] if m["mes"] != clave]
    meses.append({
        "mes": clave,
        "actualizado": fecha,
        "productos": productos,
    })
    meses.sort(key=lambda m: m["mes"])
    hist["meses"] = meses

    prev = meses[-2]["productos"] if len(meses) >= 2 else {}
    altas = sorted(set(productos) - set(prev))
    bajas = sorted(set(prev) - set(productos))
    cambios = []
    for pid in sorted(set(productos) & set(prev)):
        a, b = prev[pid].get("tae"), productos[pid].get("tae")
        if a != b:
            cambios.append(f"{pid}: {a} -> {b}")

    out = HEADER.format(stamp=fecha) + "window.QF_CUENTAS_HISTORICO = "
    out += json.dumps(hist, ensure_ascii=False, indent=2)
    out += ";\n"
    HIST.write_text(out, encoding="utf8")

    print(f"Mes {clave} ({fecha}): {len(productos)} fichas confirmadas" +
          (f" · {sin_id} sin productId (excluidas)" if sin_id else ""))
    print(f"Historico: {len(meses)} mes(es) en {HIST.relative_to(ROOT)}")
    if prev:
        print(f"Altas vs mes anterior: {len(altas)}" + (f" -> {', '.join(altas)}" if altas else ""))
        print(f"Bajas vs mes anterior: {len(bajas)}" + (f" -> {', '.join(bajas)}" if bajas else ""))
        print(f"Cambios de TAE: {len(cambios)}")
        for c in cambios:
            print("  " + c)
    else:
        print("Primera foto del historico: no hay mes anterior con el que comparar.")


if __name__ == "__main__":
    main()
