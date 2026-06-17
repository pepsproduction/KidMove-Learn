import { SCREENS, SUBJECTS, LEVELS, GESTURES } from './constants.js';
import { getStoredSettings, saveSettings } from '../utils/storage.js';

class StateStore {
  constructor() {
    // Load persisted settings if any, otherwise use defaults
    const persisted = getStoredSettings() || {};

    this.state = {
      // Navigation
      currentScreen: SCREENS.HOME,
      activeSubject: SUBJECTS.MATH,
      
      // Game Configuration
      level: persisted.level || LEVELS.NORMAL,
      soundEnabled: persisted.soundEnabled !== undefined ? persisted.soundEnabled : true,
      debugSkeleton: persisted.debugSkeleton !== undefined ? persisted.debugSkeleton : false,
      collectMode: persisted.collectMode || 'gesture', // 'gesture' or 'auto'
      voiceLang: persisted.voiceLang || 'th', // 'th' or 'en'
      
      // Live Camera & Gesture state
      cameraReady: false,
      cameraActive: false,
      cameraPermission: null, // 'granted', 'denied', or null
      currentGesture: GESTURES.NEUTRAL,
      calibrationDone: false,
      calibrationProgress: 0, // 0 to 100
      
      // Active Game State
      gameRunning: false,
      score: 0,
      currentQuestionIdx: 0,
      totalQuestions: 5,
      questionTarget: 0,
      questionFruit: null,
      fruitsPicked: 0,
      activeRoundsPlayed: 0,
      correctAnswers: 0,
      wrongAnswers: 0,
      timeoutAnswers: 0,
      
      // Thai Game State
      thaiQuestion: null,
      thaiChoices: [],
      thaiCorrectLetter: null,
      thaiSelectedChoice: null,
      thaiTimeLeft: 10,
      thaiAnswered: false,
      thaiAnswerResult: null,
      
      // History (localStorage)
      lastScores: persisted.lastScores || []
    };

    this.listeners = new Map();
  }

  // Subscribe to changes of a specific key, or all keys if key is '*'
  subscribe(key, callback) {
    if (!this.listeners.has(key)) {
      this.listeners.set(key, []);
    }
    this.listeners.get(key).push(callback);
    
    // Return unsubscribe function
    return () => {
      const callbacks = this.listeners.get(key) || [];
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    };
  }

  // Update a single key or multiple keys
  set(updates) {
    const affectedKeys = [];
    
    for (const [key, val] of Object.entries(updates)) {
      if (this.state[key] !== val) {
        this.state[key] = val;
        affectedKeys.push(key);
      }
    }

    if (affectedKeys.some(k => ['level', 'soundEnabled', 'debugSkeleton', 'collectMode', 'voiceLang', 'lastScores'].includes(k))) {
      saveSettings({
        level: this.state.level,
        soundEnabled: this.state.soundEnabled,
        debugSkeleton: this.state.debugSkeleton,
        collectMode: this.state.collectMode,
        voiceLang: this.state.voiceLang,
        lastScores: this.state.lastScores
      });
    }

    // Trigger listeners
    for (const key of affectedKeys) {
      if (this.listeners.has(key)) {
        for (const cb of this.listeners.get(key)) {
          cb(this.state[key], this.state);
        }
      }
    }

    // Trigger general listeners
    if (affectedKeys.length > 0 && this.listeners.has('*')) {
      for (const cb of this.listeners.get('*')) {
        cb(this.state);
      }
    }
  }

  get(key) {
    return this.state[key];
  }

  getState() {
    return { ...this.state };
  }
}

export const state = new StateStore();
