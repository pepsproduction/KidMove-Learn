import { LEVELS } from '../../app/constants.js';

export const FRUITS = [
  { id: 'apple', name: 'แอปเปิล', nameEn: 'apple', nameEnPlural: 'apples', emoji: '🍎', color: '#ff4d4d' },
  { id: 'banana', name: 'กล้วย', nameEn: 'banana', nameEnPlural: 'bananas', emoji: '🍌', color: '#ffe066' },
  { id: 'orange', name: 'ส้ม', nameEn: 'orange', nameEnPlural: 'oranges', emoji: '🍊', color: '#ffa94d' },
  { id: 'watermelon', name: 'แตงโม', nameEn: 'watermelon', nameEnPlural: 'watermelons', emoji: '🍉', color: '#51cf66' },
  { id: 'grape', name: 'องุ่น', nameEn: 'grape', nameEnPlural: 'grapes', emoji: '🍇', color: '#be4bdb' }
];

export function getTargetRangeForLevel(level) {
  switch (level) {
    case LEVELS.EASY:
      return { min: 1, max: 3 };
    case LEVELS.NORMAL:
      return { min: 1, max: 5 };
    case LEVELS.HARD:
    default:
      return { min: 1, max: 10 };
  }
}
