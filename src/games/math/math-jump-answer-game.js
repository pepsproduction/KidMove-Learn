import { BaseGame } from '../core/base-game.js';
import { inputAdapter } from '../core/input-adapter.js';
import { navigateTo } from '../../app/screen-machine.js';
import { state } from '../../app/state.js';
import { SCREENS, LEVELS, GAME_IDS } from '../../app/constants.js';
import { MATH_JUMP_ANSWER_CONFIG } from './math-jump-answer-config.js';
import { generateMathJumpQuestion, getQuestionCountForLevel, numberToThai, operationToThai } from './math-jump-answer-content.js';
import { audioManager } from '../../utils/audio-manager.js';

class MathJumpAnswerGame extends BaseGame {
  constructor() {
    super(GAME_IDS.MATH_JUMP_ANSWER);
    this.config = MATH_JUMP_ANSWER_CONFIG;
    this.resetGameState();
  }

  resetGameState() {
    this.currentQuestion = null;
    this.questionIdx = 0;
    this.totalQuestions = 5;
    this.correctCount = 0;
    this.wrongCount = 0;
    this.timeoutCount = 0;
    this.score = 0;
    this.timeLeft = 10;
    this.timerSeconds = 10;
    this.answered = false;
    this.answerResult = null; // 'correct', 'wrong', 'timeout'
    this.transitioning = false;
    this.selectedSide = null; // keyboard: 'left' or 'right'
    this.lastAnswerTime = 0;
    this.feedbackTimer = 0;
    this.hasSpokenQuestion = false;
    this.isSpeaking = false; // Add state to pause timer during speech
    // Pose collision markers for debug display
    this.poseMarkers = { nose: null, leftWrist: null, rightWrist: null };
  }

  init(canvasElement, videoElement) {
    super.init(canvasElement, videoElement);
  }

  start() {
    this.resetGameState();

    // Read settings from state
    const settings = state.get('gameSettings');
    if (settings) {
      this.timerSeconds = settings.timerSeconds || this.config.defaultTimerSeconds;
      this.totalQuestions = settings.questionCount || getQuestionCountForLevel(LEVELS.EASY);
    } else {
      this.timerSeconds = this.config.defaultTimerSeconds;
      this.totalQuestions = getQuestionCountForLevel(state.get('level') || LEVELS.EASY);
    }

    state.set({
      gameRunning: true,
      score: 0,
      currentQuestionIdx: 0,
      correctAnswers: 0,
      wrongAnswers: 0,
      timeoutAnswers: 0
    });

    this.generateQuestion();
    super.start();
  }

  stop() {
    super.stop();
    state.set({ gameRunning: false });
  }

  generateQuestion() {
    if (this.questionIdx >= this.totalQuestions) {
      this.endGameSession();
      return;
    }

    const level = state.get('level') || LEVELS.EASY;
    this.currentQuestion = generateMathJumpQuestion(level);
    this.timeLeft = this.timerSeconds;
    this.answered = false;
    this.answerResult = null;
    this.transitioning = false;
    this.selectedSide = null;
    this.hasSpokenQuestion = false;
    this.feedbackTimer = 0;

    state.set({
      currentQuestionIdx: this.questionIdx,
      mathAnswered: false,
      mathAnswerResult: null,
      mathTimeLeft: this.timeLeft
    });

    // Speak the question
    const q = this.currentQuestion;
    const qNum = this.questionIdx + 1;
    const thaiText = `ข้อที่ ${qNum} ${numberToThai(q.a)} ${operationToThai(q.operation)} ${numberToThai(q.b)} เท่ากับเท่าไหร่`;
    audioManager.speak(thaiText, `Question ${qNum}: ${q.a} ${q.operation} ${q.b} equals what?`);
    this.hasSpokenQuestion = true;

    // Pause timer for 3.5 seconds while speaking
    this.isSpeaking = true;
    this.setTimeout(() => {
      this.isSpeaking = false;
    }, 3500);
  }

