/** Synchronous render/default migration is not a user edit. Nested mounts are safe. */
let depth = 0;

export function isPageInitializing(): boolean {
  return depth > 0;
}

export function withPageInitialization<T>(initialize: () => T): T {
  depth += 1;
  try {
    return initialize();
  } finally {
    depth -= 1;
  }
}
