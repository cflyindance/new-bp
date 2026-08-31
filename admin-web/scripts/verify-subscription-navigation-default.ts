import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const source = readFileSync(
  fileURLToPath(new URL("../src/config/subscription-service-runtime.ts", import.meta.url)),
  "utf8",
);

assert.match(
  source,
  /if \(!hasConfiguredSubscriptionForContext\(context\)\) return null;/,
  "没有实际订阅限制时，默认导航必须完整展示",
);

const storeSource = readFileSync(
  fileURLToPath(new URL("../src/config/subscription-service-store.ts", import.meta.url)),
  "utf8",
);
assert.match(
  storeSource,
  /!item\.id\.startsWith\("sub-demo-"\)/,
  "演示订阅不得作为商家后台导航的访问限制",
);

console.log("subscription navigation default verification passed");
