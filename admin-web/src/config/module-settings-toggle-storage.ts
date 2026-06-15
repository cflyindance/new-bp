/**
 * 模块设置开关 localStorage 键（独立文件，避免与 toggle-ui 循环引用）
 */
export function moduleSettingToggleStorageKey(seq: number): string {
  return `bplant-module-setting-toggle:${seq}`;
}
