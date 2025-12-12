/**
 * Navigation - page transitions
 */

export class Navigation {
  constructor() {
    this.pages = Array.from(document.querySelectorAll('.page'));
  }

  navigateTo(pageId) {
    // Hide all
    this.pages.forEach((p) => p.classList.remove('active'));
    const page = document.getElementById(pageId);
    if (page) {
      page.classList.add('active');
    } else {
      console.warn('navigateTo: page not found', pageId);
    }
  }

  /**
   * Get the currently active page ID
   * @returns {string|null} The ID of the active page or null
   */
  getCurrentPage() {
    const activePage = this.pages.find(p => p.classList.contains('active'));
    return activePage?.id || null;
  }
}
