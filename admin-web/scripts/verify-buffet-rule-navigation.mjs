import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
const navigation = read("src/config/navigation.ts");
const main = read("src/main.ts");
const domains = read("src/config/deployment-config-domains.ts");

const menuIndex = navigation.indexOf('id: "qc-menu-order-limits"');
const buffetIndex = navigation.indexOf('id: "foh-buffet-rules"');
assert.ok(menuIndex >= 0 && buffetIndex > menuIndex, "自助餐规则应位于菜单下单限制下方");
assert.match(main, /FOH_BUFFET_RULES_IFRAME_SRC/);
assert.match(main, /Configuration%20center\/buffet-rule\.html/);
assert.match(main, /isFohBuffetRulesIframePath/);
assert.match(main, /renderFohBuffetRulesPagePanel/);
assert.match(domains, /domainKey:\s*"foh\.buffet-rules"/);

for (const file of ["buffet-rule.html", "buffet-rule-editor.html", "buffet-rule-publish-confirm.html"]) {
  const html = read(`dist/Configuration center/${file}`);
  assert.match(html, /自助餐规则/);
  if (file !== "buffet-rule.html") {
    assert.ok(html.indexOf("buffet-rule-domain.js") < html.indexOf("buffet-rule-profile.js"));
    assert.ok(html.indexOf("buffet-rule-profile.js") < html.indexOf("order-limit-flow.js"));
  }
}

console.log("verify-buffet-rule-navigation: OK");
