let loadingCount = 0;
const listeners = new Set();

function notify() {
  const isLoading = loadingCount > 0;
  listeners.forEach((listener) => listener(isLoading));
}

export function beginConfigFetchLoading() {
  loadingCount += 1;
  notify();
}

export function endConfigFetchLoading() {
  loadingCount = Math.max(0, loadingCount - 1);
  notify();
}

export function subscribeConfigFetchLoading(listener) {
  listeners.add(listener);
  listener(loadingCount > 0);
  return () => listeners.delete(listener);
}
