/**
 * 复杂功能 CRUD · 集合 Diff（baseline → draft → DeploymentConfigChange）
 */
import { formatConfigDisplayValue } from "./deployment-change-buffer";
import type {
  DeploymentConfigChange,
  EntityChangeBlock,
  EntityChangeOp,
  EntityFieldChange,
} from "./deployment-types";

export interface CollectionFieldSpec<T> {
  key: string;
  label: string;
  get: (item: T) => unknown;
  format?: (value: unknown) => string;
}

export interface CollectionAdapter<T> {
  collectionKey: string;
  collectionLabel: string;
  idOf: (item: T) => string;
  labelOf: (item: T) => string;
  fields: Array<CollectionFieldSpec<T>>;
}

function formatFieldValue(value: unknown, format?: (v: unknown) => string): string {
  if (format) return format(value);
  return formatConfigDisplayValue(value);
}

function buildFieldsForItem<T>(
  item: T | undefined,
  fields: Array<CollectionFieldSpec<T>>,
  side: "before" | "after",
): Map<string, { label: string; text: string }> {
  const map = new Map<string, { label: string; text: string }>();
  if (!item) return map;
  for (const field of fields) {
    map.set(field.key, {
      label: field.label,
      text: formatFieldValue(field.get(item), field.format),
    });
  }
  return map;
}

function buildEntityFields(
  beforeItem: unknown,
  afterItem: unknown,
  fields: Array<CollectionFieldSpec<never>>,
  operation: EntityChangeOp,
): EntityFieldChange[] {
  const beforeMap = buildFieldsForItem(beforeItem as never, fields, "before");
  const afterMap = buildFieldsForItem(afterItem as never, fields, "after");
  const keys = new Set([...beforeMap.keys(), ...afterMap.keys()]);
  const rows: EntityFieldChange[] = [];
  for (const key of keys) {
    const before = beforeMap.get(key)?.text ?? "";
    const after = afterMap.get(key)?.text ?? "";
    const label = afterMap.get(key)?.label ?? beforeMap.get(key)?.label ?? key;
    if (operation === "create" && !after) continue;
    if (operation === "delete" && !before) continue;
    if (before === after) continue;
    rows.push({
      key,
      label,
      before: operation === "create" ? "" : before,
      after: operation === "delete" ? "" : after,
    });
  }
  return rows;
}

export function summarizeEntityOperations(entities: EntityChangeBlock[]): string {
  let create = 0;
  let update = 0;
  let remove = 0;
  for (const block of entities) {
    if (block.operation === "create") create += 1;
    else if (block.operation === "delete") remove += 1;
    else update += 1;
  }
  const parts: string[] = [];
  if (create) parts.push(`新增 ${create}`);
  if (update) parts.push(`修改 ${update}`);
  if (remove) parts.push(`删除 ${remove}`);
  return parts.join(" · ") || "无变更";
}

export function summarizeCollectionChange(
  beforeCount: number,
  afterCount: number,
  entities: EntityChangeBlock[],
): { before: string; after: string; operation: string } {
  const operation = summarizeEntityOperations(entities);
  return {
    before: `原 ${beforeCount} 项`,
    after: `现 ${afterCount} 项（${operation}）`,
    operation,
  };
}

/** 对比两个集合，产出带 entities 的变更；无净变更返回 null */
export function diffCollection<T>(
  baseline: T[],
  draft: T[],
  adapter: CollectionAdapter<T>,
  options?: {
    settingsPath?: string;
    groupPath?: string[];
  },
): DeploymentConfigChange | null {
  const beforeMap = new Map(baseline.map((item) => [adapter.idOf(item), item]));
  const afterMap = new Map(draft.map((item) => [adapter.idOf(item), item]));
  const ids = new Set([...beforeMap.keys(), ...afterMap.keys()]);
  const entities: EntityChangeBlock[] = [];

  for (const id of ids) {
    const beforeItem = beforeMap.get(id);
    const afterItem = afterMap.get(id);
    let operation: EntityChangeOp;
    if (!beforeItem && afterItem) operation = "create";
    else if (beforeItem && !afterItem) operation = "delete";
    else operation = "update";

    const fields = buildEntityFields(
      beforeItem,
      afterItem,
      adapter.fields as Array<CollectionFieldSpec<never>>,
      operation,
    );
    if (operation === "update" && fields.length === 0) continue;

    const entityLabel = adapter.labelOf((afterItem ?? beforeItem)!);
    entities.push({
      entityKey: `${adapter.collectionKey}:${id}`,
      entityLabel,
      operation,
      fields:
        fields.length > 0
          ? fields
          : operation === "create"
            ? adapter.fields.map((f) => ({
                key: f.key,
                label: f.label,
                before: "",
                after: formatFieldValue(f.get(afterItem!), f.format),
              }))
            : operation === "delete"
              ? adapter.fields.map((f) => ({
                  key: f.key,
                  label: f.label,
                  before: formatFieldValue(f.get(beforeItem!), f.format),
                  after: "",
                }))
              : [],
    });
  }

  if (entities.length === 0) return null;

  const summary = summarizeCollectionChange(baseline.length, draft.length, entities);
  return {
    fieldKey: adapter.collectionKey,
    label: adapter.collectionLabel,
    operation: summary.operation,
    before: summary.before,
    after: summary.after,
    settingsPath: options?.settingsPath,
    groupPath: options?.groupPath,
    entities,
    changeKind: "collection",
  };
}

