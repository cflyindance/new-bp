/**
 * M 平台 · 企业级硬件资产中心 · 页面 UI
 */
import { getDemoScopeStores } from "../auth/session-scope";
import { listMPlatformStoreScopeEntries } from "../permissions/m-platform-store-scope";
import { getMerchantsForSelect } from "./enterprise-merchant-store";
import {
  ENTERPRISE_HARDWARE_DEVICES_PATH,
  ENTERPRISE_HARDWARE_ROUTE_PREFIX,
  getActiveEnterpriseDeviceType,
  hardwareDevicesByTypeHref,
  hardwareHref,
  isEnterpriseDeviceDetailPath,
  isEnterpriseDevicesByTypePath,
} from "./enterprise-hardware-scope";
import {
  countEnterpriseDevicesByType,
  exportDevicesCsv,
  filterEnterpriseDevices,
  formatRelativeLastSeen,
  ENTERPRISE_HARDWARE_TYPE_NAV,
  getDeviceTypeLabel,
  getDeviceTypeNavTitle,
  getEnterpriseAlerts,
  getEnterpriseDeviceByUid,
  getEnterpriseDevices,
  getEnterpriseOverviewStats,
  getEnterpriseStoreById,
  getEnterpriseStores,
  getHealthLabel,
  getMobileOsLabel,
  inferMobileOsFromSystemVersion,
  isMobileTerminalDevice,
  getStatusLabel,
  getStoreStatusLabel,
} from "./enterprise-hardware-store";
import type {
  EnterpriseDevice,
  EnterpriseDeviceFilter,
  EnterpriseDeviceType,
  EnterpriseHardwareAlert,
} from "./enterprise-hardware-types";

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function statusBadgeClass(status: EnterpriseDevice["status"]): string {
  if (status === "online") return "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400";
  if (status === "offline") return "bg-destructive/15 text-destructive";
  return "bg-muted text-muted-foreground";
}

function healthBadgeClass(health: EnterpriseDevice["health"]): string {
  if (health === "ok") return "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400";
  if (health === "warn") return "bg-amber-500/15 text-amber-700 dark:text-amber-400";
  return "bg-destructive/15 text-destructive";
}

function alertSeverityClass(severity: EnterpriseHardwareAlert["severity"]): string {
  if (severity === "critical") return "bg-destructive/15 text-destructive";
  if (severity === "warn") return "bg-amber-500/15 text-amber-700 dark:text-amber-400";
  return "bg-muted text-muted-foreground";
}

function cardShell(content: string): string {
  return `<div class="rounded-xl border border-border bg-card p-4 shadow-sm">${content}</div>`;
}

function renderFilterBar(
  filter: EnterpriseDeviceFilter,
  idPrefix: string,
  options: { includeDeviceType?: boolean; fixedDeviceType?: EnterpriseDeviceType } = {},
): string {
  const statuses = ["", "online", "offline", "unknown"] as const;
  const { includeDeviceType = false, fixedDeviceType } = options;

  const select = (name: string, label: string, optionsList: { value: string; label: string }[]) => `
    <label class="flex min-w-[8rem] flex-col gap-1">
      <span class="text-xs text-muted-foreground">${escapeHtml(label)}</span>
      <select
        name="${name}"
        data-enterprise-hw-filter="${name}"
        class="h-9 rounded-md border border-input bg-background px-2 text-sm"
      >
        ${optionsList
          .map(
            (o) =>
              `<option value="${escapeHtml(o.value)}"${filter[name as keyof EnterpriseDeviceFilter] === o.value ? " selected" : ""}>${escapeHtml(o.label)}</option>`,
          )
          .join("")}
      </select>
    </label>`;

  const deviceTypeField = includeDeviceType
    ? select(
        "deviceType",
        "设备类型",
        [
          { value: "", label: "全部类型" },
          ...ENTERPRISE_HARDWARE_TYPE_NAV.map((item) => ({
            value: item.deviceType,
            label: item.title,
          })),
        ],
      )
    : "";

  return `
    <form
      id="${idPrefix}-filter-form"
      class="flex flex-wrap items-end gap-3 rounded-xl border border-border bg-card p-4"
      data-enterprise-hw-filter-form
      ${fixedDeviceType ? `data-enterprise-hw-fixed-type="${escapeHtml(fixedDeviceType)}"` : ""}
    >
      ${deviceTypeField}
      ${select(
        "merchantId",
        "入驻品牌",
        [{ value: "", label: "全部品牌" }, ...getMerchantsForSelect().map((m) => ({ value: m.merchantId, label: m.name }))],
      )}
      ${select(
        "brandId",
        "品牌",
        [
          { value: "", label: "全部品牌" },
          ...getMerchantsForSelect().map((m) => ({ value: m.merchantId, label: m.name })),
        ],
      )}
      ${select(
        "regionId",
        "区域",
        [
          { value: "", label: "全部区域" },
          ...Array.from(
            new Set(listMPlatformStoreScopeEntries().map((e) => e.regionName).filter(Boolean)),
          ).map((name) => ({ value: name, label: name })),
        ],
      )}
      ${select(
        "storeId",
        "门店",
        getDemoScopeStores().map((s) => ({ value: s.value, label: s.labelZh })),
      )}
      ${select(
        "status",
        "连接状态",
        statuses.map((s) => ({
          value: s,
          label: s ? getStatusLabel(s) : "全部状态",
        })),
      )}
      <label class="flex min-w-[10rem] flex-1 flex-col gap-1">
        <span class="text-xs text-muted-foreground">搜索</span>
        <input
          type="search"
          name="query"
          data-enterprise-hw-filter="query"
          value="${escapeHtml(filter.query ?? "")}"
          placeholder="名称 / SN / 设备 ID"
          class="h-9 rounded-md border border-input bg-background px-3 text-sm"
        />
      </label>
      <button
        type="button"
        data-enterprise-hw-export
        class="inline-flex h-9 items-center rounded-md border border-border bg-background px-3 text-sm font-medium hover:bg-muted"
      >导出 CSV</button>
    </form>`;
}

