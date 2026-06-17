import { BaseGame } from '../core/base-game.js';
import { state } from '../../app/state.js';
import { inputAdapter } from '../core/input-adapter.js';
import { SCREENS, GAME_IDS, SUBJECTS } from '../../app/constants.js';
import { navigateTo } from '../../app/screen-machine.js';
import { audioManager } from '../../utils/audio-manager.js';
import { THAI_VOWEL_CONFIG as config } from './thai-vowel-config.js';
import { generateThaiVowelQuestion } from './thai-vowel-content.js';

class ThaiVowelBubbleGame extends BaseGame {
  constructor() {
    super(GAME_IDS.THAI_VOWEL_BUBBLE);
    this.config = config;
    this.resetState();
  }

  resetState() {
    this.score = 0;
    this.questionIdx = 0;
    this.timeLeft = this.config.defaultTimerSeconds;
    this.bubbles = [];
    this.currentQuestion = null;
    this.isTransitioning = false;
    this.usedVowelsHistory = [];
    this.timeAccumulator = 0;
    this.stateTimer = null;
    this.errorMessage = null;
  }

  start() {
    this.resetState();
    super.start();
    this.startQuestion();
    
    // Per-question timer interval
    this.stateTimer = this.setInterval(() => {
      if (this.isTransitioning || !state.get('gameRunning')) return;
      this.timeLeft--;
      if (this.timeLeft <= 0) {
        this.handleTimeout();
      }
    }, 1000);
  }

  stop() {
    super.stop();
    if (this.stateTimer) {
      this.clearInterval(this.stateTimer);
      this.stateTimer = null;
    }
  }

  startQuestion() {
    try {
      this.isTransitioning = false;
      const settings = state.get('gameSettings');
      const level = settings?.level || 'normal';
      
      this.timeLeft = this.config.difficulty[level].timePerQuestion;
      
      this.currentQuestion = generateThaiVowelQuestion(level, this.usedVowelsHistory);
      this.usedVowelsHistory.push(this.currentQuestion.choices.find(c => c.correct).vowel);
      
      this.bubbles = [];
      const W = this.config.canvasWidth;
      const H = this.config.canvasHeight;
      const spacing = W / 4;
      const positions = [spacing, spacing * 2, spacing * 3];
      
      this.currentQuestion.choices.forEach((choice, index) => {
        this.bubbles.push({
          vowel: choice.vowel,
          correct: choice.correct,
          x: positions[index],
          baseX: positions[index],
          y: -100 - Math.random() * 100, // Spawn above screen
          radius: this.config.bubbleBaseRadius,
          popped: false,
          popProgress: 0,
          phase: Math.random() * Math.PI * 2
        });
      });

      audioManager.speak(this.currentQuestion.prompt);
    } catch (err) {
      this.errorMessage = "startQuestion: " + err.message;
      console.error(err);
    }
  }

  handleBubblePop(bubble) {
    if (bubble.popped) return;
    bubble.popped = true;
    
    if (bubble.correct) {
      audioManager.playSound('correct');
      this.score += 10;
      state.set({ score: this.score });
      this.triggerNextQuestion(true);
    } else {
      audioManager.playSound('wrong');
    }
  }

  handleTimeout() {
    if (this.isTransitioning) return;
    this.isTransitioning = true;
    audioManager.playSound('incorrect');
    
    // Pop wrong ones, highlight correct
    this.bubbles.forEach(bubble => {
      if (!bubble.correct) bubble.popped = true;
    });

    this.setTimeout(() => this.triggerNextQuestion(false), 2000);
  }

  triggerNextQuestion(wasCorrect) {
    this.isTransitioning = true;
    this.questionIdx++;
    
    const settings = state.get('gameSettings');
    const level = settings?.level || 'normal';
    const totalQ = this.config.difficulty[level].questionCount;
    
    if (this.questionIdx >= totalQ) {
      this.setTimeout(() => this.endGame(), 1000);
    } else {
      this.setTimeout(() => this.startQuestion(), 2000); // Wait a bit before next wave
    }
  }

