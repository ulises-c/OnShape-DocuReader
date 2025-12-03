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

src/services/onshape-api-client.ts:770:13 - error TS2367: This comparison appears to be unintentional because the types '"scanning" | "upcoming"' and '"ignored"' have no overlap.

770         if (status.status !== 'ignored') {
                ~~~~~~~~~~~~~~~~~~~~~~~~~~~


Found 1 error in src/services/onshape-api-client.ts:770
```
