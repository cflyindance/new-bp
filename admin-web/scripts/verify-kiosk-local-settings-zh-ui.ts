import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const shellSrc = readFileSync(join(root, "src/shell/kiosk-local-shell.ts"), "utf8");

const settingsMatch = shellSrc.match(
  /const KIOSKLITE_SETTINGS_IFRAME_SRC = `([^`]+)`/,
);
const previewMatch = shellSrc.match(/const KIOSKLITE_IFRAME_SRC = `([^`]+)`/);

assert.ok(settingsMatch, "KIOSKLITE_SETTINGS_IFRAME_SRC must exist");
assert.ok(previewMatch, "KIOSKLITE_IFRAME_SRC must exist");

const settingsSrc = settingsMatch![1];
const previewSrc = previewMatch![1];

assert.ok(
  settingsSrc.includes("language=zh-cn"),
  "settings iframe must pass language=zh-cn",
);
assert.ok(
  !previewSrc.includes("language=zh-cn"),
  "preview iframe must not force language=zh-cn",
);
assert.ok(
  settingsSrc.includes("#/configApp"),
  "settings iframe must still open #/configApp",
);

console.log("Kiosk local settings zh-ui verification passed.");
