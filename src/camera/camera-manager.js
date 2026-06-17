import { state } from '../app/state.js';

class CameraManager {
  constructor() {
    this.videoElement = null;
    this.stream = null;
  }

  async init(videoElement) {
    this.videoElement = videoElement;
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      state.set({ cameraPermission: 'denied', cameraReady: false });
      throw new Error('Webcam not supported by this browser.');
    }
  }

  async startCamera() {
    if (this.stream) {
      return this.stream;
    }

    try {
      const mediaPromise = navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user'
        },
        audio: false // Privacy: no audio recorded
      });

      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Camera request timed out (user may have ignored prompt)')), 15000);
      });

      this.stream = await Promise.race([mediaPromise, timeoutPromise]);

      if (this.videoElement) {
        await new Promise((resolve) => {
          this.videoElement.onloadedmetadata = () => {
            this.videoElement.play().catch(err => console.warn("Video play failed:", err));
            resolve();
          };
          
          this.videoElement.srcObject = this.stream;
          
          // Fallback in case metadata loaded synchronously
          if (this.videoElement.readyState >= 1) {
            this.videoElement.play().catch(err => console.warn("Video play failed synchronously:", err));
            resolve();
          }
        });
      }

      state.set({
        cameraPermission: 'granted',
        cameraReady: true,
        cameraActive: true
      });

      return this.stream;
    } catch (error) {
      console.warn('Camera access denied or failed:', error);
      state.set({
        cameraPermission: 'denied',
        cameraReady: false,
        cameraActive: false
      });
      throw error;
    }
  }

  stopCamera() {
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }
    if (this.videoElement) {
      this.videoElement.srcObject = null;
    }
    state.set({ cameraActive: false });
  }
}

export const cameraManager = new CameraManager();
