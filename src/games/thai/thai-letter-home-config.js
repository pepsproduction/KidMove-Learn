export const THAI_LETTER_HOME_CONFIG = {
  canvasWidth: 800,
  canvasHeight: 500,

  defaultTimerSeconds: {
    easy: 10,
    normal: 15,
    hard: 20
  },

  minTimerSeconds: 10,
  maxTimerSeconds: 60,
  timerStepSeconds: 5,

  answerCooldownMs: 1200,
  questionTransitionMs: 5000, // Increased to allow TTS to finish speaking

  answerBoxes: {
    left: { x: 70, y: 120, width: 270, height: 160 },
    right: { x: 460, y: 120, width: 270, height: 160 }
  },

  // Colors
  colors: {
    bgGradientTop: '#fff8e1',
    bgGradientBottom: '#ffe082',
    boxLeft: '#4caf50',
    boxRight: '#2196f3',
    boxCorrect: '#00c853',
    boxWrong: '#ff1744',
    boxDefault: '#ffffff',
    textDark: '#3e2723',
    textLight: '#ffffff',
    timerNormal: '#fb8c00',
    timerWarning: '#f4511e',
    timerDanger: '#d32f2f',
    divider: '#bcaaa4',
    header: '#795548'
  },

  difficulty: {
    easy: {
      questionCount: 5,
      letterGroup: 'easy'
    },
    normal: {
      questionCount: 10,
      letterGroup: 'normal'
    },
    hard: {
      questionCount: 15,
      letterGroup: 'hard'
    }
  }
};
