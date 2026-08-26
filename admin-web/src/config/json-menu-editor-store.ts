import {
  cloneMenuSubtreeWithFreshIds,
  createEmptyMenuDocument,
  getMenuNodeArrayAtParentPath,
  getMenuNodeAtPath,
  isCompatibilityProtected,
  moveMenuNode,
  synchronizeMenuParentKeys,
  subtreeContainsCompatibility,
  validateMenuDocument,
  walkMenuNodes,
  type MenuDocument,
  type MenuEditorUser,
  type MenuLocale,
  type MenuNode,
  type MenuNodePath,
  type MenuValidationIssue,
} from "./json-menu-document-domain";
import { serializeMenuDocument, stringifyMenuDocument } from "./json-menu-document-serializer";
import { getMenuDocumentRepository, type MenuDocumentRepository } from "./json-menu-document-repository";

export interface JsonMenuEditorState {
  status: "idle" | "loading" | "ready" | "saving" | "publishing" | "error";
  document: MenuDocument | null;
  published: MenuDocument | null;
  selectedPath: MenuNodePath;
  locale: MenuLocale;
  dirty: boolean;
  restoredDraft: boolean;
  message: string;
  issues: MenuValidationIssue[];
}

function pathExists(document: MenuDocument | null, path: MenuNodePath): boolean {
  return Boolean(document && getMenuNodeAtPath(document.menu, path));
}

function structuralSnapshot(node: MenuNode): string {
  return JSON.stringify({ type: node.type, path: node.path, url: node.url, targetKey: node.targetKey, externalConfig: node.externalConfig, microAppConfig: node.microAppConfig, children: node.children });
}

function hasInheritedMicroAppDescendant(node: MenuNode): boolean {
  return (node.children ?? []).some((child) => !child.type);
}

export class JsonMenuEditorStore {
  readonly state: JsonMenuEditorState = {
    status: "idle", document: null, published: null, selectedPath: [], locale: "zh-CN", dirty: false, restoredDraft: false, message: "", issues: [],
  };

  constructor(private readonly repository: MenuDocumentRepository = getMenuDocumentRepository()) {}

  private refreshIssues(): void {
    if (this.state.document) synchronizeMenuParentKeys(this.state.document.menu);
    this.state.issues = this.state.document ? validateMenuDocument(this.state.document, this.state.published) : [];
  }

  async load(): Promise<void> {
    this.state.status = "loading";
    this.state.message = "";
    try {
      const [draft, published] = await Promise.all([this.repository.readDraft(), this.repository.readPublished()]);
      this.state.published = structuredClone(published);
      this.state.document = structuredClone(draft ?? published);
      this.state.restoredDraft = Boolean(draft);
      this.state.selectedPath = this.state.document.menu.length ? [0] : [];
      this.state.dirty = false;
      this.state.status = "ready";
      this.refreshIssues();
    } catch (error) {
      this.state.status = "error";
      this.state.message = error instanceof Error ? error.message : "菜单配置加载失败";
    }
  }

  createNew(user: MenuEditorUser): void {
    this.state.document = createEmptyMenuDocument(user);
    this.state.selectedPath = [];
    this.state.restoredDraft = false;
    this.markDirty();
  }

  markDirty(message = ""): void {
    this.state.dirty = true;
    this.state.message = message;
    this.refreshIssues();
  }

  select(path: MenuNodePath): void { if (pathExists(this.state.document, path)) this.state.selectedPath = [...path]; }
  selectedNode(): MenuNode | undefined { return this.state.document ? getMenuNodeAtPath(this.state.document.menu, this.state.selectedPath) : undefined; }
  selectedIsProtected(): boolean { return Boolean(this.state.document && isCompatibilityProtected(this.state.document.menu, this.state.selectedPath)); }
  selectedContainsProtectedSubtree(): boolean { return Boolean(this.state.document && subtreeContainsCompatibility(this.state.document.menu, this.state.selectedPath)); }

  updateRoot(mutator: (document: MenuDocument) => void): void {
    if (!this.state.document) return;
    mutator(this.state.document);
    this.markDirty();
  }

