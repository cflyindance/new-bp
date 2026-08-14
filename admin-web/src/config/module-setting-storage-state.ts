import { moduleSettingStorageKey } from "./module-settings-form-ui";
import { readPageDraftFieldForCurrentPath } from "./page-settings-draft";

export type ModuleSettingJsonState =
  | { state: "missing" }
  | { state: "configured"; value: unknown }
  | { state: "invalid" };

export function readModuleSettingJsonState(fieldId: string): ModuleSettingJsonState {
  try {
    const draft = readPageDraftFieldForCurrentPath(fieldId);
    const raw = draft !== undefined ? draft : localStorage.getItem(moduleSettingStorageKey(fieldId));
    if (raw === null || raw === "") return { state: "missing" };
    try {
      return { state: "configured", value: JSON.parse(raw) };
    } catch {
      return { state: "invalid" };
    }
  } catch {
    return { state: "invalid" };
  }
}
