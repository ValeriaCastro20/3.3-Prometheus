import {
  getMetricsText,
  parseSamples,
  findSample,
  waitForPrometheusSeries,
  waitForApplication,
  printCheck
} from "./common.js";

await waitForApplication();

let allOk = true;
const metricsText = await getMetricsText();
const samples = parseSamples(metricsText);

const get200 = findSample(samples, "orders_http_requests_total", {
  method: "GET",
  route: "/orders/:id",
  status_code: "200"
});
const get404 = findSample(samples, "orders_http_requests_total", {
  method: "GET",
  route: "/orders/:id",
  status_code: "404"
});
const gauge = findSample(samples, "orders_http_requests_in_progress", {
  route: "/orders/:id"
});
const hist200 = findSample(samples, "orders_http_request_duration_seconds_count", {
  method: "GET",
  route: "/orders/:id",
  status_code: "200"
});
const hist404 = findSample(samples, "orders_http_request_duration_seconds_count", {
  method: "GET",
  route: "/orders/:id",
  status_code: "404"
});

allOk &= printCheck(Boolean(get200), "Counter de GET /orders/:id para status_code=200");
allOk &= printCheck(Boolean(get404), "Counter de GET /orders/:id para status_code=404");
allOk &= printCheck(Boolean(gauge), "Gauge de solicitudes en progreso para route=/orders/:id");
allOk &= printCheck(Boolean(hist200 && hist200.value > 0), "Histogram con observaciones GET status_code=200");
allOk &= printCheck(Boolean(hist404 && hist404.value > 0), "Histogram con observaciones GET status_code=404");

const badRoutes = samples
  .filter((sample) => sample.labels.route)
  .map((sample) => sample.labels.route)
  .filter(
    (route) => route.startsWith("/orders/ord-") || route.startsWith("/orders/ord-missing-")
  );
allOk &= printCheck(badRoutes.length === 0, "La dimensión route no contiene IDs concretos de órdenes");

const prometheusSeries = await waitForPrometheusSeries(
  "orders_http_requests_total",
  (result) => {
    const has200 = result.some(
      (item) =>
        item.metric?.method === "GET" &&
        item.metric?.route === "/orders/:id" &&
        item.metric?.status_code === "200"
    );
    const has404 = result.some(
      (item) =>
        item.metric?.method === "GET" &&
        item.metric?.route === "/orders/:id" &&
        item.metric?.status_code === "404"
    );
    return has200 && has404;
  }
);

const stored = prometheusSeries.some(
  (item) => item.metric?.method === "GET" && item.metric?.route === "/orders/:id"
);
allOk &= printCheck(stored, "Prometheus ya almacenó series de GET /orders/:id");

console.log("");
if (allOk) {
  console.log("RESULTADO: ACTIVIDAD COMPLETA");
  process.exit(0);
}

console.log("RESULTADO: REVISAR INSTRUMENTACIÓN DE GET /orders/:id");
process.exit(1);
