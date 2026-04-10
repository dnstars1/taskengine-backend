const { chat } = require('../utils/groq');

// Simple in-memory cache: { userId: { advice, expiresAt } }
const cache = new Map();
const CACHE_TTL_MS = 6 * 60 * 60 * 1000; // 6 hours

async function getStudyAdvice(req, res, next) {
  try {
    const userId = req.userId;
    const cached = cache.get(userId);
    if (cached && cached.expiresAt > Date.now()) {
      return res.json({ advice: cached.advice });
    }

    const prisma = req.app.get('prisma');
    const now = new Date();
    const weekEnd = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    // Aggregate this week's data
    const upcomingAssignments = await prisma.assignment.findMany({
      where: {
        userId,
        dueDate: { gte: now, lt: weekEnd },
      },
      include: { course: { select: { name: true } } },
      orderBy: { dueDate: 'asc' },
    });

    const deadlineCount = upcomingAssignments.length;

    // Find top module (most assignments due this week, breaking ties by difficulty)
    const moduleStats = {};
    for (const a of upcomingAssignments) {
      const name = a.course?.name || 'Unknown';
      if (!moduleStats[name]) {
        moduleStats[name] = { count: 0, totalDifficulty: 0 };
      }
      moduleStats[name].count++;
      moduleStats[name].totalDifficulty += a.difficulty || 3;
    }

    let topModule = null;
    let topScore = 0;
    for (const [name, stats] of Object.entries(moduleStats)) {
      const score = stats.count * 10 + stats.totalDifficulty;
      if (score > topScore) {
        topScore = score;
        topModule = name;
      }
    }

    const context = deadlineCount >= 4 ? 'very busy week'
      : deadlineCount >= 2 ? 'busy week'
      : deadlineCount === 1 ? 'manageable week'
      : 'quiet week';

    let prompt;
    if (deadlineCount === 0) {
      prompt = `You are a friendly student study coach. The student has a quiet week with no upcoming deadlines. Generate ONE short sentence (max 25 words) suggesting they use this time productively. Be encouraging but not preachy.`;
    } else {
      prompt = `You are a friendly student study coach. Generate ONE short sentence of advice (max 25 words) for a student with:
- ${deadlineCount} deadline${deadlineCount === 1 ? '' : 's'} this week
- Most demanding module: ${topModule}
- Context: ${context}

The advice should be actionable, encouraging, and mention the top module. Do not use quotes. Output only the sentence.`;
    }

    const advice = await chat(prompt);

    cache.set(userId, { advice, expiresAt: Date.now() + CACHE_TTL_MS });
    res.json({ advice });
  } catch (err) {
    // Fail silently — frontend hides the card if no advice
    res.status(503).json({ error: 'Could not generate advice', details: err.message });
  }
}

module.exports = { getStudyAdvice };
