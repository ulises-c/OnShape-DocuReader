# Code Evaluation Report

Generated: 2025-11-13T16:29:15-08:00

## Files Analyzed

- `public/js/services/SPEC.min.md`
- `public/js/services/thumbnail-service.js`
- `public/js/services/export-service.js`
- `public/js/services/document-service.js`
- `public/js/services/auth-service.js`
- `public/js/services/folder-service.js`
- `public/js/services/api-client.js`

---

## Analysis: `public/js/services/SPEC.min.md`

# 1. Critical/Urgent Issues

- [Architectural Issue] public/js/services/SPEC.min.md::AuthService.checkStatus | AuthService.login | AuthService.getUser  
  AuthService is specified to delegate “all backend endpoints” to ApiClient, yet ApiClient’s interface omits checkStatus(), login(), and getUser().  
  Impact: AuthService cannot conform to the stated layering without either bypassing ApiClient or invoking missing methods, leading to runtime errors, duplicated HTTP logic, and broken testability.

- [Architectural Issue] public/js/services/SPEC.min.md::DocumentService.getParts | DocumentService.getAssemblies | DocumentService.getElementMetadata | DocumentService.getPartMassProperties | DocumentService.getParentInfo | DocumentService.getComprehensiveDocument  
  DocumentService must delegate to ApiClient, but ApiClient exposes no corresponding endpoints for these methods (only getDocuments, getDocument, getElements, exportAll, exportStreamSSE, logout).  
  Impact: Missing backend method coverage forces either unimplemented features or direct HTTP calls from DocumentService, causing fragmentation and likely runtime failures.

- [Design Flaw] public/js/services/SPEC.min.md::ExportService.stream | ApiClient.exportStreamSSE  
  SSE lifecycle/cleanup is unspecified (no close/teardown on complete/error, no reconnection/backoff policy).  
  Impact: Long-lived EventSource connections can leak memory, duplicate events if re-entered, and exhaust server/client resources, potentially leading to app instability.

- [Architectural Issue] public/js/services/SPEC.min.md::ThumbnailService.setup  
  The overarching rule states “no DOM manipulation” in services, yet setup() “binds img listeners.” Its signature (setup(docId, originalUrl, proxyUrl)) also lacks an image element reference needed to bind listeners.  
  Impact: Either hidden DOM coupling via global selectors (brittle and race-prone) or an impossible/ineffective implementation that silently does nothing; both break the layering contract and reliability.

- [Silent Failure] public/js/services/SPEC.min.md::ExportService.execute | ExportService.stream  
  The contract between execute(options) and stream(options, handlers) is undefined: no ordering guarantee, no shared correlation (e.g., job ID), and no idempotence semantics.  
  Impact: Race conditions where stream attaches too early/late or to the wrong job, causing missed events, indefinite hangs, or inconsistent UI state without explicit errors.


# 2. Requires Attention

- [Bug] public/js/services/SPEC.min.md::DocumentService.getElements  
  Responsibilities list getElements() with no parameters, but ApiClient.getElements(docId, wid) requires docId and wid.  
  Impact: Ambiguous usage invites calls with missing identifiers, producing incorrect requests (400/404) or reliance on hidden/global state, leading to unpredictable defects.

- [Design Flaw] public/js/services/SPEC.min.md::DocumentService.getElementMetadata | DocumentService.getPartMassProperties | DocumentService.getParentInfo | DocumentService.getComprehensiveDocument  
  Parameter requirements are unspecified for operations that typically need multiple identifiers (doc/workspace/version/element/part).  
  Impact: Callers cannot reliably invoke these methods; ad-hoc parameter shapes proliferate, causing inconsistent behavior and integration bugs.

- [Design Flaw] public/js/services/SPEC.min.md::DocumentService.getAll | ApiClient.getDocuments  
  Naming inconsistency (getAll vs getDocuments) with no explicit mapping contract.  
  Impact: Higher cognitive load and increased risk of calling the wrong method or mis-mocking during tests/refactors.

- [Design Flaw] public/js/services/SPEC.min.md::ExportService.execute | ApiClient.exportAll  
  The operations appear related but use different names and parameter shapes (“options” vs “options, ids”) without a defined contract.  
  Impact: Confusion over which parameters are mandatory; accidental omission/duplication of ids or options causing export failures or partial/incorrect outputs.

- [Gotcha] public/js/services/SPEC.min.md::ExportService.stream  
  Signature is ambiguous: “stream(options, handlers) returns EventSource.” It’s unclear whether handlers are attached internally or expected to be attached by the caller to the returned EventSource.  
  Impact: Double-binding, out-of-order attachment, or ignored handlers leading to lost or duplicated events.

