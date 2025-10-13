# Web Browser Console

No web browser console output. couldn't build

```

```

# IDE Console

Error during build.

```sh
user@ubuntu:~/GitHub/OnShape-DocuReader$ npm run build

> onshape-docureader@1.0.0 prebuild
> npm run clean


> onshape-docureader@1.0.0 clean
> rimraf dist


> onshape-docureader@1.0.0 build
> tsc && vite build

vite v7.1.9 building for production...
✓ 26 modules transformed.
✗ Build failed in 104ms
error during build:
public/js/views/document-detail-view.js (189:29): await isn't allowed in non-async function
file: OnShape-DocuReader/public/js/views/document-detail-view.js:189:29

187:         // Navigate back to document list
188:         if (this.controller?.router) {
189:           const { ROUTES } = await import("../router/routes.js");
                                  ^
190:           this.controller.router.navigate(ROUTES.DOCUMENT_LIST, currentState);
191:         } else {

    at getRollupError (OnShape-DocuReader/node_modules/rollup/dist/es/shared/parseAst.js:401:41)
    at ParseError.initialise (OnShape-DocuReader/node_modules/rollup/dist/es/shared/node-entry.js:14454:28)
    at convertNode (OnShape-DocuReader/node_modules/rollup/dist/es/shared/node-entry.js:16337:10)
    at convertProgram (OnShape-DocuReader/node_modules/rollup/dist/es/shared/node-entry.js:15577:12)
    at Module.setSource (OnShape-DocuReader/node_modules/rollup/dist/es/shared/node-entry.js:17332:24)
    at async ModuleLoader.addModuleSource (OnShape-DocuReader/node_modules/rollup/dist/es/shared/node-entry.js:21352:13)
```
