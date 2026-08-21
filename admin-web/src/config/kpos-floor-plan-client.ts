import { readEmenuKposHost } from "../shell/emenu-local-host-control";

const SOAP_BEGIN = '<?xml version="1.0" encoding="UTF-8"?><soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:app="http://ws.kpos.com/app"><soapenv:Header/><soapenv:Body>';
const SOAP_END = "</soapenv:Body></soapenv:Envelope>";
const CONNECTION_KEY = "menusifu:kpos-floor-plan:connection:v1";
const SECRET_KEY_PREFIX = "menusifu:kpos-floor-plan:secret:";

export type KposPcLicense = { name: string; inUse: boolean };
export type KposFloorPlanConnection = {
  host: string;
  licenseName: string;
  sessionKey: string;
  expiresAt: number;
  userId?: string;
  username?: string;
};

export type KposFloorPlanTable = {
  id: string;
  name: string;
  seats: number;
  width: number;
  height: number;
  x: number;
  y: number;
  shape: string;
  areaId?: string;
  tableCategoryId?: string;
  hibachiTableShape?: string;
  seatingOrientation?: string;
  defaultSaleItemId?: string;
  status?: string;
  currentGuestCount?: number;
};

export type KposNamedOption = { id: string; name: string };

export type KposFloorPlanArea = {
  id: string;
  name: string;
  tables: KposFloorPlanTable[];
};

function escapeXml(value: unknown): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function tag(name: string, value: unknown): string {
  if (value === null || value === undefined) return "";
  return `<app:${name}>${escapeXml(value)}</app:${name}>`;
}

function soap(operation: string, body = ""): string {
  return `${SOAP_BEGIN}<app:${operation}>${body}</app:${operation}>${SOAP_END}`;
}

function childrenByName(root: ParentNode, name: string): Element[] {
  return Array.from(root.querySelectorAll("*"))
    .filter((node) => node.localName.toLowerCase() === name.toLowerCase());
}

function childText(root: ParentNode, name: string): string {
  const direct = Array.from(root instanceof Element ? root.children : []).find(
    (node) => node.localName.toLowerCase() === name.toLowerCase(),
  );
  return direct?.textContent?.trim() ?? "";
}

function numeric(value: string, fallback = 0): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function booleanValue(value: unknown): boolean {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value !== 0;
  const normalized = String(value ?? "").trim().toLowerCase();
  return normalized === "true" || normalized === "1" || normalized === "yes" || normalized === "in use";
}

async function callSoap(operation: string, body = ""): Promise<Document> {
  const response = await fetch("/kpos/ws/kposService", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "text/xml; charset=utf-8" },
    body: soap(operation, body),
  });
  const text = await response.text();
  if (!response.ok) throw new Error(`KPOS SOAP HTTP ${response.status}`);
  const doc = new DOMParser().parseFromString(text, "text/xml");
  const parserError = doc.querySelector("parsererror");
  if (parserError) throw new Error("KPOS 返回了无法解析的 XML");
  const fault = childrenByName(doc, "Fault")[0];
  if (fault) throw new Error(childText(fault, "faultstring") || "KPOS SOAP Fault");
  const result = childrenByName(doc, "result")[0];
  if (result && childText(result, "successful").toLowerCase() === "false") {
    throw new Error(childText(result, "failureReason") || "KPOS 操作失败");
  }
  return doc;
}

function flattenObjects(value: unknown, output: Record<string, unknown>[] = []): Record<string, unknown>[] {
  if (!value || typeof value !== "object") return output;
  if (!Array.isArray(value)) output.push(value as Record<string, unknown>);
  for (const child of Object.values(value as Record<string, unknown>)) {
    if (child && typeof child === "object") flattenObjects(child, output);
  }
  return output;
}

export async function listKposPcLicenses(): Promise<KposPcLicense[]> {
  const response = await fetch("/kpos/api/company/profile/fetch?fetchLicenseDetails=true", {
    credentials: "include",
  });
  if (!response.ok) throw new Error(`读取 PC License 失败（HTTP ${response.status}）`);
  const json = (await response.json()) as unknown;
  const rows = flattenObjects(json);
  const seen = new Set<string>();
  const licenses: KposPcLicense[] = [];
  for (const row of rows) {
    const type = String(row.type ?? row.appInstanceType ?? row.licenseType ?? "").toUpperCase();
    const name = String(row.displayName ?? row.name ?? row.appInstanceName ?? "").trim();
    // KPOS 管理端称为 PC License，profile 接口中的实际枚举为 POS。
    if (type !== "POS" || !name || seen.has(name)) continue;
    seen.add(name);
    licenses.push({
      name,
      inUse: booleanValue(row.inUse ?? row.isInUse ?? row.status),
    });
  }
  return licenses;
}

