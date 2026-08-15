/** Kiosk Lite 按 1920×1080 设计；嵌入时用固定逻辑尺寸再 scale 进 16:9 舞台，避免底部按钮被裁切。 */

export const KIOSK_EMBED_DESIGN_WIDTH = 1920;
export const KIOSK_EMBED_DESIGN_HEIGHT = 1080;

const STAGE_SELECTOR = "[data-kiosk-embed-stage]";
const IFRAME_SELECTOR = "iframe[data-kiosk-embed-iframe]";

let windowListenersBound = false;
let resizeObserver: ResizeObserver | null = null;

export function fitKioskEmbedStages(root: ParentNode = document): void {
  root.querySelectorAll<HTMLElement>(STAGE_SELECTOR).forEach((stage) => {
    const iframe = stage.querySelector<HTMLIFrameElement>(IFRAME_SELECTOR);
    if (!iframe) return;
    const width = stage.clientWidth;
    const height = stage.clientHeight;
    if (width <= 0 || height <= 0) return;
    const scale = Math.min(width / KIOSK_EMBED_DESIGN_WIDTH, height / KIOSK_EMBED_DESIGN_HEIGHT);
    iframe.style.width = `${KIOSK_EMBED_DESIGN_WIDTH}px`;
    iframe.style.height = `${KIOSK_EMBED_DESIGN_HEIGHT}px`;
    iframe.style.transform = `scale(${scale})`;
    iframe.style.transformOrigin = "top left";
  });
}

export function bindKioskEmbedViewportFit(): void {
  fitKioskEmbedStages();

  document.querySelectorAll<HTMLIFrameElement>(IFRAME_SELECTOR).forEach((iframe) => {
    if (iframe.dataset.kioskEmbedFitBound === "1") return;
    iframe.dataset.kioskEmbedFitBound = "1";
    iframe.addEventListener("load", () => fitKioskEmbedStages());
  });

  if (typeof ResizeObserver !== "undefined") {
    if (!resizeObserver) {
      resizeObserver = new ResizeObserver(() => fitKioskEmbedStages());
    }
    document.querySelectorAll<HTMLElement>(STAGE_SELECTOR).forEach((stage) => {
      resizeObserver?.observe(stage);
    });
  }

  if (!windowListenersBound) {
    windowListenersBound = true;
    window.addEventListener("resize", () => fitKioskEmbedStages());
  }

  requestAnimationFrame(() => fitKioskEmbedStages());
}
