import { state } from '../../app/state.js';
import { GESTURES } from '../../app/constants.js';
import { poseDetector } from '../../camera/pose-detector.js';
import { gestureEngine } from '../../camera/gesture-engine.js';

/**
 * InputAdapter handles input unification from keyboard and MediaPipe camera poses.
 * It provides a throttled detection routine to reduce processor strain and avoid lag.
 * 
 * Future developers/games should import inputAdapter and query inputAdapter.getInput(now).
 */
class InputAdapter {
  constructor() {
    this.video = null;
    this.lastDetectionTime = 0;
    this.detectionInterval = 80; // Throttle pose detection to every 80ms
    this.lastLandmarks = null;
    this.lastGesture = GESTURES.NEUTRAL;
    this.lastBodyVisible = false;

    // Keyboard controls fallback state
    this.keys = {
      ArrowLeft: false,
      ArrowRight: false,
      Enter: false
    };

    this.handleKeyDown = this.handleKeyDown.bind(this);
    this.handleKeyUp = this.handleKeyUp.bind(this);
    this.isListening = false;
  }

  /**
   * Initializes the input adapter with a video element and starts listening to keys.
   * @param {HTMLVideoElement} videoElement 
   */
  init(videoElement) {
    this.video = videoElement;
    this.startListening();
  }

  /**
   * Starts keyboard event listeners. Safe to call multiple times.
   */
  startListening() {
    if (this.isListening) return;
    window.addEventListener('keydown', this.handleKeyDown);
    window.addEventListener('keyup', this.handleKeyUp);
    this.isListening = true;
  }

  /**
   * Stops keyboard event listeners and resets states.
   */
  stopListening() {
    if (!this.isListening) return;
    window.removeEventListener('keydown', this.handleKeyDown);
    window.removeEventListener('keyup', this.handleKeyUp);
    this.isListening = false;
    
    // Reset key states
    this.keys.ArrowLeft = false;
    this.keys.ArrowRight = false;
    this.keys.Enter = false;
  }

  handleKeyDown(e) {
    if (e.key === 'ArrowLeft') this.keys.ArrowLeft = true;
    if (e.key === 'ArrowRight') this.keys.ArrowRight = true;
    if (e.key === 'Enter') this.keys.Enter = true;
  }

  handleKeyUp(e) {
    if (e.key === 'ArrowLeft') this.keys.ArrowLeft = false;
    if (e.key === 'ArrowRight') this.keys.ArrowRight = false;
    if (e.key === 'Enter') this.keys.Enter = false;
  }

  /**
   * Queries and returns the unified input state.
   * @param {number} now The current timestamp from performance.now()
   * @returns {object} Standardized input object containing landmarks, gesture, keyboard, bodyVisible, inputMode
   */
  getInput(now) {
    let landmarks = this.lastLandmarks;
    let gesture = this.lastGesture;
    let bodyVisible = this.lastBodyVisible;
    let inputMode = 'keyboard';

    // 1. Process webcam inputs if camera is active and ready
    if (state.get('cameraActive') && this.video && this.video.readyState === this.video.HAVE_ENOUGH_DATA) {
      inputMode = 'pose';
      
      // Perform throttled pose detection
      if (now - this.lastDetectionTime >= this.detectionInterval) {
        this.lastDetectionTime = now;
        const poseResult = poseDetector.detect(this.video, now);
        
        if (poseResult && poseResult.landmarks && poseResult.landmarks[0]) {
          landmarks = poseResult.landmarks[0];
          gesture = gestureEngine.analyze(landmarks);
          
          const rightShoulder = landmarks[12];
          const leftShoulder = landmarks[11];
          const rightHip = landmarks[24];
          const leftHip = landmarks[23];
          const minVis = 0.5;

          bodyVisible = rightShoulder && leftShoulder && rightHip && leftHip &&
                        rightShoulder.visibility > minVis && 
                        leftShoulder.visibility > minVis && 
                        rightHip.visibility > minVis && 
                        leftHip.visibility > minVis;

          this.lastLandmarks = landmarks;
          this.lastGesture = gesture;
          this.lastBodyVisible = bodyVisible;
        } else {
          // No pose detected in this window, body is not visible
          bodyVisible = false;
          this.lastBodyVisible = false;
        }
      }
    } else {
      // Camera is inactive or not ready, fallback to keyboard
      inputMode = 'keyboard';
      gesture = GESTURES.NEUTRAL;
      landmarks = null;
      bodyVisible = false;
      
      // Clear gesture state if it's set
      if (state.get('currentGesture') !== GESTURES.NEUTRAL) {
        state.set({ currentGesture: GESTURES.NEUTRAL });
      }
    }

    return {
      landmarks,
      gesture,
      keyboard: { ...this.keys },
      bodyVisible,
      inputMode,
      timestamp: now
    };
  }

  /**
   * Cleans up listeners and state when a game stops or is destroyed.
   */
  destroy() {
    this.stopListening();
    this.video = null;
    this.lastLandmarks = null;
    this.lastGesture = GESTURES.NEUTRAL;
    this.lastBodyVisible = false;
    this.lastDetectionTime = 0;
  }
}

export const inputAdapter = new InputAdapter();
