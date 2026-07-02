/**
 * 前厅产线矩阵 / lines 存储注册表 · 漂移校验（P3）
 * 用法：node scripts/verify-foh-line-scope.mjs
 * 失败时退出码 1；修复：npm run generate:foh-line-scope
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import {
  buildFohCatalogSeqIndex,
  buildFohLineScopeSeed,
  extractLineStorageMap,
  extractUiLineScopeMap,
  linesKey,
} from "./lib/foh-line-scope-extract.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

const SEED_PATH = path.resolve(__dirname, "lib/foh-settings-line-scope.seed.json");
const SCOPE_TS_PATH = path.resolve(ROOT, "src/config/foh-settings-line-scope.ts");
const REGISTRY_TS_PATH = path.resolve(ROOT, "src/config/foh-settings-line-storage-registry.ts");

const FIX_CMD = "npm run generate:foh-line-scope";

/** @type {string[]} */
const errors = [];
/** @type {string[]} */
const warnings = [];

function loadJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function parseRegistryTs(text) {
  /** @type {Record<number, string>} */
  const map = {};
  for (const m of text.matchAll(/^\s*(\d+):\s*"([^"]+)",?\s*$/gm)) {
    map[Number(m[1])] = m[2];
  }
  return map;
}

function parseScopeTsLines(text) {
  /** @type {Record<number, { lines: string[], source: string, groupKey: string }>} */
  const map = {};
  const block = text.match(/FOH_LINE_SCOPE_BY_SEQ[^=]*=\s*(\{[\s\S]*\});/);
  if (!block) return map;
  try {
    const raw = JSON.parse(block[1]);
    for (const [seq, v] of Object.entries(raw)) {
      map[Number(seq)] = v;
    }
  } catch {
    errors.push("无法解析 foh-settings-line-scope.ts 中的 FOH_LINE_SCOPE_BY_SEQ");
  }
  return map;
}

function compareScopeEntry(seq, expected, committed, label) {
  if (!committed) {
    errors.push(`[scope/${label}] seq ${seq} 缺失`);
    return;
  }
  if (expected.groupKey !== committed.groupKey) {
    errors.push(
      `[scope/${label}] seq ${seq} groupKey 漂移：期望 ${expected.groupKey}，已提交 ${committed.groupKey}`,
    );
  }
  if (linesKey(expected.lines) !== linesKey(committed.lines)) {
    errors.push(
      `[scope/${label}] seq ${seq} lines 漂移：期望 [${expected.lines.join(", ")}]，已提交 [${committed.lines.join(", ")}]`,
    );
  }
  if (expected.source !== committed.source) {
    warnings.push(
      `[scope/${label}] seq ${seq} source 标注变化：期望 ${expected.source}，已提交 ${committed.source}`,
    );
  }
}

function compareMaps(expectedMap, committedMap, label) {
  const expectedKeys = new Set(Object.keys(expectedMap).map(Number));
  const committedKeys = new Set(Object.keys(committedMap).map(Number));

  for (const seq of expectedKeys) {
    if (!committedKeys.has(seq)) {
      errors.push(`[${label}] seq ${seq} 在 UI 抽取中存在，但已提交文件缺失`);
      continue;
    }
    if (expectedMap[seq] !== committedMap[seq]) {
      errors.push(
        `[${label}] seq ${seq} 漂移：期望 ${JSON.stringify(expectedMap[seq])}，已提交 ${JSON.stringify(committedMap[seq])}`,
      );
    }
  }

  for (const seq of committedKeys) {
    if (!expectedKeys.has(seq)) {
      warnings.push(`[${label}] seq ${seq} 在已提交文件中存在，但 UI 抽取未找到（可能已下线）`);
    }
  }
}

function main() {
  const uiMap = extractUiLineScopeMap();
  const expectedSeed = buildFohLineScopeSeed(uiMap);
  const expectedStorage = Object.fromEntries(extractLineStorageMap());

  if (!fs.existsSync(SEED_PATH)) {
    errors.push(`缺少 ${SEED_PATH}，请运行 ${FIX_CMD}`);
  }
  if (!fs.existsSync(SCOPE_TS_PATH)) {
    errors.push(`缺少 ${SCOPE_TS_PATH}，请运行 ${FIX_CMD}`);
  }
  if (!fs.existsSync(REGISTRY_TS_PATH)) {
    errors.push(`缺少 ${REGISTRY_TS_PATH}，请运行 generate-foh-line-storage-registry.mjs`);
  }
  if (errors.length) {
    reportAndExit({}, {});
  }

  const committedSeed = loadJson(SEED_PATH);
  const committedScopeTs = parseScopeTsLines(fs.readFileSync(SCOPE_TS_PATH, "utf8"));
  const committedRegistry = parseRegistryTs(fs.readFileSync(REGISTRY_TS_PATH, "utf8"));

  const { allSeqs } = buildFohCatalogSeqIndex();

  for (const seq of allSeqs) {
    const exp = expectedSeed[seq];
    const seed = committedSeed[String(seq)];
    compareScopeEntry(seq, exp, seed, "seed.json");

    const tsEntry = committedScopeTs[seq];
    if (exp && tsEntry) {
      compareScopeEntry(
        seq,
        { groupKey: exp.groupKey, lines: exp.lines, source: exp.source },
        tsEntry,
        "scope.ts",
      );
    } else if (exp && !tsEntry) {
      errors.push(`[scope/scope.ts] seq ${seq} 缺失`);
    }
  }

  for (const key of Object.keys(committedSeed)) {
    if (!expectedSeed[Number(key)]) {
      warnings.push(`[scope/seed.json] seq ${key} 多余（不在 foh-settings-groups assign map）`);
    }
  }

  compareMaps(expectedStorage, committedRegistry, "storage-registry");

  reportAndExit(expectedSeed, expectedStorage);
}

function reportAndExit(expectedSeed, expectedStorage) {

  if (warnings.length) {
    console.warn("\n⚠ 前厅产线 SSOT 警告：");
    for (const w of warnings) console.warn(`  - ${w}`);
  }

  if (errors.length) {
    console.error("\n✗ 前厅产线 SSOT 校验失败：");
    for (const e of errors) console.error(`  - ${e}`);
    console.error(`\n修复：cd admin-web && ${FIX_CMD}`);
    process.exit(1);
  }

  const scopeCount = Object.keys(expectedSeed).length;
  const storageCount = Object.keys(expectedStorage).length;
  console.log(`✓ 前厅产线 SSOT 校验通过（scope ${scopeCount} seq，storage ${storageCount} seq）`);
}

main();
