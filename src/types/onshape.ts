/**
 * OnShape API Types
 * Shared type definitions for OnShape API responses and internal data structures
 */

/** Element types returned by OnShape API */
export type OnShapeElementType =
  | 'ASSEMBLY'
  | 'PARTSTUDIO'
  | 'DRAWING'
  | 'BLOB'
  | 'APPLICATION'
  | 'FEATURESTUDIO'
  | 'BILLOFMATERIALS'
  | 'OTHER';

/** User information from OnShape */
export interface OnShapeUser {
  id: string;
  name: string;
  email: string;
  firstName?: string;
  lastName?: string;
}

/** Reference to an assembly element for BOM fetching */
export interface AssemblyReference {
  documentId: string;
  documentName: string;
  workspaceId: string;
  elementId: string;
  elementName: string;
  folderPath: string[];
}

/** Result of fetching a single assembly's BOM (Phase 4.3) */
export interface AssemblyBomFetchResult {
  source: {
    documentId: string;
    documentName: string;
    folderPath: string[];
    workspaceId: string;
  };
  assembly: {
    elementId: string;
    name: string;
  };
  bom: {
    headers: Array<{ id: string; name: string; visible?: boolean }> | string[];
    rows: any[];
  } | null;
  /** Error message if BOM fetch failed */
  error?: string;
  /** Time taken to fetch this BOM in ms */
  fetchDurationMs?: number;
}

/** Statistics from directory pre-scan */
export interface DirectoryStats {
  scanDate: string;
  scanDurationMs: number;
  summary: {
    totalFolders: number;
    totalDocuments: number;
    maxDepth: number;
    widestLevel: {
      depth: number;
      count: number;
    };
  };
  elementTypes: {
    ASSEMBLY: number;
    PARTSTUDIO: number;
    DRAWING: number;
    BLOB: number;
    OTHER: number; // combines APPLICATION, FEATURESTUDIO, BILLOFMATERIALS, etc.
  };
  estimates: {
    assembliesFound: number;
    estimatedBomApiCalls: number;
    estimatedTimeMinutes: number; // based on 500ms average per BOM fetch
  };
  /** Assembly list for Phase 4.3 parallel processing */
  assemblies: AssemblyReference[];
}

/** Parameters for scoped directory stats / export (Phase 4.7) */
export interface ExportScopeParams {
  /** Export scope: 'full' for entire workspace, 'partial' for selected items */
  scope: 'full' | 'partial';
  /** Document IDs to include (when scope is 'partial') */
  documentIds?: string[];
  /** Folder IDs to include - will include all documents within (when scope is 'partial') */
  folderIds?: string[];
}

/** Metadata about the export process */
export interface ExportMetadata {
  /** ISO timestamp when report was generated */
  reportGeneratedAt: string;
  /** OnShape user who generated the report (name or email) */
  generatedBy: string;
  /** Total export duration in milliseconds */
  exportDurationMs: number;
  /** Configuration used for this export */
  exportConfig: {
    /** Number of parallel workers (for Phase 4.3) */
    workerCount: number;
    /** Delay between API calls in ms */
    delayMs: number;
    /** Export scope */
    scope: 'full' | 'partial';
    /** Selected folder IDs (if partial export) */
    selectedFolders?: string[];
    /** Selected document IDs (if partial export) */
    selectedDocuments?: string[];
    /** Total selected items count (Phase 4.7) */
    selectedItemCount?: number;
  };
}

/** Aggregate BOM export result (Phase 4.3 with parallel fetching) */
export interface AggregateBomResult {
  /** Export metadata */
  metadata: ExportMetadata;
  exportDate: string;
  summary: {
    foldersScanned: number;
    documentsScanned: number;
    assembliesFound: number;
    assembliesSucceeded: number;
    assembliesFailed: number;
    totalBomRows: number;
  };
  assemblies: AssemblyBomFetchResult[];
}

/** Progress event phases (Phase 4.4) */
export type ExportPhase = 'initializing' | 'scanning' | 'fetching' | 'complete' | 'error';

/** Progress event sent via SSE (Phase 4.4) */
export interface ExportProgressEvent {
  phase: ExportPhase;
  
  /** Pre-scan progress (phase: 'scanning') */
  scan?: {
    foldersScanned: number;
    documentsScanned: number;
  };
  
  /** BOM fetch progress (phase: 'fetching') */
  fetch?: {
    current: number;
    total: number;
    currentAssembly: string;
    currentPath: string[];
    succeeded: number;
    failed: number;
  };
  
  /** Timing information */
  timing?: {
    elapsedMs: number;
    avgFetchMs: number;
    estimatedRemainingMs: number;
  };
  
  /** Error details (phase: 'error') */
  error?: {
    message: string;
    assembly?: string;
  };
  
  /** Timestamp of this event */
  timestamp: string;
}

/** Final result sent when export completes (Phase 4.4) */
export interface ExportCompleteEvent {
  phase: 'complete';
  result: AggregateBomResult;
  timestamp: string;
}
