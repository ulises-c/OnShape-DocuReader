// Thin entry point that wires up state, api client, and the main controller
import { AppState } from './state/app-state.js';
import { ApiClient } from './services/api-client.js';
import { AppController } from './controllers/app-controller.js';

// Handle OAuth redirect landing
if (window.location.pathname === '/dashboard') {
  window.history.replaceState({}, '', '/');
}

// Initialize core singletons
const state = new AppState();
const apiClient = new ApiClient();

// Boot the application
const appController = new AppController(state, apiClient);
appController.init();

export { appController };
