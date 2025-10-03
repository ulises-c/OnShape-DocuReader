/**
 * HistoryState - manages capture/restore of view/application state for navigation.
 *
 * Design:
 * - Works with browser history.state to persist lightweight, serializable view state.
 * - Captures scroll positions and optionally view-specific state via injected strategies.
 * - Integrates with an external state manager (if provided) using duck-typed APIs.
 *
 * Usage:
 *   const historyState = new HistoryState(stateManager, {
 *     scrollSelectors: ['.documents-section'],
 *     strategies: {
 *       documentList: {
 *         capture: () => ({
 *           filters: { q: document.querySelector('#searchInput')?.value || '' },
 *           ui: { selectedIds: Array.from(document.querySelectorAll('.document-checkbox:checked')).map(c => c.value) }
 *         }),
 *         restore: (snap) => {
 *           if (snap?.filters?.q != null) {
 *             const el = document.querySelector('#searchInput');
 *             if (el) el.value = snap.filters.q;
 *           }
 *           if (Array.isArray(snap?.ui?.selectedIds)) {
 *             for (const cb of document.querySelectorAll('.document-checkbox')) {
 *               cb.checked = snap.ui.selectedIds.includes(cb.value);
 *             }
 *           }
 *         }
 *       },
 *       documentDetail: {
 *         capture: () => ({}),
 *         restore: () => {}
 *       }
 *     }
 *   });
 */
class HistoryState {
  /**
   * @param {any} [stateManager] Optional app state manager (duck-typed). If provided, the following methods are probed:
   *   - getSnapshot() | getState() | toJSON()  (to capture)
   *   - replace(state) | replaceState(state)   (to restore)
   * @param {{
   *   scrollSelectors?: string[],
   *   strategies?: Record<string, { capture?: () => any, restore?: (snapshot:any) => void }>
   * }} [options]
   */
  constructor(stateManager = null, options = {}) {
    this.stateManager = stateManager || null;
    this.scrollSelectors = Array.isArray(options.scrollSelectors)
      ? options.scrollSelectors.slice()
      : ["[data-scroll-preserve]"];

    this.strategies =
      options.strategies && typeof options.strategies === "object"
        ? { ...options.strategies }
        : {};
  }

  /**
   * Capture current view state (scroll, filters, ui) and optionally app state.
   * The returned object is safe to place into history.state.
   *
   * @param {string} viewType Logical view identifier (e.g., "documentList", "documentDetail")
   * @param {object} [extra] Additional serializable info to include (route params, etc.)
   * @returns {object} serializable state snapshot
   */
  captureState(viewType, extra = {}) {
    const base = {
      version: 1,
      view: viewType || "unknown",
      timestamp: new Date().toISOString(),
    };

    const viewSnap = this._captureViewState(viewType);
    const scroll = this._captureScrollSafe();

    const appState = this._captureAppStateSafe();

    return this._safeClone({
      ...base,
      ...extra,
      scroll,
      viewSnapshot: viewSnap || {},
      appState,
    });
  }

  /**
   * Restore a previously captured state (from history.state).
   * Applies app state (if stateManager provided), then view-specific state, then scroll.
   *
   * @param {any} historyState State object captured via captureState(...)
   */
  restoreState(historyState) {
    if (!historyState || typeof historyState !== "object") return;

    const snap = historyState;

    // Restore app state first so views can render according to it
    this._restoreAppStateSafe(snap.appState);

    // Restore view state using strategy, if any
    this._restoreViewState(snap.view, snap.viewSnapshot);

    // Restore scroll positions after paint to ensure elements exist
    if (snap.scroll) {
      const doRestoreScroll = () => this._restoreScrollSafe(snap.scroll);
      if (typeof requestAnimationFrame === "function") {
        requestAnimationFrame(() => {
          // Use a second frame for more robust layout stabilization
          requestAnimationFrame(doRestoreScroll);
        });
      } else {
        setTimeout(doRestoreScroll, 0);
      }
    }
  }

  /**
   * Return a deep-cloned, JSON-serializable copy of the provided state.
   * @param {any} state
   * @returns {any}
   */
  serializeViewState(state) {
    return this._safeClone(state);
  }

  /**
   * Deserialize a view state payload. Here we simply validate it's an object and return it.
   * @param {any} state
   * @returns {any}
   */
  deserializeViewState(state) {
    if (!state || typeof state !== "object") return null;
    return state;
  }

  /**
   * Register or override a strategy for a viewType.
   * @param {string} viewType
   * @param {{ capture?: () => any, restore?: (snapshot:any) => void }} strategy
   */
  registerStrategy(viewType, strategy) {
    if (!viewType || typeof strategy !== "object") return;
    this.strategies[viewType] = { ...strategy };
  }

  /**
   * Remove a strategy for a viewType.
   * @param {string} viewType
   */
  unregisterStrategy(viewType) {
    delete this.strategies[viewType];
  }

  // ---- Internals ----

