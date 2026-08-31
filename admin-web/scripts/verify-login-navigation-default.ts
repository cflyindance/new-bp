import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const source = readFileSync(
  fileURLToPath(new URL("../src/auth/session-scope.ts", import.meta.url)),
  "utf8",
);

assert.match(
  source,
  /import\s*\{\s*clearPlatformPresetContext\s*\}\s*from\s*"\.\.\/config\/platform-preset-context"/,
  "新登录时必须能够清除旧的平台预设导航上下文",
);

const loginSync = source.match(/export function syncSessionForAuthenticatedUser\(\): void \{([\s\S]*?)\n\}/)?.[1] ?? "";
assert.match(
  loginSync,
  /clearPlatformPresetContext\(\);/,
  "新登录必须清除旧会话遗留的导航过滤状态，默认展示完整导航",
);

console.log("login navigation default verification passed");