  addNode(parentPath: MenuNodePath, node: MenuNode): boolean {
    if (!this.state.document) return false;
    if (parentPath.length && (isCompatibilityProtected(this.state.document.menu, parentPath) || subtreeContainsCompatibility(this.state.document.menu, parentPath))) return false;
    const array = getMenuNodeArrayAtParentPath(this.state.document.menu, parentPath);
    if (!array) return false;
    array.push(structuredClone(node));
    this.state.selectedPath = [...parentPath, array.length - 1];
    this.markDirty(parentPath.length ? "已新增子菜单" : "已新增一级菜单");
    return true;
  }

  replaceSelected(next: MenuNode): boolean {
    if (!this.state.document || !this.state.selectedPath.length || this.selectedIsProtected()) return false;
    const parentPath = this.state.selectedPath.slice(0, -1);
    const array = getMenuNodeArrayAtParentPath(this.state.document.menu, parentPath);
    const index = this.state.selectedPath.at(-1)!;
    const current = array?.[index];
    if (!array || !current) return false;
    if (this.selectedContainsProtectedSubtree() && structuralSnapshot(current) !== structuralSnapshot(next)) return false;
    if (current.type === "micro-app" && next.type !== "micro-app" && hasInheritedMicroAppDescendant(current)) return false;
    const oldKey = current.key?.trim();
    const newKey = next.key?.trim();
    array[index] = structuredClone(next);
    if (oldKey && newKey && oldKey !== newKey) {
      for (const visit of walkMenuNodes(this.state.document.menu)) if (visit.node.type === "link" && visit.node.targetKey === oldKey) visit.node.targetKey = newKey;
    }
    this.markDirty("菜单信息已更新");
    return true;
  }

  replaceAndRelocateSelected(next: MenuNode, targetParentPath: MenuNodePath): boolean {
    if (!this.state.document || !this.state.selectedPath.length || this.selectedIsProtected()) return false;
    const originalPath = [...this.state.selectedPath];
    const originalParentPath = originalPath.slice(0, -1);
    const changingParent = JSON.stringify(originalParentPath) !== JSON.stringify(targetParentPath);
    if (changingParent && this.selectedContainsProtectedSubtree()) return false;
    if (targetParentPath.length && (isCompatibilityProtected(this.state.document.menu, targetParentPath) || subtreeContainsCompatibility(this.state.document.menu, targetParentPath))) return false;
    if (!this.replaceSelected(next)) return false;
    if (!changingParent) return true;
    const sourceNode = this.selectedNode();
    const targetArray = getMenuNodeArrayAtParentPath(this.state.document.menu, targetParentPath);
    if (!sourceNode || !targetArray) return false;
    if (!moveMenuNode(this.state.document.menu, originalPath, targetParentPath, targetArray.length)) return false;
    const findPath = (nodes: MenuNode[], parent: MenuNodePath = []): MenuNodePath | null => {
      for (let index = 0; index < nodes.length; index += 1) {
        if (nodes[index] === sourceNode) return [...parent, index];
        const nested = findPath(nodes[index]?.children ?? [], [...parent, index]);
        if (nested) return nested;
      }
      return null;
    };
    this.state.selectedPath = findPath(this.state.document.menu) ?? this.state.selectedPath;
    this.markDirty("菜单层级与信息已更新");
    return true;
  }

  duplicateSelected(): boolean {
    if (!this.state.document || !this.state.selectedPath.length || this.selectedContainsProtectedSubtree()) return false;
    const parentPath = this.state.selectedPath.slice(0, -1);
    const array = getMenuNodeArrayAtParentPath(this.state.document.menu, parentPath);
    const index = this.state.selectedPath.at(-1)!;
    if (!array?.[index]) return false;
    array.splice(index + 1, 0, cloneMenuSubtreeWithFreshIds(array[index]!));
    this.state.selectedPath = [...parentPath, index + 1];
    this.markDirty("副本保留原 Key，请修改重复项后发布");
    return true;
  }

