import { LEVELS } from '../../app/constants.js';
import { THAI_LETTER_HOME_CONFIG } from './thai-letter-home-config.js';

export const THAI_LETTER_ITEMS = [
  { letter: 'ก', word: 'ไก่', emoji: '🐔', group: 'easy' },
  { letter: 'ข', word: 'ไข่', emoji: '🥚', group: 'easy' },
  { letter: 'ฃ', word: 'ขวด', emoji: '🍾', group: 'hard' },
  { letter: 'ค', word: 'ควาย', emoji: '🐃', group: 'easy' },
  { letter: 'ฅ', word: 'คน', emoji: '🧑', group: 'hard' },
  { letter: 'ฆ', word: 'ระฆัง', emoji: '🔔', group: 'hard' },
  { letter: 'ง', word: 'งู', emoji: '🐍', group: 'easy' },
  { letter: 'จ', word: 'จาน', emoji: '🍽️', group: 'easy' },
  { letter: 'ฉ', word: 'ฉิ่ง', emoji: '', imageUrl: './assets/images/thai/ching.png', group: 'normal' },
  { letter: 'ช', word: 'ช้าง', emoji: '🐘', group: 'easy' },
  { letter: 'ซ', word: 'โซ่', emoji: '⛓️', group: 'normal' },
  { letter: 'ฌ', word: 'เฌอ', emoji: '🌳', group: 'hard' },
  { letter: 'ญ', word: 'หญิง', emoji: '👧', group: 'normal' },
  { letter: 'ฎ', word: 'ชฎา', emoji: '👑', group: 'hard' },
  { letter: 'ฏ', word: 'ปฏัก', emoji: '', imageUrl: './assets/images/thai/patak.png', group: 'hard' },
  { letter: 'ฐ', word: 'ฐาน', emoji: '', imageUrl: './assets/images/thai/than.png', group: 'hard' },
  { letter: 'ฑ', word: 'มณโฑ', emoji: '👸', group: 'hard' },
  { letter: 'ฒ', word: 'ผู้เฒ่า', emoji: '👴', group: 'hard' },
  { letter: 'ณ', word: 'เณร', emoji: '🦲', group: 'hard' },
  { letter: 'ด', word: 'เด็ก', emoji: '🧒', group: 'easy' },
  { letter: 'ต', word: 'เต่า', emoji: '🐢', group: 'easy' },
  { letter: 'ถ', word: 'ถุง', emoji: '🛍️', group: 'normal' },
  { letter: 'ท', word: 'ทหาร', emoji: '💂', group: 'normal' },
  { letter: 'ธ', word: 'ธง', emoji: '', imageUrl: './assets/images/thai/thong.png', group: 'normal' },
  { letter: 'น', word: 'หนู', emoji: '🐭', group: 'easy' },
  { letter: 'บ', word: 'ใบไม้', emoji: '🍃', group: 'easy' },
  { letter: 'ป', word: 'ปลา', emoji: '🐟', group: 'easy' },
  { letter: 'ผ', word: 'ผึ้ง', emoji: '🐝', group: 'normal' },
  { letter: 'ฝ', word: 'ฝา', emoji: '', imageUrl: './assets/images/thai/lid.png', group: 'normal' },
  { letter: 'พ', word: 'พาน', emoji: '', imageUrl: './assets/images/thai/phan.png', group: 'normal' },
  { letter: 'ฟ', word: 'ฟัน', emoji: '🦷', group: 'normal' },
  { letter: 'ภ', word: 'สำเภา', emoji: '', imageUrl: './assets/images/thai/junk.png', group: 'normal' },
  { letter: 'ม', word: 'ม้า', emoji: '🐴', group: 'easy' },
  { letter: 'ย', word: 'ยักษ์', emoji: '👹', group: 'normal' },
  { letter: 'ร', word: 'เรือ', emoji: '⛵', group: 'normal' },
  { letter: 'ล', word: 'ลิง', emoji: '🐒', group: 'normal' },
  { letter: 'ว', word: 'แหวน', emoji: '💍', group: 'normal' },
  { letter: 'ศ', word: 'ศาลา', emoji: '🏛️', group: 'hard' },
  { letter: 'ษ', word: 'ฤๅษี', emoji: '🧙‍♂️', group: 'hard' },
  { letter: 'ส', word: 'เสือ', emoji: '🐯', group: 'hard' },
  { letter: 'ห', word: 'หีบ', emoji: '', imageUrl: './assets/images/thai/chest.png', group: 'normal' },
  { letter: 'ฬ', word: 'จุฬา', emoji: '🪁', group: 'hard' },
  { letter: 'อ', word: 'อ่าง', emoji: '🛁', group: 'hard' },
  { letter: 'ฮ', word: 'นกฮูก', emoji: '🦉', group: 'hard' }
];

