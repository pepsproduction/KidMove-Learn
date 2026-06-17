import NoSleep from 'nosleep.js';

class FullscreenManager {
  constructor() {
    this.noSleep = new NoSleep();
    this.isFullscreen = false;
    this.btn = null;
  }

  init() {
    this.btn = document.getElementById('floating-fullscreen-btn');
    if (this.btn) {
      this.btn.addEventListener('click', () => this.toggle());
    }

    document.addEventListener('fullscreenchange', () => {
      this.isFullscreen = !!document.fullscreenElement;
      this.updateButton();
    });

    // Enable NoSleep on first user interaction anywhere
    const enableNoSleep = () => {
      this.noSleep.enable();
      document.removeEventListener('click', enableNoSleep);
      document.removeEventListener('touchstart', enableNoSleep);
    };
    document.addEventListener('click', enableNoSleep);
    document.addEventListener('touchstart', enableNoSleep);
  }

  async toggle() {
    if (!this.isFullscreen) {
      try {
        // Fullscreen request must be on a user gesture
        if (document.documentElement.requestFullscreen) {
          await document.documentElement.requestFullscreen();
        } else if (document.documentElement.webkitRequestFullscreen) {
          await document.documentElement.webkitRequestFullscreen();
        }
        // Enable NoSleep
        this.noSleep.enable();
      } catch (err) {
        console.error('Error attempting to enable fullscreen/nosleep:', err);
      }
    } else {
      if (document.exitFullscreen) {
        await document.exitFullscreen();
      } else if (document.webkitExitFullscreen) {
        await document.webkitExitFullscreen();
      }
      this.noSleep.disable();
    }
  }

  updateButton() {
    if (this.btn) {
      this.btn.textContent = this.isFullscreen ? 'ย่อจอลง' : '⛶ เต็มจอ';
    }
  }
}

export const fullscreenManager = new FullscreenManager();