  submitAnswer(side) {
    if (this.answered || this.transitioning || !this.currentQuestion) return;

    // Cooldown check
    const now = performance.now();
    if (now - this.lastAnswerTime < this.config.answerCooldownMs) return;
    this.lastAnswerTime = now;

    this.answered = true;
    const choice = this.currentQuestion.choices.find(c => c.side === side);
    if (!choice) return;

    if (choice.correct) {
      this.score += 10;
      this.correctCount++;
      this.answerResult = 'correct';
      audioManager.playSound('correct');
      audioManager.speak('ถูกต้อง เก่งมาก!', 'Correct! Great job!');
    } else {
      this.wrongCount++;
      this.answerResult = 'wrong';
      audioManager.playSound('incorrect');
      const correctVal = this.currentQuestion.correctAnswer;
      audioManager.speak(
        `ไม่เป็นไรนะ คำตอบที่ถูกคือ ${numberToThai(correctVal)}`,
        `Not quite. The correct answer is ${correctVal}.`
      );
    }

    state.set({
      score: this.score,
      correctAnswers: this.correctCount,
      wrongAnswers: this.wrongCount,
      mathAnswered: true,
      mathAnswerResult: this.answerResult
    });

    this.goNextQuestionAfterDelay();
  }

  handleTimeout() {
    if (this.answered || this.transitioning) return;
    this.answered = true;
    this.timeoutCount++;
    this.answerResult = 'timeout';

    audioManager.speak('หมดเวลาแล้วจ้า ไปข้อต่อไปกันเลย', 'Time is up! Let\'s go to the next question.');

    state.set({
      timeoutAnswers: this.timeoutCount,
      mathAnswered: true,
      mathAnswerResult: 'timeout'
    });

    this.goNextQuestionAfterDelay();
  }

  goNextQuestionAfterDelay() {
    this.transitioning = true;
    this.feedbackTimer = this.config.questionTransitionMs / 1000;

    this.setTimeout(() => {
      this.questionIdx++;
      this.generateQuestion();
    }, this.config.questionTransitionMs);
  }

  endGameSession() {
    // Save score
    const lastScores = state.get('lastScores') || [];
    lastScores.unshift({
      date: new Date().toLocaleDateString('th-TH'),
      level: state.get('level'),
      score: this.score,
      game: 'math-jump-answer',
      correct: this.correctCount,
      wrong: this.wrongCount,
      timeout: this.timeoutCount
    });
    if (lastScores.length > 20) lastScores.length = 20;

    state.set({
      score: this.score,
      lastScores,
      correctAnswers: this.correctCount,
      wrongAnswers: this.wrongCount,
      timeoutAnswers: this.timeoutCount,
      totalQuestions: this.totalQuestions
    });

    audioManager.speak('เยี่ยมมาก เล่นครบแล้ว!', 'Amazing! You completed all questions!');

    this.setTimeout(() => {
      this.stop();
      navigateTo(SCREENS.RESULTS);
    }, 1500);
  }

  update(dt, now) {
    // Timer countdown
    if (!this.answered && !this.transitioning && this.currentQuestion && !this.isSpeaking) {
      this.timeLeft -= dt;
      if (this.timeLeft <= 0) {
        this.timeLeft = 0;
        this.handleTimeout();
      }
    }

    // Feedback timer countdown
    if (this.transitioning && this.feedbackTimer > 0) {
      this.feedbackTimer -= dt;
    }

    // Input handling
    if (!this.answered && !this.transitioning && this.currentQuestion && !this.isSpeaking) {
      const input = inputAdapter.getInput(now);

      if (input.inputMode === 'pose' && input.landmarks) {
        this.handlePoseInput(input.landmarks);
      } else {
        this.handleKeyboardInput(input.keyboard);
      }
    }
  }

