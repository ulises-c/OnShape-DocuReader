"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OnShapeApiClient = void 0;
const axios_1 = __importDefault(require("axios"));
const oauth_1 = require("../config/oauth");
class OnShapeApiClient {
    constructor(accessToken) {
        this.accessToken = accessToken;
        this.axiosInstance = axios_1.default.create({
            baseURL: oauth_1.oauthConfig.baseApiUrl,
            timeout: 30000,
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            }
        });
        // Add response interceptor for error handling
        this.axiosInstance.interceptors.response.use(response => response, error => {
            console.error('OnShape API Error:', {
                status: error.response?.status,
                data: error.response?.data,
                url: error.config?.url
            });
            throw error;
        });
    }
    /**
     * Get current user information
     */
    async getCurrentUser() {
        const response = await this.axiosInstance.get('/users/sessioninfo');
        return response.data;
    }
    /**
     * Get user's documents
     */
    async getDocuments(limit = 20, offset = 0) {
        const response = await this.axiosInstance.get('/documents', {
            params: {
                limit,
                offset,
                sortColumn: 'modifiedAt',
                sortOrder: 'desc'
            }
        });
        return response.data.items || [];
    }
    /**
     * Get detailed information about a specific document
     */
    async getDocument(documentId) {
        const response = await this.axiosInstance.get(`/documents/${documentId}`);
        return response.data;
    }
    /**
     * Get elements (parts, assemblies, etc.) from a document workspace
     */
    async getDocumentElements(documentId, workspaceId) {
        const response = await this.axiosInstance.get(`/documents/d/${documentId}/w/${workspaceId}/elements`);
        return response.data || [];
    }
    /**
     * Get parts from a specific element
     */
    async getParts(documentId, workspaceId, elementId) {
        const response = await this.axiosInstance.get(`/documents/d/${documentId}/w/${workspaceId}/e/${elementId}/parts`);
        return response.data || [];
    }
    /**
     * Get assemblies from a specific element
     */
    async getAssemblies(documentId, workspaceId, elementId) {
        const response = await this.axiosInstance.get(`/documents/d/${documentId}/w/${workspaceId}/e/${elementId}/assemblies`);
        return response.data || [];
    }
    /**
     * Get part mass properties
     */
    async getPartMassProperties(documentId, workspaceId, elementId, partId) {
        const response = await this.axiosInstance.get(`/documents/d/${documentId}/w/${workspaceId}/e/${elementId}/parts/${partId}/massProperties`);
        return response.data;
    }
    /**
     * Search for documents
     */
    async searchDocuments(query, limit = 20) {
        const response = await this.axiosInstance.get('/documents', {
            params: {
                q: query,
                limit,
                sortColumn: 'modifiedAt',
                sortOrder: 'desc'
            }
        });
        return response.data.items || [];
    }
    /**
     * Get document metadata
     */
    async getDocumentMetadata(documentId) {
        const response = await this.axiosInstance.get(`/metadata/d/${documentId}`);
        return response.data;
    }
    /**
     * Get element metadata
     */
    async getElementMetadata(documentId, workspaceId, elementId) {
        const response = await this.axiosInstance.get(`/metadata/d/${documentId}/w/${workspaceId}/e/${elementId}`);
        return response.data;
    }
}
exports.OnShapeApiClient = OnShapeApiClient;
//# sourceMappingURL=onshape-api-client.js.map