// Centralized application state with a simple observer pattern
const defaultState = Object.freeze({
  user: null,
  isAuthenticated: false,
  currentPage: 'landing',
  documents: [],
  currentDocument: null,
  currentElement: null,
  currentPart: null,
  selectedDocuments: [],
  // Export selection state
  exportSelection: {
    documentIds: [],
    folderIds: []
  }
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

  // Replace the entire state baseline (used by AppController during logout, etc.)
  replaceState(newState) {
    this._state = Object.freeze({ ...defaultState, ...newState });
    this._emit();
  }

  // Export selection helpers
  toggleDocumentSelection(documentId) {
    const current = this._state.exportSelection?.documentIds || [];
    const newIds = current.includes(documentId)
      ? current.filter(id => id !== documentId)
      : [...current, documentId];
    this.setState({
      exportSelection: {
        ...this._state.exportSelection,
        documentIds: newIds
      }
    });
  }

  toggleFolderSelection(folderId) {
    const current = this._state.exportSelection?.folderIds || [];
    const newIds = current.includes(folderId)
      ? current.filter(id => id !== folderId)
      : [...current, folderId];
    this.setState({
      exportSelection: {
        ...this._state.exportSelection,
        folderIds: newIds
      }
    });
  }

  clearExportSelection() {
    this.setState({
      exportSelection: {
        documentIds: [],
        folderIds: []
      }
    });
  }

  getExportSelectionCount() {
    const sel = this._state.exportSelection || {};
    return (sel.documentIds?.length || 0) + (sel.folderIds?.length || 0);
  }

  hasExportSelection() {
    return this.getExportSelectionCount() > 0;
  }

  getExportScope() {
    if (!this.hasExportSelection()) {
      return null;
    }
    const sel = this._state.exportSelection || {};
    return {
      scope: 'partial',
      documentIds: sel.documentIds || [],
      folderIds: sel.folderIds || []
    };
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
