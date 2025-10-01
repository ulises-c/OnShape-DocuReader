/**
 * Lightweight hash-based Router.
 *
 * Responsibilities:
 * - Register route patterns with handlers
 * - Parse hash-based URLs and extract params and query
 * - Manage browser history with pushState/replaceState + hashchange/popstate
 * - Notify subscribers on route changes
 *
 * Notes:
 * - Phase 1 only: infrastructure. No app-specific route configuration yet.
 * - Handlers receive (params, state, context) where context includes path and query.
 */

class Router {
  /**
   * @typedef {Object} RouteDefinition
   * @property {string} pattern The route pattern (e.g. "/document/:id")
   * @property {RegExp} regex The compiled regex for matching
   * @property {string[]} keys Parameter keys extracted from pattern
   * @property {Function} handler Function (params, state, context) invoked on match
   */

  /**
   * @typedef {Object} RouteContext
   * @property {string} path Normalized path (no leading "#", no query/hash suffix)
   * @property {Object.<string, string>} query Parsed query parameters
   * @property {string} hash Full location.hash (as-is)
   */

  constructor() {
    /** @type {Map<string, RouteDefinition>} */
    this.routes = new Map();

    /** @type {Array<Function>} */
    this.subscribers = [];

    /** @type {{ pattern: string, params: Record<string, string>, state: any, context: RouteContext } | null} */
    this.currentRoute = null;

    /** @type {Function | null} */
    this.notFoundHandler = null;

    /** @type {boolean} */
    this.started = false;

    /** @type {boolean} */
    this.suppressNextHashEvent = false;

    this._onHashChange = this._onHashChange.bind(this);
    this._onPopState = this._onPopState.bind(this);
  }

  /**
   * Register a route pattern and its handler.
   * Pattern supports segments and named params like "/document/:id" and optional trailing slash.
   *
   * @param {string} pattern Route pattern (e.g. "/document/:id")
   * @param {(params: Record<string, string>, state: any, context: RouteContext) => void} handler
   * @returns {() => void} Unregister function
   */
  register(pattern, handler) {
    if (typeof pattern !== 'string' || !pattern.startsWith('/')) {
      throw new Error(`Router.register: pattern must start with "/", got "${pattern}"`);
    }
    if (typeof handler !== 'function') {
      throw new Error('Router.register: handler must be a function');
    }

    const { regex, keys } = this._compilePattern(pattern);

    const def = { pattern, regex, keys, handler };
    this.routes.set(pattern, def);

    // Return an unregister function
    return () => {
      this.routes.delete(pattern);
    };
  }

  /**
   * Set custom not-found handler when no routes match.
   * @param {(path: string, context: RouteContext) => void} handler
   */
  setNotFound(handler) {
    if (typeof handler !== 'function') {
      throw new Error('Router.setNotFound: handler must be a function');
    }
    this.notFoundHandler = handler;
  }

  /**
   * Subscribe to route changes.
   * Callback receives { pattern, params, state, context }.
   * @param {(route: { pattern: string, params: Record<string, string>, state: any, context: RouteContext }) => void} callback
   * @returns {() => void} Unsubscribe function
   */
  subscribe(callback) {
    if (typeof callback !== 'function') {
      throw new Error('Router.subscribe: callback must be a function');
    }
    this.subscribers.push(callback);
    return () => {
      const idx = this.subscribers.indexOf(callback);
      if (idx >= 0) this.subscribers.splice(idx, 1);
    };
  }

  /**
   * Start listening to navigation events and handle the initial route.
   * Safe to call multiple times; only the first call attaches listeners.
   */
  start() {
    if (this.started) return;
    this.started = true;

    window.addEventListener('hashchange', this._onHashChange);
    window.addEventListener('popstate', this._onPopState);

    // If no hash is present, default to root route for consistency.
    if (!location.hash) {
      this.replace('/', history.state ?? null);
      return;
    }

    this._handleRouteChange(history.state ?? null);
  }

  /**
   * Navigate to a new route (adds a history entry).
   * @param {string} path Path without leading "#", may include query (e.g. "/documents?search=q")
   * @param {any} [state] Arbitrary state to store with history entry
   */
  navigate(path, state = null) {
    const normalized = this._normalizePath(path);
    // Use pushState to preserve an entry and set hash to keep hash routing semantics
    this.suppressNextHashEvent = true;
    history.pushState(state, '', `#${normalized}`);
    this._handleRouteChange(state);
  }

  /**
   * Replace the current route (no new history entry).
   * @param {string} path Path without leading "#", may include query
   * @param {any} [state] Arbitrary state to store with history entry
   */
  replace(path, state = null) {
    const normalized = this._normalizePath(path);
    this.suppressNextHashEvent = true;
    history.replaceState(state, '', `#${normalized}`);
    this._handleRouteChange(state);
  }

  /**
   * Go back in history.
   */
  back() {
    history.back();
  }

  /**
   * Go forward in history.
   */
  forward() {
    history.forward();
  }

