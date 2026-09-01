export type PitDirtyRegistration = { currentHash: string; message?: string; onDiscard?: () => void };

let dirtyRegistration: PitDirtyRegistration | null = null;

export function setPitDirtyNavigation(registration: PitDirtyRegistration | null): void {
  dirtyRegistration = registration;
}

export function hasPitDirtyNavigation(): boolean { return dirtyRegistration !== null; }

export function confirmPitDiscard(confirmFn: (message: string) => boolean = window.confirm): boolean {
  if (!dirtyRegistration) return true;
  if (!confirmFn(dirtyRegistration.message ?? "尚有未保存的修改，确定放弃吗？")) return false;
  const discarded = dirtyRegistration;
  dirtyRegistration = null;
  discarded.onDiscard?.();
  return true;
}

/** Called by the app router before it replaces the PIT shell. */
export function guardPitRouteMount(
  nextHash: string,
  confirmFn: (message: string) => boolean = window.confirm,
  replace: (hash: string) => void = (hash) => history.replaceState(history.state, "", hash),
): boolean {
  if (!dirtyRegistration || nextHash === dirtyRegistration.currentHash) return true;
  const restoreHash = dirtyRegistration.currentHash;
  if (!confirmPitDiscard(confirmFn)) {
    replace(restoreHash);
    return false;
  }
  return true;
}
