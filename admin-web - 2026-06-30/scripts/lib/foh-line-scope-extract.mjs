/**
 * 前厅产线适用范围 / lines 存储键 · 从 UI 模块抽取（generate + verify 共用）
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { FOH_SETTINGS_ASSIGN_MAP, FOH_SETTINGS_GROUP_ORDER } from "./foh-settings-groups.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const CONFIG_DIR = path.resolve(__dirname, "../../src/config");

export const STAFF_DEFAULT = ["pos", "pos-go", "paypad"];
export const GUEST_DEFAULT = ["kiosk", "emenu", "sdi", "online-order"];
export const STORE_WIDE = ["store-wide"];

export const STAFF_GROUPS = new Set([
  "foh-pos-shell",
  "foh-table-start-flow",
  "foh-pos-menu-scope",
  "foh-pos-menu-ui-layout",
  "foh-pos-order-cart",
  "foh-pos-combo-ordering",
  "foh-pos-buttons",
  "foh-kitchen-send-timing",
  "foh-pos-find-order-list",
  "foh-pos-checkout-entry",
  "foh-table-clear-ops",
  "foh-pos-notification-control",
  "foh-pos-order-alerts",
]);

/** @type {Record<number, { lines: string[], source: string, module?: string }>} */
export const SCOPE_MANUAL_OVERRIDES = {
  165: { lines: STAFF_DEFAULT, source: "ui-module", module: "module-settings-default-main-screen-ui.ts" },
  443: { lines: STORE_WIDE, source: "store-wide" },
  652: { lines: ["kiosk", "emenu", "sdi", "cds"], source: "manual" },
  653: { lines: ["kiosk", "emenu", "sdi", "cds"], source: "manual" },
  333: { lines: STORE_WIDE, source: "store-wide" },
  673: { lines: STORE_WIDE, source: "store-wide" },
  110: { lines: STAFF_DEFAULT, source: "group-default" },
  111: { lines: STAFF_DEFAULT, source: "group-default" },
  121: { lines: STAFF_DEFAULT, source: "group-default" },
  125: { lines: STAFF_DEFAULT, source: "group-default" },
  113: { lines: STAFF_DEFAULT, source: "group-default" },
  114: { lines: STAFF_DEFAULT, source: "group-default" },
  120: { lines: STAFF_DEFAULT, source: "group-default" },
  123: { lines: STAFF_DEFAULT, source: "group-default" },
  133: { lines: STAFF_DEFAULT, source: "group-default" },
  135: { lines: STAFF_DEFAULT, source: "group-default" },
  137: { lines: STAFF_DEFAULT, source: "group-default" },
  193: { lines: STAFF_DEFAULT, source: "group-default" },
  194: { lines: STAFF_DEFAULT, source: "group-default" },
  195: { lines: STAFF_DEFAULT, source: "group-default" },
  196: { lines: STAFF_DEFAULT, source: "group-default" },
  197: { lines: STAFF_DEFAULT, source: "group-default" },
  198: { lines: STAFF_DEFAULT, source: "group-default" },
  199: { lines: STAFF_DEFAULT, source: "group-default" },
  200: { lines: STAFF_DEFAULT, source: "group-default" },
  201: { lines: STAFF_DEFAULT, source: "group-default" },
  202: { lines: STAFF_DEFAULT, source: "group-default" },
  203: { lines: STAFF_DEFAULT, source: "group-default" },
  204: { lines: STAFF_DEFAULT, source: "group-default" },
  205: { lines: STAFF_DEFAULT, source: "group-default" },
  206: { lines: STAFF_DEFAULT, source: "group-default" },
  207: { lines: STAFF_DEFAULT, source: "group-default" },
  208: { lines: STAFF_DEFAULT, source: "group-default" },
  209: { lines: STAFF_DEFAULT, source: "group-default" },
  210: { lines: STAFF_DEFAULT, source: "group-default" },
  211: { lines: STAFF_DEFAULT, source: "group-default" },
  212: { lines: STAFF_DEFAULT, source: "group-default" },
  213: { lines: STAFF_DEFAULT, source: "group-default" },
  214: { lines: STAFF_DEFAULT, source: "group-default" },
  215: { lines: STAFF_DEFAULT, source: "group-default" },
  483: { lines: STAFF_DEFAULT, source: "group-default" },
  484: { lines: STAFF_DEFAULT, source: "group-default" },
  485: { lines: STAFF_DEFAULT, source: "group-default" },
  486: { lines: STAFF_DEFAULT, source: "group-default" },
  581: { lines: GUEST_DEFAULT, source: "group-default" },
  502: { lines: ["kiosk"], source: "manual" },
  592: { lines: GUEST_DEFAULT, source: "group-default" },
  620: { lines: GUEST_DEFAULT, source: "group-default" },
  626: { lines: GUEST_DEFAULT, source: "group-default" },
  629: { lines: GUEST_DEFAULT, source: "group-default" },
  640: { lines: GUEST_DEFAULT, source: "group-default" },
  641: { lines: GUEST_DEFAULT, source: "group-default" },
  522: { lines: GUEST_DEFAULT, source: "group-default" },
  523: { lines: GUEST_DEFAULT, source: "group-default" },
  642: { lines: ["emenu"], source: "ui-module", module: "module-settings-clear-table-button-ui.ts" },
  534: {
    lines: ["emenu", "kiosk", "pos", "pos-go", "paypad", "sdi"],
    source: "ui-module",
    module: "module-settings-auto-clear-table-ui.ts",
  },
  600: { lines: ["emenu", "sdi"], source: "ui-module", module: "module-settings-guest-menu-line-toggle-ui.ts" },
  570: { lines: ["emenu", "sdi"], source: "ui-module", module: "module-settings-nested-ui.ts" },
  571: { lines: ["emenu", "sdi"], source: "ui-module", module: "module-settings-guest-category-mode-ui.ts" },
  575: { lines: ["emenu", "sdi"], source: "ui-module", module: "module-settings-hotpot-half-surcharge-ui.ts" },
  601: { lines: ["emenu", "sdi"], source: "ui-module", module: "module-settings-guest-category-mode-ui.ts" },
  627: { lines: ["emenu"], source: "ui-module", module: "module-settings-guest-category-mode-ui.ts" },
  /** POS 通知总控 / 订单消息提醒（迁自消息中心） */
  331: { lines: STORE_WIDE, source: "store-wide" },
  332: {
    lines: ["kiosk", "emenu", "pos", "pos-go", "paypad", "sdi", "online-order"],
    source: "ui-module",
    module: "module-settings-notification-voice-alert-ui.ts",
  },
  637: {
    lines: ["kiosk", "emenu", "sdi", "online-order"],
    source: "ui-module",
    module: "module-settings-staff-order-alerts-ui.ts",
  },
  638: {
    lines: ["kiosk", "emenu", "sdi", "online-order"],
    source: "ui-module",
    module: "module-settings-staff-order-alerts-ui.ts",
  },
  639: { lines: ["emenu", "sdi"], source: "ui-module", module: "module-settings-staff-order-alerts-ui.ts" },
};

