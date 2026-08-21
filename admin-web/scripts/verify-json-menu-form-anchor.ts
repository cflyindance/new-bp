import assert from "node:assert/strict";
import { resolveActiveJsonMenuFormSection } from "../src/config/json-menu-form-anchor";

const tops = { basic: 80, page: 260, advanced: 520 } as const;

assert.equal(resolveActiveJsonMenuFormSection(tops, 60), "basic");
assert.equal(resolveActiveJsonMenuFormSection(tops, 80), "basic");
assert.equal(resolveActiveJsonMenuFormSection(tops, 300), "page");
assert.equal(resolveActiveJsonMenuFormSection(tops, 600), "advanced");
assert.equal(resolveActiveJsonMenuFormSection(tops, 100, true), "advanced");

console.log("json-menu form anchor verification passed");
