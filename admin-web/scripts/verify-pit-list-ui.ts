import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  applyPitListFilterPatch,
  parsePitListQuery,
  pitMineListQuery,
  pitRequirementDetailHref,
  serializePitListQuery,
  setPitListPage,
} from "../src/pit/pit-list-query";
import {
  createPitRequestState,
  escapePitHtml,
  formatPitDate,
  pitRoleLabel,
  renderPitStatusBadge,
} from "../src/pit/pit-ui";
import { pitApi } from "../src/pit/pit-api";
import { pitDashboardRefreshDecision, renderPitDashboardPage } from "../src/pit/pit-dashboard-page";
import {
  pitListFilterDraftToPatch,
  pitListRefreshCanStart,
  pitListRefreshDecision,
  renderPitRequirementListPage,
} from "../src/pit/pit-requirement-list-page";
import type { PitDashboardSummary, PitRequirementList, PitUser } from "../src/pit/pit-types";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (relativePath: string): string => fs.readFileSync(path.join(root, relativePath), "utf8");

const repeated = parsePitListQuery("?status=review_pending&status=development&mine=true&page=2");
assert.deepEqual(repeated.status, ["review_pending", "development"]);
assert.equal(repeated.mine, true);
assert.equal(
  serializePitListQuery(repeated),
  "status=review_pending&status=development&mine=true&page=2&pageSize=20&sort=-updatedAt",
);

const complete = parsePitListQuery(
  "?q=%E6%94%B6%E9%93%B6&productLine=pl-1&productLine=pl-2&status=testing&priority=urgent&requirementType=type-1&problemCategory=problem-1&source=source-1&owner=user-1&highlighted=true&plannedYear=2026&plannedMonth=9&proposedFrom=2026-01-01&proposedTo=2026-12-31&followed=true&page=4&pageSize=50&sort=plannedDate",
);
assert.equal(parsePitListQuery(`?${serializePitListQuery(complete)}`).q, "收银");
assert.deepEqual(parsePitListQuery(`?${serializePitListQuery(complete)}`), complete);
assert.equal(complete.pageSize, 50);

const safe = parsePitListQuery(
  "?status=unknown&status=completed&priority=impossible&priority=high&page=0&pageSize=999&sort=title&plannedMonth=13&plannedMonth=10&proposedFrom=not-a-date&followed=nope&mine=true",
);
assert.deepEqual(safe.status, ["completed"]);
assert.deepEqual(safe.priority, ["high"]);
assert.deepEqual(safe.plannedMonth, [10]);
assert.equal(safe.page, 1);
assert.equal(safe.pageSize, 20);
assert.equal(safe.sort, "-updatedAt");
assert.equal(safe.proposedFrom, undefined);
assert.equal(safe.followed, undefined);
assert.equal(safe.mine, true);
const reversedDates = parsePitListQuery("?proposedFrom=2026-12-31&proposedTo=2026-01-01&status=testing");
assert.equal(reversedDates.proposedFrom, undefined);
assert.equal(reversedDates.proposedTo, undefined);
assert.deepEqual(reversedDates.status, ["testing"], "invalid ranges must not discard other supported filters");
assert.equal(parsePitListQuery("?mine=false&followed=false").mine, undefined, "false mine/followed flags are canonical no-ops");
assert.equal(parsePitListQuery("?highlighted=false").highlighted, false, "highlight false is a real server filter");
assert.equal(parsePitListQuery("?active=true&overdue=true").active, true);
assert.equal(parsePitListQuery("?active=true&overdue=true").overdue, true);
assert(serializePitListQuery(parsePitListQuery("?active=true&overdue=true")).includes("active=true&overdue=true"));

const mineQuery = pitMineListQuery();
assert.equal(mineQuery.mine, true);
assert.deepEqual(mineQuery.status, ["review_pending", "design_pending", "scheduling_pending", "development", "testing", "paused"]);
assert(!serializePitListQuery(mineQuery).includes("status=completed"));
assert(!serializePitListQuery(mineQuery).includes("status=rejected"));

assert.deepEqual(pitListFilterDraftToPatch({
  status: ["review_pending", "development"],
  plannedYear: ["2026"],
  plannedMonth: ["9", "10"],
  highlighted: ["false"],
}), {
  status: ["review_pending", "development"],
  plannedYear: [2026],
  plannedMonth: [9, 10],
  highlighted: false,
});
assert.deepEqual(pitListFilterDraftToPatch({ status: [] }), { status: undefined }, "draft cancellation/apply model must support clearing a group once");

