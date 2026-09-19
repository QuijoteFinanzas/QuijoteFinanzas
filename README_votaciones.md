# Activar las votaciones globales de QuijoteFinanzas

La web está preparada para leer y guardar los votos en este Worker:

`https://votos-quijotefinanzas.donquijotedelasfinanzas.workers.dev`

Mientras ese endpoint no esté desplegado, la sección mostrará **“Votación temporalmente no disponible”** en vez de inventar ceros.

## 1. Crear la base de datos D1

En Cloudflare:

1. Ve a **Workers & Pages → D1 SQL Database**.
2. Crea una base llamada, por ejemplo, `quijotefinanzas-votos`.
3. Abre su consola SQL.
4. Copia y ejecuta el contenido de `votos-schema.sql`.

No se almacena email, nombre ni IP en la tabla. Cada navegador genera un identificador aleatorio para limitarlo a un voto.

## 2. Crear o actualizar el Worker

1. Ve a **Workers & Pages**.
2. Si ya existe `votos-quijotefinanzas`, edítalo. Si no, créalo con ese nombre para conservar la URL que ya usa el HTML.
3. Sustituye su código por el contenido de `votos-worker.js`.
4. En **Settings → Bindings**, añade una vinculación **D1 database**:
   - Variable name: `DB`
   - Database: `quijotefinanzas-votos`
5. Despliega el Worker.

## 3. Comprobar que responde

Abre en el navegador:

`https://votos-quijotefinanzas.donquijotedelasfinanzas.workers.dev`

Debe devolver JSON parecido a:

```json
{
  "counts": {
    "prestamo": {"total": 0, "recent7": 0},
    "tae-tin": {"total": 0, "recent7": 0},
    "liquidar-deuda": {"total": 0, "recent7": 0},
    "objetivo-ahorro": {"total": 0, "recent7": 0},
    "subida-neta": {"total": 0, "recent7": 0}
  },
  "totalVotes": 0
}
```

Después recarga QuijoteFinanzas. Al votar desde distintos dispositivos, todos deberían ver el mismo total acumulado y la actividad de los últimos siete días.

## 4. Si la URL del Worker cambia

En `index_fase_20_actualizacion_septiembre_auditoria.html`, busca:

```js
var VOTOS_WORKER='https://votos-quijotefinanzas.donquijotedelasfinanzas.workers.dev';
```

y sustituye únicamente esa URL.

## Notas

- `localStorage` se usa solo para recordar el voto del navegador y su ID; **los totales viven en D1**.
- El sistema limita a un voto por identificador de navegador. No pretende ser un sistema electoral antifraude: es una encuesta de priorización de producto.
- Si se borra el almacenamiento del navegador, se genera un nuevo identificador. Para este caso de uso es suficiente y evita guardar datos personales innecesarios.
