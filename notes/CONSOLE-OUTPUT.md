# Web Browser Console

```
Thumbnail loaded successfully via: http://localhost:5173/api/thumbnail-proxy?url=https%3A%2F%2Fcad.onshape.com%2Fapi%2Fthumbnails%2Fd%2F0f0a03f39e2b0f4e29330f44%2Fw%2F9b49c31f4f46a14b637abd8b%2Fs%2F300x300%3Ft%3D1764783766120 thumbnail-service.js:18:15
[FullExtract] Fetching flattened BOM with thumbnails for D01-Cart_Base... 2 fullAssemblyExporter.js:472:13
[FullExtract] Error: Error: Get BOM failed (502)
    getBillOfMaterials api-client.js:68
fullAssemblyExporter.js:601:13
[FullExtract] Error: Error: Get BOM failed (502)
    getBillOfMaterials api-client.js:68
element-actions.js:119:15
[FullExtract] BOM fetched: 10 rows, 31 headers fullAssemblyExporter.js:486:13
[FullExtract] BOM type: topLevel fullAssemblyExporter.js:487:13
[FullExtract] Prepared 10 thumbnail requests (0 skipped - no info) fullAssemblyExporter.js:534:13
[FullExtract] Using 3 concurrent workers with 100ms delay fullAssemblyExporter.js:537:13
XHRGET
http://localhost:5173/api/thumbnail-proxy?url=https://cad.onshape.com/api/thumbnails/d/8ab706f39fdcb8c67552e8e5/w/f505fb324f91dda14f083223/e/9303ffe24b71ef2bfb2b1407/s/300x300?partId=JHD&t=1764893350332
[HTTP/1.1 500 Internal Server Error 66ms]

XHRGET
http://localhost:5173/api/thumbnail-proxy?url=https://cad.onshape.com/api/thumbnails/d/b1ccc492931eb2b5e91cd69c/w/27bc59a840ecccd079af0dab/e/aad897b274c5831712b910ee/s/300x300?t=1764893350332
[HTTP/1.1 500 Internal Server Error 202ms]

[FullExtract] Thumbnail fetch retry 1/2 (500) 2 fullAssemblyExporter.js:311:21
XHRGET
http://localhost:5173/api/thumbnail-proxy?url=https://cad.onshape.com/api/thumbnails/d/2721a255cf15c54e0a5d0617/w/3bc06d9b89d3466df69b1e7e/e/ab1689e6a6c626dd581f3b40/s/300x300?t=1764893350332
[HTTP/1.1 500 Internal Server Error 78ms]

[FullExtract] Thumbnail fetch retry 1/2 (500) fullAssemblyExporter.js:311:21
XHRGET
http://localhost:5173/api/thumbnail-proxy?url=https://cad.onshape.com/api/thumbnails/d/8ab706f39fdcb8c67552e8e5/w/f505fb324f91dda14f083223/e/9303ffe24b71ef2bfb2b1407/s/300x300?partId=JHD&t=1764893350332
[HTTP/1.1 500 Internal Server Error 84ms]

[FullExtract] Thumbnail fetch retry 2/2 (500) fullAssemblyExporter.js:311:21
XHRGET
http://localhost:5173/api/thumbnail-proxy?url=https://cad.onshape.com/api/thumbnails/d/b1ccc492931eb2b5e91cd69c/w/27bc59a840ecccd079af0dab/e/aad897b274c5831712b910ee/s/300x300?t=1764893350332
[HTTP/1.1 500 Internal Server Error 79ms]

[FullExtract] Thumbnail fetch retry 2/2 (500) fullAssemblyExporter.js:311:21
XHRGET
http://localhost:5173/api/thumbnail-proxy?url=https://cad.onshape.com/api/thumbnails/d/2721a255cf15c54e0a5d0617/w/3bc06d9b89d3466df69b1e7e/e/ab1689e6a6c626dd581f3b40/s/300x300?t=1764893350332
[HTTP/1.1 500 Internal Server Error 78ms]

[FullExtract] Thumbnail fetch retry 2/2 (500) fullAssemblyExporter.js:311:21
XHRGET
http://localhost:5173/api/thumbnail-proxy?url=https://cad.onshape.com/api/thumbnails/d/8ab706f39fdcb8c67552e8e5/w/f505fb324f91dda14f083223/e/9303ffe24b71ef2bfb2b1407/s/300x300?partId=JHD&t=1764893350332
[HTTP/1.1 500 Internal Server Error 70ms]

[FullExtract] Thumbnail fetch failed (500) fullAssemblyExporter.js:325:17
XHRGET
http://localhost:5173/api/thumbnail-proxy?url=https://cad.onshape.com/api/thumbnails/d/b1ccc492931eb2b5e91cd69c/w/27bc59a840ecccd079af0dab/e/aad897b274c5831712b910ee/s/300x300?t=1764893350332
[HTTP/1.1 500 Internal Server Error 92ms]

XHRGET
http://localhost:5173/api/thumbnail-proxy?url=https://cad.onshape.com/api/thumbnails/d/62da92c67f5bc511028f19a3/w/93e78f83a14d2d6d4b769705/e/1d73ecd9728de9a57e6f907f/s/300x300?partId=JFD&t=1764893350333
[HTTP/1.1 500 Internal Server Error 88ms]

XHRGET
http://localhost:5173/api/thumbnail-proxy?url=https://cad.onshape.com/api/thumbnails/d/2721a255cf15c54e0a5d0617/w/3bc06d9b89d3466df69b1e7e/e/ab1689e6a6c626dd581f3b40/s/300x300?t=1764893350332
[HTTP/1.1 500 Internal Server Error 80ms]

[FullExtract] Thumbnail fetch failed (500) 2 fullAssemblyExporter.js:325:17
[FullExtract] Thumbnail fetch retry 1/2 (500) fullAssemblyExporter.js:311:21
XHRGET
http://localhost:5173/api/thumbnail-proxy?url=https://cad.onshape.com/api/thumbnails/d/e643bb1db1457025a2e1471d/w/ea3acd583704fecffbb39e69/e/bcd2a821ff46fe2415bff6e6/s/300x300?partId=JHD&t=1764893350333
[HTTP/1.1 500 Internal Server Error 90ms]

XHRGET
http://localhost:5173/api/thumbnail-proxy?url=https://cad.onshape.com/api/thumbnails/d/529adaf32dacad59ebb09312/w/cf8c09278beef2e7415fd65f/e/4649c186869fe8a3dfeaa305/s/300x300?t=1764893350333
[HTTP/1.1 500 Internal Server Error 83ms]

[FullExtract] Thumbnail fetch retry 1/2 (500) 2 fullAssemblyExporter.js:311:21
XHRGET
http://localhost:5173/api/thumbnail-proxy?url=https://cad.onshape.com/api/thumbnails/d/62da92c67f5bc511028f19a3/w/93e78f83a14d2d6d4b769705/e/1d73ecd9728de9a57e6f907f/s/300x300?partId=JFD&t=1764893350333
[HTTP/1.1 500 Internal Server Error 90ms]

[FullExtract] Thumbnail fetch retry 2/2 (500) fullAssemblyExporter.js:311:21
XHRGET
http://localhost:5173/api/thumbnail-proxy?url=https://cad.onshape.com/api/thumbnails/d/e643bb1db1457025a2e1471d/w/ea3acd583704fecffbb39e69/e/bcd2a821ff46fe2415bff6e6/s/300x300?partId=JHD&t=1764893350333
[HTTP/1.1 500 Internal Server Error 71ms]

[FullExtract] Thumbnail fetch retry 2/2 (500) fullAssemblyExporter.js:311:21
XHRGET
http://localhost:5173/api/thumbnail-proxy?url=https://cad.onshape.com/api/thumbnails/d/529adaf32dacad59ebb09312/w/cf8c09278beef2e7415fd65f/e/4649c186869fe8a3dfeaa305/s/300x300?t=1764893350333
[HTTP/1.1 500 Internal Server Error 63ms]

[FullExtract] Thumbnail fetch retry 2/2 (500) fullAssemblyExporter.js:311:21
XHRGET
http://localhost:5173/api/thumbnail-proxy?url=https://cad.onshape.com/api/thumbnails/d/62da92c67f5bc511028f19a3/w/93e78f83a14d2d6d4b769705/e/1d73ecd9728de9a57e6f907f/s/300x300?partId=JFD&t=1764893350333
[HTTP/1.1 500 Internal Server Error 65ms]

[FullExtract] Thumbnail fetch failed (500) fullAssemblyExporter.js:325:17
XHRGET
http://localhost:5173/api/thumbnail-proxy?url=https://cad.onshape.com/api/thumbnails/d/bcccb77540e3c0433eecc08d/w/a548f53e96f8e93ff1faa506/e/e5eca0c2adbf45dfdf21bed7/s/300x300?partId=JHD&t=1764893350333
[HTTP/1.1 500 Internal Server Error 69ms]

...

	
message	"No thumbnail found with that ID."
moreInfoUrl	null
status	404
code	0
```

# IDE Console

```

```
