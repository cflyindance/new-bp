export type PitDirtyRegistration = { currentHash: string; message?: string; onDiscard?: () => void };
let dirtyRegistration: PitDirtyRegistration | null = null;
let pendingDiscard: Promise<boolean> | null = null;
export function setPitDirtyNavigation(registration: PitDirtyRegistration | null): void { dirtyRegistration = registration; }
export function hasPitDirtyNavigation(): boolean { return dirtyRegistration !== null; }
function focusable(dialog: HTMLElement): HTMLElement[] { return [...dialog.querySelectorAll<HTMLElement>('button:not([disabled]), [href], input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])')]; }
export function requestPitDiscard(): Promise<boolean> {
  if (!dirtyRegistration) return Promise.resolve(true);
  if (pendingDiscard) return pendingDiscard;
  const registration = dirtyRegistration;
  const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null;
  const layer = document.createElement("div");
  layer.dataset.pitDiscardDialog = "";
  layer.className = "fixed inset-0 z-[150] grid place-items-center bg-slate-950/55 p-4";
  layer.innerHTML = `<div role="dialog" aria-modal="true" aria-labelledby="pit-discard-title" aria-describedby="pit-discard-description" class="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl dark:bg-slate-900"><h2 id="pit-discard-title" class="text-lg font-bold">放弃未保存的修改？</h2><p id="pit-discard-description" class="mt-3 text-sm leading-6 text-slate-500"></p><div class="mt-6 flex justify-end gap-2"><button type="button" data-pit-discard-cancel class="rounded-xl border px-4 py-2">继续编辑</button><button type="button" data-pit-discard-submit class="rounded-xl bg-rose-600 px-4 py-2 font-bold text-white">放弃修改</button></div></div>`;
  layer.querySelector<HTMLElement>("#pit-discard-description")!.textContent = registration.message ?? "尚有未保存的修改，离开后这些内容将丢失。";
  document.body.append(layer);
  pendingDiscard = new Promise<boolean>((resolve) => {
    const close = (accepted: boolean) => { layer.remove(); pendingDiscard = null; if (accepted && dirtyRegistration === registration) { dirtyRegistration = null; registration.onDiscard?.(); } if (previous?.isConnected) previous.focus(); resolve(accepted); };
    layer.querySelector("[data-pit-discard-cancel]")?.addEventListener("click", () => close(false));
    layer.querySelector("[data-pit-discard-submit]")?.addEventListener("click", () => close(true));
    layer.addEventListener("keydown", (event) => {
      if (event.key === "Escape") { event.preventDefault(); close(false); return; }
      if (event.key !== "Tab") return;
      const items = focusable(layer); if (!items.length) return;
      const first = items[0], last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    });
    layer.querySelector<HTMLElement>("[data-pit-discard-cancel]")?.focus();
  });
  return pendingDiscard;
}
export function guardPitRouteMount(nextHash: string, replace: (hash: string) => void = (hash) => history.replaceState(history.state, "", hash)): boolean {
  if (!dirtyRegistration || nextHash === dirtyRegistration.currentHash) return true;
  const restoreHash = dirtyRegistration.currentHash;
  replace(restoreHash);
  void requestPitDiscard().then((accepted) => { if (accepted) location.hash = nextHash; });
  return false;
}
