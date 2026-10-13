import { APP_URL, sleep, waitForApplication } from "./common.js";

const PHASE_SECONDS = Number(process.env.PHASE_SECONDS ?? 80);

if (!Number.isFinite(PHASE_SECONDS) || PHASE_SECONDS <= 0) {
  throw new Error("PHASE_SECONDS debe ser un número mayor que cero.");
}

const phases = [
  { id: "A", rate: 1, postScenario: () => "normal" },
  { id: "B", rate: 4, postScenario: () => "normal" },
  {
    id: "C",
    rate: 4,
    postScenario: (postIndex) =>
      postIndex % 2 === 0 ? "normal" : "payment-timeout"
  },
  { id: "D", rate: 4, postScenario: () => "slow" },
  { id: "E", rate: 1, postScenario: () => "normal" }
];

const inFlight = new Set();
const totals = new Map();
let requestSequence = 0;
let postSequence = 0;

function elapsedLabel(startedAt) {
  const elapsedSeconds = Math.floor((Date.now() - startedAt) / 1000);
  const minutes = String(Math.floor(elapsedSeconds / 60)).padStart(2, "0");
  const seconds = String(elapsedSeconds % 60).padStart(2, "0");
  return `${minutes}:${seconds}`;
}

function recordStatus(status) {
  totals.set(status, (totals.get(status) ?? 0) + 1);
}

function launchRequest(phase) {
  const sequence = requestSequence++;
  const usePost = sequence % 2 === 0;

  let promise;

  if (usePost) {
    const scenario = phase.postScenario(postSequence++);
    const orderId =
      `ord-promql-${phase.id.toLowerCase()}-${String(sequence + 1).padStart(4, "0")}`;

    promise = fetch(`${APP_URL}/orders`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ order_id: orderId, scenario })
    });
  } else {
    promise = fetch(`${APP_URL}/orders/ord-1001`);
  }

  const tracked = promise
    .then((response) => {
      recordStatus(response.status);
      return response.arrayBuffer();
    })
    .catch((error) => {
      recordStatus("transport_error");
      console.error(
        `Error de transporte en fase ${phase.id}: ${error.message}`
      );
    })
    .finally(() => {
      inFlight.delete(tracked);
    });

  inFlight.add(tracked);
}

async function runPhase(phase, startedAt) {
  const intervalMs = 1000 / phase.rate;
  const durationMs = PHASE_SECONDS * 1000;
  const phaseStartedAt = Date.now();
  const expectedRequests = Math.floor(PHASE_SECONDS * phase.rate);

  console.log(
    `Fase ${phase.id} | ${elapsedLabel(startedAt)} | ${phase.rate} req/s`
  );

  for (let index = 0; index < expectedRequests; index += 1) {
    const scheduledAt = phaseStartedAt + index * intervalMs;
    const waitMs = scheduledAt - Date.now();

    if (waitMs > 0) {
      await sleep(waitMs);
    }

    launchRequest(phase);
  }

  const remainingMs = phaseStartedAt + durationMs - Date.now();
  if (remainingMs > 0) {
    await sleep(remainingMs);
  }
}

await waitForApplication();

const startedAt = Date.now();
console.log("Escenario PromQL iniciado.");
console.log(`Duración por fase: ${PHASE_SECONDS} s`);

for (const phase of phases) {
  await runPhase(phase, startedAt);
}

await Promise.allSettled([...inFlight]);

console.log(`Escenario completado | ${elapsedLabel(startedAt)}`);

const completed = [...totals.entries()]
  .filter(([status]) => status !== "transport_error")
  .reduce((sum, [, count]) => sum + count, 0);

console.log(`Solicitudes HTTP completadas: ${completed}`);

for (const [status, count] of [...totals.entries()].sort(([a], [b]) =>
  String(a).localeCompare(String(b))
)) {
  console.log(`${status}: ${count}`);
}
