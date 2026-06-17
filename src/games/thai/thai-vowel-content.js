export const THAI_VOWEL_ITEMS = [
  { vowel: '-ะ', name: 'สระอะ', text: 'สระ อะ', group: 'easy' },
  { vowel: '-า', name: 'สระอา', text: 'สระ อา', group: 'easy' },
  { vowel: '-ิ', name: 'สระอิ', text: 'สระ อิ', group: 'easy' },
  { vowel: '-ี', name: 'สระอี', text: 'สระ อี', group: 'easy' },
  { vowel: '-ึ', name: 'สระอึ', text: 'สระ อึ', group: 'normal' },
  { vowel: '-ื', name: 'สระอือ', text: 'สระ อือ', group: 'normal' },
  { vowel: '-ุ', name: 'สระอุ', text: 'สระ อุ', group: 'easy' },
  { vowel: '-ู', name: 'สระอู', text: 'สระ อู', group: 'easy' },
  { vowel: 'เ-', name: 'สระเอ', text: 'สระ เอ', group: 'easy' },
  { vowel: 'แ-', name: 'สระแอ', text: 'สระ แอ', group: 'easy' },
  { vowel: 'โ-', name: 'สระโอ', text: 'สระ โอ', group: 'easy' },
  { vowel: 'ใ-', name: 'สระใอ', text: 'สระ ใอ (ไม้ม้วน)', group: 'normal' },
  { vowel: 'ไ-', name: 'สระไอ', text: 'สระ ไอ (ไม้มลาย)', group: 'normal' },
  { vowel: 'เ-า', name: 'สระเอา', text: 'สระ เอา', group: 'normal' },
  { vowel: '-ำ', name: 'สระอำ', text: 'สระ อำ', group: 'normal' }
];

export function getThaiVowelItemsForLevel(level) {
  if (level === 'easy') return THAI_VOWEL_ITEMS.filter(item => item.group === 'easy');
  return THAI_VOWEL_ITEMS;
}

export function generateThaiVowelQuestion(level, previousVowels = []) {
  const numBubbles = 3;
  const pool = getThaiVowelItemsForLevel(level);
  
  // Pick target vowel
  let availableTargets = pool.filter(item => !previousVowels.includes(item.vowel));
  if (availableTargets.length === 0) availableTargets = pool;
  
  const targetItem = availableTargets[Math.floor(Math.random() * availableTargets.length)];
  
  // Pick distractors
  const distractors = [];
  const availableDistractors = pool.filter(item => item.vowel !== targetItem.vowel);
  
  // Shuffle distractors
  for (let i = availableDistractors.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [availableDistractors[i], availableDistractors[j]] = [availableDistractors[j], availableDistractors[i]];
  }
  
  for (let i = 0; i < numBubbles - 1; i++) {
    distractors.push(availableDistractors[i % availableDistractors.length]);
  }
  
  // Combine and shuffle choices
  const choices = [targetItem, ...distractors].map(item => ({
    vowel: item.vowel,
    correct: item.vowel === targetItem.vowel
  }));
  
  for (let i = choices.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [choices[i], choices[j]] = [choices[j], choices[i]];
  }
  
  return {
    targetName: targetItem.name,
    targetText: targetItem.text,
    prompt: `ตีฟองสบู่ ${targetItem.text}!`,
    choices
  };
}
