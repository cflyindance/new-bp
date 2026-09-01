import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { movePitDictionaryId, renderPitDictionaryPage } from "../src/pit/pit-dictionary-page";
import { renderPitUserPage } from "../src/pit/pit-user-page";
import { redactPitAuditValue, renderPitAuditPage } from "../src/pit/pit-audit-page";
import { pitTrashDetailHref, renderPitTrashPage } from "../src/pit/pit-trash-page";
import { canAccessPitRoute } from "../src/pit/pit-routes";
import type { PitAuditEvent, PitDictionaryItem, PitRequirementListItem, PitUser } from "../src/pit/pit-types";

const admin: PitUser = { id: "u-admin", username: "admin<script>", displayName: "管理<script>", role: "admin", active: true, createdAt: "2026-01-01", updatedAt: "2026-01-01" };
const viewer: PitUser = { ...admin, id: "u-view", username: "viewer", displayName: "只读", role: "viewer" };
for (const route of ["dictionaries", "users", "audit-log", "trash"] as const) { assert.equal(canAccessPitRoute(route, "admin"), true); assert.equal(canAccessPitRoute(route, "viewer"), false); assert.equal(canAccessPitRoute(route, "editor"), false); }

const types = ["product_line", "requirement_source", "requirement_type", "problem_category", "industry"] as const;
const dictionaries: PitDictionaryItem[] = types.map((type, index) => ({ id: `d${index}`, type, code: `code_${index}`, label: `名称${index}<script>`, sortOrder: index * 10, active: index !== 0, createdAt: "", updatedAt: "" }));
const dictionaryHtml = renderPitDictionaryPage({ user: admin, items: dictionaries, type: "product_line" });
for (const marker of ["data-pit-dictionary-tab", "data-pit-dictionary-create", "data-pit-dictionary-edit", "data-pit-dictionary-toggle", "data-pit-dictionary-move", "历史可见"]) assert.ok(dictionaryHtml.includes(marker), marker);
for (const type of types) assert.ok(renderPitDictionaryPage({ user: admin, items: dictionaries, type }).includes(type));
assert.ok(!dictionaryHtml.includes("<script>")); assert.deepEqual(movePitDictionaryId(["a", "b", "c"], "b", -1), ["b", "a", "c"]); assert.deepEqual(movePitDictionaryId(["a", "b", "c"], "c", 1), ["a", "b", "c"]);

const userHtml = renderPitUserPage({ user: admin, items: [admin, viewer] });
for (const marker of ["data-pit-user-create", "data-pit-user-role", "data-pit-user-toggle", "data-pit-user-reset", "data-pit-user-revoke"]) assert.ok(userHtml.includes(marker), marker);
assert.ok(!/passwordHash|password_hash|密码值/.test(userHtml)); assert.ok(!userHtml.includes("<script>"));
assert.ok(renderPitUserPage({ user: viewer }).includes("无权访问"));

const event: PitAuditEvent = { id: "a1", actor: admin, action: "user.update<script>", resourceType: "user", resourceId: "u1", before: { role: "viewer", passwordHash: "NEVER", nested: { csrfToken: "NO", safe: "yes<script>" } }, after: { role: "editor", sessionIds: ["NO"] }, metadata: null, createdAt: "2026-09-01T00:00:00Z" };
assert.deepEqual(redactPitAuditValue(event.before), { role: "viewer", nested: { safe: "yes<script>" } });
const auditHtml = renderPitAuditPage({ user: admin, users: [admin], page: { items: [event], page: 1, pageSize: 20, total: 1 }, query: { actorUserId: admin.id, resourceType: "user", action: "user.update", from: "2026-09-01", to: "2026-09-02" } });
for (const marker of ["actorUserId", "resourceType", "resourceId", "action", "name=\"from\"", "name=\"to\"", "查看脱敏差异", "Before", "After"]) assert.ok(auditHtml.includes(marker), marker);
assert.ok(!auditHtml.includes("NEVER") && !auditHtml.includes("<script>"));

