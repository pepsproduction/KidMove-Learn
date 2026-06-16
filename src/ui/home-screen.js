import { state } from '../app/state.js';
import { SCREENS } from '../app/constants.js';
import { audioManager } from '../utils/audio-manager.js';

class HomeScreen {
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
      <div class="home-content-wrapper">
        <div class="logo-container">
          <div class="logo-icon">🏃‍♂️🎉</div>
          <h1 class="game-title">KidMove Learn</h1>
          <p class="game-subtitle">เรียนรู้ผ่านการขยับร่างกายแสนสนุก!</p>
        </div>
        
        <div class="home-buttons-grid">
          <button id="btn-start-play" class="btn btn-giant btn-bounce">
            <span class="btn-emoji">🎮</span> เริ่มเล่นเกม
          </button>
          
          <div class="sub-buttons-row">
            <button id="btn-how-to-play" class="btn btn-medium btn-blue">
              <span class="btn-emoji">📖</span> วิธีเล่นเกม
            </button>
            <button id="btn-teacher-mode" class="btn btn-medium btn-teal">
              <span class="btn-emoji">👩‍🏫</span> โหมดคุณครู
            </button>
          </div>
        </div>

        <!-- How to play modal (hidden by default) -->
        <div id="how-to-play-modal" class="modal hidden">
          <div class="modal-content">
            <span class="modal-close-btn">&times;</span>
            <h2>📖 วิธีเล่นเกม (How to Play)</h2>
            <div class="how-to-steps">
              <div class="step-card">
                <span class="step-num">1</span>
                <p><strong>ยืนหน้ากล้อง</strong> ให้ห่างประมาณ 1.5 - 2 เมตร ให้กล้องเห็นทั้งตัวนะจ๊ะ</p>
              </div>
              <div class="step-card">
                <span class="step-num">2</span>
                <p><strong>เอียงตัวซ้าย-ขวา</strong> เพื่อเลื่อนตะกร้าไปรับผลไม้</p>
              </div>
              <div class="step-card">
                <span class="step-num">3</span>
                <p><strong>ยกมือขวา</strong> หรือ <strong>ขยับตะกร้าให้ตรง</strong> (ตามโหมดที่เลือก) เพื่อเก็บผลไม้</p>
              </div>
              <div class="step-card">
                <span class="step-num">4</span>
                <p><strong>ยกสองมือพร้อมกัน</strong> เพื่อเริ่มเล่นหรือใช้ยืนยัน</p>
              </div>
            </div>
            <p class="modal-fallback-note">💡 หากไม่มีกล้อง หรือขยับตัวไม่สะดวก คุณครู/หนู ๆ สามารถใช้ปุ่ม <strong>ลูกศร ซ้าย/ขวา</strong> เพื่อเลื่อนตะกร้า และกด <strong>Enter</strong> เพื่อเก็บผลไม้แทนได้จ้า</p>
            <button id="btn-close-instructions" class="btn btn-medium btn-orange">เข้าใจแล้ว!</button>
          </div>
        </div>

        <div class="privacy-footer-note">
          <span class="lock-icon">🔒</span> เกมนี้ใช้กล้องเพื่อจับท่าทางเท่านั้น ไม่มีการบันทึกวิดีโอ ไม่ถ่ายภาพ และไม่มีการส่งข้อมูลกล้องออกจากเครื่องผู้ใช้ มั่นใจ ปลอดภัย 100%
        </div>
      </div>
    `;
  }

  bindEvents() {
    const startPlayBtn = document.getElementById('btn-start-play');
    const teacherModeBtn = document.getElementById('btn-teacher-mode');
    const howToPlayBtn = document.getElementById('btn-how-to-play');
    
    const modal = document.getElementById('how-to-play-modal');
    const modalCloseBtn = modal.querySelector('.modal-close-btn');
    const closeInstructionsBtn = document.getElementById('btn-close-instructions');

    startPlayBtn.addEventListener('click', () => {
      audioManager.playSound('click');
      state.set({ currentScreen: SCREENS.SUBJECT_SELECT });
    });

    teacherModeBtn.addEventListener('click', () => {
      audioManager.playSound('click');
      // Show teacher panel overlays
      const panel = document.getElementById('teacher-panel-sidebar');
      if (panel) {
        panel.classList.toggle('open');
      }
    });

    howToPlayBtn.addEventListener('click', () => {
      audioManager.playSound('click');
      modal.classList.remove('hidden');
    });

    const closeModal = () => {
      audioManager.playSound('click');
      modal.classList.add('hidden');
    };

    modalCloseBtn.addEventListener('click', closeModal);
    closeInstructionsBtn.addEventListener('click', closeModal);
    
    // Close modal if clicking outside content
    window.addEventListener('click', (e) => {
      if (e.target === modal) {
        closeModal();
      }
    });
  }
}

export const homeScreen = new HomeScreen();