- [Gotcha] public/js/services/SPEC.min.md::ExportService.events  
  Event taxonomy specifies “start|progress|document-*|complete|error” but “document-*” is not defined.  
  Impact: Consumers cannot subscribe deterministically, causing silent loss of per-document updates and UI desynchronization.

- [Architectural Issue] public/js/services/SPEC.min.md::ApiClient (general)  
  ApiClient is both a fetch wrapper for all REST endpoints and the place for SSE (exportStreamSSE), broadening its scope.  
  Impact: Reduced cohesion and increased coupling (“god object”), complicating testing and maintenance.

- [Design Flaw] public/js/services/SPEC.min.md::ApiClient (request/response handling)  
  No contract exists for error normalization (status mapping, JSON/non-JSON handling, timeouts, cancellation semantics).  
  Impact: Callers may observe inconsistent failure modes (throw vs resolve-with-error-payload), leading to silent error swallowing or misinterpretation of failures as successes.

- [Gotcha] public/js/services/SPEC.min.md::Security/Perf  
  “Tokens in session cookies” is stated without clarifying credential behavior for requests or SSE (same-origin vs cross-origin implications are undefined).  
  Impact: Authentication behavior may be environment-dependent (e.g., 401s during streaming in certain deployments), creating hard-to-reproduce auth failures.

- [Design Flaw] public/js/services/SPEC.min.md::ThumbnailService.setup  
  “Proxy/direct fallback; placeholder on fail” lacks decision criteria, retry limits, and placeholder definition.  
  Impact: Excessive retries, flicker, stale cache behavior, or inconsistent placeholder usage degrade UX and complicate debugging.

- [Design Flaw] public/js/services/SPEC.min.md::ExportService.events  
  No payload schema for events (e.g., progress units, document identifiers, error shapes).  
  Impact: Incompatible consumers and production-only serialization surprises due to mismatched assumptions.


# 3. Low Priority

- [Design Flaw] public/js/services/SPEC.min.md::Interfaces (general)  
  The spec uses abbreviations (e.g., “wid”) and omits type/shape definitions for inputs/outputs across services.  
  Impact: Documentation ambiguity increases onboarding time and error rates, though it does not directly cause runtime failures.

- [Gotcha] public/js/services/SPEC.min.md::ExportService.events  
  The “error” event name may be conflated with EventSource’s native “error” event vs server-emitted error messages.  
  Impact: Confusion about which layer generated the error (network vs application), leading to inconsistent handling and logging.

- [Design Flaw] public/js/services/SPEC.min.md::DocumentService.getComprehensiveDocument  
  No performance/cancellation guidance for a potentially heavy request.  
  Impact: Potential for long UI stalls and wasted resource usage when users navigate away mid-operation, though severity depends on usage patterns.

---

## Analysis: `public/js/services/thumbnail-service.js`

### 1. Critical/Urgent Issues

- [Bug] public/js/services/thumbnail-service.js::setup  
  DOM XSS risk via unsanitized innerHTML. In the error handler’s else branch, placeholder.innerHTML is set with unescaped dynamic values: `Proxy: ${proxyUrl}` and `Direct: ${originalUrl}`. If either value contains HTML or script payloads, they are injected directly into the DOM.  
  Impact: Arbitrary script/HTML injection (XSS), enabling credential theft, session hijacking, or arbitrary actions in the user’s browser.

- [Gotcha] public/js/services/thumbnail-service.js::setup  
  Reverse tabnabbing vulnerability with window.open. The code calls `window.open(originalUrl, '_blank')` without noopener/noreferrer. The opened page can access `window.opener` and navigate the original page.  
  Impact: Security risk where a malicious target page can manipulate or redirect the originating tab (phishing/credential theft).


### 2. Requires Attention

- [Bug] public/js/services/thumbnail-service.js::setup  
  Unused proxyUrl and no initial assignment of img.src results in inconsistent fallback logic. The function accepts proxyUrl but never sets `img.src = proxyUrl` (or any src). The error handler assumes the initial attempt used the proxy (“Proxy failed, trying direct URL”), which may be false if the image’s src was not set beforehand or was set to a non-proxy value elsewhere.  
  Impact: Silent misbehavior (thumbnail never loads if markup didn’t set src), misleading logs, and a fallback path that may not match the actual loading attempt.

- [Silent Failure] public/js/services/thumbnail-service.js::setup  
  Load handler may not fire for cached images. The code registers `img.addEventListener('load', ...)` after the image may have already loaded (e.g., from cache). In such cases, the load event will not fire, leaving `placeholder` visible and not switching the `img` to visible state.  
  Impact: Stuck UI state (placeholder remains shown and/or image remains hidden) without errors, confusing users.

