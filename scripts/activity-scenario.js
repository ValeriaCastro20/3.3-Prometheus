import { APP_URL, waitForApplication } from "./common.js";

const paths = [
  "/orders/ord-1001",
  "/orders/ord-1002",
  "/orders/ord-1003",
  "/orders/ord-1001",
  "/orders/ord-1002",
  "/orders/ord-1003",
  "/orders/ord-1001",
  "/orders/ord-1002",
  "/orders/ord-missing-01",
  "/orders/ord-missing-02",
  "/orders/ord-missing-03",
  "/orders/ord-missing-04"
];

await waitForApplication();

const counts = new Map();

for (const path of paths) {
  const response = await fetch(`${APP_URL}${path}`);
  counts.set(response.status, (counts.get(response.status) ?? 0) + 1);
}

console.log("Escenario de actividad completado.");
console.log(`200: ${counts.get(200) ?? 0}`);
console.log(`404: ${counts.get(404) ?? 0}`);
console.log(`total: ${paths.length}`);
