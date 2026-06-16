import { state } from '../app/state.js';
import { LEVELS, SCREENS } from '../app/constants.js';
import { audioManager } from '../utils/audio-manager.js';
import { fruitCountGame } from '../games/math/fruit-count-game.js';

class TeacherPanel {
  constructor() {
    this.sidebar = null;
  }

  init(sidebarElement) {
    this.sidebar = sidebarElement;
    this.render();
    this.bindEvents();
    this.bindGlobalKeys();
    
    // Subscribe to state changes to update panel form values dynamically
    state.subscribe('level', (level) => {
      const select = document.getElementById('tp-level-select');
      if (select) select.value = level;
    });

    state.subscribe('soundEnabled', (enabled) => {
      const checkbox = document.getElementById('tp-sound-toggle');
      if (checkbox) checkbox.checked = enabled;
    });

    state.subscribe('debugSkeleton', (debug) => {
      const checkbox = document.getElementById('tp-debug-toggle');
      if (checkbox) checkbox.checked = debug;
    });

    state.subscribe('collectMode', (mode) => {
      const select = document.getElementById('tp-collect-mode-select');
      if (select) select.value = mode;
    });

    state.subscribe('voiceLang', (lang) => {
      const select = document.getElementById('tp-voice-lang-select');
      if (select) select.value = lang;
    });

    state.subscribe('lastScores', (history) => {
      this.updateHistoryList(history);
    });
  }

  render() {
    this.sidebar.innerHTML = `
      <div class="tp-header">
        <h3>👩‍🏫 แผงควบคุมสำหรับคุณครู (Teacher Panel)</h3>
        <button id="tp-close-btn" class="tp-close-btn">&times;</button>
      </div>
      
      <div class="tp-body">
        <!-- Settings Form -->
        <div class="tp-section">
          <h4>⚙️ ตั้งค่าความยากของเกม</h4>
          <div class="tp-form-group">
            <label for="tp-level-select">ระดับการนับเลข:</label>
            <select id="tp-level-select" class="tp-select">
              <option value="${LEVELS.EASY}">ง่าย (เลข 1 - 3)</option>
              <option value="${LEVELS.NORMAL}">ปกติ (เลข 1 - 5)</option>
              <option value="${LEVELS.HARD}">เก่งมาก (เลข 1 - 10)</option>
            </select>
          </div>
          <div class="tp-form-group">
            <label for="tp-collect-mode-select">วิธีเก็บผลไม้:</label>
            <select id="tp-collect-mode-select" class="tp-select">
              <option value="gesture">ยกมือขวาเพื่อเก็บ</option>
              <option value="auto">เก็บอัตโนมัติเมื่อตะกร้าตรงผลไม้</option>
            </select>
          </div>
          <div class="tp-form-group">
            <label for="tp-voice-lang-select">ภาษาเสียงบรรยาย:</label>
            <select id="tp-voice-lang-select" class="tp-select">
              <option value="th">ภาษาไทย (Thai)</option>
              <option value="en">ภาษาอังกฤษ (English)</option>
            </select>
          </div>
        </div>

        <div class="tp-section">
          <h4>🔊 การทำงานและสิทธิ์ของระบบ</h4>
          <div class="tp-form-group checkbox-group">
            <input type="checkbox" id="tp-sound-toggle" ${state.get('soundEnabled') ? 'checked' : ''}>
            <label for="tp-sound-toggle">เปิดเสียงนำทาง/ซาวด์เอฟเฟกต์</label>
          </div>
          <div class="tp-form-group checkbox-group">
            <input type="checkbox" id="tp-debug-toggle" ${state.get('debugSkeleton') ? 'checked' : ''}>
            <label for="tp-debug-toggle">แสดงโครงกระดูก (Debug Skeleton)</label>
          </div>
        </div>

        <!-- Real-time Controls -->
        <div class="tp-section">
          <h4>🎮 ควบคุมเกมแบบเรียลไทม์</h4>
          <div class="tp-controls-grid">
            <button id="tp-btn-start" class="btn btn-small btn-blue">▶ เริ่ม/เล่นต่อ</button>
            <button id="tp-btn-pause" class="btn btn-small btn-orange">⏸ หยุดเกม</button>
            <button id="tp-btn-skip" class="btn btn-small btn-teal">⏭ ข้ามข้อ</button>
            <button id="tp-btn-reset" class="btn btn-small btn-red">🔄 รีเซ็ตคะแนน</button>
          </div>
        </div>

        <!-- Keyboard Shortcut Helper Cards -->
        <div class="tp-section">
          <h4>⌨️ ปุ่มลัดแป้นพิมพ์ (Keyboard Controls)</h4>
          <div class="tp-shortcut-list">
            <div><span class="tp-kbd">Space</span> เริ่ม/หยุดเกม</div>
            <div><span class="tp-kbd">⬅ / ➡️</span> เลื่อนตะกร้าซ้าย-ขวา</div>
            <div><span class="tp-kbd">Enter</span> เก็บผลไม้ / ตกลง</div>
            <div><span class="tp-kbd">N</span> ข้ามข้อ</div>
            <div><span class="tp-kbd">R</span> รีเซ็ตข้อและคะแนน</div>
            <div><span class="tp-kbd">D</span> เปิด/ปิดโครงกระดูกดีบั๊ก</div>
          </div>
        </div>

        <!-- History Log -->
        <div class="tp-section">
          <h4>📊 คะแนนล่าสุดของเด็กๆ</h4>
          <ul id="tp-score-history" class="tp-history-list">
            <!-- loaded dynamically -->
          </ul>
        </div>
      </div>
    `;

    this.updateHistoryList(state.get('lastScores'));
  }

