import {
  APP_URL,
  getMetricsText,
  parseSamples,
  findSample,
  sleep,
  waitForApplication
} from "./common.js";

await waitForApplication();

let completed = false;
const requests = Array.from({ length: 5 }, (_, i) =>
  fetch(`${APP_URL}/orders`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      order_id: `ord-concurrent-${i + 1}`,
      scenario: "slow"
    })
  })
);

const allRequests = Promise.all(requests).finally(() => {
  completed = true;
});

let maxObserved = null;

while (!completed) {
  try {
    const samples = parseSamples(await getMetricsText());
    const gauge = findSample(
      samples,
      "orders_http_requests_in_progress",
      { route: "/orders" }
    );

    if (gauge && Number.isFinite(gauge.value)) {
      maxObserved = Math.max(maxObserved ?? gauge.value, gauge.value);
    }
  } catch {
    // La aplicación puede reiniciarse mientras se edita con node --watch.
  }

  await sleep(40);
}

await allRequests;

const finalSamples = parseSamples(await getMetricsText());
const finalGauge = findSample(
  finalSamples,
  "orders_http_requests_in_progress",
  { route: "/orders" }
);

if (maxObserved === null || !finalGauge) {
  console.log("No se encontró la serie orders_http_requests_in_progress{route=\"/orders\"}.");
  console.log("Complete primero la instrumentación guiada de POST /orders.");
  process.exit(1);
}

console.log(`Máximo observado durante concurrencia: ${maxObserved}`);
console.log(`Valor al finalizar: ${finalGauge.value}`);
