/**
 * Priority Score = (difficulty * 20) / daysRemaining
 * difficulty is 1-5, so difficulty*20 gives a 20-100 base.
 * If daysRemaining <= 2, auto-high priority (clamped to 100).
 */
function calculatePriority(difficulty, dueDate) {
  const now = new Date();
  const msPerDay = 24 * 60 * 60 * 1000;
  const daysRemaining = Math.max((new Date(dueDate) - now) / msPerDay, 0.1);

  if (daysRemaining <= 2) {
    return 100;
  }

  const score = (difficulty * 20) / daysRemaining;
  return Math.min(Math.round(score * 100) / 100, 100);
}

module.exports = { calculatePriority };
