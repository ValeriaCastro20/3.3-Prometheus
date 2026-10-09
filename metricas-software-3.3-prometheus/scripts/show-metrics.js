import { getMetricsText, waitForApplication } from "./common.js";

await waitForApplication();

const text = await getMetricsText();
const lines = text
  .split(/\r?\n/)
  .filter((line) =>
    line.startsWith("# HELP orders_") ||
    line.startsWith("# TYPE orders_") ||
    line.startsWith("orders_")
  );

if (lines.length === 0) {
  console.log("No hay series orders_* expuestas todavía.");
  console.log("Las métricas con labels aparecen después de observar combinaciones concretas de labels.");
  process.exit(0);
}

console.log(lines.join("\n"));