- [Architectural Issue] public/js/services/thumbnail-service.js::setup  
  No teardown/deduplication of event listeners; repeated setup calls accumulate handlers on the same DOM elements. Each call adds new load/error/click listeners without checking or removing existing ones.  
  Impact: Memory leaks and duplicate behavior (e.g., multiple new tabs opening on a single click, duplicated logs), degrading performance and UX over time.

- [Design Flaw] public/js/services/thumbnail-service.js::setup  
  Hard-coded style override: `img.style.display = 'block'` disregards existing CSS/layout expectations (e.g., inline/inline-block/flex/grid).  
  Impact: Layout breakage and inconsistent rendering across different pages/components relying on CSS for display control.

- [Design Flaw] public/js/services/thumbnail-service.js::setup  
  Information exposure in UI and logs. On failure, the UI displays full Proxy and Direct URLs, and success logs print `img.src`. These may include sensitive tokens or signed URLs.  
  Impact: Leakage of sensitive data to end users or anyone with console access, increasing risk of token misuse.

- [Architectural Issue] public/js/services/thumbnail-service.js::setup  
  Tight coupling to DOM structure via hard-coded IDs (`document-thumbnail-img-${docId}` and `thumbnail-placeholder-${docId}`) and direct `document.getElementById` lookups.  
  Impact: Fragile integration and poor reusability/testability. Any markup changes break the service; difficult to maintain across varying contexts.

- [Gotcha] public/js/services/thumbnail-service.js::setup  
  Initialization ordering risk. If `setup` is invoked before the DOM nodes exist, it logs an error and returns without any retry/deferral mechanism.  
  Impact: Thumbnail functionality will silently never initialize in those cases, requiring a full page reload or manual intervention.


### 3. Low Priority

- [Gotcha] public/js/services/thumbnail-service.js::setup  
  Misleading error message: “Proxy failed, trying direct URL” is logged on any error, even if the initial `img.src` wasn’t the proxy URL (since `proxyUrl` is never applied by this function).  
  Impact: Confusing diagnostics that hinder troubleshooting.

- [Gotcha] public/js/services/thumbnail-service.js::setup  
  No checks for falsy/invalid originalUrl before using it in `window.open` and as a fallback `img.src`.  
  Impact: Possible opening of a blank or unintended tab or redundant error loops, leading to minor UX issues and noise in logs.

- [Design Flaw] public/js/services/thumbnail-service.js::setup  
  Reliance on console logs for operational feedback in production (`console.log`, `console.error`).  
  Impact: Noisy consoles, potential performance impact, and inconsistent observability; logs may be missed or ignored in real-world debugging.

---

## Analysis: `public/js/services/export-service.js`

### 1. Critical/Urgent Issues

- [Error] public/js/services/export-service.js::execute  
  Accesses properties on options without validating it is an object (e.g., "format: options.format ?? 'json'"). Passing undefined/null to execute will throw a TypeError before any API call.  
  Impact: Immediate runtime crash, aborting the export and potentially breaking the UI flow.

- [Error] public/js/services/export-service.js::stream  
  Accesses properties on options without validating it is an object (e.g., "format: options.format ?? 'json'"). Passing undefined/null to stream will throw a TypeError and prevent the stream from starting.  
  Impact: Immediate runtime crash, no progress streaming possible.

- [Error] public/js/services/export-service.js::stream  
  Adds an error listener that parses the event payload as JSON: "es.addEventListener('error', (e) => handlers.onError(JSON.parse(e.data)))". EventSource error events (network/connection errors) do not carry e.data, so JSON.parse(undefined) will throw.  
  Impact: On any network/SSE error, the error handling path itself fails with an uncaught exception; handler code is not invoked as intended, leading to broken error reporting and possible app instability.


### 2. Requires Attention

- [Design Flaw] public/js/services/export-service.js::stream  
  Inconsistent error payload shape to handlers.onError: the custom listener calls "handlers.onError(JSON.parse(e.data))" while the onerror callback calls "handlers.onError(err)". These two code paths pass different types to the same handler.  
  Impact: Consumers must handle disparate payload types for onError; easy to mishandle, causing downstream errors or inconsistent UI/logic.

- [Design Flaw] public/js/services/export-service.js::stream  
  Unprotected JSON.parse in all event listeners (start, documents-found, progress, document-status, document-complete, document-error, complete). Any non-JSON payload or missing data will throw inside the event handler.  
  Impact: Uncaught exceptions during streaming can break progress updates and error handling, leaving the stream open or the UI stuck in an inconsistent state.