// Definition of difficulty pools
const EASY_LETTERS = ['ก', 'ข', 'ค', 'ง', 'จ', 'ช', 'ด', 'ต', 'น', 'บ', 'ป', 'ม'];
const NORMAL_LETTERS = ['ก', 'ข', 'ค', 'ง', 'จ', 'ฉ', 'ช', 'ซ', 'ญ', 'ด', 'ต', 'ถ', 'ท', 'ธ', 'น', 'บ', 'ป', 'ผ', 'ฝ', 'พ', 'ฟ', 'ภ', 'ม', 'ย', 'ร', 'ล', 'ว', 'ห'];
// Hard includes all 44 letters
const ALL_LETTERS = THAI_LETTER_ITEMS.map(i => i.letter);

/**
 * Returns the array of available letters for a given difficulty level.
 */
export function getThaiLetterItemsForLevel(level) {
  let allowedLetters;
  switch (level) {
    case LEVELS.EASY:
      allowedLetters = EASY_LETTERS;
      break;
    case LEVELS.NORMAL:
      allowedLetters = NORMAL_LETTERS;
      break;
    case LEVELS.HARD:
      allowedLetters = ALL_LETTERS;
      break;
    default:
      allowedLetters = EASY_LETTERS;
  }
  return THAI_LETTER_ITEMS.filter(item => allowedLetters.includes(item.letter));
}

/**
 * Returns the question count for a given difficulty level.
 */
export function getQuestionCountForThaiLevel(level) {
  switch (level) {
    case LEVELS.EASY: return THAI_LETTER_HOME_CONFIG.difficulty.easy.questionCount;
    case LEVELS.NORMAL: return THAI_LETTER_HOME_CONFIG.difficulty.normal.questionCount;
    case LEVELS.HARD: return THAI_LETTER_HOME_CONFIG.difficulty.hard.questionCount;
    default: return 5;
  }
}

// Logic for finding good distractors, especially for HARD mode
const SIMILAR_GROUPS = [
  ['ศ', 'ษ', 'ส'],
  ['ฎ', 'ฏ'],
  ['ฐ', 'ฑ', 'ฒ'],
  ['ถ', 'ท', 'ธ'],
  ['ร', 'ล', 'ฬ'],
  ['พ', 'ฟ', 'ภ'],
  ['บ', 'ป'],
  ['ผ', 'ฝ']
];

function getDistractor(correctLetter, pool, level) {
  // If Hard mode, try to find a similar looking distractor 50% of the time
  if (level === LEVELS.HARD && Math.random() < 0.5) {
    for (const group of SIMILAR_GROUPS) {
      if (group.includes(correctLetter)) {
        const others = group.filter(l => l !== correctLetter);
        if (others.length > 0) {
          // Verify distractor is in the pool (it should be for HARD)
          const chosen = others[Math.floor(Math.random() * others.length)];
          const distractorItem = pool.find(item => item.letter === chosen);
          if (distractorItem) return distractorItem;
        }
      }
    }
  }

  // Fallback: Pick any random letter from the pool that is NOT the correct letter
  const availableDistractors = pool.filter(item => item.letter !== correctLetter);
  if (availableDistractors.length === 0) {
    // Failsafe (should never happen with 12+ items)
    return THAI_LETTER_ITEMS.find(item => item.letter !== correctLetter) || THAI_LETTER_ITEMS[0];
  }
  return availableDistractors[Math.floor(Math.random() * availableDistractors.length)];
}

/**
 * Generates a single question for the Thai Letter Home game.
 * Uses a given pool to prevent generating the same question repeatedly if handled externally.
 */
export function generateThaiLetterQuestion(level, previousLetters = []) {
  const pool = getThaiLetterItemsForLevel(level);
  
  // Try to pick a letter we haven't picked recently
  let availableTargets = pool.filter(item => !previousLetters.includes(item.letter));
  if (availableTargets.length === 0) {
    availableTargets = pool; // Reset if we exhausted the pool
  }
  
  const targetItem = availableTargets[Math.floor(Math.random() * availableTargets.length)];
  const distractorItem = getDistractor(targetItem.letter, pool, level);

  const correctSide = Math.random() < 0.5 ? 'left' : 'right';
  const choices = correctSide === 'left'
    ? [
        { side: 'left', value: targetItem.letter, correct: true },
        { side: 'right', value: distractorItem.letter, correct: false }
      ]
    : [
        { side: 'left', value: distractorItem.letter, correct: false },
        { side: 'right', value: targetItem.letter, correct: true }
      ];

  return {
    emoji: targetItem.emoji,
    imageUrl: targetItem.imageUrl,
    word: targetItem.word,
    prompt: `${targetItem.word} อยู่บ้านตัวไหน?`,
    correctLetter: targetItem.letter,
    choices
  };
}
