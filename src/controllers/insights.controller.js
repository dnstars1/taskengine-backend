const { chat } = require('../utils/groq');

// Simple in-memory cache: { userId: { advice, expiresAt } }
const cache = new Map();
const CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes

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

    // Upcoming assignments in the next 7 days, ordered by deadline
    const upcomingAssignments = await prisma.assignment.findMany({
      where: {
        userId,
        dueDate: { gte: now, lt: weekEnd },
      },
      include: { course: { select: { name: true } } },
      orderBy: { dueDate: 'asc' },
    });

    const deadlineCount = upcomingAssignments.length;

    // Most urgent = nearest deadline
    const mostUrgent = upcomingAssignments.length > 0 ? upcomingAssignments[0] : null;
    const urgentModule = mostUrgent?.course?.name || null;
    const urgentDaysLeft = mostUrgent
      ? Math.max(0, Math.ceil((mostUrgent.dueDate - now) / (24 * 60 * 60 * 1000)))
      : null;

    const context = deadlineCount >= 4 ? 'very busy week'
      : deadlineCount >= 2 ? 'busy week'
      : deadlineCount === 1 ? 'manageable week'
      : 'quiet week';

    let prompt;
    if (deadlineCount === 0) {
      prompt = `You are a friendly student study coach. The student has a quiet week with no upcoming deadlines. Generate ONE short sentence (max 25 words) suggesting they use this time productively. Be encouraging but not preachy.`;
    } else {
      prompt = `You are a friendly student study coach. Generate ONE short sentence of advice (max 25 words) for a student with:
- ${deadlineCount} deadline${deadlineCount === 1 ? '' : 's'} in the next 7 days
- Most urgent: ${urgentModule} (due in ${urgentDaysLeft} day${urgentDaysLeft === 1 ? '' : 's'})
- Context: ${context}

The advice should be actionable, encouraging, and mention ${urgentModule}. Do not use quotes. Output only the sentence.`;
    }

    const advice = await chat(prompt);

    cache.set(userId, { advice, expiresAt: Date.now() + CACHE_TTL_MS });
    res.json({ advice });
  } catch (err) {
    res.status(503).json({ error: 'Could not generate advice', details: err.message });
  }
}

module.exports = { getStudyAdvice };
