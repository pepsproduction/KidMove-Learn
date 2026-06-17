import { BaseGame } from '../core/base-game.js';
import { inputAdapter } from '../core/input-adapter.js';
import { navigateTo } from '../../app/screen-machine.js';
import { state } from '../../app/state.js';
import { SCREENS, GESTURES, LEVELS } from '../../app/constants.js';
import { FRUITS, getTargetRangeForLevel } from './math-content.js';
import { MATH_GAME_CONFIG } from './math-config.js';
import { audioManager } from '../../utils/audio-manager.js';
import { randomRange, randomIntRange, randomChoice } from '../../utils/random.js';
import { gestureEngine } from '../../camera/gesture-engine.js';

/**
 * FruitCountGame is the Math counting game.
 * It extends BaseGame and uses InputAdapter for unified, throttled gesture/keyboard inputs.
 */
class FruitCountGame extends BaseGame {
  constructor() {
    super('fruit-count');

    // Game objects
    this.basketX = MATH_GAME_CONFIG.canvasWidth / 2;
    this.basketTargetX = MATH_GAME_CONFIG.canvasWidth / 2;
    this.fruits = [];
    this.particles = [];
    
    // Spawning timer
    this.lastSpawnTime = 0;

    // Audio/Speech state
    this.hasAnnouncedQuestion = false;
    this.isQuestionTransitioning = false;
    this.transitionTimeout = null;
  }

  /**
   * Initializes the game by setting up canvas and inputs.
   */
  init(canvasElement, videoElement) {
    super.init(canvasElement, videoElement);
  }

  /**
   * Resets scores, clears active timers, generates the first question, and starts the game loop.
   */
  start() {
    state.set({
      gameRunning: true,
      score: 0,
      currentQuestionIdx: 0,
      fruitsPicked: 0
    });

    this.clearTimers();
    this.transitionTimeout = null;

    this.basketX = MATH_GAME_CONFIG.canvasWidth / 2;
    this.basketTargetX = MATH_GAME_CONFIG.canvasWidth / 2;
    this.fruits = [];
    this.particles = [];
    this.lastSpawnTime = 0;
    this.isQuestionTransitioning = false;
    
    this.generateQuestion();
    super.start();
  }

  /**
   * Stops the game loop and updates state.
   */
  stop() {
    super.stop();
    state.set({ gameRunning: false });
    this.transitionTimeout = null;
  }

  /**
   * Generates a new random counting question based on the selected difficulty level.
   */
  generateQuestion() {
    const currentIdx = state.get('currentQuestionIdx');
    if (currentIdx >= MATH_GAME_CONFIG.questionsPerSession) {
      this.endGameSession();
      return;
    }

    const level = state.get('level');
    const range = getTargetRangeForLevel(level);
    const targetCount = randomIntRange(range.min, range.max);
    const fruitType = randomChoice(FRUITS);

    state.set({
      questionTarget: targetCount,
      questionFruit: fruitType,
      fruitsPicked: 0
    });

    this.fruits = [];
    this.hasAnnouncedQuestion = false;
    
    // Announce via TTS in Thai or English
    const textTh = `ข้อที่ ${currentIdx + 1}! ช่วยเก็บ ${fruitType.name} ${targetCount} ลูก ให้ทีนะจ๊ะ`;
    const textEn = `Question number ${currentIdx + 1}! Please collect ${targetCount} ${targetCount > 1 ? fruitType.nameEnPlural : fruitType.nameEn} for me.`;
    audioManager.speak(textTh, textEn);

    // Pause fruit spawning while speaking
    this.isSpeaking = true;
    this.setTimeout(() => {
      this.isSpeaking = false;
    }, 3500);
  }

  /**
   * Wraps up the game session, saves final score to history, and transitions to results screen.
   */
  endGameSession() {
    this.stop();
    
    // Save score to local history
    const finalScore = state.get('score');
    const history = [...state.get('lastScores')];
    history.unshift({
      date: new Date().toLocaleDateString('th-TH'),
      score: finalScore,
      level: state.get('level')
    });
    // Keep last 5 entries
    if (history.length > 5) history.pop();
    
    state.set({
      lastScores: history
    });

    navigateTo(SCREENS.RESULTS);
  }