assert.deepEqual(pitListRefreshDecision({ summarySucceeded: false, listSucceeded: false, interactionActive: false }), {
  action: "preserve",
  connectionInterrupted: true,
  writesEnabled: false,
});
assert.deepEqual(pitListRefreshDecision({ summarySucceeded: true, listSucceeded: true, interactionActive: true }), {
  action: "defer",
  connectionInterrupted: false,
  writesEnabled: true,
});
assert.deepEqual(pitListRefreshDecision({ summarySucceeded: true, listSucceeded: true, interactionActive: false }), {
  action: "apply",
  connectionInterrupted: false,
  writesEnabled: true,
});
assert.equal(
  pitListRefreshCanStart({ hasCurrentData: false, lifetimeAborted: false, pendingFollowCount: 0 }),
  false,
  "visibility/timer refresh must not abort an in-flight initial load",
);
assert.equal(
  pitListRefreshCanStart({ hasCurrentData: true, lifetimeAborted: false, pendingFollowCount: 0 }),
  true,
  "background refresh may start after initial data is committed",
);
assert.equal(
  pitListRefreshCanStart({ hasCurrentData: true, lifetimeAborted: false, pendingFollowCount: 1 }),
  false,
  "background refresh must wait for optimistic follow writes",
);
assert.equal(pitDashboardRefreshDecision(true), "defer", "focused dashboard cards must survive background refreshes");
assert.equal(pitDashboardRefreshDecision(false), "apply");

const filtered = applyPitListFilterPatch(complete, { status: ["completed"], followed: undefined });
assert.equal(filtered.page, 1, "filter changes must reset pagination");
assert.deepEqual(filtered.status, ["completed"]);
assert.equal(filtered.followed, undefined);
assert.equal(setPitListPage(filtered, 3).page, 3);
assert.equal(
  pitRequirementDetailHref("REQ id/1", filtered),
  `#/pit/requirements/REQ%20id%2F1?${serializePitListQuery(filtered)}`,
  "detail links must preserve the complete list query",
);

assert.equal(escapePitHtml(`<img src=x onerror="boom">&'`), "&lt;img src=x onerror=&quot;boom&quot;&gt;&amp;&#39;");
assert.equal(formatPitDate("2026-08-31T12:00:00.000Z", { includeTime: false }), "2026-08-31");
assert.equal(formatPitDate("not-a-date"), "—");
assert.equal(pitRoleLabel("viewer"), "只读者");
assert(!renderPitStatusBadge("review_pending", `<img onerror="boom">`).includes("<img"));
assert(renderPitStatusBadge("review_pending", "已打回").includes("源状态"));

const requestState = createPitRequestState();
const oldRequest = requestState.begin();
const latestRequest = requestState.begin();
assert.equal(requestState.isCurrent(oldRequest), false, "stale responses must be ignored");
assert.equal(requestState.isCurrent(latestRequest), true);
requestState.invalidate();
assert.equal(requestState.isCurrent(latestRequest), false, "mutations must invalidate in-flight refreshes");

const user = {
  id: "user-1",
  username: "operator",
  displayName: "运营 <img src=x>",
  role: "editor",
  active: true,
  createdAt: "2026-08-31T00:00:00.000Z",
  updatedAt: "2026-08-31T00:00:00.000Z",
} satisfies PitUser;
const summary: PitDashboardSummary = {
  total: 12,
  review: 2,
  schedulingPending: 1,
  development: 3,
  testing: 2,
  completed: 4,
  highlighted: 2,
  mine: 5,
  followed: 3,
  overdue: 1,
  byStatus: { review_pending: 2, development: 3, testing: 2, completed: 4 },
};