- [Design Flaw] public/js/services/export-service.js::stream  
  Does not close the EventSource on 'complete' (only sets a listener and returns es). If the server signals completion via an event but does not terminate the connection, the client keeps the connection alive.  
  Impact: Potential for lingering open SSE connections, unnecessary resource usage, and memory leaks.

- [Silent Failure] public/js/services/export-service.js::execute, public/js/services/export-service.js::stream  
  Coerces boolean-like options with "!!" and then String(), e.g., "includeBasicInfo: String(!!options.includeBasicInfo)". If the caller provides string values like "false"/"true" (common when options originate from query strings or form inputs), "!!'false'" evaluates to true.  
  Impact: Flags can be silently inverted, producing incorrect export content without any error signals.

- [Gotcha] public/js/services/export-service.js::execute, public/js/services/export-service.js::stream  
  Always sends explicit "false" for omitted flags due to "String(!!options.includeX)". This removes any backend defaults that might otherwise apply when a flag is absent.  
  Impact: Silent deviation from expected default behavior; exports may exclude data the server would normally include by default.

- [Design Flaw] public/js/services/export-service.js::stream  
  Forces closure of the SSE on any error via "es.onerror = (err) => { handlers?.onError?.(err); es.close(); }", disabling EventSource’s automatic reconnection behavior.  
  Impact: Reduced resilience to transient network issues; streaming terminates prematurely and progress reporting stops unexpectedly.

- [Architectural Issue] public/js/services/export-service.js::constructor / ::execute / ::stream  
  No validation that this.api is provided and has the required methods (exportAll/exportStream). Calls to this.api.exportAll/exportStream will throw if api is misconfigured.  
  Impact: Hard failures at runtime if the service is constructed or injected incorrectly; difficult to diagnose without explicit checks.


### 3. Low Priority

- [Design Flaw] public/js/services/export-service.js::execute  
  Logs options to the console ("console.log('Starting advanced export...', options)"), which can be noisy in production and may expose internal state in logs.  
  Impact: Increased log noise; potential minor information disclosure depending on what options may contain.

- [Gotcha] public/js/services/export-service.js::execute, public/js/services/export-service.js::stream  
  No validation of requestsPerMinute; arbitrary values (including 0/negative) are stringified and forwarded: "requestsPerMinute: String(options.requestsPerMinute ?? 30)".  
  Impact: May lead to unpredictable server behavior or throttling bugs that are harder to trace.

- [Design Flaw] public/js/services/export-service.js::execute, public/js/services/export-service.js::stream  
  Sends numeric configuration (requestsPerMinute) as a string. If the underlying API expects a numeric type (e.g., JSON body), this creates a hidden type mismatch that relies on implicit coercion downstream.  
  Impact: Potential subtle integration issues and harder-to-debug parameter handling differences.

---

## Analysis: `public/js/services/document-service.js`

### 1. Critical/Urgent Issues

- [Architectural Issue] public/js/services/document-service.js::getAll  
  The return shape of getAll is inconsistent: it returns the raw API response when this.folderService is falsy, but returns a synthesized object { items, totalCount, groups } when folderService is present.  
  Code references:  
  - if (!this.folderService) return result;  
  - return { items, totalCount, groups };  
  Impact: Callers must defensively handle two different response shapes based on configuration, leading to brittle code, runtime errors, or silent misbehavior in parts of the app that assume a consistent contract.

- [Error] public/js/services/document-service.js::getAll  
  Potential runtime crash if folderService.batchGetFolders resolves to null or undefined. The code accesses folderMap[key] without verifying folderMap is non-null after the await.  
  Code references:  
  - folderMap = await this.folderService.batchGetFolders(nonRootIds);  
  - ... : folderMap[key] || { id: key, ... }  
  Impact: TypeError: Cannot read properties of null/undefined (reading '[key]') at runtime, causing request handling to fail and UI to break.

- [Silent Failure] public/js/services/document-service.js::getAll  
  Unexpected API response shapes are silently treated as “no documents.” If this.api.getDocuments returns an object without an items array and is not itself an array, items is set to [], and no error is raised.  
  Code references:  
  - const items = Array.isArray(result?.items) ? result.items : Array.isArray(result) ? result : [];  
  Impact: Users may see an empty list instead of an error, disguising upstream API breakages, leading to silent data disappearance and difficult debugging.


### 2. Requires Attention

