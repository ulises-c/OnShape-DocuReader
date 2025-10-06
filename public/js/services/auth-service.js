/**
 * AuthService - handles auth flows via ApiClient
 */

export class AuthService {
  constructor(api) {
    this.api = api;
  }

  async checkStatus() {
    return this.api.getAuthStatus();
  }

  login() {
    const currentPath = window.location.pathname;
    window.location.href = `/auth/login?returnTo=${encodeURIComponent(
      currentPath
    )}`;
  }

  async logout() {
    return this.api.logout();
  }

  async getUser() {
    return this.api.getUser();
  }
}
