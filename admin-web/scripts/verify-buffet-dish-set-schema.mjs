import fs from "node:fs";
import vm from "node:vm";

const source = fs.readFileSync("dist/Configuration center/assets/order-limit-flow.js", "utf8");
const apiMatch = source.match(/window\.BuffetDishSetSchemaTestApi\s*=\s*\{([\s\S]*?)\n\s*\};/);
if (!apiMatch) throw new Error("dish set schema test API is missing");

function extractFunction(name) {
  const start = source.indexOf(`function ${name}(`);
  if (start < 0) throw new Error(`${name} is missing`);
  let depth = 0;
  let opened = false;
  for (let index = start; index < source.length; index += 1) {
    if (source[index] === "{") { depth += 1; opened = true; }
    if (source[index] === "}") depth -= 1;
    if (opened && depth === 0) return source.slice(start, index + 1);
  }
  throw new Error(`${name} is incomplete`);
}
const helpers = [extractFunction("dishSetLimitKey"), extractFunction("normalizeDishSetStoreConfig")].join("\n");
const sandbox = {
  window: { ORDER_LIMIT_MODULE_PROFILE: { moduleId: "buffet-rule", storage: {} } },
  document: {
    getElementById: () => ({}),
    body: { getAttribute: () => "editor" }
  },
  URLSearchParams,
  console
};
vm.createContext(sandbox);
vm.runInContext(helpers + `\nwindow.BuffetDishSetSchemaTestApi = {
  dishSetLimitKey: dishSetLimitKey,
  normalizeDishSetStoreConfig: normalizeDishSetStoreConfig
};`, sandbox);

const api = sandbox.window.BuffetDishSetSchemaTestApi;
const config = api.normalizeDishSetStoreConfig({
  dishSetMembers: [
    { productLineId: "kiosk", dishId: "dish-1" },
    { productLineId: "kiosk", dishId: "dish-1" },
    { productLineId: "emenu", dishId: "dish-1" }
  ],
  dishSetLimits: {
    "0|0": { configured: true, value: 3 },
    "1|0": { configured: true, value: null }
  }
});

if (config.dishSetMembers.length !== 2) throw new Error("members must be unique by line and dish");
if (config.dishSetLimits["0|0"].value !== 3) throw new Error("configured shared limit was not preserved");
if (config.dishSetLimits["1|0"].configured) throw new Error("null configured limit must normalize to unconfigured");
if (api.dishSetLimitKey(2, 4) !== "2|4") throw new Error("unexpected shared limit key");

console.log("verify-buffet-dish-set-schema: OK");
