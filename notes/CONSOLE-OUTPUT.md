# Web Browser Console

```

```

# IDE Console

```
uchavarria@LZ-UCHAVARR5570:~/GitHub/OnShape-DocuReader$ npm run build

> onshape-docureader@1.0.0 prebuild
> npm run clean


> onshape-docureader@1.0.0 clean
> rimraf dist


> onshape-docureader@1.0.0 build
> tsc && vite build

src/routes/api.ts:184:36 - error TS2551: Property 'getDocumentHistory' does not exist on type 'OnShapeApiClient'. Did you mean 'getDocuments'?

184       const history = await client.getDocumentHistory(req.params.id);
                                       ~~~~~~~~~~~~~~~~~~

  src/services/onshape-api-client.ts:163:9
    163   async getDocuments(
                ~~~~~~~~~~~~
    'getDocuments' is declared here.


Found 1 error in src/routes/api.ts:184

uchavarria@LZ-UCHAVARR5570:~/GitHub/OnShape-DocuReader$ 
```
