export class AppController {
  constructor(state, services, navigation, controllers) {
    this.state = state;
    this.authService = services.authService;
    this.navigation = navigation;
    this.documentController = controllers.documentController;
    this._logoutInProgress = false;
  }

  async init() {
    console.log('AppController.init() - Starting initialization');
    
    // Bind global event handlers first
    this.bindGlobalEvents();

    // Check authentication status with proper error handling
    try {
      const status = await this.authService.checkStatus();
      console.log('Auth status result:', status);

      this.state.setState({
        isAuthenticated: !!status.authenticated,
      });

      // If authenticated, proceed to load documents
      if (status.authenticated) {
        console.log('User is authenticated, loading documents...');
        
        // Fetch user info and update state
        try {
          const user = await this.authService.getUser();
          console.log('User info loaded:', user);
          this.state.setState({ user });
        } catch (userError) {
          console.warn('Failed to fetch user info:', userError);
        }
        
        await this.documentController.loadDocuments();
        
        const currentHash = window.location.hash;
        // Router will handle navigation, but ensure we have a valid default route
        if (!currentHash || currentHash === '#/' || currentHash === '#/landing') {
          console.log('No active route, router will set default to documents list');
          // Router's default route logic in app.js will handle this
        } else {
          console.log('Active route detected, staying on current page:', currentHash);
        }
      } else {
        console.log('User is not authenticated, showing landing page');
        const currentHash = window.location.hash;
        // Redirect to landing if on a protected route
        if (currentHash && currentHash !== '#/' && currentHash !== '#/landing') {
          console.log('Not authenticated but on protected route, redirecting to landing');
          window.location.hash = '#/';
        }
        this.navigation.navigateTo('landing');
      }
    } catch (error) {
      console.error('Failed to check auth status:', error);
      this.state.setState({ isAuthenticated: false });
      window.location.hash = '#/';
      this.navigation.navigateTo('landing');
    }
  }

  bindGlobalEvents() {
    // Login button
    const loginBtn = document.getElementById('loginBtn');
    if (loginBtn) {
      loginBtn.addEventListener('click', () => {
        console.log('Login button clicked');
        this.authService.login();
      });
    }

    // Logout button
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', async () => {
        console.log('Logout button clicked');
        if (this._logoutInProgress) {
          console.log('Logout already in progress, ignoring click');
          return;
        }
        this._logoutInProgress = true;
        await this.authService.logout();
        // State will be updated via auth:logout event
      });
    }

    // Listen for logout event from auth service
    window.addEventListener('auth:logout', () => {
      console.log('Received auth:logout event');
      this.state.setState({ 
        isAuthenticated: false,
        user: null,
        documents: [],
        selectedDocuments: [],
        currentDocument: null,
        currentElement: null,
        currentPart: null
      });
      this.navigation.navigateTo('landing');
      this._logoutInProgress = false;
    });

    // Listen for state changes to update UI
    this.state.subscribe((state) => {
      console.log('AppController state changed:', state);
      this.updateAuthUI(state);
    });
  }

  updateAuthUI(state) {
    const authStatus = document.getElementById('authStatus');
    const userName = document.getElementById('userName');
    const userEmail = document.getElementById('userEmail');

    if (authStatus) {
      authStatus.textContent = state.isAuthenticated
        ? '✅ Authenticated'
        : 'Not authenticated';
    }

    if (userName) {
      if (state.isAuthenticated && state.user) {
        // Display name in dedicated element
        const displayName = state.user.name || state.user.firstName || 'User';
        userName.textContent = displayName;
        
        // Display email in separate element if available
        if (userEmail && state.user.email) {
          userEmail.textContent = state.user.email;
        }
      } else if (state.isAuthenticated) {
        // Authenticated but user data not yet loaded
        userName.textContent = 'Loading...';
        if (userEmail) userEmail.textContent = '';
      } else {
        userName.textContent = '';
        if (userEmail) userEmail.textContent = '';
      }
    }
  }
}
