import { state } from './src/app/state.js';
import { thaiVowelBubbleGame } from './src/games/thai/thai-vowel-game.js';
import { THAI_VOWEL_CONFIG } from './src/games/thai/thai-vowel-config.js';

// Mock browser APIs
global.window = { speechSynthesis: { cancel: () => {}, speak: () => {} } };
global.document = { addEventListener: () => {} };
global.navigator = {};
global.performance = { now: () => 0 };
global.requestAnimationFrame = () => {};
global.setInterval = setInterval;
global.setTimeout = setTimeout;

// Mock audio context
global.AudioContext = class { constructor() {} };
global.webkitAudioContext = class { constructor() {} };

state.set({gameSettings: {level: 'normal'}});

try {
  thaiVowelBubbleGame.canvas = { width: 800, height: 500 };
  thaiVowelBubbleGame.config = THAI_VOWEL_CONFIG;
  thaiVowelBubbleGame.startQuestion();
  console.log("SUCCESS!", thaiVowelBubbleGame.currentQuestion);
} catch (e) {
  console.error("CAUGHT ERROR:", e);
}
