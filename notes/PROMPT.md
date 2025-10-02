## Fix TypeScript Build Errors in OnShape DocuReader

I need to fix 34 TypeScript compilation errors in my OnShape DocuReader application. The codebase is provided, and here are the specific fixes needed:

### 1. **Fix OAuth Config Import (src/index.ts line 11)**
**Current code**: `import { config } from './config/oauth.js';`
**Issue**: The module exports `oauthConfig`, not `config`
**Fix**: Change to `import { oauthConfig } from './config/oauth.js';`
**Also update line 88**: Change `config.clientId` to `oauthConfig.clientId`

### 2. **Fix tsconfig.json for ES Module Support (import.meta)**
**File**: `tsconfig.json`
**Issue**: Current `module: "commonjs"` doesn't support `import.meta`
**Fix**: Change the `compilerOptions` to:
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ES2020",  // Changed from "commonjs"
    "moduleResolution": "node",
    "lib": ["ES2020"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "allowJs": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "removeComments": false,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "noImplicitThis": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

### 3. **Remove .ts Extensions from Import Paths**
**Files to fix**:
- `src/routes/api.ts` line 2: Change `'../services/onshape-api-client.ts'` to `'../services/onshape-api-client.js'`
- `src/routes/auth.ts` line 2: Change `'../services/oauth-service.ts'` to `'../services/oauth-service.js'`

### 4. **Create Session Type Definitions**
**Create new file**: `src/types/session.d.ts`
```typescript
import 'express-session';

declare module 'express-session' {
  interface SessionData {
    authenticated?: boolean;
    accessToken?: string;
    refreshToken?: string;
  }
}
```

### 5. **Fix requireAuth Middleware Return Type**
**File**: `src/routes/api.ts` line 6-10
```typescript
const requireAuth = (req: Request, res: Response, next: NextFunction): void | Response => {
  if (!req.session?.authenticated) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
};
```

### 6. **Fix Method Name in auth.ts**
**File**: `src/routes/auth.ts` line 20
**Current**: `exchangeCodeForTokens`
**Fix**: Change to `exchangeCodeForToken` (remove the 's')

### 7. **Add Missing Methods to OnShapeApiClient**
**File**: `src/services/onshape-api-client.ts`
Add these methods to the class:

```typescript
/**
 * Get comprehensive document data including elements, parts, and assemblies
 */
async getComprehensiveDocument(documentId: string, params: any): Promise<any> {
  const doc = await this.getDocument(documentId);
  const result: any = { ...doc };
  
  if (doc.defaultWorkspace?.id && params.includeElements === 'true') {
    result.elements = await this.getElements(documentId, doc.defaultWorkspace.id);
    
    if (params.includeParts === 'true' || params.includeAssemblies === 'true') {
      for (const element of result.elements) {
        if (params.includeParts === 'true') {
          element.parts = await this.getParts(documentId, doc.defaultWorkspace.id, element.id);
        }
        if (params.includeAssemblies === 'true') {
          element.assemblies = await this.getAssemblies(documentId, doc.defaultWorkspace.id, element.id);
        }
      }
    }
  }
  
  return result;
}

/**
 * Get parent hierarchy information for a document
 */
async getParentInfo(documentId: string): Promise<any> {
  const response = await this.axiosInstance.get(`/documents/${documentId}/parent`);
  return response.data;
}

/**
 * Get elements from a document workspace
 */
async getElements(documentId: string, workspaceId: string): Promise<OnShapeDocumentElement[]> {
  return this.getDocumentElements(documentId, workspaceId);
}

/**
 * Export all documents with options
 */
async exportAll(options: any, ids?: string[]): Promise<any> {
  const documents = ids ? 
    await Promise.all(ids.map(id => this.getDocument(id))) :
    await this.getDocuments(100, 0);
    
  const result: any = {
    documents: [],
    exportInfo: {
      totalDocuments: documents.length,
      processedDocuments: 0,
      exportDate: new Date().toISOString()
    }
  };
  
  for (const doc of documents) {
    const docData: any = { ...doc };
    
    if (options.includeElements === 'true' && doc.defaultWorkspace?.id) {
      docData.elements = await this.getElements(doc.id, doc.defaultWorkspace.id);
    }
    
    result.documents.push(docData);
    result.exportInfo.processedDocuments++;
  }
  
  return result;
}

/**
 * Export documents as a stream (simplified implementation)
 */
async exportStream(options: any, ids?: string[]): Promise<any> {
  // For now, return a simple event emitter mock
  const { EventEmitter } = require('events');
  const stream = new EventEmitter();
  
  setTimeout(async () => {
    try {
      const data = await this.exportAll(options, ids);
      stream.emit('data', data);
      stream.emit('end');
    } catch (error) {
      stream.emit('error', error);
    }
  }, 0);
  
  return stream;
}

/**
 * Fetch thumbnail image
 */
async fetchThumbnail(url: string): Promise<Buffer> {
  const response = await axios.get(url, {
    headers: {
      'Authorization': `Bearer ${this.accessToken}`
    },
    responseType: 'arraybuffer'
  });
  return Buffer.from(response.data);
}
```

### 8. **Fix OAuthService Method**
**File**: `src/services/oauth-service.ts`
Add the missing `getAuthorizationUrl` method and alias:

```typescript
/**
 * Get the authorization URL (public method for router)
 */
public getAuthorizationUrl(): string {
  const { url } = this.generateAuthUrl();
  return url;
}

/**
 * Alias for exchangeCodeForToken to match what auth.ts expects
 */
public async exchangeCodeForTokens(code: string, state?: string): Promise<OAuthTokens> {
  // If state is not provided, try to use the first available state
  const stateToUse = state || Array.from(this.stateStore.keys())[0];
  if (!stateToUse) {
    throw new Error('No state available for token exchange');
  }
  return this.exchangeCodeForToken(code, stateToUse);
}
```

### 9. **Fix Missing Return Statements in Routes**
**File**: `src/routes/auth.ts`

Fix the callback route (line 12):
```typescript
router.get('/callback', async (req: Request, res: Response): Promise<Response | void> => {
  try {
    const { code, state } = req.query;
    
    if (!code || typeof code !== 'string') {
      return res.status(400).json({ error: 'Authorization code missing' });
    }

    const tokens = await oauthService.exchangeCodeForToken(code as string, state as string);
    
    req.session.accessToken = tokens.access_token;
    req.session.refreshToken = tokens.refresh_token;
    req.session.authenticated = true;

    return res.redirect('/dashboard');
  } catch (error) {
    console.error('OAuth callback error:', error);
    return res.status(500).json({ error: 'Authentication failed' });
  }
});
```

Fix the logout route (line 37):
```typescript
router.post('/logout', (req: Request, res: Response): void => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Logout error:', err);
      res.status(500).json({ error: 'Logout failed' });
      return;
    }
    res.clearCookie('connect.sid');
    res.json({ success: true });
  });
});
```

**File**: `src/routes/api.ts`

Fix the thumbnail-proxy route (line 174):
```typescript
router.get('/thumbnail-proxy', async (req: Request, res: Response): Promise<Response> => {
  try {
    const url = req.query.url as string;
    if (!url) {
      return res.status(400).json({ error: 'URL parameter required' });
    }
    
    const client = new OnShapeApiClient(req.session.accessToken!);
    const imageBuffer = await client.fetchThumbnail(url);
    
    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Cache-Control', 'public, max-age=86400');
    return res.send(imageBuffer);
  } catch (error) {
    console.error('Thumbnail proxy error:', error);
    return res.status(500).json({ error: 'Failed to fetch thumbnail' });
  }
});
```

### 10. **Add Missing Import in onshape-api-client.ts**
At the top of `src/services/onshape-api-client.ts`, ensure axios is imported:
```typescript
import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
```

### Execution Order:
1. First create the session type definitions file
2. Update tsconfig.json
3. Fix all import paths (remove .ts extensions)
4. Fix the OAuth config import name
5. Add missing methods to OnShapeApiClient
6. Fix method names and return statements
7. Run `npm run build` to verify all errors are resolved