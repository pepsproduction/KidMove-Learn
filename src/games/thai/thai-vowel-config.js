export const THAI_VOWEL_CONFIG = {
  canvasWidth: 800,
  canvasHeight: 500,

  defaultTimerSeconds: 15,
  minTimerSeconds: 10,
  maxTimerSeconds: 60,
  timerStepSeconds: 5,

  // Bubble settings
  bubbleBaseRadius: 40,
  bubbleSpeedBaseY: 1.5,
  bubbleSpeedMaxY: 3.5,
  bubbleWobbleSpeed: 0.05,
  bubbleWobbleAmount: 20,
  
  questionTransitionMs: 4000,

  // Colors
  colors: {
    bgGradientTop: '#e1f5fe',
    bgGradientBottom: '#81d4fa',
    bubbleOutline: '#ffffff',
    bubbleFill: 'rgba(255, 255, 255, 0.4)',
    bubbleHighlight: 'rgba(255, 255, 255, 0.8)',
    textDark: '#01579b',
    timerNormal: '#0288d1',
    timerWarning: '#f57c00',
    timerDanger: '#d32f2f',
    header: '#0277bd'
  },

  difficulty: {
    easy: {
      questionCount: 5,
      bubbleCountPerWave: 2,
      speedMultiplier: 1.0
    },
    normal: {
      questionCount: 10,
      bubbleCountPerWave: 3,
      speedMultiplier: 1.3
    },
    hard: {
      questionCount: 15,
      bubbleCountPerWave: 4,
      speedMultiplier: 1.6
    }
  }
};
