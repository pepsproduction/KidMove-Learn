import { LEVELS } from '../../app/constants.js';

export const FRUITS = [
  { id: 'apple', name: 'แอปเปิล', emoji: '🍎', color: '#ff4d4d' },
  { id: 'banana', name: 'กล้วย', emoji: '🍌', color: '#ffe066' },
  { id: 'orange', name: 'ส้ม', emoji: '🍊', color: '#ffa94d' },
  { id: 'watermelon', name: 'แตงโม', emoji: '🍉', color: '#51cf66' },
  { id: 'grape', name: 'องุ่น', emoji: '🍇', color: '#be4bdb' }
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
