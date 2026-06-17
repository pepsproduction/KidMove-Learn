import { state } from './state.js';
import { SCREENS } from './constants.js';

// Define the valid source -> target transitions
export const allowedTransitions = {
  [SCREENS.HOME]: [
    SCREENS.SUBJECT_SELECT
  ],
  [SCREENS.SUBJECT_SELECT]: [
    SCREENS.HOME,
    SCREENS.MATH_GAME_SELECT,
    SCREENS.THAI_GAME_SELECT,
    SCREENS.CALIBRATION,
    SCREENS.PREVIEW
  ],
  [SCREENS.MATH_GAME_SELECT]: [
    SCREENS.SUBJECT_SELECT,
    SCREENS.GAME_SETUP,
    SCREENS.CALIBRATION
  ],
  [SCREENS.THAI_GAME_SELECT]: [
    SCREENS.SUBJECT_SELECT,
    SCREENS.GAME_SETUP,
    SCREENS.CALIBRATION
  ],
  [SCREENS.GAME_SETUP]: [
    SCREENS.MATH_GAME_SELECT,
    SCREENS.THAI_GAME_SELECT,
    SCREENS.CALIBRATION
  ],
  [SCREENS.PREVIEW]: [
    SCREENS.SUBJECT_SELECT
  ],
  [SCREENS.CALIBRATION]: [
    SCREENS.SUBJECT_SELECT,
    SCREENS.MATH_GAME_SELECT,
    SCREENS.THAI_GAME_SELECT,
    SCREENS.GAME_SETUP,
    SCREENS.GAME_PLAY
  ],
  [SCREENS.GAME_PLAY]: [
    SCREENS.RESULTS,
    SCREENS.SUBJECT_SELECT,
    SCREENS.CALIBRATION
  ],
  [SCREENS.RESULTS]: [
    SCREENS.CALIBRATION,
    SCREENS.GAME_SETUP,
    SCREENS.HOME
  ]
};

/**
 * Checks if a transition from one screen to another is allowed.
 * @param {string} from 
 * @param {string} to 
 * @returns {boolean}
 */
export function canTransition(from, to) {
  const targets = allowedTransitions[from];
  if (!targets) return false;
  return targets.includes(to);
}

/**
 * Navigates safely to the next screen.
 * @param {string} nextScreen 
 * @returns {boolean} Whether navigation succeeded
 */
export function navigateTo(nextScreen) {
  const currentScreen = state.get('currentScreen');
  
  // Guard: if same screen, do nothing
  if (currentScreen === nextScreen) return true;

  if (canTransition(currentScreen, nextScreen)) {
    state.set({ currentScreen: nextScreen });
    return true;
  } else {
    console.warn(`[ScreenMachine] Invalid screen transition: from "${currentScreen}" to "${nextScreen}"`);
    return false;
  }
}