  handlePoseInput(landmarks) {
    const nose = landmarks[0];
    const leftWrist = landmarks[15];
    const rightWrist = landmarks[16];
    const W = this.config.canvasWidth;
    const H = this.config.canvasHeight;

    // Store for debug drawing
    this.poseMarkers = {
      nose: nose ? { x: (1 - nose.x) * W, y: nose.y * H, vis: nose.visibility } : null,
      leftWrist: leftWrist ? { x: (1 - leftWrist.x) * W, y: leftWrist.y * H, vis: leftWrist.visibility } : null,
      rightWrist: rightWrist ? { x: (1 - rightWrist.x) * W, y: rightWrist.y * H, vis: rightWrist.visibility } : null
    };

    const boxes = this.config.answerBoxes;
    const minVis = 0.4;

    const checkCollision = (point, box) => {
      if (!point || point.vis < minVis) return false;
      return point.x >= box.x && point.x <= box.x + box.width &&
             point.y >= box.y && point.y <= box.y + box.height;
    };

    // Check all tracked points against both boxes
    // Camera is mirrored: landmark left wrist appears on screen right side
    // We already flipped x above with (1 - nose.x)
    const points = [this.poseMarkers.nose, this.poseMarkers.leftWrist, this.poseMarkers.rightWrist];

    for (const pt of points) {
      if (checkCollision(pt, boxes.left)) {
        this.submitAnswer('left');
        return;
      }
      if (checkCollision(pt, boxes.right)) {
        this.submitAnswer('right');
        return;
      }
    }
  }

  handleKeyboardInput(keys) {
    if (keys.ArrowLeft) {
      this.selectedSide = 'left';
    }
    if (keys.ArrowRight) {
      this.selectedSide = 'right';
    }
    if (keys.Enter && this.selectedSide) {
      this.submitAnswer(this.selectedSide);
    }
  }

  draw() {
    const ctx = this.ctx;
    const W = this.config.canvasWidth;
    const H = this.config.canvasHeight;
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
    ctx.fillStyle = 'rgba(1, 87, 155, 0.9)';
    ctx.fillRect(0, 0, W, 40);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 16px Outfit, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`กระโดดตอบบวกลบ`, 15, 27);

    ctx.textAlign = 'center';
    ctx.fillText(`ข้อ ${this.questionIdx + 1}/${this.totalQuestions}`, W / 2, 27);

    ctx.textAlign = 'right';
    ctx.fillText(`⭐ ${this.score} คะแนน`, W - 15, 27);

    // --- Timer bar ---
    const timerRatio = Math.max(0, this.timeLeft / this.timerSeconds);
    const timerBarY = 42;
    const timerBarH = 10;
    ctx.fillStyle = '#e0e0e0';
    ctx.fillRect(0, timerBarY, W, timerBarH);

    let timerColor = colors.timerNormal;
    if (timerRatio < 0.3) timerColor = colors.timerDanger;
    else if (timerRatio < 0.6) timerColor = colors.timerWarning;
    ctx.fillStyle = timerColor;
    ctx.fillRect(0, timerBarY, W * timerRatio, timerBarH);

    // Timer text
    ctx.fillStyle = colors.textDark;
    ctx.font = 'bold 14px Outfit, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`⏱ ${Math.ceil(this.timeLeft)} วินาที`, W / 2, timerBarY + timerBarH + 18);

    // --- Question text ---
    ctx.fillStyle = colors.textDark;
    ctx.font = 'bold 64px Outfit, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(this.currentQuestion.text, W / 2, 360);

    // --- Answer boxes ---
    const boxes = this.config.answerBoxes;
    this.drawAnswerBox(ctx, boxes.left, this.currentQuestion.choices[0], 'left');
    this.drawAnswerBox(ctx, boxes.right, this.currentQuestion.choices[1], 'right');

    // --- Center divider ---
    ctx.setLineDash([8, 8]);
    ctx.strokeStyle = colors.divider;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(W / 2, 100);
    ctx.lineTo(W / 2, 300);
    ctx.stroke();
    ctx.setLineDash([]);

    // --- Instructions ---
    ctx.fillStyle = '#546e7a';
    ctx.font = '16px Outfit, sans-serif';
    ctx.textAlign = 'center';
    const isCameraMode = state.get('cameraActive');
    const instrText = isCameraMode
      ? '🏃 ยืนฝั่งซ้ายหรือขวา แล้วกระโดดแตะคำตอบ!'
      : '⌨️ กด ← หรือ → เลือกฝั่ง แล้วกด Enter ยืนยัน';
    ctx.fillText(instrText, W / 2, H - 25);

