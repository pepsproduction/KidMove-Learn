import { state } from '../app/state.js';
import { SCREENS, SUBJECTS } from '../app/constants.js';
import { navigateTo } from '../app/screen-machine.js';
import { audioManager } from '../utils/audio-manager.js';
import { randomRange } from '../utils/random.js';

class PreviewScreen {
  constructor() {
    this.container = null;
    this.animationId = null;
    this.subject = null;
    
    // Sandbox game variables
    this.mascotX = 200;
    this.mascotTargetX = 200;
    this.stars = [];
    this.starsCollected = 0;
    
    this.keys = {
      ArrowLeft: false,
      ArrowRight: false
    };

    this.handleKeyDown = this.handleKeyDown.bind(this);
    this.handleKeyUp = this.handleKeyUp.bind(this);
  }

  init(containerElement) {
    this.container = containerElement;
    
    // Subscribe to screen changes
    state.subscribe('currentScreen', (screen) => {
      if (screen === SCREENS.PREVIEW) {
        this.subject = state.get('activeSubject');
        this.render();
        this.bindEvents();
        this.startSandbox();
      } else {
        this.stopSandbox();
      }
    });

    window.addEventListener('keydown', this.handleKeyDown);
    window.addEventListener('keyup', this.handleKeyUp);
  }

  destroy() {
    window.removeEventListener('keydown', this.handleKeyDown);
    window.removeEventListener('keyup', this.handleKeyUp);
    this.stopSandbox();
  }

  handleKeyDown(e) {
    if (state.get('currentScreen') !== SCREENS.PREVIEW) return;
    if (e.key === 'ArrowLeft') this.keys.ArrowLeft = true;
    if (e.key === 'ArrowRight') this.keys.ArrowRight = true;
  }

  handleKeyUp(e) {
    if (state.get('currentScreen') !== SCREENS.PREVIEW) return;
    if (e.key === 'ArrowLeft') this.keys.ArrowLeft = false;
    if (e.key === 'ArrowRight') this.keys.ArrowRight = false;
  }

  getContent() {
    if (this.subject === SUBJECTS.THAI) {
      return {
        title: "🇹🇭 วิชาภาษาไทย (Coming Soon!)",
        subtitle: "ฝึกฝนภาษาไทยผ่านการเคลื่อนไหวแสนสนุก",
        desc: "เด็ก ๆ จะได้เรียนรู้พยัญชนะไทย สระ วรรณยุกต์ และการประสมคำเบื้องต้นโดยการออกกำลังกาย",
        games: [
          {
            title: "🎈 เกมเป่าฟองพยัญชนะ ก-ฮ (Bubble Pop)",
            detail: "เด็ก ๆ เอียงตัวซ้าย-ขวาเพื่อเป่าพัดลม และยกสองมือเพื่อทำฟองสบู่ให้แตกตามเสียงพยัญชนะที่คุณครูบอก!"
          },
          {
            title: "🧩 เกมประกอบร่าง สระ-สะกด (Word Combine)",
            detail: "เด็กเอียงตัวเก็บ สระ และ พยัญชนะสะกด ที่ลอยลงมาให้ครบถ้วนเพื่อต่อสู้ด่านสัตว์ร้ายสะกดคำ!"
          }
        ],
        storageKey: 'voted_thai'
      };
    } else {
      return {
        title: "🔤 วิชาภาษาอังกฤษ (Coming Soon!)",
        subtitle: "เรียนรู้คำศัพท์ภาษาอังกฤษผ่านท่าทางการเคลื่อนไหว",
        desc: "เด็ก ๆ จะได้เรียนรู้คำศัพท์ภาษาอังกฤษพื้นฐาน เช่น สัตว์ ผลไม้ รูปทรง และสะกดคำง่าย ๆ ผ่านการขยับร่างกาย",
        games: [
          {
            title: "🧺 เกมสะกดคำผลไม้หลากสี (Word Catch)",
            detail: "เก็บตัวอักษรภาษาอังกฤษที่หล่นลงมาตามลำดับเพื่อสะกดคำศัพท์ (เช่น D - O - G) และระวังตัวอักษรที่ผิดนะจ๊ะ!"
          },
          {
            title: "🧭 เกมเรือใบนำทางคำศัพท์ (Compass Run)",
            detail: "เอียงตัวซ้าย-ขวาและย่อตัวลงเพื่อควบคุมเรือใบไปเก็บกล่องสมบัติคำแปลที่ถูกต้องบนแผนที่!"
          }
        ],
        storageKey: 'voted_english'
      };
    }
  }

