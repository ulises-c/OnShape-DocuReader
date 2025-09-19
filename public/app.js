/**
 * OnShape DocuReader - Frontend JavaScript
 */

class OnShapeApp {
  constructor() {
    this.currentPage = "landing";
    this.documents = [];
    this.currentDocument = null;
    this.isAuthenticated = false;
    this.user = null;

    this.init();
  }

  init() {
    this.bindEvents();
    this.checkAuthStatus();
  }

  bindEvents() {
    // Auth buttons
    document
      .getElementById("loginBtn")
      .addEventListener("click", this.handleLogin.bind(this));
    document
      .getElementById("logoutBtn")
      .addEventListener("click", this.handleLogout.bind(this));

    // Navigation
    document
      .getElementById("backBtn")
      .addEventListener("click", () => this.showPage("dashboard"));

    // Document actions
    document
      .getElementById("refreshBtn")
      .addEventListener("click", this.loadDocuments.bind(this));
    document
      .getElementById("searchBtn")
      .addEventListener("click", this.handleSearch.bind(this));

    // Search input
    document.getElementById("searchInput").addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        this.handleSearch();
      }
    });
  }

  async checkAuthStatus() {
    try {
      const response = await fetch("/auth/status");
      const data = await response.json();

      this.isAuthenticated = data.authenticated;

      if (this.isAuthenticated) {
        document.getElementById("authStatus").textContent = "Authenticated ✓";
        document.getElementById("authStatus").style.color = "#28a745";
        this.loadUserInfo();
        this.showPage("dashboard");
      } else {
        document.getElementById("authStatus").textContent = "Not authenticated";
        document.getElementById("authStatus").style.color = "#dc3545";
        this.showPage("landing");
      }
    } catch (error) {
      console.error("Error checking auth status:", error);
      this.showError("Failed to check authentication status");
    }
  }

  handleLogin() {
    window.location.href = "/auth/login";
  }

  async handleLogout() {
    try {
      await fetch("/auth/logout", { method: "POST" });
      this.isAuthenticated = false;
      this.user = null;
      this.documents = [];
      this.showPage("landing");
      this.checkAuthStatus();
    } catch (error) {
      console.error("Logout error:", error);
      this.showError("Failed to logout");
    }
  }

  async loadUserInfo() {
    try {
      const response = await fetch("/api/user");
      if (response.ok) {
        this.user = await response.json();
        document.getElementById("userName").textContent =
          this.user.name || "Unknown User";
      }
    } catch (error) {
      console.error("Error loading user info:", error);
    }
  }

  async loadDocuments() {
    const loadingEl = document.getElementById("loading");
    const errorEl = document.getElementById("error");
    const gridEl = document.getElementById("documentsGrid");

    loadingEl.style.display = "block";
    errorEl.style.display = "none";
    gridEl.innerHTML = "";

    try {
      const response = await fetch("/api/documents");
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      this.documents = await response.json();
      loadingEl.style.display = "none";

      if (this.documents.length === 0) {
        gridEl.innerHTML =
          '<p style="text-align: center; color: #666; font-style: italic;">No documents found</p>';
        return;
      }

      this.renderDocuments(this.documents);
    } catch (error) {
      console.error("Error loading documents:", error);
      loadingEl.style.display = "none";
      this.showError("Failed to load documents: " + error.message);
    }
  }

  renderDocuments(documents) {
    const gridEl = document.getElementById("documentsGrid");

    if (documents.length === 0) {
      gridEl.innerHTML =
        '<p style="text-align: center; color: #666; font-style: italic;">No documents found</p>';
      return;
    }

    gridEl.innerHTML = documents
      .map((doc) => {
        const createdDate = new Date(doc.createdAt).toLocaleDateString();
        const modifiedDate = new Date(doc.modifiedAt).toLocaleDateString();

        return `
                <div class="document-card" onclick="app.viewDocument('${
                  doc.id
                }')">
                    <h3>${this.escapeHtml(doc.name)}</h3>
                    <div class="document-meta">
                        <div class="document-owner">
                            Owner: ${this.escapeHtml(
                              doc.owner?.name || "Unknown"
                            )}
                        </div>
                        <div class="document-dates">
                            <div>Created: ${createdDate}</div>
                            <div>Modified: ${modifiedDate}</div>
                        </div>
                        <div style="margin-top: 0.5rem;">
                            ${
                              doc.isPublic
                                ? '<span style="color: #28a745;">Public</span>'
                                : '<span style="color: #ffc107;">Private</span>'
                            }
                        </div>
                    </div>
                </div>
            `;
      })
      .join("");
  }

  async handleSearch() {
    const query = document.getElementById("searchInput").value.trim();

    if (!query) {
      this.loadDocuments();
      return;
    }

    const loadingEl = document.getElementById("loading");
    const errorEl = document.getElementById("error");
    const gridEl = document.getElementById("documentsGrid");

    loadingEl.style.display = "block";
    errorEl.style.display = "none";
    gridEl.innerHTML = "";

    try {
      // For now, filter locally. In a real app, you'd want server-side search
      const filtered = this.documents.filter(
        (doc) =>
          doc.name.toLowerCase().includes(query.toLowerCase()) ||
          doc.owner.name.toLowerCase().includes(query.toLowerCase())
      );

      loadingEl.style.display = "none";
      this.renderDocuments(filtered);
    } catch (error) {
      console.error("Search error:", error);
      loadingEl.style.display = "none";
      this.showError("Search failed: " + error.message);
    }
  }

  async viewDocument(documentId) {
    try {
      // Load document details
      const docResponse = await fetch(`/api/documents/${documentId}`);
      if (!docResponse.ok) {
        throw new Error("Failed to load document details");
      }

      this.currentDocument = await docResponse.json();

      // Load document elements
      let elements = [];
      if (this.currentDocument.defaultWorkspace) {
        try {
          const elementsResponse = await fetch(
            `/api/documents/${documentId}/workspaces/${this.currentDocument.defaultWorkspace.id}/elements`
          );
          if (elementsResponse.ok) {
            elements = await elementsResponse.json();
          }
        } catch (error) {
          console.warn("Could not load document elements:", error);
        }
      }

      this.renderDocumentDetails(this.currentDocument, elements);
      this.showPage("documentDetail");
    } catch (error) {
      console.error("Error viewing document:", error);
      this.showError("Failed to load document details: " + error.message);
    }
  }

  renderDocumentDetails(document, elements) {
    document.getElementById("documentTitle").textContent = document.name;

    // Render document info
    const infoEl = document.getElementById("documentInfo");
    const createdDate = new Date(document.createdAt).toLocaleString();
    const modifiedDate = new Date(document.modifiedAt).toLocaleString();

    infoEl.innerHTML = `
            <div class="info-item">
                <div class="info-label">Name</div>
                <div class="info-value">${this.escapeHtml(document.name)}</div>
            </div>
            <div class="info-item">
                <div class="info-label">Description</div>
                <div class="info-value">${this.escapeHtml(
                  document.description || "No description"
                )}</div>
            </div>
            <div class="info-item">
                <div class="info-label">Owner</div>
                <div class="info-value">${this.escapeHtml(
                  document.owner?.name || "Unknown"
                )}</div>
            </div>
            <div class="info-item">
                <div class="info-label">Created</div>
                <div class="info-value">${createdDate}</div>
            </div>
            <div class="info-item">
                <div class="info-label">Modified</div>
                <div class="info-value">${modifiedDate}</div>
            </div>
            <div class="info-item">
                <div class="info-label">Visibility</div>
                <div class="info-value">${
                  document.isPublic ? "Public" : "Private"
                }</div>
            </div>
        `;

    // Render elements
    const elementsEl = document.getElementById("documentElements");
    if (elements && elements.length > 0) {
      elementsEl.innerHTML = elements
        .map(
          (element) => `
                <div class="element-item">
                    <div class="element-name">${this.escapeHtml(
                      element.name
                    )}</div>
                    <div class="element-type">Type: ${this.escapeHtml(
                      element.type || "Unknown"
                    )}</div>
                    ${
                      element.elementType
                        ? `<div class="element-type">Element Type: ${this.escapeHtml(
                            element.elementType
                          )}</div>`
                        : ""
                    }
                </div>
            `
        )
        .join("");
    } else {
      elementsEl.innerHTML =
        '<p style="color: #666; font-style: italic;">No elements found or unable to load elements.</p>';
    }
  }

  showPage(pageId) {
    // Hide all pages
    const pages = document.querySelectorAll(".page");
    pages.forEach((page) => page.classList.remove("active"));

    // Show selected page
    document.getElementById(pageId).classList.add("active");
    this.currentPage = pageId;

    // Load data for specific pages
    if (pageId === "dashboard" && this.isAuthenticated) {
      this.loadDocuments();
    }
  }

  showError(message) {
    const errorEl = document.getElementById("error");
    errorEl.textContent = message;
    errorEl.style.display = "block";
  }

  escapeHtml(text) {
    if (!text) return "";
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }
}

// Check if we're on the dashboard page (after OAuth redirect)
if (window.location.pathname === "/dashboard") {
  // Replace the URL to remove the /dashboard path
  window.history.replaceState({}, "", "/");
}

// Initialize the app
const app = new OnShapeApp();