- [Silent Failure] public/js/services/document-service.js::getAll  
  Sorting documents within each group can silently degrade when modifiedAt/modified_at is invalid or missing. The comparator uses new Date(...).getTime() and returns bm - am; if either is NaN, the comparator returns NaN, which is treated as 0 (“equal”), resulting in effectively unsorted items.  
  Code references:  
  - docs.sort((a, b) => { const am = new Date(a.modifiedAt || a.modified_at || 0).getTime(); const bm = new Date(b.modifiedAt || b.modified_at || 0).getTime(); return bm - am; });  
  Impact: Document ordering appears inconsistent or unchanged, undermining the intended “most recent first” UX without any error signal.

- [Silent Failure] public/js/services/document-service.js::getAll  
  Prioritization of folder IDs for metadata fetching can silently fail when any document’s modifiedAt is invalid. Math.max(...dates) over arrays containing NaN yields NaN, and the comparator returns NaN (treated as 0), meaning nonRootIds is effectively unsorted.  
  Code references:  
  - const aMax = aDocs.length ? Math.max(...aDocs.map(x => new Date(...).getTime())) : 0;  
  - return bMax - aMax;  
  Impact: Folder metadata fetch order becomes arbitrary, defeating the stated goal of prioritizing recent activity and potentially affecting perceived responsiveness.

- [Silent Failure] public/js/services/document-service.js::getAll  
  Final sorting of groups by groupModifiedAt can silently degrade if groupModifiedAt is invalid; comparator returns NaN (treated as 0), leaving groups in insertion order rather than recency.  
  Code references:  
  - const am = new Date(a.groupModifiedAt || 0).getTime(); const bm = new Date(b.groupModifiedAt || 0).getTime(); return bm - am;  
  Impact: Group ordering appears inconsistent or dependent on the input order rather than modification time, confusing users.

- [Gotcha] public/js/services/document-service.js::getAll  
  parentId selection uses logical OR, which treats empty string, 0, or false as “no parent,” potentially misclassifying documents into the “root” group.  
  Code references:  
  - const parentId = d.parentId || d.parent?.id || null;  
  Impact: Documents with falsy-but-valid parent identifiers are grouped incorrectly under “Root,” leading to inaccurate grouping.

- [Design Flaw] public/js/services/document-service.js::getAll  
  Fallback totalCount uses items.length when result.totalCount is missing, which can misrepresent total results under pagination.  
  Code references:  
  - totalCount: typeof result?.totalCount === "number" ? result.totalCount : items.length,  
  Impact: The UI may display a total equal to the page size rather than the actual total, misleading users and impairing pagination logic.

- [Gotcha] public/js/services/document-service.js::getComprehensiveDocument  
  documentId is interpolated directly into the URL path without encoding. IDs containing reserved URL characters (e.g., “/” or “?”) can break routing.  
  Code references:  
  - fetch(`/api/documents/${documentId}/comprehensive?${queryString}`)  
  Impact: Requests can fail with 404/400 or hit unintended endpoints if documentId includes special characters, causing intermittent bugs.

- [Architectural Issue] public/js/services/document-service.js::getAll  
  Assumed return type of folderService.batchGetFolders is a plain object keyed by folder id. The code uses bracket access folderMap[key], which fails to support other common return types (e.g., Map, array of records).  
  Code references:  
  - folderMap = await this.folderService.batchGetFolders(nonRootIds);  
  - folderMap[key]  
  Impact: Coupling to an implicit contract increases fragility; any change in folderService return type will break grouping or lead to placeholders being used unexpectedly.

- [Design Flaw] public/js/services/document-service.js::getComprehensiveDocument  
  URLSearchParams(params) behavior with array or complex values will serialize in a way many backends don’t expect (e.g., arrays become comma-joined strings instead of repeated keys).  
  Code references:  
  - const queryString = new URLSearchParams(params).toString();  
  Impact: Backend may receive malformed or unexpected query parameters, causing incorrect filtering or errors without obvious client-side symptoms.


### 3. Low Priority

- [Gotcha] public/js/services/document-service.js::getAll  
  The sentinel key “root” is used as a folder id in the grouped output. This can collide if an actual folder has id “root.”  
  Code references:  
  - const key = parentId || "root";  
  - folder.id === "root"  
  Impact: Potential ambiguity or mixing of “real” folder and “root” group in edge cases where id values collide.

- [Design Flaw] public/js/services/document-service.js::getAll  
  Comment implies prioritization of folder metadata fetch by sorting nonRootIds, but the order may not be meaningful to batchGetFolders, making the added complexity misleading.  
  Code references:  
  - // Prepare folder metadata fetch, prioritize groups with most recent activity  
  - nonRootIds.sort(...)  
  Impact: Misleading documentation and unnecessary complexity can confuse maintainers and obscure the real behavior.

