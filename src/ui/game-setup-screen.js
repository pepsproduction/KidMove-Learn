import { state } from '../app/state.js';
import { SCREENS, LEVELS } from '../app/constants.js';
import { navigateTo } from '../app/screen-machine.js';
import { audioManager } from '../utils/audio-manager.js';
import { MATH_JUMP_ANSWER_CONFIG } from '../games/math/math-jump-answer-config.js';
import { getQuestionCountForLevel as getMathQuestionCount } from '../games/math/math-jump-answer-content.js';
import { THAI_LETTER_HOME_CONFIG } from '../games/thai/thai-letter-home-config.js';
import { getQuestionCountForThaiLevel } from '../games/thai/thai-letter-home-content.js';
import { GAME_IDS, SUBJECTS } from '../app/constants.js';

class GameSetupScreen {
  constructor() {
    this.container = null;
    this.selectedDifficulty = LEVELS.EASY;
    this.selectedTimer = 10;
    this.unsubscribe = null;
  }

  get activeConfig() {
    return state.get('activeGameId') === GAME_IDS.THAI_LETTER_HOME 
      ? THAI_LETTER_HOME_CONFIG 
      : MATH_JUMP_ANSWER_CONFIG;
  }

  init(containerElement) {
    this.container = containerElement;
    this.render();
    this.bindEvents();

    this.unsubscribe = state.subscribe('currentScreen', (screen) => {
      if (screen === SCREENS.GAME_SETUP) {
        this.onShowSetup();
      }
    });
  }

  onShowSetup() {
    this.selectedDifficulty = LEVELS.EASY;
    
    // Set default timer based on game config
    const config = this.activeConfig;
    if (typeof config.defaultTimerSeconds === 'number') {
      this.selectedTimer = config.defaultTimerSeconds;
    } else if (config.defaultTimerSeconds && config.defaultTimerSeconds[this.selectedDifficulty]) {
      this.selectedTimer = config.defaultTimerSeconds[this.selectedDifficulty];
    } else {
      this.selectedTimer = 10;
    }
    
    this.updateUI();
    this.updateTimerDisplay();
    
    // Reset selected difficulty button
    const diffBtns = document.querySelectorAll('.diff-btn');
    diffBtns.forEach(b => b.classList.remove('selected-diff'));
    document.getElementById('btn-diff-easy').classList.add('selected-diff');
  }

  updateUI() {
    const titleEl = document.getElementById('setup-title');
    const subtitleEl = document.getElementById('setup-subtitle');
    const gameId = state.get('activeGameId');

    if (gameId === GAME_IDS.THAI_LETTER_HOME) {
      titleEl.innerHTML = '🏠 บ้านพยัญชนะ ก-ฮ';
      subtitleEl.innerHTML = 'ดูภาพ ฟังเสียง แล้วเลือกบ้านพยัญชนะให้ถูก';
    } else {
      titleEl.innerHTML = '🦘 กระโดดตอบบวกลบ';
      subtitleEl.innerHTML = 'ตั้งค่าเกมก่อนเริ่มเล่น';
    }
  }

  render() {
    this.container.innerHTML = `
      <div class="setup-content-wrapper">
        <button id="btn-setup-back" class="btn-back">⬅ ย้อนกลับ</button>
        
        <h2 id="setup-title" class="screen-title">🦘 กระโดดตอบบวกลบ</h2>
        <p id="setup-subtitle" class="setup-subtitle">ตั้งค่าเกมก่อนเริ่มเล่น</p>
        
        <div class="setup-options-grid">
          <div class="setup-section">
            <h3 class="setup-section-title">เลือกระดับความยาก</h3>
            <div class="difficulty-buttons">
              <button id="btn-diff-easy" class="btn btn-medium diff-btn selected-diff" data-level="easy">
                ⭐ ง่าย (5 ข้อ)
              </button>
              <button id="btn-diff-normal" class="btn btn-medium diff-btn" data-level="normal">
                ⭐⭐ ธรรมดา (10 ข้อ)
              </button>
              <button id="btn-diff-hard" class="btn btn-medium diff-btn" data-level="hard">
                ⭐⭐⭐ ยาก (15 ข้อ)
              </button>
            </div>
          </div>
          
          <div class="setup-section">
            <h3 class="setup-section-title">เวลาต่อข้อ</h3>
            <div class="timer-control">
              <button id="btn-timer-minus" class="btn btn-small btn-red timer-btn">−</button>
              <span id="timer-value" class="timer-display">10 วินาที</span>
              <button id="btn-timer-plus" class="btn btn-small btn-teal timer-btn">+</button>
            </div>
          </div>
        </div>
        
        <div class="setup-actions">
          <button id="btn-start-game" class="btn btn-giant btn-bounce btn-orange">
            🎮 เริ่มเกมเลย!
          </button>
        </div>
      </div>
    `;
  }

  bindEvents() {
    const backBtn = document.getElementById('btn-setup-back');
    const startBtn = document.getElementById('btn-start-game');
    const timerMinus = document.getElementById('btn-timer-minus');
    const timerPlus = document.getElementById('btn-timer-plus');
    const diffBtns = document.querySelectorAll('.diff-btn');

    backBtn.addEventListener('click', () => {
      audioManager.playSound('click');
      if (state.get('activeSubject') === SUBJECTS.THAI) {
        navigateTo(SCREENS.THAI_GAME_SELECT);
      } else if (state.get('activeSubject') === SUBJECTS.MATH) {
        navigateTo(SCREENS.MATH_GAME_SELECT);
      } else {
        navigateTo(SCREENS.SUBJECT_SELECT);
      }
    });

    diffBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        audioManager.playSound('click');
        diffBtns.forEach(b => b.classList.remove('selected-diff'));
        btn.classList.add('selected-diff');
        this.selectedDifficulty = btn.dataset.level;
        
        const config = this.activeConfig;
        if (typeof config.defaultTimerSeconds === 'object') {
          this.selectedTimer = config.defaultTimerSeconds[this.selectedDifficulty];
          this.updateTimerDisplay();
        }
      });
    });

    timerMinus.addEventListener('click', () => {
      audioManager.playSound('click');
      const config = this.activeConfig;
      if (this.selectedTimer > config.minTimerSeconds) {
        this.selectedTimer -= config.timerStepSeconds;
        this.updateTimerDisplay();
      }
    });

    timerPlus.addEventListener('click', () => {
      audioManager.playSound('click');
      const config = this.activeConfig;
      if (this.selectedTimer < config.maxTimerSeconds) {
        this.selectedTimer += config.timerStepSeconds;
        this.updateTimerDisplay();
      }
    });

    startBtn.addEventListener('click', () => {
      audioManager.playSound('click');
      
      let questionCount = 5;
      if (state.get('activeGameId') === GAME_IDS.THAI_LETTER_HOME) {
        questionCount = getQuestionCountForThaiLevel(this.selectedDifficulty);
      } else {
        questionCount = getMathQuestionCount(this.selectedDifficulty);
      }

      state.set({
        level: this.selectedDifficulty,
        gameSettings: {
          difficulty: this.selectedDifficulty,
          timerSeconds: this.selectedTimer,
          questionCount: questionCount
        }
      });
      navigateTo(SCREENS.CALIBRATION);
    });
  }

  updateTimerDisplay() {
    const el = document.getElementById('timer-value');
    if (el) el.textContent = `${this.selectedTimer} วินาที`;
  }
}

export const gameSetupScreen = new GameSetupScreen();
