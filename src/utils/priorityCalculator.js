/**
 * Risk Score = (weight / daysRemaining) * (difficulty / 3)
 * If daysRemaining <= 2, auto-high priority (clamped to 100).
 */
function calculatePriority(weight, difficulty, dueDate) {
  const now = new Date();
  const msPerDay = 24 * 60 * 60 * 1000;
  const daysRemaining = Math.max((new Date(dueDate) - now) / msPerDay, 0.1);

  if (daysRemaining <= 2) {
    return 100;
  }

  const score = (weight / daysRemaining) * (difficulty / 3);
  return Math.round(score * 100) / 100;
}

module.exports = { calculatePriority };