function renderDevicesViewModeTabs(activeMode: "all" | "by-type"): string {
  const tabClass = (active: boolean) =>
    active
      ? "inline-flex h-9 items-center rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground"
      : "inline-flex h-9 items-center rounded-md px-3 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground";

  return `
    <div class="inline-flex shrink-0 items-center gap-1 rounded-lg border border-border bg-muted/40 p-1" role="tablist" aria-label="全量设备查看方式">
      <a href="${hardwareHref("/devices")}" role="tab" aria-selected="${activeMode === "all" ? "true" : "false"}" class="${tabClass(activeMode === "all")}">全量设备</a>
      <a href="${hardwareHref("/devices/by-type")}" role="tab" aria-selected="${activeMode === "by-type" ? "true" : "false"}" class="${tabClass(activeMode === "by-type")}">设备类型</a>
    </div>`;
}

function renderDeviceTypeSidebar(activeType: EnterpriseDeviceType): string {
  const counts = countEnterpriseDevicesByType();
  return `
    <nav
      class="enterprise-hardware-type-subnav w-52 shrink-0 overflow-y-auto border-r border-border pr-4"
      aria-label="硬件类型"
    >
      <p class="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">硬件类型</p>
      <ul class="space-y-0.5" role="list">
        ${ENTERPRISE_HARDWARE_TYPE_NAV.map((item) => {
          const selected = item.deviceType === activeType;
          const count = counts[item.deviceType] ?? 0;
          return `
        <li>
          <a
            href="${hardwareDevicesByTypeHref(item.deviceType)}"
            class="flex min-h-9 items-center justify-between gap-2 rounded-md px-2.5 py-1.5 text-sm transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
              selected
                ? "bg-primary/10 font-medium text-primary"
                : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
            }"
            ${selected ? 'aria-current="page"' : ""}
          >
            <span class="truncate">${escapeHtml(item.title)}</span>
            <span class="shrink-0 tabular-nums text-xs ${selected ? "text-primary" : "text-muted-foreground"}">${count}</span>
          </a>
        </li>`;
        }).join("")}
      </ul>
    </nav>`;
}

function cellText(value: string | undefined, mono = false): string {
  const text = value?.trim() ? escapeHtml(value) : "—";
  return mono ? `<span class="font-mono text-xs">${text}</span>` : text;
}

function resolveDeviceMobileOs(device: EnterpriseDevice): string {
  return getMobileOsLabel(device.mobileOs ?? inferMobileOsFromSystemVersion(device.systemVersion));
}