- [Design Flaw] public/js/services/document-service.js::getAll  
  Placeholder folder metadata for missing entries (e.g., { name: `Folder ${key}` }) is user-visible and indistinguishable from real data.  
  Code references:  
  - : folderMap[key] || { id: key, name: `Folder ${key}`, ... }  
  Impact: Users can be misled by placeholders presented as real metadata, reducing trust and complicating support.

---

## Analysis: `public/js/services/auth-service.js`

## 1. Critical/Urgent Issues

- [Silent Failure] public/js/services/auth-service.js::logout  
  sessionStorage.clear() is only called in the success path. In the catch block, the code still performs window.location.hash = '#/' and dispatches window.dispatchEvent(new CustomEvent('auth:logout')) without clearing client-side state.  
  Impact: Listeners and UI are told the user is logged out while auth artifacts may remain in sessionStorage. This creates a security and consistency risk where stale credentials persist, leading to undefined behavior and potential unauthorized access from other parts of the app.

## 2. Requires Attention

- [Silent Failure] public/js/services/auth-service.js::checkStatus  
  Errors from this.api.getAuthStatus() are swallowed and mapped to return { authenticated: false }. Code: try { return await this.api.getAuthStatus(); } catch { return { authenticated: false }; }.  
  Impact: Network/server failures become indistinguishable from a legitimate unauthenticated state. This can silently de-authenticate users during transient failures, causing confusing UX and incorrect auth gating.

- [Bug] public/js/services/auth-service.js::login  
  currentPath is constructed as window.location.pathname + window.location.hash, omitting window.location.search (query string). Code: const currentPath = window.location.pathname + window.location.hash;.  
  Impact: Post-login redirection may lose query parameters (filters, pagination, deep-link state), preventing users from returning to the exact pre-login context.

- [Design Flaw] public/js/services/auth-service.js::logout  
  Uses sessionStorage.clear(), which clears all session storage keys globally, not just auth-related state.  
  Impact: Wipes unrelated session-scoped data used by other modules or features, potentially causing user-perceived data loss and breaking unrelated functionality on logout.

- [Design Flaw] public/js/services/auth-service.js::logout  
  The same event name is dispatched for both success and error cases without detail payload: window.dispatchEvent(new CustomEvent('auth:logout')).  
  Impact: Event consumers cannot differentiate between a successful logout and a failed server logout. This leads to incorrect downstream behavior (e.g., clearing state or navigating) based on an ambiguous signal.

- [Architectural Issue] public/js/services/auth-service.js::login, logout  
  AuthService mixes concerns by handling both network/auth responsibilities and UI navigation/global event dispatch (window.location.href, window.location.hash, window.dispatchEvent).  
  Impact: Tight coupling to browser globals complicates testing, reuse (e.g., in non-DOM contexts), and maintainability. It also distributes routing concerns into the auth layer, increasing cross-module dependencies.

- [Design Flaw] public/js/services/auth-service.js::checkStatus, getUser  
  Inconsistent error-handling strategy across methods. checkStatus swallows errors and returns a default object, whereas getUser simply returns this.api.getUser() without handling or normalizing errors.  
  Impact: Callers must handle different semantics for similar operations, increasing the chance of misuse and inconsistent behavior across the app.

## 3. Low Priority

- [Error] public/js/services/auth-service.js::constructor (and all methods invoking this.api)  
  No validation of the injected api dependency. If api or required methods (getAuthStatus, logout, getUser) are missing or not functions, it will cause runtime TypeError at call sites.  
  Impact: Misconfiguration leads to hard crashes at runtime; lack of defensive checks reduces robustness.

- [Design Flaw] public/js/services/auth-service.js::getUser, checkStatus  
  Minor API/style inconsistency: async getUser() returns this.api.getUser() without awaiting, while checkStatus uses await.  
  Impact: Not functionally incorrect, but inconsistent patterns can confuse maintainers and obscure where errors are handled.

- [Gotcha] public/js/services/auth-service.js::checkStatus, logout  
  console.error(...) logs raw errors to the console.  
  Impact: Potential leakage of sensitive error details into user-visible logs and noisy console output in production, which may hinder diagnostics or expose internal information.

---

## Analysis: `public/js/services/folder-service.js`

### 1. Critical/Urgent Issues

- [Bug] public/js/services/folder-service.js::batchGetFolders  
  Uses a plain object as a map keyed by untrusted IDs: out[id] = ... on a {} object. IDs like "__proto__", "constructor", or "prototype" can mutate the prototype of out (prototype pollution). This can also cascade when callers merge or spread the result into other objects.  
  Impact: Security vulnerability allowing prototype pollution of the returned object and potentially of consumer objects (e.g., via Object.assign or spread), leading to unexpected behavior or denial-of-service.

