export function configureViewport() {
  const userAgent = window.navigator.userAgent;
  const head = document.getElementsByTagName('head')[0];
  const dpr = window.devicePixelRatio || 1;
  const addViewportMeta = (scale) => {
    const meta = document.createElement('meta');
    meta.name = 'viewport';
    meta.content = `width=device-width,initial-scale=${scale},minimum-scale=${scale},maximum-scale=${scale},user-scalable=no`;
    head.appendChild(meta);
  };
  if (dpr <= 1 && window.screen.width < 1080) {
    document.documentElement.style.fontSize = '38.5%';
  } else if (/Android|Adr/i.test(userAgent)) {
    addViewportMeta(1 / dpr);
  } else if (/iPad|iPhone|iPod/i.test(userAgent)) {
    addViewportMeta(0.8 / dpr);
  } else {
    document.documentElement.style.fontSize = '38.5%';
  }
}

configureViewport();
