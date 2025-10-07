Why this folder exists

The web app uses JSZip (ESM) to build ZIP files for CSV exports. The app prefers loading a same-origin copy of JSZip from `/js/lib/jszip.esm.min.js` so that browsers enforcing a Content-Security-Policy (CSP) with `script-src 'self'` can execute the module.

If you see errors like:

Content-Security-Policy: The page’s settings blocked a script (script-src-elem) at https://cdn.jsdelivr.net/npm/jszip@3.10.1/dist/jszip.esm.min.js from being executed because it violates the following directive: "script-src 'self' ..."

then download the JSZip ESM build into this folder so it's served from the app origin.

Recommended commands (run from the repository root):

```bash
mkdir -p public/js/lib
curl -sSL -o public/js/lib/jszip.esm.min.js \
  https://cdn.jsdelivr.net/npm/jszip@3.10.1/dist/jszip.esm.min.js
```

After placing the file here, reload the app. The exporter will attempt to import `/js/lib/jszip.esm.min.js` first and use it if present.

If you prefer to keep using the CDN, update your server's Content-Security-Policy to allow the CDN host or remove the strict `script-src 'self'` directive. Be careful when editing CSP—only allow trusted origins.
