import axios from "axios";
import type { AxiosInstance } from "axios";
import { oauthConfig } from "../config/oauth.ts";
import { EventEmitter } from "events";

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
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/json",
        "Content-Type": "application/json",
      },
    });

    this.axiosInstance.interceptors.response.use(
      (response) => response,
      (error) => {
        console.error("OnShape API Error:", {
          status: error.response?.status,
          data: error.response?.data,
          url: error.config?.url,
        });
        throw error;
      }
    );
  }

  async getCurrentUser(): Promise<OnShapeUser> {
    const response = await this.axiosInstance.get("/users/sessioninfo");
    return response.data;
  }

  async getDocuments(
    limit: number = 20,
    offset: number = 0
  ): Promise<OnShapeDocument[]> {
    const response = await this.axiosInstance.get("/documents", {
      params: {
        limit,
        offset,
        sortColumn: "modifiedAt",
        sortOrder: "desc",
      },
    });
    return response.data.items || [];
  }

  async getDocument(documentId: string): Promise<OnShapeDocumentInfo> {
    const response = await this.axiosInstance.get(`/documents/${documentId}`);
    return response.data;
  }

  async getComprehensiveDocument(
    documentId: string,
    params: any
  ): Promise<any> {
    const doc = await this.getDocument(documentId);
    const result: any = { ...doc };

    if (doc.defaultWorkspace?.id && params.includeElements === "true") {
      result.elements = await this.getElements(
        documentId,
        doc.defaultWorkspace.id
      );

      if (
        params.includeParts === "true" ||
        params.includeAssemblies === "true"
      ) {
        for (const element of result.elements) {
          if (params.includeParts === "true") {
            element.parts = await this.getParts(
              documentId,
              doc.defaultWorkspace.id,
              element.id
            );
          }
          if (params.includeAssemblies === "true") {
            element.assemblies = await this.getAssemblies(
              documentId,
              doc.defaultWorkspace.id,
              element.id
            );
          }
        }
      }
    }

    return result;
  }

  async getParentInfo(documentId: string): Promise<any> {
    const response = await this.axiosInstance.get(
      `/documents/${documentId}/parent`
    );
    return response.data;
  }

  async getElements(
    documentId: string,
    workspaceId: string
  ): Promise<OnShapeDocumentElement[]> {
    return this.getDocumentElements(documentId, workspaceId);
  }

  async getDocumentElements(
    documentId: string,
    workspaceId: string
  ): Promise<OnShapeDocumentElement[]> {
    const response = await this.axiosInstance.get(
      `/documents/d/${documentId}/w/${workspaceId}/elements`
    );
    return response.data || [];
  }

  async getParts(
    documentId: string,
    workspaceId: string,
    elementId: string
  ): Promise<any[]> {
    const response = await this.axiosInstance.get(
      `/documents/d/${documentId}/w/${workspaceId}/e/${elementId}/parts`
    );
    return response.data || [];
  }

  async getAssemblies(
    documentId: string,
    workspaceId: string,
    elementId: string
  ): Promise<any[]> {
    const response = await this.axiosInstance.get(
      `/documents/d/${documentId}/w/${workspaceId}/e/${elementId}/assemblies`
    );
    return response.data || [];
  }

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

  async searchDocuments(
    query: string,
    limit: number = 20
  ): Promise<OnShapeDocument[]> {
    const response = await this.axiosInstance.get("/documents", {
      params: {
        q: query,
        limit,
        sortColumn: "modifiedAt",
        sortOrder: "desc",
      },
    });
    return response.data.items || [];
  }

  async getDocumentMetadata(documentId: string): Promise<any> {
    const response = await this.axiosInstance.get(`/metadata/d/${documentId}`);
    return response.data;
  }

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

  async exportAll(options: any, ids?: string[]): Promise<any> {
    // First get the list of documents or use provided IDs
    let documentsToExport: OnShapeDocumentInfo[];

    if (ids && ids.length > 0) {
      // Fetch full document info for specific IDs
      documentsToExport = await Promise.all(
        ids.map((id) => this.getDocument(id))
      );
    } else {
      // Get list of all documents, then fetch full info for each
      const documentList = await this.getDocuments(100, 0);
      documentsToExport = await Promise.all(
        documentList.map((doc) => this.getDocument(doc.id))
      );
    }

    const result: any = {
      documents: [],
      exportInfo: {
        totalDocuments: documentsToExport.length,
        processedDocuments: 0,
        exportDate: new Date().toISOString(),
      },
    };

    for (const doc of documentsToExport) {
      const docData: any = { ...doc };

      if (options.includeElements === "true" && doc.defaultWorkspace?.id) {
        docData.elements = await this.getElements(
          doc.id,
          doc.defaultWorkspace.id
        );
      }

      result.documents.push(docData);
      result.exportInfo.processedDocuments++;
    }

    return result;
  }

  async exportStream(options: any, ids?: string[]): Promise<EventEmitter> {
    const emitter = new EventEmitter();

    setTimeout(async () => {
      try {
        const data = await this.exportAll(options, ids);
        emitter.emit("data", data);
        emitter.emit("end");
      } catch (error) {
        emitter.emit("error", error);
      }
    }, 0);

    return emitter;
  }

  async fetchThumbnail(url: string): Promise<Buffer> {
    const response = await axios.get(url, {
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
      },
      responseType: "arraybuffer",
    });
    return Buffer.from(response.data);
  }
}
