/**
 * BaseView - abstract base with common helpers
 */

import { qs } from '../utils/dom-helpers.js';

export class BaseView {
  constructor(containerSelector) {
    this.container = typeof containerSelector === 'string' ? qs(containerSelector) : containerSelector;
  }

  ensureContainer() {
    if (!this.container) throw new Error('View container not found');
  }

  clear() {
    this.ensureContainer();
    this.container.innerHTML = '';
  }

  renderHtml(html) {
    this.ensureContainer();
    this.container.innerHTML = html;
  }

  bind() {
    // to be implemented by subclasses
  }

  unbind() {
    // optional clean-up in subclasses
  }
}