function renderVersionOrTerminalCell(device: EnterpriseDevice): string {
  if (!isMobileTerminalDevice(device)) {
    return `<td class="px-3 py-2.5 text-xs text-muted-foreground">${cellText(device.appVersion)}</td>`;
  }
  return `
    <td class="px-3 py-2.5 text-xs text-muted-foreground">
      <div class="space-y-0.5">
        <p><span class="text-foreground/80">${escapeHtml(resolveDeviceMobileOs(device))}</span></p>
        <p>Webview ${cellText(device.webviewVersion)}</p>
        <p>APP ${cellText(device.appVersion)}</p>
        <p>系统 ${cellText(device.systemVersion)}</p>
        <p>${cellText(device.screenResolution)} · ${cellText(device.timezone)}</p>
      </div>
    </td>`;
}

function renderDeviceTable(
  devices: EnterpriseDevice[],
  options: { showStore?: boolean; showType?: boolean; mobileTerminalLayout?: boolean } = {},
): string {
  const { showStore = true, showType = true, mobileTerminalLayout = false } = options;
  const stores = getEnterpriseStores();
  if (devices.length === 0) {
    return `<p class="py-8 text-center text-sm text-muted-foreground">暂无匹配设备</p>`;
  }

  if (mobileTerminalLayout) {
    return `
    <div class="overflow-x-auto rounded-xl border border-border">
      <table class="w-full min-w-[72rem] text-sm">
        <thead class="border-b border-border bg-muted/40 text-left text-xs text-muted-foreground">
          <tr>
            ${showStore ? "<th class=\"px-3 py-2.5 font-medium\">门店</th>" : ""}
            ${showType ? "<th class=\"px-3 py-2.5 font-medium\">类型</th>" : ""}
            <th class="px-3 py-2.5 font-medium">名称</th>
            <th class="px-3 py-2.5 font-medium">SN / ID</th>
            <th class="px-3 py-2.5 font-medium">状态</th>
            <th class="px-3 py-2.5 font-medium">健康度</th>
            <th class="px-3 py-2.5 font-medium">最后活跃</th>
            <th class="px-3 py-2.5 font-medium">系统平台</th>
            <th class="px-3 py-2.5 font-medium">Webview版本</th>
            <th class="px-3 py-2.5 font-medium">APP版本</th>
            <th class="px-3 py-2.5 font-medium">系统版本</th>
            <th class="px-3 py-2.5 font-medium">屏幕分辨率</th>
            <th class="px-3 py-2.5 font-medium">硬件时区</th>
            <th class="px-3 py-2.5 font-medium w-24"></th>
          </tr>
        </thead>
        <tbody class="divide-y divide-border">
          ${devices
            .map((d) => {
              const store = stores.find((s) => s.storeId === d.storeId);
              return `
            <tr class="hover:bg-muted/30" data-enterprise-hw-device-row="${escapeHtml(d.uid)}">
              ${showStore ? `<td class="px-3 py-2.5"><a href="${hardwareHref(`/stores/${encodeURIComponent(d.storeId)}`)}" class="text-primary hover:underline">${escapeHtml(store?.storeName ?? d.storeId)}</a></td>` : ""}
              ${showType ? `<td class="px-3 py-2.5">${escapeHtml(getDeviceTypeLabel(d.deviceType))}</td>` : ""}
              <td class="px-3 py-2.5 font-medium text-card-foreground">
                ${d.critical ? '<span class="mr-1 text-amber-600" title="关键设备">★</span>' : ""}
                ${escapeHtml(d.name)}
              </td>
              <td class="px-3 py-2.5 font-mono text-xs text-muted-foreground">${escapeHtml(d.sn)}<br/>${escapeHtml(d.deviceId)}</td>
              <td class="px-3 py-2.5"><span class="inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${statusBadgeClass(d.status)}">${escapeHtml(getStatusLabel(d.status))}</span></td>
              <td class="px-3 py-2.5"><span class="inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${healthBadgeClass(d.health)}">${escapeHtml(getHealthLabel(d.health))}</span></td>
              <td class="px-3 py-2.5 text-muted-foreground">${escapeHtml(formatRelativeLastSeen(d.lastSeenAt))}</td>
              <td class="px-3 py-2.5">${cellText(resolveDeviceMobileOs(d))}</td>
              <td class="px-3 py-2.5">${cellText(d.webviewVersion)}</td>
              <td class="px-3 py-2.5">${cellText(d.appVersion, true)}</td>
              <td class="px-3 py-2.5">${cellText(d.systemVersion)}</td>
              <td class="px-3 py-2.5">${cellText(d.screenResolution)}</td>
              <td class="px-3 py-2.5">${cellText(d.timezone)}</td>
              <td class="px-3 py-2.5">
                <a href="${hardwareHref(`/devices/${encodeURIComponent(d.uid)}`)}" class="text-primary text-xs hover:underline">详情</a>
              </td>
            </tr>`;
            })
            .join("")}
        </tbody>
      </table>
    </div>`;
  }

  const versionHeader = devices.some(isMobileTerminalDevice) ? "版本 / 终端" : "版本";
  return `
    <div class="overflow-x-auto rounded-xl border border-border">
      <table class="w-full min-w-[56rem] text-sm">
        <thead class="border-b border-border bg-muted/40 text-left text-xs text-muted-foreground">
          <tr>
            ${showStore ? "<th class=\"px-3 py-2.5 font-medium\">门店</th>" : ""}
            ${showType ? "<th class=\"px-3 py-2.5 font-medium\">类型</th>" : ""}
            <th class="px-3 py-2.5 font-medium">名称</th>
            <th class="px-3 py-2.5 font-medium">SN / ID</th>
            <th class="px-3 py-2.5 font-medium">状态</th>
            <th class="px-3 py-2.5 font-medium">健康度</th>
            <th class="px-3 py-2.5 font-medium">最后活跃</th>
            <th class="px-3 py-2.5 font-medium">${escapeHtml(versionHeader)}</th>
            <th class="px-3 py-2.5 font-medium w-24"></th>
          </tr>
        </thead>
        <tbody class="divide-y divide-border">
          ${devices
            .map((d) => {
              const store = stores.find((s) => s.storeId === d.storeId);
              return `
            <tr class="hover:bg-muted/30" data-enterprise-hw-device-row="${escapeHtml(d.uid)}">
              ${showStore ? `<td class="px-3 py-2.5"><a href="${hardwareHref(`/stores/${encodeURIComponent(d.storeId)}`)}" class="text-primary hover:underline">${escapeHtml(store?.storeName ?? d.storeId)}</a></td>` : ""}
              ${showType ? `<td class="px-3 py-2.5">${escapeHtml(getDeviceTypeLabel(d.deviceType))}</td>` : ""}
              <td class="px-3 py-2.5 font-medium text-card-foreground">
                ${d.critical ? '<span class="mr-1 text-amber-600" title="关键设备">★</span>' : ""}
                ${escapeHtml(d.name)}
              </td>
              <td class="px-3 py-2.5 font-mono text-xs text-muted-foreground">${escapeHtml(d.sn)}<br/>${escapeHtml(d.deviceId)}</td>
              <td class="px-3 py-2.5"><span class="inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${statusBadgeClass(d.status)}">${escapeHtml(getStatusLabel(d.status))}</span></td>
              <td class="px-3 py-2.5"><span class="inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${healthBadgeClass(d.health)}">${escapeHtml(getHealthLabel(d.health))}</span></td>
              <td class="px-3 py-2.5 text-muted-foreground">${escapeHtml(formatRelativeLastSeen(d.lastSeenAt))}</td>
              ${renderVersionOrTerminalCell(d)}
              <td class="px-3 py-2.5">
                <a href="${hardwareHref(`/devices/${encodeURIComponent(d.uid)}`)}" class="text-primary text-xs hover:underline">详情</a>
              </td>
            </tr>`;
            })
            .join("")}
        </tbody>
      </table>
    </div>`;
}

