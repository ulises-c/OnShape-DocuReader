"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.oauthConfig = void 0;
exports.validateConfig = validateConfig;
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
exports.oauthConfig = {
    clientId: process.env.ONSHAPE_CLIENT_ID || '',
    clientSecret: process.env.ONSHAPE_CLIENT_SECRET || '',
    redirectUri: process.env.ONSHAPE_REDIRECT_URI || 'http://localhost:3000/auth/callback',
    baseApiUrl: process.env.ONSHAPE_API_BASE_URL || 'https://cad.onshape.com/api/v6',
    oauthBaseUrl: process.env.ONSHAPE_OAUTH_BASE_URL || 'https://oauth.onshape.com',
    scope: 'OAuth2Read OAuth2ReadPII' // OnShape OAuth scopes
};
function validateConfig() {
    const required = ['ONSHAPE_CLIENT_ID', 'ONSHAPE_CLIENT_SECRET'];
    const missing = required.filter(key => !process.env[key]);
    if (missing.length > 0) {
        throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
    }
}
//# sourceMappingURL=oauth.js.map