/**
 * AppState - central immutable state with observer pattern
 */

export class AppState {
  constructor() {
    this.subscribers = new Set();
    this.state = {
      user: null,
      isAuthenticated: false,
      currentPage: 'landing',
      documents: [],
      currentDocument: null,
      currentElement: null,
      currentPart: null,
      selectedDocuments: []
    };
  }

  subscribe(fn) {
    this.subscribers.add(fn);
    return () => this.subscribers.delete(fn);
  }

  getState() {
    return this.state;
  }

  setState(partial) {
    const prev = this.state;
    const next = { ...prev, ...partial };
    this.state = next;
    this.notify(prev, next);
    return next;
  }

  replaceState(next) {
    const prev = this.state;
    this.state = { ...next };
    this.notify(prev, this.state);
    return this.state;
  }

  notify(prev, next) {
    for (const fn of this.subscribers) {
      try {
        fn(prev, next);
      } catch (e) {
        console.error('State subscriber error:', e);
      }
    }
  }
}
