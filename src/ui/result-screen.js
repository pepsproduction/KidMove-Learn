import { state } from '../app/state.js';
import { SCREENS } from '../app/constants.js';
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
    document.getElementById('result-score-val').textContent = scoreVal;

    // Determine how many stars to award (10 points per question, max 50 points)
    // 50 pts = 5 stars, 40 pts = 4 stars, etc.
    const starCount = Math.max(1, Math.min(5, Math.ceil(scoreVal / 10)));
    
    const starsContainer = document.getElementById('result-stars');
    starsContainer.innerHTML = '';
    
    for (let i = 0; i < 5; i++) {
      const star = document.createElement('span');
      star.className = i < starCount ? 'star-item filled-star' : 'star-item empty-star';
      star.textContent = '⭐';
      // Add staggered animation delay
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
      navigateTo(SCREENS.CALIBRATION);
    };

    homeBtn.onclick = () => {
      audioManager.playSound('click');
      navigateTo(SCREENS.HOME);
    };
  }
}

export const resultScreen = new ResultScreen();
