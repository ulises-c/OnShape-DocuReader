/**
 * Airtable API Routes
 * 
 * Proxy routes for Airtable API operations.
 * Requires Airtable authentication (separate from OnShape auth).
 */

import { Router } from 'express';
import express from 'express';
import type { Request, Response, NextFunction } from 'express';
import { AirtableApiClient } from '../services/airtable-api-client.ts';
import { AirtableThumbnailService } from '../services/airtable-thumbnail-service.ts';
import { isAirtableConfigured, isAirtableDatabaseConfigured, airtableConfig } from '../config/airtable.ts';

const router = Router();

/**
 * Middleware to require Airtable authentication
 */
const requireAirtableAuth = (req: Request, res: Response, next: NextFunction): void | Response => {
  if (!isAirtableConfigured()) {
    return res.status(503).json({ error: 'Airtable not configured' });
  }

  if (!req.session?.airtable?.accessToken) {
    return res.status(401).json({ error: 'Airtable authentication required' });
  }

  next();
};

/**
 * GET /api/airtable/config
 * Get Airtable configuration status (without secrets)
 */
router.get('/config', (req: Request, res: Response): Response => {
  return res.json({
    configured: isAirtableConfigured(),
    databaseConfigured: isAirtableDatabaseConfigured(),
    baseId: airtableConfig.baseId ? '***configured***' : null,
    tableId: airtableConfig.tableId ? '***configured***' : null,
    partNumberField: airtableConfig.partNumberField,
    thumbnailField: airtableConfig.thumbnailField,
  });
});

// Apply auth middleware to all routes below
router.use(requireAirtableAuth);

/**
 * GET /api/airtable/bases
 * List accessible Airtable bases
 */
router.get('/bases', async (req: Request, res: Response): Promise<Response> => {
  try {
    const client = new AirtableApiClient(req.session.airtable!.accessToken);
    const bases = await client.listBases();
    return res.json(bases);
  } catch (error: any) {
    console.error('[Airtable API] List bases error:', error);
    return res.status(500).json({ error: 'Failed to list bases', message: error.message });
  }
});

/**
 * GET /api/airtable/bases/:baseId/tables
 * List tables in a base
 */
router.get('/bases/:baseId/tables', async (req: Request, res: Response): Promise<Response> => {
  try {
    const client = new AirtableApiClient(req.session.airtable!.accessToken);
    const tables = await client.getTables(req.params.baseId);
    return res.json(tables);
  } catch (error: any) {
    console.error('[Airtable API] List tables error:', error);
    return res.status(500).json({ error: 'Failed to list tables', message: error.message });
  }
});

/**
 * GET /api/airtable/bases/:baseId/tables/:tableId/schema
 * Get table schema including field IDs
 */
router.get('/bases/:baseId/tables/:tableId/schema', async (req: Request, res: Response): Promise<Response> => {
  try {
    const client = new AirtableApiClient(req.session.airtable!.accessToken);
    const schema = await client.getTableSchema(req.params.baseId, req.params.tableId);
    return res.json(schema);
  } catch (error: any) {
    console.error('[Airtable API] Get schema error:', error);
    return res.status(500).json({ error: 'Failed to get schema', message: error.message });
  }
});

/**
 * GET /api/airtable/bases/:baseId/tables/:tableId/records
 * List records from a table
 */
router.get('/bases/:baseId/tables/:tableId/records', async (req: Request, res: Response): Promise<Response> => {
  try {
    const client = new AirtableApiClient(req.session.airtable!.accessToken);
    
    const options: Parameters<typeof client.listRecords>[2] = {};
    
    if (req.query.filterByFormula) {
      options.filterByFormula = String(req.query.filterByFormula);
    }
    if (req.query.fields) {
      options.fields = String(req.query.fields).split(',');
    }
    if (req.query.maxRecords) {
      options.maxRecords = parseInt(String(req.query.maxRecords), 10);
    }
    if (req.query.pageSize) {
      options.pageSize = parseInt(String(req.query.pageSize), 10);
    }
    if (req.query.offset) {
      options.offset = String(req.query.offset);
    }

    const records = await client.listRecords(req.params.baseId, req.params.tableId, options);
    return res.json(records);
  } catch (error: any) {
    console.error('[Airtable API] List records error:', error);
    return res.status(500).json({ error: 'Failed to list records', message: error.message });
  }
});

/**
 * POST /api/airtable/upload-thumbnails
 * Upload thumbnails from ZIP file to matching Airtable records
 * 
 * Body (multipart/form-data):
 *   - file: ZIP file containing thumbnails
 *   - dryRun: boolean (optional) - if true, only reports matches without uploading
 *   - baseId: string (optional) - override default base
 *   - tableId: string (optional) - override default table
 */
router.post(
  '/upload-thumbnails',
  express.raw({ type: 'application/zip', limit: '100mb' }),
  async (req: Request, res: Response): Promise<Response> => {
    if (!isAirtableDatabaseConfigured() && !req.query.baseId) {
      return res.status(400).json({ 
        error: 'Database not configured',
        message: 'Either configure AIRTABLE_BASE_ID and AIRTABLE_TABLE_ID in environment or provide baseId/tableId query parameters',
      });
    }

    try {
      const client = new AirtableApiClient(req.session.airtable!.accessToken);
      
      const config = {
        baseId: String(req.query.baseId || airtableConfig.baseId),
        tableId: String(req.query.tableId || airtableConfig.tableId),
        partNumberField: String(req.query.partNumberField || airtableConfig.partNumberField),
        thumbnailField: String(req.query.thumbnailField || airtableConfig.thumbnailField),
      };

      const service = new AirtableThumbnailService(client, config);
      const dryRun = req.query.dryRun === 'true';

      console.log(`[Airtable API] Processing thumbnail upload (dryRun=${dryRun})`);

      const results = await service.processZipFile(
        req.body as Buffer,
        (progress) => {
          // Progress callback - could be used for SSE in future
          console.log(`[Airtable API] Progress: ${progress.processed}/${progress.total} (${progress.phase})`);
        },
        dryRun
      );

      const summary = {
        total: results.length,
        uploaded: results.filter(r => r.status === 'uploaded').length,
        skipped: results.filter(r => r.status === 'skipped').length,
        noMatch: results.filter(r => r.status === 'no_match').length,
        errors: results.filter(r => r.status === 'error').length,
      };

      return res.json({
        success: true,
        dryRun,
        summary,
        results,
      });
    } catch (error: any) {
      console.error('[Airtable API] Upload thumbnails error:', error);
      return res.status(500).json({ error: 'Failed to process thumbnails', message: error.message });
    }
  }
);

/**
 * POST /api/airtable/find-record
 * Find a record by part number (for testing/debugging)
 */
router.post('/find-record', express.json(), async (req: Request, res: Response): Promise<Response> => {
  const { partNumber, baseId, tableId, partNumberField } = req.body;

  if (!partNumber) {
    return res.status(400).json({ error: 'partNumber is required' });
  }

  try {
    const client = new AirtableApiClient(req.session.airtable!.accessToken);
    
    const record = await client.findRecordByPartNumber(
      baseId || airtableConfig.baseId,
      tableId || airtableConfig.tableId,
      partNumber,
      partNumberField || airtableConfig.partNumberField
    );

    if (!record) {
      return res.json({ found: false, partNumber });
    }

    return res.json({ found: true, partNumber, record });
  } catch (error: any) {
    console.error('[Airtable API] Find record error:', error);
    return res.status(500).json({ error: 'Failed to find record', message: error.message });
  }
});

export default router;
