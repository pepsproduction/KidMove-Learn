import { GESTURES } from '../app/constants.js';
import { state } from '../app/state.js';

class GestureEngine {
  constructor() {
    this.baselines = {
      shoulderMidX: 0.5,
      shoulderMidY: 0.5,
      shoulderWidth: 0.2,
      initialized: false
    };

    // Keep history of detections to prevent jittering (smoothing)
    this.gestureHistory = [];
    this.historyLength = 5;
  }

  setBaselines(landmarks) {
    if (!landmarks || landmarks.length <= 24) return;

    const leftShoulder = landmarks[11];
    const rightShoulder = landmarks[12];
    
    this.baselines.shoulderMidX = (leftShoulder.x + rightShoulder.x) / 2;
    this.baselines.shoulderMidY = (leftShoulder.y + rightShoulder.y) / 2;
    this.baselines.shoulderWidth = Math.abs(leftShoulder.x - rightShoulder.x);
    this.baselines.initialized = true;
    console.log("Gesture engine baseline calibrated:", this.baselines);
  }

  resetBaselines() {
    this.baselines.initialized = false;
  }

  analyze(landmarks) {
    if (!landmarks || landmarks.length <= 24) {
      return GESTURES.NEUTRAL;
    }

    const leftShoulder = landmarks[11];
    const rightShoulder = landmarks[12];
    const leftWrist = landmarks[15];
    const rightWrist = landmarks[16];
    const leftHip = landmarks[23];
    const rightHip = landmarks[24];

    // Check visibility to make sure we have active tracking
    const minVisibility = 0.5;
    if (leftShoulder.visibility < minVisibility || rightShoulder.visibility < minVisibility) {
      return GESTURES.NEUTRAL;
    }

    const currentShoulderMidX = (leftShoulder.x + rightShoulder.x) / 2;
    const currentShoulderMidY = (leftShoulder.y + rightShoulder.y) / 2;

    // 1. Detect Hand Raises
    // Standard coordinates: y is 0 at top, 1 at bottom. So "raise" means y_wrist < y_shoulder
    const rightHandRaised = rightWrist.visibility > minVisibility && rightWrist.y < rightShoulder.y - 0.05;
    const leftHandRaised = leftWrist.visibility > minVisibility && leftWrist.y < leftShoulder.y - 0.05;

    let gesture = GESTURES.NEUTRAL;

    if (rightHandRaised && leftHandRaised) {
      gesture = GESTURES.RAISE_BOTH;
    } else if (rightHandRaised) {
      gesture = GESTURES.RAISE_RIGHT;
    } else if (leftHandRaised) {
      gesture = GESTURES.RAISE_LEFT;
    } else {
      // 2. Detect Leaning Left/Right
      // Compare shoulder mid X coordinate relative to calibrated baseline
      // MediaPipe is typically mirrored, so:
      // - If user leans to their RIGHT (which looks like screen LEFT, smaller X), currentShoulderMidX decreases.
      // - If user leans to their LEFT (which looks like screen RIGHT, larger X), currentShoulderMidX increases.
      const leanThreshold = 0.06; // Adjusted threshold for children's bodies
      const diffX = currentShoulderMidX - this.baselines.shoulderMidX;

      // 3. Detect Squatting
      // If shoulders drop vertically relative to baseline
      const squatThreshold = 0.08;
      const diffY = currentShoulderMidY - this.baselines.shoulderMidY;

      if (diffY > squatThreshold) {
        gesture = GESTURES.SQUAT;
      } else if (diffX < -leanThreshold) {
        // Leaning to screen left
        gesture = GESTURES.LEAN_LEFT;
      } else if (diffX > leanThreshold) {
        // Leaning to screen right
        gesture = GESTURES.LEAN_RIGHT;
      }
    }

    // Apply smoothing to avoid flutter/jitter
    this.gestureHistory.push(gesture);
    if (this.gestureHistory.length > this.historyLength) {
      this.gestureHistory.shift();
    }

    // Return the majority gesture in the history
    const counts = {};
    let maxGesture = GESTURES.NEUTRAL;
    let maxCount = 0;

    for (const g of this.gestureHistory) {
      counts[g] = (counts[g] || 0) + 1;
      if (counts[g] > maxCount) {
        maxGesture = g;
        maxCount = counts[g];
      }
    }

    // Update state with current gesture
    if (state.get('currentGesture') !== maxGesture) {
      state.set({ currentGesture: maxGesture });
    }

    return maxGesture;
  }
}

export const gestureEngine = new GestureEngine();
