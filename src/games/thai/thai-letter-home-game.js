import { BaseGame } from '../core/base-game.js';
import { inputAdapter } from '../core/input-adapter.js';
import { state } from '../../app/state.js';
import { navigateTo } from '../../app/screen-machine.js';
import { SCREENS, LEVELS, GAME_IDS, INPUT_MODES } from '../../app/constants.js';
import { audioManager } from '../../utils/audio-manager.js';
import { THAI_LETTER_HOME_CONFIG } from './thai-letter-home-config.js';
import { generateThaiLetterQuestion } from './thai-letter-home-content.js';

class ThaiLetterHomeGame extends BaseGame {
  constructor() {
    super(GAME_IDS.THAI_LETTER_HOME);
    this.config = THAI_LETTER_HOME_CONFIG;
    
    // Internal state
    this.currentQuestion = null;
    this.answered = false;
    this.transitioning = false;
    this.questionIdx = 0;
    this.timeLeft = 0;
    this.selectedSide = null; // keyboard: 'left' or 'right'
    this.lastAnswerTime = 0;
    this.feedbackTimer = 0;
    this.isSpeaking = false;
    this.usedLettersHistory = [];
    
    // Pose collision markers for debug display
    this.poseMarkers = { nose: null, leftWrist: null, rightWrist: null };
  }

  init(canvasElement, videoElement) {
    super.init(canvasElement, videoElement);
    // Overriding resolution for clean scaling
    this.canvas.width = this.config.canvasWidth;
    this.canvas.height = this.config.canvasHeight;
  }

  start() {
    // Reset global state
    state.set({
      gameRunning: true,
      score: 0,
      currentQuestionIdx: 0,
      correctAnswers: 0,
      wrongAnswers: 0,
      timeoutAnswers: 0,
      thaiAnswered: false,
      thaiAnswerResult: null
    });

    this.questionIdx = 0;
    this.usedLettersHistory = [];
    this.lastAnswerTime = 0;
    
    audioManager.speak("มาเล่นบ้านพยัญชนะ ก ถึง ฮ กันเถอะ", "Let's play Thai Letter Home!");
    
    this.isSpeaking = true;
    this.setTimeout(() => {
      this.isSpeaking = false;
      this.generateQuestion();
      super.start();
    }, 2500);
  }

  stop() {
    super.stop();
  }

  generateQuestion() {
    const settings = state.get('gameSettings');
    const level = settings.difficulty;
    
    this.currentQuestion = generateThaiLetterQuestion(level, this.usedLettersHistory);
    this.usedLettersHistory.push(this.currentQuestion.correctLetter);
    // Keep history small to allow repeating letters if needed in long sessions
    if (this.usedLettersHistory.length > 5) {
      this.usedLettersHistory.shift();
    }

    // Preload image if applicable
    if (this.currentQuestion.imageUrl) {
      if (!this.imageCache) this.imageCache = {};
      if (!this.imageCache[this.currentQuestion.imageUrl]) {
        const img = new Image();
        img.src = this.currentQuestion.imageUrl;
        this.imageCache[this.currentQuestion.imageUrl] = img;
      }
    }

    state.set({
      thaiQuestion: this.currentQuestion,
      thaiChoices: this.currentQuestion.choices,
      thaiCorrectLetter: this.currentQuestion.correctLetter,
      thaiSelectedChoice: null,
      thaiAnswered: false,
      thaiAnswerResult: null,
      thaiTimeLeft: settings.timerSeconds
    });

    this.timeLeft = settings.timerSeconds;
    this.answered = false;
    this.transitioning = false;
    this.selectedSide = null;
    this.poseMarkers = { nose: null, leftWrist: null, rightWrist: null };

    // Speak the question
    const qText = `${this.currentQuestion.word} อยู่บ้านตัวไหน`;
    audioManager.speak(qText, `Where is ${this.currentQuestion.word}?`);
    
    this.isSpeaking = true;
    this.setTimeout(() => {
      this.isSpeaking = false;
    }, 2500);
  }

