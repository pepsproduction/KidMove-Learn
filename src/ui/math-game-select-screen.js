import { state } from '../app/state.js';
import { SCREENS, SUBJECTS, GAME_IDS } from '../app/constants.js';
import { navigateTo } from '../app/screen-machine.js';
import { audioManager } from '../utils/audio-manager.js';

class MathGameSelectScreen {
  constructor() {
    this.container = null;
  }

  init(containerElement) {
    this.container = containerElement;
    this.render();
    this.bindEvents();
  }

  render() {
    this.container.innerHTML = `
      <div class="subject-content-wrapper">
        <button id="btn-math-select-back" class="btn-back">⬅ ย้อนกลับ</button>
        
        <h2 class="screen-title">🔢 เลือกเกมคณิตศาสตร์</h2>
        
        <div class="math-game-cards-grid">
          <div id="card-fruit-count" class="subject-card active-card btn-bounce">
            <div class="subject-emoji">🍎</div>
            <h3>สวนผลไม้นับเลข 1-10</h3>
            <p>ขยับตัวเก็บผลไม้ให้ครบตามจำนวน</p>
            <div class="subject-status active-status">พร้อมเล่น!</div>
          </div>
          
          <div id="card-math-jump" class="subject-card active-card btn-bounce">
            <div class="subject-emoji">🦘</div>
            <h3>กระโดดตอบบวกลบ</h3>
            <p>เลือกคำตอบซ้ายขวา แล้วกระโดดแตะคำตอบ</p>
            <div class="subject-status active-status">พร้อมเล่น!</div>
          </div>
        </div>
      </div>
    `;
  }

  bindEvents() {
    const backBtn = document.getElementById('btn-math-select-back');
    const fruitCard = document.getElementById('card-fruit-count');
    const jumpCard = document.getElementById('card-math-jump');

    backBtn.addEventListener('click', () => {
      audioManager.playSound('click');
      navigateTo(SCREENS.SUBJECT_SELECT);
    });

    fruitCard.addEventListener('click', () => {
      audioManager.playSound('click');
      state.set({
        activeSubject: SUBJECTS.MATH,
        activeGameId: GAME_IDS.FRUIT_COUNT
      });
      navigateTo(SCREENS.CALIBRATION);
    });

    jumpCard.addEventListener('click', () => {
      audioManager.playSound('click');
      state.set({
        activeSubject: SUBJECTS.MATH,
        activeGameId: GAME_IDS.MATH_JUMP_ANSWER
      });
      navigateTo(SCREENS.GAME_SETUP);
    });
  }
}

export const mathGameSelectScreen = new MathGameSelectScreen();
