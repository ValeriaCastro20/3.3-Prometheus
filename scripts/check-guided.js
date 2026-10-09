import {
  getMetricsText,
  parseSamples,
  findSample,
  getPrometheusTargets,
  waitForPrometheusSeries,
  waitForApplication,
  printCheck
} from "./common.js";

await waitForApplication();

let allOk = true;
const metricsText = await getMetricsText();
const samples = parseSamples(metricsText);

const post201 = findSample(samples, "orders_http_requests_total", {
  method: "POST",
  route: "/orders",
  status_code: "201"
});
const post504 = findSample(samples, "orders_http_requests_total", {
  method: "POST",
  route: "/orders",
  status_code: "504"
});
const gauge = findSample(samples, "orders_http_requests_in_progress", {
  route: "/orders"
});
const hist201 = findSample(samples, "orders_http_request_duration_seconds_count", {
  method: "POST",
  route: "/orders",
  status_code: "201"
});
const hist504 = findSample(samples, "orders_http_request_duration_seconds_count", {
  method: "POST",
  route: "/orders",
  status_code: "504"
});

allOk &= printCheck(Boolean(post201), "Counter de POST /orders para status_code=201");
allOk &= printCheck(Boolean(post504), "Counter de POST /orders para status_code=504");
allOk &= printCheck(Boolean(gauge), "Gauge de solicitudes en progreso para route=/orders");
allOk &= printCheck(Boolean(hist201 && hist201.value > 0), "Histogram con observaciones de POST /orders status_code=201");
allOk &= printCheck(Boolean(hist504 && hist504.value > 0), "Histogram con observaciones de POST /orders status_code=504");

const concreteRoute = samples.some(
  (sample) => sample.labels.route && sample.labels.route.startsWith("/orders/ord-")
);
allOk &= printCheck(!concreteRoute, "No se detectaron IDs concretos dentro del label route");

let targetUp = false;
try {
  const targets = await getPrometheusTargets();
  targetUp = targets.some(
    (target) => target.labels?.job === "orders-api" && target.health === "up"
  );
} catch {
  targetUp = false;
}
allOk &= printCheck(targetUp, "Target orders-api en estado UP en Prometheus");

const prometheusSeries = await waitForPrometheusSeries(
  "orders_http_requests_total",
  (result) => {
    const has201 = result.some(
      (item) =>
        item.metric?.method === "POST" &&
        item.metric?.route === "/orders" &&
        item.metric?.status_code === "201"
    );
    const has504 = result.some(
      (item) =>
        item.metric?.method === "POST" &&
        item.metric?.route === "/orders" &&
        item.metric?.status_code === "504"
    );
    return has201 && has504;
  }
);

const stored = prometheusSeries.some(
  (item) => item.metric?.route === "/orders"
);
allOk &= printCheck(stored, "Prometheus ya almacenó series de orders_http_requests_total");

console.log("");
if (allOk) {
  console.log("RESULTADO: INSTRUMENTACIÓN GUIADA COMPLETA");
  process.exit(0);
}

console.log("RESULTADO: REVISAR INSTRUMENTACIÓN GUIADA");
process.exit(1);