export const STORAGE_MANUAL_SUPPLEMENT = {
  572: "572-hotpot-base-required-lines",
};

/** @returns {{ allSeqs: number[], seqToGroup: Map<number, string> }} */
export function buildFohCatalogSeqIndex() {
  const allSeqs = [];
  const seqToGroup = new Map();
  for (const gk of FOH_SETTINGS_GROUP_ORDER) {
    for (const seq of FOH_SETTINGS_ASSIGN_MAP[gk] ?? []) {
      allSeqs.push(seq);
      seqToGroup.set(seq, gk);
    }
  }
  return { allSeqs, seqToGroup };
}

/** @returns {Map<number, { lines: string[], source: string, module?: string }>} */
export function extractUiLineScopeMap(configDir = CONFIG_DIR) {
  /** @type {Map<number, { lines: string[], source: string, module?: string }>} */
  const uiMap = new Map();

  function parseProductLinesFromFile(filePath) {
    const text = fs.readFileSync(filePath, "utf8");
    const moduleName = path.basename(filePath);
    const seqExports = [];
    for (const m of text.matchAll(/export const (\w+)_SEQ(?:S)?\s*=\s*(\[[\d,\s]+\]|\d+)/g)) {
      const name = m[1];
      const val = m[2];
      if (val.startsWith("[")) {
        const nums = JSON.parse(val.replace(/\s/g, "").replace(/,+\]/g, "]"));
        for (const n of nums) seqExports.push({ seq: n, constName: name });
      } else {
        seqExports.push({ seq: Number(val), constName: name });
      }
    }

    const plMatch = text.match(/export const (\w+PRODUCT_LINES)\s*=\s*\[([\s\S]*?)\]\s*as const/);
    if (!plMatch) return;

    const plConst = plMatch[1];
    const lines = [];
    for (const lm of plMatch[2].matchAll(/id:\s*"([^"]+)"/g)) lines.push(lm[1]);
    if (!lines.length) return;

    const configBySeq = {};
    const configBlock = text.match(/const CONFIG_BY_SEQ[^=]*=\s*\{([\s\S]*?)\n\};/);
    if (configBlock) {
      for (const m of configBlock[1].matchAll(/\[(\d+)\]:\s*\{[^}]*lines:\s*(\[[^\]]+\])/g)) {
        try {
          configBySeq[Number(m[1])] = JSON.parse(m[2].replace(/'/g, '"'));
        } catch {
          /* ignore */
        }
      }
    }

    for (const { seq, constName } of seqExports) {
      let mappedLines = configBySeq[seq];
      if (!mappedLines) {
        const prefix = constName.replace(/_SEQ$/, "").replace(/_SEQS$/, "");
        const candidates = [
          `${prefix}_PRODUCT_LINES`,
          plConst,
          constName.replace(/_SEQ$/, "_PRODUCT_LINES"),
        ];
        for (const c of candidates) {
          const re = new RegExp(`export const ${c}\\s*=\\s*\\[([\\s\\S]*?)\\]\\s*as const`);
          const cm = text.match(re);
          if (cm) {
            mappedLines = [];
            for (const lm of cm[1].matchAll(/id:\s*"([^"]+)"/g)) mappedLines.push(lm[1]);
            break;
          }
        }
        if (!mappedLines) mappedLines = lines;
      }
      if (mappedLines?.length) {
        uiMap.set(seq, { lines: [...mappedLines], source: "ui-module", module: moduleName });
      }
    }
  }

  for (const f of fs.readdirSync(configDir)) {
    if (!f.startsWith("module-settings") || !f.endsWith(".ts")) continue;
    parseProductLinesFromFile(path.join(configDir, f));
  }

  for (const [seq, v] of Object.entries(SCOPE_MANUAL_OVERRIDES)) {
    uiMap.set(Number(seq), v);
  }

  return uiMap;
}

