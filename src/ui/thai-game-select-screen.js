import { state } from '../app/state.js';
import { SCREENS, SUBJECTS, GAME_IDS } from '../app/constants.js';
import { navigateTo } from '../app/screen-machine.js';
import { audioManager } from '../utils/audio-manager.js';

class ThaiGameSelectScreen {
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
        <button id="btn-thai-select-back" class="btn-back">⬅ ย้อนกลับ</button>
        
        <h2 class="screen-title">🇹🇭 เลือกเกมภาษาไทย</h2>
        
        <div class="subject-cards-grid">
          <div id="card-thai-letter-home" class="subject-card active-card btn-bounce">
            <div class="subject-emoji">🏠🔤</div>
            <h3>บ้านพยัญชนะ ก-ฮ</h3>
            <p>ดูภาพ ฟังเสียง แล้วกระโดดเลือกบ้านพยัญชนะให้ถูก</p>
            <div class="subject-status active-status">พร้อมเล่น!</div>
          </div>
          
          <div class="subject-card inactive-card">
            <div class="subject-emoji">🫧</div>
            <h3>เป่าฟองสบู่สระไทย</h3>
            <p>เร็วๆ นี้</p>
          </div>
        </div>
      </div>
    `;
  }

  bindEvents() {
    const backBtn = document.getElementById('btn-thai-select-back');
    const letterHomeCard = document.getElementById('card-thai-letter-home');

    backBtn.addEventListener('click', () => {
      audioManager.playSound('click');
      navigateTo(SCREENS.SUBJECT_SELECT);
    });

    letterHomeCard.addEventListener('click', () => {
      audioManager.playSound('click');
      state.set({
        activeSubject: SUBJECTS.THAI,
        activeGameId: GAME_IDS.THAI_LETTER_HOME
      });
      navigateTo(SCREENS.GAME_SETUP);
    });
  }
}

export const thaiGameSelectScreen = new ThaiGameSelectScreen();