function renderOverviewPage(): string {
  const stats = getEnterpriseOverviewStats();
  const typeEntries = Object.entries(stats.byType).filter(([, n]) => n > 0);

  const kpi = (label: string, value: string | number, sub?: string) => `
    <div class="rounded-xl border border-border bg-card p-4">
      <p class="text-xs text-muted-foreground">${escapeHtml(label)}</p>
      <p class="mt-1 text-2xl font-semibold tabular-nums text-card-foreground">${escapeHtml(String(value))}</p>
      ${sub ? `<p class="mt-1 text-xs text-muted-foreground">${escapeHtml(sub)}</p>` : ""}
    </div>`;

  return `
    <div class="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto">
      <p class="text-sm text-muted-foreground">
        跨门店硬件资产与运行态势 · 只读监控；设备配置请在商家后台「硬件管理中心」维护。
      </p>
      <div class="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        ${kpi("设备总数", stats.totalDevices)}
        ${kpi("在线率", `${stats.onlineRate}%`, `在线 ${stats.onlineCount} · 离线 ${stats.offlineCount}`)}
        ${kpi("未解决告警", stats.alertCount, "点击查看告警中心")}
        ${kpi("故障设备", stats.criticalDeviceCount, "健康度为故障")}
      </div>
      <div class="grid gap-4 lg:grid-cols-2">
        ${cardShell(`
          <h2 class="text-sm font-semibold text-card-foreground">按类型分布</h2>
          <ul class="mt-3 space-y-2">
            ${typeEntries
              .map(
                ([type, count]) =>
                  `<li class="flex items-center justify-between text-sm"><span>${escapeHtml(getDeviceTypeLabel(type as EnterpriseDeviceType))}</span><span class="font-medium tabular-nums">${count}</span></li>`,
              )
              .join("")}
          </ul>
          <a href="${hardwareHref("/devices")}" class="mt-4 inline-flex text-sm text-primary hover:underline">查看全量设备 →</a>
        `)}
        ${cardShell(`
          <h2 class="text-sm font-semibold text-card-foreground">Top 风险门店</h2>
          ${
            stats.topRiskStores.length === 0
              ? '<p class="mt-3 text-sm text-muted-foreground">暂无风险门店</p>'
              : `<ul class="mt-3 space-y-2">
            ${stats.topRiskStores
              .map(
                (s) =>
                  `<li class="flex items-center justify-between gap-2 text-sm">
                <a href="${hardwareHref(`/stores/${encodeURIComponent(s.storeId)}`)}" class="text-primary hover:underline truncate">${escapeHtml(s.storeName)}</a>
                <span class="shrink-0 text-xs text-muted-foreground">离线 ${s.offlineCount} · 告警 ${s.alertCount}</span>
              </li>`,
              )
              .join("")}
          </ul>`
          }
          <a href="${hardwareHref("/alerts")}" class="mt-4 inline-flex text-sm text-primary hover:underline">查看告警 →</a>
        `)}
      </div>
      ${cardShell(`
        <div class="flex flex-wrap items-center justify-between gap-2">
          <h2 class="text-sm font-semibold text-card-foreground">最近离线 / 异常设备</h2>
          <a href="${hardwareHref("/devices")}?status=offline" class="text-sm text-primary hover:underline">全部离线设备</a>
        </div>
        <div class="mt-3">
          ${renderDeviceTable(
            getEnterpriseDevices()
              .filter((d) => d.status !== "online")
              .slice(0, 5),
          )}
        </div>
      `)}
    </div>`;
}

