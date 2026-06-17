import { state } from '../app/state.js';
import { SCREENS, LEVELS } from '../app/constants.js';
import { navigateTo } from '../app/screen-machine.js';
import { audioManager } from '../utils/audio-manager.js';
import { MATH_JUMP_ANSWER_CONFIG } from '../games/math/math-jump-answer-config.js';
import { getQuestionCountForLevel } from '../games/math/math-jump-answer-content.js';

class GameSetupScreen {
  constructor() {
    this.container = null;
    this.selectedDifficulty = LEVELS.EASY;
    this.selectedTimer = MATH_JUMP_ANSWER_CONFIG.defaultTimerSeconds;
  }

  init(containerElement) {
    this.container = containerElement;
    this.render();
    this.bindEvents();
  }

  render() {
    this.container.innerHTML = `
      <div class="setup-content-wrapper">
        <button id="btn-setup-back" class="btn-back">⬅ ย้อนกลับ</button>
        
        <h2 class="screen-title">🦘 กระโดดตอบบวกลบ</h2>
        <p class="setup-subtitle">ตั้งค่าเกมก่อนเริ่มเล่น</p>
        
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
      navigateTo(SCREENS.MATH_GAME_SELECT);
    });

    diffBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        audioManager.playSound('click');
        diffBtns.forEach(b => b.classList.remove('selected-diff'));
        btn.classList.add('selected-diff');
        this.selectedDifficulty = btn.dataset.level;
      });
    });

    timerMinus.addEventListener('click', () => {
      audioManager.playSound('click');
      if (this.selectedTimer > MATH_JUMP_ANSWER_CONFIG.minTimerSeconds) {
        this.selectedTimer -= MATH_JUMP_ANSWER_CONFIG.timerStepSeconds;
        this.updateTimerDisplay();
      }
    });

    timerPlus.addEventListener('click', () => {
      audioManager.playSound('click');
      if (this.selectedTimer < MATH_JUMP_ANSWER_CONFIG.maxTimerSeconds) {
        this.selectedTimer += MATH_JUMP_ANSWER_CONFIG.timerStepSeconds;
        this.updateTimerDisplay();
      }
    });

    startBtn.addEventListener('click', () => {
      audioManager.playSound('click');
      const questionCount = getQuestionCountForLevel(this.selectedDifficulty);
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
