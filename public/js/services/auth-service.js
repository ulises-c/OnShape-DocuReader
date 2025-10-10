export class AuthService {
  constructor(api) {
    this.api = api;
  }

  async checkStatus() {
    try {
      return await this.api.getAuthStatus();
    } catch (error) {
      console.error('Auth status check error:', error);
      return { authenticated: false };
    }
  }

  login() {
    // Pass current hash as returnTo so user returns to same place after login
    const currentPath = window.location.pathname + window.location.hash;
    window.location.href = `/auth/login?returnTo=${encodeURIComponent(currentPath)}`;
  }

  async logout() {
    try {
      await this.api.logout();
      // Clear any client-side state
      sessionStorage.clear();
      // Force navigation to root hash without reload
      window.location.hash = '#/';
      // Dispatch custom event to notify app of logout
      window.dispatchEvent(new CustomEvent('auth:logout'));
    } catch (error) {
      console.error('Logout error:', error);
      // Even on error, attempt to navigate to landing
      window.location.hash = '#/';
      window.dispatchEvent(new CustomEvent('auth:logout'));
    }
  }

  async getUser() {
    return this.api.getUser();
  }
}
