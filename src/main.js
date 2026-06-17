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
import { getActiveGame } from './app/game-registry.js';
import { navigateTo } from './app/screen-machine.js';
import { audioManager } from './utils/audio-manager.js';
import { fullscreenManager } from './app/fullscreen-manager.js';
import { mathGameSelectScreen } from './ui/math-game-select-screen.js';
import { thaiGameSelectScreen } from './ui/thai-game-select-screen.js';
import { gameSetupScreen } from './ui/game-setup-screen.js';
import { GAME_IDS } from './app/constants.js';

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
  mathGameSelectScreen.init(document.getElementById('screen-math-game-select'));
  thaiGameSelectScreen.init(document.getElementById('screen-thai-game-select'));
  gameSetupScreen.init(document.getElementById('screen-game-setup'));
  
  // Setup router
  router.init();
  
  // Setup Fullscreen and NoSleep
  fullscreenManager.init();

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

  const calBackBtn = document.getElementById('btn-calibration-back');
  calBackBtn.addEventListener('click', () => {
    audioManager.playSound('click');
    const gameId = state.get('activeGameId');
    if (gameId === GAME_IDS.MATH_JUMP_ANSWER || gameId === GAME_IDS.THAI_LETTER_HOME) {
      navigateTo(SCREENS.GAME_SETUP);
    } else if (gameId === GAME_IDS.FRUIT_COUNT) {
      navigateTo(SCREENS.MATH_GAME_SELECT);
    } else {
      navigateTo(SCREENS.SUBJECT_SELECT);
    }
  });

  // Watch state.currentScreen to manage webcam and game instances
  let cameraFallbackTimeout = null;
  state.subscribe('currentScreen', async (screen) => {
    // Clear any pending camera fallback timeouts immediately on navigation
    if (cameraFallbackTimeout) {
      clearTimeout(cameraFallbackTimeout);
      cameraFallbackTimeout = null;
    }

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
    const activeGameToStop = getActiveGame(state.get('activeSubject'), state.get('activeGameId'));
    if (activeGameToStop) {
      activeGameToStop.stop();
    }

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
        audioManager.speak("ไม่พบกล้องจ้า สามารถเล่นผ่านคีย์บอร์ดโดยใช้ลูกศรซ้ายขวาและปุ่มเอ็นเทอร์ได้เลยนะ", "No camera detected. You can play using the left and right arrow keys and the Enter key.");
        
        cameraFallbackTimeout = setTimeout(() => {
          cameraFallbackTimeout = null;
          if (state.get('currentScreen') === SCREENS.CALIBRATION) {
            navigateTo(SCREENS.GAME_PLAY);
          }
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
        const activeGameToStart = getActiveGame(state.get('activeSubject'), state.get('activeGameId'));
        if (activeGameToStart) {
          activeGameToStart.init(gameCanvas, videoElement);
          activeGameToStart.start();
        } else {
          console.warn(`No active game found for subject: ${state.get('activeSubject')}, gameId: ${state.get('activeGameId')}`);
        }
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