    // --- Keyboard selection indicator ---
    if (!isCameraMode && this.selectedSide && !this.answered) {
      const selBox = this.selectedSide === 'left' ? boxes.left : boxes.right;
      ctx.strokeStyle = '#ffd600';
      ctx.lineWidth = 5;
      ctx.setLineDash([]);
      const r = 14;
      this.roundRect(ctx, selBox.x - 5, selBox.y - 5, selBox.width + 10, selBox.height + 10, r);
      ctx.stroke();
    }

    // --- Feedback overlay ---
    if (this.answered && this.answerResult) {
      this.drawFeedback(ctx, W, H);
    }

    // --- Pose markers (debug) ---
    if (state.get('debugSkeleton')) {
      this.drawPoseMarkers(ctx);
    }
  }

  drawAnswerBox(ctx, box, choice, side) {
    const colors = this.config.colors;
    let bgColor = side === 'left' ? colors.boxLeft : colors.boxRight;
    let borderColor = 'rgba(255,255,255,0.6)';

    // Remove shift so visual matches collision exactly at the top
    const drawY = box.y;

    if (this.answered) {
      if (choice.correct) {
        bgColor = colors.boxCorrect;
      } else if (this.answerResult === 'wrong') {
        bgColor = colors.boxWrong;
      }
    }

    // Shadow
    ctx.shadowColor = 'rgba(0,0,0,0.15)';
    ctx.shadowBlur = 12;
    ctx.shadowOffsetY = 6;

    // Rounded rect background
    ctx.fillStyle = bgColor;
    const r = 20;
    this.roundRect(ctx, box.x, drawY, box.width, box.height, r);
    ctx.fill();

    // Reset shadow
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;

    // Border
    ctx.strokeStyle = borderColor;
    ctx.lineWidth = 4;
    this.roundRect(ctx, box.x, drawY, box.width, box.height, r);
    ctx.stroke();

    // Number
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 72px Outfit, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(String(choice.value), box.x + box.width / 2, drawY + box.height / 2);
    ctx.textBaseline = 'alphabetic';

    // Side label
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ctx.font = 'bold 14px Outfit, sans-serif';
    const label = side === 'left' ? '◀ ซ้าย' : 'ขวา ▶';
    ctx.fillText(label, box.x + box.width / 2, drawY + box.height + 22);
  }

  drawFeedback(ctx, W, H) {
    // Semi-transparent overlay
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.fillRect(0, 0, W, H);

    let text = '';
    let color = '';
    let emoji = '';

    switch (this.answerResult) {
      case 'correct':
        text = 'ถูกต้อง! เก่งมาก!';
        color = '#00c853';
        emoji = '🎉';
        break;
      case 'wrong':
        text = `คำตอบคือ ${this.currentQuestion.correctAnswer}`;
        color = '#ff1744';
        emoji = '💪';
        break;
      case 'timeout':
        text = 'หมดเวลา!';
        color = '#ff9100';
        emoji = '⏰';
        break;
    }

    // Feedback banner
    const bannerH = 80;
    const bannerY = H / 2 - bannerH / 2;
    ctx.fillStyle = color;
    ctx.fillRect(0, bannerY, W, bannerH);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 40px Outfit, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`${emoji} ${text}`, W / 2, bannerY + bannerH / 2 + 14);
  }

  drawPoseMarkers(ctx) {
    const markers = this.poseMarkers;
    const drawMarker = (m, color, label) => {
      if (!m || m.vis < 0.4) return;
      ctx.beginPath();
      ctx.arc(m.x, m.y, 10, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.fillStyle = '#fff';
      ctx.font = '10px Outfit, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(label, m.x, m.y - 15);
    };
    drawMarker(markers.nose, '#ff5252', 'nose');
    drawMarker(markers.leftWrist, '#448aff', 'L');
    drawMarker(markers.rightWrist, '#69f0ae', 'R');
  }

  roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }
}

export const mathJumpAnswerGame = new MathJumpAnswerGame();
