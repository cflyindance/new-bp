import { buildNavBlueprintGroupsForModule } from "./nav-blueprint-tree";
import {
  DEFAULT_NAV_BLUEPRINT_ID,
  getPublishedNavBlueprint,
  normalizeBlueprintSnapshot,
  type NavBlueprintSnapshot,
} from "./nav-blueprint-store";
import type { PermissionTreeNode } from "./permission-registry";
import { isMenuDirectory, type MenuDocument, type MenuNode } from "./json-menu-document-domain";

export interface SubscriptionMenuTreeNode {
  routeNodeId: string;
  parentRouteNodeId?: string;
  title: string;
  path?: string;
  level: number;
  selectable: boolean;
  children: SubscriptionMenuTreeNode[];
}

export interface SubscriptionPublishedMenuTree {
  blueprintVersion: number;
  source: "system" | "custom" | "menu-document";
  roots: SubscriptionMenuTreeNode[];
  structureNodeCount: number;
  selectableNodeCount: number;
}

let publishedMenuDocument: MenuDocument | null | undefined;
let publishedMenuDocumentReadAt = 0;
let publishedMenuDocumentRequest: Promise<boolean> | null = null;

function publishedDocumentVersion(timestamp: string): number {
  const parsed = Date.parse(timestamp);
  return Number.isFinite(parsed) ? parsed : 1;
}

function nonEmptyString(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const normalized = value.trim();
  return normalized || undefined;
}

function resolvePublishedMenuTitle(node: MenuNode, routeNodeId: string): string {
  return nonEmptyString(node.i18nInfo?.["zh-CN"])
    ?? nonEmptyString(node.name)
    ?? nonEmptyString(node.key)
    ?? routeNodeId;
}

function adaptPublishedMenuNode(node: MenuNode, path: number[], parentRouteNodeId?: string): SubscriptionMenuTreeNode {
  const routeNodeId = node.id?.trim() || node.key?.trim() || `menu-${path.join("-")}`;
  const routePath = node.path?.trim() || node.url?.trim() || undefined;
  return {
    routeNodeId,
    parentRouteNodeId,
    title: resolvePublishedMenuTitle(node, routeNodeId),
    path: routePath,
    level: path.length,
    selectable: !isMenuDirectory(node) && node.disabled !== true,
    children: (node.children ?? []).map((child, index) => adaptPublishedMenuNode(child, [...path, index], routeNodeId)),
  };
}

export function buildSubscriptionMenuTreeFromPublishedMenuDocument(document: MenuDocument): SubscriptionPublishedMenuTree | null {
  const publishedAt = document.updatedBy?.timestamp?.trim();
  if (!publishedAt) return null;
  const roots = document.menu.map((node, index) => adaptPublishedMenuNode(node, [index]));
  const flat = flattenSubscriptionMenuTree(roots);
  return {
    blueprintVersion: publishedDocumentVersion(publishedAt),
    source: "menu-document",
    roots,
    structureNodeCount: flat.length,
    selectableNodeCount: flat.filter((node) => node.selectable).length,
  };
}

export async function ensurePublishedSubscriptionMenuTree(): Promise<boolean> {
  if (publishedMenuDocumentRequest) return publishedMenuDocumentRequest;
  if (publishedMenuDocument !== undefined && Date.now() - publishedMenuDocumentReadAt < 500) return false;
  publishedMenuDocumentRequest = (async () => {
    const previousTimestamp = publishedMenuDocument?.updatedBy.timestamp ?? "";
    try {
      const { getMenuDocumentRepository } = await import("./json-menu-document-repository");
      publishedMenuDocument = await getMenuDocumentRepository().readPublished();
    } catch {
      publishedMenuDocument = null;
    }
    publishedMenuDocumentReadAt = Date.now();
    return previousTimestamp !== (publishedMenuDocument?.updatedBy.timestamp ?? "");
  })().finally(() => { publishedMenuDocumentRequest = null; });
  return publishedMenuDocumentRequest;
}

export function isSubscriptionMenuResourceSelectable(resource: PermissionTreeNode["resource"]): boolean {
  return Boolean(resource.path?.trim()) && resource.chainOnly !== true && resource.level <= 3;
}

