export const MATH_GAME_CONFIG = {
  // Screen sizes and ratios are controlled, but these are canvas coordinate bounds
  canvasWidth: 800,
  canvasHeight: 500,

  // Basket configurations
  basketWidth: 140,
  basketHeight: 80,
  basketSpeed: 12,
  basketSmoothFactor: 0.15, // for leaning motion easing

  // Falling fruits
  fruitRadius: 35,
  baseFallSpeed: 2.2,
  fallSpeedVariance: 0.8,
  spawnIntervalMs: 1800,

  // Scoring and Game Mechanics
  questionsPerSession: 5,
  collectionDistance: 70 // distance in pixels between basket center and fruit center to enable picking
};