  render() {
    const data = this.getContent();
    const isVoted = localStorage.getItem(data.storageKey) === 'true';

    this.container.innerHTML = `
      <div class="preview-layout-wrapper">
        <button id="btn-preview-back" class="btn-back">⬅ ย้อนกลับ</button>
        
        <h2 class="screen-title">${data.title}</h2>
        <p class="preview-subtitle">${data.subtitle}</p>

        <div class="preview-grid">
          <!-- Left side: Description and Games Info -->
          <div class="preview-info-panel">
            <p class="preview-intro-desc">${data.desc}</p>
            
            <div class="upcoming-games-list">
              <h4>🎯 เกมที่กำลังจะมาถึง:</h4>
              ${data.games.map(g => `
                <div class="upcoming-game-card">
                  <h5>${g.title}</h5>
                  <p>${g.detail}</p>
                </div>
              `).join('')}
            </div>

            <!-- Voting system -->
            <div class="vote-action-box">
              <p class="vote-prompt">💡 คุณครูหรือผู้ปกครองอยากเล่นวิชานี้เป็นวิชาถัดไปใช่ไหม?</p>
              <button id="btn-vote-subject" class="btn btn-medium ${isVoted ? 'btn-teal' : 'btn-orange'}" ${isVoted ? 'disabled' : ''}>
                ${isVoted ? '✔️ โหวตสำเร็จแล้ว! ขอบพระคุณค่ะ' : '👍 โหวตวิชานี้เลย!'}
              </button>
            </div>
          </div>

          <!-- Right side: Sandbox Sandbox Preview -->
          <div class="preview-sandbox-panel">
            <h4>🐰 ห้องซ้อมขยับตัว (Mascot Sandbox)</h4>
            <p class="sandbox-instructions">เอียงตัวซ้าย-ขวา หรือใช้ปุ่มลูกศร ⬅ ➡️ เพื่อพาเจ้ากระต่ายไปเก็บดาวนำโชค!</p>
            
            <div class="sandbox-canvas-wrapper">
              <canvas id="preview-sandbox-canvas" width="400" height="280"></canvas>
              <div id="sandbox-counter" class="sandbox-stars-count">⭐ สะสมดาว: ${this.starsCollected} ดวง</div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  bindEvents() {
    const backBtn = document.getElementById('btn-preview-back');
    const voteBtn = document.getElementById('btn-vote-subject');
    const data = this.getContent();

    backBtn.addEventListener('click', () => {
      audioManager.playSound('click');
      navigateTo(SCREENS.SUBJECT_SELECT);
    });

    voteBtn.addEventListener('click', () => {
      audioManager.playSound('completion');
      localStorage.setItem(data.storageKey, 'true');
      voteBtn.textContent = '✔️ โหวตสำเร็จแล้ว! ขอบพระคุณค่ะ';
      voteBtn.className = 'btn btn-medium btn-teal';
      voteBtn.disabled = true;
      
      // Make a cute vocal appreciation
      audioManager.speak("ขอบพระคุณคุณครูสำหรับการโหวตนะจ๊ะ! ทีมงานจะรีบพัฒนาเลยจ้า", "Thank you teachers for voting! Our team will develop this soon.");
    });
  }

  startSandbox() {
    this.starsCollected = 0;
    this.stars = [];
    this.mascotX = 200;
    this.mascotTargetX = 200;
    
    const canvas = document.getElementById('preview-sandbox-canvas');
    if (!canvas) return;
    this.ctx = canvas.getContext('2d');
    
    // Spawn initial stars
    this.spawnSandboxStar();
    
    this.sandboxLoop();
  }

  stopSandbox() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }

  spawnSandboxStar() {
    this.stars.push({
      x: randomRange(30, 370),
      y: -20,
      vy: randomRange(1.5, 3.0),
      size: randomRange(16, 24)
    });
  }

  sandboxLoop() {
    if (state.get('currentScreen') !== SCREENS.PREVIEW) return;

    this.updateSandbox();
    this.drawSandbox();

    this.animationId = requestAnimationFrame(() => this.sandboxLoop());
  }

  updateSandbox() {
    // 1. Fetch camera motion leaning
    if (state.get('cameraActive')) {
      // Read continuous offset if baseline calibrated
      const currentGesture = state.get('currentGesture');
      // If we are getting the gesture, move basket accordingly
      const moveSpeed = 6;
      if (currentGesture === 'lean-left') {
        this.mascotTargetX -= moveSpeed;
      } else if (currentGesture === 'lean-right') {
        this.mascotTargetX += moveSpeed;
      }
    }

    // 2. Keyboard backup
    const speed = 7;
    if (this.keys.ArrowLeft) this.mascotTargetX -= speed;
    if (this.keys.ArrowRight) this.mascotTargetX += speed;

    // Boundary check
    this.mascotTargetX = Math.max(25, Math.min(375, this.mascotTargetX));
    // Easing
    this.mascotX += (this.mascotTargetX - this.mascotX) * 0.2;

    // 3. Falling stars physics
    const canvas = document.getElementById('preview-sandbox-canvas');
    if (!canvas) return;

    if (Math.random() < 0.015 && this.stars.length < 3) {
      this.spawnSandboxStar();
    }

    const mascotY = canvas.height - 40;
    const mascotRadius = 25;

    for (let i = this.stars.length - 1; i >= 0; i--) {
      const s = this.stars[i];
      s.y += s.vy;

      // Check boundary
      if (s.y - s.size > canvas.height) {
        this.stars.splice(i, 1);
        continue;
      }

      // Proximity check (collision)
      const dx = s.x - this.mascotX;
      const dy = s.y - mascotY;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < mascotRadius + s.size / 2) {
        // Star caught!
        this.starsCollected++;
        audioManager.playSound('pick');
        
        // Update HTML score counter
        const counterEl = document.getElementById('sandbox-counter');
        if (counterEl) {
          counterEl.textContent = `⭐ สะสมดาว: ${this.starsCollected} ดวง`;
        }

        this.stars.splice(i, 1);
      }
    }
  }

  drawSandbox() {
    const canvas = document.getElementById('preview-sandbox-canvas');
    if (!canvas || !this.ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    // Draw sky background gradient
    const skyGrad = this.ctx.createLinearGradient(0, 0, 0, height);
    skyGrad.addColorStop(0, '#f3f0ff');
    skyGrad.addColorStop(1, '#e5dbff');
    this.ctx.fillStyle = skyGrad;
    this.ctx.fillRect(0, 0, width, height);

    // Draw green grass floor
    this.ctx.fillStyle = '#69db7c';
    this.ctx.beginPath();
    this.ctx.ellipse(width / 2, height + 15, width * 0.6, 40, 0, 0, Math.PI * 2);
    this.ctx.fill();

    // Draw stars
    this.stars.forEach(s => {
      this.ctx.save();
      this.ctx.translate(s.x, s.y);
      this.ctx.font = `${s.size}px sans-serif`;
      this.ctx.textAlign = 'center';
      this.ctx.textBaseline = 'middle';
      this.ctx.fillText('⭐', 0, 0);
      this.ctx.restore();
    });

    // Draw bunny mascot 🐰
    this.ctx.save();
    this.ctx.translate(this.mascotX, height - 35);

    // Bunny emoji rendering
    this.ctx.font = '36px sans-serif';
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    this.ctx.fillText('🐰', 0, 0);

    // Draw helper directional arrows under mascot
    this.ctx.font = '12px sans-serif';
    this.ctx.fillStyle = 'rgba(0,0,0,0.3)';
    this.ctx.fillText('⬅ เอียงตัว ➡️', 0, 24);

    this.ctx.restore();
  }
}

export const previewScreen = new PreviewScreen();
