import assert from "node:assert/strict";
import {
  formToCreateOrPatchBody,
  getPitRequirementActions,
  requirementToForm,
  validatePitRequirementForm,
} from "../src/pit/pit-requirement-form";
import { calculatePitConflictDiff } from "../src/pit/pit-conflict-dialog";
import { renderPitConflictDialog } from "../src/pit/pit-conflict-dialog";
import { pitRequirementDetailContext, renderPitRequirementDetailPage, renderPitRequirementForm, resolvePitAssigneeSelections } from "../src/pit/pit-requirement-detail-page";
import { guardPitRouteMount, setPitDirtyNavigation } from "../src/pit/pit-navigation-guard";
import { handlePitInShellNavigation, pitInShellNavigationDecision } from "../src/pit/pit-shell";

const requirement = {
  id: "r1", requirementNo: "REQ-000001", jiraTicket: "<PIT-1>", title: "Title", description: "Description",
  productLines: [{ id: "pl1", code: "pos", label: "POS" }], requirementTypeId: null, sourceId: null,
  problemCategoryId: null, industryId: null, requirementType: null, source: null, problemCategory: null,
  industry: null, useCase: null, notes: null, customerManager: null, implementationSide: "both" as const,
  proposedAt: "2026-09", plannedYear: 2026, plannedMonth: 9, versionNo: null, developmentStartedAt: null,
  developmentCompletedAt: null, posMergeVersion: null, status: "development" as const, priority: "high" as const,
  isHighlighted: true, following: false, sourceSheet: "需求池", sourceRow: 8, sourceStatus: "开发中", importJobId: "i1",
  pausedFromStatus: null, mids: ["1001", "1002"], assignees: [
    { id: "a1", role: "owner" as const, userId: "u1", displayName: "Owner", sortOrder: 0 },
    { id: "a2", role: "developer" as const, userId: "u2", displayName: "Dev A", sortOrder: 1 },
    { id: "a3", role: "developer" as const, userId: null, displayName: "Dev B", sortOrder: 2 },
    { id: "a4", role: "tester" as const, userId: "u3", displayName: "QA", sortOrder: 3 },
  ], deletedAt: null, deletedBy: null, createdBy: "u1", updatedBy: "u1", createdAt: "2026-01-01", updatedAt: "2026-02-01", rowVersion: 7,
};

const form = requirementToForm(requirement);
assert.equal(form.rowVersion, 7);
assert.deepEqual(form.productLineIds, ["pl1"]);
assert.deepEqual(form.mids, ["1001", "1002"]);
assert.equal(form.assignees.filter((item) => item.role === "developer").length, 2);
assert.deepEqual(validatePitRequirementForm(form), {});

const invalid = { ...form, title: "", description: "", assignees: [...form.assignees, { role: "owner" as const, userId: null, displayName: "Other" }] };
const errors = validatePitRequirementForm(invalid);
assert.ok(errors.title && errors.description && errors.assignees);

const patchBody = formToCreateOrPatchBody(form, "patch");
assert.equal(patchBody.rowVersion, 7);
assert.ok(!("status" in patchBody));
const createBody = formToCreateOrPatchBody(form, "create");
assert.ok(!("rowVersion" in createBody) && !("status" in createBody));

assert.deepEqual(getPitRequirementActions("development", "editor").map((a) => a.action), ["advance", "return", "pause", "reject"]);
assert.deepEqual(getPitRequirementActions("completed", "editor"), []);
assert.deepEqual(getPitRequirementActions("completed", "admin").map((a) => a.action), ["reopen"]);
assert.equal(getPitRequirementActions("paused", "editor")[0]?.action, "resume");
assert.ok(getPitRequirementActions("rejected", "admin")[0]?.reasonRequired);

const diff = calculatePitConflictDiff(patchBody, { ...requirement, title: "Server title", rowVersion: 8 });
assert.ok(diff.some((item) => item.field === "title" && item.submitted === "Title" && item.current === "Server title"));
assert.ok(!diff.some((item) => item.field === "rowVersion"));

