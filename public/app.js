/**
 * OnShape DocuReader - Frontend JavaScript
 */

class OnShapeApp {
  constructor() {
    this.currentPage = "landing";
    this.documents = [];
    this.currentDocument = null;
    this.currentElement = null;
    this.currentPart = null;
    this.isAuthenticated = false;
    this.user = null;

    this.init();
  }

  init() {
    this.bindEvents();
    this.checkAuthStatus();
  }

  bindEvents() {
    // BUG: document.getElementById is not a function
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
    document
      .getElementById("backToDocBtn")
      .addEventListener("click", () => this.showPage("documentDetail"));
    document
      .getElementById("backToElementBtn")
      .addEventListener("click", () => this.showPage("elementDetail"));

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

    // Tab navigation
    this.bindTabEvents();

    // Document card click delegation
    this.bindDocumentCardEvents();
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

        console.log(
          "Rendering document card for:",
          doc.name,
          "with ID:",
          doc.id
        );

        return `
                <div class="document-card" data-document-id="${doc.id}">
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
    console.log("viewDocument called with documentId:", documentId);
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
                <div class="element-item" data-element-id="${element.id}">
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

  bindTabEvents() {
    // Tab button click handlers
    document.querySelectorAll(".tab-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const tabName = e.target.getAttribute("data-tab");
        this.switchTab(tabName);
      });
    });
  }

  bindDocumentCardEvents() {
    // Use event delegation for dynamically created elements
    document.addEventListener("click", (e) => {
      // Handle document card clicks
      const documentCard = e.target.closest(".document-card");
      if (documentCard) {
        const documentId = documentCard.getAttribute("data-document-id");
        if (documentId) {
          console.log("Document card clicked:", documentId);
          this.viewDocument(documentId);
          return;
        }
      }

      // Handle element item clicks
      const elementItem = e.target.closest(".element-item");
      if (elementItem) {
        const elementId = elementItem.getAttribute("data-element-id");
        if (elementId) {
          console.log("Element clicked:", elementId);
          this.viewElement(elementId);
          return;
        }
      }

      // Handle part item clicks
      const partItem = e.target.closest(".part-item");
      if (partItem) {
        const partId = partItem.getAttribute("data-part-id");
        if (partId) {
          console.log("Part clicked:", partId);
          this.viewPart(partId);
          return;
        }
      }
    });
  }

  switchTab(tabName) {
    // Remove active class from all tabs and panels
    document
      .querySelectorAll(".tab-btn")
      .forEach((btn) => btn.classList.remove("active"));
    document
      .querySelectorAll(".tab-panel")
      .forEach((panel) => panel.classList.remove("active"));

    // Add active class to selected tab and panel
    document.querySelector(`[data-tab="${tabName}"]`).classList.add("active");
    document.getElementById(`${tabName}-tab`).classList.add("active");
  }

  async viewElement(elementId) {
    if (!this.currentDocument || !this.currentDocument.defaultWorkspace) {
      this.showError("No document or workspace available");
      return;
    }

    try {
      const documentId = this.currentDocument.id;
      const workspaceId = this.currentDocument.defaultWorkspace.id;

      // Find the element in the current document's elements
      const elements = await this.loadDocumentElements(documentId, workspaceId);
      this.currentElement = elements.find((el) => el.id === elementId);

      if (!this.currentElement) {
        this.showError("Element not found");
        return;
      }

      // Load element details
      await this.loadElementDetails(documentId, workspaceId, elementId);

      // Render element details and show page
      this.renderElementDetails();
      this.showPage("elementDetail");
    } catch (error) {
      console.error("Error viewing element:", error);
      this.showError("Failed to load element details: " + error.message);
    }
  }

  async loadElementDetails(documentId, workspaceId, elementId) {
    try {
      // Load parts, assemblies, and metadata in parallel
      const [partsResponse, assembliesResponse, metadataResponse] =
        await Promise.allSettled([
          fetch(
            `/api/documents/${documentId}/workspaces/${workspaceId}/elements/${elementId}/parts`
          ),
          fetch(
            `/api/documents/${documentId}/workspaces/${workspaceId}/elements/${elementId}/assemblies`
          ),
          fetch(
            `/api/documents/${documentId}/workspaces/${workspaceId}/elements/${elementId}/metadata`
          ),
        ]);

      // Process parts
      this.currentElement.parts = [];
      if (partsResponse.status === "fulfilled" && partsResponse.value.ok) {
        this.currentElement.parts = await partsResponse.value.json();
      }

      // Process assemblies
      this.currentElement.assemblies = [];
      if (
        assembliesResponse.status === "fulfilled" &&
        assembliesResponse.value.ok
      ) {
        this.currentElement.assemblies = await assembliesResponse.value.json();
      }

      // Process metadata
      this.currentElement.metadata = {};
      if (
        metadataResponse.status === "fulfilled" &&
        metadataResponse.value.ok
      ) {
        this.currentElement.metadata = await metadataResponse.value.json();
      }
    } catch (error) {
      console.error("Error loading element details:", error);
      throw error;
    }
  }

  async loadDocumentElements(documentId, workspaceId) {
    try {
      const response = await fetch(
        `/api/documents/${documentId}/workspaces/${workspaceId}/elements`
      );
      if (!response.ok) {
        throw new Error("Failed to load document elements");
      }
      return await response.json();
    } catch (error) {
      console.error("Error loading document elements:", error);
      throw error;
    }
  }

  renderElementDetails() {
    if (!this.currentElement) return;

    // Set element title
    document.getElementById("elementTitle").textContent =
      this.currentElement.name;

    // Render element info
    const infoEl = document.getElementById("elementInfo");
    infoEl.innerHTML = `
      <div class="info-item">
        <div class="info-label">Name</div>
        <div class="info-value">${this.escapeHtml(
          this.currentElement.name
        )}</div>
      </div>
      <div class="info-item">
        <div class="info-label">Type</div>
        <div class="info-value">${this.escapeHtml(
          this.currentElement.type || "Unknown"
        )}</div>
      </div>
      <div class="info-item">
        <div class="info-label">Element Type</div>
        <div class="info-value">${this.escapeHtml(
          this.currentElement.elementType || "Unknown"
        )}</div>
      </div>
      <div class="info-item">
        <div class="info-label">ID</div>
        <div class="info-value" style="font-family: monospace;">${this.escapeHtml(
          this.currentElement.id
        )}</div>
      </div>
    `;

    // Render parts
    this.renderParts();

    // Render assemblies
    this.renderAssemblies();

    // Render metadata
    this.renderMetadata();
  }

  renderParts() {
    const partsEl = document.getElementById("elementParts");

    if (this.currentElement.parts && this.currentElement.parts.length > 0) {
      partsEl.innerHTML = this.currentElement.parts
        .map(
          (part) => `
        <div class="part-item" data-part-id="${part.partId}">
          <div class="part-name">${this.escapeHtml(
            part.name || "Unnamed Part"
          )}</div>
          <div class="part-id">ID: ${this.escapeHtml(part.partId)}</div>
          ${
            part.bodyType
              ? `<div class="element-type">Body Type: ${this.escapeHtml(
                  part.bodyType
                )}</div>`
              : ""
          }
        </div>
      `
        )
        .join("");
    } else {
      partsEl.innerHTML =
        '<div class="empty-state"><h3>No Parts Found</h3><p>This element contains no parts or they could not be loaded.</p></div>';
    }
  }

  renderAssemblies() {
    const assembliesEl = document.getElementById("elementAssemblies");

    if (
      this.currentElement.assemblies &&
      this.currentElement.assemblies.length > 0
    ) {
      assembliesEl.innerHTML = this.currentElement.assemblies
        .map(
          (assembly) => `
        <div class="assembly-item">
          <div class="assembly-name">${this.escapeHtml(
            assembly.name || "Unnamed Assembly"
          )}</div>
          <div class="assembly-id">ID: ${this.escapeHtml(assembly.id)}</div>
          ${
            assembly.type
              ? `<div class="element-type">Type: ${this.escapeHtml(
                  assembly.type
                )}</div>`
              : ""
          }
        </div>
      `
        )
        .join("");
    } else {
      assembliesEl.innerHTML =
        '<div class="empty-state"><h3>No Assemblies Found</h3><p>This element contains no assemblies or they could not be loaded.</p></div>';
    }
  }

  renderMetadata() {
    const metadataEl = document.getElementById("elementMetadata");

    if (
      this.currentElement.metadata &&
      Object.keys(this.currentElement.metadata).length > 0
    ) {
      const metadataItems = Object.entries(this.currentElement.metadata)
        .map(([key, value]) => {
          const displayValue =
            typeof value === "object"
              ? JSON.stringify(value, null, 2)
              : String(value);
          return `
          <div class="info-item">
            <div class="info-label">${this.escapeHtml(key)}</div>
            <div class="info-value">${this.escapeHtml(displayValue)}</div>
          </div>
        `;
        })
        .join("");

      metadataEl.innerHTML = metadataItems;
    } else {
      metadataEl.innerHTML =
        '<div class="empty-state"><h3>No Metadata Available</h3><p>No metadata found for this element.</p></div>';
    }
  }

  async viewPart(partId) {
    if (!this.currentDocument || !this.currentElement) {
      this.showError("No document or element available");
      return;
    }

    try {
      const documentId = this.currentDocument.id;
      const workspaceId = this.currentDocument.defaultWorkspace.id;
      const elementId = this.currentElement.id;

      // Find the part in the current element's parts
      this.currentPart = this.currentElement.parts.find(
        (part) => part.partId === partId
      );

      if (!this.currentPart) {
        this.showError("Part not found");
        return;
      }

      // Load mass properties
      const massPropsResponse = await fetch(
        `/api/documents/${documentId}/workspaces/${workspaceId}/elements/${elementId}/parts/${partId}/mass-properties`
      );

      if (massPropsResponse.ok) {
        this.currentPart.massProperties = await massPropsResponse.json();
      }

      // Render part details and show page
      this.renderPartDetails();
      this.showPage("partDetail");
    } catch (error) {
      console.error("Error viewing part:", error);
      this.showError("Failed to load part details: " + error.message);
    }
  }

  renderPartDetails() {
    if (!this.currentPart) return;

    // Set part title
    document.getElementById("partTitle").textContent =
      this.currentPart.name || "Unnamed Part";

    // Render part info
    const infoEl = document.getElementById("partInfo");
    infoEl.innerHTML = `
      <div class="info-item">
        <div class="info-label">Name</div>
        <div class="info-value">${this.escapeHtml(
          this.currentPart.name || "Unnamed Part"
        )}</div>
      </div>
      <div class="info-item">
        <div class="info-label">Part ID</div>
        <div class="info-value" style="font-family: monospace;">${this.escapeHtml(
          this.currentPart.partId
        )}</div>
      </div>
      ${
        this.currentPart.bodyType
          ? `
      <div class="info-item">
        <div class="info-label">Body Type</div>
        <div class="info-value">${this.escapeHtml(
          this.currentPart.bodyType
        )}</div>
      </div>
      `
          : ""
      }
      ${
        this.currentPart.state
          ? `
      <div class="info-item">
        <div class="info-label">State</div>
        <div class="info-value">${this.escapeHtml(this.currentPart.state)}</div>
      </div>
      `
          : ""
      }
    `;

    // Render mass properties
    this.renderMassProperties();
  }

  renderMassProperties() {
    const massPropsEl = document.getElementById("partMassProperties");

    if (this.currentPart.massProperties) {
      const props = this.currentPart.massProperties;
      const massItems = [];

      if (props.bodies && props.bodies.length > 0) {
        const body = props.bodies[0]; // Use first body

        if (body.mass !== undefined) {
          massItems.push({
            label: "Mass",
            value: `${body.mass[0]} ${props.units?.mass || "kg"}`,
          });
        }
        if (body.volume !== undefined) {
          massItems.push({
            label: "Volume",
            value: `${body.volume[0]} ${props.units?.volume || "m³"}`,
          });
        }
        if (body.centroid) {
          massItems.push({
            label: "Centroid (X, Y, Z)",
            value: `(${body.centroid[0].toFixed(6)}, ${body.centroid[1].toFixed(
              6
            )}, ${body.centroid[2].toFixed(6)})`,
          });
        }
        if (body.inertia) {
          massItems.push({
            label: "Moment of Inertia",
            value: `[${body.inertia.map((val) => val.toFixed(6)).join(", ")}]`,
          });
        }
      }

      if (massItems.length > 0) {
        massPropsEl.innerHTML = massItems
          .map(
            (item) => `
          <div class="mass-property-item">
            <div class="mass-property-label">${this.escapeHtml(
              item.label
            )}</div>
            <div class="mass-property-value">${this.escapeHtml(
              item.value
            )}</div>
          </div>
        `
          )
          .join("");
      } else {
        massPropsEl.innerHTML =
          '<div class="empty-state"><h3>No Mass Properties</h3><p>No mass properties data available for this part.</p></div>';
      }
    } else {
      massPropsEl.innerHTML =
        '<div class="empty-state"><h3>Loading Mass Properties...</h3><p>Mass properties could not be loaded for this part.</p></div>';
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