export function resolveScopeEntry(seq, groupKey, uiMap) {
  if (uiMap.has(seq)) return uiMap.get(seq);
  if (STAFF_GROUPS.has(groupKey)) {
    if ([346, 345, 348, 350, 351, 347].includes(seq)) {
      return { lines: ["pos", "paypad"], source: "manual", note: "iPad/PayPad" };
    }
    if ([216, 217, 218, 219, 220].includes(seq)) {
      return { lines: ["pos", "paypad"], source: "ui-module" };
    }
    return { lines: STAFF_DEFAULT, source: "group-default" };
  }
  return { lines: GUEST_DEFAULT, source: "group-default" };
}

/** @returns {Record<number, { groupKey: string, lines: string[], source: string, module?: string }>} */
export function buildFohLineScopeSeed(uiMap = extractUiLineScopeMap()) {
  const { allSeqs, seqToGroup } = buildFohCatalogSeqIndex();
  /** @type {Record<number, object>} */
  const jsonOut = {};
  for (const seq of allSeqs) {
    const gk = seqToGroup.get(seq);
    const r = resolveScopeEntry(seq, gk, uiMap);
    jsonOut[seq] = { groupKey: gk, lines: r.lines, source: r.source, module: r.module };
  }
  return jsonOut;
}

/** @returns {Map<number, string>} */
export function extractLineStorageMap(configDir = CONFIG_DIR) {
  const { allSeqs } = buildFohCatalogSeqIndex();
  const fohSeqs = new Set(allSeqs);
  /** @type {Map<number, string>} */
  const bySeq = new Map();

  function add(seq, storageId, file) {
    if (!fohSeqs.has(seq)) return;
    if (bySeq.has(seq) && bySeq.get(seq) !== storageId) return;
    bySeq.set(seq, storageId);
  }

  function parseFile(filePath) {
    const text = fs.readFileSync(filePath, "utf8");
    const base = path.basename(filePath);

    const bySeqBlock = text.match(/LINES_STORAGE_ID_BY_SEQ[^=]*=\s*\{([\s\S]*?)\}\s*(?:as const)?;/);
    if (bySeqBlock) {
      for (const m of bySeqBlock[1].matchAll(/\[\s*(\w+)\s*\]:\s*"([^"]+)"/g)) {
        const seqConst = text.match(new RegExp(`export const ${m[1]}\\s*=\\s*(\\d+)`));
        if (seqConst) add(Number(seqConst[1]), m[2], base);
      }
      for (const m of bySeqBlock[1].matchAll(/(\d+)\s*:\s*"([^"]+)"/g)) {
        add(Number(m[1]), m[2], base);
      }
    }

    const singleId = text.match(/const LINES_STORAGE_ID\s*=\s*"([^"]+)"/);
    if (singleId) {
      for (const m of text.matchAll(/export const (\w+)_SEQ\s*=\s*(\d+)/g)) {
        add(Number(m[2]), singleId[1], base);
      }
      const seqsArray = text.match(/export const \w+_SEQS\s*=\s*\[([\d,\s]+)\]/);
      if (seqsArray) {
        for (const n of seqsArray[1].match(/\d+/g) ?? []) add(Number(n), singleId[1], base);
      }
    }

    for (const m of text.matchAll(/const (\w+_LINES_STORAGE_ID)\s*=\s*"([^"]+)"/g)) {
      const storageId = m[2];
      const seqFromName = storageId.match(/^(\d+)-/);
      if (seqFromName) {
        add(Number(seqFromName[1]), storageId, base);
        continue;
      }
    }

    const templateFn = text.match(/function linesStorageId\([^)]*\)[^{]*\{\s*return `\$\{seq\}-([^`]+)`;/);
    if (templateFn) {
      const suffix = templateFn[1];
      for (const m of text.matchAll(/export const (\w+)_SEQS?\s*=\s*(\[[\d,\s]+\]|\d+)/g)) {
        const val = m[2];
        if (val.startsWith("[")) {
          for (const n of val.match(/\d+/g) ?? []) add(Number(n), `${n}-${suffix}`, base);
        } else {
          add(Number(val), `${val}-${suffix}`, base);
        }
      }
    }

    for (const m of text.matchAll(/linesStorageId:\s*"([^"]+)"/g)) {
      const storageId = m[1];
      const seqFromName = storageId.match(/^(\d+)-/);
      if (seqFromName) add(Number(seqFromName[1]), storageId, base);
    }

    const tablesideMap = text.match(/TABLESIDE_SERVICE_CALL_LINES_STORAGE_IDS[^=]*=\s*\{([\s\S]*?)\};/);
    if (tablesideMap) {
      for (const m of tablesideMap[1].matchAll(/\[(\w+)\]\s*:\s*"([^"]+)"/g)) {
        const seqConst = text.match(new RegExp(`(?:const|export const) ${m[1]}\\s*=\\s*(\\d+)`));
        if (seqConst) add(Number(seqConst[1]), m[2], base);
      }
    }
  }

  for (const f of fs.readdirSync(configDir)) {
    if (!f.startsWith("module-settings") || !f.endsWith(".ts")) continue;
    parseFile(path.join(configDir, f));
  }

  for (const [seq, id] of Object.entries(STORAGE_MANUAL_SUPPLEMENT)) {
    add(Number(seq), id, "manual");
  }

  return bySeq;
}

export function linesKey(lines) {
  return [...lines].sort().join(",");
}
