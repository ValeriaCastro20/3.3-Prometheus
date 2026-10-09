import { APP_URL, waitForApplication } from "./common.js";

const plan = [
  ...Array.from({ length: 12 }, (_, i) => ({
    order_id: `ord-guided-normal-${String(i + 1).padStart(2, "0")}`,
    scenario: "normal"
  })),
  ...Array.from({ length: 5 }, (_, i) => ({
    order_id: `ord-guided-slow-${String(i + 1).padStart(2, "0")}`,
    scenario: "slow"
  })),
  ...Array.from({ length: 3 }, (_, i) => ({
    order_id: `ord-guided-timeout-${String(i + 1).padStart(2, "0")}`,
    scenario: "payment-timeout"
  }))
];

await waitForApplication();

const counts = new Map();

for (const item of plan) {
  const response = await fetch(`${APP_URL}/orders`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(item)
  });

  counts.set(response.status, (counts.get(response.status) ?? 0) + 1);
}

console.log("Escenario guiado completado.");
console.log(`201: ${counts.get(201) ?? 0}`);
console.log(`504: ${counts.get(504) ?? 0}`);
console.log(`total: ${plan.length}`);
