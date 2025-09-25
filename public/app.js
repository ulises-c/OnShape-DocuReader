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
    this.exportModalEventsBound = false;
    this.progressModalEventsBound = false;

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
    document
      .getElementById("getAllBtn")
      .addEventListener("click", this.handleGetAll.bind(this));
    document
      .getElementById("getSelectedBtn")
      .addEventListener("click", this.handleGetSelected.bind(this));
    document
      .getElementById("getDocumentBtn")
      .addEventListener("click", this.handleGetDocument.bind(this));

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

    // Table header
    let html = `<table class="doc-details-table">
      <thead>
        <tr>
          <th class="select-column"><input type="checkbox" id="selectAll" title="Select All"></th>
          <th>Name</th>
          <th>Creator</th>
          <th>Date Created</th>
          <th>Date Modified</th>
          <th>Last Modified By</th>
          <th>Parent</th>
          <th>Type</th>
        </tr>
      </thead>
      <tbody>`;

    documents.forEach((doc) => {
      const creator = doc.creator?.name || "Unknown Creator";
      const created = doc.createdAt
        ? new Date(doc.createdAt).toLocaleString()
        : "-";
      const modified = doc.modifiedAt
        ? new Date(doc.modifiedAt).toLocaleString()
        : "-";
      const lastModifiedBy = doc.modifiedBy?.name || doc.modifiedBy || "-";
      // Try to get parent name from various possible fields
      const parent =
        doc.parentName ||
        doc.parent?.name ||
        (doc.parentId ? `Parent ID: ${doc.parentId}` : "-");
      const type = doc.type || "Document";
      html += `
        <tr class="document-card" data-id="${doc.id}">
          <td class="select-column"><input type="checkbox" class="doc-checkbox" value="${
            doc.id
          }"></td>
          <td class="doc-file-title">${this.escapeHtml(doc.name)}</td>
          <td>${this.escapeHtml(creator)}</td>
          <td>${created}</td>
          <td>${modified}</td>
          <td>${this.escapeHtml(lastModifiedBy)}</td>
          <td>${this.escapeHtml(parent)}</td>
          <td>${this.escapeHtml(type)}</td>
        </tr>
      `;
    });

    html += "</tbody></table>";
    gridEl.innerHTML = html;

    // Set up checkbox event handlers
    this.setupCheckboxEvents();
  }

  setupCheckboxEvents() {
    const selectAllCheckbox = document.getElementById("selectAll");
    const docCheckboxes = document.querySelectorAll(".doc-checkbox");

    // Handle "Select All" checkbox
    if (selectAllCheckbox) {
      selectAllCheckbox.addEventListener("change", (e) => {
        const isChecked = e.target.checked;
        docCheckboxes.forEach((checkbox) => {
          checkbox.checked = isChecked;
        });
        this.updateGetSelectedButtonState();
      });
    }

    // Handle individual checkboxes
    docCheckboxes.forEach((checkbox) => {
      checkbox.addEventListener("change", () => {
        // Update "Select All" checkbox state based on individual checkboxes
        if (selectAllCheckbox) {
          const checkedCount = document.querySelectorAll(
            ".doc-checkbox:checked"
          ).length;
          const totalCount = docCheckboxes.length;

          selectAllCheckbox.checked = checkedCount === totalCount;
          selectAllCheckbox.indeterminate =
            checkedCount > 0 && checkedCount < totalCount;
        }
        this.updateGetSelectedButtonState();
      });
    });

    // Initialize button state
    this.updateGetSelectedButtonState();
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
          doc.creator.name.toLowerCase().includes(query.toLowerCase())
      );

      loadingEl.style.display = "none";
      this.renderDocuments(filtered);
    } catch (error) {
      console.error("Search error:", error);
      loadingEl.style.display = "none";
      this.showError("Search failed: " + error.message);
    }
  }

  async handleGetAll() {
    console.log("Get All button clicked");
    this.showExportModal();
  }

  async handleGetSelected() {
    console.log("Get Selected button clicked");

    const selectedDocuments = this.getSelectedDocuments();

    if (selectedDocuments.length === 0) {
      this.showError(
        "No documents selected. Please select at least one document."
      );
      return;
    }

    console.log(`Processing ${selectedDocuments.length} selected document(s)`);
    this.showExportModal(selectedDocuments);
  }

  getSelectedDocuments() {
    const selectedCheckboxes = document.querySelectorAll(
      ".doc-checkbox:checked"
    );
    const selectedDocuments = [];

    selectedCheckboxes.forEach((checkbox) => {
      const documentId = checkbox.value;
      const document = this.documents.find((doc) => doc.id === documentId);
      if (document) {
        selectedDocuments.push(document);
      }
    });

    return selectedDocuments;
  }

  updateGetSelectedButtonState() {
    const getSelectedBtn = document.getElementById("getSelectedBtn");
    const checkedCount = document.querySelectorAll(
      ".doc-checkbox:checked"
    ).length;

    if (getSelectedBtn) {
      getSelectedBtn.disabled = checkedCount === 0;
      getSelectedBtn.textContent =
        checkedCount > 0
          ? `📋 Get Selected (${checkedCount})`
          : "📋 Get Selected";
    }
  }

  async handleGetDocument() {
    console.log("Get Document button clicked");

    if (!this.currentDocument) {
      this.showError("No document selected");
      return;
    }

    try {
      // Show loading state
      const button = document.getElementById("getDocumentBtn");
      const originalText = button.textContent;
      button.textContent = "⏳ Processing...";
      button.disabled = true;

      // Make API call to get comprehensive document data
      const response = await fetch(
        `/api/documents/${this.currentDocument.id}/comprehensive?includeElements=true&includeParts=true&includeAssemblies=true&includeMetadata=true`
      );

      if (!response.ok) {
        throw new Error(
          `Failed to get comprehensive document data: ${response.statusText}`
        );
      }

      const comprehensiveData = await response.json();

      // Create and download the data as JSON
      this.downloadComprehensiveData(
        comprehensiveData,
        this.currentDocument.name
      );

      // Show success message
      this.showSuccess(
        `Successfully downloaded comprehensive data for "${this.currentDocument.name}"`
      );
    } catch (error) {
      console.error("Error getting comprehensive document:", error);
      this.showError(
        "Failed to get comprehensive document data: " + error.message
      );
    } finally {
      // Reset button state
      const button = document.getElementById("getDocumentBtn");
      button.textContent = "📦 Get Document";
      button.disabled = false;
    }
  }

  downloadComprehensiveData(data, documentName) {
    const filename = `${documentName.replace(
      /[^a-z0-9]/gi,
      "_"
    )}_comprehensive.json`;
    const jsonString = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonString], { type: "application/json" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
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

  renderDocumentDetails(docData, elements) {
    document.getElementById("documentTitle").textContent = docData.name;

    // Render document info
    const infoEl = document.getElementById("documentInfo");
    const createdDate = this.formatDateWithUser(
      docData.createdAt,
      docData.createdBy || docData.creator
    );
    const modifiedDate = this.formatDateWithUser(
      docData.modifiedAt,
      docData.modifiedBy
    );

    // Generate thumbnail HTML
    let thumbnailHtml = "";
    console.log("Document thumbnail data:", docData.thumbnail);
    if (docData.thumbnail && Array.isArray(docData.thumbnail.sizes)) {
      // Find the best thumbnail size (prefer 300x300 or largest available)
      const preferredSizes = ["300x300", "600x340", "300x170", "70x40"];
      let selectedThumbnail = null;

      for (const preferredSize of preferredSizes) {
        selectedThumbnail = docData.thumbnail.sizes.find(
          (t) => t.size === preferredSize
        );
        if (selectedThumbnail) break;
      }

      // Fallback to first available thumbnail if none of the preferred sizes exist
      if (!selectedThumbnail && docData.thumbnail.sizes.length > 0) {
        selectedThumbnail = docData.thumbnail.sizes[0];
      }

      if (selectedThumbnail && selectedThumbnail.href) {
        console.log("Selected thumbnail:", selectedThumbnail);
        // Create a proxy URL through our backend to handle authentication
        const proxyUrl = `/api/thumbnail-proxy?url=${encodeURIComponent(
          selectedThumbnail.href
        )}`;
        console.log("Using proxy URL:", proxyUrl);

        thumbnailHtml = `
          <div class="info-item">
            <div class="info-label">Thumbnail</div>
            <div class="info-value thumbnail-container">
              <div id="thumbnail-placeholder-${docData.id}" style="width: 300px; height: 200px; background: #f8f9fa; border: 2px dashed #ddd; border-radius: 8px; display: flex; align-items: center; justify-content: center; flex-direction: column; color: #666; font-style: italic;">
                <div>📷</div>
                <div style="margin-top: 0.5rem;">Loading thumbnail...</div>
              </div>
              <img id="document-thumbnail-img-${docData.id}" 
                   src="${proxyUrl}" 
                   alt="Document thumbnail" 
                   class="document-thumbnail"
                   data-original-url="${selectedThumbnail.href}"
                   data-proxy-url="${proxyUrl}"
                   data-doc-id="${docData.id}"
                   style="max-width: 300px; max-height: 200px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); cursor: pointer; display: none;" />
              <div class="thumbnail-info" style="margin-top: 0.5rem; font-size: 0.9rem; color: #666;">
                Size: ${selectedThumbnail.size} | Click to view original
              </div>
            </div>
          </div>
        `;

        // Set up event listeners after the HTML is inserted
        setTimeout(() => {
          this.setupThumbnailEventListeners(
            docData.id,
            selectedThumbnail.href,
            proxyUrl
          );
        }, 0);
      } else {
        console.log(
          "No valid thumbnail found. Available thumbnails:",
          docData.thumbnail?.sizes
        );
      }
    }

    infoEl.innerHTML = `
      ${thumbnailHtml}
      <div class="info-item">
        <div class="info-label">Name</div>
        <div class="info-value">${this.escapeHtml(docData.name)}</div>
      </div>
      <div class="info-item">
        <div class="info-label">Description</div>
        <div class="info-value">${this.escapeHtml(
          docData.description || "No description"
        )}</div>
      </div>
      <div class="info-item">
        <div class="info-label">Notes</div>
        <div class="info-value">${this.escapeHtml(
          docData.notes || "No notes"
        )}</div>
      </div>
      <div class="info-item">
        <div class="info-label">Tags</div>
        <div class="info-value">${
          docData.tags && Array.isArray(docData.tags) && docData.tags.length > 0
            ? docData.tags
                .map(
                  (tag) =>
                    `<span class="tag-badge">${this.escapeHtml(tag)}</span>`
                )
                .join(" ")
            : "No tags"
        }</div>
      </div>
      <div class="info-item">
        <div class="info-label">Document Labels</div>
        <div class="info-value">${
          docData.documentLabels &&
          Array.isArray(docData.documentLabels) &&
          docData.documentLabels.length > 0
            ? docData.documentLabels
                .map(
                  (label) =>
                    `<span class="label-badge">${this.escapeHtml(
                      typeof label === "string"
                        ? label
                        : label.name || JSON.stringify(label)
                    )}</span>`
                )
                .join(" ")
            : "No document labels"
        }</div>
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
        <div class="info-value">${docData.isPublic ? "Public" : "Private"}</div>
      </div>
      <div class="info-item">
        <div class="info-label">Parent/Hierarchy</div>
        <div class="info-value" id="parent-hierarchy-${docData.id}">
          ${
            docData.parentId
              ? `Parent ID: ${docData.parentId}`
              : "No parent information"
          }
          <div style="margin-top: 0.5rem;">
            <button id="load-hierarchy-${
              docData.id
            }" class="btn load-hierarchy-btn" data-doc-id="${
      docData.id
    }" style="padding: 0.25rem 0.5rem; font-size: 0.8rem; background: #f0f0f0; border: 1px solid #ddd;">
              🔍 Load Hierarchy Details
            </button>
          </div>
        </div>
      </div>
      <div class="info-item">
        <div class="info-label">Raw JSON</div>
        <div style="margin-bottom: 0.5rem;">
          <button id="copy-json-${
            docData.id
          }" class="btn copy-json-btn" data-doc-id="${
      docData.id
    }" style="padding: 0.25rem 0.5rem; font-size: 0.8rem; background: #007bff; color: white; border: 1px solid #0056b3; border-radius: 4px; cursor: pointer;">
            📋 Copy Raw JSON
          </button>
        </div>
        <pre id="raw-json-${
          docData.id
        }" class="info-value" style="background:#f8f9fa; border-radius:6px; padding:1em; font-size:0.95em; max-height:400px; overflow:auto;">${this.escapeHtml(
      JSON.stringify(docData, null, 2)
    )}</pre>
      </div>
    `;

    // Render elements
    const elementsEl = document.getElementById("documentElements");
    if (elements && elements.length > 0) {
      elementsEl.innerHTML = elements
        .map(
          (element) => `
                <div class="element-container" style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 1rem; padding: 1rem; border: 1px solid #ddd; border-radius: 8px; background: #f8f9fa;">
                    <div class="element-item" data-element-id="${
                      element.id
                    }" style="flex-grow: 1; cursor: pointer;">
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
                    <div class="element-actions" style="margin-left: 1rem; flex-shrink: 0;">
                        <button class="btn copy-element-json-btn" data-element-id="${
                          element.id
                        }" data-element-data='${JSON.stringify(element).replace(
            /'/g,
            "&apos;"
          )}' style="padding: 0.25rem 0.5rem; font-size: 0.8rem; background: #007bff; color: white; border: 1px solid #0056b3; border-radius: 4px; cursor: pointer;">
                            📋 Copy Raw JSON
                        </button>
                    </div>
                </div>
            `
        )
        .join("");
    } else {
      elementsEl.innerHTML =
        '<p style="color: #666; font-style: italic;">No elements found or unable to load elements.</p>';
    }

    // Set up hierarchy button event listener after DOM is updated
    setTimeout(() => {
      const hierarchyBtn = document.getElementById(
        `load-hierarchy-${docData.id}`
      );
      if (hierarchyBtn) {
        hierarchyBtn.addEventListener("click", () => {
          this.loadParentHierarchy(docData.id);
        });
      }
    }, 0);
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
      // Don't handle clicks on checkboxes or their labels
      if (e.target.type === "checkbox" || e.target.closest(".select-column")) {
        return;
      }

      // Handle document card clicks (table rows)
      const documentCard = e.target.closest(".document-card");
      if (documentCard) {
        // Try both data-document-id and data-id for compatibility
        const documentId =
          documentCard.getAttribute("data-document-id") ||
          documentCard.getAttribute("data-id");
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

      // Handle copy raw JSON button clicks
      const copyJsonBtn = e.target.closest(".copy-json-btn");
      if (copyJsonBtn) {
        const docId = copyJsonBtn.getAttribute("data-doc-id");
        if (docId) {
          this.copyRawJson(docId);
          return;
        }
      }

      // Handle copy element JSON button clicks
      const copyElementJsonBtn = e.target.closest(".copy-element-json-btn");
      if (copyElementJsonBtn) {
        const elementData =
          copyElementJsonBtn.getAttribute("data-element-data");
        if (elementData) {
          this.copyElementRawJson(elementData);
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

  showSuccess(message) {
    // Create a temporary success message element
    const successEl = document.createElement("div");
    successEl.className = "success-message";
    successEl.textContent = message;
    successEl.style.cssText = `
      background-color: #d4edda;
      border: 1px solid #c3e6cb;
      color: #155724;
      padding: 12px 20px;
      border-radius: 5px;
      margin: 10px 0;
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 1000;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
      animation: slideIn 0.3s ease-out;
    `;

    document.body.appendChild(successEl);

    // Remove after 4 seconds
    setTimeout(() => {
      if (successEl.parentNode) {
        successEl.parentNode.removeChild(successEl);
      }
    }, 4000);
  }

  // Export Modal Methods
  showExportModal(selectedDocuments = null) {
    const modal = document.getElementById("exportModal");
    if (!modal) {
      console.error("Export modal not found");
      return;
    }

    // Store the selected documents for use in export process
    this.exportDocuments = selectedDocuments || this.documents;

    modal.style.display = "block";

    // Update estimated counts
    this.updateExportEstimates();

    // Bind modal events only once
    if (!this.exportModalEventsBound) {
      this.bindExportModalEvents();
      this.exportModalEventsBound = true;
    }
  }

  hideExportModal() {
    const modal = document.getElementById("exportModal");
    modal.style.display = "none";
  }

  bindExportModalEvents() {
    try {
      // Close modal events
      const closeBtn = document.getElementById("exportModalClose");
      const cancelBtn = document.getElementById("cancelExport");
      const modal = document.getElementById("exportModal");
      const startBtn = document.getElementById("startExport");

      if (closeBtn) {
        closeBtn.addEventListener("click", () => {
          this.hideExportModal();
        });
      }

      if (cancelBtn) {
        cancelBtn.addEventListener("click", () => {
          this.hideExportModal();
        });
      }

      // Click outside to close
      if (modal) {
        modal.addEventListener("click", (e) => {
          if (e.target.id === "exportModal") {
            this.hideExportModal();
          }
        });
      }

      // Start export
      if (startBtn) {
        startBtn.addEventListener("click", () => {
          this.startAdvancedExport();
        });
      }

      // Update estimates when options change
      const inputs = document.querySelectorAll(
        '#exportModal input[type="checkbox"], #exportModal input[type="radio"], #exportModal select'
      );
      inputs.forEach((input) => {
        input.addEventListener("change", () => {
          this.updateExportEstimates();
        });
      });
    } catch (error) {
      console.error("Error binding export modal events:", error);
    }
  }

  updateExportEstimates() {
    try {
      const documentsCount = (this.exportDocuments || this.documents).length;
      const requestsPerMinInput = document.getElementById("requestsPerMinute");

      if (!requestsPerMinInput) {
        console.warn("Requests per minute input not found");
        return;
      }

      const requestsPerMin = parseInt(requestsPerMinInput.value) || 30;

      // Estimate API calls based on selected options
      let estimatedCalls = documentsCount; // Basic document info

      const exportElements = document.getElementById("exportElements");
      const exportParts = document.getElementById("exportParts");
      const exportAssemblies = document.getElementById("exportAssemblies");
      const exportMassProperties = document.getElementById(
        "exportMassProperties"
      );
      const exportMetadata = document.getElementById("exportMetadata");

      if (exportElements && exportElements.checked) {
        estimatedCalls += documentsCount; // Elements per document
      }
      if (exportParts && exportParts.checked) {
        estimatedCalls += documentsCount * 2; // Estimate 2 parts calls per doc
      }
      if (exportAssemblies && exportAssemblies.checked) {
        estimatedCalls += documentsCount * 1; // Estimate 1 assembly call per doc
      }
      if (exportMassProperties && exportMassProperties.checked) {
        estimatedCalls += documentsCount * 2; // Mass properties calls
      }
      if (exportMetadata && exportMetadata.checked) {
        estimatedCalls += documentsCount * 1; // Metadata calls
      }

      const estimatedMinutes = Math.ceil(estimatedCalls / requestsPerMin);

      const countEl = document.getElementById("estimatedCount");
      const timeEl = document.getElementById("estimatedTime");

      if (countEl) countEl.textContent = documentsCount;
      if (timeEl) timeEl.textContent = estimatedMinutes;
    } catch (error) {
      console.error("Error updating export estimates:", error);
    }
  }

  async startAdvancedExport() {
    console.log("Starting advanced export...");

    // Hide export modal and show progress modal
    this.hideExportModal();
    this.showProgressModal();

    try {
      const exportOptions = this.getExportOptions();
      await this.performAdvancedExport(exportOptions);
    } catch (error) {
      console.error("Advanced export error:", error);
      this.hideProgressModal();
      this.showError("Export failed: " + error.message);
    }
  }

  getExportOptions() {
    try {
      const options = {
        includeBasicInfo: true,
        includeElements: true,
        includeParts: false,
        includeAssemblies: false,
        includeMassProperties: false,
        includeMetadata: false,
        versionMode: "new",
        format: "json",
        requestsPerMinute: 30,
      };

      // Safely get checkbox values
      const basicInfoEl = document.getElementById("exportBasicInfo");
      const elementsEl = document.getElementById("exportElements");
      const partsEl = document.getElementById("exportParts");
      const assembliesEl = document.getElementById("exportAssemblies");
      const massPropsEl = document.getElementById("exportMassProperties");
      const metadataEl = document.getElementById("exportMetadata");
      const requestsEl = document.getElementById("requestsPerMinute");

      if (basicInfoEl) options.includeBasicInfo = basicInfoEl.checked;
      if (elementsEl) options.includeElements = elementsEl.checked;
      if (partsEl) options.includeParts = partsEl.checked;
      if (assembliesEl) options.includeAssemblies = assembliesEl.checked;
      if (massPropsEl) options.includeMassProperties = massPropsEl.checked;
      if (metadataEl) options.includeMetadata = metadataEl.checked;
      if (requestsEl)
        options.requestsPerMinute = parseInt(requestsEl.value) || 30;

      // Safely get radio button values
      const versionModeEl = document.querySelector(
        'input[name="versionMode"]:checked'
      );
      const formatEl = document.querySelector(
        'input[name="exportFormat"]:checked'
      );

      if (versionModeEl) options.versionMode = versionModeEl.value;
      if (formatEl) options.format = formatEl.value;

      return options;
    } catch (error) {
      console.error("Error getting export options:", error);
      // Return default options if there's an error
      return {
        includeBasicInfo: true,
        includeElements: true,
        includeParts: false,
        includeAssemblies: false,
        includeMassProperties: false,
        includeMetadata: false,
        versionMode: "new",
        format: "json",
        requestsPerMinute: 30,
      };
    }
  }

  showProgressModal() {
    try {
      const modal = document.getElementById("progressModal");
      if (!modal) {
        console.error("Progress modal not found");
        return;
      }

      modal.style.display = "block";

      if (!this.progressModalEventsBound) {
        this.bindProgressModalEvents();
        this.progressModalEventsBound = true;
      }
    } catch (error) {
      console.error("Error showing progress modal:", error);
    }
  }

  hideProgressModal() {
    try {
      const modal = document.getElementById("progressModal");
      if (modal) {
        modal.style.display = "none";
      }
    } catch (error) {
      console.error("Error hiding progress modal:", error);
    }
  }

  bindProgressModalEvents() {
    try {
      const cancelBtn = document.getElementById("cancelExportProgress");
      if (cancelBtn) {
        cancelBtn.addEventListener("click", () => {
          this.cancelExport();
        });
      }
    } catch (error) {
      console.error("Error binding progress modal events:", error);
    }
  }

  async performAdvancedExport(options) {
    console.log("Export options:", options);

    // Initialize progress
    const totalDocs = this.documents.length;

    try {
      const totalProgressEl = document.getElementById("totalProgress");
      const currentProgressEl = document.getElementById("currentProgress");

      if (totalProgressEl) totalProgressEl.textContent = totalDocs;
      if (currentProgressEl) currentProgressEl.textContent = 0;
    } catch (error) {
      console.error("Error initializing progress display:", error);
    }

    this.addToLog("🚀 Starting advanced export...");

    // Use streaming endpoint for better progress tracking
    await this.performStreamingExport(options);
  }

  async performStreamingExport(options) {
    try {
      // Build query parameters
      const params = new URLSearchParams();
      Object.entries(options).forEach(([key, value]) => {
        params.append(key, value.toString());
      });

      // Use the regular export endpoint first (which now actually processes documents)
      const response = await fetch(`/api/export/all?${params.toString()}`);

      if (!response.ok) {
        throw new Error(`Export failed: ${response.statusText}`);
      }

      // For now, show progress as one operation since the regular endpoint now processes everything
      this.updateCurrentTask("Processing all documents...");
      this.addToLog("📊 Processing documents...");

      // Simulate progress updates while waiting for response
      let progress = 0;
      const progressInterval = setInterval(() => {
        progress = Math.min(progress + 10, 90);
        this.updateProgress(progress, 100);
      }, 1000);

      const exportData = await response.json();

      clearInterval(progressInterval);

      // Update final progress
      this.updateProgress(
        exportData.exportInfo.processedDocuments,
        exportData.exportInfo.totalDocuments
      );

      this.addToLog(`✅ Export completed successfully!`);
      this.addToLog(
        `📊 Processed ${exportData.exportInfo.processedDocuments}/${exportData.exportInfo.totalDocuments} documents`
      );

      // Download the file
      await this.downloadExportFile(exportData, options.format);

      // Store export metadata for version comparison
      this.storeExportMetadata(exportData.exportInfo);

      setTimeout(() => {
        this.hideProgressModal();
        this.showSuccess(
          `Export completed! ${exportData.exportInfo.processedDocuments} documents processed.`
        );
      }, 2000);
    } catch (error) {
      console.error("Streaming export error:", error);
      this.addToLog(`❌ Export failed: ${error.message}`);
      throw error;
    }
  }

  async performStreamingExportWithSSE(options) {
    return new Promise((resolve, reject) => {
      // Build query parameters
      const params = new URLSearchParams();
      Object.entries(options).forEach(([key, value]) => {
        params.append(key, value.toString());
      });

      const eventSource = new EventSource(
        `/api/export/stream?${params.toString()}`
      );
      let exportData = null;

      eventSource.onmessage = (event) => {
        console.log("SSE message:", event.data);
      };

      eventSource.addEventListener("start", (event) => {
        const data = JSON.parse(event.data);
        this.addToLog(
          `🚀 Starting export with options: ${JSON.stringify(data.options)}`
        );
      });

      eventSource.addEventListener("documents-found", (event) => {
        const data = JSON.parse(event.data);
        this.addToLog(`📊 Found ${data.count} documents to process`);

        try {
          const totalProgressEl = document.getElementById("totalProgress");
          if (totalProgressEl) totalProgressEl.textContent = data.count;
        } catch (error) {
          console.error("Error updating total progress:", error);
        }
      });

      eventSource.addEventListener("progress", (event) => {
        const data = JSON.parse(event.data);
        this.updateCurrentTask(`Processing: ${data.documentName}`);
        this.updateProgress(data.current, data.total);
        this.addToLog(
          `📄 Processing ${data.current}/${data.total}: ${data.documentName}`
        );
      });

      eventSource.addEventListener("document-status", (event) => {
        const data = JSON.parse(event.data);
        this.addToLog(`  └ ${data.status}`);
      });

      eventSource.addEventListener("document-complete", (event) => {
        const data = JSON.parse(event.data);
        this.addToLog(
          `✅ Completed: ${data.documentName} (${data.processed}/${data.total})`
        );
      });

      eventSource.addEventListener("document-error", (event) => {
        const data = JSON.parse(event.data);
        this.addToLog(`❌ Error: ${data.documentName} - ${data.error}`);
      });

      eventSource.addEventListener("complete", (event) => {
        const data = JSON.parse(event.data);
        exportData = data.exportData;

        this.updateCurrentTask("Export completed!");
        this.addToLog("🎉 Export completed successfully!");

        eventSource.close();
        resolve(exportData);
      });

      eventSource.addEventListener("error", (event) => {
        const data = JSON.parse(event.data);
        this.addToLog(`❌ Export failed: ${data.error}`);
        eventSource.close();
        reject(new Error(data.error || "Export failed"));
      });

      eventSource.onerror = (error) => {
        console.error("SSE connection error:", error);
        this.addToLog("❌ Connection error during export");
        eventSource.close();
        reject(new Error("Connection error during export"));
      };
    });
  }

  async filterDocumentsByVersion(documents, versionMode) {
    if (versionMode === "all") {
      return documents;
    }

    // Get previous export metadata from localStorage
    const previousExports = this.getPreviousExportMetadata();

    if (!previousExports || versionMode === "missing") {
      // If no previous exports, treat all as new
      return documents;
    }

    // Compare modification dates for 'new' mode
    if (versionMode === "new") {
      return documents.filter((doc) => {
        const previousDoc = previousExports.find((prev) => prev.id === doc.id);
        if (!previousDoc) return true; // New document
        return new Date(doc.modifiedAt) > new Date(previousDoc.modifiedAt);
      });
    }

    return documents;
  }

  async exportSingleDocument(document, options) {
    const docData = {
      id: document.id,
      exportedAt: new Date().toISOString(),
    };

    if (options.includeBasicInfo) {
      docData.basicInfo = {
        name: document.name,
        creator: document.creator,
        createdAt: document.createdAt,
        modifiedAt: document.modifiedAt,
        isPublic: document.isPublic,
      };
    }

    if (
      options.includeElements ||
      options.includeParts ||
      options.includeAssemblies ||
      options.includeMassProperties ||
      options.includeMetadata
    ) {
      // Get detailed document info first
      const detailResponse = await fetch(`/api/documents/${document.id}`);
      if (detailResponse.ok) {
        const detailData = await detailResponse.json();

        if (options.includeElements) {
          docData.elements = await this.getDocumentElements(
            document.id,
            detailData
          );
        }

        // Add other data types based on options...
      }
    }

    return docData;
  }

  async getDocumentElements(documentId, documentDetail) {
    if (!documentDetail.defaultWorkspace) return [];

    const elementsResponse = await fetch(
      `/api/documents/${documentId}/workspaces/${documentDetail.defaultWorkspace.id}/elements`
    );

    if (elementsResponse.ok) {
      return await elementsResponse.json();
    }
    return [];
  }

  updateCurrentTask(task) {
    try {
      const taskEl = document.getElementById("currentTask");
      if (taskEl) {
        taskEl.textContent = task;
      }
    } catch (error) {
      console.error("Error updating current task:", error);
    }
  }

  updateProgress(current, total) {
    try {
      const percentage = total > 0 ? Math.round((current / total) * 100) : 0;

      const fillEl = document.getElementById("progressFill");
      const currentEl = document.getElementById("currentProgress");

      if (fillEl) fillEl.style.width = percentage + "%";
      if (currentEl) currentEl.textContent = current;
    } catch (error) {
      console.error("Error updating progress:", error);
    }
  }

  addToLog(message) {
    try {
      const logContainer = document.getElementById("exportLog");
      if (logContainer) {
        const logEntry = document.createElement("p");
        logEntry.textContent = `[${new Date().toLocaleTimeString()}] ${message}`;
        logContainer.appendChild(logEntry);
        logContainer.scrollTop = logContainer.scrollHeight;
      }
    } catch (error) {
      console.error("Error adding to log:", error);
    }
  }

  async downloadExportFile(data, format) {
    let blob;
    let filename;

    if (format === "zip") {
      // TODO: Implement ZIP export
      this.addToLog("⚠️ ZIP format not yet implemented, using JSON");
      blob = new Blob([JSON.stringify(data, null, 2)], {
        type: "application/json",
      });
      filename = `onshape-export-${new Date().getTime()}.json`;
    } else {
      blob = new Blob([JSON.stringify(data, null, 2)], {
        type: "application/json",
      });
      filename = `onshape-export-${new Date().getTime()}.json`;
    }

    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }

  storeExportMetadata(exportInfo) {
    const metadata = {
      timestamp: exportInfo.timestamp,
      documents: this.documents.map((doc) => ({
        id: doc.id,
        name: doc.name,
        modifiedAt: doc.modifiedAt,
      })),
    };

    localStorage.setItem("onshape-export-metadata", JSON.stringify(metadata));
  }

  getPreviousExportMetadata() {
    const stored = localStorage.getItem("onshape-export-metadata");
    return stored ? JSON.parse(stored).documents : null;
  }

  sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  cancelExport() {
    // TODO: Implement export cancellation
    this.hideProgressModal();
    this.showError("Export cancelled by user");
  }

  setupThumbnailEventListeners(docId, originalUrl, proxyUrl) {
    const thumbnailImg = document.getElementById(
      `document-thumbnail-img-${docId}`
    );
    const placeholder = document.getElementById(
      `thumbnail-placeholder-${docId}`
    );

    if (!thumbnailImg || !placeholder) {
      console.error("Thumbnail elements not found for doc:", docId);
      return;
    }

    // Handle successful load
    thumbnailImg.addEventListener("load", () => {
      thumbnailImg.style.display = "block";
      placeholder.style.display = "none";
      console.log("Thumbnail loaded successfully via:", thumbnailImg.src);
    });

    // Handle click to open full-size
    thumbnailImg.addEventListener("click", () => {
      window.open(originalUrl, "_blank");
    });

    // Handle error - try direct URL as fallback
    let hasTriedDirect = false;
    thumbnailImg.addEventListener("error", () => {
      if (!hasTriedDirect) {
        console.error("Proxy failed, trying direct URL:", originalUrl);
        thumbnailImg.src = originalUrl;
        hasTriedDirect = true;
      } else {
        // Both proxy and direct failed
        thumbnailImg.style.display = "none";
        placeholder.innerHTML = `
          <div>❌</div>
          <div style="margin-top: 0.5rem;">Thumbnail unavailable</div>
          <div style="font-size: 0.8rem; margin-top: 0.5rem;">Proxy: ${proxyUrl}</div>
          <div style="font-size: 0.8rem;">Direct: ${originalUrl}</div>
        `;
        console.error("Both proxy and direct URL failed");
      }
    });
  }

  async loadParentHierarchy(documentId) {
    const hierarchyEl = document.getElementById(
      `parent-hierarchy-${documentId}`
    );
    if (!hierarchyEl) return;

    hierarchyEl.innerHTML =
      '<div style="color: #666; font-style: italic;">Loading parent hierarchy...</div>';

    try {
      const response = await fetch(`/api/documents/${documentId}/parent`);
      if (response.ok) {
        const parentInfo = await response.json();
        console.log("Parent hierarchy info:", parentInfo);

        let hierarchyHtml = "";
        if (parentInfo && parentInfo.items && parentInfo.items.length > 0) {
          hierarchyHtml =
            '<div style="margin-bottom: 0.5rem;"><strong>Document Hierarchy:</strong></div>';
          parentInfo.items.forEach((item, index) => {
            const indent = "&nbsp;".repeat(index * 4);
            hierarchyHtml += `<div style="font-family: monospace; font-size: 0.9rem; margin: 0.25rem 0;">
              ${indent}${index > 0 ? "↳ " : ""}${this.escapeHtml(
              item.name || item.id
            )} 
              <span style="color: #666; font-size: 0.8rem;">(${
                item.resourceType || "unknown"
              })</span>
            </div>`;
          });
        } else {
          hierarchyHtml =
            '<div style="color: #666;">No parent hierarchy available</div>';
        }

        hierarchyEl.innerHTML = hierarchyHtml;
      } else {
        hierarchyEl.innerHTML =
          '<div style="color: #e74c3c;">Failed to load parent hierarchy</div>';
      }
    } catch (error) {
      console.error("Error loading parent hierarchy:", error);
      hierarchyEl.innerHTML =
        '<div style="color: #e74c3c;">Error loading parent hierarchy</div>';
    }
  }

  escapeHtml(text) {
    if (!text) return "";
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }

  formatDateWithUser(dateStr, userObj) {
    if (!dateStr) return "Unknown";

    try {
      const date = new Date(dateStr);
      const userName = userObj?.name || "Unknown User";

      // Format: 2024-Sep-16, 3:59:08 PM [John Smith]
      const options = {
        year: "numeric",
        month: "short",
        day: "2-digit",
        hour: "numeric",
        minute: "2-digit",
        second: "2-digit",
        hour12: true,
      };

      const formattedDate = date.toLocaleString("en-US", options);
      return `${formattedDate} [${userName}]`;
    } catch (error) {
      console.error("Error formatting date:", error);
      return `Invalid Date [${userObj?.name || "Unknown User"}]`;
    }
  }

  async copyRawJson(docId) {
    try {
      // Get the document data - if we're currently viewing this document, use cached data
      let docData;
      if (this.currentDocument && this.currentDocument.id === docId) {
        docData = this.currentDocument;
      } else {
        // If not cached, we'd need to fetch it, but for now we'll show an error
        this.showError("Document data not available for copying");
        return;
      }

      // Convert to JSON string with pretty formatting
      const jsonString = JSON.stringify(docData, null, 2);

      // Use the Clipboard API if available
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(jsonString);
        this.showSuccess("Raw JSON copied to clipboard!");
      } else {
        // Fallback for older browsers or non-HTTPS contexts
        const textArea = document.createElement("textarea");
        textArea.value = jsonString;
        textArea.style.position = "fixed";
        textArea.style.left = "-999999px";
        textArea.style.top = "-999999px";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();

        try {
          document.execCommand("copy");
          this.showSuccess("Raw JSON copied to clipboard!");
        } catch (err) {
          this.showError("Failed to copy to clipboard");
        } finally {
          document.body.removeChild(textArea);
        }
      }

      // Update button text temporarily to show feedback
      const button = document.getElementById(`copy-json-${docId}`);
      if (button) {
        const originalText = button.textContent;
        button.textContent = "✅ Copied!";
        button.style.background = "#28a745";

        setTimeout(() => {
          button.textContent = originalText;
          button.style.background = "#007bff";
        }, 2000);
      }
    } catch (error) {
      console.error("Error copying JSON:", error);
      this.showError("Failed to copy raw JSON: " + error.message);
    }
  }

  async copyElementRawJson(elementDataString) {
    try {
      // Parse the element data from the data attribute
      const elementData = JSON.parse(elementDataString.replace(/&apos;/g, "'"));

      // Try to fetch complete metadata for this element
      let completeElementData = { ...elementData };

      if (this.currentDocument && this.currentDocument.defaultWorkspace) {
        try {
          const metadataResponse = await fetch(
            `/api/documents/${this.currentDocument.id}/workspaces/${this.currentDocument.defaultWorkspace.id}/elements/${elementData.id}/metadata`
          );

          if (metadataResponse.ok) {
            const metadata = await metadataResponse.json();
            completeElementData.metadata = metadata;
          }
        } catch (metadataError) {
          console.warn("Could not fetch metadata for element:", metadataError);
          // Continue with basic element data if metadata fetch fails
        }
      }

      // Convert to JSON string with pretty formatting
      const jsonString = JSON.stringify(completeElementData, null, 2);

      // Use the Clipboard API if available
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(jsonString);
        this.showSuccess("Element raw JSON copied to clipboard!");
      } else {
        // Fallback for older browsers or non-HTTPS contexts
        const textArea = document.createElement("textarea");
        textArea.value = jsonString;
        textArea.style.position = "fixed";
        textArea.style.left = "-999999px";
        textArea.style.top = "-999999px";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();

        try {
          document.execCommand("copy");
          this.showSuccess("Element raw JSON copied to clipboard!");
        } catch (err) {
          this.showError("Failed to copy to clipboard");
        } finally {
          document.body.removeChild(textArea);
        }
      }

      // Show temporary success feedback on the button that was clicked
      const clickedButton = event.target.closest(".copy-element-json-btn");
      if (clickedButton) {
        const originalText = clickedButton.textContent;
        clickedButton.textContent = "✅ Copied!";
        clickedButton.style.background = "#28a745";

        setTimeout(() => {
          clickedButton.textContent = originalText;
          clickedButton.style.background = "#007bff";
        }, 2000);
      }
    } catch (error) {
      console.error("Error copying element JSON:", error);
      this.showError("Failed to copy element raw JSON: " + error.message);
    }
  }
}

// Check if we're on the dashboard page (after OAuth redirect)
if (window.location.pathname === "/dashboard") {
  // Replace the URL to remove the /dashboard path
  window.history.replaceState({}, "", "/");
}

// Initialize the app
const app = new OnShapeApp();
