export interface JsonMenuTreeScrollState {
  top: number;
}
export interface JsonMenuDetailScrollState { top: number; }

type ScheduleFrame = (callback: () => void) => void;

function treeScrollHost(root: ParentNode): HTMLElement | null {
  return root.querySelector<HTMLElement>("[data-jme-tree-scroll]");
}
function detailScrollHost(root: ParentNode): HTMLElement | null {
  return root.querySelector<HTMLElement>("[data-jme-detail-panel]");
}

export function captureJsonMenuTreeScroll(root: ParentNode = document): JsonMenuTreeScrollState {
  return { top: treeScrollHost(root)?.scrollTop ?? 0 };
}

export function applyJsonMenuTreeScroll(state: JsonMenuTreeScrollState, root: ParentNode = document): void {
  const host = treeScrollHost(root);
  if (!host) return;
  const maxScroll = Math.max(0, host.scrollHeight - host.clientHeight);
  host.scrollTop = Math.min(Math.max(0, state.top), maxScroll);
}

export function rerenderPreservingJsonMenuTreeScroll(
  render: () => void,
  root: ParentNode = document,
  schedule: ScheduleFrame = (callback) => requestAnimationFrame(callback),
): void {
  const state = captureJsonMenuTreeScroll(root);
  render();
  const restore = (): void => applyJsonMenuTreeScroll(state, root);
  schedule(() => {
    restore();
    schedule(restore);
  });
}

export function captureJsonMenuDetailScroll(root: ParentNode = document): JsonMenuDetailScrollState {
  return { top: detailScrollHost(root)?.scrollTop ?? 0 };
}

export function applyJsonMenuDetailScroll(state: JsonMenuDetailScrollState, root: ParentNode = document): void {
  const host = detailScrollHost(root);
  if (!host) return;
  const maxScroll = Math.max(0, host.scrollHeight - host.clientHeight);
  host.scrollTop = Math.min(Math.max(0, state.top), maxScroll);
}

export function rerenderPreservingJsonMenuDetailScroll(
  render: () => void,
  root: ParentNode = document,
  schedule: ScheduleFrame = (callback) => requestAnimationFrame(callback),
): void {
  const state = captureJsonMenuDetailScroll(root);
  render();
  const restore = (): void => applyJsonMenuDetailScroll(state, root);
  restore();
  schedule(() => {
    restore();
    schedule(() => {
      restore();
      schedule(restore);
    });
  });
}
