import assert from "node:assert/strict";
import { isTipsFullscreenRoute, isTrustedTipsHistoryState, parseTipsRoute } from "../src/team/tips/tips-navigation.ts";

assert.equal(isTipsFullscreenRoute(parseTipsRoute("#/team/tips/rules")), true);
assert.equal(isTipsFullscreenRoute(parseTipsRoute("#/team/tips/rules/?store=1")), true);
assert.equal(isTipsFullscreenRoute(parseTipsRoute("#/team/tips/rules/editor?id=2")), true);
assert.equal(isTipsFullscreenRoute(parseTipsRoute("#/team/tips/rules-foo")), false);
const valid = { flowId: "flow-1", viewHref: "/team/tips/rules", scrollTop: 12, parentHref: "/team/tips/distribution", summaryHref: "/team/tips/distribution" as const, summaryScrollTop: 24 };
assert.equal(isTrustedTipsHistoryState(valid, "/team/tips/rules"), true);
assert.equal(isTrustedTipsHistoryState({ ...valid, scrollTop: -1 }, "/team/tips/rules"), false);
console.log("Team tips fullscreen navigation verification passed.");