- [Silent Failure] public/js/services/folder-service.js::getFolderInfo  
  HTTP status is never checked. res.json() is called without verifying res.ok, and then an “out” object is constructed and cached for 5 minutes even if the server returned an error payload (e.g., 404/500 with JSON).  
  Impact: Silent data corruption: non-existent or failing folders get represented as real folders with defaulted fields and are cached for 5 minutes, misleading downstream logic and UI.

- [Silent Failure] public/js/services/folder-service.js::getFolderInfo  
  Race condition with cache poisoning: on concurrent calls for the same folderId, a later failing request’s catch block overwrites the cache with a fallback object for 30 seconds, even if a prior concurrent request already fetched and cached correct data.  
  Impact: Correct data can be silently replaced by placeholder data for 30 seconds, causing inconsistent, misleading state.


### 2. Requires Attention

- [Architectural Issue] public/js/services/folder-service.js::FolderService (class-wide)  
  Unbounded in-memory cache growth: entries are never evicted from this._cache, and expired entries remain indefinitely.  
  Impact: Memory usage grows over time in long-lived sessions, potentially degrading performance.

- [Design Flaw] public/js/services/folder-service.js::getFolderInfo, batchGetFolders  
  Cached objects are returned by reference. The same object instance stored in this._cache is returned to callers (e.g., cached.data and out[id] both reference the same object).  
  Impact: Callers mutating returned objects will silently mutate the cache, causing cross-call data corruption and hard-to-diagnose bugs.

- [Design Flaw] public/js/services/folder-service.js::batchGetFolders  
  Returned object’s property insertion order does not match the input order when a mix of cache hits and misses occurs. Hits are inserted first, then misses, regardless of original positions. Also, plain-object key enumeration rules mean numeric-like keys may be enumerated in numeric order rather than insertion order.  
  Impact: Callers expecting stable order for display or processing can observe reordering and inconsistent behavior.

- [Gotcha] public/js/services/folder-service.js::batchGetFolders  
  ids are filtered with filter(Boolean), which drops falsy but potentially valid IDs (e.g., 0, empty string).  
  Impact: Such IDs are silently ignored and omitted from the result, causing missing data without an explicit error.

- [Gotcha] public/js/services/folder-service.js::getFolderInfo  
  The root check treats any falsy folderId as root: if (!folderId || folderId === "root"). Numeric 0 or empty string would be treated as the root folder.  
  Impact: Valid falsy IDs (if ever used) would incorrectly return the root’s metadata and never be fetched.

- [Design Flaw] public/js/services/folder-service.js::getFolderInfo  
  Caching fallback results for 30 seconds after any error (network/server) masks specific server error types (e.g., 401/403/404) and suppresses retry attempts during that window.  
  Impact: Users see placeholder data instead of error handling; transient issues can block fresh data for 30 seconds.

- [Design Flaw] public/js/services/folder-service.js::batchGetFolders  
  Promise.allSettled is unnecessary complexity because getFolderInfo catches all errors and returns a fallback; rejections are unlikely. The rejected branch is effectively dead in normal operation.  
  Impact: Harder to reason about control flow and error handling, with minimal practical benefit.

### 3. Low Priority

- [Design Flaw] public/js/services/folder-service.js::getFolderInfo  
  TTL for successful responses is computed using now captured before the fetch completes (expiresAt: now + this._ttlMs), shortening effective TTL by network latency.  
  Impact: Slightly increased cache churn; minor efficiency issue.

- [Gotcha] public/js/services/folder-service.js::getFolderInfo  
  Inconsistent defaulting semantics: name uses || (empty string becomes fallback), whereas description uses ?? (empty string is preserved).  
  Impact: Unexpected discrepancies in displayed fields (e.g., a legitimate empty name becomes “Folder {id}” while an empty description remains empty).

---

## Analysis: `public/js/services/api-client.js`

### 1. Critical/Urgent Issues

- [Error] public/js/services/api-client.js::logout  
  Unconditional JSON parsing on responses: the method returns res.json() without checking for an empty body or content type. Logout endpoints commonly return 204 No Content; res.json() will throw a SyntaxError in that case.  
  Impact: Runtime exception on successful logout responses with empty body; user-facing crash despite request actually succeeding.

- [Error] public/js/services/api-client.js::getAuthStatus, getUser, getDocuments, getDocument, getElements, getParts, getAssemblies, getBillOfMaterials, getElementMetadata, getPartMassProperties, getParentInfo, exportAll  
  All listed methods unconditionally call res.json() after checking res.ok. If the server returns a 2xx response with a non-JSON body (e.g., empty body for 204, text/plain, or HTML error page mistakenly marked 200), res.json() will throw.  
  Impact: Unexpected runtime exceptions and broken flows on otherwise “successful” HTTP statuses, leading to inconsistent client behavior and hard-to-diagnose crashes.


