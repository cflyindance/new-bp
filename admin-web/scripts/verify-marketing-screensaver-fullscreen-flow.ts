import assert from "node:assert/strict";
import { resolveMarketingScreensaverFullscreenTransition } from "../src/config/marketing-screensaver-fullscreen";

const cases = [
  ["https://example.test/Configuration%20center/screensaver-create.html?embedded=1", "enter"],
  ["https://example.test/Configuration%20center/screensaver-edit.html?themeId=demo", "enter"],
  ["https://example.test/Configuration%20center/store-select.html?embedded=1", "preserve"],
  ["https://example.test/Configuration%20center/channel-select.html?embedded=1", "preserve"],
  ["https://example.test/Configuration%20center/effective-time.html?embedded=1", "preserve"],
  ["https://example.test/Configuration%20center/kiosk-theme-list.html?embedded=1", "exit"],
  ["https://example.test/Configuration%20center/kiosk-screensaver.html?embedded=1", "exit"],
] as const;

for (const [url, expected] of cases) {
  assert.equal(resolveMarketingScreensaverFullscreenTransition(url), expected, url);
}

console.log("Marketing screensaver fullscreen flow verification passed.");