function readSavedSecret(host: string, licenseName: string): string {
  try {
    return sessionStorage.getItem(`${SECRET_KEY_PREFIX}${host}|${licenseName}`)?.trim() || "";
  } catch {
    return "";
  }
}

function saveSecret(host: string, licenseName: string, value: string): void {
  if (!value) return;
  try {
    sessionStorage.setItem(`${SECRET_KEY_PREFIX}${host}|${licenseName}`, value);
  } catch {
    /* secret key is optional and intentionally limited to this browser tab */
  }
}

export function readKposFloorPlanConnection(): KposFloorPlanConnection | null {
  try {
    const raw = sessionStorage.getItem(CONNECTION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as KposFloorPlanConnection;
    if (!parsed.sessionKey || !parsed.licenseName || parsed.host !== readEmenuKposHost()) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function clearKposFloorPlanConnection(): void {
  try {
    sessionStorage.removeItem(CONNECTION_KEY);
  } catch {
    /* ignore */
  }
  window.dispatchEvent(new CustomEvent("menusifu:kpos-floor-plan-connection-change"));
}

export async function connectKposFloorPlan(
  licenseName: string,
  passcode = "",
): Promise<KposFloorPlanConnection> {
  const host = readEmenuKposHost();
  const loginResponse = await fetch("/kpos/webapp/license/clientInstanceLogin", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      appInstanceName: licenseName,
      appInstanceType: "POS",
      secretKey: readSavedSecret(host, licenseName),
    }),
  });
  if (!loginResponse.ok) throw new Error(`PC License 登录失败（HTTP ${loginResponse.status}）`);
  const login = (await loginResponse.json()) as {
    sessionKey?: string;
    secretKey?: string;
    sessionKeyRemainingActiveTime?: number;
    result?: { successful?: boolean; failureReason?: string };
  };
  if (!login.result?.successful || !login.sessionKey) {
    throw new Error(login.result?.failureReason || "PC License 不可用");
  }
  saveSecret(host, licenseName, login.secretKey || "");

  let privileges: Element | undefined;
  if (passcode) {
    const auth = await callSoap(
      "ListPrivilegesType",
      tag("fetchClockInOutStatus", true) +
        tag("passcode", passcode) +
        `<app:userAuth>${tag("userPasscode", passcode)}${tag("sessionKey", login.sessionKey)}</app:userAuth>`,
    );
    privileges = childrenByName(auth, "listprivilegesresponsetype")[0];
    if (!privileges) throw new Error("Admin 密码验证失败");
  }
  const connection: KposFloorPlanConnection = {
    host,
    licenseName,
    sessionKey: login.sessionKey,
    expiresAt: Date.now() + (Number(login.sessionKeyRemainingActiveTime) || 23 * 3600 * 1000),
    userId: privileges ? childText(privileges, "userid") : undefined,
    username: privileges ? childText(privileges, "username") : undefined,
  };
  sessionStorage.setItem(CONNECTION_KEY, JSON.stringify(connection));
  window.dispatchEvent(new CustomEvent("menusifu:kpos-floor-plan-connection-change", { detail: connection }));
  return connection;
}

