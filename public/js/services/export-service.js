/**
 * ExportService - executes export workflows
 */

export class ExportService {
  constructor(api) {
    this.api = api;
  }

  /**
   * Execute non-streaming export (backend composes all, returns JSON)
   */
  async execute(options) {
    // Preserve original logging intent
    console.log('Starting advanced export...', options);
    const data = await this.api.exportAll({
      format: options.format ?? 'json',
      includeBasicInfo: String(!!options.includeBasicInfo),
      includeElements: String(!!options.includeElements),
      includeParts: String(!!options.includeParts),
      includeAssemblies: String(!!options.includeAssemblies),
      includeMassProperties: String(!!options.includeMassProperties),
      includeMetadata: String(!!options.includeMetadata),
      requestsPerMinute: String(options.requestsPerMinute ?? 30)
    });
    return data;
  }

  /**
   * Optional SSE-based export for progress
   */
  stream(options, handlers) {
    const es = this.api.exportStream({
      format: options.format ?? 'json',
      includeBasicInfo: String(!!options.includeBasicInfo),
      includeElements: String(!!options.includeElements),
      includeParts: String(!!options.includeParts),
      includeAssemblies: String(!!options.includeAssemblies),
      includeMassProperties: String(!!options.includeMassProperties),
      includeMetadata: String(!!options.includeMetadata),
      requestsPerMinute: String(options.requestsPerMinute ?? 30)
    });

    if (handlers?.onStart) es.addEventListener('start', (e) => handlers.onStart(JSON.parse(e.data)));
    if (handlers?.onDocumentsFound) es.addEventListener('documents-found', (e) => handlers.onDocumentsFound(JSON.parse(e.data)));
    if (handlers?.onProgress) es.addEventListener('progress', (e) => handlers.onProgress(JSON.parse(e.data)));
    if (handlers?.onDocumentStatus) es.addEventListener('document-status', (e) => handlers.onDocumentStatus(JSON.parse(e.data)));
    if (handlers?.onDocumentComplete) es.addEventListener('document-complete', (e) => handlers.onDocumentComplete(JSON.parse(e.data)));
    if (handlers?.onDocumentError) es.addEventListener('document-error', (e) => handlers.onDocumentError(JSON.parse(e.data)));
    if (handlers?.onComplete) es.addEventListener('complete', (e) => handlers.onComplete(JSON.parse(e.data)));
    if (handlers?.onError) es.addEventListener('error', (e) => handlers.onError(JSON.parse(e.data)));

    es.onerror = (err) => {
      handlers?.onError?.(err);
      es.close();
    };

    return es;
  }
}