function renderDevicesAllPage(): string {
  return `
    <div class="flex min-h-0 flex-1 flex-col gap-4 overflow-hidden" data-enterprise-hw-page="devices-all">
      <div class="flex shrink-0 flex-wrap items-center justify-between gap-3">
        ${renderDevicesViewModeTabs("all")}
        <p class="text-sm text-muted-foreground">
          一张表检索全企业设备；支持品牌 / 区域 / 门店 / 状态筛选与 CSV 导出。
        </p>
      </div>
      ${renderFilterBar({}, "devices-all")}
      <div class="min-h-0 flex-1 overflow-y-auto" data-enterprise-hw-device-table>
        ${renderDeviceTable(getEnterpriseDevices())}
      </div>
    </div>`;
}

function renderDevicesByTypePage(path: string): string {
  const activeType = getActiveEnterpriseDeviceType(path)!;
  const typeTitle = getDeviceTypeNavTitle(activeType);
  const devices = filterEnterpriseDevices({ deviceType: activeType });
  const online = devices.filter((d) => d.status === "online").length;

  return `
    <div class="flex min-h-0 flex-1 flex-col gap-4 overflow-hidden" data-enterprise-hw-page="devices-by-type">
      <div class="flex shrink-0 flex-wrap items-center justify-between gap-3">
        ${renderDevicesViewModeTabs("by-type")}
        <p class="text-sm text-muted-foreground">
          按硬件类型分类查看，布局与商家后台「硬件管理中心」一致。
        </p>
      </div>
      <div class="flex min-h-0 flex-1 gap-4 overflow-hidden">
        ${renderDeviceTypeSidebar(activeType)}
        <div class="flex min-h-0 min-w-0 flex-1 flex-col gap-4 overflow-hidden">
          <div class="shrink-0 rounded-xl border border-border bg-card px-4 py-3">
            <h2 class="text-sm font-semibold text-card-foreground">${escapeHtml(typeTitle)}</h2>
            <p class="mt-1 text-xs text-muted-foreground">共 ${devices.length} 台 · 在线 ${online} 台</p>
          </div>
          ${renderFilterBar({}, "devices-by-type", { fixedDeviceType: activeType })}
          <div class="min-h-0 flex-1 overflow-y-auto" data-enterprise-hw-device-table>
            ${renderDeviceTable(devices, {
              showType: false,
              mobileTerminalLayout: activeType === "kiosk" || activeType === "emenu",
            })}
          </div>
        </div>
      </div>
    </div>`;
}

