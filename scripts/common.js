export const APP_URL = process.env.APP_URL ?? "http://localhost:3000";
export const PROM_URL = process.env.PROM_URL ?? "http://localhost:9090";

export const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export async function waitForUrl(url, { attempts = 40, delayMs = 250 } = {}) {
  let lastError;

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      const response = await fetch(url);
      if (response.ok) {
        return response;
      }
      lastError = new Error(`${url} respondió HTTP ${response.status}`);
    } catch (error) {
      lastError = error;
    }

    await sleep(delayMs);
  }

  throw new Error(`No fue posible acceder a ${url}: ${lastError?.message ?? "sin respuesta"}`);
}

export async function waitForApplication() {
  await waitForUrl(`${APP_URL}/health`);
}

export async function getMetricsText() {
  const response = await fetch(`${APP_URL}/metrics`);
  if (!response.ok) {
    throw new Error(`/metrics respondió HTTP ${response.status}`);
  }
  return response.text();
}

function unescapeLabelValue(value) {
  return value
    .replace(/\\n/g, "\n")
    .replace(/\\\"/g, '"')
    .replace(/\\\\/g, "\\");
}

function parseLabels(source = "") {
  const labels = {};
  const pattern = /([a-zA-Z_][a-zA-Z0-9_]*)="((?:\\.|[^"\\])*)"/g;
  let match;

  while ((match = pattern.exec(source)) !== null) {
    labels[match[1]] = unescapeLabelValue(match[2]);
  }

  return labels;
}

export function parseSamples(text) {
  const samples = [];

  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;

    const match = line.match(
      /^([a-zA-Z_:][a-zA-Z0-9_:]*)(?:\{(.*)\})?\s+([^\s]+)(?:\s+\d+)?$/
    );

    if (!match) continue;

    samples.push({
      name: match[1],
      labels: parseLabels(match[2]),
      value: Number(match[3]),
      raw: line
    });
  }

  return samples;
}

export function matchesLabels(sample, expected) {
  return Object.entries(expected).every(
    ([key, value]) => sample.labels[key] === value
  );
}

export function findSample(samples, name, labels = {}) {
  return samples.find(
    (sample) => sample.name === name && matchesLabels(sample, labels)
  );
}

export function findSamples(samples, name) {
  return samples.filter((sample) => sample.name === name);
}

export async function getPrometheusTargets() {
  const response = await fetch(`${PROM_URL}/api/v1/targets`);
  if (!response.ok) {
    throw new Error(`Prometheus targets respondió HTTP ${response.status}`);
  }

  const body = await response.json();
  if (body.status !== "success") {
    throw new Error("Prometheus no devolvió una respuesta exitosa para /api/v1/targets");
  }

  return body.data.activeTargets ?? [];
}

export async function queryPrometheus(query) {
  const url = `${PROM_URL}/api/v1/query?query=${encodeURIComponent(query)}`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Prometheus query respondió HTTP ${response.status}`);
  }

  const body = await response.json();
  if (body.status !== "success") {
    throw new Error(`Consulta Prometheus falló: ${JSON.stringify(body)}`);
  }

  return body.data.result ?? [];
}

export async function waitForPrometheusSeries(query, predicate, {
  attempts = 8,
  delayMs = 1000
} = {}) {
  let last = [];

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      last = await queryPrometheus(query);
      if (predicate(last)) {
        return last;
      }
    } catch {
      // Prometheus puede estar iniciando o aún no haber realizado un scrape.
    }
    await sleep(delayMs);
  }

  return last;
}

export function printCheck(ok, message) {
  console.log(`${ok ? "✓" : "✗"} ${message}`);
  return ok;
}
