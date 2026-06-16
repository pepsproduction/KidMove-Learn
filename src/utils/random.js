export function randomRange(min, max) {
  return Math.random() * (max - min) + min;
}

export function randomIntRange(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function randomChoice(array) {
  return array[Math.floor(Math.random() * array.length)];
}

export function shuffleArray(array) {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}
