/**
 * Route definitions and configuration.
 *
 * Provides:
 *  - ROUTES map with normalized route patterns
 *  - configureRoutes(router, controllers) to bind patterns to controller handlers
 *  - pathTo(pattern, params?, query?) helper to build paths with params and query
 *
 * This module is framework-agnostic and uses optional chaining to avoid hard failures
 * when certain controllers or methods are not yet wired. Handlers are lightweight and
 * only delegate to controller entry points.
 */

/**
 * Canonical route patterns for the app.
 */
export const ROUTES = {
  HOME: "/",
  DOCUMENT_LIST: "/documents",
  DOCUMENT_DETAIL: "/document/:id",
  ELEMENT_DETAIL: "/document/:docId/element/:elementId",
  PART_DETAIL: "/document/:docId/element/:elementId/part/:partId",
  ASSEMBLY_DETAIL: "/assembly/:id",
  ASSEMBLY_DETAILED_VIEW: "/assembly/:id/detailed",
  SEARCH_RESULTS: "/search",
  EXPORT_VIEW: "/export/:documentId",
};

/**
 * Configure router with application routes.
 *
 * @param {import('./Router.js').Router} router
 * @param {object} controllers
 * @returns {void}
 */
export function configureRoutes(router, controllers = {}) {
  if (!router || typeof router.register !== "function") {
    throw new Error("configureRoutes: router with register(...) is required");
  }

  // Document details
  router.register(ROUTES.DOCUMENT_DETAIL, (params, state, context) => {
    controllers.document?.showDocument?.(params.id, state, context);
  });

  // Element details
  router.register(ROUTES.ELEMENT_DETAIL, (params, state, context) => {
    controllers.document?.showElement?.(params, state, context);
  });

  // Part details
  router.register(ROUTES.PART_DETAIL, (params, state, context) => {
    controllers.document?.showPart?.(params, state, context);
  });

  // Assembly views
  router.register(ROUTES.ASSEMBLY_DETAIL, (params, state, context) => {
    controllers.assembly?.show?.(params.id, state, context);
  });

  router.register(ROUTES.ASSEMBLY_DETAILED_VIEW, (params, state, context) => {
    controllers.assembly?.showDetailed?.(params.id, state, context);
  });

  // Listing and search
  router.register(ROUTES.DOCUMENT_LIST, (_params, state, context) => {
    controllers.document?.showList?.(state, context) ||
      controllers.app?.showDashboard?.(state, context);
  });

  router.register(ROUTES.SEARCH_RESULTS, (_params, state, context) => {
    controllers.search?.showResults?.(state, context) ||
      controllers.documentList?.applySearch?.(context?.query || {}, state);
  });

  // Export route (document-centric)
  router.register(ROUTES.EXPORT_VIEW, (params, state, context) => {
    controllers.export?.showForDocument?.(params.documentId, state, context) ||
      controllers.export?.show?.(state, context);
  });

  // Home route fallback to dashboard/list
  router.register(ROUTES.HOME, (_params, state, context) => {
    controllers.app?.showHome?.(state, context);
  });

  // 404
  router.setNotFound?.((path, context) => {
    controllers.app?.showNotFound?.(path, context);
  });
}

/**
 * Build a concrete path from a route pattern and params.
 *
 * @param {string} pattern e.g. "/document/:id"
 * @param {Record<string,string|number>} [params]
 * @param {Record<string,string|string[]>} [query]
 * @returns {string} resolved path, e.g. "/document/123?foo=bar"
 */
export function pathTo(pattern, params = {}, query = undefined) {
  if (typeof pattern !== "string") pattern = String(pattern ?? "");
  let out = pattern;

  // Replace :param segments
  out = out.replace(/:([A-Za-z0-9_]+)/g, (_m, key) => {
    const val = params[key];
    if (val == null) {
      // Keep the token if missing so caller can detect; safer than throwing
      return `:${key}`;
    }
    return encodeURIComponent(String(val));
  });

  // Append query if provided
  if (query && typeof query === "object") {
    const usp = new URLSearchParams();
    for (const [k, v] of Object.entries(query)) {
      if (v == null) continue;
      if (Array.isArray(v)) {
        for (const item of v) usp.append(k, String(item));
      } else {
        usp.set(k, String(v));
      }
    }
    const qs = usp.toString();
    if (qs) out += (out.includes("?") ? "&" : "?") + qs;
  }

  // Ensure leading slash
  if (!out.startsWith("/")) out = `/${out}`;
  return out;
}

export default {
  ROUTES,
  configureRoutes,
  pathTo,
};
