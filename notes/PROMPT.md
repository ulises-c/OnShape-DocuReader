DIAGNOSE AND FIX: Loading screen stuck on initial OAuth login due to session verification issue

**Problem:**
After successful OAuth authentication, the UI gets stuck on ["Loading...", "Loading documents..."] indefinitely. User must logout and login again to proceed. The backend uses `.sessions.json` for file-based session storage, which should be accessed and verified during authentication flow.

**Diagnostic Steps - Execute in order:**

1. **Trace OAuth callback → session persistence:**

   - Find where the OAuth callback writes session data to `.sessions.json`
   - Verify the session write completes BEFORE responding to the frontend
   - Check if file writes are synchronous or if there's missing `await` on async operations

2. **Examine session verification middleware:**

   - Identify where incoming requests read from `.sessions.json` to verify authentication
   - Check for race conditions: Does the first API request arrive before `.sessions.json` is written?
   - Look for missing error handling when `.sessions.json` read fails or returns stale data

3. **Track the loading state sequence:**

   - Find where "Loading..." and "Loading documents..." are triggered
   - Identify which API calls must succeed to clear these states
   - Check if initial API requests fail silently due to session not being found in `.sessions.json`

4. **Identify the timing issue:**

   - The logout/login workaround suggests the second attempt works because `.sessions.json` is already written
   - Check if the OAuth callback redirects/responds to frontend BEFORE completing session file write
   - Look for missing `.sync()` or improper async file I/O handling

5. **Generate fix with SEARCH/REPLACE blocks:**
   - Ensure `.sessions.json` write is fully complete before OAuth callback responds
   - Add proper error handling for session verification failures
   - Consider adding frontend retry logic with exponential backoff if session isn't immediately available
   - Add logging to track session lifecycle (write → verify → API request)

OUTPUT: Diagnosis with specific file:line references showing the race condition, then SEARCH/REPLACE blocks to fix the timing issue.
