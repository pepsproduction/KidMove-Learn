import { LEVELS } from '../../app/constants.js';
import { MATH_JUMP_ANSWER_CONFIG } from './math-jump-answer-config.js';

const THAI_NUMBERS = ['ศูนย์','หนึ่ง','สอง','สาม','สี่','ห้า','หก','เจ็ด','แปด','เก้า','สิบ','สิบเอ็ด','สิบสอง'];

/**
 * Converts a number (0-12) to Thai text.
 */
export function numberToThai(n) {
  return THAI_NUMBERS[n] || String(n);
}

/**
 * Converts an operation symbol to Thai text.
 */
export function operationToThai(op) {
  return op === '+' ? 'บวก' : 'ลบ';
}

/**
 * Returns the question count for a given difficulty level.
 */
export function getQuestionCountForLevel(level) {
  switch (level) {
    case LEVELS.EASY: return MATH_JUMP_ANSWER_CONFIG.difficulty.easy.questionCount;
    case LEVELS.NORMAL: return MATH_JUMP_ANSWER_CONFIG.difficulty.normal.questionCount;
    case LEVELS.HARD: return MATH_JUMP_ANSWER_CONFIG.difficulty.hard.questionCount;
    default: return 5;
  }
}

/**
 * Generates a single math question for the Jump Answer game.
 * Returns an object with text, operands, operation, correct answer, and two choices (left/right).
 */
export function generateMathJumpQuestion(level) {
  let config;
  switch (level) {
    case LEVELS.EASY: config = MATH_JUMP_ANSWER_CONFIG.difficulty.easy; break;
    case LEVELS.NORMAL: config = MATH_JUMP_ANSWER_CONFIG.difficulty.normal; break;
    case LEVELS.HARD: config = MATH_JUMP_ANSWER_CONFIG.difficulty.hard; break;
    default: config = MATH_JUMP_ANSWER_CONFIG.difficulty.easy;
  }

  const operation = config.operations[Math.floor(Math.random() * config.operations.length)];
  let a, b, correctAnswer;

  if (operation === '+') {
    // Ensure a + b <= maxAnswer
    a = Math.floor(Math.random() * config.maxNumber) + config.minNumber;
    const maxB = Math.min(config.maxNumber, config.maxAnswer - a);
    if (maxB < config.minNumber) {
      // Fallback: just make a simpler question
      a = 1;
      b = 1;
    } else {
      b = Math.floor(Math.random() * (maxB - config.minNumber + 1)) + config.minNumber;
    }
    correctAnswer = a + b;
  } else {
    // Subtraction: ensure a >= b so result is not negative
    a = Math.floor(Math.random() * config.maxNumber) + config.minNumber;
    const maxB = Math.min(a, config.maxNumber);
    b = Math.floor(Math.random() * maxB) + 1;
    correctAnswer = a - b;
  }

  // Generate a wrong answer that is close but different and non-negative
  let wrongAnswer;
  const offsets = [-2, -1, 1, 2];
  const shuffledOffsets = offsets.sort(() => Math.random() - 0.5);
  for (const offset of shuffledOffsets) {
    const candidate = correctAnswer + offset;
    if (candidate >= 0 && candidate !== correctAnswer && candidate <= config.maxAnswer + 2) {
      wrongAnswer = candidate;
      break;
    }
  }
  // Final fallback
  if (wrongAnswer === undefined) {
    wrongAnswer = correctAnswer === 0 ? 1 : correctAnswer - 1;
    if (wrongAnswer < 0) wrongAnswer = correctAnswer + 1;
  }

  // Randomly assign correct answer to left or right
  const correctSide = Math.random() < 0.5 ? 'left' : 'right';
  const choices = correctSide === 'left'
    ? [
        { side: 'left', value: correctAnswer, correct: true },
        { side: 'right', value: wrongAnswer, correct: false }
      ]
    : [
        { side: 'left', value: wrongAnswer, correct: false },
        { side: 'right', value: correctAnswer, correct: true }
      ];

  return {
    text: `${a} ${operation} ${b} = ?`,
    a,
    b,
    operation,
    correctAnswer,
    choices
  };
}
