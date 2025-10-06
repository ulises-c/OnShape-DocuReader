# OAuth Configuration Module Specification `src/config/SPEC.md`

## Purpose

Centralized OAuth 2.0 configuration management for OnShape API integration with environment variable validation and type safety.

## Configuration Structure

```
src/config/
└── oauth.ts              # OAuth configuration and validation
```

## Core Responsibilities

### Configuration Management
- Load OAuth credentials from environment variables
- Provide typed configuration object for OAuth flows
- Validate required environment variables at startup
- Define OAuth scopes for OnShape API access

### Type Safety
- Export `OAuthConfig` interface for TypeScript consumers
- Ensure consistent configuration shape across services
- Enable compile-time validation of config usage

## Configuration Schema

### OAuthConfig Interface
```typescript
{
  clientId: string;           // OnShape OAuth client ID
  clientSecret: string;       // OnShape OAuth client secret
  redirectUri: string;        // OAuth callback URL
  baseApiUrl: string;         // OnShape API v12 base URL
  oauthBaseUrl: string;       // OnShape OAuth service URL
  scope: string;              // Space-separated OAuth scopes
}
```

### Environment Variables
| Variable | Required | Default | Purpose |
|----------|----------|---------|---------|
| `ONSHAPE_CLIENT_ID` | Yes | - | OAuth application client ID |
| `ONSHAPE_CLIENT_SECRET` | Yes | - | OAuth application secret |
| `ONSHAPE_REDIRECT_URI` | No | `http://localhost:3000/auth/callback` | OAuth callback endpoint |
| `ONSHAPE_API_BASE_URL` | No | `https://cad.onshape.com/api/v12` | OnShape API endpoint |
| `ONSHAPE_OAUTH_BASE_URL` | No | `https://oauth.onshape.com` | OnShape OAuth service |

## Validation

### Startup Validation
- `validateConfig()` checks for required credentials
- Throws descriptive error if credentials missing
- Called during application bootstrap in `index.ts`
- Fails fast to prevent runtime authentication errors

### Scope Configuration
- Default scope: `OAuth2Read OAuth2ReadPII`
- Read-only access to documents and user information
- No write permissions for safety

## Integration Points

### With OAuthService
- Provides base URLs for OAuth endpoints
- Supplies client credentials for token exchange
- Defines redirect URI for callback handling

### With OnShapeApiClient
- Supplies API base URL for request construction
- Used for API endpoint resolution
- Ensures consistent API versioning (v12)

### With Application Bootstrap
- Validated in `index.ts` before server starts
- Configuration errors prevent server startup
- Clear error messages for missing credentials

## Security Considerations

### Credential Storage
- Credentials loaded from environment variables
- Never committed to version control
- Should use secure secret management in production

### Scope Limitation
- Read-only scopes minimize security risk
- No destructive operations possible
- User data access requires explicit PII scope

### Secret Exposure
- Client secret never sent to frontend
- Used only in server-side token exchange
- PKCE flow provides additional security layer

## Configuration Flow

```
.env file
    ↓
dotenv.config()
    ↓
process.env variables
    ↓
oauthConfig object
    ↓
validateConfig()
    ↓
Service initialization
```

## Error Handling

### Missing Required Variables
```typescript
throw new Error(
  `Missing required environment variables: ${missing.join(', ')}`
);
```

### Invalid Configuration
- Early validation prevents silent failures
- Clear error messages for debugging
- Application fails to start with bad config

## Development Setup

### Example .env File
```env
ONSHAPE_CLIENT_ID=your_client_id_here
ONSHAPE_CLIENT_SECRET=your_client_secret_here
ONSHAPE_REDIRECT_URI=http://localhost:3000/auth/callback
```

### Production Considerations
- Use environment-specific .env files
- Rotate secrets regularly
- Consider secret management services (AWS Secrets Manager, Azure Key Vault)

## Future Enhancements

- [ ] Support multiple OAuth providers
- [ ] Dynamic scope configuration
- [ ] Environment-based configuration profiles
- [ ] Configuration validation with schema library (Zod, Joi)
- [ ] Encrypted credential storage for development
- [ ] Configuration hot-reloading for development
- [ ] Rate limiting configuration
- [ ] API version configuration per environment

## Dependencies

- **dotenv**: Environment variable loading
- **TypeScript**: Type definitions for configuration

## Related Components

- `src/services/oauth-service.ts`: OAuth flow implementation
- `src/services/onshape-api-client.ts`: API client using config
- `src/index.ts`: Application bootstrap and validation
- `src/routes/auth.ts`: Authentication endpoints using config

## Best Practices

### Configuration Access
```typescript
// Good: Import from config module
import { oauthConfig } from '../config/oauth';

// Bad: Access process.env directly
const clientId = process.env.ONSHAPE_CLIENT_ID;
```

### Type Safety
```typescript
// Good: Use typed config
function createAuthUrl(config: OAuthConfig) { ... }

// Bad: Untyped configuration
function createAuthUrl(config: any) { ... }
```

### Validation Timing
```typescript
// Good: Validate before server starts
validateConfig();
app.listen(PORT);

// Bad: Validate on first request
app.get('/auth/login', (req, res) => {
  validateConfig(); // Too late!
});
```
