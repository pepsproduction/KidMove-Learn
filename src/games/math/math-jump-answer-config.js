export const MATH_JUMP_ANSWER_CONFIG = {
  canvasWidth: 800,
  canvasHeight: 500,

  defaultTimerSeconds: 10,
  minTimerSeconds: 10,
  maxTimerSeconds: 60,
  timerStepSeconds: 5,

  answerCooldownMs: 1200,
  questionTransitionMs: 3500, // Increased for TTS delay

  answerBoxes: {
    left: { x: 50, y: 100, width: 280, height: 160 },
    right: { x: 470, y: 100, width: 280, height: 160 }
  },

  // Colors
  colors: {
    bgGradientTop: '#e0f7fa',
    bgGradientBottom: '#b2ebf2',
    boxLeft: '#7c4dff',
    boxRight: '#ff6d00',
    boxCorrect: '#00c853',
    boxWrong: '#ff1744',
    boxDefault: '#ffffff',
    textDark: '#212529',
    textLight: '#ffffff',
    timerNormal: '#43a047',
    timerWarning: '#fb8c00',
    timerDanger: '#e53935',
    divider: '#90a4ae',
    header: '#01579b'
  },

  difficulty: {
    easy: {
      questionCount: 5,
      operations: ['+'],
      minNumber: 1,
      maxNumber: 5,
      maxAnswer: 5
    },
    normal: {
      questionCount: 10,
      operations: ['+', '-'],
      minNumber: 1,
      maxNumber: 10,
      maxAnswer: 10
    },
    hard: {
      questionCount: 15,
      operations: ['+', '-'],
      minNumber: 1,
      maxNumber: 10,
      maxAnswer: 12
    }
  }
};
