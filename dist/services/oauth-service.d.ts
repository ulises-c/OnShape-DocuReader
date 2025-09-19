export interface OAuthTokens {
    access_token: string;
    refresh_token: string;
    token_type: string;
    expires_in: number;
}
export interface OAuthState {
    state: string;
    codeVerifier: string;
}
export declare class OAuthService {
    private static instance;
    private stateStore;
    static getInstance(): OAuthService;
    /**
     * Generate OAuth authorization URL for OnShape
     */
    generateAuthUrl(): {
        url: string;
        state: string;
    };
    /**
     * Exchange authorization code for access token
     */
    exchangeCodeForToken(code: string, state: string): Promise<OAuthTokens>;
    /**
     * Refresh access token using refresh token
     */
    refreshToken(refreshToken: string): Promise<OAuthTokens>;
    private generateCodeVerifier;
    private generateCodeChallenge;
}
//# sourceMappingURL=oauth-service.d.ts.map