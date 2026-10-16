import assert from "node:assert/strict";
import { isPageInitializing, withPageInitialization } from "../src/config/page-initialization";
import { clearPageConfigChanges, recordPageConfigChange, isPageDirty, peekPageConfigChanges } from "../src/config/deployment-change-buffer";

const page = "/orders/settings";
const change = { fieldKey: "test", label: "测试设置", before: "关闭", after: "开启" };
clearPageConfigChanges(page);
for (let visit = 0; visit < 3; visit++) {
  withPageInitialization(() => {
    assert.equal(isPageInitializing(), true);
    recordPageConfigChange(page, change);
    withPageInitialization(() => recordPageConfigChange(page, change));
  });
  assert.equal(isPageDirty(page), false, "viewing/revisiting must not mark dirty");
}
assert.throws(() => withPageInitialization(() => { throw new Error("render failed"); }));
assert.equal(isPageInitializing(), false, "failed render must release initialization scope");
recordPageConfigChange(page, change);
assert.equal(isPageDirty(page), true, "actual edit must remain protected");
withPageInitialization(() => recordPageConfigChange(page, { ...change, after: "其他" }));
assert.equal(peekPageConfigChanges(page)[0].after, "开启", "remount preserves edits");
recordPageConfigChange(page, { ...change, before: "开启", after: "关闭" });
assert.equal(isPageDirty(page), false, "reverting to original clears dirty state");
console.log("PASS: view/revisit/nested/error/edit/remount/revert");
