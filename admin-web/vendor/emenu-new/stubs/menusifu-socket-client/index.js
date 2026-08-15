/** Embed stub: native WebSocket to POS (/kpos/api/ws via Vite proxy). */
export class SocketClient {
  constructor(url) {
    this.url = url;
    this.handlers = Object.create(null);
    this.ws = null;
  }

  on(event, handler) {
    if (!this.handlers[event]) this.handlers[event] = [];
    this.handlers[event].push(handler);
    return this;
  }

  off(event, handler) {
    const list = this.handlers[event];
    if (!list) return this;
    this.handlers[event] = handler ? list.filter((h) => h !== handler) : [];
    return this;
  }

  emit(event, ...args) {
    for (const handler of this.handlers[event] || []) {
      try {
        handler(...args);
      } catch (err) {
        console.error("[socket-client stub]", event, err);
      }
    }
    return this;
  }

  connect() {
    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      return Promise.resolve();
    }
    const ws = new WebSocket(this.url);
    this.ws = ws;
    ws.onopen = (evt) => this.emit("open", evt, 1);
    ws.onmessage = (evt) => {
      try {
        const data = typeof evt.data === "string" ? JSON.parse(evt.data) : evt.data;
        this.emit("message", data);
      } catch {
        this.emit("message", { topic: "raw", payload: evt.data });
      }
    };
    ws.onerror = (evt) => this.emit("error", evt);
    ws.onclose = (evt) => this.emit("close", evt);
    return Promise.resolve();
  }

  close(code, reason) {
    if (!this.ws) return;
    try {
      this.ws.close(code, reason);
    } catch {
      /* ignore */
    }
    this.ws = null;
  }

  disconnect() {
    this.close();
  }
}

export default SocketClient;