  _captureViewState(viewType) {
    try {
      const strat = viewType ? this.strategies[viewType] : null;
      if (strat && typeof strat.capture === "function") {
        const res = strat.capture();
        return this._safeClone(res ?? {});
      }
    } catch (err) {
      console.error("HistoryState capture strategy error:", err);
    }

    // Fallback basic capture for common filters if no strategy registered.
    try {
      if (typeof document !== "undefined") {
        const filters = {};
        const q = document.querySelector("#searchInput");
        if (q && "value" in q) filters.q = q.value;

        // Checkbox selections (document list common pattern)
        const selected = Array.from(
          document.querySelectorAll(".document-checkbox:checked")
        ).map((cb) => cb.value);
        const ui = { selectedIds: selected };

        return { filters, ui };
      }
    } catch (err) {
      // noop fallback
    }

    return {};
  }

  _restoreViewState(viewType, snapshot) {
    try {
      const strat = viewType ? this.strategies[viewType] : null;
      if (strat && typeof strat.restore === "function") {
        strat.restore(this.deserializeViewState(snapshot));
        return;
      }
    } catch (err) {
      console.error("HistoryState restore strategy error:", err);
      return;
    }

    // Fallback basic restore
    try {
      if (
        typeof document !== "undefined" &&
        snapshot &&
        typeof snapshot === "object"
      ) {
        if (snapshot.filters && typeof snapshot.filters.q === "string") {
          const q = document.querySelector("#searchInput");
          if (q && "value" in q) q.value = snapshot.filters.q;
        }
        if (snapshot.ui && Array.isArray(snapshot.ui.selectedIds)) {
          const selectedSet = new Set(snapshot.ui.selectedIds);
          for (const cb of document.querySelectorAll(".document-checkbox")) {
            cb.checked = selectedSet.has(cb.value);
          }
        }
      }
    } catch (err) {
      // noop fallback
    }
  }

  _captureScrollSafe() {
    if (typeof window === "undefined" || typeof document === "undefined") {
      return { x: 0, y: 0, containers: [] };
    }
    const win = { x: window.scrollX || 0, y: window.scrollY || 0 };
    const containers = [];

    // Collect scroll positions for configured containers
    for (const selector of this.scrollSelectors) {
      try {
        const nodes = document.querySelectorAll(selector);
        for (const el of nodes) {
          if (!el) continue;
          const key =
            el.getAttribute("data-scroll-key") || el.id || this._nodeKey(el);
          const st = /** @type {HTMLElement} */ (el).scrollTop || 0;
          const sl = /** @type {HTMLElement} */ (el).scrollLeft || 0;
          containers.push({ key, selector, top: st, left: sl });
        }
      } catch {
        // ignore selector issues
      }
    }

    return { ...win, containers };
  }

  _restoreScrollSafe(scroll) {
    if (!scroll || typeof scroll !== "object") return;
    if (typeof window !== "undefined") {
      try {
        window.scrollTo(scroll.x || 0, scroll.y || 0);
      } catch {
        // ignore
      }
    }
    if (typeof document === "undefined") return;

    if (Array.isArray(scroll.containers)) {
      for (const c of scroll.containers) {
        try {
          let el = null;
          if (c.key) {
            el =
              document.querySelector(
                `[data-scroll-key="${CSS.escape(c.key)}"]`
              ) ||
              document.getElementById(c.key) ||
              null;
          }
          if (!el && c.selector) {
            const list = document.querySelectorAll(c.selector);
            el = list?.[0] || null;
          }
          if (el) {
            /** @type {HTMLElement} */ (el).scrollTop = c.top || 0;
            /** @type {HTMLElement} */ (el).scrollLeft = c.left || 0;
          }
        } catch {
          // ignore
        }
      }
    }
  }

  _captureAppStateSafe() {
    if (!this.stateManager) return null;
    try {
      if (typeof this.stateManager.getSnapshot === "function") {
        return this._safeClone(this.stateManager.getSnapshot());
      }
      if (typeof this.stateManager.getState === "function") {
        return this._safeClone(this.stateManager.getState());
      }
      if (typeof this.stateManager.toJSON === "function") {
        return this._safeClone(this.stateManager.toJSON());
      }
    } catch (err) {
      console.warn("HistoryState: failed to capture app state:", err);
    }
    return null;
  }

  _restoreAppStateSafe(state) {
    if (!this.stateManager || state == null) return;
    try {
      if (typeof this.stateManager.replace === "function") {
        this.stateManager.replace(this._safeClone(state));
        return;
      }
      if (typeof this.stateManager.replaceState === "function") {
        this.stateManager.replaceState(this._safeClone(state));
        return;
      }
      // If no replace API, skip to avoid mutating unknown types
    } catch (err) {
      console.warn("HistoryState: failed to restore app state:", err);
    }
  }

  _safeClone(obj) {
    try {
      return obj == null ? obj : JSON.parse(JSON.stringify(obj));
    } catch {
      return null;
    }
  }

  _nodeKey(el) {
    try {
      const parts = [];
      let cur = el;
      while (cur && cur.nodeType === 1 && parts.length < 5) {
        const name = cur.nodeName.toLowerCase();
        const id = cur.id ? `#${cur.id}` : "";
        const cls = cur.classList?.length
          ? `.${Array.from(cur.classList).join(".")}`
          : "";
        parts.unshift(`${name}${id}${cls}`);
        cur = cur.parentElement;
      }
      return parts.join(">");
    } catch {
      return "";
    }
  }
}

export { HistoryState };
export default HistoryState;