function renderDevicesPage(path: string): string {
  if (isEnterpriseDevicesByTypePath(path)) {
    return renderDevicesByTypePage(path);
  }
  return renderDevicesAllPage();
}

function renderAlertsPage(): string {
  const alerts = getEnterpriseAlerts().filter((a) => !a.resolved);
  const stores = getEnterpriseStores();
  return `
    <div class="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto">
      <p class="text-sm text-muted-foreground">
        企业值班台 · 离线、版本、许可证等告警汇总（演示数据）。
      </p>
      ${
        alerts.length === 0
          ? cardShell('<p class="text-sm text-muted-foreground">暂无未解决告警</p>')
          : `<div class="space-y-2">
        ${alerts
          .map((a) => {
            const store = stores.find((s) => s.storeId === a.storeId);
            return `
          <div class="rounded-xl border border-border bg-card p-4">
            <div class="flex flex-wrap items-start justify-between gap-2">
              <div class="min-w-0">
                <div class="flex flex-wrap items-center gap-2">
                  <span class="inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${alertSeverityClass(a.severity)}">${escapeHtml(a.severity === "critical" ? "严重" : a.severity === "warn" ? "警告" : "信息")}</span>
                  <span class="text-sm font-medium text-card-foreground">${escapeHtml(a.title)}</span>
                </div>
                <p class="mt-1 text-sm text-muted-foreground">${escapeHtml(a.detail)}</p>
                <p class="mt-2 text-xs text-muted-foreground">${escapeHtml(store?.storeName ?? a.storeId)} · ${escapeHtml(formatRelativeLastSeen(a.openedAt))}</p>
              </div>
              <a href="${hardwareHref(`/devices/${encodeURIComponent(a.deviceUid)}`)}" class="shrink-0 text-sm text-primary hover:underline">查看设备</a>
            </div>
          </div>`;
          })
          .join("")}
      </div>`
      }
    </div>`;
}

