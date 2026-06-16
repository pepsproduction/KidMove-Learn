import { state } from '../app/state.js';
import { SCREENS, GESTURES } from '../app/constants.js';
import { poseDetector } from './pose-detector.js';
import { gestureEngine } from './gesture-engine.js';
import { audioManager } from '../utils/audio-manager.js';

class Calibration {
  constructor() {
    this.canvas = null;
    this.ctx = null;
    this.video = null;
    this.animationId = null;
    this.holdTimer = 0;
    this.lastFrameTime = 0;
  }

  init(canvasElement, videoElement) {
    this.canvas = canvasElement;
    this.ctx = this.canvas.getContext('2d');
    this.video = videoElement;
  }

  start() {
    state.set({
      calibrationDone: false,
      calibrationProgress: 0
    });
    this.holdTimer = 0;
    gestureEngine.resetBaselines();
    this.loop();
    
    // Play a friendly introductory sound
    audioManager.speak("ยืนในกรอบดาวแล้วยกสองมือขึ้นพร้อมกันเพื่อเริ่มเกมนะจ๊ะ");
  }

  stop() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }

  loop() {
    if (state.get('currentScreen') !== SCREENS.CALIBRATION) {
      this.stop();
      return;
    }

    const now = performance.now();
    if (this.video.readyState === this.video.HAVE_ENOUGH_DATA) {
      // 1. Clear and draw video frame mirrored for natural movement
      this.ctx.save();
      this.ctx.translate(this.canvas.width, 0);
      this.ctx.scale(-1, 1);
      this.ctx.drawImage(this.video, 0, 0, this.canvas.width, this.canvas.height);
      this.ctx.restore();

      // 2. Perform pose detection
      const poseResult = poseDetector.detect(this.video, now);
      
      let poseVisible = false;
      let landmarks = null;
      let calibrationText = "ขยับมาอยู่หน้ากล้องนะจ๊ะ";
      let statusColor = "#ff8080";

      if (poseResult && poseResult.landmarks && poseResult.landmarks[0]) {
        landmarks = poseResult.landmarks[0];
        
        // Check if essential joints are detected and have good visibility
        // Need shoulders (11, 12) and hips (23, 24) to be visible to verify the child has backed up enough
        const rightShoulder = landmarks[12];
        const leftShoulder = landmarks[11];
        const rightHip = landmarks[24];
        const leftHip = landmarks[23];
        const minVis = 0.5;

        const bodyVisible = rightShoulder.visibility > minVis && 
                            leftShoulder.visibility > minVis && 
                            rightHip.visibility > minVis && 
                            leftHip.visibility > minVis;

        if (bodyVisible) {
          poseVisible = true;
          
          // Draw debug skeleton if active in state
          if (state.get('debugSkeleton')) {
            poseDetector.drawDebugSkeleton(this.ctx, landmarks, this.canvas.width, this.canvas.height);
          }

          // Analyze gestures
          const gesture = gestureEngine.analyze(landmarks);

          if (gesture === GESTURES.RAISE_BOTH) {
            // Child is holding two hands up to confirm ready state
            this.holdTimer += 2; // Increments by 2% per frame
            if (this.holdTimer >= 100) {
              this.holdTimer = 100;
              state.set({ calibrationProgress: 100 });
              
              // Calibrate and finish
              gestureEngine.setBaselines(landmarks);
              state.set({ calibrationDone: true });
              
              audioManager.playSound('completion');
              audioManager.speak("เก่งมากจ้า! เริ่มเกมคณิตศาสตร์แสนสนุกกันเลย!");
              
              setTimeout(() => {
                state.set({ currentScreen: SCREENS.GAME_PLAY });
              }, 1000);
              
              this.stop();
              return;
            }
            calibrationText = "ยอดเยี่ยมมาก! ค้างไว้แป๊บนึงนะ...";
            statusColor = "#47d147";
          } else {
            // Decay progress slowly if hands are dropped
            if (this.holdTimer > 0) this.holdTimer -= 1.5;
            if (this.holdTimer < 0) this.holdTimer = 0;
            
            calibrationText = "ยกสองมือขึ้นสูง ๆ เพื่อเริ่มเล่นได้เลยจ้า!";
            statusColor = "#ffcc00";
          }
          state.set({ calibrationProgress: Math.floor(this.holdTimer) });
        } else {
          // Body is cut off (not standing back far enough)
          if (this.holdTimer > 0) this.holdTimer -= 1;
          state.set({ calibrationProgress: Math.floor(this.holdTimer) });
          calibrationText = "ขยับถอยหลังนิดนึงนะ ให้กล้องเห็นตัวจ้า";
          statusColor = "#ff9933";
        }
      } else {
        // No pose detected at all
        if (this.holdTimer > 0) this.holdTimer -= 1;
        state.set({ calibrationProgress: Math.floor(this.holdTimer) });
      }

      // 3. Draw guides overlays
      this.drawCalibrationOverlay(poseVisible, calibrationText, statusColor);
    }

    this.animationId = requestAnimationFrame(() => this.loop());
  }

  drawCalibrationOverlay(poseVisible, messageText, statusColor) {
    const width = this.canvas.width;
    const height = this.canvas.height;
    
    // Draw star outline border in the center where child should align
    this.ctx.save();
    this.ctx.strokeStyle = statusColor;
    this.ctx.lineWidth = 6;
    this.ctx.setLineDash([15, 10]);
    
    // Friendly Rounded Silhouette Target Area
    this.ctx.beginPath();
    // Head guide circle
    this.ctx.arc(width / 2, height * 0.25, 45, 0, Math.PI * 2);
    this.ctx.stroke();

    // Body outline box
    this.ctx.beginPath();
    this.ctx.roundRect(width * 0.25, height * 0.38, width * 0.5, height * 0.5, 20);
    this.ctx.stroke();
    this.ctx.restore();

    // Draw calibration progress bar on screen bottom
    const progress = state.get('calibrationProgress');
    if (progress > 0) {
      const barWidth = width * 0.6;
      const barHeight = 24;
      const barX = (width - barWidth) / 2;
      const barY = height * 0.90;

      // Draw background
      this.ctx.save();
      this.ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
      this.ctx.beginPath();
      this.ctx.roundRect(barX, barY, barWidth, barHeight, 12);
      this.ctx.fill();

      // Draw active progress bar
      this.ctx.fillStyle = "#47d147";
      this.ctx.beginPath();
      this.ctx.roundRect(barX, barY, barWidth * (progress / 100), barHeight, 12);
      this.ctx.fill();
      
      // Border outline
      this.ctx.strokeStyle = "#ffffff";
      this.ctx.lineWidth = 3;
      this.ctx.stroke();
      this.ctx.restore();
    }

    // Draw textual instructions at the top with translucent overlay
    this.ctx.save();
    this.ctx.fillStyle = "rgba(0, 0, 0, 0.65)";
    this.ctx.fillRect(0, 0, width, 55);
    
    this.ctx.fillStyle = "#ffffff";
    this.ctx.font = "bold 22px 'Outfit', 'Inter', sans-serif";
    this.ctx.textAlign = "center";
    this.ctx.fillText(messageText, width / 2, 35);
    this.ctx.restore();
  }
}

export const calibration = new Calibration();
