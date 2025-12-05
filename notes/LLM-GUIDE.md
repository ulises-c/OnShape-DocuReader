Exactly right. The cleanest approach is to have `fullAssemblyExporter.js` call `getBillOfMaterials` with **no extra parameters** - just like `handleDownloadBomCsv` does. That way both use the identical code path through `document-service.js`.

Here's the minimal fix for `fullAssemblyExporter.js`:

```javascript
// BEFORE (lines 537-544 in your uploaded file):
bom = await documentService.getBillOfMaterials(
  documentId,
  workspaceId,
  element.id,
  true,  // flatten = true
  false  // includeThumbnails = false
);

// AFTER - Just use defaults, same as handleDownloadBomCsv:
bom = await documentService.getBillOfMaterials(
  documentId,
  workspaceId,
  element.id
);
```

That's it. Now both buttons go through the exact same code path.

If you later want to improve the BOM parameters (add `onlyVisibleColumns`, `includeItemMicroversions`, etc. from your Python script), you update **one place** (`document-service.js`) and both features benefit.

Want me to show the exact `str_replace` edit for your actual `fullAssemblyExporter.js` file? I'd need to see what's currently in your project (the uploaded file already has a fix applied, but your project knowledge shows the `document-service.js` only accepts `flatten` as a parameter, not `includeThumbnails`).