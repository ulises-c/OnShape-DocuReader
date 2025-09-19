export interface OAuthConfig {
    clientId: string;
    clientSecret: string;
    redirectUri: string;
    baseApiUrl: string;
    oauthBaseUrl: string;
    scope: string;
}
export declare const oauthConfig: OAuthConfig;
export declare function validateConfig(): void;
//# sourceMappingURL=oauth.d.ts.map