function renderDeviceDetailPage(uid: string): string {
  const device = getEnterpriseDeviceByUid(uid);
  if (!device) {
    return cardShell(`<p class="text-sm text-muted-foreground">未找到设备 <code>${escapeHtml(uid)}</code></p>`);
  }
  const store = getEnterpriseStoreById(device.storeId);
  const deviceAlerts = getEnterpriseAlerts().filter((a) => a.deviceUid === uid && !a.resolved);

  const row = (label: string, value: string) =>
    `<div class="grid gap-1 sm:grid-cols-[8rem_1fr] sm:gap-4 py-2 border-b border-border last:border-0">
      <dt class="text-xs text-muted-foreground">${escapeHtml(label)}</dt>
      <dd class="text-sm text-card-foreground">${value}</dd>
    </div>`;

  const mobileTerminalSection = isMobileTerminalDevice(device)
    ? cardShell(`
          <h2 class="text-sm font-semibold text-card-foreground">移动终端信息</h2>
          <dl class="mt-2">
            ${row("系统平台", escapeHtml(resolveDeviceMobileOs(device)))}
            ${row("Webview 版本", cellText(device.webviewVersion))}
            ${row("APP 版本", cellText(device.appVersion, true))}
            ${device.shellVersion ? row("壳子版本", cellText(device.shellVersion, true)) : ""}
            ${row("系统版本", cellText(device.systemVersion))}
            ${row("屏幕分辨率", cellText(device.screenResolution))}
            ${row("硬件时区", cellText(device.timezone))}
          </dl>
        `)
    : "";

  return `
    <div class="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto">
      <div class="flex flex-wrap items-center gap-2">
        <a href="${hardwareHref("/devices")}" class="text-sm text-primary hover:underline">← 返回全量设备</a>
      </div>
      <div class="grid gap-4 lg:grid-cols-2">
        ${cardShell(`
          <h2 class="text-sm font-semibold text-card-foreground">基本信息</h2>
          <dl class="mt-2">
            ${row("名称", escapeHtml(device.name))}
            ${row("类型", escapeHtml(getDeviceTypeLabel(device.deviceType)))}
            ${row("SN", `<span class="font-mono text-xs">${escapeHtml(device.sn)}</span>`)}
            ${row("设备 ID", `<span class="font-mono text-xs">${escapeHtml(device.deviceId)}</span>`)}
            ${device.brand ? row("品牌 / 型号", escapeHtml(`${device.brand}${device.model ? ` · ${device.model}` : ""}`)) : ""}
            ${device.area ? row("物理区域", escapeHtml(device.area)) : ""}
            ${row("关键设备", device.critical ? "是" : "否")}
            ${row("数据来源", device.source === "terminal-report" ? "终端上报" : "门店手工配置")}
          </dl>
        `)}
        ${cardShell(`
          <h2 class="text-sm font-semibold text-card-foreground">归属与状态</h2>
          <dl class="mt-2">
            ${row("门店", `<a href="${hardwareHref(`/stores/${encodeURIComponent(device.storeId)}`)}" class="text-primary hover:underline">${escapeHtml(store?.storeName ?? device.storeId)}</a>`)}
            ${store ? row("品牌 / 区域", escapeHtml(`${store.brandName} · ${store.regionName}`)) : ""}
            ${store ? row("门店状态", escapeHtml(getStoreStatusLabel(store.storeStatus))) : ""}
            ${row("连接状态", `<span class="inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${statusBadgeClass(device.status)}">${escapeHtml(getStatusLabel(device.status))}</span>`)}
            ${row("健康度", `<span class="inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${healthBadgeClass(device.health)}">${escapeHtml(getHealthLabel(device.health))}</span>`)}
            ${row("最后活跃", escapeHtml(formatRelativeLastSeen(device.lastSeenAt)))}
            ${!isMobileTerminalDevice(device) && device.appVersion ? row("App 版本", escapeHtml(device.appVersion)) : ""}
            ${!isMobileTerminalDevice(device) && device.shellVersion ? row("Shell 版本", escapeHtml(device.shellVersion)) : ""}
            ${!isMobileTerminalDevice(device) && device.systemVersion ? row("系统版本", escapeHtml(device.systemVersion)) : ""}
            ${device.licenseType ? row("License", escapeHtml(`${device.licenseType}${device.licenseExpiresAt ? ` · 到期 ${device.licenseExpiresAt}` : ""}`)) : ""}
          </dl>
        `)}
      </div>
      ${mobileTerminalSection}
      ${
        deviceAlerts.length > 0
          ? cardShell(`
          <h2 class="text-sm font-semibold text-card-foreground">相关告警</h2>
          <ul class="mt-2 space-y-2">
            ${deviceAlerts
              .map(
                (a) =>
                  `<li class="text-sm"><span class="font-medium">${escapeHtml(a.title)}</span><span class="text-muted-foreground"> — ${escapeHtml(a.detail)}</span></li>`,
              )
              .join("")}
          </ul>`)
          : ""
      }
      <div class="flex flex-wrap gap-2">
        <a
          href="${device.merchantEditPath}"
          data-enterprise-hw-merchant-link
          class="inline-flex h-9 items-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >在商家后台打开配置</a>
      </div>
    </div>`;
}

function renderStorePage(storeId: string): string {
  const store = getEnterpriseStoreById(storeId);
  if (!store) {
    return cardShell(`<p class="text-sm text-muted-foreground">未找到门店 <code>${escapeHtml(storeId)}</code></p>`);
  }
  const devices = filterEnterpriseDevices({ storeId });
  const online = devices.filter((d) => d.status === "online").length;
  const alerts = getEnterpriseAlerts().filter((a) => a.storeId === storeId && !a.resolved);

  return `
    <div class="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto">
      <a href="${hardwareHref("/devices")}" class="text-sm text-primary hover:underline">← 返回全量设备</a>
      ${cardShell(`
        <div class="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 class="text-lg font-semibold text-card-foreground">${escapeHtml(store.storeName)}</h2>
            <p class="mt-1 text-sm text-muted-foreground">${escapeHtml(store.brandName)} · ${escapeHtml(store.regionName)} · ${escapeHtml(getStoreStatusLabel(store.storeStatus))}</p>
          </div>
          <div class="text-right text-sm">
            <p>设备 ${devices.length} 台 · 在线 ${online} 台</p>
            <p class="text-muted-foreground">未解决告警 ${alerts.length} 条</p>
          </div>
        </div>
      `)}
      ${renderDeviceTable(devices, { showStore: false })}
    </div>`;
}