export function mergeEntityChangeBlocks(
  existing: EntityChangeBlock[] | undefined,
  incoming: EntityChangeBlock[] | undefined,
): EntityChangeBlock[] | undefined {
  if (!existing?.length && !incoming?.length) return undefined;
  if (!existing?.length) return incoming ? incoming.map((e) => ({ ...e, fields: [...e.fields] })) : undefined;
  if (!incoming?.length) return existing.map((e) => ({ ...e, fields: [...e.fields] }));

  const map = new Map<string, EntityChangeBlock>();
  for (const block of existing) {
    map.set(block.entityKey, { ...block, fields: [...block.fields] });
  }
  for (const block of incoming) {
    const prev = map.get(block.entityKey);
    if (!prev) {
      map.set(block.entityKey, { ...block, fields: [...block.fields] });
      continue;
    }
    // 同实体：保留首次 before，采用最新 after / operation 重算语义
    const fieldMap = new Map(prev.fields.map((f) => [f.key, { ...f }]));
    for (const row of block.fields) {
      const prevRow = fieldMap.get(row.key);
      if (prevRow) {
        fieldMap.set(row.key, { ...row, before: prevRow.before });
      } else {
        fieldMap.set(row.key, { ...row });
      }
    }
    const fields = [...fieldMap.values()].filter((f) => f.before !== f.after);
    let operation = block.operation;
    if (prev.operation === "create" && block.operation === "delete") {
      map.delete(block.entityKey);
      continue;
    }
    if (prev.operation === "create") operation = "create";
    else if (block.operation === "delete") operation = "delete";
    else operation = "update";

    if (operation === "update" && fields.length === 0) {
      map.delete(block.entityKey);
      continue;
    }
    map.set(block.entityKey, {
      entityKey: block.entityKey,
      entityLabel: block.entityLabel || prev.entityLabel,
      operation,
      fields,
    });
  }
  const merged = [...map.values()];
  return merged.length > 0 ? merged : undefined;
}

export function collectionChangeHasDiff(change: DeploymentConfigChange): boolean {
  if (!change.entities?.length) return false;
  return change.entities.some(
    (block) =>
      block.operation === "create" ||
      block.operation === "delete" ||
      block.fields.some((f) => f.before !== f.after),
  );
}

export function withCollectionSummary(change: DeploymentConfigChange): DeploymentConfigChange {
  if (!change.entities?.length) return change;
  const create = change.entities.filter((e) => e.operation === "create").length;
  const update = change.entities.filter((e) => e.operation === "update").length;
  const remove = change.entities.filter((e) => e.operation === "delete").length;
  const afterCountGuess =
    // 无法从 entities 精确还原原数量时，用摘要里的数字或实体计数兜底
    create + update + remove;
  const operation = summarizeEntityOperations(change.entities);
  const beforeMatch = /^原\s+(\d+)\s+项/.exec(change.before);
  const afterMatch = /^现\s+(\d+)\s+项/.exec(change.after);
  const beforeCount = beforeMatch ? Number(beforeMatch[1]) : afterCountGuess;
  const afterCount = afterMatch
    ? Number(afterMatch[1])
    : Math.max(0, beforeCount + create - remove);
  return {
    ...change,
    operation,
    before: `原 ${beforeCount} 项`,
    after: `现 ${afterCount} 项（${operation}）`,
    changeKind: "collection",
  };
}