const deleted: PitRequirementListItem = { id: "r/1", requirementNo: "REQ-1", jiraTicket: null, title: "删除<script>", summary: "内容", productLines: [], requirementType: null, source: null, problemCategory: null, industry: null, status: "review_pending", priority: null, owner: null, isHighlighted: false, following: false, sourceStatus: null, rowVersion: 1, deletedAt: "2026-09-01T00:00:00Z", deletedBy: { id: "evil", displayName: "删除人<img src=x onerror=alert(1)>" }, updatedAt: "2026-09-01T00:00:00Z" };
const trashHtml = renderPitTrashPage({ user: admin, data: { items: [deleted], page: 1, pageSize: 20, total: 1 } });
assert.ok(trashHtml.includes("data-pit-trash-restore") && trashHtml.includes("删除时间") && trashHtml.includes("删除人") && trashHtml.includes("?view=trash"));
assert.ok(trashHtml.includes("删除人&lt;img src=x onerror=alert(1)&gt;") && !trashHtml.includes("<img"), "deleted actor must render escaped");
assert.ok(renderPitTrashPage({ user: admin, data: { items: [{ ...deleted, deletedBy: null }], page: 1, pageSize: 20, total: 1 } }).includes("历史记录未保留"));
assert.ok(!trashHtml.includes("data-pit-trash-delete-permanently") && !trashHtml.includes("<script>")); assert.equal(pitTrashDetailHref("r/1"), "/pit/requirements/r%2F1?view=trash");

const source = (file: string) => readFileSync(new URL(`../src/pit/${file}`, import.meta.url), "utf8");
const dictionarySource = source("pit-dictionary-page.ts"); const userSource = source("pit-user-page.ts"); const auditSource = source("pit-audit-page.ts"); const trashSource = source("pit-trash-page.ts"); const shellSource = source("pit-shell.ts"); const detailSource = source("pit-requirement-detail-page.ts"); const apiSource = source("pit-api.ts");
const modalSource = source("pit-admin-modal.ts");
assert.ok(dictionarySource.includes("dictionaryUsage") && dictionarySource.includes("activeRequirementCount") && dictionarySource.includes("reorderDictionaries(requestedType, ordered"));
assert.ok(dictionarySource.includes("readonly aria-readonly") && dictionarySource.includes('role="dialog"') && dictionarySource.includes('aria-modal="true"'));
assert.ok(userSource.includes("oneTimePasswordDialog") && userSource.includes("navigator.clipboard.writeText") && userSource.includes("form.reset()"));
assert.ok(!userSource.includes("passwordHash") && userSource.includes("revokeUserSessions") && userSource.includes("resetUserPassword"));
assert.ok(auditSource.includes("AbortSignal") || auditSource.includes("lifetime.signal")); assert.ok(trashSource.includes('deleted: "only"'));
for (const pageSource of [dictionarySource, userSource, auditSource, trashSource]) assert.ok(pageSource.includes("createPitPageLifetime") && pageSource.includes("Abort"), "admin pages must stop stale/unmounted work");
assert.ok(shellSource.includes("bindPitDictionaryPage") && shellSource.includes("bindPitUserPage") && shellSource.includes("bindPitAuditPage") && shellSource.includes("bindPitTrashPage"));
assert.ok(shellSource.includes('window.addEventListener("pit:forbidden"') && shellSource.includes("pitApi.me()") && shellSource.includes("permissionChangeBanner") && shellSource.includes("PIT_DEFAULT_PATH"));
assert.ok(apiSource.includes("/usage") && apiSource.includes("activeRequirementCount"));
for (const pageSource of [dictionarySource, userSource, trashSource]) assert.ok(pageSource.includes("bindPitAdminModalAccessibility") && pageSource.includes("openPitAdminModal"));
for (const marker of ["queueMicrotask", "meaningfulFocus", 'event.key === "Escape"', 'event.key !== "Tab"', "event.shiftKey", "first.focus()", "last.focus()", "MutationObserver", "trigger.focus()", "WeakMap", "reference?.element.isConnected", "document.querySelector<HTMLElement>(reference.selector)"]) assert.ok(modalSource.includes(marker), marker);
assert.ok(userSource.includes("pitAdminModalTrigger") && userSource.includes("oneTimePasswordDialog(password), originalTrigger"), "one-time password must preserve a restorable opener reference across repaint");
assert.ok(dictionarySource.includes("const requestedType = activeType") && dictionarySource.includes("generation += 1") && dictionarySource.includes("entry.type !== requestedType"), "dictionary reorder must be scoped to the requested tab and stale-safe");
assert.ok(!detailSource.includes("window.confirm") && detailSource.includes("data-pit-detail-confirm") && detailSource.includes('aria-modal="true"'));
console.log("PIT administration UI verification passed.");
