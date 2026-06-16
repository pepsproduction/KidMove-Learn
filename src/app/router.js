import { state } from './state.js';
import { SCREENS } from './constants.js';

class Router {
  constructor() {
    this.screens = {};
  }

  init() {
    // Collect DOM elements for screens
    Object.values(SCREENS).forEach(screenId => {
      const el = document.getElementById(`screen-${screenId}`);
      if (el) {
        this.screens[screenId] = el;
      }
    });

    // Subscribe to screen changes in state
    state.subscribe('currentScreen', (screen) => {
      this.render(screen);
    });

    // Initial render
    this.render(state.get('currentScreen'));
  }

  render(activeScreen) {
    Object.entries(this.screens).forEach(([screenId, element]) => {
      if (screenId === activeScreen) {
        element.classList.add('active');
        element.classList.remove('hidden');
      } else {
        element.classList.remove('active');
        element.classList.add('hidden');
      }
    });
  }
}

export const router = new Router();
