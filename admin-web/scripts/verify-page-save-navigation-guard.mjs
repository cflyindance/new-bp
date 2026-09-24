import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const source = await readFile(new URL("../src/config/page-save-guard.ts", import.meta.url), "utf8");
const mainSource = await readFile(new URL("../src/main.ts", import.meta.url), "utf8");
const shiftSchedulingSource = await readFile(
  new URL("../src/config/team-shift-scheduling-ui.ts", import.meta.url),
  "utf8",
);
const clockInSource = await readFile(
  new URL("../src/config/team-clock-in-ui.ts", import.meta.url),
  "utf8",
);

assert.doesNotMatch(
  source,
  /window\.confirm\s*\(/,
  "页面离开保护不能使用阻塞式 window.confirm，否则 hash 已变化但 DOM 尚未完成切换时会表现为卡住",
);
assert.match(source, /openConfirmDialog/, "页面离开保护应使用应用内异步确认弹窗");
assert.match(source, /isPageSavePending\(prevKey\)/, "离开保护必须使用页面注册的显式脏状态探针");
assert.match(source, /leaveConfirmOpen/, "异步确认期间应锁定并发路由切换");
assert.match(source, /leaveConfirmPrevPath/, "取消离开时应恢复确认前的路由");
assert.match(
  source,
  /export function syncPageSaveGuardPath\(path: string\): void \{\s*if \(leaveConfirmOpen\) return;/,
  "离开确认弹窗打开期间，页面重绘不能覆盖守卫保存的原路由",
);
const confirmAwaitIndex = source.indexOf("const ok = await openConfirmDialog");
const rollbackIndex = source.indexOf('window.location.hash = `#${prevPath}`;');
assert.ok(
  rollbackIndex !== -1 && rollbackIndex < confirmAwaitIndex,
  "检测到未保存修改时应先同步回退到原页，再等待异步确认，避免目标页提前挂载改写路由基线",
);
assert.match(
  source,
  /discardPageDraft\(prevKey\);\s*window\.dispatchEvent\(\s*new CustomEvent\("menusifu:page-settings-discard", \{ detail: \{ pageKey: prevKey \} \}\),\s*\);/,
  "确认离开后必须通知页面恢复专用草稿状态，避免再次进入时仍被判定为未保存",
);
assert.match(
  source,
  /lastPath = nextPath;\s*window\.location\.hash = `#\$\{nextPath\}`;/,
  "确认并完成丢弃后才应跳转到目标页",
);

assert.match(
  mainSource,
  /bindPageSaveGuard\(\);\s*window\.addEventListener\("hashchange", mount\);/,
  "页面离开保护必须在模块初始化阶段先于主路由重绘监听器注册",
);
assert.equal(
  mainSource.match(/bindPageSaveGuard\(\);/g)?.length,
  1,
  "页面离开保护只能注册一次，不能留在每次 mount 的绑定区",
);

assert.match(
  shiftSchedulingSource,
  /menusifu:page-settings-discard[\s\S]*?cellEditor = null;[\s\S]*?shiftFormEditor = null;[\s\S]*?shiftDeleteConfirmId = null;/,
  "丢弃排班修改时必须同时关闭内存中的排班与班次编辑器，避免重新进入后再次生成脏状态",
);
assert.match(
  shiftSchedulingSource,
  /let shiftSchedulingDirty = false;/,
  "排班页应只把本页写操作标记为未保存，不能把员工打卡页更新共享排班数据误判为用户编辑",
);
assert.match(shiftSchedulingSource, /function writeShiftTypes[\s\S]*?shiftSchedulingDirty = true;/);
assert.match(shiftSchedulingSource, /function writeAssignments[\s\S]*?shiftSchedulingDirty = true;/);
assert.match(
  shiftSchedulingSource,
  /registerPageSaveDirtyProbe\(TEAM_SHIFT_SCHEDULING_PATH, \(\) => shiftSchedulingDirty\)/,
  "排班页离开保护应使用本页显式脏状态",
);

assert.match(
  clockInSource,
  /writeAssignmentsQuiet[\s\S]*?clearPageConfigChanges\(SHIFT_SCHEDULING_PATH\);[\s\S]*?menusifu:page-settings-saved[\s\S]*?pageKey:\s*SHIFT_SCHEDULING_PATH/,
  "员工打卡页静默补齐演示排班后必须同步排班页保存基线，避免再次进入时误报未保存修改",
);
assert.match(
  clockInSource,
  /registerPageSaveDirtyProbe\(\s*TEAM_CLOCK_IN_PATH,\s*\(\) =>\s*shouldShowTeamClockInSaveBar\(\)\s*&&\s*isPageDirty\(TEAM_CLOCK_IN_PATH\)/,
  "员工打卡仅规则设置 Tab 应参与未保存离开保护，实时打卡与考勤记录不能弹出提示",
);

console.log("✓ 页面未保存离开保护使用非阻塞弹窗并防止并发路由串线");
