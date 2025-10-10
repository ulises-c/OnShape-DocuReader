# Web Browser Console

No console output when clicking "Back to Documents" or "Back to Document"

```
[vite] connecting... client:733:9
[vite] connected. client:827:12
AppController.init() - Starting initialization app-controller.js:11:13
Auth status result: 
Object { authenticated: true }
app-controller.js:19:15
AppController state changed: 
Object { user: null, isAuthenticated: true, currentPage: "landing", documents: [], currentDocument: null, currentElement: null, currentPart: null, selectedDocuments: [] }
app-controller.js:99:15
User is authenticated, loading documents... app-controller.js:27:17
AppController state changed: 
Object { user: null, isAuthenticated: true, currentPage: "landing", documents: (20) […], currentDocument: null, currentElement: null, currentPart: null, selectedDocuments: [] }
app-controller.js:99:15
AppController state changed: 
Object { user: null, isAuthenticated: true, currentPage: "landing", documents: (20) […], currentDocument: null, currentElement: null, currentPart: null, selectedDocuments: [] }
app-controller.js:99:15
No active route, router will set default to documents list app-controller.js:33:19
Setting default route to documents list app.js:184:17
AppController state changed: 
Object { user: null, isAuthenticated: true, currentPage: "landing", documents: (20) […], currentDocument: null, currentElement: null, currentPart: null, selectedDocuments: [] }
app-controller.js:99:15
Document card clicked: fe1ed0a2ec34abe386e0308b document-list-view.js:72:19
viewDocument called with documentId: fe1ed0a2ec34abe386e0308b document-controller.js:159:13
AppController state changed: 
Object { user: null, isAuthenticated: true, currentPage: "landing", documents: (20) […], currentDocument: {…}, currentElement: null, currentPart: null, selectedDocuments: [] }
app-controller.js:99:15
Thumbnail loaded successfully via: http://localhost:5173/api/thumbnail-proxy?url=https%3A%2F%2Fcad.onshape.com%2Fapi%2Fthumbnails%2Fd%2Ffe1ed0a2ec34abe386e0308b%2Fw%2F424319a36bc61147d64dfe02%2Fs%2F300x300%3Ft%3D1760128783860 thumbnail-service.js:18:15
Element clicked: 175f3eced488f0d66878d6ef document-controller.js:192:21
AppController state changed: 
Object { user: null, isAuthenticated: true, currentPage: "landing", documents: (20) […], currentDocument: {…}, currentElement: {…}, currentPart: null, selectedDocuments: [] }
app-controller.js:99:15

​
```

# IDE Console

No console output when clicking "Back to Documents" or "Back to Document"

```
uchavarria@LZ-UCHAVARR5570:~/GitHub/OnShape-DocuReader$ npm run dev

> onshape-docureader@1.0.0 dev
> concurrently "nodemon src/index.ts" "vite" "npm run open-browser"

[2] 
[2] > onshape-docureader@1.0.0 open-browser
[2] > sh -c 'sleep 3 && wslview http://localhost:5173'
[2] 
[0] [nodemon] 3.1.10
[0] [nodemon] to restart at any time, enter `rs`
[0] [nodemon] watching path(s): src/**/*
[0] [nodemon] watching extensions: ts,js,json
[0] [nodemon] starting `ts-node-esm src/index.ts src/index.ts`
[1] 
[1]   VITE v7.1.9  ready in 270 ms
[1] 
[1]   ➜  Local:   http://localhost:5173/
[1]   ➜  Network: use --host to expose
[0] (node:177958) [DEP0180] DeprecationWarning: fs.Stats constructor is deprecated.
[0] (Use `node --trace-deprecation ...` to show where the warning was created)
[0] [dotenv@17.2.2] injecting env (8) from .env -- tip: ⚙️  suppress all logs with { quiet: true }
[0] 🚀 Server running on http://localhost:3000
[0] 📦 Environment: development
[0] 🔐 OAuth configured: Yes
[0] 🎨 Vite dev server: http://localhost:5173
[0] Auth status check: {
[0]   authenticated: true,
[0]   sessionID: 'UF2r6InnKb3KtuPBsPA64yOUx3eTJrDW',
[0]   hasAccessToken: true
[0] }
[0] GET /auth/status 304 6.986 ms - -
[0] GET /api/documents 200 577.338 ms - 76914
[2] grep: /proc/sys/fs/binfmt_misc/WSLInterop: No such file or directory
[2] WSL Interopability is disabled. Please enable it before using WSL.
[2] grep: /proc/sys/fs/binfmt_misc/WSLInterop: No such file or directory
[2] [error] WSL Interoperability is disabled. Please enable it before using WSL.
[2] npm run open-browser exited with code 0
[0] Auth status check: {
[0]   authenticated: true,
[0]   sessionID: 'UF2r6InnKb3KtuPBsPA64yOUx3eTJrDW',
[0]   hasAccessToken: true
[0] }
[0] GET /auth/status 304 1.344 ms - -
[0] GET /api/documents 200 272.982 ms - 76914
[0] GET /api/documents/fe1ed0a2ec34abe386e0308b 200 249.641 ms - 4529
[0] GET /api/documents/fe1ed0a2ec34abe386e0308b/workspaces/424319a36bc61147d64dfe02/elements 200 147.905 ms - 4194
[0] GET /api/documents/fe1ed0a2ec34abe386e0308b/workspaces/424319a36bc61147d64dfe02/elements 200 111.231 ms - 4194
[0] OnShape API Error: {
[0]   status: 404,
[0]   data: { message: 'Not found.', status: 404, code: 0, moreInfoUrl: '' },
[0]   url: '/documents/d/fe1ed0a2ec34abe386e0308b/w/424319a36bc61147d64dfe02/e/175f3eced488f0d66878d6ef/parts'
[0] }
[0] OnShape getParts returned 404 for document=fe1ed0a2ec34abe386e0308b workspace=424319a36bc61147d64dfe02 element=175f3eced488f0d66878d6ef
[0] GET /api/documents/fe1ed0a2ec34abe386e0308b/workspaces/424319a36bc61147d64dfe02/elements/175f3eced488f0d66878d6ef/parts 200 66.170 ms - 2
[0] OnShape API Error: {
[0]   status: 404,
[0]   data: { message: 'Not found.', status: 404, code: 0, moreInfoUrl: '' },
[0]   url: '/documents/d/fe1ed0a2ec34abe386e0308b/w/424319a36bc61147d64dfe02/e/175f3eced488f0d66878d6ef/assemblies'
[0] }
[0] OnShape getAssemblies returned 404 for document=fe1ed0a2ec34abe386e0308b workspace=424319a36bc61147d64dfe02 element=175f3eced488f0d66878d6ef
[0] GET /api/documents/fe1ed0a2ec34abe386e0308b/workspaces/424319a36bc61147d64dfe02/elements/175f3eced488f0d66878d6ef/assemblies 200 157.429 ms - 2
```
