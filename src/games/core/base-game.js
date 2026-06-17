import { state } from '../../app/state.js';
import { SCREENS } from '../../app/constants.js';
import { inputAdapter } from './input-adapter.js';

/**
 * BaseGame represents the generic structure for all KidMove games.
 * It coordinates the requestAnimationFrame loop, calculates delta-time (dt) safely,
 * monitors screens and state for automatic termination, and manages active timeouts/intervals.
 */
export class BaseGame {
  /**
   * @param {string} gameId Unique identifier for the game
   */
  constructor(gameId) {
    this.gameId = gameId;
    this.canvas = null;
    this.ctx = null;
    this.video = null;
    this.animationId = null;
    this.lastTime = 0;
    this.wakeLock = null;
    
    // Timer registries for automatic cleanup
    this.timeouts = [];
    this.intervals = [];

    this.handleVisibilityChange = async () => {
      if (document.visibilityState === 'visible' && state.get('gameRunning')) {
        await this.requestWakeLock();
      }
    };
  }

  /**
   * Requests a screen wake lock to prevent the device from sleeping.
   */
  async requestWakeLock() {
    if ('wakeLock' in navigator) {
      try {
        this.wakeLock = await navigator.wakeLock.request('screen');
        console.log('Wake Lock is active');
      } catch (err) {
        console.error(`Wake Lock error: ${err.name}, ${err.message}`);
      }
    }
  }

  /**
   * Releases the active screen wake lock.
   */
  releaseWakeLock() {
    if (this.wakeLock !== null) {
      this.wakeLock.release().catch(err => console.error(err));
      this.wakeLock = null;
      console.log('Wake Lock is released');
    }
  }

  /**
   * Binds rendering context and initializes the input adapter.
   * @param {HTMLCanvasElement} canvasElement 
   * @param {HTMLVideoElement} videoElement 
   */
  init(canvasElement, videoElement) {
    this.canvas = canvasElement;
    this.ctx = this.canvas.getContext('2d');
    this.video = videoElement;

    // Initialize input adapter for keyboard and pose inputs
    inputAdapter.init(videoElement);
  }

  /**
   * Starts the game loop.
   */
  start() {
    state.set({ gameRunning: true });
    this.requestWakeLock();
    document.addEventListener('visibilitychange', this.handleVisibilityChange);
    this.lastTime = performance.now();
    this.loop(this.lastTime);
  }

  /**
   * Halts the game loop, resets running states, and cleans up all active timers and input adapter listeners.
   */
  stop() {
    state.set({ gameRunning: false });
    this.releaseWakeLock();
    document.removeEventListener('visibilitychange', this.handleVisibilityChange);
    
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
    
    this.clearTimers();
    inputAdapter.destroy();
  }

  /**
   * Registers and wraps a setTimeout so it can be automatically cleaned up.
   * @param {Function} callback 
   * @param {number} delay 
   * @returns {number} The timeout ID
   */
  setTimeout(callback, delay) {
    const id = setTimeout(() => {
      this.timeouts = this.timeouts.filter(t => t !== id);
      callback();
    }, delay);
    this.timeouts.push(id);
    return id;
  }

  /**
   * Clears a tracked timeout.
   * @param {number} id 
   */
  clearTimeout(id) {
    clearTimeout(id);
    this.timeouts = this.timeouts.filter(t => t !== id);
  }

  /**
   * Registers and wraps a setInterval so it can be automatically cleaned up.
   * @param {Function} callback 
   * @param {number} delay 
   * @returns {number} The interval ID
   */
  setInterval(callback, delay) {
    const id = setInterval(callback, delay);
    this.intervals.push(id);
    return id;
  }

  /**
   * Clears a tracked interval.
   * @param {number} id 
   */
  clearInterval(id) {
    clearInterval(id);
    this.intervals = this.intervals.filter(t => t !== id);
  }

  /**
   * Clears all registered timeouts and intervals.
   */
  clearTimers() {
    this.timeouts.forEach(t => clearTimeout(t));
    this.intervals.forEach(i => clearInterval(i));
    this.timeouts = [];
    this.intervals = [];
  }

  /**
   * The core requestAnimationFrame loop.
   * Handles loop guards and delta time calculations.
   * @param {number} now 
   */
  loop(now = performance.now()) {
    // Loop guard: Stop immediately if screen is changed or game is paused
    if (state.get('currentScreen') !== SCREENS.GAME_PLAY || !state.get('gameRunning')) {
      this.stop();
      return;
    }

    if (!this.lastTime) {
      this.lastTime = now;
    }

    // Delta time calculation in seconds
    let dt = (now - this.lastTime) / 1000;
    
    // Capping dt to prevent excessive jumps (lag spike protection)
    dt = Math.min(dt, 0.033); 
    this.lastTime = now;

    // Run game logic and drawing routines
    this.update(dt, now);
    this.draw();

    this.animationId = requestAnimationFrame((timestamp) => this.loop(timestamp));
  }

  /**
   * Game logic step. Override in subclass.
   * @param {number} dt Delta time in seconds
   * @param {number} now Current performance.now() timestamp
   */
  update(dt, now) {
    // Subclass override
  }

  /**
   * Render step. Override in subclass.
   */
  draw() {
    // Subclass override
  }
}
