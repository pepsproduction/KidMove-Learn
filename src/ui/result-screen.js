import { state } from '../app/state.js';
import { SCREENS, GAME_IDS } from '../app/constants.js';
import { navigateTo } from '../app/screen-machine.js';
import { audioManager } from '../utils/audio-manager.js';

class ResultScreen {
  constructor() {
    this.container = null;
    this.unsubscribe = null;
  }

  init(containerElement) {
    this.container = containerElement;
    this.render();
    
    // Listen for transitions to results screen to trigger sounds
    this.unsubscribe = state.subscribe('currentScreen', (screen) => {
      if (screen === SCREENS.RESULTS) {
        this.onShowResults();
      }
    });
  }

  destroy() {
    if (this.unsubscribe) {
      this.unsubscribe();
    }
  }

  render() {
    this.container.innerHTML = `
      <div class="result-content-wrapper">
        <div class="result-banner">🏆 เก่งมาก ๆ เลยจ้า! 🏆</div>
        
        <div class="stars-outer-container">
          <div id="result-stars" class="stars-row">
            <!-- stars dynamically injected here -->
          </div>
        </div>

        <div class="score-card">
          <p class="score-label">คะแนนรวมของหนู</p>
          <h2 id="result-score-val" class="score-val">0</h2>
        </div>

        <!-- Extra stats for math-jump-answer game -->
        <div id="result-extra-stats" class="result-stats-row" style="display:none;">
          <div class="stat-item stat-correct">
            <span class="stat-emoji">✅</span>
            <span id="stat-correct-val">0</span>
            <span class="stat-label">ถูก</span>
          </div>
          <div class="stat-item stat-wrong">
            <span class="stat-emoji">❌</span>
            <span id="stat-wrong-val">0</span>
            <span class="stat-label">ผิด</span>
          </div>
          <div class="stat-item stat-timeout">
            <span class="stat-emoji">⏰</span>
            <span id="stat-timeout-val">0</span>
            <span class="stat-label">หมดเวลา</span>
          </div>
        </div>

        <div class="result-buttons-container">
          <button id="btn-play-again" class="btn btn-giant btn-bounce btn-orange">
            🎮 เล่นอีกครั้ง
          </button>
          <button id="btn-result-home" class="btn btn-medium btn-blue">
            🏠 กลับหน้าแรก
          </button>
        </div>
      </div>
    `;
  }

  onShowResults() {
    const scoreVal = state.get('score');
    const gameId = state.get('activeGameId');
    document.getElementById('result-score-val').textContent = scoreVal;

    // Determine how many stars to award
    let starCount;
    if (gameId === GAME_IDS.MATH_JUMP_ANSWER) {
      const correct = state.get('correctAnswers') || 0;
      const total = state.get('totalQuestions') || this.totalQuestions || 5;
      const ratio = total > 0 ? correct / total : 0;
      starCount = Math.max(1, Math.min(5, Math.ceil(ratio * 5)));

      // Show extra stats
      const extraStats = document.getElementById('result-extra-stats');
      if (extraStats) {
        extraStats.style.display = 'flex';
        document.getElementById('stat-correct-val').textContent = correct;
        document.getElementById('stat-wrong-val').textContent = state.get('wrongAnswers') || 0;
        document.getElementById('stat-timeout-val').textContent = state.get('timeoutAnswers') || 0;
      }
    } else {
      // Original fruit-count star logic
      starCount = Math.max(1, Math.min(5, Math.ceil(scoreVal / 10)));
      const extraStats = document.getElementById('result-extra-stats');
      if (extraStats) extraStats.style.display = 'none';
    }
    
    const starsContainer = document.getElementById('result-stars');
    starsContainer.innerHTML = '';
    
    for (let i = 0; i < 5; i++) {
      const star = document.createElement('span');
      star.className = i < starCount ? 'star-item filled-star' : 'star-item empty-star';
      star.textContent = '⭐';
      star.style.animationDelay = `${i * 0.15}s`;
      starsContainer.appendChild(star);
    }

    // Play fanfare
    audioManager.playSound('completion');
    
    // Narrate score in Thai or English
    const textTh = `ยินดีด้วยนะจ๊ะคนดี! หนูสะสมคะแนนได้ ${scoreVal} คะแนน! เก่งที่สุดเลย!`;
    const textEn = `Congratulations! You scored ${scoreVal} points! You are awesome!`;
    audioManager.speak(textTh, textEn);

    this.bindEvents();
  }

  bindEvents() {
    const playAgainBtn = document.getElementById('btn-play-again');
    const homeBtn = document.getElementById('btn-result-home');

    playAgainBtn.onclick = () => {
      audioManager.playSound('click');
      const gameId = state.get('activeGameId');
      if (gameId === GAME_IDS.MATH_JUMP_ANSWER) {
        navigateTo(SCREENS.GAME_SETUP);
      } else {
        navigateTo(SCREENS.CALIBRATION);
      }
    };

    homeBtn.onclick = () => {
      audioManager.playSound('click');
      navigateTo(SCREENS.HOME);
    };
  }
}

export const resultScreen = new ResultScreen();
