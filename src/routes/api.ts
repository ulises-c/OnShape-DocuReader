import express from 'express';
import { OnShapeApiClient } from '../services/onshape-api-client';
import { getTokenForSession } from './auth';

const router = express.Router();

// Middleware to check authentication
const requireAuth = (req: express.Request, res: express.Response, next: express.NextFunction): void => {
  const sessionId = req.cookies?.session_id;
  
  if (!sessionId) {
    res.status(401).json({ error: 'Not authenticated' });
    return;
  }
  
  const tokens = getTokenForSession(sessionId);
  if (!tokens) {
    res.status(401).json({ error: 'Invalid session' });
    return;
  }
  
  // Attach tokens to request for use in routes
  (req as any).tokens = tokens;
  next();
};

/**
 * Get current user information
 * GET /api/user
 */
router.get('/user', requireAuth, async (req, res) => {
  try {
    const tokens = (req as any).tokens;
    const apiClient = new OnShapeApiClient(tokens.access_token);
    
    const user = await apiClient.getCurrentUser();
    res.json(user);
  } catch (error: any) {
    console.error('Get user error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get user's documents
 * GET /api/documents
 */
router.get('/documents', requireAuth, async (req, res) => {
  try {
    const tokens = (req as any).tokens;
    const apiClient = new OnShapeApiClient(tokens.access_token);
    
    const documents = await apiClient.getDocuments();
    
    // Debug logging to see what fields are available
    // TODO: Add a debug flag to enable/disable this logging, for now just comment out
    // console.log('First document structure:', JSON.stringify(documents[0], null, 2));
    
    // Transform documents to use creator instead of owner
    const transformedDocuments = documents.map(doc => ({
      ...doc,
      creator: doc.createdBy || doc.owner
    }));
    
    res.json(transformedDocuments);
  } catch (error: any) {
    console.error('Get documents error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get document details
 * GET /api/documents/:documentId
 */
router.get('/documents/:documentId', requireAuth, async (req, res) => {
  try {
    const { documentId } = req.params;
    const tokens = (req as any).tokens;
    const apiClient = new OnShapeApiClient(tokens.access_token);
    
    const document = await apiClient.getDocument(documentId);
    res.json(document);
  } catch (error: any) {
    console.error('Get document error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get document elements (parts, assemblies, etc.)
 * GET /api/documents/:documentId/workspaces/:workspaceId/elements
 */
router.get('/documents/:documentId/workspaces/:workspaceId/elements', requireAuth, async (req, res) => {
  try {
    const { documentId, workspaceId } = req.params;
    const tokens = (req as any).tokens;
    const apiClient = new OnShapeApiClient(tokens.access_token);
    
    const elements = await apiClient.getDocumentElements(documentId, workspaceId);
    res.json(elements);
  } catch (error: any) {
    console.error('Get elements error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get parts from a specific element
 * GET /api/documents/:documentId/workspaces/:workspaceId/elements/:elementId/parts
 */
router.get('/documents/:documentId/workspaces/:workspaceId/elements/:elementId/parts', requireAuth, async (req, res) => {
  try {
    const { documentId, workspaceId, elementId } = req.params;
    const tokens = (req as any).tokens;
    const apiClient = new OnShapeApiClient(tokens.access_token);
    
    const parts = await apiClient.getParts(documentId, workspaceId, elementId);
    res.json(parts);
  } catch (error: any) {
    console.error('Get parts error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get assemblies from a specific element
 * GET /api/documents/:documentId/workspaces/:workspaceId/elements/:elementId/assemblies
 */
router.get('/documents/:documentId/workspaces/:workspaceId/elements/:elementId/assemblies', requireAuth, async (req, res) => {
  try {
    const { documentId, workspaceId, elementId } = req.params;
    const tokens = (req as any).tokens;
    const apiClient = new OnShapeApiClient(tokens.access_token);
    
    const assemblies = await apiClient.getAssemblies(documentId, workspaceId, elementId);
    res.json(assemblies);
  } catch (error: any) {
    console.error('Get assemblies error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get mass properties for a specific part
 * GET /api/documents/:documentId/workspaces/:workspaceId/elements/:elementId/parts/:partId/mass-properties
 */
router.get('/documents/:documentId/workspaces/:workspaceId/elements/:elementId/parts/:partId/mass-properties', requireAuth, async (req, res) => {
  try {
    const { documentId, workspaceId, elementId, partId } = req.params;
    const tokens = (req as any).tokens;
    const apiClient = new OnShapeApiClient(tokens.access_token);
    
    const massProperties = await apiClient.getPartMassProperties(documentId, workspaceId, elementId, partId);
    res.json(massProperties);
  } catch (error: any) {
    console.error('Get mass properties error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get metadata for a specific element
 * GET /api/documents/:documentId/workspaces/:workspaceId/elements/:elementId/metadata
 */
router.get('/documents/:documentId/workspaces/:workspaceId/elements/:elementId/metadata', requireAuth, async (req, res) => {
  try {
    const { documentId, workspaceId, elementId } = req.params;
    const tokens = (req as any).tokens;
    const apiClient = new OnShapeApiClient(tokens.access_token);
    
    const metadata = await apiClient.getElementMetadata(documentId, workspaceId, elementId);
    res.json(metadata);
  } catch (error: any) {
    console.error('Get element metadata error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Proxy OnShape thumbnail images with authentication
 * GET /api/thumbnail-proxy?url=<thumbnail_url>
 */
router.get('/thumbnail-proxy', requireAuth, async (req, res) => {
  try {
    const { url } = req.query;
    
    if (!url || typeof url !== 'string') {
      res.status(400).json({ error: 'Missing or invalid URL parameter' });
      return;
    }
    
    // Validate that this is a OnShape thumbnail URL
    if (!url.startsWith('https://cad.onshape.com/api/thumbnails/')) {
      res.status(400).json({ error: 'Invalid thumbnail URL' });
      return;
    }
    
    const tokens = (req as any).tokens;
    
    // Make authenticated request to OnShape thumbnail API
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${tokens.access_token}`,
        'Accept': 'image/*'
      }
    });
    
    if (!response.ok) {
      console.error('Failed to fetch thumbnail:', response.status, response.statusText);
      res.status(response.status).json({ error: 'Failed to fetch thumbnail from OnShape' });
      return;
    }
    
    // Get the content type from OnShape response
    const contentType = response.headers.get('content-type') || 'image/png';
    
    // Set appropriate headers for image response
    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'public, max-age=3600'); // Cache for 1 hour
    
    // Pipe the image data directly to the response
    const imageBuffer = await response.arrayBuffer();
    res.send(Buffer.from(imageBuffer));
    
  } catch (error: any) {
    console.error('Thumbnail proxy error:', error);
    res.status(500).json({ error: 'Failed to proxy thumbnail' });
  }
});

/**
 * Get parent information for a document
 * GET /api/documents/:documentId/parent
 */
router.get('/documents/:documentId/parent', requireAuth, async (req, res) => {
  try {
    const { documentId } = req.params;
    const tokens = (req as any).tokens;
    
    // Use OnShape's global tree nodes API to get parent information
    const parentInfoUrl = `https://cad.onshape.com/api/globaltreenodes/document/${documentId}/parentInfo`;
    
    const response = await fetch(parentInfoUrl, {
      headers: {
        'Authorization': `Bearer ${tokens.access_token}`,
        'Accept': 'application/vnd.onshape.v2+json'
      }
    });
    
    if (!response.ok) {
      console.error('Failed to fetch parent info:', response.status, response.statusText);
      res.status(response.status).json({ error: 'Failed to fetch parent information' });
      return;
    }
    
    const parentInfo = await response.json();
    res.json(parentInfo);
    
  } catch (error: any) {
    console.error('Get parent info error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get all documents with their complete data structure
 * GET /api/export/all
 */
router.get('/export/all', requireAuth, async (req, res) => {
  try {
    const { 
      format = 'json',
      includeBasicInfo = 'true',
      includeElements = 'false',
      includeParts = 'false',
      includeAssemblies = 'false',
      includeMassProperties = 'false',
      includeMetadata = 'false',
      requestsPerMinute = '30',
      ids
    } = req.query;
    
    const tokens = (req as any).tokens;
    const apiClient = new OnShapeApiClient(tokens.access_token);
    
    console.log('Advanced export requested with options:', {
      format,
      includeBasicInfo,
      includeElements,
      includeParts,
      includeAssemblies,
      includeMassProperties,
      includeMetadata,
      requestsPerMinute
    });
    
    // Parse options
    const options = {
      includeBasicInfo: includeBasicInfo === 'true',
      includeElements: includeElements === 'true',
      includeParts: includeParts === 'true',
      includeAssemblies: includeAssemblies === 'true',
      includeMassProperties: includeMassProperties === 'true',
      includeMetadata: includeMetadata === 'true'
    };
    
    // Get documents (optionally filter by provided ids)
    const idList = typeof ids === 'string' && ids.length ? (ids as string).split(',').filter(Boolean) : null;
    let documents = await apiClient.getDocuments(idList ? 200 : 20, 0);
    if (idList) {
      documents = documents.filter(doc => idList.includes(doc.id));
    }
    
    // Rate limiting setup
    const rateLimit = parseInt(requestsPerMinute as string);
    const delayBetweenRequests = Math.max(1000, (60 / rateLimit) * 1000);
    
    console.log(`Starting export of ${documents.length} documents with ${delayBetweenRequests}ms delay between requests`);
    
    const exportData = {
      exportInfo: {
        timestamp: new Date().toISOString(),
        options: options,
        totalDocuments: documents.length,
        processedDocuments: 0
      },
      documents: [] as any[]
    };

    // Function to add delay for rate limiting
    const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

    // Process each document
    let processedCount = 0;
    for (const document of documents) {
      try {
        console.log(`Processing document: ${document.name} (${document.id})`);
        
        const documentData: any = {
          id: document.id,
          name: document.name,
          creator: document.createdBy || document.owner,
          createdAt: document.createdAt,
          modifiedAt: document.modifiedAt,
          isPublic: document.isPublic,
          href: document.href,
          status: 'processed'
        };

        // Get detailed document information if requested
        if (options.includeBasicInfo) {
          try {
            const detailInfo = await apiClient.getDocument(document.id);
            documentData.detailInfo = detailInfo;
            await delay(delayBetweenRequests);
          } catch (error: any) {
            console.warn(`Failed to get detail info for ${document.name}:`, error.message);
            documentData.detailInfoError = error.message;
          }
        }

        // Get document metadata if requested
        if (options.includeMetadata) {
          try {
            const metadata = await apiClient.getDocumentMetadata(document.id);
            documentData.metadata = metadata;
            await delay(delayBetweenRequests);
          } catch (error: any) {
            console.warn(`Failed to get metadata for ${document.name}:`, error.message);
            documentData.metadataError = error.message;
          }
        }

        // Get elements and their data if requested
        if (options.includeElements || options.includeParts || options.includeAssemblies || options.includeMassProperties) {
          // Use default workspace or first available workspace
          const workspaceId = documentData.detailInfo?.defaultWorkspace?.id || 
                            documentData.detailInfo?.workspaces?.[0]?.id ||
                            document.id; // Fallback to document ID

          if (workspaceId) {
            try {
              const elements = await apiClient.getDocumentElements(document.id, workspaceId);
              documentData.elements = [];
              await delay(delayBetweenRequests);

              // Process each element
              for (const element of elements) {
                const elementData: any = {
                  id: element.id,
                  name: element.name,
                  type: element.type,
                  elementType: element.elementType
                };

                // Get parts if requested
                if (options.includeParts) {
                  try {
                    const parts = await apiClient.getParts(document.id, workspaceId, element.id);
                    elementData.parts = parts;
                    await delay(delayBetweenRequests);

                    // Get mass properties for parts if requested
                    if (options.includeMassProperties && parts.length > 0) {
                      elementData.massProperties = [];
                      for (const part of parts) {
                        try {
                          const massProps = await apiClient.getPartMassProperties(
                            document.id, workspaceId, element.id, part.partId
                          );
                          elementData.massProperties.push({
                            partId: part.partId,
                            ...massProps
                          });
                          await delay(delayBetweenRequests);
                        } catch (error: any) {
                          console.warn(`Failed to get mass properties for part ${part.partId}:`, error.message);
                        }
                      }
                    }
                  } catch (error: any) {
                    console.warn(`Failed to get parts for element ${element.id}:`, error.message);
                    elementData.partsError = error.message;
                  }
                }

                // Get assemblies if requested
                if (options.includeAssemblies) {
                  try {
                    const assemblies = await apiClient.getAssemblies(document.id, workspaceId, element.id);
                    elementData.assemblies = assemblies;
                    await delay(delayBetweenRequests);
                  } catch (error: any) {
                    console.warn(`Failed to get assemblies for element ${element.id}:`, error.message);
                    elementData.assembliesError = error.message;
                  }
                }

                // Get element metadata if requested
                if (options.includeMetadata) {
                  try {
                    const elementMetadata = await apiClient.getElementMetadata(document.id, workspaceId, element.id);
                    elementData.elementMetadata = elementMetadata;
                    await delay(delayBetweenRequests);
                  } catch (error: any) {
                    console.warn(`Failed to get element metadata for ${element.id}:`, error.message);
                    elementData.elementMetadataError = error.message;
                  }
                }

                documentData.elements.push(elementData);
              }
            } catch (error: any) {
              console.warn(`Failed to get elements for ${document.name}:`, error.message);
              documentData.elementsError = error.message;
            }
          } else {
            console.warn(`No workspace found for document ${document.name}`);
            documentData.elementsError = 'No workspace available';
          }
        }

        exportData.documents.push(documentData);
        processedCount++;
        console.log(`✅ Successfully processed: ${document.name} (${processedCount}/${documents.length})`);

      } catch (error: any) {
        console.error(`Error processing document ${document.name}:`, error);
        exportData.documents.push({
          id: document.id,
          name: document.name,
          status: 'error',
          error: error.message
        });
        processedCount++;
      }
    }

    // Update final processed count
    exportData.exportInfo.processedDocuments = processedCount;
    
    console.log(`Export completed: ${processedCount}/${documents.length} documents processed`);

    // Set appropriate headers based on format
    if (format === 'zip') {
      res.setHeader('Content-Type', 'application/zip');
      res.setHeader('Content-Disposition', 'attachment; filename="onshape-export.zip"');
    } else {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', 'attachment; filename="onshape-export.json"');
    }
    
    res.json(exportData);
  } catch (error: any) {
    console.error('Advanced export error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Stream export progress and data
 * GET /api/export/stream
 */
router.get('/export/stream', requireAuth, async (req, res) => {
  try {
    const { 
      format = 'json',
      includeBasicInfo = 'true',
      includeElements = 'false',
      includeParts = 'false',
      includeAssemblies = 'false',
      includeMassProperties = 'false',
      includeMetadata = 'false',
      requestsPerMinute = '30',
      ids
    } = req.query;
    
    const tokens = (req as any).tokens;
    const apiClient = new OnShapeApiClient(tokens.access_token);
    
    // Set up Server-Sent Events
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Cache-Control'
    });

    const sendEvent = (type: string, data: any) => {
      res.write(`event: ${type}\n`);
      res.write(`data: ${JSON.stringify(data)}\n\n`);
    };

    try {
      // Parse options
      const options = {
        includeBasicInfo: includeBasicInfo === 'true',
        includeElements: includeElements === 'true',
        includeParts: includeParts === 'true',
        includeAssemblies: includeAssemblies === 'true',
        includeMassProperties: includeMassProperties === 'true',
        includeMetadata: includeMetadata === 'true'
      };

      sendEvent('start', { 
        message: 'Starting export...', 
        options 
      });

      // Get all documents first (optionally filter to provided ids)
      const idList = typeof ids === 'string' && ids.length ? (ids as string).split(',').filter(Boolean) : null;
      let documents = await apiClient.getDocuments(idList ? 200 : 20, 0);
      if (idList) {
        documents = documents.filter(doc => idList.includes(doc.id));
      }
      sendEvent('documents-found', { 
        count: documents.length, 
        message: `Found ${documents.length} documents` 
      });

      // Rate limiting setup
      const rateLimit = parseInt(requestsPerMinute as string);
      const delayBetweenRequests = Math.max(1000, (60 / rateLimit) * 1000);
      
      const delay = (ms: number): Promise<void> => new Promise(resolve => setTimeout(resolve, ms));
      
      const exportData = {
        exportInfo: {
          timestamp: new Date().toISOString(),
          options: options,
          totalDocuments: documents.length,
          processedDocuments: 0
        },
        documents: [] as any[]
      };

      let processedCount = 0;
      
      // Process each document
      for (let i = 0; i < documents.length; i++) {
        const document = documents[i];
        
        sendEvent('progress', { 
          current: i + 1, 
          total: documents.length,
          documentName: document.name,
          message: `Processing ${document.name}...`
        });

        try {
          const documentData = await processDocumentForExport(
            apiClient, 
            document, 
            options, 
            delay, 
            delayBetweenRequests,
            (status: string) => sendEvent('document-status', { documentId: document.id, status })
          );
          
          exportData.documents.push(documentData);
          processedCount++;
          
          sendEvent('document-complete', { 
            documentId: document.id,
            documentName: document.name,
            processed: processedCount,
            total: documents.length
          });
          
        } catch (error: any) {
          sendEvent('document-error', { 
            documentId: document.id,
            documentName: document.name,
            error: error.message
          });
          
          exportData.documents.push({
            id: document.id,
            name: document.name,
            status: 'error',
            error: error.message
          });
          processedCount++;
        }
      }

      exportData.exportInfo.processedDocuments = processedCount;
      
      sendEvent('complete', { 
        exportData,
        message: `Export complete! Processed ${processedCount}/${documents.length} documents` 
      });

    } catch (error: any) {
      sendEvent('error', { 
        message: 'Export failed', 
        error: error.message 
      });
    }

    res.end();
  } catch (error: any) {
    console.error('Stream export error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Helper function to process a single document for export
async function processDocumentForExport(
  apiClient: OnShapeApiClient, 
  document: any, 
  options: any, 
  delay: (ms: number) => Promise<void>,
  delayMs: number,
  statusCallback?: (status: string) => void
): Promise<any> {
  const documentData: any = {
    id: document.id,
    name: document.name,
    creator: document.createdBy || document.owner,
    createdAt: document.createdAt,
    modifiedAt: document.modifiedAt,
    isPublic: document.isPublic,
    href: document.href,
    status: 'processed'
  };

  // Get detailed document information if requested
  if (options.includeBasicInfo) {
    statusCallback?.('Fetching document details...');
    try {
      const detailInfo = await apiClient.getDocument(document.id);
      documentData.detailInfo = detailInfo;
      await delay(delayMs);
    } catch (error: any) {
      console.warn(`Failed to get detail info for ${document.name}:`, error.message);
      documentData.detailInfoError = error.message;
    }
  }

  // Get document metadata if requested
  if (options.includeMetadata) {
    statusCallback?.('Fetching document metadata...');
    try {
      const metadata = await apiClient.getDocumentMetadata(document.id);
      documentData.metadata = metadata;
      await delay(delayMs);
    } catch (error: any) {
      console.warn(`Failed to get metadata for ${document.name}:`, error.message);
      documentData.metadataError = error.message;
    }
  }

  // Get elements and their data if requested
  if (options.includeElements || options.includeParts || options.includeAssemblies || options.includeMassProperties) {
    statusCallback?.('Fetching elements...');
    
    // Use default workspace or first available workspace
    const workspaceId = documentData.detailInfo?.defaultWorkspace?.id || 
                      documentData.detailInfo?.workspaces?.[0]?.id ||
                      document.id; // Fallback to document ID

    if (workspaceId) {
      try {
        const elements = await apiClient.getDocumentElements(document.id, workspaceId);
        documentData.elements = [];
        await delay(delayMs);

        // Process each element
        for (let j = 0; j < elements.length; j++) {
          const element = elements[j];
          statusCallback?.(`Processing element ${j + 1}/${elements.length}: ${element.name}`);
          
          const elementData: any = {
            id: element.id,
            name: element.name,
            type: element.type,
            elementType: element.elementType
          };

          // Get parts if requested
          if (options.includeParts) {
            try {
              const parts = await apiClient.getParts(document.id, workspaceId, element.id);
              elementData.parts = parts;
              await delay(delayMs);

              // Get mass properties for parts if requested
              if (options.includeMassProperties && parts.length > 0) {
                elementData.massProperties = [];
                for (const part of parts) {
                  try {
                    const massProps = await apiClient.getPartMassProperties(
                      document.id, workspaceId, element.id, part.partId
                    );
                    elementData.massProperties.push({
                      partId: part.partId,
                      ...massProps
                    });
                    await delay(delayMs);
                  } catch (error: any) {
                    console.warn(`Failed to get mass properties for part ${part.partId}:`, error.message);
                  }
                }
              }
            } catch (error: any) {
              console.warn(`Failed to get parts for element ${element.id}:`, error.message);
              elementData.partsError = error.message;
            }
          }

          // Get assemblies if requested
          if (options.includeAssemblies) {
            try {
              const assemblies = await apiClient.getAssemblies(document.id, workspaceId, element.id);
              elementData.assemblies = assemblies;
              await delay(delayMs);
            } catch (error: any) {
              console.warn(`Failed to get assemblies for element ${element.id}:`, error.message);
              elementData.assembliesError = error.message;
            }
          }

          // Get element metadata if requested
          if (options.includeMetadata) {
            try {
              const elementMetadata = await apiClient.getElementMetadata(document.id, workspaceId, element.id);
              elementData.elementMetadata = elementMetadata;
              await delay(delayMs);
            } catch (error: any) {
              console.warn(`Failed to get element metadata for ${element.id}:`, error.message);
              elementData.elementMetadataError = error.message;
            }
          }

          documentData.elements.push(elementData);
        }
      } catch (error: any) {
        console.warn(`Failed to get elements for ${document.name}:`, error.message);
        documentData.elementsError = error.message;
      }
    } else {
      console.warn(`No workspace found for document ${document.name}`);
      documentData.elementsError = 'No workspace available';
    }
  }

  return documentData;
}

/**
 * Get comprehensive details for a single document
 * GET /api/documents/:documentId/comprehensive
 */
router.get('/documents/:documentId/comprehensive', requireAuth, async (req, res) => {
  try {
    const { documentId } = req.params;
    const { 
      includeBasicInfo = 'true',
      includeElements = 'true',
      includeParts = 'false',
      includeAssemblies = 'false',
      includeMassProperties = 'false',
      includeMetadata = 'false'
    } = req.query;
    
    const tokens = (req as any).tokens;
    const apiClient = new OnShapeApiClient(tokens.access_token);
    
    console.log(`Comprehensive export requested for document ${documentId} with options:`, {
      includeBasicInfo,
      includeElements,
      includeParts,
      includeAssemblies,
      includeMassProperties,
      includeMetadata
    });
    
    // Parse options
    const options = {
      includeBasicInfo: includeBasicInfo === 'true',
      includeElements: includeElements === 'true',
      includeParts: includeParts === 'true',
      includeAssemblies: includeAssemblies === 'true',
      includeMassProperties: includeMassProperties === 'true',
      includeMetadata: includeMetadata === 'true'
    };
    
    // Get the specific document
    const document = await apiClient.getDocument(documentId);
    
    // Use the same comprehensive processing as the export functionality
    const delayMs = 1000; // 1 second delay for rate limiting
    const delay = (ms: number): Promise<void> => new Promise(resolve => setTimeout(resolve, ms));
    const documentData = await processDocumentForExport(apiClient, document, options, delay, delayMs);
    
    const response = {
      exportInfo: {
        timestamp: new Date().toISOString(),
        documentId: documentId,
        options: options
      },
      document: documentData
    };
    
    res.json(response);
  } catch (error: any) {
    console.error('Get comprehensive document error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Helper function to estimate API calls needed per document
function estimateApiCalls(document: any, options: any): number {
  let calls = 0;
  
  if (options.includeBasicInfo) calls += 1; // Document details
  if (options.includeElements) calls += 1; // Elements
  if (options.includeParts) calls += 2; // Estimated parts calls
  if (options.includeAssemblies) calls += 1; // Assemblies
  if (options.includeMassProperties) calls += 2; // Mass properties
  if (options.includeMetadata) calls += 1; // Metadata
  
  return calls;
}

export { router as apiRouter };