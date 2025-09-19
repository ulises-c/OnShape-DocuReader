export interface OnShapeUser {
    id: string;
    name: string;
    email: string;
    company: string;
    image: string;
}
export interface OnShapeDocument {
    id: string;
    name: string;
    isPublic: boolean;
    owner: {
        id: string;
        name: string;
        type: number;
    };
    createdAt: string;
    modifiedAt: string;
    href: string;
}
export interface OnShapeDocumentElement {
    id: string;
    name: string;
    type: string;
    elementType: string;
    lengthUnits: string;
    angleUnits: string;
    massUnits: string;
}
export interface OnShapeDocumentInfo {
    id: string;
    name: string;
    description: string;
    owner: {
        id: string;
        name: string;
        type: number;
    };
    createdAt: string;
    modifiedAt: string;
    isPublic: boolean;
    defaultWorkspace: {
        id: string;
        name: string;
    };
    workspaces: Array<{
        id: string;
        name: string;
        isPublic: boolean;
    }>;
}
export declare class OnShapeApiClient {
    private axiosInstance;
    private accessToken;
    constructor(accessToken: string);
    /**
     * Get current user information
     */
    getCurrentUser(): Promise<OnShapeUser>;
    /**
     * Get user's documents
     */
    getDocuments(limit?: number, offset?: number): Promise<OnShapeDocument[]>;
    /**
     * Get detailed information about a specific document
     */
    getDocument(documentId: string): Promise<OnShapeDocumentInfo>;
    /**
     * Get elements (parts, assemblies, etc.) from a document workspace
     */
    getDocumentElements(documentId: string, workspaceId: string): Promise<OnShapeDocumentElement[]>;
    /**
     * Get parts from a specific element
     */
    getParts(documentId: string, workspaceId: string, elementId: string): Promise<any[]>;
    /**
     * Get assemblies from a specific element
     */
    getAssemblies(documentId: string, workspaceId: string, elementId: string): Promise<any[]>;
    /**
     * Get part mass properties
     */
    getPartMassProperties(documentId: string, workspaceId: string, elementId: string, partId: string): Promise<any>;
    /**
     * Search for documents
     */
    searchDocuments(query: string, limit?: number): Promise<OnShapeDocument[]>;
    /**
     * Get document metadata
     */
    getDocumentMetadata(documentId: string): Promise<any>;
    /**
     * Get element metadata
     */
    getElementMetadata(documentId: string, workspaceId: string, elementId: string): Promise<any>;
}
//# sourceMappingURL=onshape-api-client.d.ts.map