function adaptNode(
  node: PermissionTreeNode,
  selection: NavBlueprintSnapshot["systemStructureSelection"],
  parentEnabled: boolean,
  parentRouteNodeId?: string,
): SubscriptionMenuTreeNode | null {
  const enabled = parentEnabled && (selection[node.resource.key]?.enabled ?? true);
  if (!enabled) return null;
  return {
    routeNodeId: node.resource.key,
    parentRouteNodeId,
    title: node.resource.title,
    path: node.resource.path,
    level: node.resource.level,
    selectable: isSubscriptionMenuResourceSelectable(node.resource),
    children: node.children
      .map((child) => adaptNode(child, selection, enabled, node.resource.key))
      .filter((child): child is SubscriptionMenuTreeNode => child != null),
  };
}

export function buildSubscriptionMenuTreeFromPublishedSnapshot(snapshot: NavBlueprintSnapshot): SubscriptionPublishedMenuTree {
  const normalized = normalizeBlueprintSnapshot(snapshot);
  const source = normalized.navigationSource;
  const selection = source === "custom" ? normalized.customStructureSelection : normalized.systemStructureSelection;
  const groups = buildNavBlueprintGroupsForModule(normalized, "active");
  const roots = groups
    .map((group) => adaptNode(group.tree, selection, true))
    .filter((node): node is SubscriptionMenuTreeNode => node != null);
  const flat = flattenSubscriptionMenuTree(roots);
  return {
    blueprintVersion: normalized.version,
    source,
    roots,
    structureNodeCount: flat.length,
    selectableNodeCount: flat.filter((node) => node.selectable).length,
  };
}

export function getPublishedSubscriptionMenuTree(): SubscriptionPublishedMenuTree | null {
  if (publishedMenuDocument !== undefined) {
    return publishedMenuDocument ? buildSubscriptionMenuTreeFromPublishedMenuDocument(publishedMenuDocument) : null;
  }
  const snapshot = getPublishedNavBlueprint(DEFAULT_NAV_BLUEPRINT_ID);
  return snapshot ? buildSubscriptionMenuTreeFromPublishedSnapshot(snapshot) : null;
}

export function flattenSubscriptionMenuTree(roots: SubscriptionMenuTreeNode[]): SubscriptionMenuTreeNode[] {
  const output: SubscriptionMenuTreeNode[] = [];
  const visit = (node: SubscriptionMenuTreeNode): void => { output.push(node); node.children.forEach(visit); };
  roots.forEach(visit);
  return output;
}

export function getPublishedSubscriptionRouteCatalog(): Array<{ id: string; title: string; path: string; parentId?: string; level: number }> {
  const tree = getPublishedSubscriptionMenuTree();
  if (!tree) return [];
  return flattenSubscriptionMenuTree(tree.roots)
    .filter((node) => node.selectable && node.path)
    .map((node) => ({ id: node.routeNodeId, title: node.title, path: node.path!, parentId: node.parentRouteNodeId, level: node.level }));
}

export function filterSubscriptionMenuTree(roots: SubscriptionMenuTreeNode[], rawQuery: string): SubscriptionMenuTreeNode[] {
  const query = rawQuery.trim().toLowerCase();
  if (!query) return roots;
  const filterNode = (node: SubscriptionMenuTreeNode): SubscriptionMenuTreeNode | null => {
    const selfMatch = `${node.title} ${node.path ?? ""}`.toLowerCase().includes(query);
    if (selfMatch && !node.selectable) return node;
    const children = node.children.map(filterNode).filter((child): child is SubscriptionMenuTreeNode => child != null);
    if (selfMatch || children.length) return { ...node, children };
    return null;
  };
  return roots.map(filterNode).filter((node): node is SubscriptionMenuTreeNode => node != null);
}

export function collectSelectableRouteNodeIds(node: SubscriptionMenuTreeNode): string[] {
  return [
    ...(node.selectable ? [node.routeNodeId] : []),
    ...node.children.flatMap(collectSelectableRouteNodeIds),
  ];
}
