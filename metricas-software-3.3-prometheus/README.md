# Métricas de Software 3.3: Prometheus e instrumentación de métricas

Repositorio de apoyo para la sesión 3.3 del curso Métricas de Software. El caso utiliza `orders-api`, Node.js, Express, el cliente oficial de Prometheus para Node.js y Prometheus ejecutado mediante Docker Compose.

## Objetivo técnico

Durante la sesión se instrumenta el servicio para producir tres familias de métricas:

- `orders_http_requests_total`: `Counter` de solicitudes procesadas;
- `orders_http_requests_in_progress`: `Gauge` de solicitudes activas;
- `orders_http_request_duration_seconds`: `Histogram` de duración de solicitudes.

La demostración guiada instrumenta `POST /orders`. La actividad final aplica el mismo diseño a `GET /orders/:id`.

## Requisitos

Se requiere:

- Node.js 22 o posterior;
- Docker con Docker Compose;
- Git, únicamente para clonar o actualizar el repositorio.

No es necesario ejecutar `npm install` en el sistema anfitrión. Las dependencias de la aplicación se instalan dentro de la imagen Docker. Los scripts `npm run ...` utilizados desde la terminal dependen únicamente de Node.js.

## 1. Verificar el entorno

Desde la raíz del repositorio:

```text
npm run doctor
```

El resultado esperado es:

```text
RESULTADO: ENTORNO LISTO
```

## 2. Iniciar el entorno

```text
docker compose up --build -d
```

La aplicación queda disponible en:

```text
http://localhost:3000
```

Prometheus queda disponible en:

```text
http://localhost:9090
```

El código de `src/` está montado en el contenedor y Node.js se ejecuta en modo `--watch`. Los cambios guardados durante la clase reinician el proceso de la aplicación. Si el entorno local no refleja un cambio automáticamente, puede utilizarse:

```text
docker compose restart orders-api
```

## 3. Comprobar la aplicación

```text
http://localhost:3000/health
```

Debe responder:

```json
{"status":"ok"}
```

El endpoint de exposición es:

```text
http://localhost:3000/metrics
```

Antes de observar combinaciones concretas de labels, algunas familias pueden no mostrar series.

## 4. Parte guiada: `POST /orders`

La definición de los instrumentos está en:

```text
src/metrics.js
```

La lógica de la operación se encuentra en:

```text
src/orders.js
```

El bloque marcado como `TODO GUIADO` se completa durante la explicación del docente.

Después de instrumentar `POST /orders`, ejecutar:

```text
npm run guided
```

El escenario produce de forma determinista:

```text
201: 17
504: 3
total: 20
```

Para inspeccionar únicamente las métricas `orders_*`:

```text
npm run metrics
```

Para comprobar el gauge durante solicitudes concurrentes:

```text
npm run concurrent
```

Para validar la parte guiada:

```text
npm run check:guided
```

El resultado esperado es:

```text
RESULTADO: INSTRUMENTACIÓN GUIADA COMPLETA
```

La interfaz de Prometheus permite comprobar además que el target `orders-api` se encuentra `UP`.

## 5. Actividad práctica: `GET /orders/:id`

Las instrucciones están en [ACTIVIDAD.md](ACTIVIDAD.md).

Después de completar la instrumentación de `GET /orders/:id`:

```text
npm run activity
npm run metrics
npm run check:activity
```

El resultado esperado del validador es:

```text
RESULTADO: ACTIVIDAD COMPLETA
```

## 6. Detener el entorno

```text
docker compose down
```

## Estructura

```text
.
├── ACTIVIDAD.md
├── Dockerfile
├── README.md
├── compose.yaml
├── package.json
├── prometheus/
│   └── prometheus.yml
├── scripts/
│   ├── activity-scenario.js
│   ├── check-activity.js
│   ├── check-guided.js
│   ├── common.js
│   ├── concurrent-scenario.js
│   ├── doctor.js
│   ├── guided-scenario.js
│   └── show-metrics.js
└── src/
    ├── metrics.js
    ├── orders.js
    └── server.js
```

## Alcance

Los tiempos utilizados por los escenarios son valores didácticos deterministas. El repositorio se utiliza para estudiar instrumentación, exposición y recolección de métricas; no constituye un benchmark de Node.js, Express ni Prometheus.
