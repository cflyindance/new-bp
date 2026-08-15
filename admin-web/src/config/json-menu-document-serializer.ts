import {
  MENU_ACCESS_FIELDS,
  MENU_I18N_FIELDS,
  MENU_MICRO_APP_FIELDS,
  MENU_NODE_FIELDS,
  MENU_PERMISSION_FIELDS,
  MENU_ROOT_FIELDS,
  type MenuDocument,
  type MenuNode,
} from "./json-menu-document-domain";

function hasOwn(value: object, key: string): boolean {
  return Object.prototype.hasOwnProperty.call(value, key);
}

function copyDefined<T extends Record<string, unknown>>(source: T, fields: readonly string[]): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const field of fields) if (hasOwn(source, field) && source[field] !== undefined) result[field] = source[field];
  return result;
}

function serializeNode(node: MenuNode): MenuNode {
  const output = copyDefined(node as unknown as Record<string, unknown>, MENU_NODE_FIELDS) as MenuNode;
  if (node.i18nInfo) {
    const value = copyDefined(node.i18nInfo as Record<string, unknown>, MENU_I18N_FIELDS);
    if (Object.keys(value).length) output.i18nInfo = value;
    else delete output.i18nInfo;
  }
  if (node.microAppConfig) {
    const value = copyDefined(node.microAppConfig as Record<string, unknown>, MENU_MICRO_APP_FIELDS);
    if (Object.keys(value).length) output.microAppConfig = value;
    else delete output.microAppConfig;
  }
  if (node.accessControl) {
    const value = copyDefined(node.accessControl as Record<string, unknown>, MENU_ACCESS_FIELDS);
    if (node.accessControl.permission) {
      const permission = copyDefined(node.accessControl.permission as Record<string, unknown>, MENU_PERMISSION_FIELDS);
      if (Object.keys(permission).length) value.permission = permission;
      else delete value.permission;
    }
    if (Object.keys(value).length) output.accessControl = value;
    else delete output.accessControl;
  }
  if (Object.prototype.hasOwnProperty.call(node, "children")) output.children = (node.children ?? []).map(serializeNode);
  else delete output.children;
  return output;
}

export function serializeMenuDocument(document: MenuDocument): MenuDocument {
  const root = copyDefined(document as unknown as Record<string, unknown>, MENU_ROOT_FIELDS);
  return {
    _id: String(root._id ?? ""),
    name: String(root.name ?? ""),
    menu: (Array.isArray(document.menu) ? document.menu : []).map(serializeNode),
    updatedBy: {
      userId: document.updatedBy.userId,
      timestamp: document.updatedBy.timestamp,
      firstname: document.updatedBy.firstname,
      lastname: document.updatedBy.lastname,
    },
    createdDate: document.createdDate,
  };
}

export function stringifyMenuDocument(document: MenuDocument): string {
  return `${JSON.stringify(serializeMenuDocument(document), null, 2)}\n`;
}
