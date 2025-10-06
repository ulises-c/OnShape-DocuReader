# Types – SPEC (Compressed)

## Purpose
TypeScript session type augmentation.

## Dir
```
src/types/
└── session.d.ts
```

## Responsibilities
- Augment express-session SessionData with custom props
- Compile-time type safety for session access
- Properties: authenticated?, accessToken?, refreshToken?, returnTo?

## Interfaces
```typescript
declare module 'express-session' {
  interface SessionData {
    authenticated?: boolean;
    accessToken?: string;
    refreshToken?: string;
    returnTo?: string;
  }
}
```

## Lifecycle
1. Initial: no custom props
2. OAuth init: returnTo set
3. Callback: authenticated, accessToken, refreshToken set
4. Logout: props cleared or session destroyed

## Security
- Tokens server-side only; HTTP-only cookies
- Type-level protection; compile-time validation

## Future
Token expiry; user info; CSRF token; OAuth state; session metadata; events; config types; refresh expiry
