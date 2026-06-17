export const THAI_VOWEL_CONFIG = {
  canvasWidth: 800,
  canvasHeight: 500,

  defaultTimerSeconds: 15,
  minTimerSeconds: 10,
  maxTimerSeconds: 60,
  timerStepSeconds: 5,

  // Bubble settings
  bubbleBaseRadius: 40,
  bubbleSpeedBaseY: 2.5,
  bubbleTargetY: 250, // They float up and stop here
  bubbleWobbleSpeed: 0.05,
  bubbleWobbleAmount: 20,
  bubbleEvasionSpeed: 1.5, // For hard mode evasion
  
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
      timePerQuestion: 15,
      speedMultiplier: 1.0,
      evasion: false
    },
    normal: {
      questionCount: 10,
      timePerQuestion: 10,
      speedMultiplier: 1.3,
      evasion: false
    },
    hard: {
      questionCount: 15,
      timePerQuestion: 7,
      speedMultiplier: 1.6,
      evasion: true // Bubbles move slightly to dodge hands
    }
  }
};