  updateHistoryList(history) {
    const listEl = document.getElementById('tp-score-history');
    if (!listEl) return;

    if (!history || history.length === 0) {
      listEl.innerHTML = '<li class="no-history">ยังไม่มีคะแนนที่บันทึกไว้</li>';
      return;
    }

    listEl.innerHTML = history.map(item => {
      let lvlName = 'ปกติ 1-5';
      if (item.level === LEVELS.EASY) lvlName = 'ง่าย 1-3';
      if (item.level === LEVELS.HARD) lvlName = 'เก่งมาก 1-10';
      return `
        <li>
          <span class="history-date">${item.date}</span>
          <span class="history-level">${lvlName}</span>
          <span class="history-score">${item.score} คะแนน</span>
        </li>
      `;
    }).join('');
  }

  bindEvents() {
    const closeBtn = document.getElementById('tp-close-btn');
    const levelSelect = document.getElementById('tp-level-select');
    const soundToggle = document.getElementById('tp-sound-toggle');
    const debugToggle = document.getElementById('tp-debug-toggle');

    const startBtn = document.getElementById('tp-btn-start');
    const pauseBtn = document.getElementById('tp-btn-pause');
    const skipBtn = document.getElementById('tp-btn-skip');
    const resetBtn = document.getElementById('tp-btn-reset');

    closeBtn.addEventListener('click', () => {
      audioManager.playSound('click');
      this.sidebar.classList.remove('open');
    });

    levelSelect.addEventListener('change', (e) => {
      audioManager.playSound('click');
      state.set({ level: e.target.value });
      
      // If we are currently in gameplay, recreate question to match level
      if (state.get('currentScreen') === SCREENS.GAME_PLAY && state.get('gameRunning')) {
        fruitCountGame.generateQuestion();
      }
    });

    const collectModeSelect = document.getElementById('tp-collect-mode-select');
    collectModeSelect.addEventListener('change', (e) => {
      audioManager.playSound('click');
      state.set({ collectMode: e.target.value });
    });

    const voiceLangSelect = document.getElementById('tp-voice-lang-select');
    voiceLangSelect.addEventListener('change', (e) => {
      audioManager.playSound('click');
      state.set({ voiceLang: e.target.value });
    });

    soundToggle.addEventListener('change', (e) => {
      state.set({ soundEnabled: e.target.checked });
      audioManager.playSound('click');
    });

    debugToggle.addEventListener('change', (e) => {
      state.set({ debugSkeleton: e.target.checked });
      audioManager.playSound('click');
    });

    // Game Actions
    startBtn.addEventListener('click', () => {
      audioManager.playSound('click');
      if (state.get('currentScreen') !== SCREENS.GAME_PLAY) {
        state.set({ currentScreen: SCREENS.CALIBRATION });
      } else {
        if (!state.get('gameRunning')) {
          fruitCountGame.start();
        }
      }
      this.sidebar.classList.remove('open');
    });

    pauseBtn.addEventListener('click', () => {
      audioManager.playSound('click');
      if (state.get('currentScreen') === SCREENS.GAME_PLAY && state.get('gameRunning')) {
        fruitCountGame.stop();
      }
    });

    skipBtn.addEventListener('click', () => {
      audioManager.playSound('click');
      if (state.get('currentScreen') === SCREENS.GAME_PLAY && state.get('gameRunning')) {
        fruitCountGame.skipQuestion();
      }
    });

    resetBtn.addEventListener('click', () => {
      audioManager.playSound('click');
      if (state.get('currentScreen') === SCREENS.GAME_PLAY && state.get('gameRunning')) {
        fruitCountGame.start(); // restarts score/indices
      }
    });
  }

  // Bind keydown events for keyboard controls globally
  bindGlobalKeys() {
    window.addEventListener('keydown', (e) => {
      // Avoid firing if the active element is an input or select field
      if (['INPUT', 'SELECT', 'TEXTAREA'].includes(document.activeElement.tagName)) {
        return;
      }

      switch (e.key.toLowerCase()) {
        case ' ':
          // Space: Start/Pause Game
          e.preventDefault();
          if (state.get('currentScreen') === SCREENS.GAME_PLAY) {
            if (state.get('gameRunning')) {
              fruitCountGame.stop();
              audioManager.speak("หยุดเล่นชั่วคราว", "Game paused.");
            } else {
              state.set({ gameRunning: true });
              fruitCountGame.loop();
              audioManager.speak("เล่นต่อจ้า", "Game resumed.");
            }
          }
          break;

        case 'n':
          // Next question
          if (state.get('currentScreen') === SCREENS.GAME_PLAY && state.get('gameRunning')) {
            fruitCountGame.skipQuestion();
          }
          break;

        case 'r':
          // Reset score/game
          if (state.get('currentScreen') === SCREENS.GAME_PLAY && state.get('gameRunning')) {
            fruitCountGame.start();
          }
          break;

        case 'd':
          // Toggle debug skeletons
          state.set({ debugSkeleton: !state.get('debugSkeleton') });
          break;
      }
    });
  }
}

export const teacherPanel = new TeacherPanel();
