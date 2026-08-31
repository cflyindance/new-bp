import type { PitAuthMe, PitUser } from "./pit-types";

type PitSessionSnapshot = { user: PitUser | null; csrfToken: string | null };

let session: PitSessionSnapshot = { user: null, csrfToken: null };

export function getPitSession(): Readonly<PitSessionSnapshot> {
  return session;
}

export function getPitCsrfToken(): string | null {
  return session.csrfToken;
}

export function setPitSession(auth: PitAuthMe): void {
  session = { user: auth.user, csrfToken: auth.csrfToken };
}

export function clearPitSession(): void {
  session = { user: null, csrfToken: null };
}

export function isPitAuthenticated(): boolean {
  return Boolean(session.user && session.csrfToken);
}
