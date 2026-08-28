type InlineStyleSnapshot = Record<string, { value: string; priority: string }>;

export type RuleIframeFullscreenOptions = {
  frameSelector: string;
  fullscreenPages: ReadonlySet<string>;
  listPage: string;
};

const FRAME_STYLE_PROPERTIES = ["position", "inset", "width", "height", "z-index", "background", "border"] as const;

let ownerFrame: HTMLIFrameElement | null = null;
let ownerToken = 0;
let documentSnapshot: { htmlOverflow: string; bodyOverflow: string; scrollX: number; scrollY: number } | null = null;
const frameSnapshots = new WeakMap<HTMLIFrameElement, InlineStyleSnapshot>();

function captureFrameStyle(frame: HTMLIFrameElement): InlineStyleSnapshot {
  return Object.fromEntries(FRAME_STYLE_PROPERTIES.map((property) => [property, {
    value: frame.style.getPropertyValue(property),
    priority: frame.style.getPropertyPriority(property),
  }]));
}

export function restoreFrameStyle(frame: HTMLIFrameElement): void {
  const snapshot = frameSnapshots.get(frame);
  if (!snapshot) return;
  FRAME_STYLE_PROPERTIES.forEach((property) => {
    const saved = snapshot[property];
    if (saved.value) frame.style.setProperty(property, saved.value, saved.priority);
    else frame.style.removeProperty(property);
  });
  frameSnapshots.delete(frame);
  delete frame.dataset.ruleIframeFullscreen;
}

function restoreDocumentState(): void {
  if (!documentSnapshot) return;
  const saved = documentSnapshot;
  document.documentElement.style.overflow = saved.htmlOverflow;
  document.body.style.overflow = saved.bodyOverflow;
  documentSnapshot = null;
  window.scrollTo(saved.scrollX, saved.scrollY);
}

export function exitRuleIframeFullscreen(frame?: HTMLIFrameElement): void {
  const target = frame ?? ownerFrame;
  if (!target) return;
  const ownsLock = ownerFrame === target;
  restoreFrameStyle(target);
  if (!ownsLock) return;
  ownerFrame = null;
  ownerToken += 1;
  restoreDocumentState();
}

function enterRuleIframeFullscreen(frame: HTMLIFrameElement): number {
  if (ownerFrame === frame) return ownerToken;
  if (ownerFrame) exitRuleIframeFullscreen(ownerFrame);
  if (!frameSnapshots.has(frame)) frameSnapshots.set(frame, captureFrameStyle(frame));
  if (!documentSnapshot) {
    documentSnapshot = {
      htmlOverflow: document.documentElement.style.overflow,
      bodyOverflow: document.body.style.overflow,
      scrollX: window.scrollX,
      scrollY: window.scrollY,
    };
  }
  ownerFrame = frame;
  ownerToken += 1;
  frame.dataset.ruleIframeFullscreen = "1";
  Object.assign(frame.style, {
    position: "fixed", inset: "0", width: "100vw", height: "100vh",
    zIndex: "2147483000", background: "#f5f6f7", border: "0",
  });
  document.documentElement.style.overflow = "hidden";
  document.body.style.overflow = "hidden";
  return ownerToken;
}

function iframePageName(frame: HTMLIFrameElement): string | null {
  const pathname = frame.contentWindow?.location.pathname;
  if (!pathname) return null;
  return pathname.split("/").filter(Boolean).pop() ?? null;
}

export function bindRuleIframeFullscreen(root: HTMLElement, options: RuleIframeFullscreenOptions): () => void {
  const frame = root.querySelector<HTMLIFrameElement>(options.frameSelector);
  if (!frame) return () => undefined;
  const bindingKey = "ruleIframeFullscreenBound";
  if (frame.dataset[bindingKey] === "1") return () => undefined;
  frame.dataset[bindingKey] = "1";
  let active = true;
  let bindingToken = ownerToken;

  const sync = (): void => {
    if (!active) return;
    let pageName: string | null = null;
    try {
      pageName = iframePageName(frame);
    } catch {
      exitRuleIframeFullscreen(frame);
      return;
    }
    if (pageName && options.fullscreenPages.has(pageName)) {
      bindingToken = enterRuleIframeFullscreen(frame);
      return;
    }
    if (pageName === options.listPage || !pageName || !options.fullscreenPages.has(pageName)) {
      if (ownerFrame !== frame || bindingToken === ownerToken) exitRuleIframeFullscreen(frame);
    }
  };

  frame.addEventListener("load", sync);
  sync();

  const teardown = (): void => {
    if (!active) return;
    active = false;
    frame.removeEventListener("load", sync);
    delete frame.dataset[bindingKey];
    exitRuleIframeFullscreen(frame);
  };
  return teardown;
}

export function releaseRuleIframeFullscreen(): void {
  if (ownerFrame) exitRuleIframeFullscreen(ownerFrame);
  else restoreDocumentState();
}
