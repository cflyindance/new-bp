/**
 * 每次 build 生成版本戳，写入主应用 bundle，用于嵌入页 iframe 的 ?v= 缓存破坏。
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.resolve(__dirname, "..", "src", "generated");
const outFile = path.join(outDir, "build-stamp.ts");

const stamp = new Date().toISOString().replace(/[-:T.Z]/g, "").slice(0, 14);

fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(
  outFile,
  `/** 由 scripts/generate-build-stamp.mjs 在 build 时自动生成，请勿手改 */\nexport const BUILD_STAMP = "${stamp}";\n`,
  "utf8",
);

console.log(`[build-stamp] ${stamp}`);