  /**
   * Skips the current question, resets transition states, and generates a new question.
   */
  skipQuestion() {
    if (this.transitionTimeout) {
      this.clearTimeout(this.transitionTimeout);
      this.transitionTimeout = null;
    }
    this.isQuestionTransitioning = false;
    const currentIdx = state.get('currentQuestionIdx');
    state.set({ currentQuestionIdx: currentIdx + 1 });
    this.generateQuestion();
  }

  /**
   * Frame-by-frame physics and logic update.
   * Uses inputAdapter and calculates using delta-time (dt) for framerate independence.
   */
  update(dt, now) {
    // 1. Process inputs via inputAdapter
    const input = inputAdapter.getInput(now);

    // Horizontal Movement based on Leaning Offset from pose
    if (input.inputMode === 'pose' && input.landmarks && gestureEngine.baselines.initialized) {
      const midX = (input.landmarks[11].x + input.landmarks[12].x) / 2;
      const diff = midX - gestureEngine.baselines.shoulderMidX;
      
      // Mirror mapping: leaning right (smaller X on mirrored view) -> move basket left
      const gain = 2.0; // speed/sensitivity modifier
      this.basketTargetX = MATH_GAME_CONFIG.canvasWidth / 2 - (diff * MATH_GAME_CONFIG.canvasWidth * gain);
    }

    // 2. Keyboard fallback controls
    const keyboardSpeed = MATH_GAME_CONFIG.basketSpeed * (dt / 0.0166);
    if (input.keyboard.ArrowLeft) {
      this.basketTargetX -= keyboardSpeed;
    }
    if (input.keyboard.ArrowRight) {
      this.basketTargetX += keyboardSpeed;
    }

    // Bind basket target within screen limits
    const halfWidth = MATH_GAME_CONFIG.basketWidth / 2;
    this.basketTargetX = Math.max(halfWidth, Math.min(MATH_GAME_CONFIG.canvasWidth - halfWidth, this.basketTargetX));

    // Smooth easing (remains frame-rate independent relative to target positioning)
    this.basketX += (this.basketTargetX - this.basketX) * MATH_GAME_CONFIG.basketSmoothFactor;

    // 3. Spawning Fruits
    if (!this.isQuestionTransitioning && !this.isSpeaking && (now - this.lastSpawnTime > MATH_GAME_CONFIG.spawnIntervalMs)) {
      this.spawnFruit();
      this.lastSpawnTime = now;
    }

    // 4. Update Fruits
    const basketY = MATH_GAME_CONFIG.canvasHeight - MATH_GAME_CONFIG.basketHeight - 20;
    const basketWidth = MATH_GAME_CONFIG.basketWidth;
    const basketHeight = MATH_GAME_CONFIG.basketHeight;

    const targetFruit = state.get('questionFruit');
    const targetCount = state.get('questionTarget');
    const currentPicked = state.get('fruitsPicked');

    // Read collection mode setting
    const collectMode = state.get('collectMode') || 'gesture';
    const currentGesture = input.gesture;
    const isHarvesting = (collectMode === 'auto' || currentGesture === GESTURES.RAISE_RIGHT || input.keyboard.Enter);

    for (let i = this.fruits.length - 1; i >= 0; i--) {
      const fruit = this.fruits[i];
      fruit.y += fruit.vy * (dt / 0.0166);
      fruit.wobble += fruit.wobbleSpeed * (dt / 0.0166);

      // Check boundary: fruit fell past screen bottom
      if (fruit.y - fruit.radius > MATH_GAME_CONFIG.canvasHeight) {
        this.fruits.splice(i, 1);
        continue;
      }

      // Check proximity for collection
      const dx = fruit.x - this.basketX;
      const dy = fruit.y - (basketY + basketHeight / 3);
      const distance = Math.sqrt(dx * dx + dy * dy);

      // Tag fruit as nearby
      fruit.isNear = (distance < MATH_GAME_CONFIG.collectionDistance);

      if (fruit.isNear && !this.isQuestionTransitioning) {
        // Child triggered collection gesture or press enter
        if (isHarvesting) {
          // Check if collected fruit matches target
          if (fruit.type.id === targetFruit.id) {
            const nextPicked = currentPicked + 1;
            state.set({ fruitsPicked: nextPicked });
            state.set({ score: state.get('score') + 10 });

            // Visual reward sparks
            this.createExplosion(fruit.x, fruit.y, fruit.type.color);
            audioManager.playSound('pick');

            // Remove fruit
            this.fruits.splice(i, 1);

            if (nextPicked === targetCount) {
              // Level objective complete!
              audioManager.playSound('correct');
              audioManager.speak("เก่งมากจ้า! ครบแล้ว!", "Well done! That is correct!");
              
              // Sparkle effect
              for (let p = 0; p < 25; p++) {
                this.createExplosion(MATH_GAME_CONFIG.canvasWidth / 2, MATH_GAME_CONFIG.canvasHeight / 2, '#ffcc00');
              }

              // Delay shortly then load next question smoothly without stopping loop
              this.isQuestionTransitioning = true;
              this.transitionTimeout = this.setTimeout(() => {
                this.transitionTimeout = null;
                // Check if screen changed while waiting
                if (state.get('currentScreen') !== SCREENS.GAME_PLAY) return;

                this.isQuestionTransitioning = false;
                const currentIdx = state.get('currentQuestionIdx');
                state.set({ currentQuestionIdx: currentIdx + 1 });
                this.generateQuestion();
              }, 3500);
              break;
            } else if (nextPicked > targetCount) {
              // Collected too many!
              audioManager.playSound('incorrect');
              audioManager.speak("ลองใหม่นะ อีกนิดเดียวจ้า", "Try again! You are so close.");
              state.set({ fruitsPicked: 0 }); // Reset count for this question friendly fallback
              this.fruits = [];
            }
          } else {
            // Decoy fruit picked
            audioManager.playSound('incorrect');
            audioManager.speak(`นี่คือ ${fruit.type.name} จ้า ลองหา ${targetFruit.name} นะคนเก่ง`, `This is an ${fruit.type.nameEn}! Look for the ${targetFruit.nameEn}, superstar!`);
            // Just push fruit away (no penalty, friendly game)
            fruit.vy = -3.5; // bounce up
            fruit.vx = randomRange(-4, 4);
          }
        }
      }

      // Update lateral speeds for bounced decoys
      if (fruit.vx) {
        fruit.x += fruit.vx * (dt / 0.0166);
        // bounce walls
        if (fruit.x - fruit.radius < 0 || fruit.x + fruit.radius > MATH_GAME_CONFIG.canvasWidth) {
          fruit.vx *= -1;
        }
      }
    }

    // 5. Update Particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx * (dt / 0.0166);
      p.y += p.vy * (dt / 0.0166);
      p.alpha -= p.decay * (dt / 0.0166);
      if (p.alpha <= 0) {
        this.particles.splice(i, 1);
      }
    }
  }

  /**
   * Spawns a fruit at the top of the canvas.
   */
  spawnFruit() {
    const targetFruit = state.get('questionFruit');
    if (!targetFruit) return;

    // 60% chance to spawn target fruit, 40% decoy
    let fruitType = targetFruit;
    if (Math.random() > 0.6) {
      const decoys = FRUITS.filter(f => f.id !== targetFruit.id);
      fruitType = randomChoice(decoys);
    }

    const radius = MATH_GAME_CONFIG.fruitRadius;
    const x = randomRange(radius + 20, MATH_GAME_CONFIG.canvasWidth - radius - 20);
    const y = -radius;
    const vy = MATH_GAME_CONFIG.baseFallSpeed + randomRange(0, MATH_GAME_CONFIG.fallSpeedVariance);

    this.fruits.push({
      x,
      y,
      vx: 0,
      vy,
      radius,
      type: fruitType,
      wobble: randomRange(0, Math.PI * 2),
      wobbleSpeed: randomRange(0.02, 0.05),
      isNear: false
    });
  }

  /**
   * Spawns a reward explosion particles.
   */
  createExplosion(x, y, color) {
    const count = 12;
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 / count) * i + randomRange(-0.2, 0.2);
      const speed = randomRange(2, 6);
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color,
        alpha: 1.0,
        decay: randomRange(0.02, 0.05),
        size: randomRange(6, 12)
      });
    }
  }

  /**
   * Game drawing step. Renders the graphics, overlays, and counts.
   */
  draw() {
    // 1. Clear Screen with Sky blue gradient
    const skyGrad = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
    skyGrad.addColorStop(0, '#e7f5ff'); // light blue
    skyGrad.addColorStop(1, '#a5d8ff');
    this.ctx.fillStyle = skyGrad;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // 2. Draw Mirrored Camera background if active
    if (state.get('cameraActive') && this.video.readyState === this.video.HAVE_ENOUGH_DATA) {
      this.ctx.save();
      this.ctx.globalAlpha = 0.25; // light background blend
      this.ctx.translate(this.canvas.width, 0);
      this.ctx.scale(-1, 1);
      this.ctx.drawImage(this.video, 0, 0, this.canvas.width, this.canvas.height);
      this.ctx.restore();
    }

    // Draw green cartoon grass at the bottom
    this.ctx.fillStyle = '#51cf66'; // nice grass green
    this.ctx.beginPath();
    this.ctx.ellipse(this.canvas.width / 2, this.canvas.height + 40, this.canvas.width * 0.7, 100, 0, 0, Math.PI * 2);
    this.ctx.fill();

    // 3. Draw Fruits
    this.fruits.forEach(fruit => {
      this.ctx.save();
      
      // Add a slight side-to-side wobble
      const wobbleX = Math.sin(fruit.wobble) * 8;
      this.ctx.translate(fruit.x + wobbleX, fruit.y);
      
      // Draw glow if basket is close to the fruit
      if (fruit.isNear) {
        this.ctx.beginPath();
        this.ctx.arc(0, 0, fruit.radius + 8, 0, Math.PI * 2);
        this.ctx.fillStyle = 'rgba(255, 230, 0, 0.5)';
        this.ctx.fill();
      }

      // Draw shadow
      this.ctx.beginPath();
      this.ctx.ellipse(0, fruit.radius - 2, fruit.radius * 0.7, 6, 0, 0, Math.PI * 2);
      this.ctx.fillStyle = 'rgba(0,0,0,0.15)';
      this.ctx.fill();

      // Draw main fruit circular backing
      this.ctx.beginPath();
      this.ctx.arc(0, 0, fruit.radius, 0, Math.PI * 2);
      this.ctx.fillStyle = fruit.type.color;
      this.ctx.fill();
      this.ctx.lineWidth = 3;
      this.ctx.strokeStyle = '#ffffff';
      this.ctx.stroke();

      // Render Emoji symbol
      this.ctx.font = `${fruit.radius * 1.1}px sans-serif`;
      this.ctx.textAlign = 'center';
      this.ctx.textBaseline = 'middle';
      this.ctx.fillText(fruit.type.emoji, 0, 2);

      // If nearby, render helper prompt bubble for child
      if (fruit.isNear && !this.isQuestionTransitioning) {
        const collectMode = state.get('collectMode') || 'gesture';
        const tipText = collectMode === 'auto' ? '✅ ตรงกันเลย!' : '🙋 ยกมือขวาเลย!';

        this.ctx.restore();
        this.ctx.save();
        this.ctx.translate(fruit.x + wobbleX, fruit.y - fruit.radius - 25);
        this.ctx.fillStyle = collectMode === 'auto' ? '#2f9e44' : '#ff8787';
        this.ctx.beginPath();
        this.ctx.roundRect(-60, -16, 120, 28, 8);
        this.ctx.fill();
        this.ctx.strokeStyle = '#ffffff';
        this.ctx.stroke();
        
        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = "bold 13px 'Inter', sans-serif";
        this.ctx.textAlign = 'center';
        this.ctx.fillText(tipText, 0, 3);
      }

      this.ctx.restore();
    });

    // 4. Draw Particles
    this.particles.forEach(p => {
      this.ctx.save();
      this.ctx.globalAlpha = p.alpha;
      this.ctx.fillStyle = p.color;
      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, p.size / 2, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.restore();
    });

    // 5. Draw Basket
    const basketY = this.canvas.height - MATH_GAME_CONFIG.basketHeight - 20;
    const basketWidth = MATH_GAME_CONFIG.basketWidth;
    const basketHeight = MATH_GAME_CONFIG.basketHeight;

    this.ctx.save();
    this.ctx.translate(this.basketX, basketY + basketHeight / 2);

    // Basket shadow
    this.ctx.beginPath();
    this.ctx.ellipse(0, basketHeight / 2, basketWidth * 0.55, 12, 0, 0, Math.PI * 2);
    this.ctx.fillStyle = 'rgba(0,0,0,0.18)';
    this.ctx.fill();

    // Basket wood container base
    this.ctx.fillStyle = '#b78657'; // light wooden color
    this.ctx.beginPath();
    this.ctx.roundRect(-basketWidth / 2, -basketHeight / 2, basketWidth, basketHeight, [5, 5, 20, 20]);
    this.ctx.fill();
    this.ctx.lineWidth = 4;
    this.ctx.strokeStyle = '#6d4c41'; // dark brown frame
    this.ctx.stroke();

    // Wicker grid detail
    this.ctx.strokeStyle = 'rgba(109, 76, 65, 0.4)';
    this.ctx.lineWidth = 3;
    for (let x = -basketWidth / 2 + 15; x < basketWidth / 2; x += 20) {
      this.ctx.beginPath();
      this.ctx.moveTo(x, -basketHeight / 2 + 5);
      this.ctx.lineTo(x + 5, basketHeight / 2 - 5);
      this.ctx.stroke();
    }
    
    // Draw collected fruits stacking inside basket visually
    const currentPicked = state.get('fruitsPicked');
    const targetFruit = state.get('questionFruit');
    if (targetFruit) {
      for (let f = 0; f < Math.min(currentPicked, 10); f++) {
        const row = Math.floor(f / 4);
        const col = f % 4;
        const fx = -basketWidth / 3 + col * (basketWidth / 5.5) + randomRange(-3, 3);
        const fy = basketHeight / 4 - row * 18 - 8;
        
        this.ctx.font = '24px sans-serif';
        this.ctx.fillText(targetFruit.emoji, fx, fy);
      }
    }

    // Red ribbon banner label on basket front
    this.ctx.fillStyle = '#ff6b6b';
    this.ctx.beginPath();
    this.ctx.roundRect(-basketWidth * 0.4, 6, basketWidth * 0.8, 22, 6);
    this.ctx.fill();
    this.ctx.strokeStyle = '#ffffff';
    this.ctx.lineWidth = 2;
    this.ctx.stroke();

    this.ctx.fillStyle = '#ffffff';
    this.ctx.font = "bold 13px 'Inter', sans-serif";
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    this.ctx.fillText("ตะกร้าของหนู", 0, 17);

    this.ctx.restore();

    // 6. Draw HUD overlay labels
    const targetFruitItem = state.get('questionFruit');
    const targetCount = state.get('questionTarget');
    const picked = state.get('fruitsPicked');
    const questionIdx = state.get('currentQuestionIdx');

    if (targetFruitItem) {
      // Question block
      this.ctx.save();
      this.ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
      this.ctx.beginPath();
      this.ctx.roundRect(20, 20, 320, 80, 15);
      this.ctx.fill();
      this.ctx.strokeStyle = '#ff9244';
      this.ctx.lineWidth = 3;
      this.ctx.stroke();

      this.ctx.fillStyle = '#495057';
      this.ctx.font = "bold 16px 'Inter', sans-serif";
      this.ctx.fillText(`ข้อที่ ${questionIdx + 1} / 5`, 35, 45);

      this.ctx.fillStyle = '#e8590c';
      this.ctx.font = "bold 26px 'Inter', sans-serif";
      this.ctx.fillText(`เก็บ ${targetFruitItem.name} ${targetCount} ลูก`, 35, 80);
      
      this.ctx.font = "32px sans-serif";
      this.ctx.fillText(targetFruitItem.emoji, 280, 75);
      this.ctx.restore();

      // Fruits counter status circles
      this.ctx.save();
      const maxAvailableWidth = 260; 
      let gap = 36;
      let radius = 22;
      let emojiFontSize = 22;
      let numberFontSize = 14;
      
      let totalWidth = (targetCount - 1) * gap;
      if (totalWidth > maxAvailableWidth) {
        gap = maxAvailableWidth / (targetCount - 1);
        radius = Math.max(14, gap * 0.55);
        emojiFontSize = Math.max(14, radius * 1.0);
        numberFontSize = Math.max(10, radius * 0.65);
      }
      
      // Center the circles in the space between X=340 and X=640 (midpoint is 490)
      const startX = 340 + (300 - (targetCount - 1) * gap) / 2;
      const startY = 60;
      
      for (let c = 0; c < targetCount; c++) {
        const cx = startX + c * gap;
        const cy = startY;
        
        // Draw circles
        this.ctx.beginPath();
        this.ctx.arc(cx, cy, radius, 0, Math.PI * 2);
        
        if (c < picked) {
          // Collected item
          this.ctx.fillStyle = '#ffd43b'; // yellow glow
          this.ctx.fill();
          this.ctx.strokeStyle = '#ff922b';
          this.ctx.lineWidth = 3;
          this.ctx.stroke();
          
          this.ctx.font = `${Math.floor(emojiFontSize)}px sans-serif`;
          this.ctx.textAlign = 'center';
          this.ctx.textBaseline = 'middle';
          this.ctx.fillText(targetFruitItem.emoji, cx, cy);
        } else {
          // Empty placeholder circle
          this.ctx.fillStyle = 'rgba(255,255,255,0.6)';
          this.ctx.fill();
          this.ctx.strokeStyle = 'rgba(0,0,0,0.15)';
          this.ctx.lineWidth = 2;
          this.ctx.stroke();
          
          this.ctx.fillStyle = 'rgba(0,0,0,0.25)';
          this.ctx.font = `bold ${Math.floor(numberFontSize)}px sans-serif`;
          this.ctx.textAlign = 'center';
          this.ctx.textBaseline = 'middle';
          this.ctx.fillText(`${c + 1}`, cx, cy);
        }
      }
      this.ctx.restore();
    }

    // Active score and stars on top right
    this.ctx.save();
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    this.ctx.beginPath();
    this.ctx.roundRect(this.canvas.width - 160, 20, 140, 48, 10);
    this.ctx.fill();
    this.ctx.strokeStyle = '#ffd43b';
    this.ctx.lineWidth = 2.5;
    this.ctx.stroke();

    this.ctx.fillStyle = '#f59f00';
    this.ctx.font = "bold 18px 'Inter', sans-serif";
    this.ctx.textBaseline = 'middle';
    this.ctx.fillText("⭐ คะแนน:", this.canvas.width - 148, 44);
    this.ctx.fillStyle = '#495057';
    this.ctx.font = "bold 22px 'Inter', sans-serif";
    this.ctx.fillText(state.get('score').toString(), this.canvas.width - 65, 45);
    this.ctx.restore();

    // Draw active gesture indicator for the teacher to verify control feedback
    const activeGesture = state.get('currentGesture');
    if (activeGesture && activeGesture !== GESTURES.NEUTRAL) {
      this.ctx.save();
      this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
      this.ctx.beginPath();
      this.ctx.roundRect(this.canvas.width - 200, this.canvas.height - 42, 180, 26, 6);
      this.ctx.fill();
      
      this.ctx.fillStyle = '#ffffff';
      this.ctx.font = "12px 'Inter', sans-serif";
      this.ctx.textAlign = 'center';
      this.ctx.fillText(`ท่าทาง: ${activeGesture}`, this.canvas.width - 110, this.canvas.height - 25);
      this.ctx.restore();
    }
  }
}

export const fruitCountGame = new FruitCountGame();
