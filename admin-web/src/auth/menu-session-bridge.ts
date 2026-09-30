// Same-origin, live-session handoff for the independent product. No credentials
// in URLs or persistent storage; closing/logging out the source fails closed.
const sources = new Map<string, BroadcastChannel>();
export function createMenuSessionLink(url: string, readEmail: () => string | null): string {
  if (typeof BroadcastChannel === 'undefined') return url;
  const target = new URL(url);
  const id = crypto.randomUUID();
  const channel = new BroadcastChannel(`menu-session:${id}`);
  sources.set(id, channel);
  channel.onmessage = event => {
    if (event.data?.type !== 'request' || typeof event.data.requestId !== 'string') return;
    channel.postMessage({type: 'response', requestId: event.data.requestId, email: readEmail()});
  };
  target.searchParams.set('menuSession', id);
  return target.href;
}
export async function requestMenuSession(url: string, timeout = 1500): Promise<string | null> {
  const id = new URL(url).searchParams.get('menuSession');
  if (!id || typeof BroadcastChannel === 'undefined') return null;
  return new Promise(resolve => {
    const channel = new BroadcastChannel(`menu-session:${id}`);
    const requestId = crypto.randomUUID();
    const finish = (email: string | null) => {clearTimeout(timer); channel.close(); resolve(email);};
    const timer = setTimeout(() => finish(null), timeout);
    channel.onmessage = event => {
      if (event.data?.type !== 'response' || event.data.requestId !== requestId) return;
      finish(typeof event.data.email === 'string' && event.data.email.trim() ? event.data.email : null);
    };
    channel.postMessage({type: 'request', requestId});
  });
}