  submitAnswer(side) {
    if (this.answered || this.transitioning) return;
    
    const now = Date.now();
    if (now - this.lastAnswerTime < this.config.answerCooldownMs) return;

    this.answered = true;
    this.lastAnswerTime = now;
    
    const choice = this.currentQuestion.choices.find(c => c.side === side);
    state.set({
      thaiSelectedChoice: choice,
      thaiAnswered: true
    });

    if (choice && choice.correct) {
      // Correct!
      audioManager.playSound('correct');
      audioManager.speak(`ถูกต้อง เก่งมาก ${this.currentQuestion.word} อยู่บ้าน ${this.currentQuestion.correctLetter}`);
      
      state.set({
        score: state.get('score') + 10,
        correctAnswers: state.get('correctAnswers') + 1,
        thaiAnswerResult: 'correct'
      });
    } else {
      // Wrong!
      audioManager.playSound('incorrect');
      audioManager.speak(`ไม่เป็นไรนะ ${this.currentQuestion.word} อยู่บ้าน ${this.currentQuestion.correctLetter}`);
      
      state.set({
        wrongAnswers: state.get('wrongAnswers') + 1,
        thaiAnswerResult: 'wrong'
      });
    }

    this.goNextQuestion();
  }

  handleTimeout() {
    if (this.answered || this.transitioning) return;
    
    this.answered = true;
    this.lastAnswerTime = Date.now();
    
    audioManager.playSound('incorrect');
    audioManager.speak(`หมดเวลาแล้วจ้า ${this.currentQuestion.word} อยู่บ้าน ${this.currentQuestion.correctLetter}`);
    
    state.set({
      timeoutAnswers: state.get('timeoutAnswers') + 1,
      thaiAnswered: true,
      thaiAnswerResult: 'timeout'
    });

    this.goNextQuestion();
  }

  goNextQuestion() {
    this.transitioning = true;
    this.feedbackTimer = this.config.questionTransitionMs / 1000;

    this.setTimeout(() => {
      this.transitioning = false;
      const settings = state.get('gameSettings');
      const maxQuestions = settings.questionCount || 5;
      
      this.questionIdx++;
      state.set({ currentQuestionIdx: this.questionIdx });

      if (this.questionIdx >= maxQuestions) {
        this.endGameSession();
      } else {
        this.generateQuestion();
      }
    }, this.config.questionTransitionMs);
  }

  endGameSession() {
    this.stop();
    audioManager.speak("เยี่ยมมาก เล่นครบแล้ว");
    
    // Save history
    const finalScore = state.get('score');
    const history = [...state.get('lastScores')];
    history.unshift({
      date: new Date().toLocaleDateString('th-TH'),
      score: finalScore,
      level: state.get('gameSettings').difficulty
    });
    if (history.length > 5) history.pop();
    
    state.set({ lastScores: history });
    navigateTo(SCREENS.RESULTS);
  }

  update(dt, now) {
    if (!this.answered && !this.transitioning && this.currentQuestion && !this.isSpeaking) {
      this.timeLeft -= dt;
      if (this.timeLeft <= 0) {
        this.timeLeft = 0;
        this.handleTimeout();
      } else {
        // Only update state occasionally to prevent too many events, but we keep local timeLeft precise
        state.set({ thaiTimeLeft: Math.ceil(this.timeLeft) });
      }
    }

    if (this.transitioning && this.feedbackTimer > 0) {
      this.feedbackTimer -= dt;
    }

    // Input handling
    if (!this.answered && !this.transitioning && this.currentQuestion && !this.isSpeaking) {
      const input = inputAdapter.getInput(now);

      if (input.inputMode === INPUT_MODES.POSE && input.landmarks) {
        const hitSide = this.getPoseHitSide(input.landmarks);
        if (hitSide) {
          this.submitAnswer(hitSide);
        }
      } else if (input.inputMode === INPUT_MODES.KEYBOARD) {
        if (input.keyboard.ArrowLeft) {
          this.selectedSide = 'left';
        } else if (input.keyboard.ArrowRight) {
          this.selectedSide = 'right';
        } else if (input.keyboard.Enter && this.selectedSide) {
          this.submitAnswer(this.selectedSide);
        }
      }
    }
  }

