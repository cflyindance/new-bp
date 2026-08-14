/**
 * 一次性固化前厅 22 组迁移前的不变量基线。
 * 默认拒绝覆盖，避免迁移后重新生成掩盖回归。
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { FOH_LINE_STORAGE_BY_SEQ } from "../src/config/foh-settings-line-storage-registry";
import { MODULE_SETTINGS_BY_PATH } from "../src/config/module-settings-catalog";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const outPath = path.join(root, "scripts/lib/foh-settings-22-group-baseline.json");
const scopePath = path.join(root, "scripts/lib/foh-settings-line-scope.seed.json");
const configDir = path.join(root, "src/config");
const excludedSeqs = new Set([164, 176, 177]);

if (fs.existsSync(outPath) && !process.argv.includes("--force")) {
  throw new Error(`Baseline already exists: ${outPath}. Refusing to overwrite without --force.`);
}

const hub = MODULE_SETTINGS_BY_PATH["/operations/queue-call/settings"];
if (!hub) throw new Error("FOH settings catalog is missing");

const items = hub.items
  .filter((item) => !excludedSeqs.has(item.seq))
  .sort((a, b) => a.seq - b.seq)
  .map(({ groupKey: _groupKey, groupTitle: _groupTitle, ...stable }) => stable);

if (items.length !== 154) {
  throw new Error(`Expected 154 retained catalog items, received ${items.length}`);
}

const retainedSeqs = new Set(items.map((item) => item.seq));
const scope = JSON.parse(fs.readFileSync(scopePath, "utf8")) as Record<
  string,
  { lines: string[] }
>;
const linesBySeq = Object.fromEntries(
  [...retainedSeqs]
    .sort((a, b) => a - b)
    .map((seq) => {
      const entry = scope[String(seq)];
      if (!entry) throw new Error(`Missing line scope for retained seq ${seq}`);
      return [String(seq), [...entry.lines].sort()];
    }),
);

const storageBySeq = Object.fromEntries(
  Object.entries(FOH_LINE_STORAGE_BY_SEQ)
    .map(([seq, key]) => [Number(seq), key] as const)
    .filter(([seq]) => retainedSeqs.has(seq))
    .sort(([a], [b]) => a - b)
    .map(([seq, key]) => [String(seq), key]),
);

const migratedSeqs = [
  110, 141, 196, 216, 217, 218, 219, 220, 221, 248, 349, 350, 502, 521, 522, 523,
  581,
];
const uiFiles = fs
  .readdirSync(configDir)
  .filter((name) => name.startsWith("module-settings-") && name.endsWith(".ts"));
const uiModulesBySeq = Object.fromEntries(
  migratedSeqs.map((seq) => {
    const token = new RegExp(`(^|\\D)${seq}(\\D|$)`);
    const modules = uiFiles.filter((name) =>
      token.test(fs.readFileSync(path.join(configDir, name), "utf8")),
    );
    return [String(seq), modules.sort()];
  }),
);

fs.writeFileSync(
  outPath,
  `${JSON.stringify({ items, linesBySeq, storageBySeq, uiModulesBySeq }, null, 2)}\n`,
  "utf8",
);
console.log(`Wrote ${outPath} (${items.length} retained items)`);
