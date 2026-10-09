# Actividad práctica: instrumentación de `GET /orders/:id`

## Objetivo

Incorporar la operación `GET /orders/:id` a las familias de métricas utilizadas por `orders-api`, conservando una cardinalidad controlada y registrando correctamente solicitudes procesadas, solicitudes activas y duración.

## Tiempo

Se dispone de aproximadamente **20 a 25 minutos** para implementar y verificar la instrumentación. Los minutos restantes se utilizarán para revisar las decisiones adoptadas.

## Estado inicial

Antes de comenzar esta actividad debe haberse completado la instrumentación guiada de `POST /orders`.

Compruébelo mediante:

```text
npm run check:guided
```

El archivo que debe modificarse es:

```text
src/orders.js
```

No modifique `src/metrics.js`, `prometheus/prometheus.yml` ni los scripts de validación.

## Tarea

Instrumente la función `getOrder()` para que la operación `GET /orders/:id` utilice las familias existentes:

```text
orders_http_requests_total
orders_http_requests_in_progress
orders_http_request_duration_seconds
```

Debe decidir qué valores utilizar para los labels definidos por cada familia. La dimensión `route` debe representar la operación HTTP de manera estable y evitar una serie diferente para cada identificador de orden.

La implementación debe registrar tanto respuestas exitosas como órdenes inexistentes.

## Generar tráfico

Ejecute:

```text
npm run activity
```

El escenario realiza doce solicitudes deterministas y produce:

```text
200: 8
404: 4
total: 12
```

## Inspeccionar la exposición

```text
npm run metrics
```

Identifique las series correspondientes a `GET` y compruebe que los códigos `200` y `404` pueden distinguirse.

## Validar

```text
npm run check:activity
```

La actividad está técnicamente completa cuando el validador muestra:

```text
RESULTADO: ACTIVIDAD COMPLETA
```

## Análisis

Al finalizar debe poder justificar:

1. el valor seleccionado para el label `route`;
2. el uso de `Counter` para solicitudes procesadas;
3. el uso de `Gauge` para solicitudes activas;
4. el uso de `Histogram` para duración;
5. las dimensiones conservadas como labels y aquellas que no se incorporaron;
6. la diferencia entre lo observado en `/metrics` y una serie almacenada por Prometheus;
7. la información temporal que se necesitará posteriormente para calcular una tasa de solicitudes.
