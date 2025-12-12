# Web Browser Console (Front-End)

```

```

# IDE Console (Back-End)

```sh
(.venv) uchavarria@LZ-UCHAVARR5570:~/GitHub/OnShape-DocuReader$ npm run build

> onshape-docureader@1.0.0 prebuild
> npm run clean && npm run spec


> onshape-docureader@1.0.0 clean
> rimraf dist


> onshape-docureader@1.0.0 spec
> python project_tools/generate_spec.py . -o docs/AUTO_SPEC.md --ignore project_tools examples notes docs

Scanning /home/uchavarria/GitHub/OnShape-DocuReader...
Found 66 code files
Generated: /home/uchavarria/GitHub/OnShape-DocuReader/docs/AUTO_SPEC.md
Size: 17,478 characters

> onshape-docureader@1.0.0 build
> tsc && vite build

vite v7.2.6 building client environment for production...
✓ 52 modules transformed.
../dist/public/dashboard.html              2.04 kB │ gzip:  0.89 kB
../dist/public/index.html                 16.86 kB │ gzip:  2.96 kB
../dist/public/assets/main-DMh0H03Y.css   49.36 kB │ gzip:  9.04 kB
../dist/public/assets/main-5glnh-x2.js   255.40 kB │ gzip: 70.09 kB
✓ built in 989ms
(.venv) uchavarria@LZ-UCHAVARR5570:~/GitHub/OnShape-DocuReader$ npm run dev

> onshape-docureader@1.0.0 dev
> concurrently "nodemon src/index.ts" "vite" "npm run open-browser"

[0] [nodemon] 3.1.10
[0] [nodemon] to restart at any time, enter `rs`
[0] [nodemon] watching path(s): src/**/*
[0] [nodemon] watching extensions: ts,js,json
[0] [nodemon] starting `ts-node-esm src/index.ts src/index.ts`
[2]
[2] > onshape-docureader@1.0.0 open-browser
[2] > sh -c 'sleep 3 && wslview http://localhost:5173'
[2]
[1]
[1]   VITE v7.2.6  ready in 163 ms
[1]
[1]   ➜  Local:   http://localhost:5173/
[1]   ➜  Network: use --host to expose
[0] (node:67492) [DEP0180] DeprecationWarning: fs.Stats constructor is deprecated.
[0] (Use `node --trace-deprecation ...` to show where the warning was created)
[0] file:///home/uchavarria/GitHub/OnShape-DocuReader/src/services/airtable-thumbnail-service.ts:9
[0] import { AirtableApiClient, AirtableRecord } from './airtable-api-client.ts';
[0]                             ^^^^^^^^^^^^^^
[0] SyntaxError: The requested module './airtable-api-client.ts' does not provide an export named 'AirtableRecord'
[0]     at ModuleJob._instantiate (node:internal/modules/esm/module_job:228:21)
[0]     at async ModuleJob.run (node:internal/modules/esm/module_job:337:5)
[0]     at async onImport.tracePromise.__proto__ (node:internal/modules/esm/loader:665:26)
[0] [nodemon] app crashed - waiting for file changes before starting...
[2] npm run open-browser exited with code 0
[1] 3:03:23 PM [vite] http proxy error: /auth/status
[1] Error: connect ECONNREFUSED 127.0.0.1:3000
[1]     at TCPConnectWrap.afterConnect [as oncomplete] (node:net:1637:16)
[1] 3:03:25 PM [vite] http proxy error: /auth/login?returnTo=%2F%23%2F
[1] Error: connect ECONNREFUSED 127.0.0.1:3000
[1]     at TCPConnectWrap.afterConnect [as oncomplete] (node:net:1637:16)
^C[1] vite exited with code SIGINT
[0] nodemon src/index.ts exited with code SIGINT

(.venv) uchavarria@LZ-UCHAVARR5570:~/GitHub/OnShape-DocuReader$
```