  deleteSelected(): boolean {
    if (!this.state.document || !this.state.selectedPath.length || this.selectedContainsProtectedSubtree()) return false;
    const parentPath = this.state.selectedPath.slice(0, -1);
    const array = getMenuNodeArrayAtParentPath(this.state.document.menu, parentPath);
    const index = this.state.selectedPath.at(-1)!;
    if (!array?.[index]) return false;
    const deletingKeys = new Set(walkMenuNodes([array[index]!]).map((visit) => visit.node.key?.trim()).filter((key): key is string => Boolean(key)));
    if (walkMenuNodes(this.state.document.menu).some((visit) => visit.node.type === "link" && visit.node.targetKey && deletingKeys.has(visit.node.targetKey))) return false;
    array.splice(index, 1);
    this.state.selectedPath = array.length ? [...parentPath, Math.min(index, array.length - 1)] : parentPath;
    this.markDirty("已删除菜单节点");
    return true;
  }

  moveSelected(targetParentPath: MenuNodePath, targetIndex: number): boolean {
    if (!this.state.document || this.selectedContainsProtectedSubtree()) return false;
    const moved = moveMenuNode(this.state.document.menu, this.state.selectedPath, targetParentPath, targetIndex);
    if (moved) {
      this.state.selectedPath = [...targetParentPath, Math.max(0, targetIndex)];
      this.markDirty("菜单顺序已调整");
    }
    return moved;
  }

  setLocale(locale: MenuLocale): void { this.state.locale = locale; }

  async saveDraft(user: MenuEditorUser): Promise<boolean> {
    if (!this.state.document) return false;
    this.state.status = "saving";
    this.state.document.updatedBy = { ...user, timestamp: new Date().toISOString() };
    try {
      this.state.document = await this.repository.saveDraft(serializeMenuDocument(this.state.document));
      this.state.dirty = false;
      this.state.restoredDraft = true;
      this.state.status = "ready";
      this.state.message = `草稿已保存 ${new Date().toLocaleTimeString("zh-CN", { hour12: false })}`;
      this.refreshIssues();
      return true;
    } catch (error) {
      this.state.status = "error";
      this.state.message = error instanceof Error ? error.message : "草稿保存失败";
      return false;
    }
  }

  async publish(user: MenuEditorUser, allowWarnings: boolean): Promise<{ ok: boolean; needsWarningConfirmation: boolean }> {
    if (!this.state.document) return { ok: false, needsWarningConfirmation: false };
    this.refreshIssues();
    if (this.state.issues.some((issue) => issue.severity === "error")) return { ok: false, needsWarningConfirmation: false };
    if (!allowWarnings && this.state.issues.some((issue) => issue.severity === "warning")) return { ok: false, needsWarningConfirmation: true };
    this.state.status = "publishing";
    this.state.document.updatedBy = { ...user, timestamp: new Date().toISOString() };
    try {
      const published = await this.repository.publish(serializeMenuDocument(this.state.document));
      this.state.document = structuredClone(published);
      this.state.published = structuredClone(published);
      this.state.dirty = false;
      this.state.restoredDraft = false;
      this.state.status = "ready";
      this.state.message = "菜单配置已发布生效";
      this.refreshIssues();
      return { ok: true, needsWarningConfirmation: false };
    } catch (error) {
      this.state.status = "error";
      this.state.message = error instanceof Error ? error.message : "发布失败";
      return { ok: false, needsWarningConfirmation: false };
    }
  }

  async discard(): Promise<boolean> {
    try {
      const [draft, published] = await Promise.all([this.repository.readDraft(), this.repository.readPublished()]);
      this.state.published = structuredClone(published);
      this.state.document = structuredClone(draft ?? published);
      this.state.selectedPath = this.state.document.menu.length ? [0] : [];
      this.state.dirty = false;
      this.state.restoredDraft = Boolean(draft);
      this.state.status = "ready";
      this.state.message = draft ? "已放弃当前未保存修改并恢复共享草稿" : "已放弃当前未保存修改并恢复发布版本";
      this.refreshIssues();
      return true;
    } catch (error) {
      this.state.status = "error";
      this.state.message = error instanceof Error ? error.message : "恢复菜单配置失败";
      return false;
    }
  }

  exportJson(): string | null {
    if (!this.state.document) return null;
    this.refreshIssues();
    const rootErrors = this.state.issues.filter((issue) => !issue.path && issue.severity === "error");
    return rootErrors.length ? null : stringifyMenuDocument(this.state.document);
  }
}

export const jsonMenuEditorStore = new JsonMenuEditorStore();
