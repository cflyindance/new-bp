import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const p = path.join(__dirname, "..", "src", "config", "navigation.ts");
const s = fs.readFileSync(p, "utf8");
const open = s.indexOf("export const NAV_MODULES: NavModule[] = [");
if (open < 0) throw new Error("NAV_MODULES start not found");
const eq = s.indexOf("= [", open);
const arrOpen = s.indexOf("[", eq);
let depth = 0;
let close = -1;
for (let i = arrOpen; i < s.length; i++) {
  const c = s[i];
  if (c === "[") depth++;
  else if (c === "]") {
    depth--;
    if (depth === 0) {
      close = i + 1;
      break;
    }
  }
}
if (close < 0) throw new Error("NAV_MODULES end not found");
const before = s.slice(0, open);
const after = s.slice(close);
const inner = s.slice(arrOpen + 1, close - 1);
let i = 0;
const modules = [];
while (i < inner.length) {
  while (i < inner.length && /[\s,]/.test(inner[i])) i++;
  if (i >= inner.length || inner[i] !== "{") break;
  const start = i;
  let d = 0;
  for (; i < inner.length; i++) {
    if (inner[i] === "{") d++;
    else if (inner[i] === "}") {
      d--;
      if (d === 0) {
        i++;
        break;
      }
    }
  }
  modules.push(inner.slice(start, i).trimEnd());
}
const byId = Object.fromEntries(
  modules.map((m) => {
    const m2 = m.match(/^\{\s*\r?\n\s*id:\s*"([^"]+)"/);
    if (!m2) throw new Error("no id in " + m.slice(0, 80));
    return [m2[1], m];
  }),
);
const order = [
  "brand-mgmt",
  "store-mgmt",
  "dashboard",
  "team",
  "product-center-main",
  "orders",
  "transactions",
  "waitlist",
  "marketing",
  "promotions",
  "members",
  "gift-cards",
  "reviews",
  "queue-call",
  "kitchen-kds",
  "reservations",
  "reports-finance",
  "finance-center",
  "print-templates",
  "notifications",
  "inventory-ordering",
  "device-management",
  "permission-mgmt",
  "capital-turnover",
  "asset-center",
  "settings",
];
for (const id of order) {
  if (!byId[id]) throw new Error("missing module: " + id);
}
const body =
  "export const NAV_MODULES: NavModule[] = [\n  " + order.map((id) => byId[id]).join(",\n  ") + "\n];";
fs.writeFileSync(p, before + body + after);
console.log("OK", modules.length, "modules reordered");