export function renderEnterpriseHardwarePage(path: string): string {
  if (path === ENTERPRISE_HARDWARE_ROUTE_PREFIX || path === `${ENTERPRISE_HARDWARE_ROUTE_PREFIX}/overview`) {
    return renderOverviewPage();
  }
  if (path === ENTERPRISE_HARDWARE_DEVICES_PATH || isEnterpriseDevicesByTypePath(path)) {
    return renderDevicesPage(path);
  }
  if (path === `${ENTERPRISE_HARDWARE_ROUTE_PREFIX}/alerts`) {
    return renderAlertsPage();
  }
  if (isEnterpriseDeviceDetailPath(path)) {
    const uid = decodeURIComponent(path.replace(`${ENTERPRISE_HARDWARE_DEVICES_PATH}/`, ""));
    return renderDeviceDetailPage(uid);
  }
  if (path.startsWith(`${ENTERPRISE_HARDWARE_ROUTE_PREFIX}/stores/`)) {
    const storeId = decodeURIComponent(path.slice(`${ENTERPRISE_HARDWARE_ROUTE_PREFIX}/stores/`.length));
    return renderStorePage(storeId);
  }
  return renderOverviewPage();
}

function readFilterFromForm(form: HTMLFormElement): EnterpriseDeviceFilter {
  const get = (name: string) => {
    const el = form.querySelector<HTMLInputElement | HTMLSelectElement>(`[data-enterprise-hw-filter="${name}"]`);
    return el?.value ?? "";
  };
  const fixedType = form.dataset.enterpriseHwFixedType as EnterpriseDeviceType | undefined;
  return {
    merchantId: get("merchantId") || undefined,
    brandId: get("brandId") || undefined,
    regionId: get("regionId") || undefined,
    storeId: get("storeId") || undefined,
    deviceType: fixedType || ((get("deviceType") || undefined) as EnterpriseDeviceFilter["deviceType"]),
    status: (get("status") || undefined) as EnterpriseDeviceFilter["status"],
    query: get("query") || undefined,
  };
}

function downloadCsv(content: string, filename: string): void {
  const blob = new Blob(["\uFEFF" + content], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function bindEnterpriseHardware(onMount: () => void): void {
  const filterForm = document.querySelector<HTMLFormElement>("[data-enterprise-hw-filter-form]");
  const tableHost = document.querySelector<HTMLElement>("[data-enterprise-hw-device-table]");

  const applyFilter = () => {
    if (!filterForm || !tableHost) return;
    const filter = readFilterFromForm(filterForm);
    const devices = filterEnterpriseDevices(filter);
    const fixedType = filterForm.dataset.enterpriseHwFixedType as EnterpriseDeviceType | undefined;
    const showType = !fixedType;
    const mobileTerminalLayout = fixedType === "kiosk" || fixedType === "emenu";
    tableHost.innerHTML = renderDeviceTable(devices, { showType, mobileTerminalLayout });
  };

  if (filterForm) {
    try {
      const presetMerchantId = sessionStorage.getItem("menusifu:enterprise-hardware-merchant-filter");
      if (presetMerchantId) {
        sessionStorage.removeItem("menusifu:enterprise-hardware-merchant-filter");
        const merchantSelect = filterForm.querySelector<HTMLSelectElement>('[data-enterprise-hw-filter="merchantId"]');
        if (merchantSelect) merchantSelect.value = presetMerchantId;
      }
    } catch {
      /* ignore */
    }
    applyFilter();
  }

  filterForm?.querySelectorAll<HTMLInputElement | HTMLSelectElement>("[data-enterprise-hw-filter]").forEach((el) => {
    el.addEventListener("change", applyFilter);
    if (el instanceof HTMLInputElement && el.type === "search") {
      el.addEventListener("input", applyFilter);
    }
  });

  filterForm?.querySelector("[data-enterprise-hw-export]")?.addEventListener("click", () => {
    if (!filterForm) return;
    const filter = readFilterFromForm(filterForm);
    const devices = filterEnterpriseDevices(filter);
    downloadCsv(exportDevicesCsv(devices), `enterprise-hardware-${new Date().toISOString().slice(0, 10)}.csv`);
  });

  document.querySelectorAll<HTMLAnchorElement>("[data-enterprise-hw-merchant-link]").forEach((link) => {
    link.addEventListener("click", (e) => {
      e.preventDefault();
      const href = link.getAttribute("href");
      if (!href) return;
      location.hash = href.startsWith("#") ? href : `#${href}`;
      onMount();
    });
  });
}
