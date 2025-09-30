// Centralized application state with a simple observer pattern
const defaultState = Object.freeze({
  user: null,
  isAuthenticated: false,
  currentPage: 'landing',
  documents: [],
  currentDocument: null,
  currentElement: null,
  currentPart: null,
  selectedDocuments: []
});

export class AppState {
  constructor() {
    this._state = { ...defaultState };
    this._listeners = new Set();
  }

  subscribe(listener) {
    this._listeners.add(listener);
    return () => this._listeners.delete(listener);
  }

  getState() {
    return { ...this._state };
  }

  setState(patch) {
    this._state = Object.freeze({ ...this._state, ...patch });
    this._emit();
  }

  reset() {
    this._state = { ...defaultState };
    this._emit();
  }

  _emit() {
    for (const fn of this._listeners) {
      try {
        fn(this.getState());
      } catch (e) {
        console.error('State listener error:', e);
      }
    }
  }
}