export async function connectKposFloorPlanAutomatically(): Promise<KposFloorPlanConnection> {
  const licenses = await listKposPcLicenses();
  const candidates = [...licenses].sort((a, b) => Number(a.inUse) - Number(b.inUse));
  if (!candidates.length) throw new Error("当前主机未提供 PC License");
  let lastError: unknown;
  for (const license of candidates) {
    try {
      return await connectKposFloorPlan(license.name);
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError instanceof Error ? lastError : new Error("无法连接当前主机的 PC 服务");
}

function sessionBody(): string {
  const connection = readKposFloorPlanConnection();
  if (!connection) throw new Error("请先在悬浮球连接 KPOS PC License");
  if (connection.expiresAt <= Date.now()) throw new Error("KPOS 会话已过期，请重新连接");
  return tag("sessionKey", connection.sessionKey);
}

function parseTable(node: Element): KposFloorPlanTable {
  return {
    id: childText(node, "id"),
    name: childText(node, "name"),
    seats: numeric(childText(node, "defaultGuestCount"), 4),
    width: numeric(childText(node, "width"), 0.12),
    height: numeric(childText(node, "height"), 0.1),
    x: numeric(childText(node, "x"), 0),
    y: numeric(childText(node, "y"), 0),
    shape: childText(node, "shape") || "RECTANGLE",
    areaId: childText(node, "areaId"),
    tableCategoryId: childText(node, "tableCategoryId"),
    hibachiTableShape: childText(node, "hibachiTableShape"),
    seatingOrientation: childText(node, "seatingOrientation"),
    defaultSaleItemId: childText(node, "defaultSaleItemId"),
    status: childText(node, "status"),
    currentGuestCount: numeric(childText(node, "currentGuestCount"), 0),
  };
}

function parseNamedOptions(doc: Document, containerName: string): KposNamedOption[] {
  const seen = new Set<string>();
  return childrenByName(doc, containerName).flatMap((node) => {
    const id = childText(node, "id");
    const name = childText(node, "name");
    if (!id || !name || seen.has(id)) return [];
    seen.add(id);
    return [{ id, name }];
  });
}

export async function loadKposTableCategories(): Promise<KposNamedOption[]> {
  sessionBody();
  const doc = await callSoap("FindTableCategoriesType");
  const singular = parseNamedOptions(doc, "tableCategory");
  return singular.length ? singular : parseNamedOptions(doc, "tableCategories");
}

export async function loadKposKtvSaleItems(): Promise<KposNamedOption[]> {
  sessionBody();
  const doc = await callSoap("FindSaleItemsType", tag("onlyKTVItem", true));
  const items = parseNamedOptions(doc, "saleItem");
  if (items.length) return items;
  const plural = parseNamedOptions(doc, "saleItems");
  return plural.length ? plural : parseNamedOptions(doc, "items");
}

export async function loadKposFloorPlan(): Promise<KposFloorPlanArea[]> {
  sessionBody();
  const areasDoc = await callSoap("ListAreasType", tag("fetchOrders", false));
  const areaNodes = childrenByName(areasDoc, "areas");
  const areas: KposFloorPlanArea[] = [];
  for (const areaNode of areaNodes) {
    const id = childText(areaNode, "id");
    if (!id) continue;
    // ListAreasType already returns each area's tables inline. ListTablesType is
    // an unfiltered, all-tables endpoint; passing areaId to it is silently ignored
    // by KPOS and must never be used to construct an area's table collection.
    const tableNodes = childrenByName(areaNode, "tables");
    areas.push({
      id,
      name: childText(areaNode, "name") || id,
      tables: tableNodes.map((node) => ({ ...parseTable(node), areaId: id })),
    });
  }
  assertUniqueAreaAssignments(areas);
  return areas;
}

function assertUniqueAreaAssignments(areas: KposFloorPlanArea[]): void {
  const assignedAreaByTableId = new Map<string, string>();
  for (const area of areas) {
    for (const table of area.tables) {
      if (!table.id) continue;
      const previousAreaId = assignedAreaByTableId.get(table.id);
      if (previousAreaId && previousAreaId !== area.id) {
        throw new Error(`KPOS 返回了重复桌台 ${table.name || table.id}，已停止读写以保护区域数据`);
      }
      assignedAreaByTableId.set(table.id, area.id);
    }
  }
}

function tableXml(table: KposFloorPlanTable, areaId: string): string {
  const shape = table.shape.toUpperCase();
  return `<app:tables>${tag("id", table.id || undefined)}${tag("name", table.name)}${tag("shape", shape)}${tag("x", table.x)}${tag("y", table.y)}${tag("areaId", areaId)}${tag("width", table.width)}${tag("height", table.height)}${tag("defaultGuestCount", table.seats)}${tag("tableCategoryId", table.tableCategoryId || undefined)}${tag("hibachiTableShape", table.hibachiTableShape || undefined)}${tag("seatingOrientation", table.seatingOrientation || undefined)}${tag("defaultSaleItemId", table.defaultSaleItemId || undefined)}${tag("currentGuestCount", table.currentGuestCount ?? 0)}${tag("status", table.status || "AVAILABLE")}</app:tables>`;
}

export async function saveKposTable(table: KposFloorPlanTable, areaId: string): Promise<void> {
  const tableBody = `${tag("id", table.id || undefined)}${tag("name", table.name)}${tag("x", table.x)}${tag("y", table.y)}${tag("areaId", areaId)}${tag("width", table.width)}${tag("height", table.height)}${tag("shape", table.shape.toUpperCase())}${tag("hibachiTableShape", table.hibachiTableShape || undefined)}${tag("seatingOrientation", table.seatingOrientation || undefined)}${tag("defaultSaleItemId", table.defaultSaleItemId || undefined)}${tag("tableCategoryId", table.tableCategoryId || undefined)}${tag("defaultGuestCount", table.seats)}`;
  sessionBody();
  const body = `<app:table>${tableBody}</app:table>`;
  await callSoap("SaveTableType", body);
}

export async function deleteKposTable(id: string): Promise<void> {
  sessionBody();
  await callSoap("DeleteTableType", tag("id", id));
}

function structuralFingerprint(area: KposFloorPlanArea): string {
  const normalize = (table: Omit<KposFloorPlanTable, "status" | "currentGuestCount">) => ({
    ...table,
    x: Math.round(table.x * 1000) / 1000,
    y: Math.round(table.y * 650) / 650,
    width: Math.round(table.width * 1000) / 1000,
    height: Math.round(table.height * 650) / 650,
  });
  return JSON.stringify({
    id: area.id,
    name: area.name,
    tables: [...area.tables]
      .map(({ status: _status, currentGuestCount: _guests, ...table }) => normalize(table))
      .sort((a, b) => a.id.localeCompare(b.id)),
  });
}

function contentSignature(area: KposFloorPlanArea): string {
  return JSON.stringify({
    name: area.name,
    tables: area.tables
      .map(({ id: _id, status: _status, currentGuestCount: _guests, ...table }) => ({
        ...table,
        x: Math.round(table.x * 1000) / 1000,
        y: Math.round(table.y * 650) / 650,
        width: Math.round(table.width * 1000) / 1000,
        height: Math.round(table.height * 650) / 650,
      }))
      .sort((a, b) => JSON.stringify(a).localeCompare(JSON.stringify(b))),
  });
}

export async function saveKposFloorPlanArea(
  area: KposFloorPlanArea,
  expectedBaseline?: KposFloorPlanArea,
): Promise<void> {
  const latestLayout = await loadKposFloorPlan();
  if (!area.id && latestLayout.some((item) => item.name.trim() === area.name.trim())) {
    throw new Error(`KPOS 已存在同名区域“${area.name}”，请使用唯一名称`);
  }
  const latest = latestLayout.find((item) => item.id === area.id);
  if (expectedBaseline?.id && (!latest || structuralFingerprint(latest) !== structuralFingerprint(expectedBaseline))) {
    throw new Error("KPOS 桌台布局已被其他终端修改，请刷新后重试");
  }
  if (expectedBaseline) {
    const targetIds = new Set(area.tables.map((table) => table.id).filter(Boolean));
    const deletedIds = expectedBaseline.tables.map((table) => table.id).filter((id) => id && !targetIds.has(id));
    for (const id of deletedIds) {
      const runtime = latest?.tables.find((table) => table.id === id);
      const status = (runtime?.status ?? "").trim().toUpperCase();
      if (!runtime || ((status && status !== "AVAILABLE" && status !== "EMPTY") || (runtime.currentGuestCount ?? 0) !== 0)) {
        throw new Error(`桌台 ${runtime?.name || id} 已被占用，无法删除`);
      }
    }
  }
  const runtimeById = new Map(latest?.tables.map((table) => [table.id, table]) ?? []);
  const tables = area.tables.map((table) => {
    const runtime = runtimeById.get(table.id);
    return { ...table, status: runtime?.status, currentGuestCount: runtime?.currentGuestCount };
  });
  const areaXml = `<app:areaType>${tag("id", area.id || undefined)}${tag("name", area.name)}${tables.map((table) => tableXml(table, area.id)).join("")}</app:areaType>`;
  try {
    sessionBody();
    await callSoap("SaveSeatingAreaType", areaXml);
  } catch (error) {
    try {
      const readBack = await loadKposFloorPlan();
      const hasTemporaryTables = area.tables.some((table) => !table.id);
      const applied = area.id
        ? readBack.some((candidate) => candidate.id === area.id && (hasTemporaryTables ? contentSignature(candidate) === contentSignature(area) : structuralFingerprint(candidate) === structuralFingerprint(area)))
        : readBack.filter((candidate) => contentSignature(candidate) === contentSignature(area)).length === 1;
      if (applied) return;
    } catch {
      /* preserve the original write error below */
    }
    const message = error instanceof Error ? error.message : "KPOS 写入失败";
    throw new Error(`${message}；保存结果无法确认，请先刷新服务器数据，勿直接重复提交`);
  }
}