  endGame() {
    state.set({ 
      gameRunning: false,
      score: this.score 
    });
    this.stop();
    audioManager.playSound('completion');
    navigateTo(SCREENS.RESULTS);
  }

  update(dt, now) {
    try {
      if (this.errorMessage) return;
      if (!this.currentQuestion || this.isTransitioning) return;

      const settings = state.get('gameSettings');
      const level = settings?.level || 'normal';
      const speedMult = this.config.difficulty[level].speedMultiplier;
      
      const input = inputAdapter.getInput(now);
      const landmarks = input.landmarks;
      const wrists = [];
      if (landmarks) {
        const l = landmarks[15];
        const r = landmarks[16];
        const W = this.canvas.width;
        const H = this.canvas.height;
        
        if (l && l.visibility > 0.5) wrists.push({ x: (1 - l.x) * W, y: l.y * H });
        if (r && r.visibility > 0.5) wrists.push({ x: (1 - r.x) * W, y: r.y * H });
      }

      let allBubblesGone = true;

      this.bubbles.forEach(bubble => {
        if (bubble.popped) {
          bubble.popProgress += (dt * 60) * 0.05;
          return;
        }
        
        allBubblesGone = false;

        // Evasion logic for Hard mode
        if (this.config.difficulty[level].evasion && bubble.y >= this.config.bubbleTargetY) {
          bubble.baseX += Math.sin(now / 300 + bubble.phase) * this.config.bubbleEvasionSpeed * (dt * 60);
          
          // Clamp evasion to within reasonable bounds (±50px from original position)
          const originalX = (this.config.canvasWidth / 4) * (this.bubbles.indexOf(bubble) + 1);
          if (bubble.baseX < originalX - 50) bubble.baseX = originalX - 50;
          if (bubble.baseX > originalX + 50) bubble.baseX = originalX + 50;
        }

        // Move Y down until target
        if (bubble.y < this.config.bubbleTargetY) {
          bubble.y += this.config.bubbleSpeedBaseY * speedMult * (dt * 60);
        } else {
          bubble.y = this.config.bubbleTargetY;
        }
        
        bubble.phase += this.config.bubbleWobbleSpeed * (dt * 60);
        const wobbleX = Math.sin(bubble.phase) * this.config.bubbleWobbleAmount;
        const currentX = bubble.baseX + wobbleX;
        
        // Update bubble.x for drawing
        bubble.x = currentX;
        
        wrists.forEach(wrist => {
          const dx = currentX - wrist.x;
          const dy = bubble.y - wrist.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          
          if (dist < bubble.radius + 30) {
            this.handleBubblePop(bubble);
          }
        });
      });
    } catch (err) {
      this.errorMessage = "update: " + err.message;
      console.error(err);
    }
  }

  draw() {
    const ctx = this.ctx;
    const W = this.canvas.width;
    const H = this.canvas.height;
    const colors = this.config.colors;

    // Background gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 0, H);
    bgGrad.addColorStop(0, colors.bgGradientTop);
    bgGrad.addColorStop(1, colors.bgGradientBottom);
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, W, H);

    // Draw camera feed at low opacity
    if (state.get('cameraActive') && this.video && this.video.readyState === 4) {
      ctx.save();
      ctx.globalAlpha = 0.25;
      ctx.translate(W, 0);
      ctx.scale(-1, 1);
      ctx.drawImage(this.video, 0, 0, W, H);
      ctx.restore();
    }

    if (this.errorMessage) {
      ctx.fillStyle = 'red';
      ctx.font = 'bold 20px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(this.errorMessage, W / 2, H / 2);
      return;
    }

    if (!this.currentQuestion) return;

    // Header
    ctx.fillStyle = colors.header;
    ctx.fillRect(0, 0, W, 40);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 20px Outfit, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText("🫧 เป่าฟองสบู่สระไทย", 20, 28);

