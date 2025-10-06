# Config – SPEC (Compressed)

## Purpose
OAuth config; env vars; validation.

## Dir
```
src/config/
└── oauth.ts
```

## Responsibilities
- Load OAuth creds from env (ONSHAPE_CLIENT_ID/SECRET/REDIRECT_URI)
- Export OAuthConfig interface (clientId, clientSecret, redirectUri, baseApiUrl, oauthBaseUrl, scope)
- validateConfig() checks required vars; throws on missing

## Interfaces
**OAuthConfig**: { clientId, clientSecret, redirectUri, baseApiUrl, oauthBaseUrl, scope }
**validateConfig**: () => void (throws if invalid)

## Env Vars
| Var | Required | Default |
|-----|----------|---------|
| ONSHAPE_CLIENT_ID | Yes | - |
| ONSHAPE_CLIENT_SECRET | Yes | - |
| ONSHAPE_REDIRECT_URI | No | http://localhost:3000/auth/callback |
| ONSHAPE_API_BASE_URL | No | https://cad.onshape.com/api/v12 |
| ONSHAPE_OAUTH_BASE_URL | No | https://oauth.onshape.com |

## Security
- Creds from env; never committed
- Read-only scope: OAuth2Read OAuth2ReadPII
- Validation on app start; fail fast

## Future
Multi-provider; dynamic scope; env profiles; schema validation; encrypted dev creds; hot reload; rate limit config; API version config