const user = { id: "u1", username: "admin", displayName: "Admin", role: "admin" as const, active: true, createdAt: "", updatedAt: "" };
const detailHtml = renderPitRequirementDetailPage({ requirement: requirement as never, dictionaries: [], users: [user], user });
assert.ok(!detailHtml.includes("<PIT-1>"), "detail must escape external text");
assert.ok(detailHtml.includes("&lt;PIT-1&gt;"));
assert.equal((detailHtml.match(/data-pit-transition=/g) ?? []).length, 4);
assert.ok(detailHtml.includes("22 个源字段") && detailHtml.includes("data-pit-delete"));
for (const label of ["研发", "测试", "合入 POS"]) assert.ok(detailHtml.includes(`>${label}</span>`), `traceability missing ${label}`);
assert.ok(!detailHtml.includes("负责人/研发/测试"), "the 22 source columns must not invent a combined personnel field");
const viewerHtml = renderPitRequirementDetailPage({ requirement: requirement as never, dictionaries: [], users: [], user: { ...user, role: "viewer" } });
assert.ok(!viewerHtml.includes("data-pit-open-edit") && !viewerHtml.includes("data-pit-delete") && !viewerHtml.includes("data-pit-transition="));
const formHtml = renderPitRequirementForm(form, { requirement: requirement as never, dictionaries: [], users: [user], user }, "edit");
assert.ok(!formHtml.includes("name=\"status\"") && formHtml.includes("name=\"mids\"") && formHtml.includes("name=\"developerAssignments\"") && formHtml.includes("name=\"testerAssignments\""));
assert.ok(formHtml.includes(`value="user:${user.id}"`), "assignment controls must submit stable user IDs");
assert.deepEqual(resolvePitAssigneeSelections(["user:u2"], "developer", form.assignees, [{id:"u2",username:"same",displayName:"Duplicate name"}]), [{role:"developer",userId:"u2",displayName:"Duplicate name"}]);
assert.deepEqual(resolvePitAssigneeSelections(["legacy:Dev%20B"], "developer", form.assignees, []), [{role:"developer",userId:null,displayName:"Dev B"}]);
assert.deepEqual(resolvePitAssigneeSelections(["user:u1"], "owner", form.assignees, []), [{role:"owner",userId:"u1",displayName:"Owner"}], "inactive historical IDs must survive editing");
const conflictHtml = renderPitConflictDialog(diff);
assert.ok(conflictHtml.includes("加载最新数据") && conflictHtml.includes("取消"));
assert.ok(!conflictHtml.includes("data-pit-conflict-force") && !conflictHtml.includes("data-pit-conflict-retry"));

const detailSource = await import("node:fs").then((fs) => fs.readFileSync(new URL("../src/pit/pit-requirement-detail-page.ts", import.meta.url), "utf8"));
assert.ok(detailSource.includes("!editorOpen && !dirty") && detailSource.includes("30_000"), "refresh must never overwrite a dirty/open editor");
assert.ok(detailSource.includes("loadController.abort(); mutationController?.abort()"), "unmount must abort detail reads and writes");
assert.ok(detailSource.includes("error.fields?.current"), "409 recovery must consume the server fields.current representation");
assert.ok(detailSource.includes('event.key !== "Escape"') && detailSource.includes("confirmPitDiscard"), "drawer close and route changes need dirty protection");

