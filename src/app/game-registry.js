import { SUBJECTS, GAME_IDS } from './constants.js';
import { fruitCountGame } from '../games/math/fruit-count-game.js';
import { mathJumpAnswerGame } from '../games/math/math-jump-answer-game.js';
import { thaiLetterHomeGame } from '../games/thai/thai-letter-home-game.js';
import { thaiVowelBubbleGame } from '../games/thai/thai-vowel-game.js';

/**
 * Game Registry mapping subjects to their available games and default configuration.
 * 
 * HOW TO ADD A NEW GAME IN THE FUTURE:
 * 1. Create your game class (e.g. `EnglishWordCatchGame`) in `src/games/english/word-catch-game.js` that extends `BaseGame`.
 * 2. Export an instance of your game class.
 * 3. Import that instance in this file.
 * 4. Register the game under the appropriate SUBJECT key:
 *    ```js
 *    [SUBJECTS.ENGLISH]: {
 *      defaultGameId: GAME_IDS.WORD_CATCH,
 *      games: {
 *        [GAME_IDS.WORD_CATCH]: wordCatchGame
 *      }
 *    }
 *    ```
 */
export const gameRegistry = {
  [SUBJECTS.MATH]: {
    defaultGameId: GAME_IDS.FRUIT_COUNT,
    games: {
      [GAME_IDS.FRUIT_COUNT]: fruitCountGame,
      [GAME_IDS.MATH_JUMP_ANSWER]: mathJumpAnswerGame
    }
  },
  [SUBJECTS.THAI]: {
    defaultGameId: GAME_IDS.THAI_LETTER_HOME,
    games: {
      [GAME_IDS.THAI_LETTER_HOME]: thaiLetterHomeGame,
      [GAME_IDS.THAI_VOWEL_BUBBLE]: thaiVowelBubbleGame
    }
  },
  [SUBJECTS.ENGLISH]: {
    defaultGameId: 'word-catch', // Placeholder for future English game
    games: {
      // TODO: Add registered game classes here once implemented
    }
  }
};

/**
 * Returns the game instance for a given subject and game ID.
 * Falls back to the default game ID for the subject if not specified.
 * Returns null if the subject has no games or the gameId does not exist.
 * 
 * @param {string} subject 
 * @param {string} [gameId] 
 * @returns {object|null} The active game instance, or null
 */
export function getActiveGame(subject, gameId) {
  const subjectRegistry = gameRegistry[subject];
  if (!subjectRegistry) return null;

  const id = gameId || subjectRegistry.defaultGameId;
  const game = subjectRegistry.games[id];
  return game || null;
}

/**
 * Returns the default game ID for a given subject.
 * @param {string} subject 
 * @returns {string|null} The default game ID, or null
 */
export function getDefaultGameId(subject) {
  const subjectRegistry = gameRegistry[subject];
  return subjectRegistry ? subjectRegistry.defaultGameId : null;
}

/**
 * Checks if a game exists in the registry.
 * @param {string} subject 
 * @param {string} gameId 
 * @returns {boolean}
 */
export function hasGame(subject, gameId) {
  const subjectRegistry = gameRegistry[subject];
  if (!subjectRegistry) return false;
  return !!subjectRegistry.games[gameId];
}
