export interface JsonMenuTreeScrollState {
  top: number;
}

type ScheduleFrame = (callback: () => void) => void;

function treeScrollHost(root: ParentNode): HTMLElement | null {
  return root.querySelector<HTMLElement>("[data-jme-tree-scroll]");
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