  getPoseHitSide(landmarks) {
    const w = this.canvas.width;
    const h = this.canvas.height;
    
    // Convert normalized landmarks to canvas coordinates
    // Important: Mediapipe coordinates x=0 is left, x=1 is right.
    // Because the video is mirrored during display, we must invert x.
    const getCoords = (lm) => ({ x: (1 - lm.x) * w, y: lm.y * h, visibility: lm.visibility || 0 });
    
    const nose = getCoords(landmarks[0]);
    const leftWrist = getCoords(landmarks[15]);
    const rightWrist = getCoords(landmarks[16]);
    
    this.poseMarkers.nose = nose;
    this.poseMarkers.leftWrist = leftWrist;
    this.poseMarkers.rightWrist = rightWrist;

    const points = [nose, leftWrist, rightWrist];
    const boxes = this.config.answerBoxes;

    for (const point of points) {
      if (point.visibility > 0.5) {
        if (this.pointInBox(point, boxes.left)) return 'left';
        if (this.pointInBox(point, boxes.right)) return 'right';
      }
    }
    return null;
  }

  pointInBox(point, box) {
    return point.x >= box.x && point.x <= box.x + box.width &&
           point.y >= box.y && point.y <= box.y + box.height;
  }

  // ----- Drawing Methods -----
  
  roundRect(ctx, x, y, width, height, radius) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
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

    // Draw camera feed at 25% opacity
    if (state.get('cameraActive') && this.video && this.video.readyState === this.video.HAVE_ENOUGH_DATA) {
      ctx.save();
      ctx.globalAlpha = 0.25;
      ctx.translate(W, 0);
      ctx.scale(-1, 1);
      ctx.drawImage(this.video, 0, 0, W, H);
      ctx.restore();
    }

    if (!this.currentQuestion) return;

    // --- Header bar ---
    ctx.fillStyle = colors.header;
    ctx.fillRect(0, 0, W, 40);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 20px Outfit, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText("🏠 บ้านพยัญชนะ ก-ฮ", 20, 28);

    ctx.textAlign = 'center';
    const totalQ = state.get('gameSettings')?.questionCount || 5;
    ctx.fillText(`ข้อ ${this.questionIdx + 1}/${totalQ}`, W / 2, 28);

    ctx.textAlign = 'right';
    ctx.fillStyle = '#ffe082';
    ctx.fillText(`⭐ ${state.get('score')}`, W - 20, 28);

    // --- Timer ---
    ctx.textAlign = 'center';
    let timerColor = colors.timerNormal;
    if (this.timeLeft <= 3) timerColor = colors.timerDanger;
    else if (this.timeLeft <= 5) timerColor = colors.timerWarning;
    
    ctx.fillStyle = timerColor;
    ctx.font = 'bold 24px Outfit, sans-serif';
    ctx.fillText(`⏱️ ${Math.ceil(this.timeLeft)} วินาที`, W / 2, 80);

    // --- Question central display ---
    if (this.currentQuestion.imageUrl) {
      const img = this.imageCache && this.imageCache[this.currentQuestion.imageUrl];
      if (img && img.complete) {
        // Draw image centered at W/2, Y: 360
        ctx.drawImage(img, W / 2 - 60, 300, 120, 120);
      }
    } else {
      ctx.fillStyle = colors.textDark;
      ctx.font = 'bold 100px Outfit, sans-serif';
      ctx.fillText(this.currentQuestion.emoji, W / 2, 380);
    }
    
    ctx.fillStyle = colors.textDark;
    ctx.font = 'bold 36px Outfit, sans-serif';
    ctx.fillText(this.currentQuestion.prompt, W / 2, 450);

    // --- Center divider ---
    ctx.setLineDash([8, 8]);
    ctx.strokeStyle = colors.divider;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(W / 2, 100);
    ctx.lineTo(W / 2, 280);
    ctx.stroke();
    ctx.setLineDash([]);

    // --- Answer boxes ---
    const boxes = this.config.answerBoxes;
    this.drawAnswerBox(ctx, boxes.left, this.currentQuestion.choices[0], 'left');
    this.drawAnswerBox(ctx, boxes.right, this.currentQuestion.choices[1], 'right');

    const isCameraMode = state.get('cameraReady') && state.get('cameraActive');
    
    // --- Keyboard selection indicator ---
    if (!isCameraMode && this.selectedSide && !this.answered) {
      const selBox = this.selectedSide === 'left' ? boxes.left : boxes.right;
      ctx.strokeStyle = '#ff9800';
      ctx.lineWidth = 6;
      ctx.setLineDash([]);
      this.roundRect(ctx, selBox.x - 6, selBox.y - 6, selBox.width + 12, selBox.height + 12, 16);
      ctx.stroke();
    }

