import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import { oauthConfig } from '../config/oauth';

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
  createdBy?: {
    id: string;
    name: string;
    jsonType?: string;
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

export class OnShapeApiClient {
  private axiosInstance: AxiosInstance;
  private accessToken: string;

  constructor(accessToken: string) {
    this.accessToken = accessToken;
    this.axiosInstance = axios.create({
      baseURL: oauthConfig.baseApiUrl,
      timeout: 30000,
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });

    // Add response interceptor for error handling
    this.axiosInstance.interceptors.response.use(
      response => response,
      error => {
        console.error('OnShape API Error:', {
          status: error.response?.status,
          data: error.response?.data,
          url: error.config?.url
        });
        throw error;
      }
    );
  }

  /**
   * Get current user information
   */
  async getCurrentUser(): Promise<OnShapeUser> {
    const response = await this.axiosInstance.get('/users/sessioninfo');
    return response.data;
  }

  /**
   * Get user's documents
   */
  async getDocuments(limit: number = 20, offset: number = 0): Promise<OnShapeDocument[]> {
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
  async getDocument(documentId: string): Promise<OnShapeDocumentInfo> {
    const response = await this.axiosInstance.get(`/documents/${documentId}`);
    return response.data;
  }

  /**
   * Get elements (parts, assemblies, etc.) from a document workspace
   */
  async getDocumentElements(documentId: string, workspaceId: string): Promise<OnShapeDocumentElement[]> {
    const response = await this.axiosInstance.get(
      `/documents/d/${documentId}/w/${workspaceId}/elements`
    );
    return response.data || [];
  }

  /**
   * Get parts from a specific element
   */
  async getParts(documentId: string, workspaceId: string, elementId: string): Promise<any[]> {
    const response = await this.axiosInstance.get(
      `/documents/d/${documentId}/w/${workspaceId}/e/${elementId}/parts`
    );
    return response.data || [];
  }

  /**
   * Get assemblies from a specific element
   */
  async getAssemblies(documentId: string, workspaceId: string, elementId: string): Promise<any[]> {
    const response = await this.axiosInstance.get(
      `/documents/d/${documentId}/w/${workspaceId}/e/${elementId}/assemblies`
    );
    return response.data || [];
  }

  /**
   * Get part mass properties
   */
  async getPartMassProperties(
    documentId: string, 
    workspaceId: string, 
    elementId: string, 
    partId: string
  ): Promise<any> {
    const response = await this.axiosInstance.get(
      `/documents/d/${documentId}/w/${workspaceId}/e/${elementId}/parts/${partId}/massProperties`
    );
    return response.data;
  }

  /**
   * Search for documents
   */
  async searchDocuments(query: string, limit: number = 20): Promise<OnShapeDocument[]> {
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
  async getDocumentMetadata(documentId: string): Promise<any> {
    const response = await this.axiosInstance.get(`/metadata/d/${documentId}`);
    return response.data;
  }

  /**
   * Get element metadata
   */
  async getElementMetadata(
    documentId: string, 
    workspaceId: string, 
    elementId: string
  ): Promise<any> {
    const response = await this.axiosInstance.get(
      `/metadata/d/${documentId}/w/${workspaceId}/e/${elementId}`
    );
    return response.data;
  }
}