# Types Specification `src/types/SPEC.md`

## Purpose

TypeScript type definitions and module augmentations providing type safety for session data and third-party library integrations across the application.

## Directory Structure

```
src/types/
└── session.d.ts              # Express session type augmentation
```

## Core Responsibilities

### session.d.ts
**Express Session Type Extension**
- Augment `express-session` module with custom session properties
- Provide compile-time type safety for session data access
- Ensure consistent session data structure across route handlers and middleware

**Extended Session Properties:**
- `authenticated?: boolean` - Authentication state flag
- `accessToken?: string` - OnShape API access token
- `refreshToken?: string` - Token refresh credential
- `returnTo?: string` - Post-login redirect URL

## Architecture Patterns

### Module Augmentation
Uses TypeScript's declaration merging to extend third-party types:
```typescript
import 'express-session';

declare module 'express-session' {
  interface SessionData {
    // Custom properties
  }
}
```

**Benefits:**
- Type safety without modifying library code
- IDE autocomplete for session properties
- Compile-time error prevention
- Self-documenting session structure

### Optional Properties
All properties are optional (`?`) to allow:
- Progressive session initialization during OAuth flow
- Graceful handling of missing properties
- Flexible session state transitions

## Integration Points

### With Routes
Route handlers get typed session access:
```typescript
app.get('/auth/callback', (req, res) => {
  // TypeScript knows these properties exist
  req.session.authenticated = true;
  req.session.accessToken = token;
  req.session.refreshToken = refreshToken;
});
```

### With Middleware
Authentication middleware uses typed session:
```typescript
function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.session.authenticated || !req.session.accessToken) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
}
```

### With Services
Services access session data with type safety:
```typescript
class OnShapeApiClient {
  constructor(accessToken: string) {
    // TypeScript validates accessToken is string
  }
}

const client = new OnShapeApiClient(req.session.accessToken!);
```

## Type Safety Features

### Compile-Time Validation
```typescript
// ✅ Valid: Property exists and correct type
req.session.authenticated = true;

// ❌ Error: Property doesn't exist
req.session.invalidProp = 'value'; // TypeScript error

// ❌ Error: Wrong type
req.session.authenticated = 'yes'; // TypeScript error (expects boolean)
```

### Non-Null Assertions
When property presence is guaranteed by auth middleware:
```typescript
// After requireAuth middleware, accessToken is known to exist
const token = req.session.accessToken!; // Non-null assertion
const client = new OnShapeApiClient(token);
```

### Optional Chaining
For uncertain property presence:
```typescript
// Safe access with fallback
const returnUrl = req.session.returnTo ?? '/dashboard';
```

## Session Data Lifecycle

### 1. Initial Request (Unauthenticated)
```typescript
{
  // No custom properties set
  cookie: { /* ... */ }
}
```

### 2. OAuth Initiation
```typescript
{
  returnTo: '/documents',  // Set before redirect
  cookie: { /* ... */ }
}
```

### 3. OAuth Callback (Authenticated)
```typescript
{
  authenticated: true,
  accessToken: 'ya29.a0...',
  refreshToken: '1//0e...',
  returnTo: '/documents',
  cookie: { /* ... */ }
}
```

### 4. Logout
```typescript
{
  // Properties cleared or session destroyed
  cookie: { /* ... */ }
}
```

## Security Considerations

### Token Storage
- Access tokens stored only in server-side session
- Never exposed to client (HTTP-only cookies)
- Cleared on logout

### Type-Level Protection
- Prevents accidental token exposure via wrong type
- Ensures consistent authentication checks
- Compile-time validation of session access patterns

## Best Practices

### Type Assertions
```typescript
// Good: Check existence before assertion
if (req.session.accessToken) {
  const token = req.session.accessToken;
  // Use token safely
}

// Good: Non-null assertion after middleware guard
// (in route protected by requireAuth)
const token = req.session.accessToken!;

// Bad: Unsafe non-null assertion without guarantee
const token = req.session.accessToken!; // Could be undefined!
```

### Property Initialization
```typescript
// Good: Set all related properties together
req.session.authenticated = true;
req.session.accessToken = token;
req.session.refreshToken = refreshToken;

// Bad: Partial initialization (inconsistent state)
req.session.authenticated = true;
// Forgot to set tokens!
```

### Cleanup
```typescript
// Good: Clear all auth properties on logout
delete req.session.authenticated;
delete req.session.accessToken;
delete req.session.refreshToken;

// Or destroy entire session
req.session.destroy((err) => { /* ... */ });
```

## Future Enhancements

- [ ] Add token expiration timestamp to session
- [ ] Include user info in session (id, name, email)
- [ ] Add CSRF token to session data
- [ ] Include OAuth state in session for verification
- [ ] Add session metadata (created, last accessed)
- [ ] Type definitions for session events
- [ ] Add session storage configuration types
- [ ] Include refresh token expiration

## Dependencies

- **express-session**: Session middleware being augmented
- **TypeScript**: Type system and declaration merging

## Related Components

- `src/routes/auth.ts`: OAuth flow using session properties
- `src/routes/api.ts`: API routes accessing session tokens
- `src/services/oauth-service.ts`: Token exchange and refresh
- `src/services/session-storage.ts`: Session persistence
- `src/index.ts`: Session middleware configuration

## Convention Notes

### File Naming
- `.d.ts` extension indicates type declaration file
- No runtime code, only type definitions
- Processed by TypeScript compiler, not emitted to dist

### Module Path
- Placed in `src/types/` for organization
- Automatically included via tsconfig.json `include` pattern
- No explicit import required for augmentation to take effect

### Documentation
- Use TSDoc comments for complex session properties if needed
- Keep session structure documented in SPEC.md
- Update when adding new session properties