### 2. Requires Attention

- [Error] public/js/services/api-client.js::exportAll, exportStreamSSE  
  Object.entries(options) is called without guarding options. If options is null or undefined, this throws a TypeError. There is no default for options in these two methods (unlike params = {} in getBillOfMaterials).  
  Impact: Immediate runtime error when callers omit options (a common pattern), breaking export initiation/streaming entirely.

- [Gotcha] public/js/services/api-client.js::getDocument, getElements, getParts, getAssemblies, getBillOfMaterials, getElementMetadata, getPartMassProperties, getParentInfo  
  Path parameters (documentId, workspaceId, elementId, partId) are interpolated directly into the URL without encoding. If any ID contains reserved characters (e.g., /, ?, #, %), the URL can be malformed or route to the wrong endpoint.  
  Impact: Hard-to-trace 404s, wrong-resource access, or server-side routing issues depending on actual ID contents.

- [Design Flaw] public/js/services/api-client.js::exportAll, exportStreamSSE  
  Query construction coerces all option values with String(v). Null/undefined become "null"/"undefined"; objects become "[object Object]". This silently changes semantics of optional/structured parameters into unintended string literals.  
  Impact: Subtle server-side misinterpretation of parameters (e.g., undefined turning into "undefined"), causing incorrect results without client-side errors.

- [Design Flaw] public/js/services/api-client.js::getBillOfMaterials  
  new URLSearchParams(params) is used without validating value types. Arrays/objects serialize to "x,y" or "[object Object]" via implicit toString, which may not match server expectations (e.g., repeated keys or JSON-encoded params).  
  Impact: Incorrect or lossy parameter serialization leading to wrong BOM results with no explicit client error.

- [Design Flaw] public/js/services/api-client.js::exportAll, exportStreamSSE  
  ids are serialized as a single CSV string (params.append("ids", ids.join(","))). This assumes the server expects CSV in a single key. If the server expects repeated ids keys, the request payload will be misinterpreted. If any id contains a comma, values become ambiguous.  
  Impact: Incorrect ID parsing by the server, leading to missing/extra items in exports with no client-side indication.

- [Design Flaw] public/js/services/api-client.js::exportAll, exportStreamSSE  
  Potentially unbounded query string size (e.g., large ids arrays and options) sent via GET (including SSE URL). Long URLs can exceed browser/proxy limits and cause HTTP 414 or silent truncation.  
  Impact: Intermittent request failures for larger exports; brittle behavior dependent on environment limits.

- [Architectural Issue] public/js/services/api-client.js::(all fetch-based methods)  
  No support for cancellation or timeouts (no AbortController/AbortSignal usage). Long or stalled requests will hang until the browser times out. Concurrent requests can race, with older responses possibly applied after newer ones at the call site.  
  Impact: Resource waste, degraded UX, and race-condition-prone higher layers with no mechanism to cancel stale requests.

- [Design Flaw] public/js/services/api-client.js::(all methods checking res.ok)  
  On non-OK responses, the code throws a generic Error with only the status code and discards the response body. Server-provided error details (JSON payload, error codes) are lost.  
  Impact: Poor observability and error reporting; harder to diagnose server-side failures and to render meaningful messages to users.

- [Gotcha] public/js/services/api-client.js::getDocuments  
  limit and offset are blindly stringified. Passing NaN, negative, or non-numeric values will serialize as "NaN" or negatives without validation.  
  Impact: Server-side validation errors or unexpected result sets; subtle client-side bugs if improper inputs slip through.

- [Gotcha] public/js/services/api-client.js::exportAll, exportStreamSSE  
  Potential duplicate/conflicting query parameters if options already include a key named ids and the method appends another ids parameter.  
  Impact: Ambiguous server parsing (some frameworks pick first/last or treat as array), leading to non-deterministic behavior.


### 3. Low Priority

- [Design Flaw] public/js/services/api-client.js::(all methods throwing new Error)  
  Error messages include only the numeric status (e.g., "Get user failed (404)") and omit statusText or endpoint context/body excerpts.  
  Impact: Reduces debuggability and supportability; more effort required to trace issues in logs.

- [Architectural Issue] public/js/services/api-client.js::(entire class)  
  API base URLs are hard-coded as relative paths, with no configurability for environments (staging, production, different origins).  
  Impact: Reduced flexibility and increased friction in deployment/testing scenarios; requires code changes to repoint endpoints.

---

