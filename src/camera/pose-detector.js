import { PoseLandmarker, FilesetResolver } from '@mediapipe/tasks-vision';
import { state } from '../app/state.js';

class PoseDetector {
  constructor() {
    this.poseLandmarker = null;
    this.isLoading = false;
    this.initialized = false;
  }

  async init() {
    if (this.initialized || this.isLoading) return;

    this.isLoading = true;
    try {
      // Initialize resolver and landmarker using CDN files for reliability and cache performance
      const vision = await FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.8/wasm"
      );

      this.poseLandmarker = await PoseLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath: "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task",
          delegate: "GPU"
        },
        runningMode: "VIDEO",
        numPoses: 1
      });

      this.initialized = true;
      this.isLoading = false;
      console.log("MediaPipe Pose Landmarker loaded successfully.");
    } catch (error) {
      this.isLoading = false;
      console.error("Failed to load MediaPipe Pose Landmarker:", error);
      // Let the app know that pose detection failed to load (will fallback to keyboard)
      state.set({ cameraReady: false });
    }
  }

  detect(videoElement, timestamp) {
    if (!this.initialized || !this.poseLandmarker) {
      return null;
    }
    try {
      const result = this.poseLandmarker.detectForVideo(videoElement, timestamp);
      return result;
    } catch (e) {
      console.error("Pose detection frame processing error:", e);
      return null;
    }
  }

  // Draw debugging outline skeleton on top of calibration/camera canvas
  drawDebugSkeleton(canvasCtx, landmarks, width, height) {
    if (!landmarks || landmarks.length === 0) return;

    const connections = [
      [11, 12], // shoulder line
      [11, 13], [13, 15], // left arm
      [12, 14], [14, 16], // right arm
      [11, 23], [12, 24], // shoulders to hips
      [23, 24], // hip line
      [23, 25], [25, 27], // left leg
      [24, 26], [26, 28]  // right leg
    ];

    canvasCtx.save();
    
    // Draw joints
    landmarks.forEach((landmark) => {
      const x = landmark.x * width;
      const y = landmark.y * height;
      
      canvasCtx.beginPath();
      canvasCtx.arc(x, y, 6, 0, 2 * Math.PI);
      canvasCtx.fillStyle = '#ff6b6b';
      canvasCtx.fill();
      canvasCtx.strokeStyle = '#ffffff';
      canvasCtx.lineWidth = 2;
      canvasCtx.stroke();
    });

    // Draw lines between joints
    canvasCtx.strokeStyle = '#4dabf7';
    canvasCtx.lineWidth = 4;
    connections.forEach(([i, j]) => {
      const pt1 = landmarks[i];
      const pt2 = landmarks[j];
      if (pt1 && pt2 && pt1.visibility > 0.5 && pt2.visibility > 0.5) {
        canvasCtx.beginPath();
        canvasCtx.moveTo(pt1.x * width, pt1.y * height);
        canvasCtx.lineTo(pt2.x * width, pt2.y * height);
        canvasCtx.stroke();
      }
    });

    canvasCtx.restore();
  }
}

export const poseDetector = new PoseDetector();