const originalFetch = globalThis.fetch;
try {
  const controller = new AbortController();
  let capturedSignal: AbortSignal | null | undefined;
  globalThis.fetch = async (_input, init) => {
    capturedSignal = init?.signal;
    return new Response(JSON.stringify({ data: summary, meta: { requestId: "req_abort_contract" } }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  };
  await pitApi.dashboardSummary({ signal: controller.signal });
  assert.equal(capturedSignal, controller.signal, "dashboard requests must forward the generation AbortSignal");

  await pitApi.listDictionaries({}, { signal: controller.signal });
  assert.equal(capturedSignal, controller.signal, "dictionary requests must forward the initialization AbortSignal");
  await pitApi.listUsers({ signal: controller.signal });
  assert.equal(capturedSignal, controller.signal, "user requests must forward the initialization AbortSignal");

  const abortError = Object.assign(new Error("superseded"), { name: "AbortError" });
  globalThis.fetch = async () => { throw abortError; };
  await assert.rejects(
    pitApi.listRequirements(parsePitListQuery(""), { signal: controller.signal }),
    (error: unknown) => error === abortError,
    "AbortError must remain distinguishable from an offline/network failure",
  );
} finally {
  globalThis.fetch = originalFetch;
}
const list: PitRequirementList = {
  page: 1,
  pageSize: 20,
  total: 1,
  items: [{
    id: "req-1",
    requirementNo: "REQ-000001",
    jiraTicket: "PIT-1",
    title: `<script>alert("unsafe")</script>`,
    summary: "支付场景",
    productLines: [{ id: "pl-1", code: "pay", label: "支付" }],
    requirementType: { id: "type-1", code: "feature", label: "功能" },
    source: null,
    sourceStatus: `<img src=x onerror="source-boom">`,
    problemCategory: null,
    industry: null,
    status: "development",
    priority: "high",
    owner: { id: "user-1", displayName: "产品经理" },
    isHighlighted: true,
    following: false,
    rowVersion: 1,
    deletedAt: null,
    updatedAt: "2026-08-31T12:00:00.000Z",
  }],
};

const dashboard = renderPitDashboardPage(summary);
for (const label of ["全部活跃", "待评审", "开发 / 测试", "已完成", "重点需求", "待我处理", "我关注的", "已逾期"]) {
  assert(dashboard.includes(label), `dashboard missing ${label}`);
}
assert(dashboard.includes("status=review_pending"));
assert(dashboard.includes("highlighted=true"));
assert(dashboard.includes("mine=true"));
assert(dashboard.includes("followed=true"));
assert(dashboard.includes("active=true"), "all-active dashboard card must use the real active server filter");
assert(dashboard.includes("overdue=true"), "overdue dashboard card must use the real overdue server filter");

const listHtml = renderPitRequirementListPage({ query: parsePitListQuery(""), user, summary, list, dictionaries: [], users: [] });
assert(!listHtml.includes("<script>alert"), "API text must always be HTML escaped");
assert(!listHtml.includes('<img src=x onerror="source-boom">'), "source status tooltip must escape imported API text");
assert(listHtml.includes("源状态：&lt;img src=x onerror=&quot;source-boom&quot;&gt;"), "list must expose the real source status in the normalized status tooltip");
assert(listHtml.includes("#/pit/exports?page=1&amp;pageSize=20&amp;sort=-updatedAt"), "export navigation must preserve the current canonical list query");
for (const contract of [
  'aria-label="PIT 需求列表"',
  "data-pit-filter-popover",
  "data-pit-filter-apply",
  "data-pit-filter-cancel",
  "data-pit-applied-filters",
  "data-pit-quick-view",
  "data-pit-sort",
  "data-pit-page-size",
  "data-pit-pagination",
  "focus-visible:ring",
  "data-pit-follow",
]) assert(listHtml.includes(contract), `list markup missing ${contract}`);

const viewerHtml = renderPitRequirementListPage({ query: parsePitListQuery(""), user: { ...user, role: "viewer" }, summary, list, dictionaries: [], users: [] });
assert(!viewerHtml.includes("data-pit-follow"), "viewer must not receive follow controls");
assert(viewerHtml.includes("没有符合当前条件的需求") === false);
assert(renderPitRequirementListPage({ query: parsePitListQuery(""), user, summary, list: { ...list, items: [], total: 0 }, dictionaries: [], users: [] }).includes("没有符合当前条件的需求"));

const listSource = read("src/pit/pit-requirement-list-page.ts");
assert(listSource.includes("30_000"), "visible-tab refresh interval must be 30 seconds");
assert(listSource.includes('document.visibilityState === "visible"'), "hidden tabs must not refresh");
assert(listSource.includes("data-pit-list-results"), "background refresh must target results independently");
assert(listSource.includes("data-pit-list-summary"), "background refresh must target summary independently");
assert(!/background[\s\S]{0,220}innerHTML\s*=\s*renderPitRequirementListPage/.test(listSource), "background refresh must not replace active filter inputs");
assert(listSource.includes("requestState.isCurrent"), "list responses need stale-response protection");
assert(listSource.includes("previousFollowing"), "follow failures need an explicit optimistic rollback snapshot");
assert(listSource.includes("isPitApiError(error) ? error.message"), "follow errors must surface the returned API message");
assert(listSource.includes("data-pit-list-connection-banner"), "background failures need a persistent retry banner");
assert(listSource.includes("setWriteActionsEnabled"), "connection failures must disable all list write controls");
assert(listSource.includes("deferredRefresh"), "focused result interactions must defer background DOM replacement");

const shell = read("src/pit/pit-shell.ts");
assert(shell.includes("renderPitDashboardPage"));
assert(shell.includes("bindPitDashboardPage"));
assert(shell.includes("renderPitRequirementListLoadingPage"));
assert(shell.includes("bindPitRequirementListPage"));
assert(shell.includes('aria-current="page"'), "shell navigation must keep aria-current");

console.log("PIT list UI verification passed");
