class _EventBus {
  constructor() {
    this._events = {};
  }

  on(event, fn) {
    if (typeof fn !== 'function') {
      throw new Error('_EventsBus.on callback not function!');
    }

    this._events[event] = fn;
  }

  emit(event, ...args) {
    const cb = this._events[event];
    if (cb) {
      cb(...args);
    }
  }

  off(event) {
    if (Array.isArray(event)) {
      for (let i = 0, len = event.length; i < len; i++) {
        this.off(event[i]);
      }
      return;
    }
    if (this._events[event]) {
      delete this._events[event];
    }
  }
}

export const EventBus = new _EventBus();
