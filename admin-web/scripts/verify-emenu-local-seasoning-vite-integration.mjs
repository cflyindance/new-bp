import path from "node:path";
import { fileURLToPath } from "node:url";
import { createServer } from "vite";

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const server = await createServer({
  configFile: path.join(root, "vite.config.ts"),
  server: { host: "127.0.0.1", port: 0, open: false, strictPort: false },
});

try {
  await server.listen();
  const address = server.httpServer?.address();
  assert(address && typeof address === "object", "Vite test server did not expose an address");
  const response = await fetch(`http://127.0.0.1:${address.port}/api/v1/emenu-local/seasoning/bootstrap`);
  const payload = await response.json();
  assert(response.status === 200, `Vite seasoning facade returned ${response.status}`);
  assert(payload.permissions?.canEdit === true && Number.isInteger(payload.version), "Vite seasoning facade payload is incomplete");
  const catalogResponse = await fetch(`http://127.0.0.1:${address.port}/api/v1/emenu-local/menu-catalog?product=KIOSK`);
  const catalog = await catalogResponse.json();
  assert(catalogResponse.status === 200, `Vite menu catalog returned ${catalogResponse.status}`);
  assert(catalog.source === "static" && catalog.tree === null, "Vite menu catalog without host falls back to static");
  console.log("eMenu local seasoning Vite integration verification passed");
} finally {
  await server.close();
}
