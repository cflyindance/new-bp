let contextChangeDepth = 0;

export function isImpersonationContextChanging(): boolean {
  return contextChangeDepth > 0;
}

/** Scope events still publish; the shell renders once after the final navigation. */
export function withImpersonationContextChange<T>(prepare: () => T): T {
  contextChangeDepth++;
  try { return prepare(); }
  finally { contextChangeDepth--; }
}
