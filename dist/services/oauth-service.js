"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OAuthService = void 0;
const axios_1 = __importDefault(require("axios"));
const uuid_1 = require("uuid");
const oauth_1 = require("../config/oauth");
class OAuthService {
    constructor() {
        this.stateStore = new Map(); // In production, use Redis or database
    }
    static getInstance() {
        if (!OAuthService.instance) {
            OAuthService.instance = new OAuthService();
        }
        return OAuthService.instance;
    }
    /**
     * Generate OAuth authorization URL for OnShape
     */
    generateAuthUrl() {
        const state = (0, uuid_1.v4)();
        const codeVerifier = this.generateCodeVerifier();
        const codeChallenge = this.generateCodeChallenge(codeVerifier);
        // Store the code verifier with state for later use
        this.stateStore.set(state, codeVerifier);
        const params = new URLSearchParams({
            response_type: 'code',
            client_id: oauth_1.oauthConfig.clientId,
            redirect_uri: oauth_1.oauthConfig.redirectUri,
            scope: oauth_1.oauthConfig.scope,
            state: state,
            code_challenge: codeChallenge,
            code_challenge_method: 'S256'
        });
        const authUrl = `${oauth_1.oauthConfig.oauthBaseUrl}/oauth/authorize?${params.toString()}`;
        return { url: authUrl, state };
    }
    /**
     * Exchange authorization code for access token
     */
    async exchangeCodeForToken(code, state) {
        const codeVerifier = this.stateStore.get(state);
        if (!codeVerifier) {
            throw new Error('Invalid or expired state parameter');
        }
        // Clean up state
        this.stateStore.delete(state);
        const tokenUrl = `${oauth_1.oauthConfig.oauthBaseUrl}/oauth/token`;
        const params = new URLSearchParams({
            grant_type: 'authorization_code',
            client_id: oauth_1.oauthConfig.clientId,
            client_secret: oauth_1.oauthConfig.clientSecret,
            redirect_uri: oauth_1.oauthConfig.redirectUri,
            code: code,
            code_verifier: codeVerifier
        });
        try {
            const response = await axios_1.default.post(tokenUrl, params, {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Accept': 'application/json'
                }
            });
            return response.data;
        }
        catch (error) {
            console.error('Token exchange error:', error.response?.data || error.message);
            throw new Error(`Failed to exchange authorization code: ${error.response?.data?.error_description || error.message}`);
        }
    }
    /**
     * Refresh access token using refresh token
     */
    async refreshToken(refreshToken) {
        const tokenUrl = `${oauth_1.oauthConfig.oauthBaseUrl}/oauth/token`;
        const params = new URLSearchParams({
            grant_type: 'refresh_token',
            client_id: oauth_1.oauthConfig.clientId,
            client_secret: oauth_1.oauthConfig.clientSecret,
            refresh_token: refreshToken
        });
        try {
            const response = await axios_1.default.post(tokenUrl, params, {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Accept': 'application/json'
                }
            });
            return response.data;
        }
        catch (error) {
            console.error('Token refresh error:', error.response?.data || error.message);
            throw new Error(`Failed to refresh token: ${error.response?.data?.error_description || error.message}`);
        }
    }
    generateCodeVerifier() {
        const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
        let result = '';
        for (let i = 0; i < 128; i++) {
            result += charset.charAt(Math.floor(Math.random() * charset.length));
        }
        return result;
    }
    generateCodeChallenge(verifier) {
        const crypto = require('crypto');
        const hash = crypto.createHash('sha256').update(verifier).digest();
        return hash.toString('base64url');
    }
}
exports.OAuthService = OAuthService;
//# sourceMappingURL=oauth-service.js.map