assert.equal(pitInShellNavigationDecision("/pit/requirements?q=pay&page=3", "/pit/requirements/r1?q=pay&page=3", true, false), "open-drawer");
assert.equal(pitInShellNavigationDecision("/pit/requirements?q=pay&page=3", "/pit/requirements/r1?q=pay&page=3", false, false), "mount");
assert.equal(pitInShellNavigationDecision("/pit/requirements/r1?q=pay&page=3", "/pit/requirements?q=pay&page=3", true, true), "close-drawer");
const preservedWorkbench = { scrollTop: 418 }; let fakeDrawer: { remove: () => void } | null = null; let boundPath = "";
const fakeRoot = {
  dataset: { pitPath: "/pit/requirements?q=pay&page=3" },
  querySelector: (selector: string) => selector.includes("data-pit-detail-mode") ? fakeDrawer : preservedWorkbench,
  insertAdjacentHTML: () => { fakeDrawer = { remove: () => { fakeDrawer = null; } }; },
} as unknown as HTMLElement;
assert.equal(handlePitInShellNavigation("/pit/requirements/r1?q=pay&page=3", { root: fakeRoot, user, desktop: true, bindDetail: (_root,_user,_id,path) => { boundPath=path; } }), true);
assert.equal(boundPath, "/pit/requirements/r1?q=pay&page=3");
assert.equal(preservedWorkbench.scrollTop, 418, "opening a desktop drawer must preserve the mounted workbench and its scroll");
assert.equal(handlePitInShellNavigation("/pit/requirements?q=pay&page=3", { root: fakeRoot, user, desktop: true, bindDetail: () => {} }), true);
assert.equal(fakeDrawer, null); assert.equal(fakeRoot.dataset.pitPath, "/pit/requirements?q=pay&page=3");
assert.ok(detailSource.includes('context.mode === "drawer") history.back()'), "drawer close must consume the detail history entry instead of adding a duplicate list entry");
assert.equal(pitRequirementDetailContext("/pit/requirements/r1?q=pay&page=3", "editor", "drawer").closeHref, "#/pit/requirements?q=pay&page=3");
assert.equal(pitRequirementDetailContext("/pit/requirements/r1?view=trash&page=2", "admin", "drawer").deleted, "only");
assert.equal(pitRequirementDetailContext("/pit/requirements/r1?view=trash&page=2", "admin", "drawer").closeHref, "#/pit/trash?page=2");
assert.equal(pitRequirementDetailContext("/pit/requirements/r1?view=trash", "editor").deleted, undefined);
let restored = "";
setPitDirtyNavigation({ currentHash: "#/pit/requirements/r1?q=pay&page=3" });
assert.equal(guardPitRouteMount("#/pit/dashboard", () => false, (hash) => { restored = hash; }), false);
assert.equal(restored, "#/pit/requirements/r1?q=pay&page=3");
assert.equal(guardPitRouteMount("#/pit/dashboard", () => true), true);

const originalFetch = globalThis.fetch;
try {
  const controller = new AbortController(); let captured: AbortSignal | null | undefined; const requests: Array<{ url: string; signal: AbortSignal | null | undefined }> = [];
  globalThis.fetch = async (input, init) => { captured = init?.signal; requests.push({ url: String(input), signal: init?.signal }); return new Response(JSON.stringify({ data: { requirement }, meta: { requestId: "r" } }), { status: 200, headers: { "Content-Type": "application/json" } }); };
  const { pitApi } = await import("../src/pit/pit-api");
  await pitApi.getRequirement("r1", { signal: controller.signal });
  assert.equal(captured, controller.signal, "detail fetch must be abortable on unmount");
  assert.ok(!requests[0].url.includes("deleted="), "ordinary details must not request deleted records");
  await pitApi.createRequirement(formToCreateOrPatchBody(form, "create"), { signal: controller.signal });
  await pitApi.updateRequirement("r1", formToCreateOrPatchBody(form, "patch"), { signal: controller.signal });
  await pitApi.transitionRequirement("r1", { action: "pause", reason: "hold", rowVersion: 7 }, { signal: controller.signal });
  await pitApi.deleteRequirement("r1", { signal: controller.signal });
  await pitApi.restoreRequirement("r1", { signal: controller.signal });
  assert(requests.slice(1).every((item) => item.signal === controller.signal), "every mutation must forward the lifetime signal");
} finally { globalThis.fetch = originalFetch; }

console.log("PIT detail UI verification passed.");