    // --- Input Hints ---
    ctx.fillStyle = '#5d4037';
    ctx.font = '16px Outfit, sans-serif';
    ctx.textAlign = 'center';
    if (isCameraMode) {
      ctx.fillText("🏃 ยืนฝั่งซ้ายหรือขวา แล้วกระโดดแตะบ้านคำตอบ!", W / 2, H - 15);
    } else {
      ctx.fillText("⌨️ ใช้ลูกศร ซ้าย/ขวา เพื่อเลือกบ้าน แล้วกด Enter!", W / 2, H - 15);
    }

    // --- Feedback Banner ---
    if (this.answered && this.transitioning) {
      ctx.save();
      const barY = 200;
      const barHeight = 80;
      
      let bannerColor, bannerText;
      const result = state.get('thaiAnswerResult');
      if (result === 'correct') {
        bannerColor = 'rgba(0, 200, 83, 0.9)';
        bannerText = `✅ ถูกต้อง! บ้าน ${this.currentQuestion.correctLetter}`;
      } else if (result === 'wrong') {
        bannerColor = 'rgba(255, 23, 68, 0.9)';
        bannerText = `❌ ไม่เป็นไรนะ! คำตอบคือบ้าน ${this.currentQuestion.correctLetter}`;
      } else {
        bannerColor = 'rgba(244, 81, 30, 0.9)';
        bannerText = `⏰ หมดเวลา! คำตอบคือบ้าน ${this.currentQuestion.correctLetter}`;
      }

      ctx.fillStyle = bannerColor;
      ctx.fillRect(0, barY, W, barHeight);
      
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 36px Outfit, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(bannerText, W / 2, barY + barHeight / 2);
      ctx.restore();
    }

    // --- Debug Pose Markers ---
    if (state.get('debugSkeleton') && isCameraMode && !this.answered) {
      ctx.fillStyle = 'rgba(255, 0, 0, 0.7)';
      for (const key of ['nose', 'leftWrist', 'rightWrist']) {
        const marker = this.poseMarkers[key];
        if (marker && marker.visibility > 0.5) {
          ctx.beginPath();
          ctx.arc(marker.x, marker.y, 10, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }
  }

  drawAnswerBox(ctx, box, choice, side) {
    const colors = this.config.colors;
    let bgColor = side === 'left' ? colors.boxLeft : colors.boxRight;
    let borderColor = 'rgba(255,255,255,0.6)';

    if (this.answered) {
      if (choice.correct) {
        bgColor = colors.boxCorrect;
        borderColor = '#ffffff';
      } else {
        bgColor = state.get('thaiAnswerResult') === 'timeout' ? '#9e9e9e' : colors.boxWrong;
        borderColor = 'rgba(0,0,0,0.2)';
      }
    }

    ctx.save();
    
    // Draw Box Shadow
    ctx.shadowColor = 'rgba(0,0,0,0.3)';
    ctx.shadowBlur = 10;
    ctx.shadowOffsetY = 5;

    // Draw Box Background
    ctx.fillStyle = bgColor;
    this.roundRect(ctx, box.x, box.y, box.width, box.height, 16);
    ctx.fill();

    // Reset shadow for stroke
    ctx.shadowColor = 'transparent';
    ctx.lineWidth = 4;
    ctx.strokeStyle = borderColor;
    ctx.stroke();

    // Draw Roof Pattern (make it look like a house)
    ctx.fillStyle = 'rgba(0,0,0,0.1)';
    ctx.beginPath();
    ctx.moveTo(box.x, box.y + 40);
    ctx.lineTo(box.x + box.width / 2, box.y);
    ctx.lineTo(box.x + box.width, box.y + 40);
    ctx.fill();

    // Draw Letter Text
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 80px Outfit, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(choice.value, box.x + box.width / 2, box.y + box.height / 2 + 10);

    // Draw Side Helper
    ctx.font = '18px Outfit, sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    const helperText = side === 'left' ? '◀ ซ้าย' : 'ขวา ▶';
    ctx.fillText(helperText, box.x + box.width / 2, box.y + box.height + 25);

    ctx.restore();
  }
}

export const thaiLetterHomeGame = new ThaiLetterHomeGame();
