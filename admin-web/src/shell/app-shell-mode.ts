/**
 * 应用 Shell 模式：商家后台 / M 平台 / eMenu 本地配置后台 / Kiosk 本地配置后台
 */
export type AppShellMode = "merchant" | "m-platform" | "emenu-local" | "kiosk-local";

const STORAGE_KEY = "menusifu:app-shell-mode-v1";
let memoryMode: AppShellMode | undefined;

export function readAppShellMode(): AppShellMode {
  if (memoryMode) return memoryMode;
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    memoryMode = raw === "m-platform" || raw === "emenu-local" || raw === "kiosk-local" ? raw : "merchant";
    return memoryMode;
  } catch {
    memoryMode = "merchant";
    return memoryMode;
  }
}

export function writeAppShellMode(mode: AppShellMode): void {
  memoryMode = mode;
  try {
    if (mode === "merchant") sessionStorage.removeItem(STORAGE_KEY);
    else sessionStorage.setItem(STORAGE_KEY, mode);
  } catch {
    /* ignore */
  }
}

export function isMPlatformShellMode(): boolean {
  return readAppShellMode() === "m-platform";
}

export function isEmenuLocalShellMode(): boolean {
  return readAppShellMode() === "emenu-local";
}

export function isKioskLocalShellMode(): boolean {
  return readAppShellMode() === "kiosk-local";
}

export function enterMPlatformShell(): void {
  writeAppShellMode("m-platform");
}

export function exitMPlatformShell(): void {
  writeAppShellMode("merchant");
}

export function enterEmenuLocalShell(): void {
  writeAppShellMode("emenu-local");
}

export function exitEmenuLocalShell(): void {
  writeAppShellMode("merchant");
}

export function enterKioskLocalShell(): void {
  writeAppShellMode("kiosk-local");
}

export function exitKioskLocalShell(): void {
  writeAppShellMode("merchant");
}
