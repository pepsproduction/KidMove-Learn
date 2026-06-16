import { state } from './app/state.js';
import { SCREENS } from './app/constants.js';
import { router } from './app/router.js';
import { homeScreen } from './ui/home-screen.js';
import { subjectScreen } from './ui/subject-screen.js';
import { resultScreen } from './ui/result-screen.js';
import { teacherPanel } from './ui/teacher-panel.js';
import { previewScreen } from './ui/preview-screen.js';
import { cameraManager } from './camera/camera-manager.js';
import { poseDetector } from './camera/pose-detector.js';
import { calibration } from './camera/calibration.js';
import { fruitCountGame } from './games/math/fruit-count-game.js';
import { audioManager } from './utils/audio-manager.js';

// 1. Responsive 16:9 Screen Autoscaler
function resizeApp() {
  const container = document.getElementById('app-container');
  if (!container) return;

  const baseWidth = 1024;
  const baseHeight = 576;
  const winWidth = window.innerWidth;
  const winHeight = window.innerHeight;

  const scale = Math.min(winWidth / baseWidth, winHeight / baseHeight);
  container.style.transform = `scale(${scale})`;
}

// 2. Initialize App on DOM Loaded
window.addEventListener('DOMContentLoaded', async () => {
  // Bind resize scaling
  resizeApp();
  window.addEventListener('resize', resizeApp);

  // Initialize UI components and bind DOM containers
  homeScreen.init(document.getElementById('screen-home'));
  subjectScreen.init(document.getElementById('screen-subject-select'));
  resultScreen.init(document.getElementById('screen-results'));
  teacherPanel.init(document.getElementById('teacher-panel-sidebar'));
  previewScreen.init(document.getElementById('screen-preview'));
  
  // Setup router
  router.init();

  // Unified camera DOM elements
  const cameraContainer = document.getElementById('unified-camera-container');
  const videoElement = document.getElementById('camera-video');
  const canvasElement = document.getElementById('camera-overlay');

  // Floating teacher sidebar toggle button
  const floatingTeacherBtn = document.getElementById('floating-teacher-btn');
  const sidebar = document.getElementById('teacher-panel-sidebar');

  floatingTeacherBtn.addEventListener('click', () => {
    audioManager.playSound('click');
    sidebar.classList.toggle('open');
  });

  // Back button on calibration screen
  const calBackBtn = document.getElementById('btn-calibration-back');
  calBackBtn.addEventListener('click', () => {
    audioManager.playSound('click');
    state.set({ currentScreen: SCREENS.SUBJECT_SELECT });
  });

  // Watch state.currentScreen to manage webcam and game instances
  state.subscribe('currentScreen', async (screen) => {
    // Hide float teacher button when in game for UI cleanliness, show otherwise
    if (screen === SCREENS.GAME_PLAY) {
      floatingTeacherBtn.style.display = 'none';
    } else {
      floatingTeacherBtn.style.display = 'block';
    }

    // Reset camera container styles
    cameraContainer.className = 'camera-hidden';

    // Stop active instances
    calibration.stop();
    fruitCountGame.stop();

    if (screen === SCREENS.CALIBRATION) {
      cameraContainer.className = 'camera-calibration loading';
      
      try {
        // Initialize camera
        await cameraManager.init(videoElement);
        await cameraManager.startCamera();
        
        // Initialize MediaPipe PoseLandmarker
        await poseDetector.init();
        cameraContainer.classList.remove('loading');

        // Start calibration loop
        calibration.init(canvasElement, videoElement);
        calibration.start();
      } catch (error) {
        cameraContainer.className = 'camera-hidden';
        console.warn("Camera fallback active. Entering keyboard mode:", error);
        
        // Let the user proceed directly to game with keyboard mode
        state.set({
          cameraReady: false,
          cameraActive: false,
          calibrationDone: true
        });
        audioManager.speak("ไม่พบกล้องจ้า สามารถเล่นผ่านคีย์บอร์ดโดยใช้ลูกศรซ้ายขวาและปุ่มเอ็นเทอร์ได้เลยนะ");
        
        setTimeout(() => {
          state.set({ currentScreen: SCREENS.GAME_PLAY });
        }, 3000);
      }
    } 
    else if (screen === SCREENS.GAME_PLAY || screen === SCREENS.PREVIEW) {
      if (state.get('cameraActive')) {
        cameraContainer.className = 'camera-gameplay';
      } else {
        cameraContainer.className = 'camera-hidden';
      }

      if (screen === SCREENS.GAME_PLAY) {
        // Initialize and Start Game
        const gameCanvas = document.getElementById('game-canvas');
        fruitCountGame.init(gameCanvas, videoElement);
        fruitCountGame.start();
      }
    } 
    else {
      // Release camera streams when in Home, Subject-select or Results screen to maintain privacy
      cameraManager.stopCamera();
    }
  });

  // Play audio on first user click to bypass browser AudioContext autoplay policy
  window.addEventListener('click', () => {
    audioManager.initContext();
  }, { once: true });
});