    const settings = state.get('gameSettings');
    const level = settings?.level || 'normal';
    const totalQ = this.config.difficulty[level].questionCount;
    ctx.textAlign = 'center';
    ctx.fillText(`ข้อ ${this.questionIdx + 1}/${totalQ}`, W / 2, 28);

    ctx.textAlign = 'right';
    ctx.fillStyle = '#ffe082';
    ctx.fillText(`⭐ ${this.score}`, W - 20, 28);

    // Timer
    ctx.textAlign = 'center';
    let timerColor = colors.timerNormal;
    if (this.timeLeft <= 3) timerColor = colors.timerDanger;
    else if (this.timeLeft <= 5) timerColor = colors.timerWarning;
    
    ctx.fillStyle = timerColor;
    ctx.font = 'bold 24px Outfit, sans-serif';
    ctx.fillText(`⏱️ ${Math.ceil(this.timeLeft)} วินาที`, W / 2, 80);

    // Draw Target Prompt
    ctx.fillStyle = colors.textDark;
    ctx.font = 'bold 36px Outfit, sans-serif';
    ctx.fillText(this.currentQuestion.prompt, W / 2, 130);
    
    // Draw Bubbles
    this.bubbles.forEach(bubble => {
      const currentX = bubble.x + Math.sin(bubble.phase) * this.config.bubbleWobbleAmount;
      
      if (bubble.popped) {
        // Pop animation
        if (bubble.popProgress < 1) {
          ctx.beginPath();
          ctx.arc(currentX, bubble.y, bubble.radius + (bubble.popProgress * 20), 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(255,255,255, ${1 - bubble.popProgress})`;
          ctx.lineWidth = 4;
          ctx.stroke();
          
          if (bubble.correct) {
            ctx.fillStyle = `rgba(76, 175, 80, ${1 - bubble.popProgress})`;
            ctx.font = 'bold 40px Arial';
            ctx.fillText('✔️', currentX, bubble.y + 15);
          } else {
            ctx.fillStyle = `rgba(244, 67, 54, ${1 - bubble.popProgress})`;
            ctx.font = 'bold 40px Arial';
            ctx.fillText('❌', currentX, bubble.y + 15);
          }
        }
        return;
      }

      // Draw bubble body
      ctx.beginPath();
      ctx.arc(currentX, bubble.y, bubble.radius, 0, Math.PI * 2);
      ctx.fillStyle = colors.bubbleFill;
      ctx.fill();
      ctx.lineWidth = 3;
      ctx.strokeStyle = colors.bubbleOutline;
      ctx.stroke();
      
      // Draw shine
      ctx.beginPath();
      ctx.arc(currentX - bubble.radius * 0.3, bubble.y - bubble.radius * 0.3, bubble.radius * 0.2, 0, Math.PI * 2);
      ctx.fillStyle = colors.bubbleHighlight;
      ctx.fill();

      // Draw text
      ctx.fillStyle = colors.textDark;
      ctx.font = 'bold 36px Outfit, sans-serif';
      ctx.fillText(bubble.vowel, currentX, bubble.y + 12);
    });

    // Draw wrists for debug/feedback
    const landmarks = inputAdapter.getInput(performance.now()).landmarks;
    if (landmarks) {
      const l = landmarks[15];
      const r = landmarks[16];
      ctx.fillStyle = 'rgba(255, 235, 59, 0.8)'; // Yellow indicator
      
      if (l && l.visibility > 0.5) {
        ctx.beginPath();
        ctx.arc((1 - l.x) * W, l.y * H, 15, 0, Math.PI * 2);
        ctx.fill();
      }
      if (r && r.visibility > 0.5) {
        ctx.beginPath();
        ctx.arc((1 - r.x) * W, r.y * H, 15, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }
}

export const thaiVowelBubbleGame = new ThaiVowelBubbleGame();
