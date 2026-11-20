import assert from "node:assert/strict";
import { resolveActiveJsonMenuFormSection } from "../src/config/json-menu-form-anchor";

const tops = { localization: 40, basic: 80, page: 260, "merchant-opening": 360, extra: 700 } as const;

assert.equal(resolveActiveJsonMenuFormSection(tops, 60), "localization");
assert.equal(resolveActiveJsonMenuFormSection(tops, 80), "basic");
assert.equal(resolveActiveJsonMenuFormSection(tops, 300), "page");
assert.equal(resolveActiveJsonMenuFormSection(tops, 420), "merchant-opening");
assert.equal(resolveActiveJsonMenuFormSection(tops, 600), "merchant-opening");
assert.equal(resolveActiveJsonMenuFormSection(tops, 100, true), "extra");

console.log("json-menu form anchor verification passed");
