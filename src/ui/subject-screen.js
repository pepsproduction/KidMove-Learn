import { state } from '../app/state.js';
import { SCREENS, SUBJECTS } from '../app/constants.js';
import { audioManager } from '../utils/audio-manager.js';

class SubjectScreen {
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
        <button id="btn-subject-back" class="btn-back">⬅ ย้อนกลับ</button>
        
        <h2 class="screen-title">เลือกวิชาแสนสนุกกันเลย!</h2>
        
        <div class="subject-cards-grid">
          <!-- Math subject: active -->
          <div id="card-math" class="subject-card active-card btn-bounce">
            <div class="subject-emoji">🔢</div>
            <h3>คณิตศาสตร์</h3>
            <p>สวนผลไม้นับเลข 1-10</p>
            <div class="subject-status active-status">พร้อมเล่น!</div>
          </div>
          
          <!-- Thai subject: active placeholder preview -->
          <div id="card-thai" class="subject-card active-card btn-bounce">
            <div class="subject-emoji">🇹🇭</div>
            <h3>ภาษาไทย</h3>
            <p>เป่าฟองสบู่พยัญชนะ ก-ฮ</p>
            <div class="subject-status" style="background-color: #868e96; color: white;">(เตรียมพบกันเร็วๆ นี้)</div>
          </div>

          <!-- English subject: active placeholder preview -->
          <div id="card-english" class="subject-card active-card btn-bounce">
            <div class="subject-emoji">🔤</div>
            <h3>ภาษาอังกฤษ</h3>
            <p>จับคู่ศัพท์คำศัพท์แสนง่าย</p>
            <div class="subject-status" style="background-color: #868e96; color: white;">(เตรียมพบกันเร็วๆ นี้)</div>
          </div>
        </div>
      </div>
    `;
  }

  bindEvents() {
    const backBtn = document.getElementById('btn-subject-back');
    const mathCard = document.getElementById('card-math');
    const thaiCard = document.getElementById('card-thai');
    const englishCard = document.getElementById('card-english');

    backBtn.addEventListener('click', () => {
      audioManager.playSound('click');
      state.set({ currentScreen: SCREENS.HOME });
    });

    mathCard.addEventListener('click', () => {
      audioManager.playSound('click');
      state.set({
        activeSubject: SUBJECTS.MATH,
        currentScreen: SCREENS.CALIBRATION
      });
    });

    thaiCard.addEventListener('click', () => {
      audioManager.playSound('click');
      state.set({
        activeSubject: SUBJECTS.THAI,
        currentScreen: SCREENS.PREVIEW
      });
    });

    englishCard.addEventListener('click', () => {
      audioManager.playSound('click');
      state.set({
        activeSubject: SUBJECTS.ENGLISH,
        currentScreen: SCREENS.PREVIEW
      });
    });
  }
}

export const subjectScreen = new SubjectScreen();