  /**
   * Internal event: hashchange handler.
   * @param {HashChangeEvent} _evt
   */
  _onHashChange(_evt) {
    if (this.suppressNextHashEvent) {
      // Prevent double-handling when we programmatically changed the hash.
      this.suppressNextHashEvent = false;
      return;
    }
    this._handleRouteChange(history.state ?? null);
  }

  /**
   * Internal event: popstate handler.
   * @param {PopStateEvent} evt
   */
  _onPopState(evt) {
    this._handleRouteChange(evt.state ?? null);
  }

  /**
   * Parse current hash, match route, invoke handler, and notify subscribers.
   * @param {any} state
   */
  _handleRouteChange(state) {
    const { path, query, hash } = this._parseHash();
    const match = this._matchRoute(path);

    const context = { path, query, hash };

    if (match) {
      const { def, params } = match;

      // Maintain currentRoute for consumers that need to know current state
      this.currentRoute = {
        pattern: def.pattern,
        params,
        state,
        context
      };

      try {
        def.handler(params, state, context);
      } catch (err) {
        // Handlers should not break the router; surface error cleanly.
        console.error('Router handler error:', err);
      }

      // Notify subscribers after handler runs
      this._notifySubscribers(this.currentRoute);
    } else {
      // No route matched
      this.currentRoute = {
        pattern: '',
        params: {},
        state,
        context
      };
      if (this.notFoundHandler) {
        try {
          this.notFoundHandler(path, context);
        } catch (err) {
          console.error('Router notFound handler error:', err);
        }
      } else {
        console.warn(`Router: no route matched "${path}"`);
      }
      this._notifySubscribers(this.currentRoute);
    }
  }

  /**
   * Match a path to a registered route.
   * @param {string} path
   * @returns {{ def: RouteDefinition, params: Record<string, string> } | null}
   */
  _matchRoute(path) {
    for (const def of this.routes.values()) {
      const m = def.regex.exec(path);
      if (!m) continue;

      const params = {};
      for (let i = 1; i < m.length; i++) {
        const key = def.keys[i - 1];
        const value = m[i] ? decodeURIComponent(m[i]) : '';
        params[key] = value;
      }
      return { def, params };
    }
    return null;
  }

  /**
   * Compile a route pattern to a regex and collect param keys.
   * Supports:
   *  - Static segments: "/documents"
   *  - Params: "/document/:id"
   *  - Optional trailing slash
   *
   * @param {string} pattern
   * @returns {{ regex: RegExp, keys: string[] }}
   */
  _compilePattern(pattern) {
    const keys = [];
    // Escape regex special chars except ":" and "/"
    const escaped = pattern
      .replace(/([.+*?=^${}()|[\]\\])/g, '\\$1')
      .replace(/\/:([^/]+)/g, (_m, key) => {
        keys.push(key);
        return '/([^/]+)';
      });

    // Allow optional trailing slash and ensure full-string match
    const regex = new RegExp(`^${escaped}/?$`, 'i');

    return { regex, keys };
  }

  /**
   * Normalize a path: ensure it starts with "/", remove extra hash prefix, trim whitespace.
   * @param {string} path
   * @returns {string}
   */
  _normalizePath(path) {
    if (typeof path !== 'string') path = String(path ?? '');
    let p = path.trim();

    // Strip any leading "#" if provided
    if (p.startsWith('#')) p = p.slice(1);

    // Ensure leading slash
    if (!p.startsWith('/')) p = `/${p}`;

    return p;
  }

  /**
   * Parse location.hash into path and query.
   * @returns {RouteContext}
   */
  _parseHash() {
    const raw = location.hash || '';
    const hash = raw;
    const trimmed = raw.startsWith('#') ? raw.slice(1) : raw;
    const [pathPart, queryString = ''] = trimmed.split('?');

    const path = this._normalizePath(pathPart || '/');
    const query = this._parseQuery(queryString);

    return { path, query, hash };
  }

  /**
   * Parse a query string into an object. Supports repeated keys as arrays.
   * @param {string} queryString
   * @returns {Object.<string, string | string[]>}
   */
  _parseQuery(queryString) {
    const out = {};
    if (!queryString) return out;

    const usp = new URLSearchParams(queryString);
    for (const [key, value] of usp.entries()) {
      if (Object.prototype.hasOwnProperty.call(out, key)) {
        const cur = out[key];
        if (Array.isArray(cur)) {
          cur.push(value);
        } else {
          out[key] = [cur, value];
        }
      } else {
        out[key] = value;
      }
    }
    return out;
  }

  /**
   * Notify all subscribers with the current route snapshot.
   * @param {{ pattern: string, params: Record<string, string>, state: any, context: RouteContext }} snapshot
   */
  _notifySubscribers(snapshot) {
    if (!this.subscribers.length) return;
    for (const fn of [...this.subscribers]) {
      try {
        fn(snapshot);
      } catch (err) {
        console.error('Router subscriber error:', err);
      }
    }
  }

  /**
   * Clean up listeners. Does not clear registered routes.
   */
  destroy() {
    if (!this.started) return;
    window.removeEventListener('hashchange', this._onHashChange);
    window.removeEventListener('popstate', this._onPopState);
    this.started = false;
  }
}

export { Router };
export default Router;
