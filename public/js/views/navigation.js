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
}
